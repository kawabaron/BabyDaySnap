import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "react-native";
import { useActiveBaby, useAppState } from "@/context/AppContext";
import { getThemePreset, NEUTRAL_THEME } from "@/constants/babyTheme";
import i18n, { getCurrentLocaleTag } from "@/lib/i18n";

export default function TabsLayout() {
  const { settings } = useAppState();
  const activeBaby = useActiveBaby();
  const theme = activeBaby ? getThemePreset(activeBaby.themeColorHex) : NEUTRAL_THEME;
  const localeKey = settings.preferredLocale ?? getCurrentLocaleTag();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: "#BDBDBD",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0.5,
          borderTopColor: "#E0E0E0",
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="camera"
        options={{
          title: i18n.t("tabs.camera"),
          tabBarLabel: ({ color }) => (
            <Text key={`camera-${localeKey}`} style={{ color, fontSize: 11, fontWeight: "600" }}>
              {i18n.t("tabs.camera")}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: i18n.t("tabs.library"),
          tabBarLabel: ({ color }) => (
            <Text key={`library-${localeKey}`} style={{ color, fontSize: 11, fontWeight: "600" }}>
              {i18n.t("tabs.library")}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="images" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: i18n.t("tabs.settings"),
          tabBarLabel: ({ color }) => (
            <Text key={`settings-${localeKey}`} style={{ color, fontSize: 11, fontWeight: "600" }}>
              {i18n.t("tabs.settings")}
            </Text>
          ),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
