import SwiftUI

@main
struct BSnapApp: App {
    @State private var appStore = AppStore(repository: BabyDaySnapRepository())

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appStore)
                .task {
                    await appStore.bootstrap()
                }
        }
    }
}
