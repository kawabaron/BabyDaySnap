import { useEffect } from "react";
import { Stack, useRouter, useSegments, useGlobalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useAppState } from "@/context/AppContext";
import { View, ActivityIndicator } from "react-native";
import { useFonts } from "expo-font";
import { FONT_OPTIONS } from "@/utils/templates";
import "../global.css";

function RootLayoutNav() {
  const { settings, loading } = useAppState();
  const router = useRouter();
  const segments = useSegments();
  const searchParams = useGlobalSearchParams();

  const [fontsLoaded] = useFonts({
    font_standard: FONT_OPTIONS.find(f => f.id === "font_standard")!.file,
    font_soft: FONT_OPTIONS.find(f => f.id === "font_soft")!.file,
    font_stylish: FONT_OPTIONS.find(f => f.id === "font_stylish")!.file,
    font_cute: FONT_OPTIONS.find(f => f.id === "font_cute")!.file,
  });

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
    <AppProvider>
      <RootLayoutNav />
    </AppProvider>
  );
}
