import Foundation
import SQLite3

struct LegacySQLiteStore {
    enum StoreError: Error {
        case openFailed(String)
        case prepareFailed(String)
    }

    private let databaseFileName = "babydaysnap.db"

    func loadSnapshot() throws -> AppSnapshot? {
        guard FileManager.default.fileExists(atPath: databaseURL.path) else {
            return nil
        }

        var db: OpaquePointer?
        guard sqlite3_open(databaseURL.path, &db) == SQLITE_OK, let db else {
            throw StoreError.openFailed(String(cString: sqlite3_errmsg(db)))
        }
        defer { sqlite3_close(db) }

        let settings = try loadSettings(db: db) ?? .defaults
        let babies = try loadBabies(db: db)
        let library = try loadLibrary(db: db)
        return AppSnapshot(settings: settings, babies: babies, library: library)
    }

    var databaseURL: URL {
        AppContainer.documentsDirectory
            .appendingPathComponent("SQLite", isDirectory: true)
            .appendingPathComponent(databaseFileName)
    }

    private func loadSettings(db: OpaquePointer) throws -> UserSettings? {
        let sql = """
        SELECT has_onboarded, birth_date_iso, baby_name, preferred_locale,
               default_template_id, default_text_position, default_font_id,
               default_is_bold, default_filter_id, default_compact_empty_comment_space,
               default_show_date, default_show_name, default_show_age,
               default_age_format, default_display_style, last_template_id,
               last_font_id, last_date_color_hex, policy_terms_url,
               policy_privacy_url, policy_contact_url, policy_commerce_url,
               ad_free_unlocked, unlocked_season_pack_ids_json,
               save_success_count_total, interstitial_last_shown_date,
               interstitial_shown_count_today, interstitial_daily_bucket_date
        FROM app_settings
        WHERE id = 1
        """

        return try firstRow(db: db, sql: sql) { statement in
            UserSettings(
                hasOnboarded: sqliteBool(statement, 0),
                birthDateISO: sqliteString(statement, 1),
                babyName: sqliteString(statement, 2) ?? "",
                preferredLocale: sqliteString(statement, 3),
                defaultTemplateID: sqliteString(statement, 4) ?? UserSettings.defaults.defaultTemplateID,
                defaultTextPosition: sqliteString(statement, 5) ?? UserSettings.defaults.defaultTextPosition,
                defaultFontID: sqliteString(statement, 6) ?? UserSettings.defaults.defaultFontID,
                defaultIsBold: sqliteBool(statement, 7),
                defaultFilterID: sqliteString(statement, 8) ?? UserSettings.defaults.defaultFilterID,
                defaultCompactEmptyCommentSpace: sqliteBool(statement, 9),
                defaultShowDate: sqliteBool(statement, 10),
                defaultShowName: sqliteBool(statement, 11),
                defaultShowAge: sqliteBool(statement, 12),
                defaultAgeFormat: sqliteString(statement, 13) ?? UserSettings.defaults.defaultAgeFormat,
                defaultDisplayStyle: sqliteString(statement, 14) ?? UserSettings.defaults.defaultDisplayStyle,
                lastTemplateID: sqliteString(statement, 15) ?? UserSettings.defaults.lastTemplateID,
                lastFontID: sqliteString(statement, 16) ?? UserSettings.defaults.lastFontID,
                lastDateColorHex: sqliteString(statement, 17) ?? UserSettings.defaults.lastDateColorHex,
                policyTermsURL: sqliteString(statement, 18) ?? UserSettings.defaults.policyTermsURL,
                policyPrivacyURL: sqliteString(statement, 19) ?? UserSettings.defaults.policyPrivacyURL,
                policyContactURL: sqliteString(statement, 20) ?? UserSettings.defaults.policyContactURL,
                policyCommerceURL: sqliteString(statement, 21) ?? UserSettings.defaults.policyCommerceURL,
                adFreeUnlocked: sqliteBool(statement, 22),
                unlockedSeasonPackIDs: decodeStringArray(sqliteString(statement, 23)),
                saveSuccessCountTotal: Int(sqlite3_column_int(statement, 24)),
                interstitialLastShownDate: sqliteString(statement, 25),
                interstitialShownCountToday: Int(sqlite3_column_int(statement, 26)),
                interstitialDailyBucketDate: sqliteString(statement, 27)
            )
        }
    }

    private func loadBabies(db: OpaquePointer) throws -> [BabyProfile] {
        let sql = """
        SELECT id, name, birth_date_iso, theme_color_hex, created_at_ms, order_num
        FROM babies
        ORDER BY position ASC
        """

        return try rows(db: db, sql: sql) { statement in
            BabyProfile(
                id: sqliteString(statement, 0) ?? UUID().uuidString,
                name: sqliteString(statement, 1) ?? "",
                birthDateISO: sqliteString(statement, 2) ?? "",
                themeColorHex: sqliteString(statement, 3) ?? ThemePalette.neutral.hex,
                createdAtMs: sqlite3_column_int64(statement, 4),
                order: Int(sqlite3_column_int(statement, 5))
            )
        }
    }

