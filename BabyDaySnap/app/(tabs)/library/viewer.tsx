import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DISMISS_THRESHOLD = 120;

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

export default function LibraryImageViewerScreen() {
    const { uri } = useLocalSearchParams<{ uri?: string }>();
    const router = useRouter();

    const close = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            {uri ? <ZoomableFullscreenImage uri={uri} onClose={close} /> : null}
            <TouchableOpacity style={styles.closeButton} onPress={close}>
                <Ionicons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

function ZoomableFullscreenImage({ uri, onClose }: { uri: string; onClose: () => void }) {
    const scale = useSharedValue(1);
    const scaleOffset = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const startX = useSharedValue(0);
    const startY = useSharedValue(0);
    const pinchActive = useSharedValue(false);
    const panMode = useSharedValue(0);

    const resetImage = () => {
        "worklet";
        scale.value = withSpring(1);
        scaleOffset.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        startX.value = 0;
        startY.value = 0;
        panMode.value = 0;
    };

    const resetDismiss = () => {
        "worklet";
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        startX.value = 0;
        startY.value = 0;
        panMode.value = 0;
    };

    const pinchGesture = Gesture.Pinch()
        .onBegin(() => {
            pinchActive.value = true;
            panMode.value = 0;
        })
        .onUpdate((event) => {
            const nextScale = clamp(scaleOffset.value * event.scale, 1, MAX_SCALE);
            scale.value = nextScale;
        })
        .onEnd(() => {
            if (scale.value <= 1.01) {
                resetImage();
            } else {
                scaleOffset.value = scale.value;
            }
        })
        .onFinalize(() => {
            pinchActive.value = false;
        });

    const panGesture = Gesture.Pan()
        .maxPointers(1)
        .onStart(() => {
            const isZoomed = scale.value > 1.01 || scaleOffset.value > 1.01;
            panMode.value = isZoomed ? 1 : 2;
            startX.value = translateX.value;
            startY.value = translateY.value;
        })
        .onUpdate((event) => {
            if (pinchActive.value || event.numberOfPointers > 1) {
                return;
            }

            if (panMode.value === 1) {
                translateX.value = startX.value + event.translationX;
                translateY.value = startY.value + event.translationY;
                return;
            }

            translateX.value = event.translationX * 0.12;
            translateY.value = event.translationY;
        })
        .onEnd((event) => {
            if (panMode.value === 1) {
                if (scale.value <= 1.01 && scaleOffset.value <= 1.01) {
                    resetImage();
                } else {
                    startX.value = translateX.value;
                    startY.value = translateY.value;
                    panMode.value = 0;
                }
                return;
            }

            const isVerticalSwipe = Math.abs(event.translationY) > Math.abs(event.translationX);
            if (isVerticalSwipe && Math.abs(event.translationY) > DISMISS_THRESHOLD) {
                runOnJS(onClose)();
                return;
            }

            resetDismiss();
        })
        .onFinalize(() => {
            if (panMode.value === 2 && !pinchActive.value) {
                resetDismiss();
            }
            panMode.value = 0;
        });

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(250)
        .maxDelay(250)
        .onEnd((_event, success) => {
            if (!success || pinchActive.value) {
                return;
            }

            if (scaleOffset.value > 1.01 || scale.value > 1.01) {
                resetImage();
                return;
            }

            scale.value = withSpring(DOUBLE_TAP_SCALE);
            scaleOffset.value = DOUBLE_TAP_SCALE;
            translateX.value = withSpring(0);
            translateY.value = withSpring(0);
            startX.value = 0;
            startY.value = 0;
            panMode.value = 0;
        });

    const gesture = Gesture.Simultaneous(doubleTapGesture, pinchGesture, panGesture);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ],
    }));

    return (
        <GestureDetector gesture={gesture}>
            <Animated.Image
                source={{ uri }}
                style={[styles.image, animatedStyle]}
                resizeMode="contain"
            />
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
    },
    image: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    closeButton: {
        position: "absolute",
        top: 50,
        right: 20,
        backgroundColor: "rgba(0,0,0,0.45)",
        borderRadius: 20,
        padding: 6,
    },
});