import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import i18n from "@/lib/i18n";
import { loadEngagementState } from "@/lib/engagement";

const DAILY_REMINDER_STORAGE_KEY = "@babydaysnap/daily_reminder";
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const DEFAULT_REMINDER_HOUR = 18;
const DEFAULT_REMINDER_MINUTE = 30;
const ANDROID_CHANNEL_ID = "daily-reminders";

export type DailyReminderSettings = {
    enabled: boolean;
    hour: number;
    minute: number;
    scheduledNotificationId: string | null;
    permissionRequestedAtMs: number | null;
};

const DEFAULT_DAILY_REMINDER_SETTINGS: DailyReminderSettings = {
    enabled: false,
    hour: DEFAULT_REMINDER_HOUR,
    minute: DEFAULT_REMINDER_MINUTE,
    scheduledNotificationId: null,
    permissionRequestedAtMs: null,
};

let notificationHandlerConfigured = false;

function normalizeDailyReminderSettings(
    value?: Partial<DailyReminderSettings> | null,
): DailyReminderSettings {
    return {
        ...DEFAULT_DAILY_REMINDER_SETTINGS,
        ...(value ?? {}),
    };
}

function isSameLocalDay(leftMs: number | null, rightMs: number | null) {
    if (leftMs === null || rightMs === null) {
        return false;
    }

    const left = new Date(leftMs);
    const right = new Date(rightMs);

    return (
        left.getFullYear() === right.getFullYear() &&
        left.getMonth() === right.getMonth() &&
        left.getDate() === right.getDate()
    );
}

function buildReminderDate(base: Date, hour: number, minute: number) {
    const reminderDate = new Date(base);
    reminderDate.setHours(hour, minute, 0, 0);
    return reminderDate;
}

function computeNextReminderDate(
    now: Date,
    settings: DailyReminderSettings,
    lastOpenAtMs: number | null,
    lastSaveSuccessAtMs: number | null,
) {
    let candidate = buildReminderDate(now, settings.hour, settings.minute);
    if (candidate.getTime() <= now.getTime()) {
        candidate.setDate(candidate.getDate() + 1);
    }

    for (let attempt = 0; attempt < 7; attempt += 1) {
        const candidateMs = candidate.getTime();
        const openedTooRecently =
            lastOpenAtMs !== null &&
            lastOpenAtMs <= candidateMs &&
            candidateMs - lastOpenAtMs < TWO_HOURS_MS;
        const alreadySavedThatDay = isSameLocalDay(lastSaveSuccessAtMs, candidateMs);

        if (!openedTooRecently && !alreadySavedThatDay) {
            return candidate;
        }

        candidate = buildReminderDate(candidate, settings.hour, settings.minute);
        candidate.setDate(candidate.getDate() + 1);
    }

    return candidate;
}

async function saveDailyReminderSettings(settings: DailyReminderSettings) {
    await AsyncStorage.setItem(DAILY_REMINDER_STORAGE_KEY, JSON.stringify(settings));
}

async function cancelScheduledNotificationById(notificationId: string | null) {
    if (!notificationId) {
        return;
    }

    await Notifications.cancelScheduledNotificationAsync(notificationId).catch(() => undefined);
}

async function ensureReminderChannelAsync() {
    if (Platform.OS !== "android") {
        return;
    }

    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: i18n.t("reminder.channelName"),
        importance: Notifications.AndroidImportance.DEFAULT,
        sound: undefined,
    });
}

export function ensureNotificationPresentationConfigured() {
    if (notificationHandlerConfigured) {
        return;
    }

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: Platform.OS === "android",
            shouldSetBadge: false,
        }),
    });

    notificationHandlerConfigured = true;
}

export async function loadDailyReminderSettings(): Promise<DailyReminderSettings> {
    try {
        const raw = await AsyncStorage.getItem(DAILY_REMINDER_STORAGE_KEY);
        if (!raw) {
            return DEFAULT_DAILY_REMINDER_SETTINGS;
        }

        return normalizeDailyReminderSettings(JSON.parse(raw) as Partial<DailyReminderSettings>);
    } catch {
        return DEFAULT_DAILY_REMINDER_SETTINGS;
    }
}

