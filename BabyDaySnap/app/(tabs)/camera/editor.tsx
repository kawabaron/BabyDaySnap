import { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import { TEMPLATES, COLOR_PALETTE, getTemplateConfig } from "@/utils/templates";
import { renderCompositeImage } from "@/utils/renderImage";
import { saveToAppLibrary, saveToPhotoLibrary } from "@/utils/saveImage";
import { Ionicons } from "@expo/vector-icons";
import { useFont } from "@shopify/react-native-skia";
import type { TemplateId } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PREVIEW_WIDTH = SCREEN_WIDTH - 32;

export default function EditorScreen() {
    const state = useAppState();
    const dispatch = useAppDispatch();
    const router = useRouter();

    const { currentPhoto, computed, editorOptions, settings, renderedUri } = state;
    const [saving, setSaving] = useState(false);

    // フォント読み込み
    const customFont = useFont(require("../../../assets/fonts/NotoSansJP-Bold.otf"), 16);

    // 最終保存時にのみSkia合成を実行
    const runFinalRender = async () => {
        if (!currentPhoto || !computed || !customFont) throw new Error("Missing data");
        return await renderCompositeImage({
            imageUri: currentPhoto.uri,
            imageWidth: currentPhoto.width,
            imageHeight: currentPhoto.height,
            editorOptions,
            computed,
            typeface: customFont.getTypeface(),
        });
    };

    // テンプレート変更
    const handleTemplateChange = (id: TemplateId) => {
        const tpl = getTemplateConfig(id);
        dispatch({
            type: "SET_EDITOR_OPTIONS",
            payload: {
                templateId: id,
                dateColorHex: tpl.defaultDateColorHex,
            },
        });
    };

    // 色変更
    const handleColorChange = (hex: string) => {
        dispatch({
            type: "SET_EDITOR_OPTIONS",
            payload: { dateColorHex: hex },
        });
    };

    // コメント変更
    const handleCommentChange = (text: string) => {
        // 改行禁止
        const singleLine = text.replace(/\n/g, "");
        dispatch({
            type: "SET_EDITOR_OPTIONS",
            payload: { commentText: singleLine },
        });
    };

    // アプリ内保存
    const handleSaveToApp = async () => {
        if (!currentPhoto || !computed || !customFont) return;
        setSaving(true);
        try {
            const finalUri = await runFinalRender();
            const tpl = getTemplateConfig(editorOptions.templateId);
            const imageW = tpl.isSquare
                ? Math.min(currentPhoto.width, currentPhoto.height)
                : currentPhoto.width;
            const imageH = tpl.isSquare
                ? Math.min(currentPhoto.width, currentPhoto.height)
                : currentPhoto.height;

            const item = await saveToAppLibrary(
                finalUri,
                currentPhoto,
                computed,
                editorOptions,
                imageW,
                imageH,
            );
            dispatch({ type: "LIBRARY_ADD", payload: item });
            dispatch({
                type: "SET_LAST_EDITOR_PREFS",
                payload: {
                    lastTemplateId: editorOptions.templateId,
                    lastDateColorHex: editorOptions.dateColorHex,
                },
            });
            Alert.alert("保存完了", "ライブラリに保存しました。", [
                {
                    text: "OK",
                    onPress: () => {
                        dispatch({ type: "RESET_EDITOR" });
                        router.back();
                    },
                },
            ]);
        } catch (e) {
            console.error("Save error:", e);
            Alert.alert("エラー", "保存に失敗しました。");
        } finally {
            setSaving(false);
        }
    };

    // iPhone写真保存
    const handleSaveToPhotos = async () => {
        if (!currentPhoto || !computed || !customFont) return;
        setSaving(true);
        try {
            const finalUri = await runFinalRender();
            const success = await saveToPhotoLibrary(finalUri);
            if (success) {
                Alert.alert("保存完了", "写真ライブラリに保存しました。");
            }
        } finally {
            setSaving(false);
        }
    };

    if (!currentPhoto || !computed || !customFont) {
        return (
            <View style={styles.container}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#FF8FA3" />
                <Text style={styles.errorText}>準備中...</Text>
            </View>
        );
    }

    // プレビュー画像のアスペクト比と配置レイアウト計算
    const tpl = getTemplateConfig(editorOptions.templateId);
    const previewAspect = tpl.isSquare
        ? 1
        : currentPhoto.width / currentPhoto.height;
    const previewHeight = PREVIEW_WIDTH / previewAspect;

    // UIレイアウト計算 (renderImage.ts の定数に合わせる)
    const shortSide = Math.min(PREVIEW_WIDTH, previewHeight);
    const dateFontSize = shortSide * 0.04;
    const commentFontSize = shortSide * 0.038;
    const margin = shortSide * 0.04;
    const gap = shortSide * 0.015;
    const inset = shortSide * 0.06;
    const bottomInset = shortSide * 0.18;

    const previewPhotoW = tpl.hasFrame
        ? (tpl.isSquare ? previewHeight - inset - bottomInset : PREVIEW_WIDTH - inset * 2)
        : PREVIEW_WIDTH;

    const previewPhotoH = tpl.hasFrame
        ? previewHeight - inset - bottomInset
        : previewHeight;

    const previewPhotoX = tpl.hasFrame
        ? (tpl.isSquare ? (PREVIEW_WIDTH - previewPhotoW) / 2 : inset)
        : 0;

    const previewPhotoY = tpl.hasFrame ? inset : 0;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* プレビュー UI (純粋なReact Nativeコンポーネントで高速にモック表示) */}
            <View style={[styles.previewContainer, { height: previewHeight, backgroundColor: tpl.hasFrame ? "#FFFFFF" : "#000000" }]}>
                {/* Photo Layer */}
                <View style={{
                    position: "absolute",
                    left: previewPhotoX,
                    top: previewPhotoY,
                    width: previewPhotoW,
                    height: previewPhotoH,
                    overflow: "hidden",
                }}>
                    <Image
                        source={{ uri: currentPhoto.uri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                    />
                </View>

                {/* Text Layer */}
                <View style={{
                    position: "absolute",
                    right: margin,
                    ...(tpl.hasFrame ? { top: previewPhotoY + previewPhotoH + gap } : { bottom: margin }),
                    alignItems: "flex-end",
                }}>
                    <Text style={{
                        fontSize: dateFontSize,
                        color: editorOptions.dateColorHex,
                        fontWeight: "bold",
                        textShadowColor: tpl.hasTextStroke ? "#000" : "transparent",
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 1,
                    }}>
                        {computed.shotDateISO}  生後{computed.ageDays}日
                    </Text>
                    {editorOptions.commentText ? (
                        <Text style={{
                            fontSize: commentFontSize,
                            color: editorOptions.dateColorHex,
                            fontWeight: "bold",
                            marginTop: gap,
                            textShadowColor: tpl.hasTextStroke ? "#000" : "transparent",
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 1,
                        }}>
                            {editorOptions.commentText}
                        </Text>
                    ) : null}
                </View>

                {/* Loading overlay for final save */}
                {saving && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }]}>
                        <ActivityIndicator size="large" color="#FF8FA3" />
                        <Text style={{ color: "#FFF", marginTop: 12, fontWeight: "bold" }}>保存中...</Text>
                    </View>
                )}
            </View>

            {/* 情報表示 */}
            <View style={styles.infoRow}>
                <View style={styles.infoBadge}>
                    <Text style={styles.infoBadgeText}>
                        生後 {computed.ageDays} 日
                    </Text>
                </View>
                <Text style={styles.infoDate}>{computed.shotDateISO}</Text>
            </View>

            {/* テンプレート選択 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>テンプレート</Text>
                <View style={styles.templateRow}>
                    {TEMPLATES.map((t) => (
                        <TouchableOpacity
                            key={t.id}
                            style={[
                                styles.templateOption,
                                editorOptions.templateId === t.id && styles.templateOptionActive,
                            ]}
                            onPress={() => handleTemplateChange(t.id)}
                        >
                            <View style={styles.templatePreviewBox}>
                                {t.hasFrame ? (
                                    <View style={[
                                        styles.templateFrame,
                                        t.isSquare && styles.templateSquare,
                                    ]}>
                                        <View style={[
                                            styles.templateInner,
                                            t.isSquare && styles.templateInnerSquare,
                                        ]} />
                                    </View>
                                ) : (
                                    <View style={styles.templateNoFrame} />
                                )}
                            </View>
                            <Text
                                style={[
                                    styles.templateLabel,
                                    editorOptions.templateId === t.id && styles.templateLabelActive,
                                ]}
                            >
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* 日付色選択 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>日付色</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.colorRow}
                >
                    {COLOR_PALETTE.map((c) => (
                        <TouchableOpacity
                            key={c.hex}
                            style={[
                                styles.colorCircle,
                                { backgroundColor: c.hex },
                                c.hex === "#FFFFFF" && styles.colorCircleWhite,
                                editorOptions.dateColorHex === c.hex && styles.colorCircleSelected,
                            ]}
                            onPress={() => handleColorChange(c.hex)}
                        >
                            {editorOptions.dateColorHex === c.hex && (
                                <Ionicons
                                    name="checkmark"
                                    size={18}
                                    color={c.hex === "#FFFFFF" || c.hex === "#FFEB3B" ? "#333" : "#FFF"}
                                />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* コメント入力 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>コメント（任意）</Text>
                <TextInput
                    style={styles.commentInput}
                    value={editorOptions.commentText}
                    onChangeText={handleCommentChange}
                    placeholder="コメントを入力..."
                    placeholderTextColor="#BDBDBD"
                    maxLength={50}
                    returnKeyType="done"
                    blurOnSubmit
                />
            </View>

            {/* 保存ボタン */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveToApp}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Ionicons name="download-outline" size={20} color="#FFF" />
                            <Text style={styles.saveButtonText}>アプリ内に保存</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.photoButton}
                    onPress={handleSaveToPhotos}
                    disabled={saving}
                >
                    <Ionicons name="image-outline" size={20} color="#FF8FA3" />
                    <Text style={styles.photoButtonText}>iPhone写真に保存</Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF",
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    previewContainer: {
        width: PREVIEW_WIDTH,
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
    },
    previewImage: {
        width: "100%",
        height: "100%",
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 12,
        gap: 12,
    },
    infoBadge: {
        backgroundColor: "#FF8FA3",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    infoBadgeText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "700",
    },
    infoDate: {
        fontSize: 14,
        color: "#888",
    },
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#333",
        marginBottom: 10,
    },
    templateRow: {
        flexDirection: "row",
        gap: 12,
    },
    templateOption: {
        flex: 1,
        alignItems: "center",
        padding: 10,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#F0F0F0",
        backgroundColor: "#FAFAFA",
    },
    templateOptionActive: {
        borderColor: "#FF8FA3",
        backgroundColor: "#FFF5F7",
    },
    templatePreviewBox: {
        width: 60,
        height: 48,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 6,
    },
    templateNoFrame: {
        width: 52,
        height: 40,
        backgroundColor: "#E0E0E0",
        borderRadius: 4,
    },
    templateFrame: {
        width: 52,
        height: 40,
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    templateSquare: {
        width: 40,
        height: 40,
    },
    templateInner: {
        width: 42,
        height: 30,
        backgroundColor: "#E0E0E0",
        borderRadius: 2,
    },
    templateInnerSquare: {
        width: 30,
        height: 30,
    },
    templateLabel: {
        fontSize: 11,
        color: "#888",
        fontWeight: "500",
    },
    templateLabelActive: {
        color: "#FF8FA3",
        fontWeight: "700",
    },
    colorRow: {
        flexDirection: "row",
        gap: 10,
        paddingVertical: 4,
    },
    colorCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    colorCircleWhite: {
        borderWidth: 1,
        borderColor: "#DDD",
    },
    colorCircleSelected: {
        borderWidth: 3,
        borderColor: "#FF8FA3",
    },
    commentInput: {
        borderWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: "#333",
        backgroundColor: "#FAFAFA",
    },
    buttonContainer: {
        marginTop: 24,
        gap: 12,
    },
    saveButton: {
        backgroundColor: "#FF8FA3",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 14,
        gap: 8,
        shadowColor: "#FF8FA3",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },
    photoButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "#FF8FA3",
        gap: 8,
    },
    photoButtonText: {
        color: "#FF8FA3",
        fontSize: 16,
        fontWeight: "700",
    },
    errorText: {
        fontSize: 16,
        color: "#888",
        textAlign: "center",
        marginTop: 40,
    },
});
