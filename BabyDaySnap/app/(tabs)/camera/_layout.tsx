import { Stack } from "expo-router";

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
                    headerTitle: "編集",
                    headerTintColor: "#333",
                    headerStyle: { backgroundColor: "#FFF" },
                    headerBackTitle: "戻る",
                }}
            />
        </Stack>
    );
}
