import Constants from "expo-constants";
import {
    AdEventType,
    BannerAdSize,
    InterstitialAd,
    TestIds,
    default as mobileAds,
} from "react-native-google-mobile-ads";
import { markAdShown } from "@/lib/engagement";

const monetizationConfig = Constants.expoConfig?.extra?.monetization;
const isDev = typeof __DEV__ !== "undefined" && __DEV__;

export const CREATE_BANNER_UNIT_ID =
    isDev ? TestIds.BANNER : monetizationConfig?.createBannerUnitId ?? TestIds.BANNER;

export const INTERSTITIAL_UNIT_ID =
    isDev ? TestIds.INTERSTITIAL : monetizationConfig?.interstitialUnitId ?? TestIds.INTERSTITIAL;

export const CREATE_BANNER_SIZE = BannerAdSize.BANNER;

let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let interstitialLoading = false;
let listenersAttached = false;
let interstitialShowResolver: ((value: boolean) => void) | null = null;
let initializePromise: Promise<boolean> | null = null;

function createInterstitial() {
    return InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
        requestNonPersonalizedAdsOnly: true,
    });
}

function ensureInterstitial() {
    if (interstitial) {
        return;
    }

    interstitial = createInterstitial();
    interstitialLoaded = false;
    interstitialLoading = false;
    listenersAttached = false;
}

function loadInterstitial() {
    if (!interstitial || interstitialLoaded || interstitialLoading) {
        return;
    }

    interstitialLoading = true;
    interstitial.load();
}

function attachInterstitialListeners() {
    if (!interstitial || listenersAttached) {
        return;
    }

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
        interstitialLoaded = true;
        interstitialLoading = false;
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
        interstitialLoaded = false;
        interstitialLoading = false;
        void markAdShown();
        interstitialShowResolver?.(true);
        interstitialShowResolver = null;
        interstitial = createInterstitial();
        listenersAttached = false;
        attachInterstitialListeners();
        loadInterstitial();
    });

    interstitial.addAdEventListener(AdEventType.ERROR, () => {
        interstitialLoaded = false;
        interstitialLoading = false;
        interstitialShowResolver?.(false);
        interstitialShowResolver = null;
    });

    listenersAttached = true;
}

export async function initializeAds(): Promise<boolean> {
    if (initializePromise) {
        return initializePromise;
    }

    initializePromise = (async () => {
        try {
            await mobileAds().initialize();
        } catch {
            initializePromise = null;
            return false;
        }

        ensureInterstitial();
        attachInterstitialListeners();
        loadInterstitial();
        return true;
    })();

    return initializePromise;
}

export async function showInterstitialAd(): Promise<boolean> {
    if (!interstitial || interstitialShowResolver) {
        return false;
    }

    if (!interstitialLoaded) {
        loadInterstitial();
        return false;
    }

    return new Promise<boolean>((resolve) => {
        interstitialShowResolver = resolve;
        const currentInterstitial = interstitial;

        currentInterstitial?.show().catch(() => {
            interstitialLoaded = false;
            interstitialLoading = false;
            interstitialShowResolver = null;
            loadInterstitial();
            resolve(false);
        });
    });
}
