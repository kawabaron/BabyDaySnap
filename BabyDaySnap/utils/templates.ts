import i18n, { getCurrentLocaleTag, type SupportedLocale } from "@/lib/i18n";
import type { ColorOption, FontId, FontOption, TemplateConfig, TemplateId } from "@/types";
import {
    BERRY_SAKURA_TEMPLATE_ID,
    DECORATIVE_FRAME_BACKGROUND_COLOR,
    DECORATIVE_FRAME_LINE_COLOR,
} from "./decorativeFrame";

export type AppTemplateId = TemplateId;

export type AppTemplateConfig = Omit<TemplateConfig, "id"> & {
    id: AppTemplateId;
    innerLineColorHex?: string;
    canvasBackgroundColorHex?: string;
    photoLineColorHex?: string;
    decorationPreset?: "berry_sakura";
    isHidden?: boolean;
};

export const TEMPLATES: AppTemplateConfig[] = [
    {
        id: "tpl_noframe_full",
        get label() { return i18n.t("templates.tpl_noframe_full"); },
        hasFrame: false,
        isSquare: false,
        defaultDateColorHex: "#FFFFFF",
        hasTextStroke: true,
    },
    {
        id: "tpl_noframe_line",
        get label() { return i18n.t("templates.tpl_noframe_line"); },
        hasFrame: false,
        isSquare: false,
        defaultDateColorHex: "#FFFFFF",
        innerLineColorHex: "#FFFFFF",
        hasTextStroke: true,
    },
    {
        id: "tpl_frame_full",
        get label() { return i18n.t("templates.tpl_frame_full"); },
        hasFrame: true,
        isSquare: false,
        defaultDateColorHex: "#000000",
        hasTextStroke: false,
    },
    {
        id: "tpl_frame_crop",
        get label() { return i18n.t("templates.tpl_frame_crop"); },
        hasFrame: true,
        isSquare: false,
        defaultDateColorHex: "#000000",
        hasTextStroke: false,
    },
    {
        id: BERRY_SAKURA_TEMPLATE_ID,
        get label() { return i18n.t("templates.tpl_frame_berry_sakura"); },
        hasFrame: true,
        isSquare: false,
        defaultDateColorHex: "#5D4B56",
        seasonPackId: "season_pack_spring_2026",
        hasTextStroke: false,
        canvasBackgroundColorHex: DECORATIVE_FRAME_BACKGROUND_COLOR,
        photoLineColorHex: DECORATIVE_FRAME_LINE_COLOR,
        decorationPreset: "berry_sakura",
        isHidden: true,
    },
];

export const VISIBLE_TEMPLATES = TEMPLATES.filter((template) => !template.isHidden);

export const COLOR_PALETTE: ColorOption[] = [
    { hex: "#FFFFFF", get label() { return i18n.t("palette.white"); } },
    { hex: "#000000", get label() { return i18n.t("palette.black"); } },
    { hex: "#9E9E9E", get label() { return i18n.t("palette.gray"); } },
    { hex: "#F44336", get label() { return i18n.t("palette.red"); } },
    { hex: "#2196F3", get label() { return i18n.t("palette.blue"); } },
    { hex: "#4CAF50", get label() { return i18n.t("palette.green"); } },
    { hex: "#FF9800", get label() { return i18n.t("palette.orange"); } },
    { hex: "#E91E63", get label() { return i18n.t("palette.pink"); } },
    { hex: "#9C27B0", get label() { return i18n.t("palette.purple"); } },
    { hex: "#FFEB3B", get label() { return i18n.t("palette.yellow"); } },
];

export function getTemplateConfig(id: string): AppTemplateConfig {
    return TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];
}

export function resolveSelectableTemplateId(id: string): TemplateId {
    const template = TEMPLATES.find((item) => item.id === id);
    if (template && !template.isHidden) {
        return template.id;
    }

    return VISIBLE_TEMPLATES[0]?.id ?? TEMPLATES[0].id;
}

export const FONT_OPTIONS: FontOption[] = [
    {
        id: "font_standard",
        get label() { return i18n.t("fonts.font_standard"); },
        file: require("../assets/fonts/NotoSansJP-Bold.otf"),
    },
    {
        id: "font_soft",
        get label() { return i18n.t("fonts.font_soft"); },
        file: require("../assets/fonts/ZenMaruGothic-Bold.ttf"),
    },
    {
        id: "font_stylish",
        get label() { return i18n.t("fonts.font_stylish"); },
        file: require("../assets/fonts/ZenKurenaido-Regular.ttf"),
    },
    {
        id: "font_cute",
        get label() { return i18n.t("fonts.font_cute"); },
        file: require("../assets/fonts/HachiMaruPop-Regular.ttf"),
    },
    {
        id: "font_calligraphy",
        get label() { return i18n.t("fonts.font_calligraphy"); },
        file: require("../assets/fonts/YujiSyuku-Regular.ttf"),
    },
    {
        id: "font_round",
        get label() { return i18n.t("fonts.font_round"); },
        file: require("../assets/fonts/MPLUSRounded1c-Bold.ttf"),
    },
    {
        id: "font_magic",
        get label() { return i18n.t("fonts.font_magic"); },
        file: require("../assets/fonts/YuseiMagic-Regular.ttf"),
    },
    {
        id: "font_hina",
        get label() { return i18n.t("fonts.font_hina"); },
        file: require("../assets/fonts/Hina-Mincho-Regular.ttf"),
    },
];

const FONT_STANDARD_ID: FontId = "font_standard";
const RESTRICTED_FONT_LOCALES = new Set<SupportedLocale>(["ko", "zh-CN"]);

export const FONT_ASSET_MAP = Object.fromEntries(
    FONT_OPTIONS.map((font) => [font.id, font.file]),
) as Record<FontId, FontOption["file"]>;

export function getFontConfig(id: FontId): FontOption {
    return FONT_OPTIONS.find((font) => font.id === normalizeFontIdForCurrentLocale(id)) ?? FONT_OPTIONS[0];
}

export function normalizeFontIdForLocale(id: FontId | null | undefined, locale: SupportedLocale): FontId {
    const resolvedId: FontId = FONT_OPTIONS.some((font) => font.id === id) ? (id as FontId) : FONT_STANDARD_ID;
    if (RESTRICTED_FONT_LOCALES.has(locale) && resolvedId !== FONT_STANDARD_ID) {
        return FONT_STANDARD_ID;
    }

    return resolvedId;
}

export function normalizeFontIdForCurrentLocale(id: FontId | null | undefined): FontId {
    return normalizeFontIdForLocale(id, getCurrentLocaleTag());
}

export function getAvailableFontsForLocale(locale: SupportedLocale): FontOption[] {
    if (RESTRICTED_FONT_LOCALES.has(locale)) {
        return FONT_OPTIONS.filter((font) => font.id === FONT_STANDARD_ID);
    }

    return FONT_OPTIONS;
}

export function getAvailableFontsForCurrentLocale(): FontOption[] {
    return getAvailableFontsForLocale(getCurrentLocaleTag());
}
