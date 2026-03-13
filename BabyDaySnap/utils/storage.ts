// ============================================================
// BabyDaySnap - AsyncStorage 郢晢ｽｦ郢晢ｽｼ郢昴・縺・ｹ晢ｽｪ郢昴・縺・
// ============================================================
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserSettings, AppLibraryItem, BabyProfile } from "@/types";

const KEYS = {
    SETTINGS: "@babydaysnap/settings",
    LIBRARY: "@babydaysnap/library",
    BABIES: "@babydaysnap/babies",
} as const;

// --- 郢昴・繝ｵ郢ｧ・ｩ郢晢ｽｫ郢昜ｺ･ﾂ・､ ---
export const DEFAULT_SETTINGS: UserSettings = {
    hasOnboarded: false,
    birthDateISO: null,
    babyName: "",
    defaultTemplateId: "tpl_noframe_full",
    defaultFontId: "font_standard",
    defaultShowDate: true,
    defaultShowName: true,
    defaultShowAge: true,
    defaultAgeFormat: "days",
    lastTemplateId: "tpl_noframe_full",
    lastFontId: "font_standard",
    lastDateColorHex: "#FFFFFF",
    policyUrls: {
        termsUrl: "https://kawabaron.github.io/BabyDaySnap/terms.html",
        privacyUrl: "https://kawabaron.github.io/BabyDaySnap/privacy.html",
        contactUrl: "https://kawabaron.github.io/BabyDaySnap/contact.html",
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
            // 郢晄ｧｭ縺・ｹｧ・ｰ郢晢ｽｬ郢晢ｽｼ郢ｧ・ｷ郢晢ｽｧ郢晢ｽｳ: babyIds 邵ｺ讙寂伯邵ｺ繝ｻ驥瑚氛蛟･縺・ｹｧ・､郢昴・ﾎ堤ｸｺ・ｫ邵ｺ・ｯ驕ｨ・ｺ鬩滓ｦ翫・郢ｧ蜑・ｽｻ蛟・ｽｸ繝ｻ
            // (陞ｳ貊・怙邵ｺ・ｮID邵ｺ・ｮ闔牙・ｽｸ蠑ｱ繝ｻ AppContext 陋幢ｽｴ邵ｺ・ｧbabies郢晢ｽｭ郢晢ｽｼ郢晉甥・ｾ蠕娯・髯ｦ蠕娯鴬)
            return items.map((item) => ({
                ...item,
                babyIds: item.babyIds || [],
                ageFormat: item.ageFormat || "days",
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
