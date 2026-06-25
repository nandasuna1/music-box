import { login } from "@/services/auth/login";
import { Pressable, Text } from "react-native";

export function GoogleLoginButton() {
  return (
    <Pressable
      onPress={login}
      style={{
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 8,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#000", fontWeight: "600" }}>
        Entrar com Google
      </Text>
    </Pressable>
  );
}
