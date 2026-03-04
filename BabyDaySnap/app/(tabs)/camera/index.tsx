import { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Linking,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppState } from "@/context/AppContext";
import { getShotDateISO, calcAgeDays } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PhotoSource } from "@/types";

export default function CameraScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);
    const [facing, setFacing] = useState<"front" | "back">("back");
    const dispatch = useAppDispatch();
    const { settings } = useAppState();
    const router = useRouter();

    const navigateToEditor = (photo: PhotoSource) => {
        const shotDateISO = getShotDateISO(photo.source, photo.creationTimeMs);
        const ageDays = calcAgeDays(settings.birthDateISO!, shotDateISO);

        dispatch({ type: "RESET_EDITOR" });
        dispatch({ type: "SET_PHOTO", payload: photo });
        dispatch({
            type: "SET_COMPUTED",
            payload: { shotDateISO, ageDays },
        });
        router.push("/(tabs)/camera/editor");
    };

    const handleCapture = async () => {
        if (!cameraRef.current) return;
        try {
            const result = await cameraRef.current.takePictureAsync({
                quality: 0.9,
            });
            if (result) {
                const photo: PhotoSource = {
                    uri: result.uri,
                    width: result.width,
                    height: result.height,
                    source: "camera",
                    creationTimeMs: Date.now(),
                };
                navigateToEditor(photo);
            }
        } catch (e) {
            console.error("Capture error:", e);
            Alert.alert("エラー", "撮影に失敗しました。");
        }
    };

    const handleImport = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 1,
                exif: true,
            });

            if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                const photo: PhotoSource = {
                    uri: asset.uri,
                    width: asset.width,
                    height: asset.height,
                    source: "import",
                    creationTimeMs: asset.exif?.DateTimeOriginal
                        ? new Date(asset.exif.DateTimeOriginal as string).getTime()
                        : Date.now(),
                };
                navigateToEditor(photo);
            }
        } catch (e) {
            console.error("Import error:", e);
            Alert.alert("エラー", "写真の取り込みに失敗しました。");
        }
    };

    // 権限未許可時の画面
    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.permissionText}>カメラの読み込み中...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color="#BDBDBD" />
                    <Text style={styles.permissionTitle}>カメラへのアクセス</Text>
                    <Text style={styles.permissionText}>
                        赤ちゃんの写真を撮影するために{"\n"}カメラへのアクセスが必要です
                    </Text>
                    {permission.canAskAgain ? (
                        <TouchableOpacity
                            style={styles.permissionButton}
                            onPress={requestPermission}
                        >
                            <Text style={styles.permissionButtonText}>許可する</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.permissionButton}
                            onPress={() => Linking.openSettings()}
                        >
                            <Text style={styles.permissionButtonText}>設定を開く</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.importOnlyButton} onPress={handleImport}>
                        <Ionicons name="images-outline" size={20} color="#FF8FA3" />
                        <Text style={styles.importOnlyButtonText}>写真を取り込む</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFillObject}
                facing={facing}
            />
            {/* 上部ボタン */}
            <SafeAreaView style={styles.topBar}>
                <TouchableOpacity
                    style={styles.topButton}
                    onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
                >
                    <Ionicons name="camera-reverse-outline" size={28} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.topButton} onPress={handleImport}>
                    <Ionicons name="images-outline" size={26} color="#FFF" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* 撮影ボタン */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
                    <View style={styles.captureInner} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    camera: {
        flex: 1,
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    topButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    bottomBar: {
        position: "absolute",
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: "center",
    },
    captureButton: {
        width: 78,
        height: 78,
        borderRadius: 39,
        borderWidth: 4,
        borderColor: "#FFF",
        justifyContent: "center",
        alignItems: "center",
    },
    captureInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#FFF",
    },
    permissionContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
        backgroundColor: "#FFF",
    },
    permissionTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#333",
        marginTop: 16,
        marginBottom: 8,
    },
    permissionText: {
        fontSize: 15,
        color: "#888",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 24,
    },
    permissionButton: {
        backgroundColor: "#FF8FA3",
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 16,
    },
    permissionButtonText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "700",
    },
    importOnlyButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 12,
    },
    importOnlyButtonText: {
        color: "#FF8FA3",
        fontSize: 15,
        fontWeight: "600",
    },
});
