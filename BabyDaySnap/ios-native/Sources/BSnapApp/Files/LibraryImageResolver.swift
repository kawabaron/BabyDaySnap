import Foundation

struct LibraryImageResolver {
    static func resolvedRenderedURL(for item: LibraryItem) -> URL? {
        resolveLibraryURL(from: item.renderedFileURI)
    }

    static func resolvedOriginalURL(for item: LibraryItem) -> URL? {
        resolveLibraryURL(from: item.originalFileURI)
    }

    private static func resolveLibraryURL(from storedURI: String) -> URL? {
        guard !storedURI.isEmpty else { return nil }

        let lastPathComponent: String
        if let url = URL(string: storedURI), url.isFileURL {
            lastPathComponent = url.lastPathComponent
        } else {
            lastPathComponent = URL(fileURLWithPath: storedURI).lastPathComponent
        }

        guard !lastPathComponent.isEmpty else { return nil }

        let currentURL = AppContainer.documentsDirectory
            .appendingPathComponent("library", isDirectory: true)
            .appendingPathComponent(lastPathComponent)

        if FileManager.default.fileExists(atPath: currentURL.path) {
            return currentURL
        }

        if let storedURL = URL(string: storedURI), storedURL.isFileURL,
           FileManager.default.fileExists(atPath: storedURL.path) {
            return storedURL
        }

        return currentURL
    }
}
