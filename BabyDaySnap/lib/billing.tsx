import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Alert, Platform } from "react-native";
import { useIAP } from "expo-iap";

import { useAppDispatch } from "@/context/AppContext";
import i18n from "@/lib/i18n";
import {
    AD_FREE_PRODUCT_ID,
    SEASON_PACKS,
    getSeasonPackById,
} from "@/lib/monetization";
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

const BillingContext = createContext<BillingContextValue>({
    productsById: {},
    isReady: false,
    isPurchasing: false,
    purchaseAdFree: async () => false,
    purchaseSeasonPack: async () => false,
    restorePurchases: async () => undefined,
});

function purchaseRequestFor(productId: string) {
    return {
        request: Platform.select({
            ios: { sku: productId },
            android: { skus: [productId] },
            default: { sku: productId },
        }),
        type: "inapp",
    };
}

function BillingBootstrap({ children }: { children: ReactNode }) {
    const dispatch = useAppDispatch();
    const [isPurchasing, setIsPurchasing] = useState(false);

    const {
        connected,
        products,
        requestProducts,
        requestPurchase,
        restorePurchases,
        finishTransaction,
    } = useIAP({
        onPurchaseSuccess: async (purchase: any) => {
            const productId = purchase?.productId ?? purchase?.id;

            if (productId === AD_FREE_PRODUCT_ID) {
                dispatch({ type: "SET_AD_FREE_UNLOCKED", payload: true });
            }

            const matchedPack = SEASON_PACKS.find((pack) => pack.productId === productId);
            if (matchedPack) {
                dispatch({ type: "UNLOCK_SEASON_PACK", payload: matchedPack.id });
            }

            if (finishTransaction) {
                await (finishTransaction as any)({ purchase, isConsumable: false });
            }

            setIsPurchasing(false);
        },
        onPurchaseError: (error: any) => {
            setIsPurchasing(false);

            if (error?.code === "user-cancelled") {
                return;
            }

            Alert.alert(
                i18n.t("common.error"),
                i18n.t("monetization.purchaseFailed", { message: error?.message ?? "Unknown error" }),
            );
        },
    } as any);

    useEffect(() => {
        if (!connected || !requestProducts) {
            return;
        }

        const productIds = [AD_FREE_PRODUCT_ID, ...SEASON_PACKS.map((pack) => pack.productId)];
        (requestProducts as any)({ skus: productIds, type: "inapp" }).catch(() => undefined);
    }, [connected, requestProducts]);

    const productsById = useMemo<Record<string, BillingProduct>>(
        () =>
            Object.fromEntries(
                (products ?? []).map((product: any) => [
                    product.id ?? product.productId,
                    {
                        id: product.id ?? product.productId,
                        displayName: product.displayName ?? product.title,
                        description: product.description,
                        displayPrice: product.displayPrice ?? product.localizedPrice,
                    },
                ]),
            ),
        [products],
    );

    const handlePurchase = async (productId: string) => {
        if (!connected || !requestPurchase) {
            Alert.alert(i18n.t("common.error"), i18n.t("monetization.billingUnavailable"));
            return false;
        }

        setIsPurchasing(true);

        try {
            await (requestPurchase as any)(purchaseRequestFor(productId));
            return true;
        } catch (error: any) {
            setIsPurchasing(false);
            if (error?.code !== "user-cancelled") {
                Alert.alert(
                    i18n.t("common.error"),
                    i18n.t("monetization.purchaseFailed", { message: error?.message ?? "Unknown error" }),
                );
            }
            return false;
        }
    };

    const handleRestore = async () => {
        if (!restorePurchases) {
            Alert.alert(i18n.t("common.error"), i18n.t("monetization.billingUnavailable"));
            return;
        }

        try {
            const restored = await (restorePurchases as any)();
            const purchases = Array.isArray(restored) ? restored : [];

            purchases.forEach((purchase: any) => {
                const productId = purchase?.productId ?? purchase?.id;
                if (productId === AD_FREE_PRODUCT_ID) {
                    dispatch({ type: "SET_AD_FREE_UNLOCKED", payload: true });
                }

                const pack = SEASON_PACKS.find((entry) => entry.productId === productId);
                if (pack) {
                    dispatch({ type: "UNLOCK_SEASON_PACK", payload: pack.id });
                }
            });

            Alert.alert(i18n.t("monetization.restoreTitle"), i18n.t("monetization.restoreSuccess"));
        } catch (error: any) {
            Alert.alert(
                i18n.t("common.error"),
                i18n.t("monetization.restoreFailed", { message: error?.message ?? "Unknown error" }),
            );
        }
    };

    const value = useMemo<BillingContextValue>(
        () => ({
            productsById,
            isReady: Boolean(connected),
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
        [connected, isPurchasing, productsById],
    );

    return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
}

export function BillingProvider({ children }: { children: ReactNode }) {
    return <BillingBootstrap>{children}</BillingBootstrap>;
}

export function useBilling() {
    return useContext(BillingContext);
}
