import { Stack } from "expo-router";

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
                    headerTitle: "詳細",
                    headerTintColor: "#333",
                    headerStyle: { backgroundColor: "#FFF" },
                    headerBackTitle: "戻る",
                }}
            />
        </Stack>
    );
}
