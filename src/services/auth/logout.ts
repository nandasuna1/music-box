import { auth } from "@/services/providers/firebase/firebase";
import { logger } from "@/utils/logger";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { signOut } from "firebase/auth";

export async function handleLogout() {
  try {
    // Firebase
    await signOut(auth);

    // Google (opcional, mas recomendado)
    await GoogleSignin.signOut();
  } catch (err) {
    logger.error("Logout error", { err });
    throw err;
  }
}
