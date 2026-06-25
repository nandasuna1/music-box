import { useAuth } from "@/contexts/AuthContext";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { user, loading } = useAuth();

  // ainda verificando auth → não renderiza nada
  if (loading) {
    return null;
  }

  // se já estiver logado, manda pra home
  if (user) {
    return <Redirect href="/(protected)/(tabs)" />;
  }

  // usuário NÃO logado → pode ver login
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
