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
    monetizationConfig?.createBannerUnitId ?? (isDev ? TestIds.BANNER : TestIds.BANNER);

export const INTERSTITIAL_UNIT_ID =
    monetizationConfig?.interstitialUnitId ?? (isDev ? TestIds.INTERSTITIAL : TestIds.INTERSTITIAL);

export const CREATE_BANNER_SIZE = BannerAdSize.BANNER;

let interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
});
let interstitialLoaded = false;
let interstitialLoading = false;
let listenersAttached = false;
let interstitialShowResolver: ((value: boolean) => void) | null = null;

function loadInterstitial() {
    if (interstitialLoaded || interstitialLoading) {
        return;
    }

    interstitialLoading = true;
    interstitial.load();
}

function attachInterstitialListeners() {
    if (listenersAttached) {
        return;
    }

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
        interstitialLoaded = true;
        interstitialLoading = false;
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        interstitialLoaded = false;
        interstitialLoading = false;
        interstitialShowResolver?.(true);
        interstitialShowResolver = null;
        interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
            requestNonPersonalizedAdsOnly: true,
        });
        listenersAttached = false;
        attachInterstitialListeners();
        loadInterstitial();
    });

    interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
        interstitialLoaded = false;
        interstitialLoading = false;
        interstitialShowResolver?.(false);
        interstitialShowResolver = null;
    });

    listenersAttached = true;
}

export async function initializeAds() {
    try {
        await mobileAds().initialize();
    } catch {
        return;
    }

    attachInterstitialListeners();
    loadInterstitial();
}

export async function showInterstitialAd(): Promise<boolean> {
    if (interstitialShowResolver) {
        return false;
    }

    if (!interstitialLoaded) {
        loadInterstitial();
        return false;
    }

    return new Promise<boolean>((resolve) => {
        interstitialShowResolver = resolve;

        interstitial.show().catch(() => {
            interstitialLoaded = false;
            interstitialLoading = false;
            interstitialShowResolver = null;
            loadInterstitial();
            resolve(false);
        });
    });
}
