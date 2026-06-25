// app/album/_layout.tsx
import { Stack } from "expo-router";
import { Pressable } from "react-native";

export default function AlbumLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          title: "Album",
          headerRight: () => (
            <Pressable onPress={() => alert("This is a button!")}>
              Info
            </Pressable>
          ),
        }}
      />
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
