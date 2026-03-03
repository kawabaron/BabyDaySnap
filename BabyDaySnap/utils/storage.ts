// ============================================================
// BabyDaySnap - AsyncStorage ユーティリティ
// ============================================================
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserSettings, AppLibraryItem } from "@/types";

const KEYS = {
    SETTINGS: "@babydaysnap/settings",
    LIBRARY: "@babydaysnap/library",
} as const;

// --- デフォルト値 ---
export const DEFAULT_SETTINGS: UserSettings = {
    hasOnboarded: false,
    birthDateISO: null,
    lastTemplateId: "tpl_noframe_full",
    lastDateColorHex: "#FFFFFF",
    policyUrls: {
        termsUrl: "https://example.com/terms",
        privacyUrl: "https://example.com/privacy",
        contactUrl: "https://example.com/contact",
    },
};

// --- Settings ---
export async function loadSettings(): Promise<UserSettings> {
    try {
        const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
        if (raw) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        }
        return DEFAULT_SETTINGS;
    } catch (e) {
        console.warn("loadSettings error:", e);
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
    try {
        await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
        console.warn("saveSettings error:", e);
    }
}

// --- Library ---
export async function loadLibrary(): Promise<AppLibraryItem[]> {
    try {
        const raw = await AsyncStorage.getItem(KEYS.LIBRARY);
        if (raw) {
            return JSON.parse(raw);
        }
        return [];
    } catch (e) {
        console.warn("loadLibrary error:", e);
        return [];
    }
}

export async function saveLibrary(library: AppLibraryItem[]): Promise<void> {
    try {
        await AsyncStorage.setItem(KEYS.LIBRARY, JSON.stringify(library));
    } catch (e) {
        console.warn("saveLibrary error:", e);
    }
}
