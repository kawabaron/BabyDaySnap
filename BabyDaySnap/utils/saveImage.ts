// ============================================================
// BabyDaySnap - 画像保存ユーティリティ
// ============================================================
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { Alert, Linking } from "react-native";
import { v4 as uuidv4 } from "uuid";
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
): Promise<AppLibraryItem> {
    const dirPath = await getLibraryDirPath();
    const id = uuidv4();
    const destUri = `${dirPath}${id}.jpg`;

    // コピー
    await FileSystem.copyAsync({
        from: renderedUri,
        to: destUri
    });

    const item: AppLibraryItem = {
        id,
        createdAtMs: Date.now(),
        source: photoSource.source,
        shotDateISO: computed.shotDateISO,
        ageDays: computed.ageDays,
        templateId: editorOptions.templateId,
        dateColorHex: editorOptions.dateColorHex,
        commentText: editorOptions.commentText,
        renderedFileUri: destUri,
        width: imageWidth,
        height: imageHeight,
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

/**
 * アプリ内ライブラリから削除
 */
export async function deleteFromAppLibrary(item: AppLibraryItem): Promise<void> {
    try {
        if (item.renderedFileUri) {
            await FileSystem.deleteAsync(item.renderedFileUri, { idempotent: true });
        }
        if (item.previewFileUri) {
            await FileSystem.deleteAsync(item.previewFileUri, { idempotent: true });
        }
    } catch (e) {
        console.warn("deleteFromAppLibrary error:", e);
    }
}
