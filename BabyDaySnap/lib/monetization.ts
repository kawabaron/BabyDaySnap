import Constants from "expo-constants";

import type { SeasonPackId, TemplateId, UserSettings } from "@/types";

type SeasonPackDefinition = {
    id: SeasonPackId;
    productId: string;
    templateIds: TemplateId[];
    titleKey: string;
    descriptionKey: string;
};

export const AD_FREE_PRODUCT_ID =
    Constants.expoConfig?.extra?.monetization?.adFreeProductId ?? "ad_free";

export const INTERSTITIAL_SAVE_INTERVAL = 20;
export const INTERSTITIAL_DAILY_LIMIT = 1;

export const SEASON_PACKS: SeasonPackDefinition[] = [
    {
        id: "season_pack_spring_2026",
        productId:
            Constants.expoConfig?.extra?.monetization?.seasonPackSpring2026ProductId ??
            "season_pack_spring_2026",
        templateIds: ["tpl_frame_berry_sakura"],
        titleKey: "monetization.springPackTitle",
        descriptionKey: "monetization.springPackDescription",
    },
];

export function getSeasonPackById(packId: SeasonPackId): SeasonPackDefinition | undefined {
    return SEASON_PACKS.find((pack) => pack.id === packId);
}

export function getSeasonPackByTemplateId(templateId: TemplateId): SeasonPackDefinition | undefined {
    return SEASON_PACKS.find((pack) => pack.templateIds.includes(templateId));
}

export function isSeasonPackUnlocked(settings: UserSettings, packId: SeasonPackId): boolean {
    return settings.unlockedSeasonPackIds.includes(packId);
}

export function isTemplateUnlocked(settings: UserSettings, templateId: TemplateId): boolean {
    const pack = getSeasonPackByTemplateId(templateId);
    return pack ? isSeasonPackUnlocked(settings, pack.id) : true;
}

export function getDateKey(date = new Date()): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function shouldResetInterstitialDailyLimit(settings: UserSettings, dateKey = getDateKey()): boolean {
    return settings.interstitialDailyBucketDate !== dateKey;
}

export function shouldShowInterstitial(settings: UserSettings, dateKey = getDateKey()): boolean {
    if (settings.adFreeUnlocked) {
        return false;
    }

    const shownToday =
        settings.interstitialDailyBucketDate === dateKey
            ? settings.interstitialShownCountToday
            : 0;

    if (shownToday >= INTERSTITIAL_DAILY_LIMIT) {
        return false;
    }

    return settings.saveSuccessCountTotal > 0 && settings.saveSuccessCountTotal % INTERSTITIAL_SAVE_INTERVAL === 0;
}
