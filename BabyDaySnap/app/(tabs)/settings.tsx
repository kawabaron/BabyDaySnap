import { useEffect, useState } from "react";
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
import { useAdsConsent } from "@/context/AdsConsentContext";
import { useAppState, useAppDispatch, useActiveBaby } from "@/context/AppContext";
import { formatDateISO, formatDateDisplay, formatStyledAgeDisplay, formatStyledDateDisplay } from "@/utils/date";
import { VISIBLE_TEMPLATES, getAvailableFontsForCurrentLocale } from "@/utils/templates";
import {
    DECORATIVE_FRAME_BACKGROUND_COLOR,
    DECORATIVE_FRAME_LINE_COLOR,
} from "@/utils/decorativeFrame";
import { FILTER_OPTIONS } from "@/utils/filters";
import { THEME_COLOR_PRESETS, getThemePreset, NEUTRAL_THEME } from "@/constants/babyTheme";
import type { TemplateId, FontId, FilterId, BabyProfile, DisplayStyle } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import i18n, { getCurrentLocaleTag } from "@/lib/i18n";
import { AppHeader } from "@/components/AppHeader";
import { ScrollHintedScrollView } from "@/components/ScrollHintedScrollView";
import { useBilling } from "@/lib/billing";
import {
    disableDailyReminderAsync,
    enableDailyReminderAsync,
    type DailyReminderSettings,
    loadDailyReminderSettings,
    refreshDailyReminderScheduleAsync,
    requestDailyReminderPermissionAsync,
    saveDailyReminderTimeAsync,
} from "@/lib/dailyReminder";
import { markReminderPrimerAccepted } from "@/lib/engagement";
import { AD_FREE_PRODUCT_ID, VISIBLE_SEASON_PACKS, getSeasonPackByTemplateId, isSeasonPackUnlocked } from "@/lib/monetization";
import { requestManualReview } from "@/lib/review";

const DISPLAY_STYLE_OPTIONS: DisplayStyle[] = ["current", "soft_english", "diary_english", "keepsake_english"];

function createTimeDate(hour: number, minute: number) {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
}