function isNotificationPermissionGranted(status: Notifications.NotificationPermissionsStatus) {
    return (
        status.granted ||
        status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    );
}

export async function getNotificationPermissionGranted() {
    const status = await Notifications.getPermissionsAsync();
    return isNotificationPermissionGranted(status);
}

export async function requestDailyReminderPermissionAsync() {
    ensureNotificationPresentationConfigured();
    await ensureReminderChannelAsync();

    const existingStatus = await Notifications.getPermissionsAsync();
    if (isNotificationPermissionGranted(existingStatus)) {
        const settings = await loadDailyReminderSettings();
        const nextSettings: DailyReminderSettings = {
            ...settings,
            permissionRequestedAtMs: settings.permissionRequestedAtMs ?? Date.now(),
        };
        await saveDailyReminderSettings(nextSettings);
        return { granted: true, settings: nextSettings };
    }

    const status = await Notifications.requestPermissionsAsync({
        ios: {
            allowAlert: true,
            allowBadge: false,
            allowSound: false,
        },
    });

    const settings = await loadDailyReminderSettings();
    const nextSettings: DailyReminderSettings = {
        ...settings,
        permissionRequestedAtMs: Date.now(),
    };
    await saveDailyReminderSettings(nextSettings);

    return {
        granted: isNotificationPermissionGranted(status),
        settings: nextSettings,
    };
}

export async function disableDailyReminderAsync() {
    const settings = await loadDailyReminderSettings();
    await cancelScheduledNotificationById(settings.scheduledNotificationId);

    const nextSettings: DailyReminderSettings = {
        ...settings,
        enabled: false,
        scheduledNotificationId: null,
    };

    await saveDailyReminderSettings(nextSettings);
    return nextSettings;
}

export async function saveDailyReminderTimeAsync(hour: number, minute: number) {
    const settings = await loadDailyReminderSettings();
    const nextSettings: DailyReminderSettings = {
        ...settings,
        hour,
        minute,
    };

    await saveDailyReminderSettings(nextSettings);
    return nextSettings;
}

export async function enableDailyReminderAsync(hour?: number, minute?: number) {
    const settings = await loadDailyReminderSettings();
    const nextSettings: DailyReminderSettings = {
        ...settings,
        enabled: true,
        hour: hour ?? settings.hour,
        minute: minute ?? settings.minute,
    };

    await saveDailyReminderSettings(nextSettings);
    return refreshDailyReminderScheduleAsync(nextSettings);
}

export async function refreshDailyReminderScheduleAsync(
    explicitSettings?: DailyReminderSettings,
) {
    ensureNotificationPresentationConfigured();

    const settings = explicitSettings ?? await loadDailyReminderSettings();
    if (!settings.enabled) {
        await cancelScheduledNotificationById(settings.scheduledNotificationId);
        if (settings.scheduledNotificationId !== null) {
            const clearedSettings: DailyReminderSettings = {
                ...settings,
                scheduledNotificationId: null,
            };
            await saveDailyReminderSettings(clearedSettings);
            return clearedSettings;
        }

        return settings;
    }

    const permissionGranted = await getNotificationPermissionGranted().catch(() => false);
    if (!permissionGranted) {
        return settings;
    }

    await ensureReminderChannelAsync();

    const engagementState = await loadEngagementState();
    const nextReminderAt = computeNextReminderDate(
        new Date(),
        settings,
        engagementState.lastOpenAtMs,
        engagementState.lastSaveSuccessAtMs,
    );

    await cancelScheduledNotificationById(settings.scheduledNotificationId);

    const identifier = await Notifications.scheduleNotificationAsync({
        content: {
            title: i18n.t("reminder.notificationTitle"),
            body: i18n.t("reminder.notificationBody"),
            sound: false,
            data: { type: "daily-reminder" },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: nextReminderAt.getTime(),
            ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {}),
        },
    });

    const nextSettings: DailyReminderSettings = {
        ...settings,
        scheduledNotificationId: identifier,
    };

    await saveDailyReminderSettings(nextSettings);
    return nextSettings;
}

export function getDefaultReminderTime() {
    return {
        hour: DEFAULT_REMINDER_HOUR,
        minute: DEFAULT_REMINDER_MINUTE,
    };
}
