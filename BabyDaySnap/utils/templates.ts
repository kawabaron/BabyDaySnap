import i18n from "@/lib/i18n";
import type { ColorOption, FontId, FontOption, TemplateConfig, TemplateId } from "@/types";

export const TEMPLATES: TemplateConfig[] = [
    {
        id: "tpl_noframe_full",
        get label() { return i18n.t("templates.tpl_noframe_full"); },
        hasFrame: false,
        isSquare: false,
        defaultDateColorHex: "#FFFFFF",
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
];

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

export function getTemplateConfig(id: TemplateId): TemplateConfig {
    return TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];
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
        id: "font_scary",
        get label() { return i18n.t("fonts.font_scary"); },
        file: require("../assets/fonts/NewTegomin-Regular.ttf"),
    },
    {
        id: "font_round",
        get label() { return i18n.t("fonts.font_round"); },
        file: require("../assets/fonts/MPLUSRounded1c-Bold.ttf"),
    },
    {
        id: "font_cool",
        get label() { return i18n.t("fonts.font_cool"); },
        file: require("../assets/fonts/TrainOne-Regular.ttf"),
    },
    {
        id: "font_handwritten",
        get label() { return i18n.t("fonts.font_handwritten"); },
        file: require("../assets/fonts/KleeOne-SemiBold.ttf"),
    },
];

export const FONT_ASSET_MAP = Object.fromEntries(
    FONT_OPTIONS.map((font) => [font.id, font.file]),
) as Record<FontId, FontOption["file"]>;

export function getFontConfig(id: FontId): FontOption {
    return FONT_OPTIONS.find((font) => font.id === id) ?? FONT_OPTIONS[0];
}
