// app/album/_layout.tsx
import { Stack } from "expo-router";
import { Pressable, Text } from "react-native";

export default function AlbumLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          title: "Album",
          headerRight: () => (
            <Pressable onPress={() => alert("This is a button!")}>
              <Text>Info</Text>
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
