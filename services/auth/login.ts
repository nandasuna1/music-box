import { auth } from "@/services/firebase";
import { logger } from "@/utils/logger";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { upsertUser } from "../user/upsert";

export async function login() {
  try {
    await GoogleSignin.hasPlayServices();
  } catch (err) {
    logger.error("Google services are unavailable", { err });
    throw new Error("Google services are unavailable");
  }

  try {
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo?.data?.idToken;

    if (!idToken) {
      throw new Error("Google ID Token not found");
    }

    const credential = GoogleAuthProvider.credential(idToken);

    await signInWithCredential(auth, credential);

    const user = auth.currentUser;

    if (user) {
      await upsertUser(user);
    }
  } catch (err) {
    logger.error("Google sign-in failed", { err });
    throw new Error("Google sign-in failed");
  }
}
