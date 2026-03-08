import { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    StyleSheet,
    TextInput,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { useAppDispatch } from "@/context/AppContext";
import { formatDateISO, formatDateDisplay } from "@/utils/date";
import { THEME_COLOR_PRESETS } from "@/constants/babyTheme";
import { Ionicons } from "@expo/vector-icons";
import type { BabyProfile } from "@/types";
import i18n from "@/lib/i18n";

export default function OnboardingBirthdateScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { mode } = useLocalSearchParams<{ mode?: string }>();
    const isAddMode = mode === "add";

    const [date, setDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(Platform.OS === "ios");
    const [babyName, setBabyName] = useState("");
    const [selectedColor, setSelectedColor] = useState(THEME_COLOR_PRESETS[0].hex);

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
        const name = babyName.trim() || i18n.t("onboarding.namePlaceholder").replace("例：", "").replace("e.g., ", "");

        // BabyProfile を作成
        const baby: BabyProfile = {
            id: Date.now().toString(36) + Math.random().toString(36).substring(2),
            name,
            birthDateISO: iso,
            themeColorHex: selectedColor,
            createdAtMs: Date.now(),
            order: 0,
        };

        dispatch({ type: "ADD_BABY", payload: baby });
        dispatch({ type: "SET_ACTIVE_BABY", payload: baby.id });

        if (isAddMode) {
            router.back();
        } else {
            // 後方互換（ settings にも保存）
            dispatch({ type: "SET_BIRTHDATE", payload: iso });
            dispatch({ type: "SET_BABY_NAME", payload: name });
            dispatch({ type: "SET_ONBOARDED", payload: true });
            router.replace("/(tabs)/camera");
        }
    };

    const selectedPreset = THEME_COLOR_PRESETS.find((p) => p.hex === selectedColor) || THEME_COLOR_PRESETS[0];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: selectedPreset.background }]}>
            <Stack.Screen
                options={{
                    headerShown: isAddMode,
                    headerTitle: i18n.t("onboarding.addButton").replace("する", " 追加"), // Adjust loosely for header title
                    headerBackTitle: i18n.t("editor.backButton"),
                    headerTintColor: "#333",
                    headerShadowVisible: true,
                    headerStyle: { backgroundColor: selectedPreset.background },
                }}
            />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ヘッダー */}
                {!isAddMode && (
                    <View style={styles.header}>
                        <Text style={styles.title}>{i18n.t("onboarding.title")}</Text>
                        <Text style={styles.subtitle}>
                            {i18n.t("onboarding.subtitle")}
                        </Text>
                    </View>
                )}
                {isAddMode && (
                    <Text style={[styles.subtitle, { textAlign: "center", marginBottom: 24 }]}>
                        {i18n.t("onboarding.subtitleAdd")}
                    </Text>
                )}

                {/* お名前入力 */}
                <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>{i18n.t("onboarding.nameLabel")}</Text>
                    <TextInput
                        style={[styles.textInput, { borderColor: selectedPreset.accent }]}
                        value={babyName}
                        onChangeText={setBabyName}
                        placeholder={i18n.t("onboarding.namePlaceholder")}
                        placeholderTextColor="#CCC"
                        maxLength={20}
                        returnKeyType="done"
                    />
                </View>

                {/* 日付選択 */}
                <View style={styles.dateSection}>
                    <Text style={styles.inputLabel}>{i18n.t("onboarding.birthDateLabel")}</Text>

                    {Platform.OS === "android" && (
                        <TouchableOpacity
                            style={[styles.dateButton, { borderColor: selectedPreset.accent }]}
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
                            onChange={onDateChange}
                            locale="ja"
                            style={styles.picker}
                        />
                    )}
                </View>

                {/* テーマカラー選択 */}
                <View style={styles.colorSection}>
                    <Text style={styles.inputLabel}>{i18n.t("onboarding.themeColorLabel")}</Text>
                    <View style={styles.colorRow}>
                        {THEME_COLOR_PRESETS.map((preset) => (
                            <TouchableOpacity
                                key={preset.hex}
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: preset.hex },
                                    selectedColor === preset.hex && [
                                        styles.colorCircleSelected,
                                        { borderColor: preset.accent },
                                    ],
                                ]}
                                onPress={() => setSelectedColor(preset.hex)}
                                activeOpacity={0.7}
                            >
                                {selectedColor === preset.hex && (
                                    <Text style={styles.colorCheck}>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={styles.colorName}>{selectedPreset.label}</Text>
                </View>

                {/* 開始ボタン */}
                <TouchableOpacity
                    style={[styles.startButton, { backgroundColor: selectedPreset.accent, shadowColor: selectedPreset.shadow }]}
                    onPress={handleStart}
                >
                    <Text style={styles.startButtonText}>{isAddMode ? i18n.t("onboarding.addButton") : i18n.t("onboarding.startButton")}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingVertical: 16,
    },
    header: {
        alignItems: "center",
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#333",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: "#888",
        textAlign: "center",
        lineHeight: 22,
    },
    inputSection: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#555",
        marginBottom: 8,
        textAlign: "center",
    },
    textInput: {
        backgroundColor: "#FFF",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: 18,
        color: "#333",
        fontWeight: "600",
        textAlign: "center",
    },
    dateSection: {
        alignItems: "center",
        marginBottom: 20,
    },
    dateButton: {
        backgroundColor: "#FFF",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    dateButtonText: {
        fontSize: 18,
        color: "#333",
        fontWeight: "600",
    },
    picker: {
        width: "100%",
    },
    colorSection: {
        alignItems: "center",
        marginBottom: 28,
    },
    colorRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 14,
        marginTop: 4,
    },
    colorCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
    },
    colorCircleSelected: {
        borderWidth: 3,
        transform: [{ scale: 1.15 }],
    },
    colorCheck: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "800",
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    colorName: {
        marginTop: 10,
        fontSize: 14,
        color: "#888",
        fontWeight: "500",
    },
    startButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
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