function formatReminderTime(hour: number, minute: number) {
    return createTimeDate(hour, minute).toLocaleTimeString(getCurrentLocaleTag(), {
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function SettingsScreen() {
    const { settings, babies, library } = useAppState();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const activeBaby = useActiveBaby();
    const theme = activeBaby ? getThemePreset(activeBaby.themeColorHex) : NEUTRAL_THEME;
    const { privacyOptionsRequired, openPrivacyOptions } = useAdsConsent();
    const { productsById, isPurchasing, purchaseAdFree, purchaseSeasonPack, restorePurchases } = useBilling();

    const [editingBabyId, setEditingBabyId] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());
    const [reminderSettings, setReminderSettings] = useState<DailyReminderSettings>({
        enabled: false,
        hour: 18,
        minute: 30,
        scheduledNotificationId: null,
        permissionRequestedAtMs: null,
    });
    const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
    const [tempReminderTime, setTempReminderTime] = useState(createTimeDate(18, 30));
    const availableFonts = getAvailableFontsForCurrentLocale();

    useEffect(() => {
        let mounted = true;

        loadDailyReminderSettings()
            .then((loadedSettings) => {
                if (!mounted) {
                    return;
                }

                setReminderSettings(loadedSettings);
                setTempReminderTime(createTimeDate(loadedSettings.hour, loadedSettings.minute));
            })
            .catch(() => undefined);

        return () => {
            mounted = false;
        };
    }, []);

    const handleEditBaby = (baby: BabyProfile) => {
        setEditingBabyId(baby.id);
        setShowDatePicker(false);
    };

    const handleToggleDatePicker = () => {
        if (!showDatePicker) {
            setTempDate(new Date());
        }
        setShowDatePicker(!showDatePicker);
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

    const handleTemplateChange = (id: string) => {
        const pack = getSeasonPackByTemplateId(id as TemplateId);
        if (pack && !isSeasonPackUnlocked(settings, pack.id)) {
            Alert.alert(
                i18n.t("monetization.lockedTemplateTitle"),
                i18n.t("monetization.lockedTemplateMessage"),
                [
                    { text: i18n.t("common.cancel"), style: "cancel" },
                    {
                        text: i18n.t("monetization.buyNow"),
                        onPress: () => {
                            purchaseSeasonPack(pack.id).catch(() => undefined);
                        },
                    },
                ],
            );
            return;
        }

        dispatch({
            type: "SET_DEFAULT_PREFS",
            payload: { defaultTemplateId: id as TemplateId },
        });
    };

    const handleFontChange = (id: FontId) => {
        dispatch({
            type: "SET_DEFAULT_PREFS",
            payload: { defaultFontId: id },
        });
    };

    const handleFilterChange = (id: FilterId) => {
        dispatch({
            type: "SET_DEFAULT_PREFS",
            payload: { defaultFilterId: id },
        });
    };

    const openURL = (url: string) => {
        Linking.openURL(url).catch(() => {
            Alert.alert(i18n.t("settings.linkErrorTitle"), i18n.t("settings.linkErrorMsg"));
        });
    };

    const handleOpenAdPrivacyChoices = () => {
        openPrivacyOptions().catch(() => {
            Alert.alert(
                i18n.t("settings.adPrivacyErrorTitle"),
                i18n.t("settings.adPrivacyErrorMessage"),
            );
        });
    };

    const handleManualReview = () => {
        requestManualReview()
            .then((opened) => {
                if (!opened) {
                    Alert.alert(
                        i18n.t("settings.reviewUnavailableTitle"),
                        i18n.t("settings.reviewUnavailableMessage"),
                    );
                }
            })
            .catch(() => {
                Alert.alert(
                    i18n.t("settings.reviewUnavailableTitle"),
                    i18n.t("settings.reviewUnavailableMessage"),
                );
            });
    };

    const handleSaveReminderTime = (date: Date) => {
        const nextHour = date.getHours();
        const nextMinute = date.getMinutes();

        setTempReminderTime(createTimeDate(nextHour, nextMinute));

        saveDailyReminderTimeAsync(nextHour, nextMinute)
            .then((savedSettings) => {
                if (!savedSettings.enabled) {
                    setReminderSettings(savedSettings);
                    return savedSettings;
                }

                return refreshDailyReminderScheduleAsync(savedSettings);
            })
            .then((scheduledSettings) => {
                setReminderSettings(scheduledSettings);
            })
            .catch(() => undefined);
    };

    const handleReminderTimeChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === "android") {
            setShowReminderTimePicker(false);
        }

        if (!selectedDate) {
            return;
        }

        setTempReminderTime(selectedDate);

        if (Platform.OS === "android") {
            handleSaveReminderTime(selectedDate);
        }
    };

    const handleReminderToggle = (nextValue: boolean) => {
        if (!nextValue) {
            disableDailyReminderAsync()
                .then((nextSettings) => {
                    setReminderSettings(nextSettings);
                    setShowReminderTimePicker(false);
                })
                .catch(() => undefined);
            return;
        }

        Alert.alert(
            i18n.t("reminder.primerTitle"),
            i18n.t("reminder.primerMessage"),
            [
                { text: i18n.t("common.cancel"), style: "cancel" },
                {
                    text: i18n.t("reminder.primerAllow"),
                    onPress: () => {
                        requestDailyReminderPermissionAsync()
                            .then(async (permissionResult) => {
                                if (!permissionResult.granted) {
                                    Alert.alert(
                                        i18n.t("reminder.permissionDeniedTitle"),
                                        i18n.t("reminder.permissionDeniedMessage"),
                                        [
                                            { text: i18n.t("common.cancel"), style: "cancel" },
                                            {
                                                text: i18n.t("photoLibrary.openSettings"),
                                                onPress: () => {
                                                    Linking.openSettings().catch(() => undefined);
                                                },
                                            },
                                        ],
                                    );
                                    return;
                                }

                                await markReminderPrimerAccepted();
                                const enabledSettings = await enableDailyReminderAsync(
                                    reminderSettings.hour,
                                    reminderSettings.minute,
                                );
                                setReminderSettings(enabledSettings);
                                setTempReminderTime(createTimeDate(enabledSettings.hour, enabledSettings.minute));
                                Alert.alert(
                                    i18n.t("reminder.enabledTitle"),
                                    i18n.t("reminder.enabledMessage"),
                                );
                            })
                            .catch(() => undefined);
                    },
                },
            ],
        );
    };

    const appVersion = Constants.expoConfig?.version ?? "1.11";
    const adFreeProduct = productsById[AD_FREE_PRODUCT_ID];

    return (
        <SafeAreaView style={styles.screen} edges={["top"]}>
            <AppHeader title={i18n.t("settings.headerTitle")} />

            <ScrollView
                style={styles.container}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >

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
                                                    onPress={handleToggleDatePicker}
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
                                                        minimumDate={new Date(1900, 0, 1)}
                                                        onChange={onDateChange}
                                                        locale={getCurrentLocaleTag()}
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
                                            defaultAgeFormat: settings.defaultAgeFormat,
                                            defaultDisplayStyle: settings.defaultDisplayStyle,
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
                                            defaultAgeFormat: settings.defaultAgeFormat,
                                            defaultDisplayStyle: settings.defaultDisplayStyle,
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
                                            defaultAgeFormat: settings.defaultAgeFormat,
                                            defaultDisplayStyle: settings.defaultDisplayStyle,
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
                                            defaultAgeFormat: "days",
                                            defaultDisplayStyle: settings.defaultDisplayStyle,
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
                                            defaultAgeFormat: "months_days",
                                            defaultDisplayStyle: settings.defaultDisplayStyle,
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
                                            defaultAgeFormat: "years_months",
                                            defaultDisplayStyle: settings.defaultDisplayStyle,
                                        }
                                    })}
                                >
                                    <Text style={[styles.formatSegmentText, settings.defaultAgeFormat === "years_months" && { color: theme.accent }]}>{i18n.t("editor.ageFormatYearsMonths")}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={styles.divider} />
                        <View style={styles.displayStyleSection}>
                            <Text style={styles.displayStyleLabel}>{i18n.t("settings.defaultDisplayStyle")}</Text>
                            <ScrollHintedScrollView
                                direction="horizontal"
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.displayStyleRow}
                            >
                                {DISPLAY_STYLE_OPTIONS.map((style) => {
                                    const isActive = settings.defaultDisplayStyle === style;
                                    return (
                                        <TouchableOpacity
                                            key={style}
                                            style={[
                                                styles.displayStyleButton,
                                                isActive && [styles.displayStyleButtonActive, { borderColor: theme.accent, backgroundColor: theme.light }],
                                            ]}
                                            onPress={() =>
                                                dispatch({
                                                    type: "SET_DEFAULT_TOGGLES",
                                                    payload: {
                                                        defaultShowDate: settings.defaultShowDate,
                                                        defaultShowName: settings.defaultShowName,
                                                        defaultShowAge: settings.defaultShowAge,
                                                        defaultAgeFormat: settings.defaultAgeFormat,
                                                        defaultDisplayStyle: style,
                                                    },
                                                })
                                            }
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[styles.displayStyleTitle, isActive && { color: theme.accent }]}>
                                                {i18n.t(`editor.displayStyle.${style}`)}
                                            </Text>
                                            <Text style={styles.displayStylePreview}>
                                                {formatStyledDateDisplay("2026/03/16", style)}
                                            </Text>
                                            <Text style={styles.displayStylePreview}>
                                                {formatStyledAgeDisplay({
                                                    ageFormat: "days",
                                                    ageDays: 120,
                                                    shotDateISO: "2026/03/16",
                                                    displayStyle: style,
                                                })}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollHintedScrollView>
                        </View>
                    </View>
                </View>

                {/* デフォルトのスタイル */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("settings.defaultStyleSection")}</Text>

                    <Text style={styles.subTitle}>{i18n.t("settings.templateSubtitle")}</Text>
                    <ScrollHintedScrollView
                        direction="horizontal"
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.templateRow}
                    >
                        {VISIBLE_TEMPLATES.map((t) => {
                            const pack = getSeasonPackByTemplateId(t.id);
                            const isLocked = pack ? !isSeasonPackUnlocked(settings, pack.id) : false;

                            return (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[
                                        styles.templateOption,
                                        isLocked && styles.lockedTemplateOption,
                                        settings.defaultTemplateId === t.id && [styles.templateOptionActive, { borderColor: theme.accent, backgroundColor: theme.light }],
                                    ]}
                                    onPress={() => handleTemplateChange(t.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.templatePreviewBox}>
                                        {t.decorationPreset === "berry_sakura" && (
                                            <View style={styles.templateDecorativeFrame}>
                                                <View style={styles.templateDecorativeInner} />
                                                <View style={[styles.templateDecorativeDot, { left: 3, top: 4, width: 10, height: 10 }]} />
                                                <View style={[styles.templateDecorativeDot, { right: 4, top: 6, width: 8, height: 8 }]} />
                                                <View style={[styles.templateDecorativeDot, { left: 6, bottom: 4, width: 11, height: 11 }]} />
                                            </View>
                                        )}
                                        {!t.hasFrame && (
                                            <View style={styles.templateNoFrame}>
                                                {t.innerLineColorHex ? <View style={styles.templateNoFrameInnerLine} /> : null}
                                            </View>
                                        )}
                                        {t.hasFrame && !t.decorationPreset && (
                                            <View style={styles.templateFrame}>
                                                <View style={styles.templateInner} />
                                            </View>
                                        )}
                                        {isLocked ? (
                                            <View style={styles.templateLockBadge}>
                                                <Ionicons name="lock-closed" size={11} color="#FFF" />
                                            </View>
                                        ) : null}
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
                            );
                        })}
                    </ScrollHintedScrollView>

                    <Text style={styles.subTitle}>{i18n.t("settings.fontSubtitle")}</Text>
                    <ScrollHintedScrollView
                        direction="horizontal"
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.fontRow}
                    >
                        {availableFonts.map((f) => (
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
                    </ScrollHintedScrollView>

                    <Text style={styles.subTitle}>{i18n.t("editor.filterTitle")}</Text>
                    <ScrollHintedScrollView
                        direction="horizontal"
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filterRow}
                    >
                        {FILTER_OPTIONS.map((option) => {
                            const isActive = settings.defaultFilterId === option.id;
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.filterChip,
                                        isActive && [styles.filterChipActive, { borderColor: theme.accent, backgroundColor: theme.light }],
                                    ]}
                                    onPress={() => handleFilterChange(option.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.filterDot, { backgroundColor: option.id === "filter_none" ? "#E7E7E7" : option.color }]} />
                                    <Text style={[styles.filterLabel, isActive && { color: theme.accent }]}>
                                        {i18n.t(option.labelKey)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollHintedScrollView>
                </View>

                {/* リンクセクション */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("monetization.sectionTitle")}</Text>
                    <View style={styles.card}>
                        <View style={styles.purchaseRow}>
                            <View style={styles.purchaseCopy}>
                                <Text style={styles.purchaseTitle}>{i18n.t("monetization.adFreeTitle")}</Text>
                                <Text style={styles.purchaseDescription}>
                                    {settings.adFreeUnlocked
                                        ? i18n.t("monetization.adFreeUnlocked")
                                        : i18n.t("monetization.adFreeDescription")}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.purchaseButton,
                                    { backgroundColor: settings.adFreeUnlocked ? "#E7E7E7" : theme.accent },
                                ]}
                                onPress={() => purchaseAdFree()}
                                activeOpacity={0.8}
                                disabled={settings.adFreeUnlocked || isPurchasing}
                            >
                                <Text style={styles.purchaseButtonText}>
                                    {settings.adFreeUnlocked
                                        ? i18n.t("monetization.purchasedBadge")
                                        : adFreeProduct?.displayPrice ?? i18n.t("monetization.buyNow")}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider} />

                        {VISIBLE_SEASON_PACKS.map((pack, index) => {
                            const product = productsById[pack.productId];
                            const unlocked = settings.unlockedSeasonPackIds.includes(pack.id);

                            return (
                                <View key={pack.id}>
                                    {index > 0 ? <View style={styles.divider} /> : null}
                                    <View style={styles.purchaseRow}>
                                        <View style={styles.purchaseCopy}>
                                            <Text style={styles.purchaseTitle}>{i18n.t(pack.titleKey)}</Text>
                                            <Text style={styles.purchaseDescription}>{i18n.t(pack.descriptionKey)}</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={[
                                                styles.purchaseButton,
                                                { backgroundColor: unlocked ? "#E7E7E7" : theme.accent },
                                            ]}
                                            onPress={() => purchaseSeasonPack(pack.id)}
                                            activeOpacity={0.8}
                                            disabled={unlocked || isPurchasing}
                                        >
                                            <Text style={styles.purchaseButtonText}>
                                                {unlocked
                                                    ? i18n.t("monetization.purchasedBadge")
                                                    : product?.displayPrice ?? i18n.t("monetization.buyNow")}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            );
                        })}

                        <TouchableOpacity
                            style={[styles.restoreButton, { borderColor: theme.accent }]}
                            onPress={() => restorePurchases()}
                            activeOpacity={0.8}
                            disabled={isPurchasing}
                        >
                            <Text style={[styles.restoreButtonText, { color: theme.accent }]}>
                                {i18n.t("monetization.restoreButton")}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.restoreHintCard}>
                            <View style={styles.restoreHintIconWrap}>
                                <Ionicons name="information-circle-outline" size={16} color="#9AA3AF" />
                            </View>
                            <Text style={styles.restoreHint}>
                                {i18n.t("monetization.restoreHint")}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("settings.reminderSection")}</Text>
                    <View style={styles.card}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingTextBlock}>
                                <Text style={styles.settingTitle}>{i18n.t("settings.dailyReminderLabel")}</Text>
                                <Text style={styles.settingDescription}>
                                    {reminderSettings.enabled
                                        ? i18n.t("settings.dailyReminderEnabledDescription", {
                                            time: formatReminderTime(reminderSettings.hour, reminderSettings.minute),
                                        })
                                        : i18n.t("settings.dailyReminderDisabledDescription")}
                                </Text>
                            </View>
                            <Switch
                                value={reminderSettings.enabled}
                                onValueChange={handleReminderToggle}
                                trackColor={{ false: "#E5E7EB", true: theme.light }}
                                thumbColor={reminderSettings.enabled ? theme.accent : "#FFFFFF"}
                            />
                        </View>

                        {reminderSettings.enabled ? (
                            <>
                                <View style={styles.divider} />

                                <TouchableOpacity
                                    style={styles.linkRow}
                                    onPress={() => setShowReminderTimePicker((current) => !current)}
                                >
                                    <View style={styles.linkLeft}>
                                        <Ionicons name="time-outline" size={20} color="#888" />
                                        <Text style={styles.linkText}>{i18n.t("settings.dailyReminderTimeLabel")}</Text>
                                    </View>
                                    <Text style={styles.valueText}>
                                        {formatReminderTime(reminderSettings.hour, reminderSettings.minute)}
                                    </Text>
                                </TouchableOpacity>

                                {showReminderTimePicker ? (
                                    <View style={styles.datePickerContainer}>
                                        <DateTimePicker
                                            value={tempReminderTime}
                                            mode="time"
                                            display={Platform.OS === "ios" ? "spinner" : "default"}
                                            onChange={handleReminderTimeChange}
                                            locale={getCurrentLocaleTag()}
                                        />

                                        {Platform.OS === "ios" ? (
                                            <TouchableOpacity
                                                style={[styles.saveDateButton, { backgroundColor: theme.accent }]}
                                                onPress={() => {
                                                    handleSaveReminderTime(tempReminderTime);
                                                    setShowReminderTimePicker(false);
                                                }}
                                            >
                                                <Text style={styles.saveDateButtonText}>{i18n.t("settings.editSaveButton")}</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                ) : null}
                            </>
                        ) : null}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{i18n.t("settings.infoSection")}</Text>
                    <View style={styles.card}>
                        <TouchableOpacity
                            style={styles.linkRow}
                            onPress={handleManualReview}
                        >
                            <View style={styles.linkLeft}>
                                <Ionicons name="star-outline" size={20} color="#888" />
                                <Text style={styles.linkText}>{i18n.t("settings.reviewLink")}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color="#CCC" />
                        </TouchableOpacity>

                        <View style={styles.divider} />

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

                        {privacyOptionsRequired ? (
                            <>
                                <View style={styles.divider} />

                                <TouchableOpacity
                                    style={styles.linkRow}
                                    onPress={handleOpenAdPrivacyChoices}
                                >
                                    <View style={styles.linkLeft}>
                                        <Ionicons name="options-outline" size={20} color="#888" />
                                        <Text style={styles.linkText}>{i18n.t("settings.adPrivacyChoicesLink")}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#CCC" />
                                </TouchableOpacity>
                            </>
                        ) : null}

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
                    <Text style={styles.versionText}>BSnap v{appVersion}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#FFF",
    },
    container: {
        flex: 1,
        backgroundColor: "#F8F8FA",
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
    purchaseRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: 16,
    },
    purchaseCopy: {
        flex: 1,
        gap: 4,
    },
    purchaseTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#333",
    },
    purchaseDescription: {
        fontSize: 13,
        lineHeight: 18,
        color: "#777",
    },
    purchaseButton: {
        minWidth: 92,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    purchaseButtonText: {
        color: "#FFF",
        fontSize: 13,
        fontWeight: "700",
    },
    restoreButton: {
        margin: 16,
        marginBottom: 10,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderRadius: 999,
        paddingVertical: 12,
    },
    restoreButtonText: {
        fontSize: 14,
        fontWeight: "700",
    },
    restoreHintCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#F6F7F9",
    },
    restoreHintIconWrap: {
        marginTop: 1,
    },
    restoreHint: {
        flex: 1,
        color: "#7A7A7A",
        fontSize: 12,
        lineHeight: 18,
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
    settingTextBlock: {
        flex: 1,
        paddingRight: 16,
        gap: 4,
    },
    settingTitle: {
        fontSize: 16,
        color: "#333",
        fontWeight: "600",
    },
    settingDescription: {
        fontSize: 13,
        color: "#777",
        lineHeight: 18,
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
    displayStyleSection: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 10,
    },
    displayStyleLabel: {
        fontSize: 14,
        fontWeight: "700",
        color: "#666",
    },
    displayStyleRow: {
        gap: 12,
        paddingRight: 16,
    },
    displayStyleButton: {
        width: 152,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E9E3DE",
        backgroundColor: "#FFF",
        gap: 4,
    },
    displayStyleButtonActive: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    displayStyleTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#333",
    },
    displayStylePreview: {
        fontSize: 12,
        color: "#777",
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
    valueText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#888",
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
        paddingVertical: 4,
    },
    templateOption: {
        width: 100,
        alignItems: "center",
        padding: 10,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#F0F0F0",
        backgroundColor: "#FAFAFA",
    },
    lockedTemplateOption: {
        opacity: 0.75,
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
    templateLockBadge: {
        position: "absolute",
        top: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FF8FA3",
    },
    templateNoFrame: {
        width: 52,
        height: 40,
        backgroundColor: "#E0E0E0",
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    templateNoFrameInnerLine: {
        width: 42,
        height: 30,
        borderWidth: 1.5,
        borderColor: "#FFF",
        borderRadius: 2,
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
    templateDecorativeFrame: {
        width: 52,
        height: 40,
        backgroundColor: DECORATIVE_FRAME_BACKGROUND_COLOR,
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    templateDecorativeInner: {
        width: 40,
        height: 28,
        borderWidth: 1.5,
        borderColor: DECORATIVE_FRAME_LINE_COLOR,
        borderRadius: 2,
        backgroundColor: "#FFF",
    },
    templateDecorativeDot: {
        position: "absolute",
        backgroundColor: "#FFB7D8",
        borderRadius: 999,
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
    filterRow: {
        flexDirection: "row",
        gap: 8,
        paddingVertical: 4,
    },
    filterChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#F5F5F5",
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "transparent",
    },
    filterChipActive: {
        backgroundColor: "#FFF5F7",
        borderColor: "#FF8FA3",
    },
    filterDot: {
        width: 14,
        height: 14,
        borderRadius: 7,
    },
    filterLabel: {
        fontSize: 14,
        color: "#666",
        fontWeight: "500",
    },
});
