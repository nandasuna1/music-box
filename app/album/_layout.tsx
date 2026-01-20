// app/album/_layout.tsx
import { Stack } from "expo-router";

export default function AlbumLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="rate"
        options={{
          presentation: "modal",
          title: "Avaliar álbum",
        }}
      />
    </Stack>
  );
}
