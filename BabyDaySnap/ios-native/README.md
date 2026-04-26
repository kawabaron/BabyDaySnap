# BSnap SwiftUI Native App

This folder is the first native SwiftUI migration track for the released Expo app.

Important compatibility choices:

- Keep the App Store bundle identifier as `com.kawabaron.bsnap.app`.
- Treat the existing SQLite database as the source of truth when it has data.
- Read legacy AsyncStorage only when SQLite is missing or empty.
- Never delete legacy files during first migration.
- Resolve saved image file names against the current app container instead of trusting stale absolute `file://` paths.

Current status:

- SwiftUI app shell is in `Sources/BSnapApp`.
- Existing SQLite read support is in `Sources/BSnapApp/Data`.
- Legacy AsyncStorage detection/read support is in `Sources/BSnapApp/Legacy`.
- Image path compatibility helpers are in `Sources/BSnapApp/Files`.

The repository currently has no generated iOS project. Create a new SwiftUI iOS app in Xcode or generate one with your preferred project generator, then add the files in `Sources/BSnapApp` to the app target and copy the existing assets/fonts into the app bundle.
