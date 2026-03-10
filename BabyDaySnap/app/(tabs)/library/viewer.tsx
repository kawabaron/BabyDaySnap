import { useMemo, useRef } from "react";
import {
    Animated,
    Dimensions,
    Image,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DISMISS_THRESHOLD = 100;
const DOUBLE_TAP_DELAY_MS = 250;

export default function LibraryImageViewerScreen() {
    const { uri } = useLocalSearchParams<{ uri?: string }>();
    const router = useRouter();

    const close = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            {uri ? <NativeZoomableImage uri={uri} onClose={close} /> : null}
            <TouchableOpacity style={styles.closeButton} onPress={close}>
                <Ionicons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

function NativeZoomableImage({ uri, onClose }: { uri: string; onClose: () => void }) {
    const dismissTranslateY = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef<ScrollView | null>(null);
    const lastTapAtRef = useRef(0);
    const zoomScaleRef = useRef(1);

    const setZoomScale = (nextScale: number) => {
        zoomScaleRef.current = nextScale;

        const scrollView = scrollViewRef.current as ScrollView & {
            setNativeProps?: (props: { zoomScale?: number }) => void;
        };

        scrollView?.setNativeProps?.({ zoomScale: nextScale });

        if (nextScale === 1) {
            scrollView?.scrollTo?.({ x: 0, y: 0, animated: false });
        }
    };

    const handleImagePress = () => {
        const now = Date.now();
        const isDoubleTap = now - lastTapAtRef.current <= DOUBLE_TAP_DELAY_MS;
        lastTapAtRef.current = now;

        if (!isDoubleTap) {
            return;
        }

        const nextScale = zoomScaleRef.current > 1.01 ? 1 : DOUBLE_TAP_SCALE;
        setZoomScale(nextScale);
    };

    const panResponder = useMemo(() => PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gestureState) => {
            if (Platform.OS !== "ios") {
                return false;
            }

            if (gestureState.numberActiveTouches !== 1) {
                return false;
            }

            if (zoomScaleRef.current > 1.01) {
                return false;
            }

            return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 6;
        },
        onPanResponderMove: (_event, gestureState) => {
            dismissTranslateY.setValue(gestureState.dy);
        },
        onPanResponderRelease: (_event, gestureState) => {
            if (Math.abs(gestureState.dy) > DISMISS_THRESHOLD) {
                onClose();
                return;
            }

            dismissTranslateY.setValue(0);
        },
        onPanResponderTerminate: () => {
            dismissTranslateY.setValue(0);
        },
    }), [dismissTranslateY, onClose]);

    const animatedStyle = {
        transform: [{ translateY: dismissTranslateY }],
    };

    return (
        <Animated.View style={[styles.imageWrap, animatedStyle]} {...panResponder.panHandlers}>
            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                maximumZoomScale={MAX_SCALE}
                minimumZoomScale={1}
                pinchGestureEnabled={true}
                bounces={false}
                bouncesZoom={false}
                centerContent={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(event) => {
                    if (typeof event.nativeEvent.zoomScale === "number") {
                        zoomScaleRef.current = event.nativeEvent.zoomScale;
                    }
                }}
            >
                <Pressable onPress={handleImagePress} style={styles.imagePressable}>
                    <Image source={{ uri }} style={styles.image} resizeMode="contain" />
                </Pressable>
            </ScrollView>
        </Animated.View>
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
    },
    scrollView: {
        flex: 1,
        width: "100%",
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    imagePressable: {
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