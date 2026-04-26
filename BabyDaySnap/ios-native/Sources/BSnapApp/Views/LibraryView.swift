import SwiftUI

struct LibraryView: View {
    @Environment(AppStore.self) private var appStore

    var body: some View {
        let theme = ThemePalette.resolve(appStore.activeBaby?.themeColorHex)
        let filteredItems = appStore.activeBabyID.map { babyID in
            appStore.library.filter { $0.babyIDs.contains(babyID) }
        } ?? appStore.library

        NavigationStack {
            VStack(spacing: 0) {
                AppHeaderView(
                    title: "Library",
                    subtitle: "\(filteredItems.count) photos"
                ) {
                    EmptyView()
                } right: {
                    BabyBadgeView()
                }

                if filteredItems.isEmpty {
                    ContentUnavailableView("No photos yet", systemImage: "photo.on.rectangle", description: Text("Created photos will appear here."))
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(theme.background)
                } else {
                    ScrollView {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 112), spacing: 3)], spacing: 3) {
                            ForEach(filteredItems) { item in
                                LibraryTileView(item: item)
                                    .aspectRatio(1, contentMode: .fit)
                            }
                        }
                        .padding(8)
                    }
                    .background(theme.background)
                }
            }
        }
    }
}

struct LibraryTileView: View {
    var item: LibraryItem

    var body: some View {
        Group {
            if let url = LibraryImageResolver.resolvedRenderedURL(for: item) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .scaledToFill()
                } placeholder: {
                    Color(hex: "#EDE8EA")
                }
            } else {
                Color(hex: "#EDE8EA")
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 6))
    }
}
