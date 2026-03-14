// ============================================================
// BabyDaySnap - 鬨ｾ蛹・ｽｽ・ｻ髯ｷ蜑・ｽｸ闌ｨ・ｽ・ｿ隴取得・ｽ・ｭ陋滂ｽ･・主｡・ｹ譎｢・ｽ・ｼ驛｢譏ｴ繝ｻ邵ｺ繝ｻ・ｹ譎｢・ｽ・ｪ驛｢譏ｴ繝ｻ邵ｺ繝ｻ
// ============================================================
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { Alert, Linking } from "react-native";
import i18n from "@/lib/i18n";
import type { AppLibraryItem, EditorOptions, ComputedInfo, PhotoSource } from "@/types";

/** 驛｢譎｢・ｽ・ｩ驛｢・ｧ繝ｻ・､驛｢譎・§・主ｸｷ・ｹ譎｢・ｽ・ｪ驛｢譏ｴ繝ｻ邵ｺ繝ｻ・ｹ譎｢・ｽ・ｬ驛｢・ｧ繝ｻ・ｯ驛｢譎冗樟・取㏍・ｹ・ｧ髮区ｧｫ蠕宣辧蠅灘惧繝ｻ・ｼ髢ｧ・ｲ隨乗ｪ趣ｽｸ・ｺ闔会ｽ｣繝ｻ讙趣ｽｸ・ｺ繝ｻ・ｰ髣厄ｽｴ隲帛現繝ｻ郢晢ｽｻ郢晢ｽｻ*/
async function getLibraryDirPath(): Promise<string> {
    const dirPath = `${FileSystem.documentDirectory}library/`;
    const info = await FileSystem.getInfoAsync(dirPath);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
    return dirPath;
}

/**
 * 驛｢・ｧ繝ｻ・｢驛｢譎丞ｹｲ・取㊥諤咏ｹ晢ｽｻ・主ｸｷ・ｹ・ｧ繝ｻ・､驛｢譎・§・主ｸｷ・ｹ譎｢・ｽ・ｪ驍ｵ・ｺ繝ｻ・ｫ髣厄ｽｫ隴取得・ｽ・ｭ郢晢ｽｻ
 * renderedUri (髣包ｽｳ・つ髫ｴ蠑ｱ・・ｹ晢ｽｵ驛｢・ｧ繝ｻ・｡驛｢・ｧ繝ｻ・､驛｢譎｢・ｽ・ｫ) 驛｢・ｧ郢晢ｽｻlibrary 驛｢譏ｴ繝ｻ邵ｺ繝ｻ・ｹ譎｢・ｽ・ｬ驛｢・ｧ繝ｻ・ｯ驛｢譎冗樟・取㏍・ｸ・ｺ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｳ驛｢譎・ｱ堤ｹ晢ｽｻ驍ｵ・ｺ陷会ｽｱ・つ郢晢ｽｻ
 * AppLibraryItem 驛｢・ｧ陞ｳ螟ｲ・ｽ・ｿ隴∫ｵｶ繝ｻ
 */
