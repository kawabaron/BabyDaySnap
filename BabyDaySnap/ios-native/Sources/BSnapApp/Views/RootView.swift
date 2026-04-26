import SwiftUI

struct RootView: View {
    @Environment(AppStore.self) private var appStore

    var body: some View {
        Group {
            switch appStore.loadState {
            case .idle, .loading:
                ProgressView()
                    .tint(ThemePalette.neutral.accent)
            case .ready:
                if appStore.needsOnboarding {
                    OnboardingView()
                } else {
                    MainTabView()
                }
            case .failed(let message):
                ContentUnavailableView("Could not load data", systemImage: "exclamationmark.triangle", description: Text(message))
            }
        }
    }
}
