import type { AppLibraryItem, BabyProfile, UserSettings } from "@/types";
import {
    loadBabiesFromDatabase,
    loadLibraryFromDatabase,
    loadSettingsFromDatabase,
    saveBabiesToDatabase,
    saveLibraryToDatabase,
    saveSettingsToDatabase,
} from "@/lib/database";
import { DEFAULT_SETTINGS } from "@/lib/persistence";

export { DEFAULT_SETTINGS };

export async function loadSettings(): Promise<UserSettings> {
    try {
        return await loadSettingsFromDatabase();
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
    try {
        await saveSettingsToDatabase(settings);
    } catch {
    }
}

export async function loadLibrary(): Promise<AppLibraryItem[]> {
    try {
        return await loadLibraryFromDatabase();
    } catch {
        return [];
    }
}

export async function saveLibrary(library: AppLibraryItem[]): Promise<void> {
    try {
        await saveLibraryToDatabase(library);
    } catch {
    }
}

export async function loadBabies(): Promise<BabyProfile[]> {
    try {
        return await loadBabiesFromDatabase();
    } catch {
        return [];
    }
}

export async function saveBabies(babies: BabyProfile[]): Promise<void> {
    try {
        await saveBabiesToDatabase(babies);
    } catch {
    }
}
