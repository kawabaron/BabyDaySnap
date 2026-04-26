import CryptoKit
import Foundation

struct LegacyAsyncStorageReader {
    private let keys = LegacyAsyncStorageKeys.self

    func loadLegacySnapshot() throws -> AppSnapshot? {
        let storage = try loadStorageValues()
        let hasPrimaryData = storage[keys.settings] != nil || storage[keys.babies] != nil || storage[keys.library] != nil

        guard hasPrimaryData else {
            return nil
        }

        let settings = decodeLegacySettings(storage[keys.settings]) ?? .defaults
        let babies = decodeArray(storage[keys.babies], as: [LegacyBabyProfile].self).map { $0.native }
        let library = decodeArray(storage[keys.library], as: [LegacyLibraryItem].self).map { $0.native }

        return AppSnapshot(settings: settings, babies: babies, library: library)
    }

    func hasAnyKnownLegacyValue() throws -> Bool {
        let storage = try loadStorageValues()
        return LegacyAsyncStorageKeys.all.contains { storage[$0] != nil }
    }

    private func loadStorageValues() throws -> [String: String] {
        for directory in candidateDirectories {
            let manifestURL = directory.appendingPathComponent("manifest.json")
            guard FileManager.default.fileExists(atPath: manifestURL.path) else {
                continue
            }

            let data = try Data(contentsOf: manifestURL)
            let manifest = (try JSONSerialization.jsonObject(with: data)) as? [String: Any] ?? [:]
            var result: [String: String] = [:]

            for key in LegacyAsyncStorageKeys.all {
                guard let value = manifest[key] else { continue }

                if let stringValue = value as? String {
                    result[key] = stringValue
                } else if value is NSNull {
                    let fileURL = directory.appendingPathComponent(md5Hex(key))
                    if let raw = try? String(contentsOf: fileURL, encoding: .utf8) {
                        result[key] = raw
                    }
                }
            }

            if !result.isEmpty {
                return result
            }
        }

        return [:]
    }

    private var candidateDirectories: [URL] {
        [
            AppContainer.applicationSupportDirectory.appendingPathComponent("RCTAsyncLocalStorage_V1", isDirectory: true),
            AppContainer.applicationSupportDirectory.appendingPathComponent("RNCAsyncLocalStorage_V1", isDirectory: true),
            AppContainer.documentsDirectory.appendingPathComponent("RCTAsyncLocalStorage_V1", isDirectory: true),
            AppContainer.documentsDirectory.appendingPathComponent("RCTAsyncLocalStorage", isDirectory: true)
        ]
    }
}

enum LegacyAsyncStorageKeys {
    static let settings = "@babydaysnap/settings"
    static let library = "@babydaysnap/library"
    static let babies = "@babydaysnap/babies"
    static let dailyReminder = "@babydaysnap/daily_reminder"
    static let engagement = "@babydaysnap/engagement"
    static let createBannerHiddenDate = "@babydaysnap/create_banner_hidden_date"

    static let all = [
        settings,
        library,
        babies,
        dailyReminder,
        engagement,
        createBannerHiddenDate
    ]
}

private func md5Hex(_ value: String) -> String {
    let digest = Insecure.MD5.hash(data: Data(value.utf8))
    return digest.map { String(format: "%02x", $0) }.joined()
}

private func decodeArray<T: Decodable>(_ raw: String?, as type: [T].Type) -> [T] {
    guard let raw, let data = raw.data(using: .utf8) else { return [] }
    return (try? JSONDecoder().decode(type, from: data)) ?? []
}

private func decodeLegacySettings(_ raw: String?) -> UserSettings? {
    guard let raw, let data = raw.data(using: .utf8),
          let legacy = try? JSONDecoder().decode(LegacyUserSettings.self, from: data) else {
        return nil
    }
    return legacy.native
}
