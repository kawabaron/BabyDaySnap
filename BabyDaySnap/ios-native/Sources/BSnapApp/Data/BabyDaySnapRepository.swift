import Foundation

struct BabyDaySnapRepository {
    private let database = LegacySQLiteStore()
    private let asyncStorage = LegacyAsyncStorageReader()

    func loadSnapshot() async throws -> AppSnapshot {
        if let sqliteSnapshot = try database.loadSnapshot(), sqliteSnapshot.hasUserData {
            return sqliteSnapshot
        }

        if let asyncSnapshot = try asyncStorage.loadLegacySnapshot() {
            return asyncSnapshot
        }

        return AppSnapshot(settings: .defaults, babies: [], library: [])
    }
}

private extension AppSnapshot {
    var hasUserData: Bool {
        settings.hasOnboarded || !babies.isEmpty || !library.isEmpty
    }
}
