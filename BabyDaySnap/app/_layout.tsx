import { useEffect } from "react";
import { Stack, useGlobalSearchParams, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AdsConsentProvider } from "@/context/AdsConsentContext";
import { AppProvider, useAppState } from "@/context/AppContext";
import { BillingProvider } from "@/lib/billing";
import { FONT_ASSET_MAP } from "@/utils/templates";
import "../global.css";
import "@/lib/i18n";

function RootLayoutNav() {
  const { settings, loading } = useAppState();
  const router = useRouter();
  const segments = useSegments();
  const searchParams = useGlobalSearchParams();
  const [fontsLoaded] = useFonts(FONT_ASSET_MAP);

  useEffect(() => {
    if (loading || !fontsLoaded) {
      return;
    }

    const inOnboarding = segments[0] === "onboarding";
    const needsOnboarding = !settings.hasOnboarded || !settings.birthDateISO;
    const isAddMode = searchParams.mode === "add";

    if (needsOnboarding && !inOnboarding) {
      router.replace("/onboarding");
      return;
    }

    if (!needsOnboarding && inOnboarding && !isAddMode) {
      router.replace("/(tabs)/camera");
    }
  }, [
    fontsLoaded,
    loading,
    router,
    searchParams.mode,
    segments,
    settings.birthDateISO,
    settings.hasOnboarded,
  ]);

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
      <AdsConsentProvider>
        <AppProvider>
          <BillingProvider>
            <RootLayoutNav />
          </BillingProvider>
        </AppProvider>
      </AdsConsentProvider>
    </GestureHandlerRootView>
  );
}
