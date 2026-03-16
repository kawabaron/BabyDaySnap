import Constants from "expo-constants";
import {
    AdEventType,
    BannerAdSize,
    InterstitialAd,
    TestIds,
    default as mobileAds,
} from "react-native-google-mobile-ads";

const monetizationConfig = Constants.expoConfig?.extra?.monetization;
const isDev = typeof __DEV__ !== "undefined" && __DEV__;

export const CREATE_BANNER_UNIT_ID =
    monetizationConfig?.createBannerUnitId ?? (isDev ? TestIds.ADAPTIVE_BANNER : TestIds.ADAPTIVE_BANNER);

export const INTERSTITIAL_UNIT_ID =
    monetizationConfig?.interstitialUnitId ?? (isDev ? TestIds.INTERSTITIAL : TestIds.INTERSTITIAL);

export const CREATE_BANNER_SIZE = BannerAdSize.ANCHORED_ADAPTIVE_BANNER;

let interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
});
let interstitialLoaded = false;
let listenersAttached = false;

function attachInterstitialListeners() {
    if (listenersAttached) {
        return;
    }

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
        interstitialLoaded = true;
        if (__DEV__) {
            console.log("[ads] interstitial loaded", INTERSTITIAL_UNIT_ID);
        }
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        interstitialLoaded = false;
        interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
            requestNonPersonalizedAdsOnly: true,
        });
        listenersAttached = false;
        attachInterstitialListeners();
        interstitial.load();
    });

    interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        interstitialLoaded = false;
        console.warn("[ads] interstitial failed", error);
    });

    listenersAttached = true;
}

export async function initializeAds() {
    try {
        await mobileAds().initialize();
        if (__DEV__) {
            console.log("[ads] mobile ads initialized");
        }
    } catch {
        console.warn("[ads] mobile ads initialize failed");
        return;
    }

    attachInterstitialListeners();
}

export async function showInterstitialAd(): Promise<boolean> {
    if (!interstitialLoaded) {
        interstitial.load();
        return false;
    }

    await interstitial.show();
    return true;
}
