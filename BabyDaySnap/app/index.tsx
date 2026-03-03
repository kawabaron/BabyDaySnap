import { Redirect } from "expo-router";
import { useAppState } from "@/context/AppContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
    const { settings, loading } = useAppState();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
                <ActivityIndicator size="large" color="#FF8FA3" />
            </View>
        );
    }

    const needsOnboarding = !settings.hasOnboarded || !settings.birthDateISO;

    if (needsOnboarding) {
        return <Redirect href="/onboarding" />;
    }

    return <Redirect href="/(tabs)/camera" />;
}
