import SwiftUI

struct OnboardingView: View {
    @Environment(AppStore.self) private var appStore
    @State private var babyName = ""
    @State private var birthDate = Date()
    @State private var selectedTheme = ThemePalette.presets[0]

    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 8) {
                Text("Welcome to BSnap")
                    .font(.system(size: 28, weight: .heavy))
                Text("Add your baby's birthday to start creating keepsake photos.")
                    .font(.system(size: 15))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            TextField("Baby name", text: $babyName)
                .textFieldStyle(.roundedBorder)
                .font(.system(size: 18, weight: .semibold))
                .multilineTextAlignment(.center)

            DatePicker("Birth date", selection: $birthDate, displayedComponents: .date)
                .datePickerStyle(.wheel)

            HStack(spacing: 14) {
                ForEach(ThemePalette.presets, id: \.hex) { theme in
                    Circle()
                        .fill(theme.accent)
                        .frame(width: 44, height: 44)
                        .overlay {
                            if selectedTheme.hex == theme.hex {
                                Circle().stroke(theme.accent, lineWidth: 4).scaleEffect(1.18)
                            }
                        }
                        .onTapGesture {
                            selectedTheme = theme
                        }
                }
            }

            Button {
            } label: {
                Text("Start")
                    .font(.system(size: 18, weight: .bold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
            }
            .buttonStyle(.plain)
            .foregroundStyle(.white)
            .background(selectedTheme.accent, in: RoundedRectangle(cornerRadius: 16))
        }
        .padding(.horizontal, 32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(selectedTheme.background)
    }
}
