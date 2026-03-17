import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    InteractionManager,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { BannerAd } from "react-native-google-mobile-ads";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useActiveBaby, useAppState } from "@/context/AppContext";
import { getThemePreset, NEUTRAL_THEME } from "@/constants/babyTheme";
import { showInterstitialAd, CREATE_BANNER_SIZE, CREATE_BANNER_UNIT_ID } from "@/lib/ads";
import { useBilling } from "@/lib/billing";
import i18n from "@/lib/i18n";
import { AD_FREE_PRODUCT_ID, getDateKey } from "@/lib/monetization";

const BANNER_HEIGHT = 54;
const TEMP_HIDDEN_STORAGE_KEY = "@babydaysnap/create_banner_hidden_date";

type SheetMode = "actions" | "purchase" | null;
type PendingAction = "temporaryHide" | null;

export function CreateBannerAd() {
    const { settings } = useAppState();
    const activeBaby = useActiveBaby();
    const { productsById, isPurchasing, purchaseAdFree } = useBilling();
    const insets = useSafeAreaInsets();
    const { width: screenWidth } = useWindowDimensions();

    const [sheetMode, setSheetMode] = useState<SheetMode>(null);
    const [hiddenDateKey, setHiddenDateKey] = useState<string | null>(null);
    const [storageReady, setStorageReady] = useState(false);
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [isRunningPendingAction, setIsRunningPendingAction] = useState(false);

    const translateY = useRef(new Animated.Value(32)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    const todayKey = getDateKey();
    const adFreeProduct = productsById[AD_FREE_PRODUCT_ID];
    const isSheetVisible = sheetMode !== null;
    const isHiddenForToday = hiddenDateKey === todayKey;
    const theme = activeBaby ? getThemePreset(activeBaby.themeColorHex) : NEUTRAL_THEME;
    const shellHorizontalMargin = screenWidth >= 360 ? 8 : 4;
    const sideSlotWidth = screenWidth >= 360 ? 18 : 14;

    useEffect(() => {
        let isMounted = true;

        AsyncStorage.getItem(TEMP_HIDDEN_STORAGE_KEY)
            .then((storedValue) => {
                if (!isMounted) {
                    return;
                }

                if (storedValue === todayKey) {
                    setHiddenDateKey(storedValue);
                    return;
                }

                setHiddenDateKey(null);
                if (storedValue) {
                    AsyncStorage.removeItem(TEMP_HIDDEN_STORAGE_KEY).catch(() => undefined);
                }
            })
            .finally(() => {
                if (isMounted) {
                    setStorageReady(true);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [todayKey]);

    useEffect(() => {
        if (!isSheetVisible) {
            translateY.setValue(32);
            opacity.setValue(0);
            return;
        }

        Animated.parallel([
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                damping: 18,
                stiffness: 220,
                mass: 0.85,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start();
    }, [isSheetVisible, opacity, translateY]);

    const closeSheets = () => {
        setSheetMode(null);
    };

    useEffect(() => {
        if (pendingAction !== "temporaryHide" || isSheetVisible || isRunningPendingAction) {
            return;
        }

        let cancelled = false;
        setIsRunningPendingAction(true);

        const interactionTask = InteractionManager.runAfterInteractions(() => {
            setTimeout(async () => {
                if (cancelled) {
                    return;
                }

                const shown = await showInterstitialAd().catch(() => false);

                if (cancelled) {
                    return;
                }

                if (!shown) {
                    setPendingAction(null);
                    setIsRunningPendingAction(false);
                    Alert.alert(
                        i18n.t("monetization.videoAdUnavailableTitle"),
                        i18n.t("monetization.videoAdUnavailableMessage"),
                    );
                    return;
                }

                setHiddenDateKey(todayKey);
                await AsyncStorage.setItem(TEMP_HIDDEN_STORAGE_KEY, todayKey).catch(() => undefined);

                setPendingAction(null);
                setIsRunningPendingAction(false);

                setTimeout(() => {
                    if (cancelled) {
                        return;
                    }

                    Alert.alert(
                        i18n.t("monetization.bannerHiddenTitle"),
                        i18n.t("monetization.bannerHiddenMessage"),
                    );
                }, 160);
            }, 220);
        });

        return () => {
            cancelled = true;
            interactionTask.cancel();
        };
    }, [isRunningPendingAction, isSheetVisible, pendingAction, todayKey]);

    const handleTemporaryHide = () => {
        if (isRunningPendingAction) {
            return;
        }

        setPendingAction("temporaryHide");
        closeSheets();
    };

    const handlePurchaseAdFree = async () => {
        const started = await purchaseAdFree().catch(() => false);
        if (started) {
            closeSheets();
        }
    };

    if (!storageReady || settings.adFreeUnlocked || isHiddenForToday) {
        return null;
    }

    return (
        <>
            <View style={[styles.wrapper, { backgroundColor: theme.background }]}>
                <View
                    style={[
                        styles.bannerShell,
                        { marginHorizontal: shellHorizontalMargin },
                    ]}
                >
                    <View style={styles.bannerRow}>
                        <View style={[styles.sideSlot, { width: sideSlotWidth }]} />

                        <View style={styles.bannerFrame}>
                            <BannerAd
                                unitId={CREATE_BANNER_UNIT_ID}
                                size={CREATE_BANNER_SIZE}
                                requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                                onAdLoaded={() => {
                                    if (__DEV__) {
                                        console.log("[ads] banner loaded", CREATE_BANNER_UNIT_ID);
                                    }
                                }}
                                onAdFailedToLoad={(error) => {
                                    console.warn("[ads] banner failed", error);
                                }}
                            />
                        </View>

                        <View style={[styles.sideSlot, { width: sideSlotWidth }]} />
                    </View>

                    <Pressable
                        accessibilityLabel={i18n.t("monetization.bannerCloseA11y")}
                        accessibilityRole="button"
                        hitSlop={10}
                        onPress={() => setSheetMode("actions")}
                        style={({ pressed }) => [
                            styles.closeButton,
                            pressed && styles.closeButtonPressed,
                        ]}
                    >
                        <Ionicons name="close" size={10} color="#FFFFFF" />
                    </Pressable>
                </View>
            </View>

            <Modal
                animationType="fade"
                onRequestClose={closeSheets}
                transparent
                visible={isSheetVisible}
            >
                <View style={styles.modalRoot}>
                    <Pressable style={styles.scrim} onPress={closeSheets} />

                    <Animated.View
                        style={[
                            styles.sheet,
                            {
                                opacity,
                                paddingBottom: Math.max(insets.bottom, 12),
                                transform: [{ translateY }],
                            },
                        ]}
                    >
                        {sheetMode === "actions" ? (
                            <View style={styles.sheetBody}>
                                <Pressable
                                    accessibilityRole="button"
                                    onPress={handleTemporaryHide}
                                    disabled={isRunningPendingAction}
                                    style={({ pressed }) => [
                                        styles.optionRow,
                                        pressed && styles.optionRowPressed,
                                        isRunningPendingAction && styles.optionRowDisabled,
                                    ]}
                                >
                                    <View style={styles.optionIcon}>
                                        <Ionicons name="play-circle-outline" size={18} color="#1AA884" />
                                    </View>
                                    <View style={styles.optionCopy}>
                                        <Text style={styles.optionTitle}>
                                            {i18n.t("monetization.watchVideoHideOption")}
                                        </Text>
                                        <Text style={styles.optionDescription}>
                                            {i18n.t("monetization.watchVideoHideDescription")}
                                        </Text>
                                    </View>
                                </Pressable>

                                <Pressable
                                    accessibilityRole="button"
                                    onPress={() => setSheetMode("purchase")}
                                    style={({ pressed }) => [
                                        styles.optionRow,
                                        pressed && styles.optionRowPressed,
                                    ]}
                                >
                                    <View style={styles.optionIcon}>
                                        <Ionicons name="remove-circle-outline" size={18} color="#48C78E" />
                                    </View>
                                    <View style={styles.optionCopy}>
                                        <Text style={styles.optionTitle}>
                                            {i18n.t("monetization.removeAdsOption")}
                                        </Text>
                                        <Text style={styles.optionDescription}>
                                            {i18n.t("monetization.removeAdsDescription")}
                                        </Text>
                                    </View>
                                </Pressable>
                            </View>
                        ) : null}

                        {sheetMode === "purchase" ? (
                            <View style={styles.sheetBody}>
                                <Text style={styles.purchaseEyebrow}>{i18n.t("monetization.adFreeTitle")}</Text>
                                <Text style={styles.purchaseTitle}>
                                    {i18n.t("monetization.adFreeSheetTitle")}
                                </Text>
                                <Text style={styles.purchaseText}>
                                    {i18n.t("monetization.adFreeSheetDescription")}
                                </Text>

                                <View style={styles.purchaseActions}>
                                    <Pressable
                                        accessibilityRole="button"
                                        disabled={isPurchasing}
                                        onPress={handlePurchaseAdFree}
                                        style={({ pressed }) => [
                                            styles.primaryButton,
                                            (pressed || isPurchasing) && styles.primaryButtonPressed,
                                        ]}
                                    >
                                        <Text style={styles.primaryButtonText}>
                                            {adFreeProduct?.displayPrice ?? i18n.t("monetization.buyNow")}
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        accessibilityRole="button"
                                        onPress={() => setSheetMode("actions")}
                                        style={({ pressed }) => [
                                            styles.secondaryButton,
                                            pressed && styles.secondaryButtonPressed,
                                        ]}
                                    >
                                        <Text style={styles.secondaryButtonText}>
                                            {i18n.t("common.cancel")}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        ) : null}
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        minHeight: BANNER_HEIGHT,
        justifyContent: "center",
        paddingVertical: 4,
        backgroundColor: "transparent",
    },
    bannerShell: {
        position: "relative",
        minHeight: 50,
        borderRadius: 10,
        backgroundColor: "#E5E8ED",
        justifyContent: "center",
        overflow: "hidden",
    },
    bannerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    sideSlot: {},
    bannerFrame: {
        minHeight: 50,
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    closeButton: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 14,
        height: 14,
        borderRadius: 7,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(80, 87, 96, 0.7)",
    },
    closeButtonPressed: {
        opacity: 0.72,
    },
    modalRoot: {
        flex: 1,
        justifyContent: "flex-end",
    },
    scrim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(6, 10, 16, 0.26)",
    },
    sheet: {
        marginHorizontal: 12,
        marginBottom: 12,
        borderRadius: 24,
        backgroundColor: "#121416",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.2,
        shadowRadius: 26,
        elevation: 16,
    },
    sheetBody: {
        paddingHorizontal: 18,
        paddingTop: 14,
        gap: 6,
    },
    optionRow: {
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderRadius: 18,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    optionRowPressed: {
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    optionRowDisabled: {
        opacity: 0.45,
    },
    optionIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(72, 199, 142, 0.12)",
    },
    optionCopy: {
        flex: 1,
        gap: 3,
    },
    optionTitle: {
        color: "#F4F6F8",
        fontSize: 15,
        fontWeight: "700",
    },
    optionDescription: {
        color: "#8E98A5",
        fontSize: 12,
        lineHeight: 16,
    },
    purchaseEyebrow: {
        color: "#48C78E",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.6,
        textTransform: "uppercase",
    },
    purchaseTitle: {
        marginTop: 4,
        color: "#F4F6F8",
        fontSize: 20,
        fontWeight: "800",
    },
    purchaseText: {
        marginTop: 8,
        color: "#B3BDC8",
        fontSize: 14,
        lineHeight: 20,
    },
    purchaseActions: {
        marginTop: 18,
        gap: 10,
    },
    primaryButton: {
        minHeight: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#48C78E",
    },
    primaryButtonPressed: {
        opacity: 0.84,
    },
    primaryButtonText: {
        color: "#0D1B12",
        fontSize: 16,
        fontWeight: "800",
    },
    secondaryButton: {
        minHeight: 46,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    secondaryButtonPressed: {
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    secondaryButtonText: {
        color: "#D8DEE5",
        fontSize: 15,
        fontWeight: "700",
    },
});
