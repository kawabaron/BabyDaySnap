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
import { calcAgeDays, calcAgeMonthsAndDays } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { getThemePreset, NEUTRAL_THEME } from "@/constants/babyTheme";
import type { TemplateId, FontId } from "@/types";
import i18n from "@/lib/i18n";

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
                    <Text style={{ fontSize: 17, color: "#333" }}>{i18n.t("editor.backButton")}</Text>
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

    // 最終保存時にのみSkia合成を実行
    // manipulateAsyncで先に安全にリサイズしてからSkiaに渡す（メモリ爆発防止＆全URI形式対応）
    const runFinalRender = async () => {
        if (!currentPhoto || !computed) throw new Error("Missing data");

        if (!currentPhoto || !computed) throw new Error("Missing data");

        // 元画像をOSネイティブで安全にリサイズ（Skiaへの入力サイズを制限）
        const MAX_RENDER = 2000;  // 2000px = 約534万画素（Skiaメモリ約34MBに抑制）
        let renderUri = currentPhoto.uri;
        let renderW = currentPhoto.width;
        let renderH = currentPhoto.height;

        if (renderW > MAX_RENDER || renderH > MAX_RENDER) {
            const scale = MAX_RENDER / Math.max(renderW, renderH);
            renderW = Math.round(renderW * scale);
            renderH = Math.round(renderH * scale);
            const resized = await manipulateAsync(
                currentPhoto.uri,
                [{ resize: { width: renderW, height: renderH } }],
                { compress: 1.0, format: SaveFormat.JPEG }
            );
            renderUri = resized.uri;
        }

        try {
            const result = await renderCompositeImage({
                imageUri: renderUri,
                imageWidth: renderW,
                imageHeight: renderH,
                editorOptions,
                computed,
                fontId: editorOptions.fontId,
                dateTextLine1,
                isMultiBaby,
            });

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
            Alert.alert(i18n.t("editor.saveTargetTitle"), i18n.t("editor.missingTarget"));
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
            Alert.alert(i18n.t("editor.saveAppSuccessTitle"), i18n.t("editor.saveAppSuccessMsg"), [
                {
                    text: "OK",
                    onPress: () => {
                        dispatch({ type: "RESET_EDITOR" });

                        router.navigate("/(tabs)/library");

                        setTimeout(() => {
                            (navigation as any).reset({ index: 0, routes: [{ name: 'index' }] });
                        }, 100);
                    },
                },
            ]);
        } catch {
            Alert.alert("Error", i18n.t("editor.saveFailed"));
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
                Alert.alert(i18n.t("editor.savePhotoSuccessTitle"), i18n.t("editor.savePhotoSuccessMsg"));
            }
        } finally {
            setSaving(false);
        }
    };

    const editorIsFocused = useIsFocused();

    // 表示用の赤ちゃん名
    const displayBabyName = activeBabyForEditor?.name || settings.babyName;

    // 印字テキストの生成
    const dateTextLine1 = useMemo(() => {
        if (!computed) return "";
        let text = "";
        if (targetBabyIds.length <= 1) {
            const parts = [];

            // 対象となる1人の赤ちゃんを特定
            let targetBabyId = undefined;
            if (targetBabyIds.length === 1) {
                targetBabyId = targetBabyIds[0];
            } else if (activeBabyForEditor) {
                targetBabyId = activeBabyForEditor.id;
            }

            const b = babies.find(x => x.id === targetBabyId);
            const targetAgeDays = b ? calcAgeDays(b.birthDateISO, computed.shotDateISO || "") : computed.ageDays;

            // "nヶ月n日"形式の計算
            const targetAgeMonthsAndDays = b ? calcAgeMonthsAndDays(b.birthDateISO, computed.shotDateISO || "") : null;

            // 「現在日付が誕生日よりも前の場合、写真に日付は印字しない」の対応 -> 日数はグレーアウトして出さない、日付は出す
            const isBeforeBirth = targetAgeDays !== undefined && targetAgeDays < 0;

            if (editorOptions.showDate) parts.push(computed.shotDateISO);
            if (editorOptions.showName && displayBabyName) parts.push(displayBabyName);
            if (editorOptions.showAge && targetAgeDays !== undefined && !isBeforeBirth) {
                if (editorOptions.ageFormat === "months_days" && targetAgeMonthsAndDays) {
                    const { months, days } = targetAgeMonthsAndDays;
                    if (months === 0) {
                        parts.push(i18n.t("editor.ageTextDays", { days }));
                    } else if (days === 0) {
                        parts.push(i18n.t("editor.ageTextMonths", { months }));
                    } else {
                        parts.push(i18n.t("editor.ageTextMonthsDays", { months, days }));
                    }
                } else {
                    parts.push(i18n.t("editor.ageTextDays", { days: targetAgeDays }));
                }
            }
            text = parts.filter(Boolean).join("  ");
        } else {
            // 複数人選択時
            const parts = [];
            if (editorOptions.showDate) parts.push(computed.shotDateISO);

            const babyParts = targetBabyIds.map(id => {
                const b = babies.find(x => x.id === id);
                if (!b) return "";
                let bStr = "";
                if (editorOptions.showName) bStr += b.name;

                const targetAgeMonthsAndDays = calcAgeMonthsAndDays(b.birthDateISO, computed.shotDateISO || "");
                const ageDays = targetAgeMonthsAndDays.totalDays;
                const isBeforeBirth = ageDays < 0;

                if (editorOptions.showAge && !isBeforeBirth) {
                    if (editorOptions.ageFormat === "months_days") {
                        const { months, days } = targetAgeMonthsAndDays;
                        if (months === 0) {
                            bStr += `(${i18n.t("editor.ageTextDays", { days })})`;
                        } else if (days === 0) {
                            bStr += `(${i18n.t("editor.ageTextMonths", { months })})`;
                        } else {
                            bStr += `(${i18n.t("editor.ageTextMonthsDays", { months, days })})`;
                        }
                    } else {
                        bStr += `(${i18n.t("editor.ageTextDays", { days: ageDays })})`;
                    }
                }
                return bStr;
            }).filter(Boolean);

            if (babyParts.length > 0) {
                // 複数人の場合はスペース1つで区切る
                parts.push(babyParts.join(" "));
            }
            text = parts.filter(Boolean).join("  ");
        }
        return text;
    }, [targetBabyIds, editorOptions, computed, babies, displayBabyName]);

    // 保存先が全員（または単独）誕生日前かどうか判定（日数のスイッチをdisabledにするため）
    const allSelectedBeforeBirth = useMemo(() => {
        if (!computed || targetBabyIds.length === 0) return false;
        return targetBabyIds.every(id => {
            const b = babies.find(x => x.id === id);
            if (!b) return false;
            return calcAgeDays(b.birthDateISO, computed.shotDateISO || "") < 0;
        });
    }, [targetBabyIds, babies, computed]);

    // フォーカスが外れた場合はメモリ節約のため軽量プレースホルダーを表示
    if (!editorIsFocused) {
        return <View style={[styles.container, { backgroundColor: theme.background }]} />;
    }

    if (!currentPhoto || !computed || !rnFontsLoaded) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <ActivityIndicator style={{ marginTop: 40 }} size="large" color={theme.accent} />
                <Text style={styles.errorText}>{i18n.t("editor.preparing")}</Text>
            </View>
        );
    }

    // プレビュー画像のアスペクト比と配置レイアウト計算
    const tpl = getTemplateConfig(editorOptions.templateId);
    const previewAspect = currentPhoto.width / currentPhoto.height;
    const previewHeight = PREVIEW_WIDTH / previewAspect;

    // UIレイアウト計算 (renderImage.ts の定数に合わせる)
    const shortSide = Math.min(PREVIEW_WIDTH, previewHeight);
    const isMultiBaby = targetBabyIds.length > 1;
    const dateFontSize = shortSide * 0.04 * (isMultiBaby ? 0.75 : 1);
    const commentFontSize = shortSide * 0.038;
    // フチありの場合は右の余白を増やす。insetが0.06なので0.06にすると写真の右端と揃う
    const margin = shortSide * (tpl.hasFrame ? 0.06 : 0.04);
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

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* プレビュー UI (純粋なReact Nativeコンポーネントで高速にモック表示) */}
            <View style={[styles.previewContainer, {
                height: previewHeight,
                backgroundColor: tpl.hasFrame ? "#FFFFFF" : "#000000",
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
                            {dateTextLine1}
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
                        <Text style={{ color: "#FFF", marginTop: 12, fontWeight: "bold" }}>{i18n.t("editor.saving")}</Text>
                    </View>
                )}
            </View>

            {/* 保存先（赤ちゃん選択） */}
            {babies.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("editor.saveTargetTitle")}</Text>
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
                            {i18n.t("editor.saveTargetHint")}
                        </Text>
                    )}
                </View>
            )}

            {/* テンプレート選択 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t("editor.templateTitle")}</Text>
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
                <Text style={styles.sectionTitle}>{i18n.t("editor.fontTitle")}</Text>
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
                <Text style={styles.sectionTitle}>{i18n.t("editor.dateColorTitle")}</Text>
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
                <Text style={styles.sectionTitle}>{i18n.t("editor.textVisibilityTitle")}</Text>
                <View style={styles.toggleRowContainer}>
                    <View style={styles.toggleItem}>
                        <Text style={styles.toggleLabel}>{i18n.t("editor.dateLabel")}</Text>
                        <Switch
                            value={editorOptions.showDate}
                            onValueChange={(val) => dispatch({ type: "SET_EDITOR_OPTIONS", payload: { showDate: val } })}
                            trackColor={{ false: "#E0E0E0", true: theme.accent }}
                            style={styles.switchSmall}
                        />
                    </View>
                    <View style={styles.toggleItem}>
                        <Text style={styles.toggleLabel}>{i18n.t("editor.nameLabel")}</Text>
                        <Switch
                            value={editorOptions.showName}
                            onValueChange={(val) => dispatch({ type: "SET_EDITOR_OPTIONS", payload: { showName: val } })}
                            trackColor={{ false: "#E0E0E0", true: theme.accent }}
                            style={styles.switchSmall}
                            disabled={!displayBabyName}
                        />
                    </View>
                    <View style={{ width: "100%" }}>
                        <View style={styles.toggleItem}>
                            <Text style={[styles.toggleLabel, allSelectedBeforeBirth && { color: "#CCC" }]}>{i18n.t("editor.ageLabel")}</Text>
                            <Switch
                                value={editorOptions.showAge}
                                onValueChange={(val) => dispatch({ type: "SET_EDITOR_OPTIONS", payload: { showAge: val } })}
                                trackColor={{ false: "#E0E0E0", true: theme.accent }}
                                style={styles.switchSmall}
                                disabled={allSelectedBeforeBirth}
                            />
                        </View>
                        {editorOptions.showAge && !allSelectedBeforeBirth && (
                            <View style={styles.formatSegmentContainer}>
                                <TouchableOpacity
                                    style={[styles.formatSegmentButton, editorOptions.ageFormat === "days" && styles.formatSegmentButtonActive]}
                                    onPress={() => dispatch({ type: "SET_EDITOR_OPTIONS", payload: { ageFormat: "days" } })}
                                >
                                    <Text style={[styles.formatSegmentText, editorOptions.ageFormat === "days" && { color: theme.accent }]}>{i18n.t("editor.ageFormatDays")}</Text>
                                </TouchableOpacity>
                                <View style={styles.formatSegmentDivider} />
                                <TouchableOpacity
                                    style={[styles.formatSegmentButton, editorOptions.ageFormat === "months_days" && styles.formatSegmentButtonActive]}
                                    onPress={() => dispatch({ type: "SET_EDITOR_OPTIONS", payload: { ageFormat: "months_days" } })}
                                >
                                    <Text style={[styles.formatSegmentText, editorOptions.ageFormat === "months_days" && { color: theme.accent }]}>{i18n.t("editor.ageFormatMonthsDays")}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* コメント入力 */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{i18n.t("editor.commentTitle")}</Text>
                <TextInput
                    style={styles.commentInput}
                    value={editorOptions.commentText}
                    onChangeText={handleCommentChange}
                    placeholder={i18n.t("editor.commentPlaceholder")}
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
                            <Text style={styles.saveButtonText}>{i18n.t("editor.saveToAppButton")}</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.photoButton, { borderColor: theme.accent }]}
                    onPress={handleSaveToPhotos}
                    disabled={saving}
                >
                    <Ionicons name="image-outline" size={20} color={theme.accent} />
                    <Text style={[styles.photoButtonText, { color: theme.accent }]}>{i18n.t("editor.saveToiPhoneButton")}</Text>
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
    formatSegmentContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        borderRadius: 8,
        marginTop: 8,
        padding: 4,
    },
    formatSegmentButton: {
        flex: 1,
        paddingVertical: 6,
        alignItems: "center",
        borderRadius: 6,
    },
    formatSegmentButtonActive: {
        backgroundColor: "#FFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    formatSegmentDivider: {
        width: 1,
        height: "60%",
        backgroundColor: "#E0E0E0",
    },
    formatSegmentText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#888",
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
