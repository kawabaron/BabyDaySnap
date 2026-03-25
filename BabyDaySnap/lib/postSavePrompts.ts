import { Alert, InteractionManager, Linking } from "react-native";

import {
    getPostSavePromptDelayMs,
    loadEngagementState,
    markReminderPrimerAccepted,
    markReminderPrimerDismissed,
    markReminderPrimerShown,
    registerReviewPromptShown,
    shouldPromptForReview,
    shouldShowReminderPrimer,
} from "@/lib/engagement";
import {
    enableDailyReminderAsync,
    getDefaultReminderTime,
    loadDailyReminderSettings,
    requestDailyReminderPermissionAsync,
} from "@/lib/dailyReminder";
import i18n from "@/lib/i18n";
import { requestAutoReview } from "@/lib/review";

async function showReminderPrimerIfNeeded() {
    const [engagementState, reminderSettings] = await Promise.all([
        loadEngagementState(),
        loadDailyReminderSettings(),
    ]);

    if (reminderSettings.enabled || !shouldShowReminderPrimer(engagementState)) {
        return false;
    }

    await markReminderPrimerShown();

    Alert.alert(
        i18n.t("reminder.primerTitle"),
        i18n.t("reminder.primerMessage"),
        [
            {
                text: i18n.t("reminder.primerLater"),
                style: "cancel",
                onPress: () => {
                    void markReminderPrimerDismissed();
                },
            },
            {
                text: i18n.t("reminder.primerAllow"),
                onPress: () => {
                    void (async () => {
                        await markReminderPrimerAccepted();

                        const permissionResult = await requestDailyReminderPermissionAsync();
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

                        const defaultTime = getDefaultReminderTime();
                        await enableDailyReminderAsync(defaultTime.hour, defaultTime.minute);
                        Alert.alert(
                            i18n.t("reminder.enabledTitle"),
                            i18n.t("reminder.enabledMessage"),
                        );
                    })();
                },
            },
        ],
    );

    return true;
}

async function showReviewPromptIfNeeded() {
    const engagementState = await loadEngagementState();
    if (!shouldPromptForReview(engagementState)) {
        return false;
    }

    const shown = await requestAutoReview();
    if (shown) {
        await registerReviewPromptShown();
    }

    return shown;
}

export function schedulePostSavePrompts() {
    const delayMs = getPostSavePromptDelayMs();

    setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
            void (async () => {
                const primerShown = await showReminderPrimerIfNeeded();
                if (primerShown) {
                    return;
                }

                await showReviewPromptIfNeeded();
            })();
        });
    }, delayMs);
}
