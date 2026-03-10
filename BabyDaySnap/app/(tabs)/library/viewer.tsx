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
const DISMISS_THRESHOLD = 100;

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
    const dismissY = useSharedValue(0);
    const pinchActive = useSharedValue(false);

    const resetDismiss = () => {
        "worklet";
        dismissY.value = withSpring(0, { damping: 20, stiffness: 220 });
    };

    const resetZoom = () => {
        "worklet";
        scale.value = withSpring(1, { damping: 20, stiffness: 220 });
        scaleOffset.value = 1;
    };

    const pinchGesture = Gesture.Pinch()
        .onBegin(() => {
            pinchActive.value = true;
        })
        .onUpdate((event) => {
            const nextScale = clamp(scaleOffset.value * event.scale, 1, MAX_SCALE);
            scale.value = nextScale;
        })
        .onEnd(() => {
            if (scale.value <= 1.01) {
                resetZoom();
            } else {
                scaleOffset.value = scale.value;
            }
        })
        .onFinalize(() => {
            pinchActive.value = false;
        });

    const dismissGesture = Gesture.Pan()
        .maxPointers(1)
        .activeOffsetY([-8, 8])
        .failOffsetX([-40, 40])
        .onUpdate((event) => {
            if (pinchActive.value || scale.value > 1.01 || scaleOffset.value > 1.01) {
                return;
            }

            dismissY.value = event.translationY;
        })
        .onEnd((event) => {
            if (pinchActive.value || scale.value > 1.01 || scaleOffset.value > 1.01) {
                resetDismiss();
                return;
            }

            if (Math.abs(event.translationY) > DISMISS_THRESHOLD) {
                runOnJS(onClose)();
                return;
            }

            resetDismiss();
        })
        .onFinalize(() => {
            if (!pinchActive.value && scale.value <= 1.01 && scaleOffset.value <= 1.01) {
                resetDismiss();
            }
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
                resetZoom();
                return;
            }

            scale.value = withSpring(DOUBLE_TAP_SCALE, { damping: 20, stiffness: 220 });
            scaleOffset.value = DOUBLE_TAP_SCALE;
            dismissY.value = withSpring(0, { damping: 20, stiffness: 220 });
        });

    const gesture = Gesture.Simultaneous(
        dismissGesture,
        Gesture.Exclusive(doubleTapGesture, pinchGesture),
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateY: dismissY.value },
            { scale: scale.value },
        ],
    }));

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={styles.imageWrap}>
                <Animated.Image
                    source={{ uri }}
                    style={[styles.image, animatedStyle]}
                    resizeMode="contain"
                />
            </Animated.View>
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
    imageWrap: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
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