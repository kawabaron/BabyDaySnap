// ============================================================
// BabyDaySnap - 画像保存ユーティリティ
// ============================================================
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { Alert, Linking } from "react-native";
import type { AppLibraryItem, EditorOptions, ComputedInfo, PhotoSource } from "@/types";

/** ライブラリディレクトリを取得（無ければ作成） */
async function getLibraryDirPath(): Promise<string> {
    const dirPath = `${FileSystem.documentDirectory}library/`;
    const info = await FileSystem.getInfoAsync(dirPath);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }
    return dirPath;
}

/**
 * アプリ内ライブラリに保存
 * renderedUri (一時ファイル) を library ディレクトリにコピーし、
 * AppLibraryItem を返す
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

    // コピー
    await FileSystem.copyAsync({
        from: renderedUri,
        to: destUri
    });

    // 再編集時（existingIdがある）は、すでに originalDestUri に原本が保存されている状態なので
    // 上書きコピー処理は完全にスキップして原本を守る
    if (!existingId) {
        // 新規作成時のみ元画像を保存する
        const info = await FileSystem.getInfoAsync(photoSource.uri);
        if (info.exists) {
            await FileSystem.copyAsync({
                from: photoSource.uri,
                to: originalDestUri
            });
        } else {
            console.warn("Original photo source does not exist:", photoSource.uri);
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
    };

    return item;
}

/**
 * iPhone 写真ライブラリに保存
 * 権限がなければリクエスト。拒否された場合は設定画面へ誘導。
 */
export async function saveToPhotoLibrary(uri: string): Promise<boolean> {
    try {
        const { status } = await MediaLibrary.requestPermissionsAsync();

        if (status !== "granted") {
            Alert.alert(
                "写真へのアクセスが必要です",
                "写真を保存するためにアクセスを許可してください。設定アプリから許可できます。",
                [
                    { text: "キャンセル", style: "cancel" },
                    { text: "設定を開く", onPress: () => Linking.openSettings() },
                ],
            );
            return false;
        }

        await MediaLibrary.createAssetAsync(uri);
        return true;
    } catch (e) {
        console.error("saveToPhotoLibrary error:", e);
        Alert.alert("エラー", "写真の保存に失敗しました。");
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
    } catch (e) {
        console.warn("deleteFromAppLibrary error:", e);
    }
}
