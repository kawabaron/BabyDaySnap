import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { Alert } from "react-native";

import { useAppDispatch } from "@/context/AppContext";
import i18n from "@/lib/i18n";
import { AD_FREE_PRODUCT_ID, SEASON_PACKS, getSeasonPackById } from "@/lib/monetization";
import type { SeasonPackId } from "@/types";

type BillingProduct = {
    id: string;
    displayName?: string;
    description?: string;
    displayPrice?: string;
};

type BillingContextValue = {
    productsById: Record<string, BillingProduct>;
    isReady: boolean;
    isPurchasing: boolean;
    purchaseAdFree: () => Promise<boolean>;
    purchaseSeasonPack: (packId: SeasonPackId) => Promise<boolean>;
    restorePurchases: () => Promise<void>;
};

type ExpoIapModuleLike = {
    initConnection?: () => Promise<unknown>;
    endConnection?: () => Promise<unknown>;
    fetchProducts?: (...args: any[]) => Promise<any[]>;
    getProducts?: (...args: any[]) => Promise<any[]>;
    getAvailablePurchases?: (...args: any[]) => Promise<any[]>;
    requestPurchase?: (...args: any[]) => Promise<unknown>;
    finishTransaction?: (...args: any[]) => Promise<unknown>;
    purchaseUpdatedListener?: (listener: (purchase: any) => void | Promise<void>) => { remove?: () => void };
    purchaseErrorListener?: (listener: (error: any) => void) => { remove?: () => void };
};

const BillingContext = createContext<BillingContextValue>({
    productsById: {},
    isReady: false,
    isPurchasing: false,
    purchaseAdFree: async () => false,
    purchaseSeasonPack: async () => false,
    restorePurchases: async () => undefined,
});

function mapProducts(products: any[]): Record<string, BillingProduct> {
    return Object.fromEntries(
        (products ?? []).map((product) => [
            product.id ?? product.productId,
            {
                id: product.id ?? product.productId,
                displayName: product.displayName ?? product.title,
                description: product.description,
                displayPrice: product.displayPrice ?? product.localizedPrice,
            },
        ]),
    );
}

function unlockPurchase(dispatch: ReturnType<typeof useAppDispatch>, purchase: any) {
    const productId = purchase?.productId ?? purchase?.id;

    if (productId === AD_FREE_PRODUCT_ID) {
        dispatch({ type: "SET_AD_FREE_UNLOCKED", payload: true });
    }

    const matchedPack = SEASON_PACKS.find((pack) => pack.productId === productId);
    if (matchedPack) {
        dispatch({ type: "UNLOCK_SEASON_PACK", payload: matchedPack.id });
    }
}

async function loadStoreProducts(iap: ExpoIapModuleLike, productIds: string[]) {
    if (!iap.fetchProducts && !iap.getProducts) {
        return [];
    }

    const attempts = [
        () => iap.fetchProducts?.({ skus: productIds, type: "in-app" }),
        () => iap.getProducts?.({ skus: productIds, type: "inapp" }),
        () => iap.getProducts?.(productIds),
        () => iap.getProducts?.({ productIds, type: "inapp" }),
    ];

    for (const attempt of attempts) {
        try {
            const products = await attempt();
            if (Array.isArray(products)) {
                return products;
            }
        } catch {
        }
    }

    return [];
}

async function requestInAppPurchase(iap: ExpoIapModuleLike, productId: string) {
    if (!iap.requestPurchase) {
        throw new Error("requestPurchase is unavailable");
    }

    const requestPayload = {
        request: {
            apple: {
                sku: productId,
                quantity: 1,
            },
            google: {
                skus: [productId],
            },
        },
        type: "in-app",
    };
    await iap.requestPurchase(requestPayload);
}

async function finishInAppPurchase(iap: ExpoIapModuleLike, purchase: any) {
    if (!iap.finishTransaction) {
        return;
    }

    const attempts = [
        () => iap.finishTransaction?.({ purchase, isConsumable: false }),
        () => iap.finishTransaction?.(purchase, false),
    ];

    for (const attempt of attempts) {
        try {
            await attempt();
            return;
        } catch {
        }
    }
}

