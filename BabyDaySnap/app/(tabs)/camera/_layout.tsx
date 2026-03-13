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
                    headerShown: false,
                }}
            />
        </Stack>
    );
}