export async function saveToAppLibrary(
    renderedUri: string,
    photoSource: PhotoSource,
    computed: ComputedInfo,
    editorOptions: EditorOptions,
    imageWidth: number,
    imageHeight: number,
    babyIds: string[],
    existingId?: string | null,
): Promise<AppLibraryItem> {
    const dirPath = await getLibraryDirPath();
    const id = existingId || (Date.now().toString(36) + Math.random().toString(36).substring(2));
    const destUri = `${dirPath}${id}.jpg`;
    const originalDestUri = `${dirPath}${id}_original.jpg`;

    // 驛｢・ｧ繝ｻ・ｳ驛｢譎・ｱ堤ｹ晢ｽｻ
    await FileSystem.copyAsync({
        from: renderedUri,
        to: destUri
    });

    // 髯ｷﾂ陷･・ｲ繝ｻ・ｷ繝ｻ・ｨ鬯ｮ・ｮ郢晢ｽｻ陷・ｽｾ郢晢ｽｻ郢晢ｽｻxistingId驍ｵ・ｺ陟募ｨｯ譌ｺ驛｢・ｧ陷茨ｽｷ繝ｻ・ｼ陝ｲ・ｨ郢晢ｽｻ驍ｵ・ｲ遶丞｣ｺ繝ｻ驍ｵ・ｺ繝ｻ・ｧ驍ｵ・ｺ繝ｻ・ｫ originalDestUri 驍ｵ・ｺ繝ｻ・ｫ髯ｷ・ｴ雋頑瑳縺滄し・ｺ陟包ｽ｡繝ｻ・ｿ隴取得・ｽ・ｭ陋滂ｽ･繝ｻ繝ｻ・ｹ・ｧ陟募ｨｯﾂ・ｻ驍ｵ・ｺ郢晢ｽｻ繝ｻ邇厄ｽｿ・･繝ｻ・ｶ髫ｲ・ｷ闕ｵ譏ｶ繝ｻ驍ｵ・ｺ繝ｻ・ｮ驍ｵ・ｺ繝ｻ・ｧ
    // 髣包ｽｳ鬯・､ｧ・ｶ讙趣ｽｸ・ｺ鬮ｦ・ｪ邵ｺ諷包ｽｹ譎・ｱ堤ｹ晢ｽｻ髯ｷ繝ｻ・ｽ・ｦ鬨ｾ繝ｻ繝ｻ郢晢ｽｻ髯橸ｽｳ隰疲ｺ倥・驍ｵ・ｺ繝ｻ・ｫ驛｢・ｧ繝ｻ・ｹ驛｢・ｧ繝ｻ・ｭ驛｢譏ｴ繝ｻ郢晢ｽｻ驍ｵ・ｺ陷会ｽｱ遯ｶ・ｻ髯ｷ・ｴ雋頑瑳縺滄Δ・ｧ髮区ｩｸ・ｽ・ｮ陋ｹ・ｻ繝ｻ繝ｻ
    if (!existingId) {
        // 髫ｴ繝ｻ・ｽ・ｰ鬮ｫ遨ゑｽｸ闌ｨ・ｽ・ｽ隲帛現繝ｻ髫ｴ蠑ｱ・・ｹ晢ｽｻ驍ｵ・ｺ繝ｻ・ｿ髯ｷ蛹ｻ繝ｻ陋ｻ・､髯ｷ蜑・ｽｸ螂・ｽｽ螳壼ｰ・ｭ取得・ｽ・ｭ陋滂ｽ･隨倥・・ｹ・ｧ郢晢ｽｻ
        const info = await FileSystem.getInfoAsync(photoSource.uri);
        if (info.exists) {
            await FileSystem.copyAsync({
                from: photoSource.uri,
                to: originalDestUri
            });
        }
    }

    const item: AppLibraryItem = {
        id,
        babyIds,
        createdAtMs: Date.now(),
        source: photoSource.source,
        originalFileUri: originalDestUri,
        renderedFileUri: destUri,
        width: imageWidth,
        height: imageHeight,
        originalWidth: photoSource.width,
        originalHeight: photoSource.height,
        shotDateISO: computed.shotDateISO,
        ageDays: computed.ageDays,
        templateId: editorOptions.templateId,
        dateColorHex: editorOptions.dateColorHex,
        commentText: editorOptions.commentText,
        fontId: editorOptions.fontId,
        filterId: editorOptions.filterId,
        showDate: editorOptions.showDate,
        showName: editorOptions.showName,
        showAge: editorOptions.showAge,
        ageFormat: editorOptions.ageFormat,
    };

    return item;
}

/**
 * iPhone 髯ｷﾂ陷･荵暦ｽ・Δ譎｢・ｽ・ｩ驛｢・ｧ繝ｻ・､驛｢譎・§・主ｸｷ・ｹ譎｢・ｽ・ｪ驍ｵ・ｺ繝ｻ・ｫ髣厄ｽｫ隴取得・ｽ・ｭ郢晢ｽｻ
 * 髫ｶ髮｣・ｽ・ｩ鬯ｮ・ｯ髣雁ｨｯﾂ・ｲ驍ｵ・ｺ繝ｻ・ｪ驍ｵ・ｺ闔会ｽ｣繝ｻ讙趣ｽｸ・ｺ繝ｻ・ｰ驛｢譎｢・ｽ・ｪ驛｢・ｧ繝ｻ・ｯ驛｢・ｧ繝ｻ・ｨ驛｢・ｧ繝ｻ・ｹ驛｢譎冗樟・つ郢ｧ蝓滉ｾ髯ｷ・ｷ繝ｻ・ｦ驍ｵ・ｺ髴郁ｲｻ・ｽ讙趣ｽｸ・ｺ雋・ｽｷ繝ｻ・ｰ繝ｻ・ｴ髯ｷ・ｷ陋ｹ・ｻ郢晢ｽｻ鬮ｫ・ｪ繝ｻ・ｭ髯橸ｽｳ陞溘ｇ諢幃ｬｮ・ｱ繝ｻ・｢驍ｵ・ｺ繝ｻ・ｸ鬮ｫ・ｱ闔ｨ諛ｶ・ｽ・ｰ陟托ｽｱ・つ郢晢ｽｻ
 */
export async function saveToPhotoLibrary(uri: string): Promise<boolean> {
    try {
        const { status } = await MediaLibrary.requestPermissionsAsync();

        if (status !== "granted") {
            Alert.alert(
                i18n.t("photoLibrary.permissionTitle"),
                i18n.t("photoLibrary.permissionMessage"),
                [
                    { text: i18n.t("common.cancel"), style: "cancel" },
                    { text: i18n.t("photoLibrary.openSettings"), onPress: () => Linking.openSettings() },
                ],
            );
            return false;
        }

        await MediaLibrary.createAssetAsync(uri);
        return true;
    } catch {
        Alert.alert(i18n.t("photoLibrary.saveFailedTitle"), i18n.t("photoLibrary.saveFailedMessage"));
        return false;
    }
}

export async function deleteFromAppLibrary(item: AppLibraryItem): Promise<void> {
    try {
        if (item.renderedFileUri) {
            await FileSystem.deleteAsync(item.renderedFileUri, { idempotent: true });
        }
        if (item.originalFileUri) {
            await FileSystem.deleteAsync(item.originalFileUri, { idempotent: true });
        }
    } catch {
    }
}
