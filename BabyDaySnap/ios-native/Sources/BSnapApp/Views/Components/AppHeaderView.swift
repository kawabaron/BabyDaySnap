import SwiftUI

struct AppHeaderView<Left: View, Right: View>: View {
    var title: String
    var subtitle: String?
    @ViewBuilder var left: Left
    @ViewBuilder var right: Right

    init(
        title: String,
        subtitle: String? = nil,
        @ViewBuilder left: () -> Left = { EmptyView() },
        @ViewBuilder right: () -> Right = { EmptyView() }
    ) {
        self.title = title
        self.subtitle = subtitle
        self.left = left()
        self.right = right()
    }

    var body: some View {
        HStack {
            HStack { left }
                .frame(width: 104, alignment: .leading)

            VStack(spacing: 2) {
                Text(title)
                    .font(.system(size: 17, weight: .bold))
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                if let subtitle {
                    Text(subtitle)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity)

            HStack { right }
                .frame(width: 104, alignment: .trailing)
        }
        .padding(.horizontal, 16)
        .frame(minHeight: 60)
        .background(.white)
        .overlay(alignment: .bottom) {
            Divider().foregroundStyle(Color(hex: "#E9DDE2"))
        }
    }
}
