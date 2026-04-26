import SwiftUI

struct MainTabView: View {
    @Environment(AppStore.self) private var appStore

    var body: some View {
        let theme = ThemePalette.resolve(appStore.activeBaby?.themeColorHex)

        TabView {
            CameraHomeView()
                .tabItem {
                    Label("Create", systemImage: "plus.circle.fill")
                }

            LibraryView()
                .tabItem {
                    Label("Library", systemImage: "photo.on.rectangle")
                }

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
        }
        .tint(theme.accent)
    }
}
