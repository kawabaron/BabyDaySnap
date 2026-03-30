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
    defaultTemplateId: "tpl_noframe_full",
    defaultFontId: "font_standard",
    defaultFilterId: "filter_none",
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

export function normalizeSettings(settings?: Partial<UserSettings> | null): UserSettings {
    return {
        ...DEFAULT_SETTINGS,
        ...(settings ?? {}),
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
        fontId: item.fontId || "font_standard",
        isBold: item.isBold ?? false,
        filterId: normalizeFilterId(item.filterId),
        showDate: item.showDate ?? true,
        showName: item.showName ?? true,
        showAge: item.showAge ?? true,
        ageFormat: item.ageFormat || "days",
        displayStyle: item.displayStyle || "current",
    };
}
