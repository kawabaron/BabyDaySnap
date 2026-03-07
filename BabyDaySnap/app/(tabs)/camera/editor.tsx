import { useState, useEffect, useCallback, useMemo } from "react";
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
    Switch,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { useAppState, useAppDispatch, useActiveBaby } from "@/context/AppContext";
import { TEMPLATES, COLOR_PALETTE, getTemplateConfig, FONT_OPTIONS } from "@/utils/templates";
import { renderCompositeImage } from "@/utils/renderImage";
import { saveToAppLibrary, saveToPhotoLibrary } from "@/utils/saveImage";
import { calcAgeDays } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { getThemePreset, NEUTRAL_THEME } from "@/constants/babyTheme";
import type { TemplateId, FontId } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PREVIEW_WIDTH = SCREEN_WIDTH - 32;

export default function EditorScreen() {
    const state = useAppState();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const activeBaby = useActiveBaby();

    const { currentPhoto, computed, editorOptions, settings, renderedUri, editingLibraryId, babies, targetBabyIds, activeBabyId } = state;
    const [saving, setSaving] = useState(false);
    const navigation = useNavigation();

    // テーマカラー: 複数選択時はニュートラル、1人選択時はそのカラー
    const theme = useMemo(() => {
        if (targetBabyIds.length === 1) {
            const baby = babies.find((b) => b.id === targetBabyIds[0]);
            return baby ? getThemePreset(baby.themeColorHex) : NEUTRAL_THEME;
        }
        return NEUTRAL_THEME;
    }, [targetBabyIds, babies]);

    // 保存先で選択されている赤ちゃんの名前（表示用）
    const activeBabyForEditor = useMemo(() => {
        if (targetBabyIds.length === 1) {
            return babies.find((b) => b.id === targetBabyIds[0]) ?? null;
        }
        return null;
    }, [targetBabyIds, babies]);

    // 戻るボタンのカスタマイズ (再編集時はライブラリ詳細へ戻る)
    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => {
                        const libId = editingLibraryId;
                        dispatch({ type: "RESET_EDITOR" });
                        if (libId) {
                            router.navigate(`/(tabs)/library/${libId}`);
                            setTimeout(() => {
                                (navigation as any).reset({ index: 0, routes: [{ name: 'index' }] });
                            }, 100);
                        } else {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace("/(tabs)/camera");
                            }
                        }
                    }}
                    style={{ flexDirection: "row", alignItems: "center", marginLeft: 4, paddingRight: 16 }}
                >
                    <Ionicons name="chevron-back" size={28} color="#333" />
                    <Text style={{ fontSize: 17, color: "#333" }}>戻る</Text>
                </TouchableOpacity>
            ),
        });
    }, [navigation, editingLibraryId, dispatch, router]);

    // RN用プレビューフォント読み込み
    const [rnFontsLoaded] = useFonts({
        font_standard: FONT_OPTIONS.find(f => f.id === "font_standard")!.file,
        font_soft: FONT_OPTIONS.find(f => f.id === "font_soft")!.file,
        font_stylish: FONT_OPTIONS.find(f => f.id === "font_stylish")!.file,
        font_cute: FONT_OPTIONS.find(f => f.id === "font_cute")!.file,
    });

    // メモリ使用量ログ（ファイルサイズとタイミング計測）
    const logFileSize = async (label: string, uri: string) => {
        try {
            const info = await FileSystem.getInfoAsync(uri);
            if (info.exists && 'size' in info) {
                console.log(`[MEMORY] ${label}: ${(info.size / 1024 / 1024).toFixed(2)}MB, uri=${uri.substring(0, 60)}...`);
            } else {
                console.log(`[MEMORY] ${label}: file not found`);
            }
        } catch (_) {
            console.log(`[MEMORY] ${label}: unable to check file`);
        }
    };

    // 最終保存時にのみSkia合成を実行
    // manipulateAsyncで先に安全にリサイズしてからSkiaに渡す（メモリ爆発防止＆全URI形式対応）
    const runFinalRender = async () => {
        if (!currentPhoto || !computed) throw new Error("Missing data");

        console.log(`[SAVE] === 保存開始 ===`);
        console.log(`[SAVE] 元画像: ${currentPhoto.width}x${currentPhoto.height}`);
        await logFileSize("元画像ファイル", currentPhoto.uri);

        // 元画像をOSネイティブで安全にリサイズ（Skiaへの入力サイズを制限）
        const MAX_RENDER = 2000;  // 2000px = 約534万画素（Skiaメモリ約34MBに抑制）
        let renderUri = currentPhoto.uri;
        let renderW = currentPhoto.width;
        let renderH = currentPhoto.height;

        if (renderW > MAX_RENDER || renderH > MAX_RENDER) {
            const scale = MAX_RENDER / Math.max(renderW, renderH);
            renderW = Math.round(renderW * scale);
            renderH = Math.round(renderH * scale);
            console.log(`[SAVE] リサイズ: ${renderW}x${renderH}`);
            const resized = await manipulateAsync(
                currentPhoto.uri,
                [{ resize: { width: renderW, height: renderH } }],
                { compress: 1.0, format: SaveFormat.JPEG }
            );
            renderUri = resized.uri;
            await logFileSize("リサイズ後ファイル", renderUri);
        }

        // 保存先の最初の赤ちゃんの名前を使用
        const babyNameForRender = activeBabyForEditor?.name || settings.babyName;

        try {
            const result = await renderCompositeImage({
                imageUri: renderUri,
                imageWidth: renderW,
                imageHeight: renderH,
                editorOptions,
                computed,
                fontId: editorOptions.fontId,
                babyName: babyNameForRender,
            });

            await logFileSize("Skia出力ファイル", result);
            console.log(`[SAVE] === 保存完了 ===`);
            return result;
        } finally {
            // 一時リサイズファイルを削除
            if (renderUri !== currentPhoto.uri) {
                try { await FileSystem.deleteAsync(renderUri, { idempotent: true }); } catch (_) { }
            }
        }
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

    // フォント変更
    const handleFontChange = (id: FontId) => {
        dispatch({
            type: "SET_EDITOR_OPTIONS",
            payload: { fontId: id },
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

    // 保存先の赤ちゃんをトグル
    const toggleTargetBaby = (babyId: string) => {
        const current = targetBabyIds;
        if (current.includes(babyId)) {
            // 最低1人は選択必須
            if (current.length <= 1) return;
            dispatch({ type: "SET_TARGET_BABY_IDS", payload: current.filter((id) => id !== babyId) });
        } else {
            dispatch({ type: "SET_TARGET_BABY_IDS", payload: [...current, babyId] });
        }
    };

    // アプリ内保存
    const handleSaveToApp = async () => {
        if (!currentPhoto || !computed) return;
        if (targetBabyIds.length === 0) {
            Alert.alert("保存先を選択", "少なくとも1人の赤ちゃんを保存先に選択してください。");
            return;
        }
        setSaving(true);
        try {
            const finalUri = await runFinalRender();
            // renderImage.ts の MAX_OUTPUT_DIMENSION と合わせる
            const maxSide = Math.max(currentPhoto.width, currentPhoto.height);
            const scale = maxSide > 2000 ? 2000 / maxSide : 1;
            const imageW = Math.round(currentPhoto.width * scale);
            const imageH = Math.round(currentPhoto.height * scale);

            const item = await saveToAppLibrary(
                finalUri,
                currentPhoto,
                computed,
                editorOptions,
                imageW,
                imageH,
                targetBabyIds,
                editingLibraryId,
            );

            // 一時ファイルのみ削除（メモリ蓄積防止）
            try { await FileSystem.deleteAsync(finalUri, { idempotent: true }); } catch (_) { }

            // previewUri が一時ファイル（cacheディレクトリ）の場合のみ削除する
            // ※ライブラリの原本ファイル (documentDirectory) を指している場合は削除してはいけない
            if (
                currentPhoto.previewUri &&
                currentPhoto.previewUri !== currentPhoto.uri &&
                currentPhoto.previewUri.includes('ImagePicker') // Expo Camera/ImagePickerのキャッシュファイルの特徴
            ) {
                try { await FileSystem.deleteAsync(currentPhoto.previewUri, { idempotent: true }); } catch (_) { }
            }

            if (editingLibraryId) {
                dispatch({ type: "LIBRARY_UPDATE", payload: item });
            } else {
                dispatch({ type: "LIBRARY_ADD", payload: item });
            }
            dispatch({
                type: "SET_LAST_EDITOR_PREFS",
                payload: {
                    lastTemplateId: editorOptions.templateId,
                    lastDateColorHex: editorOptions.dateColorHex,
                    lastFontId: editorOptions.fontId,
                },
            });
            Alert.alert("保存完了", "ライブラリに保存しました。", [
                {
                    text: "OK",
                    onPress: () => {
                        console.log(`[NAV] エディタクリーンアップ開始`);
                        dispatch({ type: "RESET_EDITOR" });

                        router.navigate("/(tabs)/library");

                        setTimeout(() => {
                            (navigation as any).reset({ index: 0, routes: [{ name: 'index' }] });
                        }, 100);
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
        if (!currentPhoto || !computed) return;
        setSaving(true);
        try {
            const finalUri = await runFinalRender();
            const success = await saveToPhotoLibrary(finalUri);
            // 一時ファイル削除（メモリ蓄積防止）
            try { await FileSystem.deleteAsync(finalUri, { idempotent: true }); } catch (_) { }
            if (success) {
                Alert.alert("保存完了", "写真ライブラリに保存しました。");
            }
        } finally {
            setSaving(false);
        }
    };

    const editorIsFocused = useIsFocused();

    // フォーカスが外れた場合はメモリ節約のため軽量プレースホルダーを表示
    if (!editorIsFocused) {
        return <View style={styles.container} />;
    }

    if (!currentPhoto || !computed || !rnFontsLoaded) {
        return (
            <View style={styles.container}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.accent} />
                <Text style={styles.errorText}>準備中...</Text>
            </View>
        );
    }

    // プレビュー画像のアスペクト比と配置レイアウト計算
    const tpl = getTemplateConfig(editorOptions.templateId);
    const previewAspect = currentPhoto.width / currentPhoto.height;
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
        ? PREVIEW_WIDTH - inset * 2
        : PREVIEW_WIDTH;

    const previewPhotoH = tpl.hasFrame
        ? previewHeight - inset - bottomInset
        : previewHeight;

    const previewPhotoX = tpl.hasFrame ? inset : 0;
    const previewPhotoY = tpl.hasFrame ? inset : 0;

    // 表示用の赤ちゃん名
    const displayBabyName = activeBabyForEditor?.name || settings.babyName;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* プレビュー UI (純粋なReact Nativeコンポーネントで高速にモック表示) */}
            <View style={[styles.previewContainer, {
                height: previewHeight,
                backgroundColor: tpl.hasFrame ? "#FFFFFF" : "#000000",
                borderWidth: tpl.hasFrame ? 1 : 0,
                borderColor: "#E0E0E0"
            }]}>
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
                        source={{ uri: currentPhoto.previewUri || currentPhoto.uri }}
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
                    {(editorOptions.showDate || editorOptions.showName || editorOptions.showAge) && (
                        <Text style={{
                            fontFamily: editorOptions.fontId,
                            fontSize: dateFontSize,
                            color: editorOptions.dateColorHex,
                            fontWeight: "bold",
                            textShadowColor: tpl.hasTextStroke ? "#000" : "transparent",
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 1,
                        }}>
                            {[
                                editorOptions.showDate ? computed.shotDateISO : null,
                                editorOptions.showName && displayBabyName ? displayBabyName : null,
                                editorOptions.showAge ? `生後${computed.ageDays}日` : null
                            ].filter(Boolean).join("  ")}
                        </Text>
                    )}
                    {editorOptions.commentText ? (
                        <Text style={{
                            fontFamily: editorOptions.fontId,
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
                        <ActivityIndicator size="large" color={theme.accent} />
                        <Text style={{ color: "#FFF", marginTop: 12, fontWeight: "bold" }}>保存中...</Text>
                    </View>
                )}
            </View>

            {/* 保存先（赤ちゃん選択） */}
            {babies.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>保存先</Text>
                    <View style={styles.targetRow}>
                        {babies.map((baby) => {
                            const isSelected = targetBabyIds.includes(baby.id);
                            const babyTheme = getThemePreset(baby.themeColorHex);
                            return (
                                <TouchableOpacity
                                    key={baby.id}
                                    style={[
                                        styles.targetChip,
                                        isSelected
                                            ? { backgroundColor: babyTheme.accent, borderColor: babyTheme.accent }
                                            : { backgroundColor: "#F5F5F5", borderColor: "#E0E0E0" },
                                    ]}
                                    onPress={() => toggleTargetBaby(baby.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.targetDot,
                                        { backgroundColor: isSelected ? "#FFF" : babyTheme.accent },
                                    ]} />
                                    <Text style={[
                                        styles.targetText,
                                        { color: isSelected ? "#FFF" : "#555" },
                                    ]}>
                                        {baby.name}
                                    </Text>
                                    {isSelected && (
                                        <Ionicons name="checkmark" size={16} color="#FFF" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    {targetBabyIds.length > 1 && (
                        <Text style={styles.targetHint}>
                            全員のライブラリに保存されます
                        </Text>
                    )}
                </View>
            )}

            {/* テンプレート選択 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>テンプレート</Text>
                <View style={styles.templateRow}>
                    {TEMPLATES.map((t) => (
                        <TouchableOpacity
                            key={t.id}
                            style={[
                                styles.templateOption,
                                editorOptions.templateId === t.id && [styles.templateOptionActive, { borderColor: theme.accent, backgroundColor: theme.light }],
                            ]}
                            onPress={() => handleTemplateChange(t.id)}
                        >
                            <View style={styles.templatePreviewBox}>
                                {t.hasFrame ? (
                                    <View style={styles.templateFrame}>
                                        <View style={styles.templateInner} />
                                    </View>
                                ) : (
                                    <View style={styles.templateNoFrame} />
                                )}
                            </View>
                            <Text
                                style={[
                                    styles.templateLabel,
                                    editorOptions.templateId === t.id && [styles.templateLabelActive, { color: theme.accent }],
                                ]}
                            >
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* フォント選択 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>フォント</Text>
                <View style={styles.fontRow}>
                    {FONT_OPTIONS.map((f) => (
                        <TouchableOpacity
                            key={f.id}
                            style={[
                                styles.fontBadge,
                                editorOptions.fontId === f.id && [styles.fontBadgeActive, { borderColor: theme.accent, backgroundColor: theme.light }],
                            ]}
                            onPress={() => handleFontChange(f.id)}
                        >
                            <Text
                                style={[
                                    styles.fontBadgeText,
                                    { fontFamily: f.id },
                                    editorOptions.fontId === f.id && [styles.fontBadgeTextActive, { color: theme.accent }],
                                ]}
                            >
                                {f.label}
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
                                editorOptions.dateColorHex === c.hex && [styles.colorCircleSelected, { borderColor: theme.accent }],
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

            {/* 表示項目切り替え */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>印字テキスト</Text>
                <View style={styles.toggleRowContainer}>
                    <View style={styles.toggleItem}>
                        <Text style={styles.toggleLabel}>日付</Text>
                        <Switch
                            value={editorOptions.showDate}
                            onValueChange={(val) => dispatch({ type: "SET_EDITOR_OPTIONS", payload: { showDate: val } })}
                            trackColor={{ false: "#E0E0E0", true: theme.accent }}
                            style={styles.switchSmall}
                        />
                    </View>
                    <View style={styles.toggleItem}>
                        <Text style={styles.toggleLabel}>名前</Text>
                        <Switch
                            value={editorOptions.showName}
                            onValueChange={(val) => dispatch({ type: "SET_EDITOR_OPTIONS", payload: { showName: val } })}
                            trackColor={{ false: "#E0E0E0", true: theme.accent }}
                            style={styles.switchSmall}
                            disabled={!displayBabyName}
                        />
                    </View>
                    <View style={styles.toggleItem}>
                        <Text style={styles.toggleLabel}>日数</Text>
                        <Switch
                            value={editorOptions.showAge}
                            onValueChange={(val) => dispatch({ type: "SET_EDITOR_OPTIONS", payload: { showAge: val } })}
                            trackColor={{ false: "#E0E0E0", true: theme.accent }}
                            style={styles.switchSmall}
                        />
                    </View>
                </View>
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
                    style={[styles.saveButton, { backgroundColor: theme.accent, shadowColor: theme.shadow }]}
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
                    style={[styles.photoButton, { borderColor: theme.accent }]}
                    onPress={handleSaveToPhotos}
                    disabled={saving}
                >
                    <Ionicons name="image-outline" size={20} color={theme.accent} />
                    <Text style={[styles.photoButtonText, { color: theme.accent }]}>iPhone写真に保存</Text>
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
    section: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#333",
        marginBottom: 10,
    },
    // --- 保存先チップ ---
    targetRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    targetChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1.5,
        gap: 6,
    },
    targetDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    targetText: {
        fontSize: 14,
        fontWeight: "600",
    },
    targetHint: {
        fontSize: 12,
        color: "#999",
        marginTop: 6,
        paddingLeft: 4,
    },
    // --- テンプレート ---
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
    templateInner: {
        width: 42,
        height: 30,
        backgroundColor: "#E0E0E0",
        borderRadius: 2,
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
    // --- フォント ---
    fontRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        paddingVertical: 4,
    },
    fontBadge: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#F5F5F5",
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "transparent",
    },
    fontBadgeActive: {
        borderColor: "#FF8FA3",
        backgroundColor: "#FFF5F7",
    },
    fontBadgeText: {
        fontSize: 14,
        color: "#555",
    },
    fontBadgeTextActive: {
        color: "#FF8FA3",
    },
    // --- 日付色 ---
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
    // --- コメント ---
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
    // --- トグル ---
    toggleRowContainer: {
        flexDirection: "row",
        justifyContent: "flex-start",
        flexWrap: "wrap",
        gap: 8,
        paddingVertical: 4,
    },
    toggleItem: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 12,
        gap: 6,
    },
    toggleLabel: {
        fontSize: 13,
        color: "#555",
        fontWeight: "600",
    },
    switchSmall: {
        transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }],
    },
    // --- ボタン ---
    buttonContainer: {
        marginTop: 24,
        gap: 12,
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 14,
        gap: 8,
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
        gap: 8,
    },
    photoButtonText: {
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
