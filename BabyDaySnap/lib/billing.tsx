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
import { Alert, AppState } from "react-native";
import Constants from "expo-constants";

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
};

const BillingContext = createContext<BillingContextValue>({
    productsById: {},
    isReady: false,
    isPurchasing: false,
    purchaseAdFree: async () => false,
    purchaseSeasonPack: async () => false,
    restorePurchases: async () => undefined,
});

function debugLog(...args: unknown[]) {
    if (__DEV__) {
        console.log("[billing]", ...args);
    }
}

function debugWarn(...args: unknown[]) {
    if (__DEV__) {
        console.warn("[billing]", ...args);
    }
}

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

function applyPurchasesToState(
    dispatch: ReturnType<typeof useAppDispatch>,
    purchases: any[],
) {
    const purchasedProductIds = new Set(
        (Array.isArray(purchases) ? purchases : []).map((purchase) => purchase?.productId ?? purchase?.id).filter(Boolean),
    );

    dispatch({ type: "SET_AD_FREE_UNLOCKED", payload: purchasedProductIds.has(AD_FREE_PRODUCT_ID) });
    dispatch({
        type: "SET_UNLOCKED_SEASON_PACK_IDS",
        payload: SEASON_PACKS
            .filter((pack) => purchasedProductIds.has(pack.productId))
            .map((pack) => pack.id),
    });
}

