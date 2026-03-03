import { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Linking,
    Alert,
} from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useAppState, useAppDispatch } from "@/context/AppContext";
import { formatDateISO, formatDateDisplay } from "@/utils/date";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";

export default function SettingsScreen() {
    const { settings } = useAppState();
    const dispatch = useAppDispatch();
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(
        settings.birthDateISO
            ? new Date(settings.birthDateISO + "T00:00:00")
            : new Date(),
    );

    const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === "android") {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setTempDate(selectedDate);
        }
    };

    const handleSaveBirthDate = () => {
        const iso = formatDateISO(tempDate);
        dispatch({ type: "SET_BIRTHDATE", payload: iso });
        setShowDatePicker(false);
        Alert.alert("保存完了", "誕生日を更新しました。");
    };

    const openURL = (url: string) => {
        Linking.openURL(url).catch(() => {
            Alert.alert("エラー", "リンクを開けませんでした。");
        });
    };

    const appVersion = Constants.expoConfig?.version ?? "1.0.0";

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>設定</Text>
            </View>

            {/* 出生日セクション */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>赤ちゃんの情報</Text>
                <View style={styles.card}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <Ionicons name="calendar-outline" size={22} color="#FF8FA3" />
                            <View>
                                <Text style={styles.settingLabel}>誕生日</Text>
                                <Text style={styles.settingValue}>
                                    {settings.birthDateISO
                                        ? formatDateDisplay(settings.birthDateISO)
                                        : "未設定"}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => setShowDatePicker(!showDatePicker)}
                        >
                            <Text style={styles.editButtonText}>
                                {showDatePicker ? "閉じる" : "変更"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showDatePicker && (
                        <View style={styles.datePickerContainer}>
                            <DateTimePicker
                                value={tempDate}
                                mode="date"
                                display={Platform.OS === "ios" ? "spinner" : "default"}
                                maximumDate={new Date()}
                                onChange={onDateChange}
                                locale="ja"
                                style={styles.datePicker}
                            />
                            <TouchableOpacity
                                style={styles.saveDateButton}
                                onPress={handleSaveBirthDate}
                            >
                                <Text style={styles.saveDateButtonText}>保存する</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* リンクセクション */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>情報</Text>
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.linkRow}
                        onPress={() => openURL(settings.policyUrls.termsUrl)}
                    >
                        <View style={styles.linkLeft}>
                            <Ionicons name="document-text-outline" size={20} color="#888" />
                            <Text style={styles.linkText}>利用規約</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#CCC" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={styles.linkRow}
                        onPress={() => openURL(settings.policyUrls.privacyUrl)}
                    >
                        <View style={styles.linkLeft}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#888" />
                            <Text style={styles.linkText}>プライバシーポリシー</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#CCC" />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                        style={styles.linkRow}
                        onPress={() => openURL(settings.policyUrls.contactUrl)}
                    >
                        <View style={styles.linkLeft}>
                            <Ionicons name="mail-outline" size={20} color="#888" />
                            <Text style={styles.linkText}>お問い合わせ</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#CCC" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* アプリバージョン */}
            <View style={styles.versionContainer}>
                <Text style={styles.versionText}>BabyDaySnap v{appVersion}</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F8FA",
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#333",
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#999",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
        paddingLeft: 4,
    },
    card: {
        backgroundColor: "#FFF",
        borderRadius: 14,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    settingRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    settingLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    settingLabel: {
        fontSize: 13,
        color: "#888",
    },
    settingValue: {
        fontSize: 16,
        color: "#333",
        fontWeight: "600",
        marginTop: 2,
    },
    editButton: {
        backgroundColor: "#FFF0F3",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    editButtonText: {
        color: "#FF8FA3",
        fontSize: 14,
        fontWeight: "600",
    },
    datePickerContainer: {
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
        padding: 16,
        alignItems: "center",
    },
    datePicker: {
        width: "100%",
    },
    saveDateButton: {
        backgroundColor: "#FF8FA3",
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 8,
    },
    saveDateButtonText: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "700",
    },
    linkRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    linkLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    linkText: {
        fontSize: 16,
        color: "#333",
    },
    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginLeft: 48,
    },
    versionContainer: {
        alignItems: "center",
        paddingTop: 20,
    },
    versionText: {
        fontSize: 13,
        color: "#CCC",
    },
});