    private func loadLibrary(db: OpaquePointer) throws -> [LibraryItem] {
        let babyRows = try rows(
            db: db,
            sql: "SELECT library_item_id, baby_id FROM library_item_babies ORDER BY library_item_id ASC, sort_order ASC"
        ) { statement -> (String, String) in
            (sqliteString(statement, 0) ?? "", sqliteString(statement, 1) ?? "")
        }

        var babyIDsByItem: [String: [String]] = [:]
        for (itemID, babyID) in babyRows where !itemID.isEmpty && !babyID.isEmpty {
            babyIDsByItem[itemID, default: []].append(babyID)
        }

        let sql = """
        SELECT id, source, original_file_uri, rendered_file_uri, decoration_seed,
               width, height, original_width, original_height, shot_date_iso,
               age_days, template_id, date_color_hex, comment_text,
               compact_empty_comment_space, font_id, is_bold, filter_id,
               show_date, show_name, show_age, age_format, display_style,
               text_position, created_at_ms
        FROM library_items
        ORDER BY position ASC
        """

        return try rows(db: db, sql: sql) { statement in
            let id = sqliteString(statement, 0) ?? UUID().uuidString
            return LibraryItem(
                id: id,
                babyIDs: babyIDsByItem[id] ?? [],
                source: sqliteString(statement, 1) ?? "import",
                originalFileURI: sqliteString(statement, 2) ?? "",
                renderedFileURI: sqliteString(statement, 3) ?? "",
                decorationSeed: sqliteString(statement, 4),
                width: Int(sqlite3_column_int(statement, 5)),
                height: Int(sqlite3_column_int(statement, 6)),
                originalWidth: Int(sqlite3_column_int(statement, 7)),
                originalHeight: Int(sqlite3_column_int(statement, 8)),
                shotDateISO: sqliteString(statement, 9) ?? "",
                ageDays: Int(sqlite3_column_int(statement, 10)),
                templateID: sqliteString(statement, 11) ?? "tpl_noframe_full",
                dateColorHex: sqliteString(statement, 12) ?? "#FFFFFF",
                commentText: sqliteString(statement, 13) ?? "",
                compactEmptyCommentSpace: sqliteBool(statement, 14),
                fontID: sqliteString(statement, 15) ?? "font_standard",
                isBold: sqliteBool(statement, 16),
                filterID: sqliteString(statement, 17) ?? "filter_none",
                showDate: sqliteBool(statement, 18),
                showName: sqliteBool(statement, 19),
                showAge: sqliteBool(statement, 20),
                ageFormat: sqliteString(statement, 21) ?? "days",
                displayStyle: sqliteString(statement, 22) ?? "current",
                textPosition: sqliteString(statement, 23) ?? "bottom_right",
                createdAtMs: sqlite3_column_int64(statement, 24)
            )
        }
    }

    private func rows<T>(db: OpaquePointer, sql: String, map: (OpaquePointer) -> T) throws -> [T] {
        var statement: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK, let statement else {
            throw StoreError.prepareFailed(String(cString: sqlite3_errmsg(db)))
        }
        defer { sqlite3_finalize(statement) }

        var result: [T] = []
        while sqlite3_step(statement) == SQLITE_ROW {
            result.append(map(statement))
        }
        return result
    }

    private func firstRow<T>(db: OpaquePointer, sql: String, map: (OpaquePointer) -> T) throws -> T? {
        var statement: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &statement, nil) == SQLITE_OK, let statement else {
            throw StoreError.prepareFailed(String(cString: sqlite3_errmsg(db)))
        }
        defer { sqlite3_finalize(statement) }

        guard sqlite3_step(statement) == SQLITE_ROW else {
            return nil
        }
        return map(statement)
    }
}

private func sqliteString(_ statement: OpaquePointer, _ index: Int32) -> String? {
    guard sqlite3_column_type(statement, index) != SQLITE_NULL,
          let text = sqlite3_column_text(statement, index) else {
        return nil
    }
    return String(cString: text)
}

private func sqliteBool(_ statement: OpaquePointer, _ index: Int32) -> Bool {
    sqlite3_column_int(statement, index) == 1
}

private func decodeStringArray(_ raw: String?) -> [String] {
    guard let raw, let data = raw.data(using: .utf8) else { return [] }
    return (try? JSONDecoder().decode([String].self, from: data)) ?? []
}
