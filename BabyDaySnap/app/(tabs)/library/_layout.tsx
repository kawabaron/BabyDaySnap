import { Stack } from "expo-router";
import i18n from "@/lib/i18n";

export default function LibraryStackLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen
                name="[id]"
                options={{
                    headerShown: true,
                    headerTitle: i18n.t("common.detail"),
                    headerTintColor: "#333",
                    headerStyle: { backgroundColor: "#FFF" },
                    headerBackTitle: i18n.t("common.back"),
                }}
            />
            <Stack.Screen
                name="viewer"
                options={{
                    headerShown: false,
                    animation: "fade",
                }}
            />
        </Stack>
    );
}