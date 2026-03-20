import React, {
    useCallback,
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    type ReactNode,
} from "react";
import {
    AdsConsent,
    AdsConsentPrivacyOptionsRequirementStatus,
    type AdsConsentInfo,
} from "react-native-google-mobile-ads";

import { initializeAds } from "@/lib/ads";

type AdsConsentContextValue = {
    adsReady: boolean;
    privacyOptionsRequired: boolean;
    refreshConsent: () => Promise<void>;
    openPrivacyOptions: () => Promise<boolean>;
};

const AdsConsentContext = createContext<AdsConsentContextValue>({
    adsReady: false,
    privacyOptionsRequired: false,
    refreshConsent: async () => undefined,
    openPrivacyOptions: async () => false,
});

function isPrivacyOptionsRequired(consentInfo: AdsConsentInfo | null) {
    return (
        consentInfo?.privacyOptionsRequirementStatus ===
        AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
    );
}

export function AdsConsentProvider({ children }: { children: ReactNode }) {
    const [adsReady, setAdsReady] = useState(false);
    const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
    const adsStartedRef = useRef(false);

    const maybeStartAds = useCallback(async () => {
        if (adsStartedRef.current) {
            setAdsReady(true);
            return;
        }

        const started = await initializeAds();
        if (!started) {
            return;
        }

        adsStartedRef.current = true;
        setAdsReady(true);
    }, []);

    const applyConsentInfo = useCallback(async (consentInfo: AdsConsentInfo | null) => {
        setPrivacyOptionsRequired(isPrivacyOptionsRequired(consentInfo));

        if (consentInfo?.canRequestAds) {
            await maybeStartAds();
        }
    }, [maybeStartAds]);

    const refreshConsent = useCallback(async () => {
        let consentInfo: AdsConsentInfo | null = null;

        try {
            consentInfo = await AdsConsent.gatherConsent();
        } catch {
            consentInfo = await AdsConsent.getConsentInfo().catch(() => null);
        }

        await applyConsentInfo(consentInfo);
    }, [applyConsentInfo]);

    const openPrivacyOptions = useCallback(async () => {
        const consentInfo = await AdsConsent.showPrivacyOptionsForm();
        await applyConsentInfo(consentInfo);
        return true;
    }, [applyConsentInfo]);

    useEffect(() => {
        refreshConsent().catch(() => undefined);
    }, [refreshConsent]);

    return (
        <AdsConsentContext.Provider
            value={{
                adsReady,
                privacyOptionsRequired,
                refreshConsent,
                openPrivacyOptions,
            }}
        >
            {children}
        </AdsConsentContext.Provider>
    );
}

export function useAdsConsent() {
    return useContext(AdsConsentContext);
}
