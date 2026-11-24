import { Button } from "@/components/Button";

export function GoogleLoginButton({ login }: { login: () => Promise<void> }) {
  return <Button onPress={login}>Entrar com Google</Button>;
}
