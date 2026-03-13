import type { ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/lib/i18n";

type AppHeaderProps = {
    title: string;
    subtitle?: string;
    onBackPress?: () => void;
    rightSlot?: ReactNode;
    backgroundColor?: string;
};

export function AppHeader({
    title,
    subtitle,
    onBackPress,
    rightSlot,
    backgroundColor = "#FFF",
}: AppHeaderProps) {
    return (
        <View style={[styles.header, { backgroundColor }]}>
            <View style={styles.side}>
                {onBackPress ? (
                    <TouchableOpacity style={styles.backButton} onPress={onBackPress} activeOpacity={0.8}>
                        <Ionicons name="chevron-back" size={18} color="#444" />
                        <Text style={styles.backText}>{i18n.t("common.back")}</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
            <View style={styles.center}>
                <Text style={styles.title} numberOfLines={1}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            <View style={[styles.side, styles.sideRight]}>{rightSlot}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        minHeight: 60,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#E9DDE2",
    },
    side: {
        minWidth: 88,
        minHeight: 44,
        justifyContent: "center",
    },
    sideRight: {
        alignItems: "flex-end",
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
    },
    backButton: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    backText: {
        fontSize: 15,
        fontWeight: "500",
        color: "#444",
    },
    title: {
        fontSize: 17,
        fontWeight: "700",
        color: "#222",
    },
    subtitle: {
        marginTop: 2,
        fontSize: 12,
        fontWeight: "500",
        color: "#888",
    },
});
