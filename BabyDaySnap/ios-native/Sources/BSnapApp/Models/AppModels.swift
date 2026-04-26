import Foundation

typealias TemplateID = String
typealias FontID = String
typealias FilterID = String
typealias SeasonPackID = String
typealias DisplayStyle = String
typealias AgeFormat = String
typealias TextPosition = String

struct AppSnapshot: Equatable {
    var settings: UserSettings
    var babies: [BabyProfile]
    var library: [LibraryItem]
}

struct UserSettings: Equatable, Codable {
    var hasOnboarded: Bool
    var birthDateISO: String?
    var babyName: String
    var preferredLocale: String?
    var defaultTemplateID: TemplateID
    var defaultTextPosition: TextPosition
    var defaultFontID: FontID
    var defaultIsBold: Bool
    var defaultFilterID: FilterID
    var defaultCompactEmptyCommentSpace: Bool
    var defaultShowDate: Bool
    var defaultShowName: Bool
    var defaultShowAge: Bool
    var defaultAgeFormat: AgeFormat
    var defaultDisplayStyle: DisplayStyle
    var lastTemplateID: TemplateID
    var lastFontID: FontID
    var lastDateColorHex: String
    var policyTermsURL: String
    var policyPrivacyURL: String
    var policyContactURL: String
    var policyCommerceURL: String
    var adFreeUnlocked: Bool
    var unlockedSeasonPackIDs: [SeasonPackID]
    var saveSuccessCountTotal: Int
    var interstitialLastShownDate: String?
    var interstitialShownCountToday: Int
    var interstitialDailyBucketDate: String?

    static let defaults = UserSettings(
        hasOnboarded: false,
        birthDateISO: nil,
        babyName: "",
        preferredLocale: nil,
        defaultTemplateID: "tpl_noframe_full",
        defaultTextPosition: "bottom_right",
        defaultFontID: "font_standard",
        defaultIsBold: false,
        defaultFilterID: "filter_none",
        defaultCompactEmptyCommentSpace: false,
        defaultShowDate: true,
        defaultShowName: true,
        defaultShowAge: true,
        defaultAgeFormat: "days",
        defaultDisplayStyle: "current",
        lastTemplateID: "tpl_noframe_full",
        lastFontID: "font_standard",
        lastDateColorHex: "#FFFFFF",
        policyTermsURL: "https://kawabaron.github.io/BabyDaySnap/terms.html",
        policyPrivacyURL: "https://kawabaron.github.io/BabyDaySnap/privacy.html",
        policyContactURL: "https://kawabaron.github.io/BabyDaySnap/contact.html",
        policyCommerceURL: "https://kawabaron.github.io/BabyDaySnap/commerce.html",
        adFreeUnlocked: false,
        unlockedSeasonPackIDs: [],
        saveSuccessCountTotal: 0,
        interstitialLastShownDate: nil,
        interstitialShownCountToday: 0,
        interstitialDailyBucketDate: nil
    )
}

struct BabyProfile: Identifiable, Equatable, Codable {
    var id: String
    var name: String
    var birthDateISO: String
    var themeColorHex: String
    var createdAtMs: Int64
    var order: Int
}

struct LibraryItem: Identifiable, Equatable, Codable {
    var id: String
    var babyIDs: [String]
    var source: String
    var originalFileURI: String
    var renderedFileURI: String
    var decorationSeed: String?
    var width: Int
    var height: Int
    var originalWidth: Int
    var originalHeight: Int
    var shotDateISO: String
    var ageDays: Int
    var templateID: TemplateID
    var dateColorHex: String
    var commentText: String
    var compactEmptyCommentSpace: Bool
    var fontID: FontID
    var isBold: Bool
    var filterID: FilterID
    var showDate: Bool
    var showName: Bool
    var showAge: Bool
    var ageFormat: AgeFormat
    var displayStyle: DisplayStyle
    var textPosition: TextPosition
    var createdAtMs: Int64
}
