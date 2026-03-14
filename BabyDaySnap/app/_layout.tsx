import { useEffect } from "react";
import { Stack, useRouter, useSegments, useGlobalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useAppState } from "@/context/AppContext";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";
import { FONT_ASSET_MAP } from "@/utils/templates";
import "../global.css";
import "@/lib/i18n";

import { GestureHandlerRootView } from "react-native-gesture-handler";

function RootLayoutNav() {
  const { settings, loading } = useAppState();
  const router = useRouter();
  const segments = useSegments();
  const searchParams = useGlobalSearchParams();

  const [fontsLoaded] = useFonts(FONT_ASSET_MAP);

  useEffect(() => {
    if (loading || !fontsLoaded) return;

    const inOnboarding = segments[0] === "onboarding";
    const needsOnboarding = !settings.hasOnboarded || !settings.birthDateISO;
    const isAddMode = searchParams.mode === "add";

    if (needsOnboarding && !inOnboarding) {
      router.replace("/onboarding");
    } else if (!needsOnboarding && inOnboarding && !isAddMode) {
      // 初期登録完了済みで、単なる /onboarding アクセス（追加モードではない）の場合のみカメラへリダイレクト
      router.replace("/(tabs)/camera");
    }
  }, [loading, fontsLoaded, settings.hasOnboarded, settings.birthDateISO, segments, searchParams.mode]);

  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
        <ActivityIndicator size="large" color="#FF8FA3" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <RootLayoutNav />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
