import { Stack } from "expo-router";
import i18n from "@/lib/i18n";

export default function CameraStackLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen
                name="editor"
                options={{
                    headerShown: true,
                    headerTitle: i18n.t("common.edit"),
                    headerTintColor: "#333",
                    headerStyle: { backgroundColor: "#FFF" },
                    headerBackTitle: i18n.t("common.back"),
                }}
            />
        </Stack>
    );
}
