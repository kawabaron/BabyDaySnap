import { useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppState } from "@/context/AppContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { AppLibraryItem } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const NUM_COLUMNS = 3;
const GRID_GAP = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function LibraryGridScreen() {
    const { library } = useAppState();
    const router = useRouter();

    const handlePress = useCallback(
        (item: AppLibraryItem) => {
            router.push(`/(tabs)/library/${item.id}`);
        },
        [router],
    );

    const renderItem = useCallback(
        ({ item }: { item: AppLibraryItem }) => (
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
            </TouchableOpacity>
        ),
        [handlePress],
    );

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* ヘッダー */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>ライブラリ</Text>
                <Text style={styles.headerCount}>{library.length}枚</Text>
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
                <FlatList
                    data={library}
                    keyExtractor={(item) => item.id}
                    numColumns={NUM_COLUMNS}
                    renderItem={renderItem}
                    contentContainerStyle={styles.gridContainer}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                />
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
});
