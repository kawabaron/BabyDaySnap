import AsyncStorage from "@react-native-async-storage/async-storage";

const ENGAGEMENT_STORAGE_KEY = "@babydaysnap/engagement";
const OPEN_DEDUP_MS = 5 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const RECENT_FAILURE_COOLDOWN_MS = 15 * 60 * 1000;
const RECENT_AD_COOLDOWN_MS = 15 * 60 * 1000;
const RECENT_CRASH_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const HISTORY_RETENTION_MS = 180 * 24 * 60 * 60 * 1000;
const MIN_REVIEW_COOLDOWN_DAYS = 90;
const MAX_REVIEW_COOLDOWN_DAYS = 120;

export type EngagementState = {
    installAtMs: number | null;
    lastOpenAtMs: number | null;
    recentOpenAtMs: number[];
    saveSuccessCount: number;
    lastSaveSuccessAtMs: number | null;
    lastSaveFailedAtMs: number | null;
    lastAdShownAtMs: number | null;
    lastCrashDetectedAtMs: number | null;
    sessionActive: boolean;
    sessionStartedAtMs: number | null;
    reviewLastPromptedAtMs: number | null;
    reviewNextEligibleAtMs: number | null;
    reminderPrimerShownAtMs: number | null;
    reminderPrimerAcceptedAtMs: number | null;
    reminderPrimerDismissedAtMs: number | null;
};

const DEFAULT_ENGAGEMENT_STATE: EngagementState = {
    installAtMs: null,
    lastOpenAtMs: null,
    recentOpenAtMs: [],
    saveSuccessCount: 0,
    lastSaveSuccessAtMs: null,
    lastSaveFailedAtMs: null,
    lastAdShownAtMs: null,
    lastCrashDetectedAtMs: null,
    sessionActive: false,
    sessionStartedAtMs: null,
    reviewLastPromptedAtMs: null,
    reviewNextEligibleAtMs: null,
    reminderPrimerShownAtMs: null,
    reminderPrimerAcceptedAtMs: null,
    reminderPrimerDismissedAtMs: null,
};

let hasInitializedSession = false;

function pruneRecentOpenHistory(recentOpenAtMs: number[], now: number) {
    return recentOpenAtMs
        .filter((timestamp) => Number.isFinite(timestamp) && now - timestamp <= HISTORY_RETENTION_MS)
        .sort((left, right) => left - right);
}

function normalizeEngagementState(
    value?: Partial<EngagementState> | null,
    now: number = Date.now(),
): EngagementState {
    return {
        ...DEFAULT_ENGAGEMENT_STATE,
        ...(value ?? {}),
        recentOpenAtMs: pruneRecentOpenHistory(value?.recentOpenAtMs ?? [], now),
    };
}

async function saveEngagementState(state: EngagementState) {
    await AsyncStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify(state));
}

export async function loadEngagementState(): Promise<EngagementState> {
    try {
        const raw = await AsyncStorage.getItem(ENGAGEMENT_STORAGE_KEY);
        if (!raw) {
            return DEFAULT_ENGAGEMENT_STATE;
        }

        return normalizeEngagementState(JSON.parse(raw) as Partial<EngagementState>);
    } catch {
        return DEFAULT_ENGAGEMENT_STATE;
    }
}

export async function recordAppOpen(now: number = Date.now()): Promise<EngagementState> {
    const state = await loadEngagementState();
    const nextState = normalizeEngagementState(state, now);

    if (nextState.installAtMs === null) {
        nextState.installAtMs = now;
    }

    if (!hasInitializedSession && nextState.sessionActive) {
        nextState.lastCrashDetectedAtMs = now;
    }

    const shouldAppendOpen =
        nextState.recentOpenAtMs.length === 0 ||
        now - nextState.recentOpenAtMs[nextState.recentOpenAtMs.length - 1] >= OPEN_DEDUP_MS;

    if (shouldAppendOpen) {
        nextState.recentOpenAtMs = pruneRecentOpenHistory([...nextState.recentOpenAtMs, now], now);
    }

    nextState.lastOpenAtMs = now;
    nextState.sessionActive = true;
    nextState.sessionStartedAtMs = now;

    await saveEngagementState(nextState);
    hasInitializedSession = true;

    return nextState;
}

