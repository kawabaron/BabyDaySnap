// ============================================================
// BabyDaySnap - AsyncStorage ユーティリティ
// ============================================================
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserSettings, AppLibraryItem, BabyProfile } from "@/types";

const KEYS = {
    SETTINGS: "@babydaysnap/settings",
    LIBRARY: "@babydaysnap/library",
    BABIES: "@babydaysnap/babies",
} as const;

// --- デフォルト値 ---
export const DEFAULT_SETTINGS: UserSettings = {
    hasOnboarded: false,
    birthDateISO: null,
    babyName: "",
    defaultTemplateId: "tpl_noframe_full",
    defaultFontId: "font_standard",
    defaultShowDate: true,
    defaultShowName: true,
    defaultShowAge: true,
    lastTemplateId: "tpl_noframe_full",
    lastFontId: "font_standard",
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
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
    try {
        await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
    }
}

// --- Library ---
export async function loadLibrary(): Promise<AppLibraryItem[]> {
    try {
        const raw = await AsyncStorage.getItem(KEYS.LIBRARY);
        if (raw) {
            const items: AppLibraryItem[] = JSON.parse(raw);
            // マイグレーション: babyIds が無い既存アイテムには空配列を付与
            // (実際のIDの付与は AppContext 側でbabiesロード後に行う)
            return items.map((item) => ({
                ...item,
                babyIds: item.babyIds || [],
            }));
        }
        return [];
    } catch {
        return [];
    }
}

export async function saveLibrary(library: AppLibraryItem[]): Promise<void> {
    try {
        await AsyncStorage.setItem(KEYS.LIBRARY, JSON.stringify(library));
    } catch {
    }
}

// --- Babies ---
export async function loadBabies(): Promise<BabyProfile[]> {
    try {
        const raw = await AsyncStorage.getItem(KEYS.BABIES);
        if (raw) {
            return JSON.parse(raw);
        }
        return [];
    } catch {
        return [];
    }
}

export async function saveBabies(babies: BabyProfile[]): Promise<void> {
    try {
        await AsyncStorage.setItem(KEYS.BABIES, JSON.stringify(babies));
    } catch {
    }
}
