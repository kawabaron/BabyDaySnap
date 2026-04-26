import SwiftUI

struct CameraHomeView: View {
    @Environment(AppStore.self) private var appStore

    var body: some View {
        let theme = ThemePalette.resolve(appStore.activeBaby?.themeColorHex)

        NavigationStack {
            VStack(spacing: 0) {
                AppHeaderView(title: "Create") {
                    EmptyView()
                } right: {
                    BabyBadgeView()
                }

                VStack(spacing: 44) {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 64, weight: .semibold))
                        .foregroundStyle(theme.accent)

                    VStack(spacing: 16) {
                        Button {
                        } label: {
                            Label("Take Photo", systemImage: "camera")
                                .font(.system(size: 24, weight: .heavy))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 26)
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(.white)
                        .background(theme.accent, in: RoundedRectangle(cornerRadius: 24))
                        .shadow(color: theme.shadow.opacity(0.28), radius: 10, y: 6)

                        Button {
                        } label: {
                            Label("Import Photo", systemImage: "photo.on.rectangle")
                                .font(.system(size: 24, weight: .heavy))
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 26)
                        }
                        .buttonStyle(.plain)
                        .foregroundStyle(theme.accent)
                        .overlay {
                            RoundedRectangle(cornerRadius: 24).stroke(theme.accent, lineWidth: 2)
                        }
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.horizontal, 32)
                .background(theme.background)
            }
        }
    }
}

struct BabyBadgeView: View {
    @Environment(AppStore.self) private var appStore

    var body: some View {
        if let baby = appStore.activeBaby {
            let theme = ThemePalette.resolve(baby.themeColorHex)

            HStack(spacing: 6) {
                Circle()
                    .fill(theme.accent)
                    .frame(width: 10, height: 10)
                Text(baby.name)
                    .font(.system(size: 14, weight: .semibold))
                    .lineLimit(1)
                Image(systemName: "chevron.down")
                    .font(.system(size: 10, weight: .bold))
            }
            .foregroundStyle(theme.accent)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color(hex: "#F5F5F5"), in: Capsule())
        }
    }
}
