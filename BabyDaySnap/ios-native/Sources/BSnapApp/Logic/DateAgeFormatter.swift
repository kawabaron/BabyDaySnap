import Foundation

enum DateAgeFormatter {
    static func parseLocalDate(_ value: String) -> Date? {
        let parts = value.replacingOccurrences(of: "-", with: "/").split(separator: "/").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        return Calendar.current.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))
    }

    static func ageDays(birthDateISO: String, shotDateISO: String) -> Int {
        guard let birth = parseLocalDate(birthDateISO),
              let shot = parseLocalDate(shotDateISO),
              let days = Calendar.current.dateComponents([.day], from: birth, to: shot).day else {
            return 0
        }
        return days
    }

    static func monthName(_ month: Int, locale: Locale = .current) -> String {
        let safeMonth = min(max(month, 1), 12)
        let formatter = DateFormatter()
        formatter.locale = locale
        formatter.dateFormat = "LLLL"
        let date = Calendar.current.date(from: DateComponents(year: 2024, month: safeMonth, day: 1)) ?? Date()
        return formatter.string(from: date)
    }

    static func splitYearMonth(_ shotDateISO: String) -> (year: Int, month: Int)? {
        let parts = shotDateISO.replacingOccurrences(of: "-", with: "/").split(separator: "/").compactMap { Int($0) }
        guard parts.count >= 2 else { return nil }
        return (parts[0], parts[1])
    }
}
