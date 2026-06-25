import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { AuthProvider } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/styling/use-color-scheme";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";

GoogleSignin.configure({
  iosClientId:
    "843337715350-caso2ra8p9j2nvu7k80dmma3f1as0j8s.apps.googleusercontent.com",
  webClientId:
    "843337715350-b1qdt1uk7eph8gk3hgv6drk6k2u5p2ns.apps.googleusercontent.com",
  scopes: ["profile", "email"],
  offlineAccess: false,
});

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <SafeAreaProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }} />
            <StatusBar style="auto" />
          </AuthProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
