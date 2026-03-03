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
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import { saveToPhotoLibrary, deleteFromAppLibrary } from "@/utils/saveImage";
import { formatDateDisplay } from "@/utils/date";
import { getTemplateConfig } from "@/utils/templates";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_WIDTH = SCREEN_WIDTH - 32;

export default function LibraryDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { library } = useAppState();
    const dispatch = useAppDispatch();
    const router = useRouter();

    const item = useMemo(
        () => library.find((i) => i.id === id),
        [library, id],
    );

    if (!item) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>写真が見つかりません</Text>
            </View>
        );
    }

    const tpl = getTemplateConfig(item.templateId);
    const aspect = item.width / item.height;
    const imageHeight = IMAGE_WIDTH / aspect;

    const handleSaveToPhotos = async () => {
        const success = await saveToPhotoLibrary(item.renderedFileUri);
        if (success) {
            Alert.alert("保存完了", "写真ライブラリに保存しました。");
        }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                url: item.renderedFileUri,
            });
        } catch (e) {
            console.error("Share error:", e);
        }
    };

    const handleDelete = () => {
        Alert.alert("削除確認", "この写真を削除しますか？", [
            { text: "キャンセル", style: "cancel" },
            {
                text: "削除",
                style: "destructive",
                onPress: async () => {
                    await deleteFromAppLibrary(item);
                    dispatch({ type: "LIBRARY_REMOVE", payload: item.id });
                    router.back();
                },
            },
        ]);
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* 画像大表示 */}
            <View style={[styles.imageContainer, { height: imageHeight }]}>
                <Image
                    source={{ uri: item.renderedFileUri }}
                    style={styles.image}
                    resizeMode="contain"
                />
            </View>

            {/* メタ情報 */}
            <View style={styles.metaContainer}>
                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>生後日数</Text>
                    <View style={styles.ageBadge}>
                        <Text style={styles.ageBadgeText}>{item.ageDays}日</Text>
                    </View>
                </View>

                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>撮影日</Text>
                    <Text style={styles.metaValue}>
                        {formatDateDisplay(item.shotDateISO)}
                    </Text>
                </View>

                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>作成日</Text>
                    <Text style={styles.metaValue}>
                        {formatDateDisplay(
                            new Date(item.createdAtMs).toISOString().split("T")[0],
                        )}
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
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveToPhotos}>
                    <Ionicons name="image-outline" size={20} color="#FFF" />
                    <Text style={styles.saveButtonText}>iPhone写真に保存</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <Ionicons name="share-outline" size={20} color="#FF8FA3" />
                    <Text style={styles.shareButtonText}>共有</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={20} color="#FF4444" />
                    <Text style={styles.deleteButtonText}>削除</Text>
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
    imageContainer: {
        width: IMAGE_WIDTH,
        backgroundColor: "#F5F5F5",
        borderRadius: 12,
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    metaContainer: {
        marginTop: 20,
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
    ageBadge: {
        backgroundColor: "#FF8FA3",
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 20,
    },
    ageBadgeText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "700",
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
