import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
    KeyboardAvoidingView,
    Keyboard,
    Platform,
    type LayoutChangeEvent,
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PREVIEW_WIDTH = SCREEN_WIDTH - 32;
const PREVIEW_EXPANDED_HEIGHT = Math.min(Math.max(SCREEN_HEIGHT * 0.36, 230), 320);
const PREVIEW_COMPACT_HEIGHT = Math.min(Math.max(SCREEN_HEIGHT * 0.24, 170), 220);
const FOOTER_BASE_HEIGHT = 148;

export default function EditorScreen() {
    const state = useAppState();
    const dispatch = useAppDispatch();
    const router = useRouter();
    useActiveBaby();

    const { currentPhoto, computed, editorOptions, settings, editingLibraryId, babies, targetBabyIds } = state;
    const [saving, setSaving] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [commentFocused, setCommentFocused] = useState(false);
    const [commentSectionY, setCommentSectionY] = useState(0);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const formScrollRef = useRef<ScrollView>(null);

    // 繝・・繝槭き繝ｩ繝ｼ: 隍・焚驕ｸ謚樊凾縺ｯ繝九Η繝ｼ繝医Λ繝ｫ縲・莠ｺ驕ｸ謚樊凾縺ｯ縺昴・繧ｫ繝ｩ繝ｼ
    const theme = useMemo(() => {
        if (targetBabyIds.length === 1) {
            const baby = babies.find((b) => b.id === targetBabyIds[0]);
            return baby ? getThemePreset(baby.themeColorHex) : NEUTRAL_THEME;
        }
        return NEUTRAL_THEME;
    }, [targetBabyIds, babies]);

    // 菫晏ｭ伜・縺ｧ驕ｸ謚槭＆繧後※縺・ｋ襍､縺｡繧・ｓ縺ｮ蜷榊燕・郁｡ｨ遉ｺ逕ｨ・・
    const activeBabyForEditor = useMemo(() => {
        if (targetBabyIds.length === 1) {
            return babies.find((b) => b.id === targetBabyIds[0]) ?? null;
        }
        return null;
    }, [targetBabyIds, babies]);

    // 謌ｻ繧九・繧ｿ繝ｳ縺ｮ繧ｫ繧ｹ繧ｿ繝槭う繧ｺ (蜀咲ｷｨ髮・凾縺ｯ繝ｩ繧､繝悶Λ繝ｪ隧ｳ邏ｰ縺ｸ謌ｻ繧・
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

    // RN逕ｨ繝励Ξ繝薙Η繝ｼ繝輔か繝ｳ繝郁ｪｭ縺ｿ霎ｼ縺ｿ
    const [rnFontsLoaded] = useFonts({
        font_standard: FONT_OPTIONS.find(f => f.id === "font_standard")!.file,
        font_soft: FONT_OPTIONS.find(f => f.id === "font_soft")!.file,
        font_stylish: FONT_OPTIONS.find(f => f.id === "font_stylish")!.file,
        font_cute: FONT_OPTIONS.find(f => f.id === "font_cute")!.file,
    });

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // 譛邨ゆｿ晏ｭ俶凾縺ｫ縺ｮ縺ｿSkia蜷域・繧貞ｮ溯｡・
    // manipulateAsync縺ｧ蜈医↓螳牙・縺ｫ繝ｪ繧ｵ繧､繧ｺ縺励※縺九ｉSkia縺ｫ貂｡縺呻ｼ医Γ繝｢繝ｪ辷・匱髦ｲ豁｢・・・URI蠖｢蠑丞ｯｾ蠢懶ｼ・
    const runFinalRender = async () => {
        if (!currentPhoto || !computed) throw new Error("Missing data");

        if (!currentPhoto || !computed) throw new Error("Missing data");

        // 蜈・判蜒上ｒOS繝阪う繝・ぅ繝悶〒螳牙・縺ｫ繝ｪ繧ｵ繧､繧ｺ・・kia縺ｸ縺ｮ蜈･蜉帙し繧､繧ｺ繧貞宛髯撰ｼ・
        const MAX_RENDER = 2000;  // 2000px = 邏・34荳・判邏・・kia繝｡繝｢繝ｪ邏・4MB縺ｫ謚大宛・・
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
            // 荳譎ゅΜ繧ｵ繧､繧ｺ繝輔ぃ繧､繝ｫ繧貞炎髯､
            if (renderUri !== currentPhoto.uri) {
                try { await FileSystem.deleteAsync(renderUri, { idempotent: true }); } catch (_) { }
            }
        }
    };

    // 繝・Φ繝励Ξ繝ｼ繝亥､画峩
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

    // 繝輔か繝ｳ繝亥､画峩
    const handleFontChange = (id: FontId) => {
        dispatch({
            type: "SET_EDITOR_OPTIONS",
            payload: { fontId: id },
        });
    };

    // 濶ｲ螟画峩
    const handleColorChange = (hex: string) => {
        dispatch({
            type: "SET_EDITOR_OPTIONS",
            payload: { dateColorHex: hex },
        });
    };

    // 繧ｳ繝｡繝ｳ繝亥､画峩
    const handleCommentChange = (text: string) => {
        // 謾ｹ陦檎ｦ∵ｭ｢
        const singleLine = text.replace(/\n/g, "");
        dispatch({
            type: "SET_EDITOR_OPTIONS",
            payload: { commentText: singleLine },
        });
    };

    // 菫晏ｭ伜・縺ｮ襍､縺｡繧・ｓ繧偵ヨ繧ｰ繝ｫ
    const scrollCommentIntoView = useCallback(() => {
        setTimeout(() => {
            formScrollRef.current?.scrollTo({
                y: Math.max(commentSectionY - 12, 0),
                animated: true,
            });
        }, 60);
    }, [commentSectionY]);

    useEffect(() => {
        if (commentFocused) {
            scrollCommentIntoView();
        }
    }, [commentFocused, keyboardVisible, scrollCommentIntoView]);

    const handleCommentSectionLayout = useCallback((event: LayoutChangeEvent) => {
        setCommentSectionY(event.nativeEvent.layout.y);
    }, []);

    const toggleTargetBaby = (babyId: string) => {
        const current = targetBabyIds;
        if (current.includes(babyId)) {
            // 譛菴・莠ｺ縺ｯ驕ｸ謚槫ｿ・・
            if (current.length <= 1) return;
            dispatch({ type: "SET_TARGET_BABY_IDS", payload: current.filter((id) => id !== babyId) });
        } else {
            dispatch({ type: "SET_TARGET_BABY_IDS", payload: [...current, babyId] });
        }
    };

    // 繧｢繝励Μ蜀・ｿ晏ｭ・
    const handleSaveToApp = async () => {
        if (!currentPhoto || !computed) return;
        if (targetBabyIds.length === 0) {
            Alert.alert(i18n.t("editor.saveTargetTitle"), i18n.t("editor.missingTarget"));
            return;
        }
        setSaving(true);
        try {
            const finalUri = await runFinalRender();
            // renderImage.ts 縺ｮ MAX_OUTPUT_DIMENSION 縺ｨ蜷医ｏ縺帙ｋ
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

            // 荳譎ゅヵ繧｡繧､繝ｫ縺ｮ縺ｿ蜑企勁・医Γ繝｢繝ｪ闢・ｩ埼亟豁｢・・
            try { await FileSystem.deleteAsync(finalUri, { idempotent: true }); } catch (_) { }

            // previewUri 縺御ｸ譎ゅヵ繧｡繧､繝ｫ・・ache繝・ぅ繝ｬ繧ｯ繝医Μ・峨・蝣ｴ蜷医・縺ｿ蜑企勁縺吶ｋ
            // 窶ｻ繝ｩ繧､繝悶Λ繝ｪ縺ｮ蜴滓悽繝輔ぃ繧､繝ｫ (documentDirectory) 繧呈欠縺励※縺・ｋ蝣ｴ蜷医・蜑企勁縺励※縺ｯ縺・￠縺ｪ縺・
            if (
                currentPhoto.previewUri &&
                currentPhoto.previewUri !== currentPhoto.uri &&
                currentPhoto.previewUri.includes('ImagePicker') // Expo Camera/ImagePicker縺ｮ繧ｭ繝｣繝・す繝･繝輔ぃ繧､繝ｫ縺ｮ迚ｹ蠕ｴ
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
            Alert.alert(i18n.t("common.error"), i18n.t("editor.saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    // iPhone蜀咏悄菫晏ｭ・
    const handleSaveToPhotos = async () => {
        if (!currentPhoto || !computed) return;
        setSaving(true);
        try {
            const finalUri = await runFinalRender();
            const success = await saveToPhotoLibrary(finalUri);
            // 荳譎ゅヵ繧｡繧､繝ｫ蜑企勁・医Γ繝｢繝ｪ闢・ｩ埼亟豁｢・・
            try { await FileSystem.deleteAsync(finalUri, { idempotent: true }); } catch (_) { }
            if (success) {
                Alert.alert(i18n.t("editor.savePhotoSuccessTitle"), i18n.t("editor.savePhotoSuccessMsg"));
            }
        } finally {
            setSaving(false);
        }
    };

    const editorIsFocused = useIsFocused();

    // 陦ｨ遉ｺ逕ｨ縺ｮ襍､縺｡繧・ｓ蜷・
    const displayBabyName = activeBabyForEditor?.name || settings.babyName;

    // 蜊ｰ蟄励ユ繧ｭ繧ｹ繝医・逕滓・
    const dateTextLine1 = useMemo(() => {
        if (!computed) return "";
        let text = "";
        if (targetBabyIds.length <= 1) {
            const parts = [];

            // 蟇ｾ雎｡縺ｨ縺ｪ繧・莠ｺ縺ｮ襍､縺｡繧・ｓ繧堤音螳・
            let targetBabyId = undefined;
            if (targetBabyIds.length === 1) {
                targetBabyId = targetBabyIds[0];
            } else if (activeBabyForEditor) {
                targetBabyId = activeBabyForEditor.id;
            }

            const b = babies.find(x => x.id === targetBabyId);
            const targetAgeDays = b ? calcAgeDays(b.birthDateISO, computed.shotDateISO || "") : computed.ageDays;

            // "n繝ｶ譛・譌･"蠖｢蠑上・險育ｮ・
            const targetAgeMonthsAndDays = b ? calcAgeMonthsAndDays(b.birthDateISO, computed.shotDateISO || "") : null;

            // 縲檎樟蝨ｨ譌･莉倥′隱慕函譌･繧医ｊ繧ょ燕縺ｮ蝣ｴ蜷医∝・逵溘↓譌･莉倥・蜊ｰ蟄励＠縺ｪ縺・阪・蟇ｾ蠢・-> 譌･謨ｰ縺ｯ繧ｰ繝ｬ繝ｼ繧｢繧ｦ繝医＠縺ｦ蜃ｺ縺輔↑縺・∵律莉倥・蜃ｺ縺・
            const isBeforeBirth = targetAgeDays !== undefined && targetAgeDays < 0;

            if (editorOptions.showDate) parts.push(computed.shotDateISO);
            if (editorOptions.showName && displayBabyName) parts.push(displayBabyName);
            if (editorOptions.showAge && targetAgeDays !== undefined && !isBeforeBirth) {
                if (editorOptions.ageFormat === "years_months" && targetAgeMonthsAndDays) {
                    const { years, months } = targetAgeMonthsAndDays;
                    if (years === 0) {
                        if (months === 0) {
                            parts.push(i18n.t("editor.ageTextDays", { days: targetAgeMonthsAndDays.days }));
                        } else {
                            parts.push(i18n.t("editor.ageTextMonths", { months }));
                        }
                    } else {
                        if (months === 0) {
                            parts.push(i18n.t("editor.ageTextYears", { years }));
                        } else {
                            parts.push(i18n.t("editor.ageTextYearsMonths", { years, months }));
                        }
                    }
                } else if (editorOptions.ageFormat === "months_days" && targetAgeMonthsAndDays) {
                    const { months, days } = targetAgeMonthsAndDays;
                    const totalMonths = targetAgeMonthsAndDays.years * 12 + months;
                    if (totalMonths === 0) {
                        parts.push(i18n.t("editor.ageTextDays", { days }));
                    } else if (days === 0) {
                        parts.push(i18n.t("editor.ageTextMonths", { months: totalMonths }));
                    } else {
                        parts.push(i18n.t("editor.ageTextMonthsDays", { months: totalMonths, days }));
                    }
                } else {
                    parts.push(i18n.t("editor.ageTextDays", { days: targetAgeDays }));
                }
            }
            text = parts.filter(Boolean).join("  ");
        } else {
            // 隍・焚莠ｺ驕ｸ謚樊凾
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
                    if (editorOptions.ageFormat === "years_months") {
                        const { years, months } = targetAgeMonthsAndDays;
                        if (years === 0) {
                            if (months === 0) {
                                bStr += `(${i18n.t("editor.ageTextDays", { days: targetAgeMonthsAndDays.days })})`;
                            } else {
                                bStr += `(${i18n.t("editor.ageTextMonths", { months })})`;
                            }
                        } else {
                            if (months === 0) {
                                bStr += `(${i18n.t("editor.ageTextYears", { years })})`;
                            } else {
                                bStr += `(${i18n.t("editor.ageTextYearsMonths", { years, months })})`;
                            }
                        }
                    } else if (editorOptions.ageFormat === "months_days") {
                        const { years, months, days } = targetAgeMonthsAndDays;
                        const totalMonths = years * 12 + months;
                        if (totalMonths === 0) {
                            bStr += `(${i18n.t("editor.ageTextDays", { days })})`;
                        } else if (days === 0) {
                            bStr += `(${i18n.t("editor.ageTextMonths", { months: totalMonths })})`;
                        } else {
                            bStr += `(${i18n.t("editor.ageTextMonthsDays", { months: totalMonths, days })})`;
                        }
                    } else {
                        bStr += `(${i18n.t("editor.ageTextDays", { days: ageDays })})`;
                    }
                }
                return bStr;
            }).filter(Boolean);

            if (babyParts.length > 0) {
                // 隍・焚莠ｺ縺ｮ蝣ｴ蜷医・繧ｹ繝壹・繧ｹ1縺､縺ｧ蛹ｺ蛻・ｋ
                parts.push(babyParts.join(" "));
            }
            text = parts.filter(Boolean).join("  ");
        }
        return text;
    }, [targetBabyIds, editorOptions, computed, babies, displayBabyName]);

    // 菫晏ｭ伜・縺悟・蜩｡・医∪縺溘・蜊倡峡・芽ｪ慕函譌･蜑阪°縺ｩ縺・°蛻､螳夲ｼ域律謨ｰ縺ｮ繧ｹ繧､繝・メ繧壇isabled縺ｫ縺吶ｋ縺溘ａ・・
    const allSelectedBeforeBirth = useMemo(() => {
        if (!computed || targetBabyIds.length === 0) return false;
        return targetBabyIds.every(id => {
            const b = babies.find(x => x.id === id);
            if (!b) return false;
            return calcAgeDays(b.birthDateISO, computed.shotDateISO || "") < 0;
        });
    }, [targetBabyIds, babies, computed]);

    // 繝輔か繝ｼ繧ｫ繧ｹ縺悟､悶ｌ縺溷ｴ蜷医・繝｡繝｢繝ｪ遽邏・・縺溘ａ霆ｽ驥上・繝ｬ繝ｼ繧ｹ繝帙Ν繝繝ｼ繧定｡ｨ遉ｺ
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

    const tpl = getTemplateConfig(editorOptions.templateId);
    const previewAspect = currentPhoto.width / currentPhoto.height;
    const naturalPreviewHeight = PREVIEW_WIDTH / previewAspect;
    const previewShellHeight = keyboardVisible ? PREVIEW_COMPACT_HEIGHT : PREVIEW_EXPANDED_HEIGHT;
    const previewScale = Math.min(1, previewShellHeight / naturalPreviewHeight);
    const previewWidth = PREVIEW_WIDTH * previewScale;
    const previewHeight = naturalPreviewHeight * previewScale;
    const footerPaddingBottom = Math.max(insets.bottom, 12);
    const footerSpacerHeight = FOOTER_BASE_HEIGHT + footerPaddingBottom;

    const shortSide = Math.min(previewWidth, previewHeight);
    const isMultiBaby = targetBabyIds.length > 1;
    const dateFontSize = shortSide * 0.04 * (isMultiBaby ? 0.75 : 1);
    const commentFontSize = shortSide * 0.038;
    const margin = shortSide * (tpl.hasFrame ? 0.06 : 0.04);
    const gap = shortSide * 0.015;
    const inset = shortSide * 0.06;
    const bottomInset = shortSide * 0.18;

    const previewPhotoW = tpl.hasFrame
        ? previewWidth - inset * 2
        : previewWidth;

    const previewPhotoH = tpl.hasFrame
        ? previewHeight - inset - bottomInset
        : previewHeight;

    const previewPhotoX = tpl.hasFrame ? inset : 0;
    const previewPhotoY = tpl.hasFrame ? inset : 0;
    const previewMaxWidth = previewWidth - margin * 2;
    const previewDateFontSize = dateFontSize;
    const previewCommentFontSize = commentFontSize;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["left", "right", "bottom"]}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
            >
                <View style={styles.content}>
                    <View style={styles.fixedPreviewArea}>
                        <View style={[styles.previewStage, { height: previewShellHeight, backgroundColor: theme.light, borderColor: theme.accent }]}>
                            <View
                                style={[
                                    styles.previewContainer,
                                    {
                                        width: previewWidth,
                                        height: previewHeight,
                                        backgroundColor: tpl.hasFrame ? "#FFFFFF" : "#000000",
                                    },
                                ]}
                            >
                                <View
                                    style={{
                                        position: "absolute",
                                        left: previewPhotoX,
                                        top: previewPhotoY,
                                        width: previewPhotoW,
                                        height: previewPhotoH,
                                        overflow: "hidden",
                                    }}
                                >
                                    <Image
                                        source={{ uri: currentPhoto.previewUri || currentPhoto.uri }}
                                        style={{ width: "100%", height: "100%" }}
                                        resizeMode={editorOptions.templateId === "tpl_frame_full" ? "contain" : "cover"}
                                    />
                                </View>

                                <View
                                    style={{
                                        position: "absolute",
                                        right: margin,
                                        ...(tpl.hasFrame ? { top: previewPhotoY + previewPhotoH + gap } : { bottom: margin }),
                                        alignItems: "flex-end",
                                    }}
                                >
                                    {(editorOptions.showDate || editorOptions.showName || editorOptions.showAge) && (
                                        <Text
                                            style={{
                                                fontFamily: editorOptions.fontId,
                                                fontSize: previewDateFontSize,
                                                color: editorOptions.dateColorHex,
                                                fontWeight: "bold",
                                                textShadowColor: tpl.hasTextStroke ? "#000" : "transparent",
                                                textShadowOffset: { width: 1, height: 1 },
                                                textShadowRadius: 1,
                                                width: previewMaxWidth,
                                                textAlign: "right",
                                            }}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                        >
                                            {dateTextLine1}
                                        </Text>
                                    )}
                                    {editorOptions.commentText ? (
                                        <Text
                                            style={{
                                                fontFamily: editorOptions.fontId,
                                                fontSize: previewCommentFontSize,
                                                color: editorOptions.dateColorHex,
                                                fontWeight: "bold",
                                                marginTop: gap,
                                                textShadowColor: tpl.hasTextStroke ? "#000" : "transparent",
                                                textShadowOffset: { width: 1, height: 1 },
                                                textShadowRadius: 1,
                                                width: previewMaxWidth,
                                                textAlign: "right",
                                            }}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                        >
                                            {editorOptions.commentText}
                                        </Text>
                                    ) : null}
                                </View>

                                {saving && (
                                    <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }]}>
                                        <ActivityIndicator size="large" color={theme.accent} />
                                        <Text style={{ color: "#FFF", marginTop: 12, fontWeight: "bold" }}>{i18n.t("editor.saving")}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    <ScrollView
                        ref={formScrollRef}
                        style={styles.formScroll}
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: footerSpacerHeight }]}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                    >
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
                                                <View
                                                    style={[
                                                        styles.targetDot,
                                                        { backgroundColor: isSelected ? "#FFF" : babyTheme.accent },
                                                    ]}
                                                />
                                                <Text
                                                    style={[
                                                        styles.targetText,
                                                        { color: isSelected ? "#FFF" : "#555" },
                                                    ]}
                                                >
                                                    {baby.name}
                                                </Text>
                                                {isSelected && <Ionicons name="checkmark" size={16} color="#FFF" />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                {targetBabyIds.length > 1 && <Text style={styles.targetHint}>{i18n.t("editor.saveTargetHint")}</Text>}
                            </View>
                        )}

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

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{i18n.t("editor.dateColorTitle")}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
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
                                    <View style={[styles.toggleItem, { width: 130 }]}>
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
                                            <View style={styles.formatSegmentDivider} />
                                            <TouchableOpacity
                                                style={[styles.formatSegmentButton, editorOptions.ageFormat === "years_months" && styles.formatSegmentButtonActive]}
                                                onPress={() => dispatch({ type: "SET_EDITOR_OPTIONS", payload: { ageFormat: "years_months" } })}
                                            >
                                                <Text style={[styles.formatSegmentText, editorOptions.ageFormat === "years_months" && { color: theme.accent }]}>{i18n.t("editor.ageFormatYearsMonths")}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        <View style={styles.section} onLayout={handleCommentSectionLayout}>
                            <Text style={styles.sectionTitle}>{i18n.t("editor.commentTitle")}</Text>
                            <TextInput
                                style={[styles.commentInput, commentFocused && { borderColor: theme.accent, backgroundColor: "#FFF" }]}
                                value={editorOptions.commentText}
                                onChangeText={handleCommentChange}
                                onFocus={() => {
                                    setCommentFocused(true);
                                    scrollCommentIntoView();
                                }}
                                onBlur={() => setCommentFocused(false)}
                                placeholder={i18n.t("editor.commentPlaceholder")}
                                placeholderTextColor="#BDBDBD"
                                maxLength={50}
                                returnKeyType="done"
                                blurOnSubmit
                                selectionColor={theme.accent}
                            />
                        </View>
                    </ScrollView>

                    <View style={[styles.footerContainer, { paddingBottom: footerPaddingBottom, backgroundColor: theme.background }]}>
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
                    </View>
                </View>
            </KeyboardAvoidingView>
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
    },
    fixedPreviewArea: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    previewStage: {
        borderRadius: 24,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 3,
    },
    formScroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 4,
    },
    previewContainer: {
        backgroundColor: "#F5F5F5",
        borderRadius: 18,
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
    buttonContainer: {
        gap: 12,
    },
    footerContainer: {
        borderTopWidth: 1,
        borderTopColor: "#F1E6EA",
        paddingHorizontal: 16,
        paddingTop: 14,
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
