import { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Linking,
    Alert,
    Switch,
    TextInput,
    ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useAppState, useAppDispatch, useActiveBaby } from "@/context/AppContext";
import { formatDateISO, formatDateDisplay } from "@/utils/date";
import { TEMPLATES, FONT_OPTIONS } from "@/utils/templates";
import { THEME_COLOR_PRESETS, getThemePreset, NEUTRAL_THEME } from "@/constants/babyTheme";
import type { TemplateId, FontId, BabyProfile } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import i18n from "@/lib/i18n";

export default function SettingsScreen() {
    const { settings, babies, library } = useAppState();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const activeBaby = useActiveBaby();
    const theme = activeBaby ? getThemePreset(activeBaby.themeColorHex) : NEUTRAL_THEME;

    const [editingBabyId, setEditingBabyId] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());

    const editingBaby = editingBabyId ? babies.find((b) => b.id === editingBabyId) : null;

    const handleEditBaby = (baby: BabyProfile) => {
        setEditingBabyId(baby.id);
        setTempDate(new Date(baby.birthDateISO.replace(/\//g, "-") + "T00:00:00"));
        setShowDatePicker(false);
    };

    const handleSaveBabyName = (babyId: string, name: string) => {
        const baby = babies.find((b) => b.id === babyId);
        if (baby) {
            dispatch({
                type: "UPDATE_BABY",
                payload: { ...baby, name: name.trim() || baby.name },
            });
        }
    };

    const handleSaveBabyDate = (babyId: string) => {
        const baby = babies.find((b) => b.id === babyId);
        if (baby) {
            const iso = formatDateISO(tempDate);
            dispatch({
                type: "UPDATE_BABY",
                payload: { ...baby, birthDateISO: iso },
            });
            // 後方互換: settings にも反映
            if (babies.indexOf(baby) === 0) {
                dispatch({ type: "SET_BIRTHDATE", payload: iso });
            }
            setShowDatePicker(false);
            Alert.alert(i18n.t("settings.saveDateSuccessTitle"), i18n.t("settings.saveDateSuccessMsg"));
        }
    };

    const handleChangeBabyColor = (babyId: string, colorHex: string) => {
        const baby = babies.find((b) => b.id === babyId);
        if (baby) {
            dispatch({
                type: "UPDATE_BABY",
                payload: { ...baby, themeColorHex: colorHex },
            });
        }
    };

    const handleDeleteBaby = (baby: BabyProfile) => {
        if (babies.length <= 1) {
            Alert.alert(i18n.t("settings.cannotDeleteTitle"), i18n.t("settings.cannotDeleteMsg"));
            return;
        }
        const babyLibraryCount = library.filter((item) =>
            item.babyIds.includes(baby.id)
        ).length;
        Alert.alert(
            i18n.t("settings.deleteConfirmTitle"),
            babyLibraryCount > 0
                ? i18n.t("settings.deleteConfirmMsg", { name: baby.name, count: babyLibraryCount })
                : i18n.t("settings.deleteConfirmMsgNoPhotos", { name: baby.name }),
            [
                { text: i18n.t("library.cancel"), style: "cancel" },
                {
                    text: i18n.t("settings.deleteBabyButton"),
                    style: "destructive",
                    onPress: () => {
                        dispatch({ type: "REMOVE_BABY", payload: baby.id });
                        if (editingBabyId === baby.id) {
                            setEditingBabyId(null);
                        }
                    },
                },
            ],
        );
    };

    const handleAddBaby = () => {
        router.push("/onboarding?mode=add");
    };

    const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === "android") {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setTempDate(selectedDate);
        }
    };

    const handleTemplateChange = (id: TemplateId) => {
        dispatch({
            type: "SET_DEFAULT_PREFS",
            payload: { defaultTemplateId: id },
        });
    };

    const handleFontChange = (id: FontId) => {
        dispatch({
            type: "SET_DEFAULT_PREFS",
            payload: { defaultFontId: id },
        });
    };

    const openURL = (url: string) => {
        Linking.openURL(url).catch(() => {
            Alert.alert(i18n.t("settings.linkErrorTitle"), i18n.t("settings.linkErrorMsg"));
        });
    };

    const appVersion = Constants.expoConfig?.version ?? "1.0.0";

    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{i18n.t("settings.headerTitle")}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* 家族の管理 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("settings.familySection")}</Text>
                    <View style={styles.card}>
                        {babies.map((baby, index) => {
                            const babyTheme = getThemePreset(baby.themeColorHex);
                            const isEditing = editingBabyId === baby.id;
                            return (
                                <View key={baby.id}>
                                    {index > 0 && <View style={styles.divider} />}
                                    <TouchableOpacity
                                        style={styles.babyRow}
                                        onPress={() => isEditing ? setEditingBabyId(null) : handleEditBaby(baby)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.babyRowLeft}>
                                            <View style={[styles.babyColorDot, { backgroundColor: babyTheme.accent }]} />
                                            <View>
                                                <Text style={styles.babyName}>{baby.name}</Text>
                                                <Text style={styles.babyBirth}>
                                                    {formatDateDisplay(baby.birthDateISO)}
                                                </Text>
                                            </View>
                                        </View>
                                        <Ionicons
                                            name={isEditing ? "chevron-up" : "chevron-down"}
                                            size={18}
                                            color="#CCC"
                                        />
                                    </TouchableOpacity>

                                    {/* 編集パネル */}
                                    {isEditing && (
                                        <View style={styles.editPanel}>
                                            {/* 名前 */}
                                            <View style={styles.editRow}>
                                                <Text style={styles.editLabel}>{i18n.t("settings.editNameLabel")}</Text>
                                                <TextInput
                                                    style={styles.editInput}
                                                    value={baby.name}
                                                    onChangeText={(text) => handleSaveBabyName(baby.id, text)}
                                                    maxLength={20}
                                                    returnKeyType="done"
                                                />
                                            </View>

                                            {/* 誕生日 */}
                                            <View style={styles.editRow}>
                                                <Text style={styles.editLabel}>{i18n.t("settings.editBirthLabel")}</Text>
                                                <TouchableOpacity
                                                    style={styles.editButton}
                                                    onPress={() => setShowDatePicker(!showDatePicker)}
                                                >
                                                    <Text style={[styles.editButtonText, { color: babyTheme.accent }]}>
                                                        {showDatePicker ? i18n.t("settings.editCloseButton") : i18n.t("settings.editChangeButton")}
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
                                                        minimumDate={new Date(1900, 0, 1)}
                                                        onChange={onDateChange}
                                                        locale="ja"
                                                        style={styles.datePicker}
                                                    />
                                                    <TouchableOpacity
                                                        style={[styles.saveDateButton, { backgroundColor: babyTheme.accent }]}
                                                        onPress={() => handleSaveBabyDate(baby.id)}
                                                    >
                                                        <Text style={styles.saveDateButtonText}>{i18n.t("settings.editSaveButton")}</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}

                                            {/* テーマカラー */}
                                            <View style={styles.editRow}>
                                                <Text style={styles.editLabel}>{i18n.t("settings.editColorLabel")}</Text>
                                            </View>
                                            <View style={styles.colorPickerRow}>
                                                {THEME_COLOR_PRESETS.map((preset) => (
                                                    <TouchableOpacity
                                                        key={preset.hex}
                                                        style={[
                                                            styles.colorOption,
                                                            { backgroundColor: preset.hex },
                                                            baby.themeColorHex === preset.hex && {
                                                                borderWidth: 3,
                                                                borderColor: preset.accent,
                                                                transform: [{ scale: 1.15 }],
                                                            },
                                                        ]}
                                                        onPress={() => handleChangeBabyColor(baby.id, preset.hex)}
                                                    >
                                                        {baby.themeColorHex === preset.hex && (
                                                            <Text style={styles.colorCheck}>✓</Text>
                                                        )}
                                                    </TouchableOpacity>
                                                ))}
                                            </View>

                                            {/* 削除 */}
                                            {babies.length > 1 && (
                                                <TouchableOpacity
                                                    style={styles.deleteBabyButton}
                                                    onPress={() => handleDeleteBaby(baby)}
                                                >
                                                    <Ionicons name="trash-outline" size={16} color="#FF4444" />
                                                    <Text style={styles.deleteBabyText}>{i18n.t("settings.deleteBabyButton")}</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        {/* 赤ちゃんを追加 */}
                        <View style={styles.divider} />
                        <TouchableOpacity
                            style={styles.addBabyRow}
                            onPress={handleAddBaby}
                        >
                            <Ionicons name="add-circle-outline" size={20} color="#999" />
                            <Text style={styles.addBabyText}>{i18n.t("settings.addBabyButton")}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 初期表示設定 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("settings.defaultTextSection")}</Text>
                    <View style={styles.card}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="calendar-outline" size={22} color="#888" />
                                <Text style={styles.linkText}>{i18n.t("settings.defaultDate")}</Text>
                            </View>
                            <Switch
                                value={settings.defaultShowDate}
                                onValueChange={(val) =>
                                    dispatch({
                                        type: "SET_DEFAULT_TOGGLES", payload: {
                                            defaultShowDate: val,
                                            defaultShowName: settings.defaultShowName,
                                            defaultShowAge: settings.defaultShowAge,
                                            defaultAgeFormat: settings.defaultAgeFormat
                                        }
                                    })
                                }
                                trackColor={{ false: "#E0E0E0", true: theme.accent }}
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.settingRow}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="person-outline" size={22} color="#888" />
                                <Text style={styles.linkText}>{i18n.t("settings.defaultName")}</Text>
                            </View>
                            <Switch
                                value={settings.defaultShowName}
                                onValueChange={(val) =>
                                    dispatch({
                                        type: "SET_DEFAULT_TOGGLES", payload: {
                                            defaultShowDate: settings.defaultShowDate,
                                            defaultShowName: val,
                                            defaultShowAge: settings.defaultShowAge,
                                            defaultAgeFormat: settings.defaultAgeFormat
                                        }
                                    })
                                }
                                trackColor={{ false: "#E0E0E0", true: theme.accent }}
                            />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.settingRow}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="time-outline" size={22} color="#888" />
                                <Text style={styles.linkText}>{i18n.t("settings.defaultAge")}</Text>
                            </View>
                            <Switch
                                value={settings.defaultShowAge}
                                onValueChange={(val) =>
                                    dispatch({
                                        type: "SET_DEFAULT_TOGGLES", payload: {
                                            defaultShowDate: settings.defaultShowDate,
                                            defaultShowName: settings.defaultShowName,
                                            defaultShowAge: val,
                                            defaultAgeFormat: settings.defaultAgeFormat
                                        }
                                    })
                                }
                                trackColor={{ false: "#E0E0E0", true: theme.accent }}
                            />
                        </View>
                        {settings.defaultShowAge && (
                            <View style={styles.formatSegmentContainer}>
                                <TouchableOpacity
                                    style={[styles.formatSegmentButton, settings.defaultAgeFormat === "days" && styles.formatSegmentButtonActive]}
                                    onPress={() => dispatch({
                                        type: "SET_DEFAULT_TOGGLES", payload: {
                                            defaultShowDate: settings.defaultShowDate,
                                            defaultShowName: settings.defaultShowName,
                                            defaultShowAge: settings.defaultShowAge,
                                            defaultAgeFormat: "days"
                                        }
                                    })}
                                >
                                    <Text style={[styles.formatSegmentText, settings.defaultAgeFormat === "days" && { color: theme.accent }]}>{i18n.t("editor.ageFormatDays")}</Text>
                                </TouchableOpacity>
                                <View style={styles.formatSegmentDivider} />
                                <TouchableOpacity
                                    style={[styles.formatSegmentButton, settings.defaultAgeFormat === "months_days" && styles.formatSegmentButtonActive]}
                                    onPress={() => dispatch({
                                        type: "SET_DEFAULT_TOGGLES", payload: {
                                            defaultShowDate: settings.defaultShowDate,
                                            defaultShowName: settings.defaultShowName,
                                            defaultShowAge: settings.defaultShowAge,
                                            defaultAgeFormat: "months_days"
                                        }
                                    })}
                                >
                                    <Text style={[styles.formatSegmentText, settings.defaultAgeFormat === "months_days" && { color: theme.accent }]}>{i18n.t("editor.ageFormatMonthsDays")}</Text>
                                </TouchableOpacity>
                                <View style={styles.formatSegmentDivider} />
                                <TouchableOpacity
                                    style={[styles.formatSegmentButton, settings.defaultAgeFormat === "years_months" && styles.formatSegmentButtonActive]}
                                    onPress={() => dispatch({
                                        type: "SET_DEFAULT_TOGGLES", payload: {
                                            defaultShowDate: settings.defaultShowDate,
                                            defaultShowName: settings.defaultShowName,
                                            defaultShowAge: settings.defaultShowAge,
                                            defaultAgeFormat: "years_months"
                                        }
                                    })}
                                >
                                    <Text style={[styles.formatSegmentText, settings.defaultAgeFormat === "years_months" && { color: theme.accent }]}>{i18n.t("editor.ageFormatYearsMonths")}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* デフォルトのスタイル */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("settings.defaultStyleSection")}</Text>

                    <Text style={styles.subTitle}>{i18n.t("settings.templateSubtitle")}</Text>
                    <View style={styles.templateRow}>
                        {TEMPLATES.map((t) => (
                            <TouchableOpacity
                                key={t.id}
                                style={[
                                    styles.templateOption,
                                    settings.defaultTemplateId === t.id && [styles.templateOptionActive, { borderColor: theme.accent, backgroundColor: theme.light }],
                                ]}
                                onPress={() => handleTemplateChange(t.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.templatePreviewBox}>
                                    {!t.hasFrame && <View style={styles.templateNoFrame} />}
                                    {t.hasFrame && (
                                        <View style={styles.templateFrame}>
                                            <View style={styles.templateInner} />
                                        </View>
                                    )}
                                </View>
                                <Text
                                    style={[
                                        styles.templateLabel,
                                        settings.defaultTemplateId === t.id && [styles.templateLabelActive, { color: theme.accent }],
                                    ]}
                                >
                                    {t.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.subTitle}>{i18n.t("settings.fontSubtitle")}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fontRow}>
                        {FONT_OPTIONS.map((f) => (
                            <TouchableOpacity
                                key={f.id}
                                style={[
                                    styles.fontBadge,
                                    settings.defaultFontId === f.id && [styles.fontBadgeActive, { borderColor: theme.accent, backgroundColor: theme.light }],
                                ]}
                                onPress={() => handleFontChange(f.id)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.fontBadgeText,
                                        { fontFamily: f.id },
                                        settings.defaultFontId === f.id && [styles.fontBadgeTextActive, { color: theme.accent }],
                                    ]}
                                >
                                    {f.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* リンクセクション */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("settings.infoSection")}</Text>
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={styles.linkRow}
                            onPress={() => openURL(settings.policyUrls.termsUrl)}
                        >
                            <View style={styles.linkLeft}>
                                <Ionicons name="document-text-outline" size={20} color="#888" />
                                <Text style={styles.linkText}>{i18n.t("settings.termsLink")}</Text>
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
                                <Text style={styles.linkText}>{i18n.t("settings.privacyLink")}</Text>
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
                                <Text style={styles.linkText}>{i18n.t("settings.contactLink")}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#CCC" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* アプリバージョン */}
                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>BabyDaySnap v{appVersion}</Text>
                </View>
            </ScrollView>
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
    // --- 赤ちゃん管理 ---
    babyRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    babyRowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    babyColorDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    babyName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#333",
    },
    babyBirth: {
        fontSize: 13,
        color: "#888",
        marginTop: 2,
    },
    editPanel: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: "#FAFAFA",
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    editRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
    },
    editLabel: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    },
    editInput: {
        fontSize: 16,
        color: "#333",
        fontWeight: "600",
        textAlign: "right",
        flex: 1,
        marginLeft: 16,
        padding: 0,
    },
    editButton: {
        backgroundColor: "#FFF",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: "600",
    },
    colorPickerRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 12,
        paddingVertical: 8,
    },
    colorOption: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    colorCheck: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "800",
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    deleteBabyButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        marginTop: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#FFD0D0",
    },
    deleteBabyText: {
        color: "#FF4444",
        fontSize: 14,
        fontWeight: "500",
    },
    addBabyRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 16,
    },
    addBabyText: {
        fontSize: 15,
        color: "#999",
    },
    addBabyPanel: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: "#FAFAFA",
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
    },
    // --- 既存スタイル ---
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
    datePickerContainer: {
        borderTopWidth: 1,
        borderTopColor: "#F0F0F0",
        padding: 16,
        alignItems: "center",
    },
    formatSegmentContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 4,
    },
    formatSegmentButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        borderRadius: 6,
    },
    formatSegmentButtonActive: {
        backgroundColor: "#FFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    formatSegmentDivider: {
        width: 1,
        height: "60%",
        backgroundColor: "#E0E0E0",
    },
    formatSegmentText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#888",
    },
    datePicker: {
        width: "100%",
    },
    saveDateButton: {
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
    subTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        marginTop: 12,
        marginBottom: 8,
    },
    templateRow: {
        flexDirection: "row",
        gap: 12,
    },
    templateOption: {
        flex: 1,
        alignItems: "center",
        padding: 10,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#F0F0F0",
        backgroundColor: "#FAFAFA",
    },
    templateOptionActive: {
        borderColor: "#FF8FA3",
        backgroundColor: "#FFF5F7",
    },
    templatePreviewBox: {
        width: 60,
        height: 48,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 6,
    },
    templateNoFrame: {
        width: 52,
        height: 40,
        backgroundColor: "#E0E0E0",
        borderRadius: 4,
    },
    templateFrame: {
        width: 52,
        height: 40,
        backgroundColor: "#FFF",
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    templateInner: {
        width: 42,
        height: 30,
        backgroundColor: "#E0E0E0",
        borderRadius: 2,
    },
    templateLabel: {
        fontSize: 11,
        color: "#888",
        fontWeight: "500",
    },
    templateLabelActive: {
        color: "#FF8FA3",
        fontWeight: "700",
    },
    fontRow: {
        flexDirection: "row",
        gap: 8,
        paddingVertical: 4,
    },
    fontBadge: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#F5F5F5",
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "transparent",
    },
    fontBadgeActive: {
        backgroundColor: "#FFF5F7",
        borderColor: "#FF8FA3",
    },
    fontBadgeText: {
        fontSize: 14,
        color: "#666",
    },
    fontBadgeTextActive: {
        color: "#FF8FA3",
        fontWeight: "bold",
    },
});
