// ============================================================
// BabyDaySnap - テンプレート定義
// ============================================================
import i18n from "@/lib/i18n";
import type { TemplateConfig, ColorOption, TemplateId, FontOption, FontId } from "@/types";

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
    { hex: "#FFFFFF", label: "白" },
    { hex: "#000000", label: "黒" },
    { hex: "#9E9E9E", label: "グレー" },
    { hex: "#F44336", label: "赤" },
    { hex: "#2196F3", label: "青" },
    { hex: "#4CAF50", label: "緑" },
    { hex: "#FF9800", label: "オレンジ" },
    { hex: "#E91E63", label: "ピンク" },
    { hex: "#9C27B0", label: "紫" },
    { hex: "#FFEB3B", label: "黄" },
];

export function getTemplateConfig(id: TemplateId): TemplateConfig {
    return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
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
];

export function getFontConfig(id: FontId): FontOption {
    return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
}
