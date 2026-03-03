import { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    StyleSheet,
    SafeAreaView,
} from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useAppDispatch } from "@/context/AppContext";
import { formatDateISO, formatDateDisplay } from "@/utils/date";

export default function OnboardingBirthdateScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(Platform.OS === "ios");

    const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === "android") {
            setShowPicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const handleStart = () => {
        const iso = formatDateISO(date);
        dispatch({ type: "SET_BIRTHDATE", payload: iso });
        dispatch({ type: "SET_ONBOARDED", payload: true });
        router.replace("/(tabs)/camera");
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* ヘッダー */}
                <View style={styles.header}>
                    <Text style={styles.emoji}>👶</Text>
                    <Text style={styles.title}>BabyDaySnap</Text>
                    <Text style={styles.subtitle}>
                        赤ちゃんの誕生日を設定して{"\n"}生後日数を記録しましょう
                    </Text>
                </View>

                {/* 日付選択 */}
                <View style={styles.dateSection}>
                    <Text style={styles.dateLabel}>誕生日</Text>

                    {Platform.OS === "android" && (
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowPicker(true)}
                        >
                            <Text style={styles.dateButtonText}>
                                {formatDateDisplay(formatDateISO(date))}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {showPicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display={Platform.OS === "ios" ? "spinner" : "default"}
                            maximumDate={new Date()}
                            onChange={onDateChange}
                            locale="ja"
                            style={styles.picker}
                        />
                    )}
                </View>

                {/* 開始ボタン */}
                <TouchableOpacity style={styles.startButton} onPress={handleStart}>
                    <Text style={styles.startButtonText}>開始する</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF5F7",
    },
    content: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 32,
    },
    header: {
        alignItems: "center",
        marginBottom: 48,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        color: "#333",
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: "#888",
        textAlign: "center",
        lineHeight: 24,
    },
    dateSection: {
        alignItems: "center",
        marginBottom: 48,
    },
    dateLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#555",
        marginBottom: 12,
    },
    dateButton: {
        backgroundColor: "#FFF",
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FFD6E0",
    },
    dateButtonText: {
        fontSize: 18,
        color: "#333",
        fontWeight: "600",
    },
    picker: {
        width: "100%",
    },
    startButton: {
        backgroundColor: "#FF8FA3",
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#FF8FA3",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    startButtonText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "700",
    },
});
