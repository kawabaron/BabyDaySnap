import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";

import de from "../locales/de.json";
import en from "../locales/en.json";
import es from "../locales/es.json";
import fr from "../locales/fr.json";
import ja from "../locales/ja.json";
import ko from "../locales/ko.json";
import ptBR from "../locales/pt-BR.json";
import zhCN from "../locales/zh-CN.json";

const jaMonetizationOverrides = {
    adFreeDescription: "各画面のバナー広告と保存時の広告を非表示にします",
    adFreeUnlocked: "この端末では、各画面のバナー広告を非表示にしています",
    adFreeSheetTitle: "各画面のバナー広告を非表示にする",
    adFreeSheetDescription: "一度の購入で、この端末の各画面のバナー広告と保存時の広告を非表示にします",
    watchVideoHideDescription: "今日の残り時間は、各画面のバナー広告を非表示にします",
    removeAdsDescription: "各画面のバナー広告を非表示にする購入画面を開きます",
    bannerHiddenMessage: "今日の残り時間は、各画面のバナー広告を表示しません"
};

const translations = {
    en,
    ja: {
        ...en,
        ...ja,
        monetization: {
            ...en.monetization,
            ...ja.monetization,
            ...jaMonetizationOverrides
        }
    },
    es: {
        ...en,
        ...es
    },
    "pt-BR": {
        ...en,
        ...ptBR
    },
    fr: {
        ...en,
        ...fr
    },
    de: {
        ...en,
        ...de
    },
    ko: {
        ...en,
        ...ko
    },
    "zh-CN": {
        ...en,
        ...zhCN
    }
} as const;

export type SupportedLocale = keyof typeof translations;

const FALLBACK_LOCALE: SupportedLocale = "en";
const LOCALE_PREFIXES: Record<string, SupportedLocale> = {
    en: "en",
    ja: "ja",
    es: "es",
    pt: "pt-BR",
    fr: "fr",
    de: "de",
    ko: "ko",
    zh: "zh-CN"
};

function resolveSupportedLocale(): SupportedLocale {
    for (const locale of getLocales()) {
        const resolved = matchSupportedLocale(locale.languageTag) ?? matchSupportedLocale(locale.languageCode);
        if (resolved) {
            return resolved;
        }
    }

    return FALLBACK_LOCALE;
}

function matchSupportedLocale(localeTag?: string | null): SupportedLocale | null {
    const normalized = localeTag?.replace(/_/g, "-").toLowerCase();
    if (!normalized) {
        return null;
    }

    for (const [prefix, supportedLocale] of Object.entries(LOCALE_PREFIXES)) {
        if (normalized === prefix || normalized.startsWith(`${prefix}-`)) {
            return supportedLocale;
        }
    }

    return null;
}

const i18n = new I18n(translations);

i18n.locale = resolveSupportedLocale();
i18n.enableFallback = true;
i18n.defaultLocale = FALLBACK_LOCALE;

export function getCurrentLocaleTag(): SupportedLocale {
    return matchSupportedLocale(i18n.locale) ?? FALLBACK_LOCALE;
}

export default i18n;
