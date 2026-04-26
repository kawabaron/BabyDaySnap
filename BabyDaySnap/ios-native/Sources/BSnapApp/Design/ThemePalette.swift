import SwiftUI

struct ThemePalette {
    var hex: String
    var label: String
    var background: Color
    var accent: Color
    var light: Color
    var shadow: Color

    static let presets: [ThemePalette] = [
        ThemePalette(hex: "#FFB5C2", label: "Pink", background: Color(hex: "#FFF5F7"), accent: Color(hex: "#FF8FA3"), light: Color(hex: "#FFF0F3"), shadow: Color(hex: "#FF8FA3")),
        ThemePalette(hex: "#C5B9F2", label: "Lavender", background: Color(hex: "#F5F3FF"), accent: Color(hex: "#A78BFA"), light: Color(hex: "#EDE9FE"), shadow: Color(hex: "#A78BFA")),
        ThemePalette(hex: "#A8E6CF", label: "Mint", background: Color(hex: "#F0FFF4"), accent: Color(hex: "#6BCB9A"), light: Color(hex: "#E6FFF0"), shadow: Color(hex: "#6BCB9A")),
        ThemePalette(hex: "#A8D8F0", label: "Sky", background: Color(hex: "#F0F8FF"), accent: Color(hex: "#64B5F6"), light: Color(hex: "#E3F2FD"), shadow: Color(hex: "#64B5F6")),
        ThemePalette(hex: "#FFDAB9", label: "Peach", background: Color(hex: "#FFF8F0"), accent: Color(hex: "#FFB07C"), light: Color(hex: "#FFF3E8"), shadow: Color(hex: "#FFB07C")),
        ThemePalette(hex: "#FFF3B0", label: "Lemon", background: Color(hex: "#FFFDF0"), accent: Color(hex: "#FFD54F"), light: Color(hex: "#FFFDE7"), shadow: Color(hex: "#FFD54F"))
    ]

    static let neutral = ThemePalette(hex: "#FF8FA3", label: "Neutral", background: Color(hex: "#FFF5F7"), accent: Color(hex: "#FF8FA3"), light: Color(hex: "#FFF0F3"), shadow: Color(hex: "#FF8FA3"))

    static func resolve(_ hex: String?) -> ThemePalette {
        guard let hex else { return neutral }
        return presets.first { $0.hex.caseInsensitiveCompare(hex) == .orderedSame } ?? neutral
    }
}

extension Color {
    init(hex: String) {
        let trimmed = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var value: UInt64 = 0
        Scanner(string: trimmed).scanHexInt64(&value)

        let red = Double((value >> 16) & 0xFF) / 255.0
        let green = Double((value >> 8) & 0xFF) / 255.0
        let blue = Double(value & 0xFF) / 255.0
        self.init(red: red, green: green, blue: blue)
    }
}
