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
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="viewer"
                options={{
                    headerShown: false,
                    animation: "none",
                }}
            />
        </Stack>
    );
}
