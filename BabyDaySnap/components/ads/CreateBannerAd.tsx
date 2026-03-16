import { View, StyleSheet } from "react-native";
import { BannerAd } from "react-native-google-mobile-ads";

import { useAppState } from "@/context/AppContext";
import { CREATE_BANNER_SIZE, CREATE_BANNER_UNIT_ID } from "@/lib/ads";

const BANNER_HEIGHT = 72;

export function CreateBannerAd() {
    const { settings } = useAppState();

    if (settings.adFreeUnlocked) {
        return null;
    }

    return (
        <View style={styles.wrapper}>
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
    );
}

const styles = StyleSheet.create({
    wrapper: {
        minHeight: BANNER_HEIGHT,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.72)",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#F1D9E0",
        paddingVertical: 8,
    },
});
