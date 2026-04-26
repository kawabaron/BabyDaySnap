import Foundation

enum AppContainer {
    static var documentsDirectory: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }

    static var applicationSupportDirectory: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return base.appendingPathComponent(bundleIdentifier, isDirectory: true)
    }

    static var bundleIdentifier: String {
        Bundle.main.bundleIdentifier ?? "com.kawabaron.bsnap.app"
    }
}
