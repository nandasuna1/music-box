import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { DesignTokens } from "@/constants/theme";
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
      <Text style={styles.logo}>vinyl.</Text>

      <Text style={styles.title}>Seu diário musical</Text>

      <Text style={styles.subtitle}>
        Avalie álbuns, registre memórias e acompanhe sua jornada sonora.
      </Text>

      <View style={styles.buttonWrapper}>
        <GoogleLoginButton login={handleLogin} />
      </View>

      <Text style={styles.footer}>
        Ao continuar, você concorda com nossos termos.
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
    justifyContent: "center",
    padding: DesignTokens.spacing.xl,
  },
  logo: {
    fontSize: DesignTokens.typography.display,
    fontWeight: DesignTokens.fontWeight.extraBold,
    color: DesignTokens.colors.accent,
    marginBottom: DesignTokens.spacing.sm,
  },
  title: {
    fontSize: DesignTokens.typography.title,
    fontWeight: DesignTokens.fontWeight.bold,
    color: DesignTokens.colors.text,
    marginBottom: DesignTokens.spacing.sm,
  },
  subtitle: {
    fontSize: DesignTokens.typography.body,
    color: DesignTokens.colors.textMuted,
    marginBottom: DesignTokens.spacing.xxl,
    lineHeight: DesignTokens.typography.lineHeight.body,
  },
  buttonWrapper: {
    marginTop: DesignTokens.spacing.lg,
  },
  footer: {
    marginTop: DesignTokens.spacing.xl,
    fontSize: DesignTokens.typography.caption,
    color: DesignTokens.colors.textSubtle,
    textAlign: "center",
  },
  error: {
    color: DesignTokens.colors.danger,
    marginTop: DesignTokens.spacing.sm,
  },
});
