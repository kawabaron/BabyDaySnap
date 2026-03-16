import { useCallback, useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    type ScrollViewProps,
    type StyleProp,
    type ViewStyle,
} from "react-native";

type ScrollDirection = "horizontal" | "vertical";

type ScrollHintedScrollViewProps = Omit<ScrollViewProps, "horizontal"> & {
    containerStyle?: StyleProp<ViewStyle>;
    direction?: ScrollDirection;
};

const SCROLL_EDGE_THRESHOLD = 8;

export function ScrollHintedScrollView({
    children,
    containerStyle,
    contentContainerStyle,
    direction = "horizontal",
    onContentSizeChange,
    onScroll,
    ...scrollViewProps
}: ScrollHintedScrollViewProps) {
    const [viewportSize, setViewportSize] = useState(0);
    const [contentSize, setContentSize] = useState(0);
    const [offset, setOffset] = useState(0);

    const isHorizontal = direction === "horizontal";
    const canScroll = contentSize - viewportSize > SCROLL_EDGE_THRESHOLD;
    const showStartHint = canScroll && offset > SCROLL_EDGE_THRESHOLD;
    const showEndHint = canScroll && offset < contentSize - viewportSize - SCROLL_EDGE_THRESHOLD;

    const startHint = useMemo(() => (isHorizontal ? "<" : "^"), [isHorizontal]);
    const endHint = useMemo(() => (isHorizontal ? ">" : "v"), [isHorizontal]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const nextOffset = isHorizontal
            ? event.nativeEvent.contentOffset.x
            : event.nativeEvent.contentOffset.y;
        setOffset(nextOffset);
        onScroll?.(event);
    }, [isHorizontal, onScroll]);

    const handleContentSizeChange = useCallback((width: number, height: number) => {
        setContentSize(isHorizontal ? width : height);
        onContentSizeChange?.(width, height);
    }, [isHorizontal, onContentSizeChange]);

    return (
        <View
            style={containerStyle}
            onLayout={(event) => {
                const nextViewportSize = isHorizontal
                    ? event.nativeEvent.layout.width
                    : event.nativeEvent.layout.height;
                setViewportSize(nextViewportSize);
            }}
        >
            <ScrollView
                {...scrollViewProps}
                horizontal={isHorizontal}
                onContentSizeChange={handleContentSizeChange}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                contentContainerStyle={contentContainerStyle}
            >
                {children}
            </ScrollView>

            {showStartHint ? (
                <View
                    pointerEvents="none"
                    style={[styles.hintContainer, isHorizontal ? styles.hintLeft : styles.hintTop]}
                >
                    <View style={styles.hintBadge}>
                        <Text style={styles.hintText}>{startHint}</Text>
                    </View>
                </View>
            ) : null}

            {showEndHint ? (
                <View
                    pointerEvents="none"
                    style={[styles.hintContainer, isHorizontal ? styles.hintRight : styles.hintBottom]}
                >
                    <View style={styles.hintBadge}>
                        <Text style={styles.hintText}>{endHint}</Text>
                    </View>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    hintContainer: {
        position: "absolute",
        zIndex: 2,
    },
    hintLeft: {
        left: 0,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        paddingLeft: 4,
    },
    hintRight: {
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        paddingRight: 4,
    },
    hintTop: {
        top: 0,
        left: 0,
        right: 0,
        alignItems: "center",
        paddingTop: 2,
    },
    hintBottom: {
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: "center",
        paddingBottom: 2,
    },
    hintBadge: {
        minWidth: 24,
        minHeight: 24,
        paddingHorizontal: 6,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "rgba(0, 0, 0, 0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    hintText: {
        fontSize: 14,
        lineHeight: 16,
        fontWeight: "700",
        color: "#7A7480",
    },
});
