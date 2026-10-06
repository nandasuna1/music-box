import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { login } from "@/services/auth/login";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  async function handleLogin() {
    setError(null);
    try {
      await login();
    } catch (err) {
      console.error(err);
      setError("Falha ao entrar com o Google");
    }
  }

  return (
    <View style={styles.container}>
      {/* Logo / Nome */}
      <Text style={styles.logo}>vinyl.</Text>

      {/* Copy */}
      <Text style={styles.title}>Seu diário musical</Text>

      <Text style={styles.subtitle}>
        Avalie álbuns, registre memórias e acompanhe sua jornada sonora.
      </Text>

      {/* CTA */}
      <View style={styles.buttonWrapper}>
        <GoogleLoginButton login={handleLogin} />
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Ao continuar, você concorda com nossos termos.
      </Text>
      {error && <Text style={{ color: "red", marginTop: 8 }}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0E0E10",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FFD700",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 32,
    lineHeight: 22,
  },
  buttonWrapper: {
    marginTop: 16,
  },
  footer: {
    marginTop: 24,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});
