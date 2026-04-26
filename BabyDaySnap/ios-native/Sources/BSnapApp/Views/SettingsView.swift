import SwiftUI

struct SettingsView: View {
    @Environment(AppStore.self) private var appStore

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                AppHeaderView(title: "Settings")

                List {
                    Section("Family") {
                        ForEach(appStore.babies) { baby in
                            let theme = ThemePalette.resolve(baby.themeColorHex)
                            HStack(spacing: 12) {
                                Circle()
                                    .fill(theme.accent)
                                    .frame(width: 14, height: 14)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(baby.name)
                                        .font(.system(size: 16, weight: .semibold))
                                    Text(baby.birthDateISO)
                                        .font(.system(size: 13))
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }

                    Section("Defaults") {
                        LabeledContent("Template", value: appStore.settings.defaultTemplateID)
                        LabeledContent("Font", value: appStore.settings.defaultFontID)
                        LabeledContent("Filter", value: appStore.settings.defaultFilterID)
                    }

                    Section("Purchases") {
                        LabeledContent("Ad free", value: appStore.settings.adFreeUnlocked ? "Unlocked" : "Locked")
                    }
                }
                .listStyle(.insetGrouped)
            }
        }
    }
}
