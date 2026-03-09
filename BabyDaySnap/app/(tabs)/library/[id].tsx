import { useMemo } from "react";
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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import { getThemePreset } from "@/constants/babyTheme";
import { saveToPhotoLibrary, deleteFromAppLibrary } from "@/utils/saveImage";
import { formatDateDisplay, msToDateISO, calcAgeMonthsAndDays } from "@/utils/date";
import { getTemplateConfig } from "@/utils/templates";
import { Ionicons } from "@expo/vector-icons";
import type { AppLibraryItem } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_WIDTH = SCREEN_WIDTH;

export default function LibraryDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { library, babies, activeBabyId } = useAppState();
    const dispatch = useAppDispatch();
    const router = useRouter();

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
                <Text style={styles.errorText}>写真が見つかりません</Text>
            </View>
        );
    }

    const handleSaveToPhotos = async (item: AppLibraryItem) => {
        const success = await saveToPhotoLibrary(item.renderedFileUri);
        if (success) {
            Alert.alert("保存完了", "写真ライブラリに保存しました。");
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
        Alert.alert("削除確認", "この写真を削除しますか？", [
            { text: "キャンセル", style: "cancel" },
            {
                text: "削除",
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
                    <View style={[styles.imageContainer, {
                        height: imageHeight,
                        backgroundColor: tpl.hasFrame ? "#FFFFFF" : "#F5F5F5",
                    }]}>
                        <Image
                            source={{ uri: item.renderedFileUri }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </View>

                    {/* メタ情報 */}
                    <View style={styles.metaContainer}>
                        {/* 所属する赤ちゃん */}
                        {item.babyIds && item.babyIds.length > 0 && (
                            <View style={styles.metaRow}>
                                <Text style={styles.metaLabel}>赤ちゃん</Text>
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
                            <Text style={styles.metaLabel}>生後日数</Text>
                            <Text style={styles.metaValue}>
                                {(() => {
                                    if (item.ageDays < 0) return `${item.ageDays}日`;
                                    const b = babies.find(x => item.babyIds.includes(x.id)) || babies[0];
                                    if (!b) return `${item.ageDays}日`;

                                    const format = item.ageFormat || "days";
                                    if (format === "days") return `${item.ageDays}日`;

                                    const { years, months, days } = calcAgeMonthsAndDays(b.birthDateISO, item.shotDateISO);
                                    if (format === "years_months") {
                                        if (years === 0) {
                                            if (months === 0) return `${days}日`;
                                            return `${months}ヶ月`;
                                        }
                                        const yPart = `${years}年`;
                                        const mPart = months > 0 ? `${months}ヶ月` : "";
                                        return `${yPart}${mPart}`;
                                    } else {
                                        // months_days
                                        const totalMonths = years * 12 + months;
                                        if (totalMonths === 0) return `${days}日`;
                                        if (days === 0) return `${totalMonths}ヶ月`;
                                        return `${totalMonths}ヶ月${days}日`;
                                    }
                                })()}
                            </Text>
                        </View>

                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>撮影日</Text>
                            <Text style={styles.metaValue}>
                                {formatDateDisplay(item.shotDateISO)}
                            </Text>
                        </View>

                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>テンプレート</Text>
                            <Text style={styles.metaValue}>{tpl.label}</Text>
                        </View>

                        <View style={styles.metaRow}>
                            <Text style={styles.metaLabel}>日付色</Text>
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
                                <Text style={styles.metaLabel}>コメント</Text>
                                <Text style={styles.metaValue}>{item.commentText}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* アクションボタン */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.reeditButton, { backgroundColor: itemTheme.accent, shadowColor: itemTheme.shadow }]} onPress={() => handleReedit(item)}>
                            <Ionicons name="color-wand-outline" size={20} color="#FFF" />
                            <Text style={styles.saveButtonText}>再編集する</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.saveButton, { backgroundColor: itemTheme.light }]} onPress={() => handleSaveToPhotos(item)}>
                            <Ionicons name="image-outline" size={20} color={itemTheme.accent} />
                            <Text style={[styles.saveButtonTextOutline, { color: itemTheme.accent }]}>iPhone写真に保存</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.shareButton, { borderColor: itemTheme.accent }]} onPress={() => handleShare(item)}>
                            <Ionicons name="share-outline" size={20} color={itemTheme.accent} />
                            <Text style={[styles.shareButtonText, { color: itemTheme.accent }]}>共有</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
                            <Ionicons name="trash-outline" size={20} color="#FF4444" />
                            <Text style={styles.deleteButtonText}>削除</Text>
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
        />
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
});
