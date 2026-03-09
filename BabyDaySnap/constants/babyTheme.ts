// ============================================================
// BabyDaySnap - テーマカラープリセット
// ============================================================
import i18n from "@/lib/i18n";

export type ThemeColorPreset = {
    hex: string;
    label: string;
    /** 薄い背景色 */
    background: string;
    /** ボタン等の強調色 */
    accent: string;
    /** カードの背景 */
    light: string;
    /** 影・シャドウ色 */
    shadow: string;
};

/**
 * テーマカラープリセット（6色のパステルカラー）
 * UI全体が美しく保たれるよう、淡くかわいい色のみを用意。
 */
export const THEME_COLOR_PRESETS: ThemeColorPreset[] = [
    {
        hex: "#FFB5C2",
        get label() { return i18n.t("colors.pink"); },
        background: "#FFF5F7",
        accent: "#FF8FA3",
        light: "#FFF0F3",
        shadow: "#FF8FA3",
    },
    {
        hex: "#C5B9F2",
        get label() { return i18n.t("colors.lavender"); },
        background: "#F5F3FF",
        accent: "#A78BFA",
        light: "#EDE9FE",
        shadow: "#A78BFA",
    },
    {
        hex: "#A8E6CF",
        get label() { return i18n.t("colors.mint"); },
        background: "#F0FFF4",
        accent: "#6BCB9A",
        light: "#E6FFF0",
        shadow: "#6BCB9A",
    },
    {
        hex: "#A8D8F0",
        get label() { return i18n.t("colors.sky"); },
        background: "#F0F8FF",
        accent: "#64B5F6",
        light: "#E3F2FD",
        shadow: "#64B5F6",
    },
    {
        hex: "#FFDAB9",
        get label() { return i18n.t("colors.peach"); },
        background: "#FFF8F0",
        accent: "#FFB07C",
        light: "#FFF3E8",
        shadow: "#FFB07C",
    },
    {
        hex: "#FFF3B0",
        get label() { return i18n.t("colors.lemon"); },
        background: "#FFFDF0",
        accent: "#FFD54F",
        light: "#FFFDE7",
        shadow: "#FFD54F",
    },
];

/** hex値からプリセットを取得（見つからなければデフォルトのピンク） */
export function getThemePreset(hex: string): ThemeColorPreset {
    return THEME_COLOR_PRESETS.find((p) => p.hex === hex) || THEME_COLOR_PRESETS[0];
}

/** 複数人選択時のニュートラルカラー */
export const NEUTRAL_THEME: ThemeColorPreset = {
    hex: "#FF8FA3",
    get label() { return i18n.t("colors.neutral"); },
    background: "#FFF5F7",
    accent: "#FF8FA3",
    light: "#FFF0F3",
    shadow: "#FF8FA3",
};
