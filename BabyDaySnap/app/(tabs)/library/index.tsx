import { useCallback, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { deleteFromAppLibrary } from "@/utils/saveImage";
import type { AppLibraryItem } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const GRID_GAP = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function LibraryGridScreen() {
    const { library } = useAppState();
    const dispatch = useAppDispatch();
    const router = useRouter();

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedIds([]);
    };

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
            "削除確認",
            `${selectedIds.length}枚の写真を削除しますか？`,
            [
                { text: "キャンセル", style: "cancel" },
                {
                    text: "削除",
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

    const renderItem = useCallback(
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
                        <View style={[styles.selectionOverlay, isSelected && styles.selectionOverlayActive]}>
                            <Ionicons
                                name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                                size={24}
                                color={isSelected ? "#FF8FA3" : "rgba(255,255,255,0.8)"}
                            />
                        </View>
                    )}
                </TouchableOpacity>
            );
        },
        [handlePress, isSelectionMode, selectedIds],
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* ヘッダー */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>ライブラリ</Text>
                    <Text style={styles.headerCount}>{library.length}枚</Text>
                </View>
                {library.length > 0 && (
                    <TouchableOpacity onPress={toggleSelectionMode} style={styles.headerButton}>
                        <Text style={styles.headerButtonText}>
                            {isSelectionMode ? "キャンセル" : "選択"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {library.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="images-outline" size={64} color="#DDD" />
                    <Text style={styles.emptyTitle}>まだ写真がありません</Text>
                    <Text style={styles.emptySubtitle}>
                        カメラで撮影して{"\n"}最初の1枚を保存しましょう
                    </Text>
                </View>
            ) : (
                <View style={styles.listContainer}>
                    <FlatList
                        data={library}
                        keyExtractor={(item) => item.id}
                        numColumns={NUM_COLUMNS}
                        renderItem={renderItem}
                        contentContainerStyle={styles.gridContainer}
                        columnWrapperStyle={styles.columnWrapper}
                        showsVerticalScrollIndicator={false}
                    />

                    {isSelectionMode && (
                        <View style={styles.bottomBar}>
                            <TouchableOpacity
                                style={[styles.deleteButton, selectedIds.length === 0 && styles.deleteButtonDisabled]}
                                onPress={handleDeleteSelected}
                                disabled={selectedIds.length === 0}
                            >
                                <Ionicons name="trash-outline" size={20} color={selectedIds.length === 0 ? "#CCC" : "#FF4444"} />
                                <Text style={[styles.deleteButtonText, selectedIds.length === 0 && styles.deleteButtonTextDisabled]}>
                                    削除 ({selectedIds.length})
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#333",
    },
    headerCount: {
        fontSize: 15,
        color: "#888",
        fontWeight: "500",
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
        backgroundColor: "#F0F0F0",
        borderRadius: 16,
    },
    headerButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
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
        borderColor: "#FF8FA3",
    },
    bottomBar: {
        flexDirection: "row",
        justifyContent: "center",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: "#EEE",
        backgroundColor: "#FFF",
    },
    deleteButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
        backgroundColor: "#FFEAEA",
    },
    deleteButtonDisabled: {
        backgroundColor: "#F5F5F5",
    },
    deleteButtonText: {
        color: "#FF4444",
        fontSize: 16,
        fontWeight: "600",
    },
    deleteButtonTextDisabled: {
        color: "#CCC",
    },
});
