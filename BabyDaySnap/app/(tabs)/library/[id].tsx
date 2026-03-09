import { useMemo, useState } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    Dimensions,
    Share,
    FlatList,
    Modal,
    Pressable,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS,
} from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import { getThemePreset } from "@/constants/babyTheme";
import { saveToPhotoLibrary, deleteFromAppLibrary } from "@/utils/saveImage";
import { formatDateDisplay, msToDateISO, calcAgeMonthsAndDays } from "@/utils/date";
import { getTemplateConfig } from "@/utils/templates";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/lib/i18n";
import type { AppLibraryItem } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_WIDTH = SCREEN_WIDTH;

export default function LibraryDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { library, babies, activeBabyId } = useAppState();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [isFullImageVisible, setIsFullImageVisible] = useState(false);
    const [zoomImageUri, setZoomImageUri] = useState("");

    const filteredLibrary = useMemo(() => {
        if (!activeBabyId) return library;
        return library.filter((item) => item.babyIds.includes(activeBabyId));
    }, [library, activeBabyId]);

    const initialIndex = useMemo(() => {
        const idx = filteredLibrary.findIndex((i) => i.id === id);
        return idx >= 0 ? idx : 0;
    }, [filteredLibrary, id]);

    if (filteredLibrary.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{i18n.t("detail.notFound")}</Text>
            </View>
        );
    }

    const handleSaveToPhotos = async (item: AppLibraryItem) => {
        const success = await saveToPhotoLibrary(item.renderedFileUri);
        if (success) {
            Alert.alert(i18n.t("detail.saveSuccessTitle"), i18n.t("detail.saveSuccessMsg"));
        }
    };

    const handleShare = async (item: AppLibraryItem) => {
        try {
            await Share.share({
                url: item.renderedFileUri,
            });
        } catch {
        }
    };

    const handleReedit = (item: AppLibraryItem) => {
        // 元画像の復元
        dispatch({
            type: "SET_PHOTO",
            payload: {
                // originalFileUriが消えたり読めなくなると真っ白になるので fallback 処理を入れる
                uri: item.originalFileUri || item.renderedFileUri,
                previewUri: item.originalFileUri || item.renderedFileUri,
                width: (item as any).originalWidth ?? item.width,
                height: (item as any).originalHeight ?? item.height,
                source: item.source,
            },
        });
        // 計算結果の復元
        dispatch({
            type: "SET_COMPUTED",
            payload: {
                shotDateISO: item.shotDateISO,
                ageDays: item.ageDays,
            },
        });
        // エディタ設定の復元（過去バージョン互換のためフォールバックあり）
        dispatch({
            type: "SET_EDITOR_OPTIONS",
            payload: {
                templateId: item.templateId,
                dateColorHex: item.dateColorHex,
                commentText: item.commentText,
                fontId: (item as any).fontId || "font_standard",
                showDate: (item as any).showDate ?? true,
                showName: (item as any).showName ?? true,
                showAge: (item as any).showAge ?? true,
            },
        });
        dispatch({
            type: "SET_EDITING_LIBRARY_ID",
            payload: item.id,
        });
        // 保存先を復元
        if (item.babyIds && item.babyIds.length > 0) {
            dispatch({ type: "SET_TARGET_BABY_IDS", payload: item.babyIds });
        }
        router.replace("/(tabs)/camera/editor");
    };

    const handleDelete = (item: AppLibraryItem) => {
        Alert.alert(i18n.t("detail.deleteConfirmTitle"), i18n.t("detail.deleteConfirmMsg"), [
            { text: i18n.t("detail.cancel"), style: "cancel" },
            {
                text: i18n.t("detail.delete"),
                style: "destructive",
                onPress: async () => {
                    await deleteFromAppLibrary(item);
                    dispatch({ type: "LIBRARY_REMOVE", payload: item.id });
                    if (filteredLibrary.length <= 1) {
                        router.back();
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }: { item: AppLibraryItem }) => {
        const tpl = getTemplateConfig(item.templateId);
        const aspect = item.width / item.height;
        const imageHeight = IMAGE_WIDTH / aspect;
        const itemTheme = item.babyIds && item.babyIds.length > 0
            ? getThemePreset(babies.find((b) => b.id === item.babyIds[0])?.themeColorHex || "#FF8FA3")
            : getThemePreset("#FF8FA3");

        return (
            <View style={{ width: SCREEN_WIDTH, backgroundColor: itemTheme.background }}>
                <ScrollView
                    style={[styles.container, { backgroundColor: itemTheme.background }]}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* 画像大表示 */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                            setZoomImageUri(item.renderedFileUri);
                            setIsFullImageVisible(true);
                        }}
                        style={[styles.imageContainer, {
                            height: imageHeight,
                            backgroundColor: tpl.hasFrame ? "#FFFFFF" : "#F5F5F5",
                        }]}
                    >
                        <Image
                            source={{ uri: item.renderedFileUri }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>

                    {/* メタ情報 */}
                    <View style={styles.metaContainer}>
                        {/* 所属する赤ちゃん */}
                        {item.babyIds && item.babyIds.length > 0 && (
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>{i18n.t("detail.babyLabel")}</Text>
                                <View style={{ flexDirection: "row", gap: 6 }}>
                                    {item.babyIds.map((bid) => {
                                        const b = babies.find((bb) => bb.id === bid);
                                        if (!b) return null;
                                        const bTheme = getThemePreset(b.themeColorHex);
                                        return (
                                            <View key={bid} style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: bTheme.light, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: bTheme.accent }} />
                                                <Text style={{ fontSize: 13, color: bTheme.accent, fontWeight: "600" }}>{b.name}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>{i18n.t("detail.ageLabel")}</Text>
                            <Text style={styles.metaValue}>
                                {(() => {
                                    if (item.ageDays < 0) return i18n.t("editor.ageTextDays", { days: item.ageDays });
                                    const b = babies.find(x => item.babyIds.includes(x.id)) || babies[0];
                                    if (!b) return i18n.t("editor.ageTextDays", { days: item.ageDays });

                                    const format = item.ageFormat || "days";
                                    if (format === "days") return i18n.t("editor.ageTextDays", { days: item.ageDays });

                                    const { years, months, days } = calcAgeMonthsAndDays(b.birthDateISO, item.shotDateISO);
                                    if (format === "years_months") {
                                        if (years === 0) {
                                            if (months === 0) return i18n.t("editor.ageTextDays", { days });
                                            return i18n.t("editor.ageTextMonths", { months });
                                        }
                                        if (months === 0) return i18n.t("editor.ageTextYears", { years });
                                        return i18n.t("editor.ageTextYearsMonths", { years, months });
                                    } else {
                                        // months_days
                                        const totalMonths = years * 12 + months;
                                        if (totalMonths === 0) return i18n.t("editor.ageTextDays", { days });
                                        if (days === 0) return i18n.t("editor.ageTextMonths", { months: totalMonths });
                                        return i18n.t("editor.ageTextMonthsDays", { months: totalMonths, days });
                                    }
                                })()}
                            </Text>
                        </View>

                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>{i18n.t("detail.shotDateLabel")}</Text>
                            <Text style={styles.metaValue}>
                                {formatDateDisplay(item.shotDateISO)}
                            </Text>
                        </View>

                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>{i18n.t("detail.templateLabel")}</Text>
                            <Text style={styles.metaValue}>{tpl.label}</Text>
                        </View>

                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>{i18n.t("detail.colorLabel")}</Text>
                            <View style={styles.colorPreviewRow}>
                                <View
                                    style={[
                                        styles.colorPreviewDot,
                                        { backgroundColor: item.dateColorHex },
                                        item.dateColorHex === "#FFFFFF" && { borderWidth: 1, borderColor: "#DDD" },
                                    ]}
                                />
                                <Text style={styles.metaValue}>{item.dateColorHex}</Text>
                            </View>
                        </View>

                        {item.commentText ? (
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>{i18n.t("detail.commentLabel")}</Text>
                                <Text style={styles.metaValue}>{item.commentText}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* アクションボタン */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.reeditButton, { backgroundColor: itemTheme.accent, shadowColor: itemTheme.shadow }]} onPress={() => handleReedit(item)}>
                            <Ionicons name="color-wand-outline" size={20} color="#FFF" />
                            <Text style={styles.saveButtonText}>{i18n.t("detail.reeditButton")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.saveButton, { backgroundColor: itemTheme.light }]} onPress={() => handleSaveToPhotos(item)}>
                            <Ionicons name="image-outline" size={20} color={itemTheme.accent} />
                            <Text style={[styles.saveButtonTextOutline, { color: itemTheme.accent }]}>{i18n.t("detail.saveToiPhoneButton")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.shareButton, { borderColor: itemTheme.accent }]} onPress={() => handleShare(item)}>
                            <Ionicons name="share-outline" size={20} color={itemTheme.accent} />
                            <Text style={[styles.shareButtonText, { color: itemTheme.accent }]}>{i18n.t("detail.shareButton")}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
                            <Ionicons name="trash-outline" size={20} color="#FF4444" />
                            <Text style={styles.deleteButtonText}>{i18n.t("detail.deleteButton")}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>
        );
    };

    return (
        <FlatList
            data={filteredLibrary}
            keyExtractor={(i) => i.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialIndex}
            getItemLayout={(data, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            renderItem={renderItem}
            windowSize={3}
            maxToRenderPerBatch={3}
            ListFooterComponent={
                <Modal visible={isFullImageVisible} transparent={true} animationType="fade">
                    <View style={styles.modalContainer}>
                        <ZoomableImage
                            uri={zoomImageUri}
                            onClose={() => setIsFullImageVisible(false)}
                        />
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setIsFullImageVisible(false)}
                        >
                            <Ionicons name="close" size={30} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </Modal>
            }
        />
    );
}

function ZoomableImage({ uri, onClose }: { uri: string; onClose: () => void }) {
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const pinchGesture = Gesture.Pinch()
        .onStart(() => {
            savedScale.value = scale.value;
        })
        .onUpdate((e) => {
            scale.value = savedScale.value * e.scale;
        })
        .onEnd(() => {
            if (scale.value < 1) {
                scale.value = withTiming(1);
                savedScale.value = 1;
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else if (scale.value > 5) {
                scale.value = withTiming(5);
                savedScale.value = 5;
            } else {
                savedScale.value = scale.value;
            }
        });

    const panGesture = Gesture.Pan()
        .onStart(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        })
        .onUpdate((e) => {
            if (scale.value > 1) {
                translateX.value = savedTranslateX.value + e.translationX;
                translateY.value = savedTranslateY.value + e.translationY;
            } else {
                if (e.translationY > 0) {
                    translateY.value = e.translationY;
                }
            }
        })
        .onEnd((e) => {
            if (scale.value > 1) {
                savedTranslateX.value = translateX.value;
                savedTranslateY.value = translateY.value;
            } else {
                if (e.translationY > 80) {
                    runOnJS(onClose)();
                } else {
                    translateX.value = withTiming(0);
                    translateY.value = withTiming(0);
                    savedTranslateX.value = 0;
                    savedTranslateY.value = 0;
                }
            }
        });

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onStart(() => {
            if (scale.value > 1) {
                scale.value = withTiming(1);
                savedScale.value = 1;
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else {
                scale.value = withTiming(2.5);
                savedScale.value = 2.5;
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            }
        });

    const composed = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    return (
        <GestureDetector gesture={composed}>
            <Animated.Image
                source={{ uri }}
                style={[styles.fullImage, animatedStyle]}
                resizeMode="contain"
            />
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF",
    },
    scrollContent: {
        paddingTop: 0,
    },
    imageContainer: {
        width: IMAGE_WIDTH,
        backgroundColor: "#F5F5F5",
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    buttonContainer: {
        marginTop: 24,
        paddingHorizontal: 16,
        gap: 12,
    },
    metaContainer: {
        marginTop: 24,
        marginHorizontal: 16,
        backgroundColor: "#FAFAFA",
        borderRadius: 12,
        padding: 16,
        gap: 14,
    },
    metaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    metaLabel: {
        fontSize: 14,
        color: "#888",
        fontWeight: "500",
    },
    metaValue: {
        fontSize: 14,
        color: "#333",
        fontWeight: "600",
    },
    colorPreviewRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    colorPreviewDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    reeditButton: {
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
    saveButton: {
        backgroundColor: "#FFF0F3",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
    },
    saveButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },
    saveButtonTextOutline: {
        color: "#FF8FA3",
        fontSize: 16,
        fontWeight: "700",
    },
    shareButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: "#FF8FA3",
        gap: 8,
    },
    shareButtonText: {
        color: "#FF8FA3",
        fontSize: 16,
        fontWeight: "700",
    },
    deleteButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#FFD0D0",
        gap: 8,
    },
    deleteButtonText: {
        color: "#FF4444",
        fontSize: 15,
        fontWeight: "600",
    },
    errorText: {
        fontSize: 16,
        color: "#888",
        textAlign: "center",
        marginTop: 40,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    fullImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 1.5, // Arbitrary large height, contain handles it
    },
    closeButton: {
        position: "absolute",
        top: 50,
        right: 20,
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 20,
        padding: 5,
    },
});
