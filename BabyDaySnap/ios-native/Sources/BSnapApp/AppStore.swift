import Foundation
import Observation

@MainActor
@Observable
final class AppStore {
    enum LoadState: Equatable {
        case idle
        case loading
        case ready
        case failed(String)
    }

    private let repository: BabyDaySnapRepository

    var loadState: LoadState = .idle
    var settings = UserSettings.defaults
    var babies: [BabyProfile] = []
    var library: [LibraryItem] = []
    var activeBabyID: String?

    init(repository: BabyDaySnapRepository) {
        self.repository = repository
    }

    var activeBaby: BabyProfile? {
        guard let activeBabyID else { return babies.first }
        return babies.first { $0.id == activeBabyID } ?? babies.first
    }

    var needsOnboarding: Bool {
        !settings.hasOnboarded || settings.birthDateISO == nil || babies.isEmpty
    }

    func bootstrap() async {
        loadState = .loading

        do {
            let snapshot = try await repository.loadSnapshot()
            settings = snapshot.settings
            babies = snapshot.babies
            library = snapshot.library
            activeBabyID = babies.first?.id
            loadState = .ready
        } catch {
            loadState = .failed(error.localizedDescription)
        }
    }

    func setActiveBaby(_ baby: BabyProfile) {
        activeBabyID = baby.id
    }
}