export async function markSessionBackgrounded() {
    const state = await loadEngagementState();
    if (!state.sessionActive) {
        return;
    }

    const nextState: EngagementState = {
        ...state,
        sessionActive: false,
    };
    await saveEngagementState(nextState);
}

export async function markSaveSuccess(now: number = Date.now()): Promise<EngagementState> {
    const state = await loadEngagementState();
    const nextState: EngagementState = {
        ...state,
        saveSuccessCount: state.saveSuccessCount + 1,
        lastSaveSuccessAtMs: now,
    };

    await saveEngagementState(nextState);
    return nextState;
}

export async function markSaveFailure(now: number = Date.now()): Promise<EngagementState> {
    const state = await loadEngagementState();
    const nextState: EngagementState = {
        ...state,
        lastSaveFailedAtMs: now,
    };

    await saveEngagementState(nextState);
    return nextState;
}

export async function markAdShown(now: number = Date.now()): Promise<EngagementState> {
    const state = await loadEngagementState();
    const nextState: EngagementState = {
        ...state,
        lastAdShownAtMs: now,
    };

    await saveEngagementState(nextState);
    return nextState;
}

export async function markReminderPrimerShown(now: number = Date.now()) {
    const state = await loadEngagementState();
    const nextState: EngagementState = {
        ...state,
        reminderPrimerShownAtMs: now,
    };

    await saveEngagementState(nextState);
    return nextState;
}

export async function markReminderPrimerAccepted(now: number = Date.now()) {
    const state = await loadEngagementState();
    const nextState: EngagementState = {
        ...state,
        reminderPrimerAcceptedAtMs: now,
        reminderPrimerShownAtMs: state.reminderPrimerShownAtMs ?? now,
    };

    await saveEngagementState(nextState);
    return nextState;
}

export async function markReminderPrimerDismissed(now: number = Date.now()) {
    const state = await loadEngagementState();
    const nextState: EngagementState = {
        ...state,
        reminderPrimerDismissedAtMs: now,
        reminderPrimerShownAtMs: state.reminderPrimerShownAtMs ?? now,
    };

    await saveEngagementState(nextState);
    return nextState;
}

export function shouldShowReminderPrimer(state: EngagementState) {
    return (
        state.saveSuccessCount >= 2 &&
        state.reminderPrimerShownAtMs === null &&
        state.reminderPrimerAcceptedAtMs === null &&
        state.reminderPrimerDismissedAtMs === null
    );
}

export function shouldPromptForReview(state: EngagementState, now: number = Date.now()) {
    if (state.installAtMs === null || now - state.installAtMs < THREE_DAYS_MS) {
        return false;
    }

    if (state.saveSuccessCount < 3) {
        return false;
    }

    const recentLaunches = state.recentOpenAtMs.filter((timestamp) => now - timestamp <= SEVEN_DAYS_MS);
    if (recentLaunches.length < 2) {
        return false;
    }

    if (state.reviewNextEligibleAtMs !== null && now < state.reviewNextEligibleAtMs) {
        return false;
    }

    if (state.lastSaveFailedAtMs !== null && now - state.lastSaveFailedAtMs < RECENT_FAILURE_COOLDOWN_MS) {
        return false;
    }

    if (state.lastAdShownAtMs !== null && now - state.lastAdShownAtMs < RECENT_AD_COOLDOWN_MS) {
        return false;
    }

    if (state.lastCrashDetectedAtMs !== null && now - state.lastCrashDetectedAtMs < RECENT_CRASH_COOLDOWN_MS) {
        return false;
    }

    return true;
}

export async function registerReviewPromptShown(now: number = Date.now()) {
    const state = await loadEngagementState();
    const cooldownDays =
        Math.floor(Math.random() * (MAX_REVIEW_COOLDOWN_DAYS - MIN_REVIEW_COOLDOWN_DAYS + 1))
        + MIN_REVIEW_COOLDOWN_DAYS;
    const nextState: EngagementState = {
        ...state,
        reviewLastPromptedAtMs: now,
        reviewNextEligibleAtMs: now + cooldownDays * 24 * 60 * 60 * 1000,
    };

    await saveEngagementState(nextState);
    return nextState;
}

export function getPostSavePromptDelayMs() {
    return 1000 + Math.floor(Math.random() * 2001);
}
