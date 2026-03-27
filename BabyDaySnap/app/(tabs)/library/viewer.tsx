import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
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
import { useAppDispatch, useAppState } from "@/context/AppContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DISMISS_THRESHOLD = 42;
const DISMISS_VELOCITY_THRESHOLD = 0.9;
const DISMISS_DIAGONAL_RATIO = 0.65;
const DOUBLE_TAP_DELAY_MS = 250;

export default function LibraryImageViewerScreen() {
    const { id, uri } = useLocalSearchParams<{ id?: string; uri?: string }>();
    const { library, activeBabyId } = useAppState();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isCurrentItemZoomed, setIsCurrentItemZoomed] = useState(false);

    const filteredLibrary = useMemo(() => {
        const baseLibrary = activeBabyId
            ? library.filter((item) => item.babyIds.includes(activeBabyId))
            : library;

        return [...baseLibrary].sort((a, b) => {
            if (a.shotDateISO !== b.shotDateISO) {
                return b.shotDateISO.localeCompare(a.shotDateISO);
            }
            return b.createdAtMs - a.createdAtMs;
        });
    }, [activeBabyId, library]);

    const imageUris = useMemo(() => {
        if (filteredLibrary.length > 0) {
            return filteredLibrary.map((item) => item.renderedFileUri);
        }

        return uri ? [uri] : [];
    }, [filteredLibrary, uri]);

    const initialIndex = useMemo(() => {
        if (filteredLibrary.length > 0) {
            if (id) {
                const itemIndex = filteredLibrary.findIndex((item) => item.id === id);
                if (itemIndex >= 0) {
                    return itemIndex;
                }
            }

            if (uri) {
                const uriIndex = filteredLibrary.findIndex((item) => item.renderedFileUri === uri);
                if (uriIndex >= 0) {
                    return uriIndex;
                }
            }
        }

        return 0;
    }, [filteredLibrary, id, uri]);

    const imageIds = useMemo(() => {
        if (filteredLibrary.length > 0) {
            return filteredLibrary.map((item) => item.id);
        }

        return id ? [id] : [];
    }, [filteredLibrary, id]);

    useEffect(() => {
        setCurrentIndex(initialIndex);
        setIsCurrentItemZoomed(false);
    }, [initialIndex]);

    useEffect(() => {
        const currentItemId = imageIds[currentIndex];
        if (!currentItemId) {
            return;
        }

        dispatch({ type: "SET_LIBRARY_DETAIL_FOCUS_ID", payload: currentItemId });
    }, [currentIndex, dispatch, imageIds]);

    const close = useCallback(() => {
        router.back();
    }, [router]);

    const handleMomentumScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        const boundedIndex = Math.max(0, Math.min(imageUris.length - 1, nextIndex));
        setCurrentIndex(boundedIndex);
        setIsCurrentItemZoomed(false);
    }, [imageUris.length]);

    if (imageUris.length === 0) {
        return (
            <View style={styles.centeredContainer}>
                <StatusBar style="light" />
                <TouchableOpacity style={styles.closeButton} onPress={close}>
                    <Ionicons name="close" size={30} color="#FFF" />
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.centeredContainer}>
            <StatusBar style="light" />
            <FlatList
                style={styles.container}
                data={imageUris}
                keyExtractor={(item, index) => `${index}-${item}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={initialIndex}
                getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
                renderItem={({ item, index }) => (
                    <NativeZoomableImage
                        uri={item}
                        onClose={close}
                        isActive={index === currentIndex}
                        onZoomChange={index === currentIndex ? setIsCurrentItemZoomed : undefined}
                    />
                )}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                scrollEnabled={!isCurrentItemZoomed}
                extraData={currentIndex}
                initialNumToRender={1}
                maxToRenderPerBatch={2}
                windowSize={3}
            />
            <TouchableOpacity style={styles.closeButton} onPress={close}>
                <Ionicons name="close" size={30} color="#FFF" />
            </TouchableOpacity>
            {imageUris.length > 1 ? (
                <View style={styles.counterWrap}>
                    <Animated.Text style={styles.counterText}>
                        {currentIndex + 1} / {imageUris.length}
                    </Animated.Text>
                </View>
            ) : null}
        </View>
    );
}

type ZoomableScrollView = ScrollView & {
    scrollResponderZoomTo?: (rect: {
        x: number;
        y: number;
        width: number;
        height: number;
        animated?: boolean;
    }) => void;
    setNativeProps?: (props: { zoomScale?: number }) => void;
};

function NativeZoomableImage({
    uri,
    onClose,
    isActive,
    onZoomChange,
}: {
    uri: string;
    onClose: () => void;
    isActive: boolean;
    onZoomChange?: (isZoomed: boolean) => void;
}) {
    const dismissTranslateY = useRef(new Animated.Value(0)).current;
    const scrollViewRef = useRef<ZoomableScrollView | null>(null);
    const lastTapAtRef = useRef(0);
    const zoomScaleRef = useRef(1);

    const updateZoomScale = useCallback((nextScale: number) => {
        zoomScaleRef.current = nextScale;
        onZoomChange?.(nextScale > 1.01);
    }, [onZoomChange]);

    const setZoomScale = useCallback((nextScale: number, animated: boolean) => {
        updateZoomScale(nextScale);

        const scrollView = scrollViewRef.current;
        if (!scrollView) {
            return;
        }

        if (Platform.OS === "ios" && scrollView.scrollResponderZoomTo) {
            const width = SCREEN_WIDTH / nextScale;
            const height = SCREEN_HEIGHT / nextScale;
            const x = Math.max(0, (SCREEN_WIDTH - width) / 2);
            const y = Math.max(0, (SCREEN_HEIGHT - height) / 2);

            scrollView.scrollResponderZoomTo({
                x,
                y,
                width,
                height,
                animated,
            });
        } else {
            scrollView.setNativeProps?.({ zoomScale: nextScale });
        }

        if (nextScale === 1) {
            scrollView.scrollTo?.({ x: 0, y: 0, animated: false });
        }
    }, [updateZoomScale]);

    useEffect(() => {
        if (isActive) {
            return;
        }

        dismissTranslateY.setValue(0);
        if (zoomScaleRef.current > 1.01) {
            setZoomScale(1, false);
        } else {
            onZoomChange?.(false);
        }
    }, [dismissTranslateY, isActive, onZoomChange, setZoomScale]);

    const handleImagePress = () => {
        const now = Date.now();
        const isDoubleTap = now - lastTapAtRef.current <= DOUBLE_TAP_DELAY_MS;
        lastTapAtRef.current = now;

        if (!isDoubleTap) {
            return;
        }

        const nextScale = zoomScaleRef.current > 1.01 ? 1 : DOUBLE_TAP_SCALE;
        setZoomScale(nextScale, true);
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

            return gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * DISMISS_DIAGONAL_RATIO;
        },
        onMoveShouldSetPanResponderCapture: (_event, gestureState) => {
            if (Platform.OS !== "ios") {
                return false;
            }

            if (gestureState.numberActiveTouches !== 1) {
                return false;
            }

            if (zoomScaleRef.current > 1.01) {
                return false;
            }

            return gestureState.dy > 6 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * DISMISS_DIAGONAL_RATIO;
        },
        onPanResponderMove: (_event, gestureState) => {
            dismissTranslateY.setValue(gestureState.dy);
        },
        onPanResponderTerminationRequest: (_event, gestureState) => {
            const isDismissGestureActive =
                gestureState.dy > 6 &&
                gestureState.dy > Math.abs(gestureState.dx) * DISMISS_DIAGONAL_RATIO;

            return !isDismissGestureActive;
        },
        onPanResponderRelease: (_event, gestureState) => {
            const isDownwardSwipe =
                gestureState.dy > 0 &&
                gestureState.dy > Math.abs(gestureState.dx) * DISMISS_DIAGONAL_RATIO;
            const isDismissSwipe =
                isDownwardSwipe &&
                (
                    gestureState.dy > DISMISS_THRESHOLD ||
                    (gestureState.dy > 12 && gestureState.vy > DISMISS_VELOCITY_THRESHOLD)
                );

            if (isDismissSwipe) {
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
                ref={(ref) => {
                    scrollViewRef.current = ref as ZoomableScrollView | null;
                }}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                maximumZoomScale={MAX_SCALE}
                minimumZoomScale={1}
                pinchGestureEnabled={true}
                bounces={false}
                bouncesZoom={false}
                centerContent={true}
                directionalLockEnabled={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(event) => {
                    if (typeof event.nativeEvent.zoomScale === "number") {
                        updateZoomScale(event.nativeEvent.zoomScale);
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
    },
    centeredContainer: {
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
    counterWrap: {
        position: "absolute",
        bottom: 40,
        alignSelf: "center",
        backgroundColor: "rgba(0,0,0,0.45)",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    counterText: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "600",
    },
});
