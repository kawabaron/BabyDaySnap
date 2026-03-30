import AsyncStorage from "@react-native-async-storage/async-storage";
import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import type { AppLibraryItem, BabyProfile, UserSettings } from "@/types";
import {
    ASYNC_STORAGE_KEYS,
    DEFAULT_SETTINGS,
    normalizeLibraryItem,
    normalizeSettings,
} from "@/lib/persistence";

const DATABASE_NAME = "babydaysnap.db";
const SCHEMA_VERSION = 6;
const META_LEGACY_MIGRATED_AT = "legacy_asyncstorage_migrated_at";
const META_STORAGE_BACKEND = "storage_backend";

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
    has_onboarded INTEGER NOT NULL DEFAULT 0,
    birth_date_iso TEXT,
    baby_name TEXT NOT NULL DEFAULT '',
    default_template_id TEXT NOT NULL,
    default_text_position TEXT NOT NULL DEFAULT 'bottom_right',
    default_font_id TEXT NOT NULL,
    default_is_bold INTEGER NOT NULL DEFAULT 0,
    default_filter_id TEXT NOT NULL,
    default_compact_empty_comment_space INTEGER NOT NULL DEFAULT 0,
    default_show_date INTEGER NOT NULL DEFAULT 1,
    default_show_name INTEGER NOT NULL DEFAULT 1,
    default_show_age INTEGER NOT NULL DEFAULT 1,
    default_age_format TEXT NOT NULL DEFAULT 'days',
    default_display_style TEXT NOT NULL DEFAULT 'current',
    last_template_id TEXT NOT NULL,
    last_font_id TEXT NOT NULL,
    last_date_color_hex TEXT NOT NULL DEFAULT '#FFFFFF',
    policy_terms_url TEXT NOT NULL,
    policy_privacy_url TEXT NOT NULL,
    policy_contact_url TEXT NOT NULL,
    ad_free_unlocked INTEGER NOT NULL DEFAULT 0,
    unlocked_season_pack_ids_json TEXT NOT NULL DEFAULT '[]',
    tool_order_json TEXT NOT NULL DEFAULT '{}',
    save_success_count_total INTEGER NOT NULL DEFAULT 0,
    interstitial_last_shown_date TEXT,
    interstitial_shown_count_today INTEGER NOT NULL DEFAULT 0,
    interstitial_daily_bucket_date TEXT
);

