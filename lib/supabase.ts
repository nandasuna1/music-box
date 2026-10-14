import { auth } from "@/services/firebase";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "https://example.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "anon-key-placeholder";

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getFirebaseAccessToken(): Promise<string | null> {
  const currentUser = auth.currentUser as { getIdToken?: (force?: boolean) => Promise<string> } | null;

  if (!currentUser || typeof currentUser.getIdToken !== "function") {
    return null;
  }

  try {
    return await currentUser.getIdToken(false);
  } catch (error) {
    console.warn("Failed to retrieve Firebase ID token for Supabase.", error);
    return null;
  }
}

export async function refreshFirebaseAccessToken(): Promise<string | null> {
  const currentUser = auth.currentUser as { getIdToken?: (force?: boolean) => Promise<string> } | null;

  if (!currentUser || typeof currentUser.getIdToken !== "function") {
    return null;
  }

  try {
    return await currentUser.getIdToken(true);
  } catch (error) {
    console.warn("Failed to refresh Firebase ID token for Supabase.", error);
    return null;
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  accessToken: async () => getFirebaseAccessToken(),
});
