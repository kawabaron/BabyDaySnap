import { Linking } from "react-native";
import * as StoreReview from "expo-store-review";

export async function requestAutoReview(): Promise<boolean> {
    try {
        const available = await StoreReview.isAvailableAsync();
        if (!available) {
            return false;
        }

        await StoreReview.requestReview();
        return true;
    } catch {
        return false;
    }
}

export async function requestManualReview(): Promise<boolean> {
    try {
        if (await StoreReview.hasAction()) {
            await StoreReview.requestReview();
            return true;
        }

        const storeUrl = StoreReview.storeUrl();
        if (storeUrl) {
            await Linking.openURL(storeUrl);
            return true;
        }

        return false;
    } catch {
        return false;
    }
}
