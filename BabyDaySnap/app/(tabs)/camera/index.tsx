import { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
    Pressable,
    ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppState, useActiveBaby } from "@/context/AppContext";
import { getShotDateISO, calcAgeDays } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { getThemePreset, NEUTRAL_THEME } from "@/constants/babyTheme";
import type { PhotoSource } from "@/types";
import i18n from "@/lib/i18n";
import { AppHeader } from "@/components/AppHeader";

export default function CameraScreen() {
    const dispatch = useAppDispatch();
    const { settings, activeBabyId, babies } = useAppState();
    const activeBaby = useActiveBaby();
    const router = useRouter();

    const [showBabyPicker, setShowBabyPicker] = useState(false);

    // テーマカラー取得
    const theme = activeBaby ? getThemePreset(activeBaby.themeColorHex) : NEUTRAL_THEME;

    const navigateToEditor = (photo: PhotoSource) => {
        // アクティブな赤ちゃんの誕生日を使って生後日数を計算
        const birthDate = activeBaby?.birthDateISO || settings.birthDateISO;
        if (!birthDate) {
            Alert.alert(i18n.t("editor.missingBirthDate").replace("。", ""), i18n.t("editor.missingBirthDate"));
            return;
        }

        const shotDateISO = getShotDateISO(photo.source, photo.creationTimeMs);
        const ageDays = calcAgeDays(birthDate, shotDateISO);

        dispatch({ type: "RESET_EDITOR" });
        dispatch({ type: "SET_PHOTO", payload: photo });
        dispatch({
            type: "SET_COMPUTED",
            payload: { shotDateISO, ageDays },
        });
        // 保存先をアクティブな赤ちゃんに設定
        if (activeBabyId) {
            dispatch({ type: "SET_TARGET_BABY_IDS", payload: [activeBabyId] });
        }
        router.push("/(tabs)/camera/editor");
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
                Alert.alert(i18n.t("camera.cameraPermissionTitle"), i18n.t("camera.cameraPermissionMsg"));
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
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
                    source: "camera",
                    creationTimeMs: asset.exif?.DateTimeOriginal
                        ? new Date(asset.exif.DateTimeOriginal as string).getTime()
                        : Date.now(),
                };
                navigateToEditor(photo);
            }
        } catch (e) {
            Alert.alert("Error", i18n.t("camera.captureFailed", { error: e instanceof Error ? e.message : String(e) }));
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
        } catch {
            Alert.alert("Error", i18n.t("camera.importFailed"));
        }
    };

    const handleSelectBaby = (id: string) => {
        dispatch({ type: "SET_ACTIVE_BABY", payload: id });
        setShowBabyPicker(false);
    };

    return (
        <SafeAreaView style={styles.screen} edges={["top"]}>
            <AppHeader
                title={i18n.t("camera.headerTitle")}
                rightSlot={activeBaby ? (
                    <TouchableOpacity
                        style={styles.babyBadge}
                        onPress={() => setShowBabyPicker(true)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.babyBadgeDot, { backgroundColor: theme.accent }]} />
                        <Text style={[styles.babyBadgeText, { color: theme.accent }]}>
                            {activeBaby.name}
                        </Text>
                        <Ionicons name="chevron-down" size={12} color={theme.accent} style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                ) : null}
            />
            <View style={[styles.content, { backgroundColor: theme.background }]}>
                {/* ヘッダー */}
                <View style={styles.headerArea}>
                    <Ionicons name="add-circle" size={64} color={theme.accent} />
                </View>

                {/* ボタンエリア */}
                <View style={styles.buttonArea}>
                    <TouchableOpacity
                        style={[styles.captureButton, { backgroundColor: theme.accent, shadowColor: theme.shadow }]}
                        onPress={handleCapture}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="camera-outline" size={32} color="#FFF" />
                        <Text style={styles.captureButtonText}>{i18n.t("camera.captureButton")}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.importButton, { borderColor: theme.accent }]}
                        onPress={handleImport}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="images-outline" size={32} color={theme.accent} />
                        <Text style={[styles.importButtonText, { color: theme.accent }]}>{i18n.t("camera.importButton")}</Text>
                    </TouchableOpacity>
                </View>

                {/* 説明 (削除) */}
                <View style={{ height: 32 }} />
            </View>

            {/* 赤ちゃん切り替えモーダル */}
            <Modal
                visible={showBabyPicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowBabyPicker(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowBabyPicker(false)}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{i18n.t("camera.switchBabyTitle")}</Text>
                        <ScrollView style={{ maxHeight: 300 }}>
                            {babies.map((b) => {
                                const bTheme = getThemePreset(b.themeColorHex);
                                return (
                                    <TouchableOpacity
                                        key={b.id}
                                        style={styles.babyOption}
                                        onPress={() => handleSelectBaby(b.id)}
                                    >
                                        <View style={[styles.babyBadgeDot, { backgroundColor: bTheme.accent, width: 14, height: 14, borderRadius: 7 }]} />
                                        <Text style={styles.babyOptionText}>{b.name}</Text>
                                        {activeBabyId === b.id && (
                                            <Ionicons name="checkmark" size={20} color={bTheme.accent} />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#FFF",
    },
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
    babyBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#F5F5F5",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    babyBadgeDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    babyBadgeText: {
        fontSize: 14,
        fontWeight: "600",
    },
    buttonArea: {
        width: "100%",
        gap: 16,
    },
    captureButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 28,
        borderRadius: 24,
        gap: 16,
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
        gap: 16,
    },
    importButtonText: {
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    // --- モーダル ---
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
    },
    modalContent: {
        width: "100%",
        maxWidth: 320,
        backgroundColor: "#FFF",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 16,
        textAlign: "center",
    },
    babyOption: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
        gap: 12,
    },
    babyOptionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
});