function BillingBootstrap({ children }: { children: ReactNode }) {
    const dispatch = useAppDispatch();
    const [productsById, setProductsById] = useState<Record<string, BillingProduct>>({});
    const [isReady, setIsReady] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const iapModuleRef = useRef<ExpoIapModuleLike | null>(null);
    const purchaseUpdatedSubscriptionRef = useRef<{ remove?: () => void } | null>(null);
    const purchaseErrorSubscriptionRef = useRef<{ remove?: () => void } | null>(null);

    useEffect(() => {
        let disposed = false;

        async function setupBilling() {
            try {
                const iap = (await import("expo-iap")) as ExpoIapModuleLike;
                iapModuleRef.current = iap;

                if (iap.initConnection) {
                    await iap.initConnection();
                }

                purchaseUpdatedSubscriptionRef.current = iap.purchaseUpdatedListener?.(async (purchase: any) => {
                    unlockPurchase(dispatch, purchase);
                    await finishInAppPurchase(iap, purchase);
                    setIsPurchasing(false);
                }) ?? null;

                purchaseErrorSubscriptionRef.current = iap.purchaseErrorListener?.((error: any) => {
                    setIsPurchasing(false);

                    if (error?.code === "user-cancelled" || error?.code === "E_USER_CANCELLED") {
                        return;
                    }

                    Alert.alert(
                        i18n.t("common.error"),
                        i18n.t("monetization.purchaseFailed", { message: error?.message ?? "Unknown error" }),
                    );
                }) ?? null;

                const productIds = [AD_FREE_PRODUCT_ID, ...SEASON_PACKS.map((pack) => pack.productId)];
                const products = await loadStoreProducts(iap, productIds);

                if (!disposed) {
                    setProductsById(mapProducts(products));
                    setIsReady(true);
                }
            } catch {
                if (!disposed) {
                    setIsReady(false);
                }
            }
        }

        setupBilling().catch(() => undefined);

        return () => {
            disposed = true;
            purchaseUpdatedSubscriptionRef.current?.remove?.();
            purchaseErrorSubscriptionRef.current?.remove?.();
            purchaseUpdatedSubscriptionRef.current = null;
            purchaseErrorSubscriptionRef.current = null;
            iapModuleRef.current?.endConnection?.().catch?.(() => undefined);
        };
    }, [dispatch]);

    const handlePurchase = useCallback(async (productId: string) => {
        const iap = iapModuleRef.current;

        if (!iap) {
            Alert.alert(i18n.t("common.error"), i18n.t("monetization.billingUnavailable"));
            return false;
        }

        setIsPurchasing(true);

        try {
            await requestInAppPurchase(iap, productId);
            return true;
        } catch (error: any) {
            setIsPurchasing(false);

            if (error?.code !== "user-cancelled" && error?.code !== "E_USER_CANCELLED") {
                Alert.alert(
                    i18n.t("common.error"),
                    i18n.t("monetization.purchaseFailed", { message: error?.message ?? "Unknown error" }),
                );
            }

            return false;
        }
    }, []);

    const handleRestore = useCallback(async () => {
        const iap = iapModuleRef.current;

        if (!iap?.getAvailablePurchases) {
            Alert.alert(i18n.t("common.error"), i18n.t("monetization.billingUnavailable"));
            return;
        }

        try {
            const purchases = await iap.getAvailablePurchases();

            (Array.isArray(purchases) ? purchases : []).forEach((purchase) => {
                unlockPurchase(dispatch, purchase);
            });

            Alert.alert(i18n.t("monetization.restoreTitle"), i18n.t("monetization.restoreSuccess"));
        } catch (error: any) {
            Alert.alert(
                i18n.t("common.error"),
                i18n.t("monetization.restoreFailed", { message: error?.message ?? "Unknown error" }),
            );
        }
    }, [dispatch]);

    const value = useMemo<BillingContextValue>(
        () => ({
            productsById,
            isReady,
            isPurchasing,
            purchaseAdFree: () => handlePurchase(AD_FREE_PRODUCT_ID),
            purchaseSeasonPack: async (packId: SeasonPackId) => {
                const pack = getSeasonPackById(packId);
                if (!pack) {
                    return false;
                }

                return handlePurchase(pack.productId);
            },
            restorePurchases: handleRestore,
        }),
        [handlePurchase, handleRestore, isPurchasing, isReady, productsById],
    );

    return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function BillingProvider({ children }: { children: ReactNode }) {
    return <BillingBootstrap>{children}</BillingBootstrap>;
}

export function useBilling() {
    return useContext(BillingContext);
}