CREATE TABLE IF NOT EXISTS babies (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    birth_date_iso TEXT NOT NULL,
    theme_color_hex TEXT NOT NULL,
    created_at_ms INTEGER NOT NULL,
    order_num INTEGER NOT NULL,
    position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS library_items (
    id TEXT PRIMARY KEY NOT NULL,
    source TEXT NOT NULL,
    original_file_uri TEXT NOT NULL,
    rendered_file_uri TEXT NOT NULL,
    decoration_seed TEXT,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    original_width INTEGER NOT NULL,
    original_height INTEGER NOT NULL,
    shot_date_iso TEXT NOT NULL,
    age_days INTEGER NOT NULL,
    template_id TEXT NOT NULL,
    date_color_hex TEXT NOT NULL,
    comment_text TEXT NOT NULL,
    compact_empty_comment_space INTEGER NOT NULL DEFAULT 0,
    font_id TEXT NOT NULL,
    is_bold INTEGER NOT NULL DEFAULT 0,
    filter_id TEXT NOT NULL,
    show_date INTEGER NOT NULL,
    show_name INTEGER NOT NULL,
    show_age INTEGER NOT NULL,
    age_format TEXT NOT NULL,
    display_style TEXT NOT NULL,
    text_position TEXT NOT NULL DEFAULT 'bottom_right',
    is_favorite INTEGER NOT NULL DEFAULT 0,
    created_at_ms INTEGER NOT NULL,
    position INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS library_item_babies (
    library_item_id TEXT NOT NULL,
    baby_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (library_item_id, baby_id),
    FOREIGN KEY (library_item_id) REFERENCES library_items(id) ON DELETE CASCADE,
    FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY NOT NULL,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at_ms INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS collection_items (
    collection_id TEXT NOT NULL,
    library_item_id TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (collection_id, library_item_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    FOREIGN KEY (library_item_id) REFERENCES library_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY NOT NULL,
    baby_id TEXT NOT NULL,
    title TEXT NOT NULL,
    milestone_date_iso TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at_ms INTEGER NOT NULL,
    FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS growth_records (
    id TEXT PRIMARY KEY NOT NULL,
    baby_id TEXT NOT NULL,
    measured_at_iso TEXT NOT NULL,
    height_cm REAL,
    weight_kg REAL,
    note TEXT NOT NULL DEFAULT '',
    created_at_ms INTEGER NOT NULL,
    FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_babies_position ON babies(position);
CREATE INDEX IF NOT EXISTS idx_library_items_position ON library_items(position);
CREATE INDEX IF NOT EXISTS idx_library_items_shot_date ON library_items(shot_date_iso);
CREATE INDEX IF NOT EXISTS idx_library_items_is_favorite ON library_items(is_favorite);
CREATE INDEX IF NOT EXISTS idx_library_item_babies_baby_id ON library_item_babies(baby_id);
`;

type SqlExecutor = Pick<SQLiteDatabase, "execAsync" | "getAllAsync" | "getFirstAsync" | "runAsync">;

type SettingsRow = {
    has_onboarded: number;
    birth_date_iso: string | null;
    baby_name: string;
    default_template_id: UserSettings["defaultTemplateId"];
    default_text_position: UserSettings["defaultTextPosition"];
    default_font_id: UserSettings["defaultFontId"];
    default_is_bold: number;
    default_filter_id: UserSettings["defaultFilterId"];
    default_compact_empty_comment_space: number;
    default_show_date: number;
    default_show_name: number;
    default_show_age: number;
    default_age_format: UserSettings["defaultAgeFormat"];
    default_display_style: UserSettings["defaultDisplayStyle"];
    last_template_id: UserSettings["lastTemplateId"];
    last_font_id: UserSettings["lastFontId"];
    last_date_color_hex: string;
    policy_terms_url: string;
    policy_privacy_url: string;
    policy_contact_url: string;
    ad_free_unlocked: number;
    unlocked_season_pack_ids_json: string;
    save_success_count_total: number;
    interstitial_last_shown_date: string | null;
    interstitial_shown_count_today: number;
    interstitial_daily_bucket_date: string | null;
};

type BabyRow = {
    id: string;
    name: string;
    birth_date_iso: string;
    theme_color_hex: string;
    created_at_ms: number;
    order_num: number;
};

type LibraryItemRow = {
    id: string;
    source: AppLibraryItem["source"];
    original_file_uri: string;
    rendered_file_uri: string;
    decoration_seed: string | null;
    width: number;
    height: number;
    original_width: number;
    original_height: number;
    shot_date_iso: string;
    age_days: number;
    template_id: AppLibraryItem["templateId"];
    date_color_hex: string;
    comment_text: string;
    compact_empty_comment_space: number;
    font_id: AppLibraryItem["fontId"];
    is_bold: number;
    filter_id: AppLibraryItem["filterId"];
    show_date: number;
    show_name: number;
    show_age: number;
    age_format: AppLibraryItem["ageFormat"];
    display_style: AppLibraryItem["displayStyle"];
    text_position: AppLibraryItem["textPosition"];
    created_at_ms: number;
};

type LibraryItemBabyRow = {
    library_item_id: string;
    baby_id: string;
};

let databasePromise: Promise<SQLiteDatabase> | null = null;
let initializationPromise: Promise<SQLiteDatabase> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function boolToInt(value: boolean): number {
    return value ? 1 : 0;
}

function intToBool(value: number): boolean {
    return value === 1;
}

function parseJson<T>(raw: string | null, fallback: T): T {
    if (!raw) {
        return fallback;
    }
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

function buildPlaceholders(count: number): string {
    return Array.from({ length: count }, () => "?").join(", ");
}

function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
    const next = writeQueue.then(task, task);
    writeQueue = next.then(() => undefined, () => undefined);
    return next;
}

async function getDatabaseInstance(): Promise<SQLiteDatabase> {
    if (!databasePromise) {
        databasePromise = openDatabaseAsync(DATABASE_NAME);
    }
    return databasePromise;
}

async function setMetaValue(executor: SqlExecutor, key: string, value: string): Promise<void> {
    await executor.runAsync(
        "INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        key,
        value
    );
}

async function getMetaValue(executor: SqlExecutor, key: string): Promise<string | null> {
    const row = await executor.getFirstAsync<{ value: string }>(
        "SELECT value FROM app_meta WHERE key = ?",
        key
    );
    return row?.value ?? null;
}

async function writeSettingsRow(executor: SqlExecutor, settings: UserSettings): Promise<void> {
    await executor.runAsync(
        `INSERT INTO app_settings (
            id,
            has_onboarded,
            birth_date_iso,
            baby_name,
            default_template_id,
            default_text_position,
            default_font_id,
            default_is_bold,
            default_filter_id,
            default_compact_empty_comment_space,
            default_show_date,
            default_show_name,
            default_show_age,
            default_age_format,
            default_display_style,
            last_template_id,
            last_font_id,
            last_date_color_hex,
            policy_terms_url,
            policy_privacy_url,
            policy_contact_url,
            ad_free_unlocked,
            unlocked_season_pack_ids_json,
            save_success_count_total,
            interstitial_last_shown_date,
            interstitial_shown_count_today,
            interstitial_daily_bucket_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            has_onboarded = excluded.has_onboarded,
            birth_date_iso = excluded.birth_date_iso,
            baby_name = excluded.baby_name,
            default_template_id = excluded.default_template_id,
            default_text_position = excluded.default_text_position,
            default_font_id = excluded.default_font_id,
            default_is_bold = excluded.default_is_bold,
            default_filter_id = excluded.default_filter_id,
            default_compact_empty_comment_space = excluded.default_compact_empty_comment_space,
            default_show_date = excluded.default_show_date,
            default_show_name = excluded.default_show_name,
            default_show_age = excluded.default_show_age,
            default_age_format = excluded.default_age_format,
            default_display_style = excluded.default_display_style,
            last_template_id = excluded.last_template_id,
            last_font_id = excluded.last_font_id,
            last_date_color_hex = excluded.last_date_color_hex,
            policy_terms_url = excluded.policy_terms_url,
            policy_privacy_url = excluded.policy_privacy_url,
            policy_contact_url = excluded.policy_contact_url,
            ad_free_unlocked = excluded.ad_free_unlocked,
            unlocked_season_pack_ids_json = excluded.unlocked_season_pack_ids_json,
            save_success_count_total = excluded.save_success_count_total,
            interstitial_last_shown_date = excluded.interstitial_last_shown_date,
            interstitial_shown_count_today = excluded.interstitial_shown_count_today,
            interstitial_daily_bucket_date = excluded.interstitial_daily_bucket_date`,
        1,
        boolToInt(settings.hasOnboarded),
        settings.birthDateISO,
        settings.babyName,
        settings.defaultTemplateId,
        settings.defaultTextPosition,
        settings.defaultFontId,
        boolToInt(settings.defaultIsBold),
        settings.defaultFilterId,
        boolToInt(settings.defaultCompactEmptyCommentSpace),
        boolToInt(settings.defaultShowDate),
        boolToInt(settings.defaultShowName),
        boolToInt(settings.defaultShowAge),
        settings.defaultAgeFormat,
        settings.defaultDisplayStyle,
        settings.lastTemplateId,
        settings.lastFontId,
        settings.lastDateColorHex,
        settings.policyUrls.termsUrl,
        settings.policyUrls.privacyUrl,
        settings.policyUrls.contactUrl,
        boolToInt(settings.adFreeUnlocked),
        JSON.stringify(settings.unlockedSeasonPackIds),
        settings.saveSuccessCountTotal,
        settings.interstitialLastShownDate,
        settings.interstitialShownCountToday,
        settings.interstitialDailyBucketDate
    );
}

async function replaceBabiesRows(executor: SqlExecutor, babies: BabyProfile[]): Promise<void> {
    for (const [index, baby] of babies.entries()) {
        await executor.runAsync(
            `INSERT INTO babies (
                id,
                name,
                birth_date_iso,
                theme_color_hex,
                created_at_ms,
                order_num,
                position
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                birth_date_iso = excluded.birth_date_iso,
                theme_color_hex = excluded.theme_color_hex,
                created_at_ms = excluded.created_at_ms,
                order_num = excluded.order_num,
                position = excluded.position`,
            baby.id,
            baby.name,
            baby.birthDateISO,
            baby.themeColorHex,
            baby.createdAtMs,
            baby.order,
            index
        );
    }

    if (babies.length === 0) {
        await executor.runAsync("DELETE FROM babies");
        return;
    }

    await executor.runAsync(
        `DELETE FROM babies WHERE id NOT IN (${buildPlaceholders(babies.length)})`,
        ...babies.map((baby) => baby.id)
    );
}

async function replaceLibraryRows(executor: SqlExecutor, library: AppLibraryItem[]): Promise<void> {
    for (const [index, rawItem] of library.entries()) {
        const item = normalizeLibraryItem(rawItem);
        await executor.runAsync(
            `INSERT INTO library_items (
                id,
                source,
                original_file_uri,
                rendered_file_uri,
                decoration_seed,
                width,
                height,
                original_width,
                original_height,
                shot_date_iso,
                age_days,
                template_id,
                date_color_hex,
                comment_text,
                compact_empty_comment_space,
                font_id,
                is_bold,
                filter_id,
                show_date,
                show_name,
                show_age,
                age_format,
                display_style,
                text_position,
                created_at_ms,
                position
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                source = excluded.source,
                original_file_uri = excluded.original_file_uri,
                rendered_file_uri = excluded.rendered_file_uri,
                decoration_seed = excluded.decoration_seed,
                width = excluded.width,
                height = excluded.height,
                original_width = excluded.original_width,
                original_height = excluded.original_height,
                shot_date_iso = excluded.shot_date_iso,
                age_days = excluded.age_days,
                template_id = excluded.template_id,
                date_color_hex = excluded.date_color_hex,
                comment_text = excluded.comment_text,
                compact_empty_comment_space = excluded.compact_empty_comment_space,
                font_id = excluded.font_id,
                is_bold = excluded.is_bold,
                filter_id = excluded.filter_id,
                show_date = excluded.show_date,
                show_name = excluded.show_name,
                show_age = excluded.show_age,
                age_format = excluded.age_format,
                display_style = excluded.display_style,
                text_position = excluded.text_position,
                created_at_ms = excluded.created_at_ms,
                position = excluded.position`,
            item.id,
            item.source,
            item.originalFileUri,
            item.renderedFileUri,
            item.decorationSeed ?? null,
            item.width,
            item.height,
            item.originalWidth,
            item.originalHeight,
            item.shotDateISO,
            item.ageDays,
            item.templateId,
            item.dateColorHex,
            item.commentText,
            boolToInt(item.compactEmptyCommentSpace),
            item.fontId,
            boolToInt(item.isBold),
            item.filterId,
            boolToInt(item.showDate),
            boolToInt(item.showName),
            boolToInt(item.showAge),
            item.ageFormat,
            item.displayStyle,
            item.textPosition,
            item.createdAtMs,
            index
        );

        await executor.runAsync("DELETE FROM library_item_babies WHERE library_item_id = ?", item.id);
        for (const [babyIndex, babyId] of item.babyIds.entries()) {
            await executor.runAsync(
                "INSERT INTO library_item_babies (library_item_id, baby_id, sort_order) VALUES (?, ?, ?)",
                item.id,
                babyId,
                babyIndex
            );
        }
    }

    if (library.length === 0) {
        await executor.runAsync("DELETE FROM library_item_babies");
        await executor.runAsync("DELETE FROM library_items");
        return;
    }

    const itemIds = library.map((item) => item.id);
    await executor.runAsync(
        `DELETE FROM library_items WHERE id NOT IN (${buildPlaceholders(itemIds.length)})`,
        ...itemIds
    );
}

async function hasExistingStructuredData(db: SQLiteDatabase): Promise<boolean> {
    const [settingsCount, babyCount, libraryCount] = await Promise.all([
        db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM app_settings"),
        db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM babies"),
        db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM library_items"),
    ]);

    return (
        (settingsCount?.count ?? 0) > 0 ||
        (babyCount?.count ?? 0) > 0 ||
        (libraryCount?.count ?? 0) > 0
    );
}

async function migrateLegacyAsyncStorageIfNeeded(db: SQLiteDatabase): Promise<void> {
    const migratedAt = await getMetaValue(db, META_LEGACY_MIGRATED_AT);
    if (migratedAt) {
        return;
    }

    if (await hasExistingStructuredData(db)) {
        await setMetaValue(db, META_LEGACY_MIGRATED_AT, new Date().toISOString());
        await setMetaValue(db, META_STORAGE_BACKEND, "sqlite");
        return;
    }

    const [settingsRaw, libraryRaw, babiesRaw] = await Promise.all([
        AsyncStorage.getItem(ASYNC_STORAGE_KEYS.SETTINGS),
        AsyncStorage.getItem(ASYNC_STORAGE_KEYS.LIBRARY),
        AsyncStorage.getItem(ASYNC_STORAGE_KEYS.BABIES),
    ]);

    const settings = normalizeSettings(parseJson<Partial<UserSettings> | null>(settingsRaw, null));
    const babies = parseJson<BabyProfile[]>(babiesRaw, []);
    const library = parseJson<AppLibraryItem[]>(libraryRaw, []).map(normalizeLibraryItem);

    await db.withTransactionAsync(async () => {
        await writeSettingsRow(db, settings);
        await replaceBabiesRows(db, babies);
        await replaceLibraryRows(db, library);
        await setMetaValue(db, META_LEGACY_MIGRATED_AT, new Date().toISOString());
        await setMetaValue(db, META_STORAGE_BACKEND, "sqlite");
    });
}

async function migrateSchemaIfNeeded(db: SQLiteDatabase): Promise<void> {
    const versionRow = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
    let currentVersion = versionRow?.user_version ?? 0;

    if (currentVersion >= SCHEMA_VERSION) {
        return;
    }

    if (currentVersion === 0) {
        await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
        return;
    }

    await db.withTransactionAsync(async () => {
        if (currentVersion < 2) {
            await db.execAsync(
                "ALTER TABLE app_settings ADD COLUMN tool_order_json TEXT NOT NULL DEFAULT '{}';"
            );
            await db.execAsync(
                "ALTER TABLE library_items ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;"
            );
            await db.execAsync(
                "CREATE INDEX IF NOT EXISTS idx_library_items_is_favorite ON library_items(is_favorite);"
            );
            currentVersion = 2;
        }

        if (currentVersion < 3) {
            await db.execAsync(
                "ALTER TABLE library_items ADD COLUMN is_bold INTEGER NOT NULL DEFAULT 0;"
            );
            currentVersion = 3;
        }

        if (currentVersion < 4) {
            await db.execAsync(
                "ALTER TABLE library_items ADD COLUMN text_position TEXT NOT NULL DEFAULT 'bottom_right';"
            );
            currentVersion = 4;
        }

        if (currentVersion < 5) {
            await db.execAsync(
                "ALTER TABLE library_items ADD COLUMN compact_empty_comment_space INTEGER NOT NULL DEFAULT 0;"
            );
            currentVersion = 5;
        }

        if (currentVersion < 6) {
            await db.execAsync(
                "ALTER TABLE app_settings ADD COLUMN default_text_position TEXT NOT NULL DEFAULT 'bottom_right';"
            );
            await db.execAsync(
                "ALTER TABLE app_settings ADD COLUMN default_is_bold INTEGER NOT NULL DEFAULT 0;"
            );
            await db.execAsync(
                "ALTER TABLE app_settings ADD COLUMN default_compact_empty_comment_space INTEGER NOT NULL DEFAULT 0;"
            );
            currentVersion = 6;
        }

        await db.execAsync(`PRAGMA user_version = ${currentVersion}`);
    });
}

export async function ensureDatabaseReady(): Promise<SQLiteDatabase> {
    if (!initializationPromise) {
        initializationPromise = (async () => {
            const db = await getDatabaseInstance();
            await db.execAsync("PRAGMA foreign_keys = ON;");
            await db.execAsync(SCHEMA_SQL);
            await migrateSchemaIfNeeded(db);

            await migrateLegacyAsyncStorageIfNeeded(db);

            const settingsRow = await db.getFirstAsync<{ id: number }>(
                "SELECT id FROM app_settings WHERE id = 1"
            );
            if (!settingsRow) {
                await writeSettingsRow(db, DEFAULT_SETTINGS);
            }

            return db;
        })();
    }

    return initializationPromise;
}

export async function loadSettingsFromDatabase(): Promise<UserSettings> {
    const db = await ensureDatabaseReady();
    const row = await db.getFirstAsync<SettingsRow>(
        `SELECT
            has_onboarded,
            birth_date_iso,
            baby_name,
            default_template_id,
            default_text_position,
            default_font_id,
            default_is_bold,
            default_filter_id,
            default_compact_empty_comment_space,
            default_show_date,
            default_show_name,
            default_show_age,
            default_age_format,
            default_display_style,
            last_template_id,
            last_font_id,
            last_date_color_hex,
            policy_terms_url,
            policy_privacy_url,
            policy_contact_url,
            ad_free_unlocked,
            unlocked_season_pack_ids_json,
            save_success_count_total,
            interstitial_last_shown_date,
            interstitial_shown_count_today,
            interstitial_daily_bucket_date
        FROM app_settings
        WHERE id = 1`
    );

    if (!row) {
        return DEFAULT_SETTINGS;
    }

    return normalizeSettings({
        hasOnboarded: intToBool(row.has_onboarded),
        birthDateISO: row.birth_date_iso,
        babyName: row.baby_name,
        defaultTemplateId: row.default_template_id,
        defaultTextPosition: row.default_text_position,
        defaultFontId: row.default_font_id,
        defaultIsBold: intToBool(row.default_is_bold),
        defaultFilterId: row.default_filter_id,
        defaultCompactEmptyCommentSpace: intToBool(row.default_compact_empty_comment_space),
        defaultShowDate: intToBool(row.default_show_date),
        defaultShowName: intToBool(row.default_show_name),
        defaultShowAge: intToBool(row.default_show_age),
        defaultAgeFormat: row.default_age_format,
        defaultDisplayStyle: row.default_display_style,
        lastTemplateId: row.last_template_id,
        lastFontId: row.last_font_id,
        lastDateColorHex: row.last_date_color_hex,
        policyUrls: {
            termsUrl: row.policy_terms_url,
            privacyUrl: row.policy_privacy_url,
            contactUrl: row.policy_contact_url,
        },
        adFreeUnlocked: intToBool(row.ad_free_unlocked),
        unlockedSeasonPackIds: parseJson(
            row.unlocked_season_pack_ids_json,
            DEFAULT_SETTINGS.unlockedSeasonPackIds
        ),
        saveSuccessCountTotal: row.save_success_count_total,
        interstitialLastShownDate: row.interstitial_last_shown_date,
        interstitialShownCountToday: row.interstitial_shown_count_today,
        interstitialDailyBucketDate: row.interstitial_daily_bucket_date,
    });
}

export async function saveSettingsToDatabase(settings: UserSettings): Promise<void> {
    await enqueueWrite(async () => {
        const db = await ensureDatabaseReady();
        await db.withTransactionAsync(async () => {
            await writeSettingsRow(db, normalizeSettings(settings));
        });
    });
}

export async function loadBabiesFromDatabase(): Promise<BabyProfile[]> {
    const db = await ensureDatabaseReady();
    const rows = await db.getAllAsync<BabyRow>(
        `SELECT
            id,
            name,
            birth_date_iso,
            theme_color_hex,
            created_at_ms,
            order_num
        FROM babies
        ORDER BY position ASC`
    );

    return rows.map((row) => ({
        id: row.id,
        name: row.name,
        birthDateISO: row.birth_date_iso,
        themeColorHex: row.theme_color_hex,
        createdAtMs: row.created_at_ms,
        order: row.order_num,
    }));
}

export async function saveBabiesToDatabase(babies: BabyProfile[]): Promise<void> {
    await enqueueWrite(async () => {
        const db = await ensureDatabaseReady();
        await db.withTransactionAsync(async () => {
            await replaceBabiesRows(db, babies);
        });
    });
}

export async function loadLibraryFromDatabase(): Promise<AppLibraryItem[]> {
    const db = await ensureDatabaseReady();
    const [itemRows, babyRows] = await Promise.all([
        db.getAllAsync<LibraryItemRow>(
            `SELECT
                id,
                source,
                original_file_uri,
                rendered_file_uri,
                decoration_seed,
                width,
                height,
                original_width,
                original_height,
                shot_date_iso,
                age_days,
                template_id,
                date_color_hex,
                comment_text,
                compact_empty_comment_space,
                font_id,
                is_bold,
                filter_id,
                show_date,
                show_name,
                show_age,
                age_format,
                display_style,
                text_position,
                created_at_ms
            FROM library_items
            ORDER BY position ASC`
        ),
        db.getAllAsync<LibraryItemBabyRow>(
            `SELECT library_item_id, baby_id
            FROM library_item_babies
            ORDER BY library_item_id ASC, sort_order ASC`
        ),
    ]);

    const babyIdsByLibraryItem = new Map<string, string[]>();
    for (const row of babyRows) {
        const existing = babyIdsByLibraryItem.get(row.library_item_id);
        if (existing) {
            existing.push(row.baby_id);
        } else {
            babyIdsByLibraryItem.set(row.library_item_id, [row.baby_id]);
        }
    }

    return itemRows.map((row) =>
        normalizeLibraryItem({
            id: row.id,
            babyIds: babyIdsByLibraryItem.get(row.id) ?? [],
            source: row.source,
            originalFileUri: row.original_file_uri,
            renderedFileUri: row.rendered_file_uri,
            decorationSeed: row.decoration_seed ?? undefined,
            width: row.width,
            height: row.height,
            originalWidth: row.original_width,
            originalHeight: row.original_height,
            shotDateISO: row.shot_date_iso,
            ageDays: row.age_days,
            templateId: row.template_id,
            dateColorHex: row.date_color_hex,
            commentText: row.comment_text,
            compactEmptyCommentSpace: intToBool(row.compact_empty_comment_space),
            fontId: row.font_id,
            isBold: intToBool(row.is_bold),
            filterId: row.filter_id,
            showDate: intToBool(row.show_date),
            showName: intToBool(row.show_name),
            showAge: intToBool(row.show_age),
            ageFormat: row.age_format,
            displayStyle: row.display_style,
            textPosition: row.text_position,
            createdAtMs: row.created_at_ms,
        })
    );
}

export async function saveLibraryToDatabase(library: AppLibraryItem[]): Promise<void> {
    await enqueueWrite(async () => {
        const db = await ensureDatabaseReady();
        await db.withTransactionAsync(async () => {
            await replaceLibraryRows(db, library);
        });
    });
}
