// ============================================================
// BabyDaySnap - テンプレート定義
// ============================================================
import type { TemplateConfig, ColorOption, TemplateId, FontOption, FontId } from "@/types";

export const TEMPLATES: TemplateConfig[] = [
    {
        id: "tpl_noframe_full",
        label: "フチなし全面",
        hasFrame: false,
        isSquare: false,
        defaultDateColorHex: "#FFFFFF",
        hasTextStroke: true,
    },
    {
        id: "tpl_frame_full",
        label: "フチあり（全体）",
        hasFrame: true,
        isSquare: false,
        defaultDateColorHex: "#000000",
        hasTextStroke: false,
    },
    {
        id: "tpl_frame_crop",
        label: "フチあり（切取）",
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
        label: "標準",
        file: require("../assets/fonts/NotoSansJP-Bold.otf"),
    },
    {
        id: "font_soft",
        label: "柔らかめ",
        file: require("../assets/fonts/ZenMaruGothic-Bold.ttf"),
    },
    {
        id: "font_stylish",
        label: "おしゃれ",
        file: require("../assets/fonts/ZenKurenaido-Regular.ttf"),
    },
    {
        id: "font_cute",
        label: "かわいい",
        file: require("../assets/fonts/HachiMaruPop-Regular.ttf"),
    },
];

export function getFontConfig(id: FontId): FontOption {
    return FONT_OPTIONS.find((f) => f.id === id) ?? FONT_OPTIONS[0];
}
