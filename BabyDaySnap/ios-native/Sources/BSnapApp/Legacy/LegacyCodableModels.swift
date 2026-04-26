import Foundation

struct LegacyUserSettings: Decodable {
    var hasOnboarded: Bool?
    var birthDateISO: String?
    var babyName: String?
    var preferredLocale: String?
    var defaultTemplateId: String?
    var defaultTextPosition: String?
    var defaultFontId: String?
    var defaultIsBold: Bool?
    var defaultFilterId: String?
    var defaultCompactEmptyCommentSpace: Bool?
    var defaultShowDate: Bool?
    var defaultShowName: Bool?
    var defaultShowAge: Bool?
    var defaultAgeFormat: String?
    var defaultDisplayStyle: String?
    var lastTemplateId: String?
    var lastFontId: String?
    var lastDateColorHex: String?
    var policyUrls: LegacyPolicyURLs?
    var adFreeUnlocked: Bool?
    var unlockedSeasonPackIds: [String]?
    var saveSuccessCountTotal: Int?
    var interstitialLastShownDate: String?
    var interstitialShownCountToday: Int?
    var interstitialDailyBucketDate: String?

    var native: UserSettings {
        var defaults = UserSettings.defaults
        defaults.hasOnboarded = hasOnboarded ?? defaults.hasOnboarded
        defaults.birthDateISO = birthDateISO
        defaults.babyName = babyName ?? defaults.babyName
        defaults.preferredLocale = preferredLocale
        defaults.defaultTemplateID = defaultTemplateId ?? defaults.defaultTemplateID
        defaults.defaultTextPosition = defaultTextPosition ?? defaults.defaultTextPosition
        defaults.defaultFontID = defaultFontId ?? defaults.defaultFontID
        defaults.defaultIsBold = defaultIsBold ?? defaults.defaultIsBold
        defaults.defaultFilterID = defaultFilterId ?? defaults.defaultFilterID
        defaults.defaultCompactEmptyCommentSpace = defaultCompactEmptyCommentSpace ?? defaults.defaultCompactEmptyCommentSpace
        defaults.defaultShowDate = defaultShowDate ?? defaults.defaultShowDate
        defaults.defaultShowName = defaultShowName ?? defaults.defaultShowName
        defaults.defaultShowAge = defaultShowAge ?? defaults.defaultShowAge
        defaults.defaultAgeFormat = defaultAgeFormat ?? defaults.defaultAgeFormat
        defaults.defaultDisplayStyle = defaultDisplayStyle ?? defaults.defaultDisplayStyle
        defaults.lastTemplateID = lastTemplateId ?? defaults.lastTemplateID
        defaults.lastFontID = lastFontId ?? defaults.lastFontID
        defaults.lastDateColorHex = lastDateColorHex ?? defaults.lastDateColorHex
        defaults.policyTermsURL = policyUrls?.termsUrl ?? defaults.policyTermsURL
        defaults.policyPrivacyURL = policyUrls?.privacyUrl ?? defaults.policyPrivacyURL
        defaults.policyContactURL = policyUrls?.contactUrl ?? defaults.policyContactURL
        defaults.policyCommerceURL = policyUrls?.commerceUrl ?? defaults.policyCommerceURL
        defaults.adFreeUnlocked = adFreeUnlocked ?? defaults.adFreeUnlocked
        defaults.unlockedSeasonPackIDs = unlockedSeasonPackIds ?? defaults.unlockedSeasonPackIDs
        defaults.saveSuccessCountTotal = saveSuccessCountTotal ?? defaults.saveSuccessCountTotal
        defaults.interstitialLastShownDate = interstitialLastShownDate
        defaults.interstitialShownCountToday = interstitialShownCountToday ?? defaults.interstitialShownCountToday
        defaults.interstitialDailyBucketDate = interstitialDailyBucketDate
        return defaults
    }
}

struct LegacyPolicyURLs: Decodable {
    var termsUrl: String?
    var privacyUrl: String?
    var contactUrl: String?
    var commerceUrl: String?
}

struct LegacyBabyProfile: Decodable {
    var id: String
    var name: String
    var birthDateISO: String
    var themeColorHex: String?
    var createdAtMs: Int64?
    var order: Int?

    var native: BabyProfile {
        BabyProfile(
            id: id,
            name: name,
            birthDateISO: birthDateISO,
            themeColorHex: themeColorHex ?? ThemePalette.neutral.hex,
            createdAtMs: createdAtMs ?? 0,
            order: order ?? 0
        )
    }
}

struct LegacyLibraryItem: Decodable {
    var id: String
    var babyIds: [String]?
    var source: String?
    var originalFileUri: String?
    var renderedFileUri: String?
    var decorationSeed: String?
    var width: Int?
    var height: Int?
    var originalWidth: Int?
    var originalHeight: Int?
    var shotDateISO: String?
    var ageDays: Int?
    var templateId: String?
    var dateColorHex: String?
    var commentText: String?
    var compactEmptyCommentSpace: Bool?
    var fontId: String?
    var isBold: Bool?
    var filterId: String?
    var showDate: Bool?
    var showName: Bool?
    var showAge: Bool?
    var ageFormat: String?
    var displayStyle: String?
    var textPosition: String?
    var createdAtMs: Int64?

    var native: LibraryItem {
        LibraryItem(
            id: id,
            babyIDs: babyIds ?? [],
            source: source ?? "import",
            originalFileURI: originalFileUri ?? "",
            renderedFileURI: renderedFileUri ?? "",
            decorationSeed: decorationSeed,
            width: width ?? 0,
            height: height ?? 0,
            originalWidth: originalWidth ?? 0,
            originalHeight: originalHeight ?? 0,
            shotDateISO: shotDateISO ?? "",
            ageDays: ageDays ?? 0,
            templateID: templateId ?? "tpl_noframe_full",
            dateColorHex: dateColorHex ?? "#FFFFFF",
            commentText: commentText ?? "",
            compactEmptyCommentSpace: compactEmptyCommentSpace ?? false,
            fontID: fontId ?? "font_standard",
            isBold: isBold ?? false,
            filterID: filterId ?? "filter_none",
            showDate: showDate ?? true,
            showName: showName ?? true,
            showAge: showAge ?? true,
            ageFormat: ageFormat ?? "days",
            displayStyle: displayStyle ?? "current",
            textPosition: textPosition ?? "bottom_right",
            createdAtMs: createdAtMs ?? 0
        )
    }
}
