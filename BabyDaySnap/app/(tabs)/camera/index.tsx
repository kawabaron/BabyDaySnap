import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppState } from "@/context/AppContext";
import { getShotDateISO, calcAgeDays } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PhotoSource } from "@/types";

export default function CameraScreen() {
    const dispatch = useAppDispatch();
    const { settings } = useAppState();
    const router = useRouter();

    const navigateToEditor = (photo: PhotoSource) => {
        const shotDateISO = getShotDateISO(photo.source, photo.creationTimeMs);
        const ageDays = calcAgeDays(settings.birthDateISO!, shotDateISO);

        dispatch({ type: "RESET_EDITOR" });
        dispatch({ type: "SET_PHOTO", payload: photo });
        dispatch({
            type: "SET_COMPUTED",
            payload: { shotDateISO, ageDays },
        });
        router.replace("/(tabs)/camera/editor");
    };

    // エディタ表示用のプレビュー画像のみ生成（元画像はそのまま保持して最大画質保存に使う）
    const createPreviewImage = async (uri: string, width: number, height: number) => {
        const MAX_PREVIEW = 1200;  // エディタ表示用（画質維持しつつメモリ節約）

        // 元画像がプレビューサイズ以下ならそのまま使う（劣化なし）
        if (width <= MAX_PREVIEW && height <= MAX_PREVIEW) {
            return uri;
        }

        const scale = MAX_PREVIEW / Math.max(width, height);
        const preW = Math.round(width * scale);
        const preH = Math.round(height * scale);
        const res = await manipulateAsync(
            uri,
            [{ resize: { width: preW, height: preH } }],
            { compress: 1.0, format: SaveFormat.JPEG }
        );
        return res.uri;
    };

    // iPhone標準カメラで撮影（Deep Fusion, Smart HDR 等のApple画像処理パイプライン適用）
    const handleCapture = async () => {
        try {
            // カメラ権限リクエスト
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("カメラへのアクセス", "撮影にはカメラへのアクセス許可が必要です。\n設定アプリから許可してください。");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 1,
                exif: true,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                console.log(`[CAMERA] 撮影完了: ${asset.width}x${asset.height}, uri=${asset.uri.substring(0, 80)}`);
                const previewUri = await createPreviewImage(asset.uri, asset.width, asset.height);

                const photo: PhotoSource = {
                    uri: asset.uri,
                    previewUri,
                    width: asset.width,
                    height: asset.height,
                    source: "camera",
                    creationTimeMs: asset.exif?.DateTimeOriginal
                        ? new Date(asset.exif.DateTimeOriginal as string).getTime()
                        : Date.now(),
                };
                navigateToEditor(photo);
            }
        } catch (e) {
            console.error("Capture error:", e);
            Alert.alert("エラー", `撮影に失敗しました: ${e instanceof Error ? e.message : String(e)}`);
        }
    };

    // iPhone写真ライブラリから取り込み
    const handleImport = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 1,
                exif: true,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const previewUri = await createPreviewImage(asset.uri, asset.width, asset.height);

                const photo: PhotoSource = {
                    uri: asset.uri,
                    previewUri,
                    width: asset.width,
                    height: asset.height,
                    source: "import",
                    creationTimeMs: asset.exif?.DateTimeOriginal
                        ? new Date(asset.exif.DateTimeOriginal as string).getTime()
                        : Date.now(),
                };
                navigateToEditor(photo);
            }
        } catch (e) {
            console.error("Import error:", e);
            Alert.alert("エラー", "写真の取り込みに失敗しました。");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* ヘッダー */}
                <View style={styles.headerArea}>
                    <Ionicons name="add-circle" size={64} color="#FF8FA3" />
                    <Text style={styles.title}>新しく作る</Text>
                </View>

                {/* ボタンエリア */}
                <View style={styles.buttonArea}>
                    <TouchableOpacity
                        style={styles.captureButton}
                        onPress={handleCapture}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="camera-outline" size={32} color="#FFF" />
                        <Text style={styles.captureButtonText}>カメラで撮影</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.importButton}
                        onPress={handleImport}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="images-outline" size={32} color="#FF8FA3" />
                        <Text style={styles.importButtonText}>写真から選ぶ</Text>
                    </TouchableOpacity>
                </View>

                {/* 説明 (削除) */}
                <View style={{ height: 32 }} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    headerArea: {
        alignItems: "center",
        marginBottom: 48,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#333",
        marginTop: 16,
    },
    subtitle: {
        fontSize: 15,
        color: "#999",
        textAlign: "center",
        lineHeight: 22,
        marginTop: 8,
    },
    buttonArea: {
        width: "100%",
        gap: 16,
    },
    captureButton: {
        backgroundColor: "#FF8FA3",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 28,
        borderRadius: 24,
        gap: 16,
        shadowColor: "#FF8FA3",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    captureButtonText: {
        color: "#FFF",
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    importButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 28,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: "#FF8FA3",
        gap: 16,
    },
    importButtonText: {
        color: "#FF8FA3",
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    hint: {
        fontSize: 13,
        color: "#CCC",
        textAlign: "center",
        lineHeight: 20,
        marginTop: 32,
    },
});