async function loadStoreProducts(iap: ExpoIapModuleLike, productIds: string[]) {
    if (!iap.fetchProducts && !iap.getProducts) {
        debugWarn("product loading is unavailable", {
            hasFetchProducts: Boolean(iap.fetchProducts),
            hasGetProducts: Boolean(iap.getProducts),
        });
        return [];
    }

    const attempts: Array<{ label: string; run: () => Promise<any[] | undefined> }> = [
        { label: "fetchProducts({ skus, type: in-app })", run: () => iap.fetchProducts?.({ skus: productIds, type: "in-app" }) },
        { label: "getProducts({ skus, type: inapp })", run: () => iap.getProducts?.({ skus: productIds, type: "inapp" }) },
        { label: "getProducts(productIds)", run: () => iap.getProducts?.(productIds) },
        { label: "getProducts({ productIds, type: inapp })", run: () => iap.getProducts?.({ productIds, type: "inapp" }) },
    ];

    for (const attempt of attempts) {
        try {
            debugLog("trying product fetch", {
                method: attempt.label,
                productIds,
            });
            const products = await attempt.run();

            if (Array.isArray(products)) {
                debugLog("product fetch returned", {
                    method: attempt.label,
                    count: products.length,
                    products: products.map((product) => ({
                        id: product?.id ?? product?.productId ?? null,
                        displayPrice: product?.displayPrice ?? product?.localizedPrice ?? null,
                        title: product?.displayName ?? product?.title ?? null,
                    })),
                });
            } else {
                debugWarn("product fetch returned non-array", {
                    method: attempt.label,
                    resultType: products === undefined ? "undefined" : typeof products,
                    result: products ?? null,
                });
            }

            if (Array.isArray(products)) {
                return products;
            }
        } catch (error: any) {
            debugWarn("product fetch failed", {
                method: attempt.label,
                message: error?.message ?? String(error),
                code: error?.code ?? null,
                domain: error?.domain ?? null,
                nativeStackIOS: error?.nativeStackIOS ?? null,
            });
        }
    }

    debugWarn("no store products were returned", { productIds });

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
    return iap.requestPurchase(requestPayload);
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

async function syncAvailablePurchases(
    iap: ExpoIapModuleLike,
    dispatch: ReturnType<typeof useAppDispatch>,
    options?: { reason?: string; showSuccessAlert?: boolean },
) {
    if (!iap.getAvailablePurchases) {
        debugWarn("available purchases sync unavailable", { reason: options?.reason ?? "unknown" });
        return;
    }

    const purchases = await iap.getAvailablePurchases({
        alsoPublishToEventListenerIOS: false,
        onlyIncludeActiveItemsIOS: true,
    });

    const normalizedPurchases = Array.isArray(purchases) ? purchases : [];
    debugLog("available purchases synced", {
        reason: options?.reason ?? "unknown",
        count: normalizedPurchases.length,
        productIds: normalizedPurchases.map((purchase) => purchase?.productId ?? purchase?.id ?? null),
    });

    applyPurchasesToState(dispatch, normalizedPurchases);

    if (options?.showSuccessAlert) {
        Alert.alert(i18n.t("monetization.restoreTitle"), i18n.t("monetization.restoreSuccess"));
    }
}

function BillingBootstrap({ children }: { children: ReactNode }) {
    const dispatch = useAppDispatch();
    const [productsById, setProductsById] = useState<Record<string, BillingProduct>>({});
    const [isReady, setIsReady] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const iapModuleRef = useRef<ExpoIapModuleLike | null>(null);

    useEffect(() => {
        let disposed = false;

        async function setupBilling() {
            try {
                const iap = (await import("expo-iap")) as ExpoIapModuleLike;
                iapModuleRef.current = iap;

                debugLog("setup start", {
                    expectedProductIds: [
                        AD_FREE_PRODUCT_ID,
                        ...SEASON_PACKS.map((pack) => pack.productId),
                    ],
                    bundleIdentifier: Constants.expoConfig?.ios?.bundleIdentifier,
                    hasInitConnection: Boolean(iap.initConnection),
                    hasFetchProducts: Boolean(iap.fetchProducts),
                    hasGetProducts: Boolean(iap.getProducts),
                    hasRequestPurchase: Boolean(iap.requestPurchase),
                    hasAvailablePurchases: Boolean(iap.getAvailablePurchases),
                });

                if (iap.initConnection) {
                    await iap.initConnection();
                    debugLog("initConnection succeeded");
                } else {
                    debugWarn("initConnection is unavailable");
                }

                const productIds = [AD_FREE_PRODUCT_ID, ...SEASON_PACKS.map((pack) => pack.productId)];
                const products = await loadStoreProducts(iap, productIds);

                if (!disposed) {
                    const mappedProducts = mapProducts(products);
                    debugLog("setting products", {
                        loadedProductIds: Object.keys(mappedProducts),
                        isReady: true,
                    });
                    setProductsById(mappedProducts);
                    setIsReady(true);
                    await syncAvailablePurchases(iap, dispatch, { reason: "initial-load" }).catch((error: any) => {
                        debugWarn("available purchases sync failed", {
                            reason: "initial-load",
                            message: error?.message ?? String(error),
                            code: error?.code ?? null,
                            domain: error?.domain ?? null,
                        });
                    });
                }
            } catch (error: any) {
                debugWarn("setup failed", {
                    message: error?.message ?? String(error),
                    code: error?.code ?? null,
                    domain: error?.domain ?? null,
                    nativeStackIOS: error?.nativeStackIOS ?? null,
                });
                if (!disposed) {
                    setIsReady(false);
                }
            }
        }

        setupBilling().catch(() => undefined);

        const appStateSubscription = AppState.addEventListener("change", (nextState) => {
            if (nextState !== "active" || !iapModuleRef.current) {
                return;
            }

            syncAvailablePurchases(iapModuleRef.current, dispatch, { reason: "app-active" }).catch((error: any) => {
                debugWarn("available purchases sync failed", {
                    reason: "app-active",
                    message: error?.message ?? String(error),
                    code: error?.code ?? null,
                    domain: error?.domain ?? null,
                });
            });
        });

        return () => {
            disposed = true;
            appStateSubscription.remove();
            iapModuleRef.current?.endConnection?.().catch?.(() => undefined);
        };
    }, [dispatch]);

    const handlePurchase = useCallback(async (productId: string) => {
        const iap = iapModuleRef.current;
        debugLog("purchase requested", {
            productId,
            isReady,
            availableProductIds: Object.keys(productsById),
            hasIapModule: Boolean(iap),
        });

        if (!iap) {
            Alert.alert(i18n.t("common.error"), i18n.t("monetization.billingUnavailable"));
            return false;
        }

        if (!productsById[productId]) {
            Alert.alert(
                i18n.t("common.error"),
                `Store product not loaded yet: ${productId}`,
            );
            return false;
        }

        setIsPurchasing(true);

        try {
            const purchaseResult = await requestInAppPurchase(iap, productId);
            const purchase = Array.isArray(purchaseResult) ? purchaseResult[0] : purchaseResult;

            debugLog("requestPurchase dispatched", {
                productId,
                returnedProductId: purchase?.productId ?? purchase?.id ?? null,
                returnedType: Array.isArray(purchaseResult) ? "array" : typeof purchaseResult,
            });

            if (purchase) {
                unlockPurchase(dispatch, purchase);
                await finishInAppPurchase(iap, purchase);
            }

            setIsPurchasing(false);
            return true;
        } catch (error: any) {
            setIsPurchasing(false);
            debugWarn("requestPurchase failed", {
                productId,
                message: error?.message ?? String(error),
                code: error?.code ?? null,
                domain: error?.domain ?? null,
                nativeStackIOS: error?.nativeStackIOS ?? null,
            });

            if (error?.code !== "user-cancelled" && error?.code !== "E_USER_CANCELLED") {
                Alert.alert(
                    i18n.t("common.error"),
                    i18n.t("monetization.purchaseFailed", { message: error?.message ?? "Unknown error" }),
                );
            }

            return false;
        }
    }, [isReady, productsById, dispatch]);

    const handleRestore = useCallback(async () => {
        const iap = iapModuleRef.current;

        if (!iap?.getAvailablePurchases) {
            Alert.alert(i18n.t("common.error"), i18n.t("monetization.billingUnavailable"));
            return;
        }

        try {
            await syncAvailablePurchases(iap, dispatch, {
                reason: "manual-restore",
                showSuccessAlert: true,
            });
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
