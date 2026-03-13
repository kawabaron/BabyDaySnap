// ============================================================
// BabyDaySnap - 騾包ｽｻ陷剃ｸ茨ｽｿ譎擾ｽｭ蛟･ﾎ倡ｹ晢ｽｼ郢昴・縺・ｹ晢ｽｪ郢昴・縺・
// ============================================================
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { Alert, Linking } from "react-native";
import type { AppLibraryItem, EditorOptions, ComputedInfo, PhotoSource } from "@/types";

/** 郢晢ｽｩ郢ｧ・､郢晄じﾎ帷ｹ晢ｽｪ郢昴・縺・ｹ晢ｽｬ郢ｧ・ｯ郢晏現ﾎ懃ｹｧ雋槫徐陟墓圜・ｼ閧ｲ笏檎ｸｺ莉｣・檎ｸｺ・ｰ闖ｴ諛医・繝ｻ繝ｻ*/
async function getLibraryDirPath(): Promise<string> {
    const dirPath = `${FileSystem.documentDirectory}library/`;
    const info = await FileSystem.getInfoAsync(dirPath);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
    return dirPath;
}

/**
 * 郢ｧ・｢郢晏干ﾎ懆怙繝ｻﾎ帷ｹｧ・､郢晄じﾎ帷ｹ晢ｽｪ邵ｺ・ｫ闖ｫ譎擾ｽｭ繝ｻ
 * renderedUri (闕ｳﾂ隴弱ｅ繝ｵ郢ｧ・｡郢ｧ・､郢晢ｽｫ) 郢ｧ繝ｻlibrary 郢昴・縺・ｹ晢ｽｬ郢ｧ・ｯ郢晏現ﾎ懃ｸｺ・ｫ郢ｧ・ｳ郢晄鱒繝ｻ邵ｺ蜉ｱﾂ繝ｻ
 * AppLibraryItem 郢ｧ螳夲ｽｿ譁絶・
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

    // 郢ｧ・ｳ郢晄鱒繝ｻ
    await FileSystem.copyAsync({
        from: renderedUri,
        to: destUri
    });

    // 陷蜥ｲ・ｷ・ｨ鬮ｮ繝ｻ蜃ｾ繝ｻ繝ｻxistingId邵ｺ蠕娯旺郢ｧ蜈ｷ・ｼ蟲ｨ繝ｻ邵ｲ竏壺・邵ｺ・ｧ邵ｺ・ｫ originalDestUri 邵ｺ・ｫ陷ｴ貊捺た邵ｺ蠕｡・ｿ譎擾ｽｭ蛟･・・ｹｧ蠕娯ｻ邵ｺ繝ｻ・玖ｿ･・ｶ隲ｷ荵昶・邵ｺ・ｮ邵ｺ・ｧ
    // 闕ｳ鬆大ｶ檎ｸｺ髦ｪ縺慕ｹ晄鱒繝ｻ陷・ｽｦ騾・・繝ｻ陞ｳ謔溘・邵ｺ・ｫ郢ｧ・ｹ郢ｧ・ｭ郢昴・繝ｻ邵ｺ蜉ｱ窶ｻ陷ｴ貊捺た郢ｧ雋橸ｽｮ蛹ｻ・・
    if (!existingId) {
        // 隴・ｽｰ髫穂ｸ茨ｽｽ諛医・隴弱ｅ繝ｻ邵ｺ・ｿ陷医・蛻､陷剃ｸ奇ｽ定将譎擾ｽｭ蛟･笘・ｹｧ繝ｻ
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
        showDate: editorOptions.showDate,
        showName: editorOptions.showName,
        showAge: editorOptions.showAge,
        ageFormat: editorOptions.ageFormat,
    };

    return item;
}

/**
 * iPhone 陷蜥乗ｄ郢晢ｽｩ郢ｧ・､郢晄じﾎ帷ｹ晢ｽｪ邵ｺ・ｫ闖ｫ譎擾ｽｭ繝ｻ
 * 隶難ｽｩ鬮ｯ闊娯ｲ邵ｺ・ｪ邵ｺ莉｣・檎ｸｺ・ｰ郢晢ｽｪ郢ｧ・ｯ郢ｧ・ｨ郢ｧ・ｹ郢晏現ﾂ繧域侠陷ｷ・ｦ邵ｺ霈費ｽ檎ｸｺ貅ｷ・ｰ・ｴ陷ｷ蛹ｻ繝ｻ髫ｪ・ｭ陞ｳ螟ょ愛鬮ｱ・｢邵ｺ・ｸ髫ｱ莨懶ｽｰ蠑ｱﾂ繝ｻ
 */
export async function saveToPhotoLibrary(uri: string): Promise<boolean> {
    try {
        const { status } = await MediaLibrary.requestPermissionsAsync();

        if (status !== "granted") {
            Alert.alert(
                "陷蜥乗ｄ邵ｺ・ｸ邵ｺ・ｮ郢ｧ・｢郢ｧ・ｯ郢ｧ・ｻ郢ｧ・ｹ邵ｺ謔滂ｽｿ繝ｻ・ｦ竏壹堤ｸｺ繝ｻ,
                "陷蜥乗ｄ郢ｧ蜑・ｽｿ譎擾ｽｭ蛟･笘・ｹｧ荵昶螺郢ｧ竏壺・郢ｧ・｢郢ｧ・ｯ郢ｧ・ｻ郢ｧ・ｹ郢ｧ螳夲ｽｨ・ｱ陷ｿ・ｯ邵ｺ蜉ｱ窶ｻ邵ｺ荳岩味邵ｺ霈費ｼ樒ｸｲ繧奇ｽｨ・ｭ陞ｳ螢ｹ縺・ｹ晏干ﾎ懃ｸｺ荵晢ｽ蛾坎・ｱ陷ｿ・ｯ邵ｺ・ｧ邵ｺ髦ｪ竏ｪ邵ｺ蜷ｶﾂ繝ｻ,
                [
                    { text: "郢ｧ・ｭ郢晢ｽ｣郢晢ｽｳ郢ｧ・ｻ郢晢ｽｫ", style: "cancel" },
                    { text: "髫ｪ・ｭ陞ｳ螢ｹ・帝ｫ｢荵晢ｿ･", onPress: () => Linking.openSettings() },
                ],
            );
            return false;
        }

        await MediaLibrary.createAssetAsync(uri);
        return true;
    } catch {
        Alert.alert("郢ｧ・ｨ郢晢ｽｩ郢晢ｽｼ", "陷蜥乗ｄ邵ｺ・ｮ闖ｫ譎擾ｽｭ蛟･竊楢棔・ｱ隰ｨ蜉ｱ・邵ｺ・ｾ邵ｺ蜉ｱ笳・ｸｲ繝ｻ);
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
