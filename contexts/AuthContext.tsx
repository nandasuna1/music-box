import { useAuthSession } from "@/hooks/useAuthSession";
import { User } from "firebase/auth";
import { createContext, useContext } from "react";

type AuthContextData = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextData>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthSession();

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
