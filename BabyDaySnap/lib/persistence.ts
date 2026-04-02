import type { AppLibraryItem, UserSettings } from "@/types";

export const ASYNC_STORAGE_KEYS = {
    SETTINGS: "@babydaysnap/settings",
    LIBRARY: "@babydaysnap/library",
    BABIES: "@babydaysnap/babies",
} as const;

export const DEFAULT_SETTINGS: UserSettings = {
    hasOnboarded: false,
    birthDateISO: null,
    babyName: "",
    preferredLocale: null,
    defaultTemplateId: "tpl_noframe_full",
    defaultTextPosition: "bottom_right",
    defaultFontId: "font_standard",
    defaultIsBold: false,
    defaultFilterId: "filter_none",
    defaultCompactEmptyCommentSpace: false,
    defaultShowDate: true,
    defaultShowName: true,
    defaultShowAge: true,
    defaultAgeFormat: "days",
    defaultDisplayStyle: "current",
    lastTemplateId: "tpl_noframe_full",
    lastFontId: "font_standard",
    lastDateColorHex: "#FFFFFF",
    policyUrls: {
        termsUrl: "https://kawabaron.github.io/BabyDaySnap/terms.html",
        privacyUrl: "https://kawabaron.github.io/BabyDaySnap/privacy.html",
        contactUrl: "https://kawabaron.github.io/BabyDaySnap/contact.html",
        commerceUrl: "https://kawabaron.github.io/BabyDaySnap/commerce.html",
    },
    adFreeUnlocked: false,
    unlockedSeasonPackIds: [],
    saveSuccessCountTotal: 0,
    interstitialLastShownDate: null,
    interstitialShownCountToday: 0,
    interstitialDailyBucketDate: null,
};

function normalizeFilterId(filterId?: string | null): UserSettings["defaultFilterId"] {
    return filterId === "filter_retro" || !filterId ? "filter_none" : filterId as UserSettings["defaultFilterId"];
}

const SUPPORTED_LOCALE_VALUES = new Set<NonNullable<UserSettings["preferredLocale"]>>([
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
]);

const LEGACY_LOCALE_MIGRATIONS: Record<string, NonNullable<UserSettings["preferredLocale"]>> = {
    en: "en-US",
    es: "es-ES",
};

function normalizePreferredLocale(preferredLocale?: string | null): UserSettings["preferredLocale"] {
    if (!preferredLocale) {
        return null;
    }

    const migratedLocale = LEGACY_LOCALE_MIGRATIONS[preferredLocale] ?? preferredLocale;
    if (!SUPPORTED_LOCALE_VALUES.has(migratedLocale as NonNullable<UserSettings["preferredLocale"]>)) {
        return null;
    }

    return migratedLocale as UserSettings["preferredLocale"];
}

export function normalizeSettings(settings?: Partial<UserSettings> | null): UserSettings {
    return {
        ...DEFAULT_SETTINGS,
        ...(settings ?? {}),
        preferredLocale: normalizePreferredLocale(settings?.preferredLocale),
        defaultFilterId: normalizeFilterId(settings?.defaultFilterId),
        policyUrls: {
            ...DEFAULT_SETTINGS.policyUrls,
            ...(settings?.policyUrls ?? {}),
        },
        unlockedSeasonPackIds: settings?.unlockedSeasonPackIds ?? DEFAULT_SETTINGS.unlockedSeasonPackIds,
    };
}

export function normalizeLibraryItem(item: AppLibraryItem): AppLibraryItem {
    return {
        ...item,
        babyIds: item.babyIds || [],
        commentText: item.commentText || "",
        compactEmptyCommentSpace: item.compactEmptyCommentSpace ?? false,
        fontId: item.fontId || "font_standard",
        isBold: item.isBold ?? false,
        filterId: normalizeFilterId(item.filterId),
        showDate: item.showDate ?? true,
        showName: item.showName ?? true,
        showAge: item.showAge ?? true,
        ageFormat: item.ageFormat || "days",
        displayStyle: item.displayStyle || "current",
        textPosition: item.textPosition || "bottom_right",
    };
}
