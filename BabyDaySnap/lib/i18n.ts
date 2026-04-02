import { getLocales } from "expo-localization";
import { I18n } from "i18n-js";

import de from "../locales/de.json";
import enAU from "../locales/en-AU.json";
import enCA from "../locales/en-CA.json";
import enGB from "../locales/en-GB.json";
import enUS from "../locales/en-US.json";
import esES from "../locales/es-ES.json";
import esMX from "../locales/es-MX.json";
import fr from "../locales/fr.json";
import it from "../locales/it.json";
import ja from "../locales/ja.json";
import ko from "../locales/ko.json";
import ptBR from "../locales/pt-BR.json";
import ptPT from "../locales/pt-PT.json";
import zhCN from "../locales/zh-CN.json";
import zhTW from "../locales/zh-TW.json";

const jaMonetizationOverrides = {
    adFreeDescription: "広告を非表示にします",
    adFreeUnlocked: "この端末では、各画面のバナー広告を非表示にしています",
    adFreeSheetTitle: "各画面のバナー広告を非表示にする",
    adFreeSheetDescription: "一度の購入で、この端末の各画面のバナー広告と保存時の広告を非表示にします",
    watchVideoHideDescription: "今日の残り時間は、各画面のバナー広告を非表示にします",
    removeAdsDescription: "各画面のバナー広告を非表示にする購入画面を開きます",
    bannerHiddenMessage: "今日の残り時間は、各画面のバナー広告を表示しません",
    restoreHint: "機種変更や再インストール後に、購入済みの状態をこの端末へ反映するためのボタンです。"
};

export const SUPPORTED_LOCALES = Object.freeze([
    "ja",
    "ko",
    "zh-CN",
    "zh-TW",
    "en-US",
    "en-GB",
    "en-AU",
    "en-CA",
    "fr",
    "it",
    "de",
    "es-ES",
    "es-MX",
    "pt-PT",
    "pt-BR",
] as const);

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

const translations = {
    "ja": {
        ...enUS,
        ...ja,
        monetization: {
            ...enUS.monetization,
            ...ja.monetization,
            ...jaMonetizationOverrides,
        },
    },
    "ko": {
        ...enUS,
        ...ko,
    },
    "zh-CN": {
        ...enUS,
        ...zhCN,
    },
    "zh-TW": {
        ...enUS,
        ...zhTW,
    },
    "en-US": enUS,
    "en-GB": enGB,
    "en-AU": enAU,
    "en-CA": enCA,
    "fr": {
        ...enUS,
        ...fr,
    },
    "it": {
        ...enUS,
        ...it,
    },
    "de": {
        ...enUS,
        ...de,
    },
    "es-ES": {
        ...enUS,
        ...esES,
    },
    "es-MX": {
        ...enUS,
        ...esMX,
    },
    "pt-PT": {
        ...enUS,
        ...ptPT,
    },
    "pt-BR": {
        ...enUS,
        ...ptBR,
    },
} as const satisfies Record<SupportedLocale, object>;

const FALLBACK_LOCALE: SupportedLocale = "en-US";
const SUPPORTED_LOCALE_MAP = new Map(
    SUPPORTED_LOCALES.map((locale) => [locale.toLowerCase(), locale] as const),
);
const EXACT_LOCALE_MAP: Record<string, SupportedLocale> = {
    en: "en-US",
    "en-us": "en-US",
    "en-gb": "en-GB",
    "en-au": "en-AU",
    "en-ca": "en-CA",
    ja: "ja",
    ko: "ko",
    "zh-cn": "zh-CN",
    "zh-sg": "zh-CN",
    "zh-hans": "zh-CN",
    "zh-tw": "zh-TW",
    "zh-hk": "zh-TW",
    "zh-mo": "zh-TW",
    "zh-hant": "zh-TW",
    fr: "fr",
    it: "it",
    de: "de",
    es: "es-ES",
    "es-es": "es-ES",
    "es-mx": "es-MX",
    "es-419": "es-MX",
    pt: "pt-BR",
    "pt-br": "pt-BR",
    "pt-pt": "pt-PT",
};
const PREFIX_FALLBACKS: [string, SupportedLocale][] = [
    ["en", "en-US"],
    ["ja", "ja"],
    ["ko", "ko"],
    ["fr", "fr"],
    ["it", "it"],
    ["de", "de"],
    ["es", "es-ES"],
    ["pt", "pt-BR"],
];

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

    const exactSupportedLocale = SUPPORTED_LOCALE_MAP.get(normalized);
    if (exactSupportedLocale) {
        return exactSupportedLocale;
    }

    const exactMappedLocale = EXACT_LOCALE_MAP[normalized];
    if (exactMappedLocale) {
        return exactMappedLocale;
    }

    if (normalized.startsWith("zh-hant")) {
        return "zh-TW";
    }

    if (normalized.startsWith("zh-hans")) {
        return "zh-CN";
    }

    for (const [prefix, supportedLocale] of PREFIX_FALLBACKS) {
        if (normalized === prefix || normalized.startsWith(`${prefix}-`)) {
            return supportedLocale;
        }
    }

    return null;
}

const i18n = new I18n(translations);

i18n.enableFallback = true;
i18n.defaultLocale = FALLBACK_LOCALE;

export function applyPreferredLocale(preferredLocale?: SupportedLocale | null): SupportedLocale {
    const resolvedLocale = preferredLocale
        ? (matchSupportedLocale(preferredLocale) ?? resolveSupportedLocale())
        : resolveSupportedLocale();

    i18n.locale = resolvedLocale;
    return resolvedLocale;
}

applyPreferredLocale();

export function getCurrentLocaleTag(): SupportedLocale {
    return matchSupportedLocale(i18n.locale) ?? FALLBACK_LOCALE;
}

export default i18n;
