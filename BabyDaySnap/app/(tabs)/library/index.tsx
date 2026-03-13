import { useCallback, useState, useRef, useMemo, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    Alert,
    ScrollView,
    Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppState, useAppDispatch, useActiveBaby } from "@/context/AppContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { deleteFromAppLibrary, saveToPhotoLibrary } from "@/utils/saveImage";
import { getThemePreset, NEUTRAL_THEME } from "@/constants/babyTheme";
import type { AppLibraryItem } from "@/types";
import i18n from "@/lib/i18n";
import { AppHeader } from "@/components/AppHeader";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const GRID_GAP = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function LibraryGridScreen() {
    const { library, babies, activeBabyId } = useAppState();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const activeBaby = useActiveBaby();

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const pagerRef = useRef<FlatList>(null);

    // テーマカラー取得
    const theme = activeBaby ? getThemePreset(activeBaby.themeColorHex) : NEUTRAL_THEME;

    // アクティブな赤ちゃんのライブラリのみ表示
    const filteredLibrary = useMemo(() => {
        if (!activeBabyId) return library;
        return library.filter((item) => item.babyIds.includes(activeBabyId));
    }, [library, activeBabyId]);

    // スワイプで赤ちゃん切り替え
    const handleBabySwitch = (babyId: string) => {
        if (babyId !== activeBabyId) {
            dispatch({ type: "SET_ACTIVE_BABY", payload: babyId });
            setIsSelectionMode(false);
            setSelectedIds([]);
        }
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds([]);
    };

    // タブで赤ちゃんが直接変更された場合にページャーをスクロール
    useEffect(() => {
        if (!activeBabyId || babies.length === 0 || !pagerRef.current) return;
        const index = babies.findIndex((b) => b.id === activeBabyId);
        if (index >= 0) {
            pagerRef.current.scrollToIndex({ index, animated: true });
        }
    }, [activeBabyId, babies]);

    const handlePress = useCallback(
        (item: AppLibraryItem) => {
            if (isSelectionMode) {
                setSelectedIds((prev) =>
                    prev.includes(item.id)
                        ? prev.filter((id) => id !== item.id)
                        : [...prev, item.id],
                );
            } else {
                router.push(`/(tabs)/library/${item.id}`);
            }
        },
        [isSelectionMode, router],
    );

    const handleDeleteSelected = () => {
        if (selectedIds.length === 0) return;
        Alert.alert(
            i18n.t("library.deleteConfirmTitle"),
            i18n.t("library.deleteConfirmMsg", { count: selectedIds.length }),
            [
                { text: i18n.t("library.cancel"), style: "cancel" },
                {
                    text: i18n.t("library.delete"),
                    style: "destructive",
                    onPress: async () => {
                        const itemsToDelete = library.filter((i) => selectedIds.includes(i.id));
                        for (const item of itemsToDelete) {
                            await deleteFromAppLibrary(item);
                            dispatch({ type: "LIBRARY_REMOVE", payload: item.id });
                        }
                        setIsSelectionMode(false);
                        setSelectedIds([]);
                    },
                },
            ],
        );
    };

    const handleSaveSelected = async () => {
        if (selectedIds.length === 0) return;

        const itemsToSave = library.filter((i) => selectedIds.includes(i.id));
        let successCount = 0;

        for (const item of itemsToSave) {
            const success = await saveToPhotoLibrary(item.renderedFileUri);
            if (success) successCount++;
        }

        if (successCount === itemsToSave.length) {
            Alert.alert(i18n.t("library.saveCompleteTitle"), i18n.t("library.saveCompleteMsg", { count: successCount }));
        } else if (successCount > 0) {
            Alert.alert(i18n.t("library.saveCompleteTitle"), i18n.t("library.savePartialMsg", { count: successCount }));
        }

        setIsSelectionMode(false);
        setSelectedIds([]);
    };

    const renderGridItem = useCallback(
        ({ item }: { item: AppLibraryItem }) => {
            const isSelected = selectedIds.includes(item.id);
            return (
                <TouchableOpacity
                    style={styles.gridItem}
                    onPress={() => handlePress(item)}
                    activeOpacity={0.8}
                >
                    <Image
                        source={{ uri: item.renderedFileUri }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                    />
                    <View style={styles.dateOverlay}>
                        <Text style={styles.dateOverlayText}>{item.shotDateISO}</Text>
                    </View>
                    {isSelectionMode && (
                        <View style={[styles.selectionOverlay, isSelected && [styles.selectionOverlayActive, { borderColor: theme.accent }]]}>
                            <Ionicons
                                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                                size={24}
                                color={isSelected ? theme.accent : "rgba(255,255,255,0.8)"}
                            />
                        </View>
                    )}
                </TouchableOpacity>
            );
        },
        [handlePress, isSelectionMode, selectedIds, theme],
    );

    return (
        <SafeAreaView style={styles.screen} edges={["top"]}>
            <AppHeader
                title={activeBaby ? activeBaby.name : i18n.t("library.headerTitle")}
                subtitle={i18n.t("library.headerCount", { count: filteredLibrary.length })}
                rightSlot={filteredLibrary.length > 0 ? (
                    <TouchableOpacity onPress={toggleSelectionMode} style={[styles.headerButton, { backgroundColor: theme.light }]}>
                        <Text style={[styles.headerButtonText, { color: theme.accent }]}>
                            {isSelectionMode ? i18n.t("library.cancelModeButton") : i18n.t("library.selectModeButton")}
                        </Text>
                    </TouchableOpacity>
                ) : null}
            />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* 赤ちゃん切り替えタブ（2人以上の場合のみ） */}
            {babies.length > 1 && (
                <View style={styles.babyTabContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.babyTabContent}
                    >
                        {babies.map((baby) => {
                            const isActive = baby.id === activeBabyId;
                            const babyTheme = getThemePreset(baby.themeColorHex);
                            return (
                                <TouchableOpacity
                                    key={baby.id}
                                    style={[
                                        styles.babyTab,
                                        isActive && { backgroundColor: babyTheme.accent },
                                    ]}
                                    onPress={() => handleBabySwitch(baby.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.babyDot, { backgroundColor: isActive ? "#FFF" : babyTheme.accent }]} />
                                    <Text style={[
                                        styles.babyTabText,
                                        isActive && { color: "#FFF", fontWeight: "700" },
                                    ]}>
                                        {baby.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* ヘッダー */}
            {babies.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="images-outline" size={64} color="#DDD" />
                    <Text style={styles.emptyTitle}>{i18n.t("library.emptyTitle")}</Text>
                    <Text style={styles.emptySubtitle}>
                        {i18n.t("library.emptySubtitle")}
                    </Text>
                </View>
            ) : (
                <View style={styles.listContainer}>
                    <FlatList
                        ref={pagerRef}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        data={babies}
                        keyExtractor={(b) => b.id}
                        getItemLayout={(data, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
                        onMomentumScrollEnd={(e) => {
                            const x = e.nativeEvent.contentOffset.x;
                            const idx = Math.round(x / SCREEN_WIDTH);
                            if (babies[idx] && babies[idx].id !== activeBabyId) {
                                dispatch({ type: "SET_ACTIVE_BABY", payload: babies[idx].id });
                                setIsSelectionMode(false);
                                setSelectedIds([]);
                            }
                        }}
                        renderItem={({ item: baby }) => {
                            const babyLibrary = library.filter(i => i.babyIds.includes(baby.id));

                            if (babyLibrary.length === 0) {
                                return (
                                    <View style={[{ width: SCREEN_WIDTH }, styles.emptyContainer]}>
                                        <Ionicons name="images-outline" size={64} color="#DDD" />
                                        <Text style={styles.emptyTitle}>{i18n.t("library.emptyTitle")}</Text>
                                        <Text style={styles.emptySubtitle}>
                                            {i18n.t("library.emptySubtitle")}
                                        </Text>
                                    </View>
                                );
                            }

                            return (
                                <View style={{ width: SCREEN_WIDTH }}>
                                    <FlatList
                                        data={babyLibrary}
                                        keyExtractor={(item) => item.id}
                                        numColumns={NUM_COLUMNS}
                                        renderItem={renderGridItem}
                                        contentContainerStyle={styles.gridContainer}
                                        columnWrapperStyle={styles.columnWrapper}
                                        showsVerticalScrollIndicator={false}
                                        windowSize={5}
                                        removeClippedSubviews={true}
                                        maxToRenderPerBatch={9}
                                        initialNumToRender={12}
                                    />
                                </View>
                            );
                        }}
                    />

                    {isSelectionMode && (
                        <View style={styles.bottomBar}>
                            <TouchableOpacity
                                style={[styles.bottomButton, styles.deleteButton, selectedIds.length === 0 && styles.buttonDisabled]}
                                onPress={handleDeleteSelected}
                                disabled={selectedIds.length === 0}
                            >
                                <Ionicons name="trash-outline" size={20} color={selectedIds.length === 0 ? "#CCC" : "#FF4444"} />
                                <Text style={[styles.buttonText, styles.deleteButtonText, selectedIds.length === 0 && styles.buttonTextDisabled]}>
                                    {i18n.t("library.deleteButton", { count: selectedIds.length })}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.bottomButton, styles.saveButton, selectedIds.length === 0 && styles.buttonDisabled]}
                                onPress={handleSaveSelected}
                                disabled={selectedIds.length === 0}
                            >
                                <Ionicons name="download-outline" size={20} color={selectedIds.length === 0 ? "#CCC" : "#4CAF50"} />
                                <Text style={[styles.buttonText, styles.saveButtonText, selectedIds.length === 0 && styles.buttonTextDisabled]}>
                                    {i18n.t("library.saveButton", { count: selectedIds.length })}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
            </View>
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
    },
    babyTabContainer: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    babyTabContent: {
        flexDirection: "row",
        gap: 8,
    },
    babyTab: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#F0F0F0",
        gap: 6,
    },
    babyDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    babyTabText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#666",
    },
    gridContainer: {
        paddingHorizontal: GRID_GAP,
        paddingBottom: 20,
    },
    columnWrapper: {
        gap: GRID_GAP,
        marginBottom: GRID_GAP,
    },
    gridItem: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        borderRadius: 4,
        overflow: "hidden",
    },
    thumbnail: {
        width: "100%",
        height: "100%",
    },
    dateOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(0,0,0,0.4)",
        paddingVertical: 2,
        paddingHorizontal: 4,
    },
    dateOverlayText: {
        color: "#FFF",
        fontSize: 9,
        fontWeight: "600",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#888",
        marginTop: 16,
    },
    emptySubtitle: {
        fontSize: 14,
        color: "#BBB",
        textAlign: "center",
        lineHeight: 20,
        marginTop: 8,
    },
    listContainer: {
        flex: 1,
    },
    headerButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    headerButtonText: {
        fontSize: 14,
        fontWeight: "600",
    },
    selectionOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.2)",
        justifyContent: "flex-end",
        alignItems: "flex-end",
        padding: 4,
    },
    selectionOverlayActive: {
        backgroundColor: "rgba(255,143,163,0.2)",
        borderWidth: 2,
    },
    bottomBar: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: "#EEE",
        backgroundColor: "#FFF",
    },
    bottomButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
    },
    deleteButton: {
        backgroundColor: "#FFEAEA",
    },
    saveButton: {
        backgroundColor: "#E8F5E9",
    },
    buttonDisabled: {
        backgroundColor: "#F5F5F5",
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    deleteButtonText: {
        color: "#FF4444",
    },
    saveButtonText: {
        color: "#4CAF50",
    },
    buttonTextDisabled: {
        color: "#CCC",
    },
});
