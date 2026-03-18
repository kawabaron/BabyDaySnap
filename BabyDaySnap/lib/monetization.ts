import Constants from "expo-constants";

import type { SeasonPackId, TemplateId, UserSettings } from "@/types";

type SeasonPackDefinition = {
    id: SeasonPackId;
    productId: string;
    templateIds: TemplateId[];
    titleKey: string;
    descriptionKey: string;
    isHidden?: boolean;
};

export const SEASON_PACKS: SeasonPackDefinition[] = [
    {
        id: "season_pack_spring_2026",
        productId:
            Constants.expoConfig?.extra?.monetization?.seasonPackSpring2026ProductId ??
            "season_pack_spring_2026",
        templateIds: ["tpl_frame_berry_sakura"],
        titleKey: "monetization.springPackTitle",
        descriptionKey: "monetization.springPackDescription",
        isHidden: true,
    },
];

export const VISIBLE_SEASON_PACKS = SEASON_PACKS.filter((pack) => !pack.isHidden);

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
