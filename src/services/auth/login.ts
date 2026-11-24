import { auth } from "@/services/providers/firebase/firebase";
import { logger } from "@/utils/logger";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { upsertUser } from "../user/upsert";
import { syncUserProfile } from "./syncUserProfile";

async function performLogin() {
  try {
    logger.info("Starting Google sign-in");

    const userInfo = await GoogleSignin.signIn();
    logger.info("Google sign-in completed");

    const idToken = userInfo?.data?.idToken;
    if (!idToken) throw new Error("Google ID Token not found");

    const credential = GoogleAuthProvider.credential(idToken);

    await signInWithCredential(auth, credential);
    logger.info("Firebase authentication completed");

    const user = auth.currentUser;

    if (user) {
      logger.info("Starting profile sync");

      // TODO: remove old firebase
      await upsertUser(user);
      logger.info("upsertUser completed");

      await syncUserProfile();
      logger.info("syncUserProfile completed");
    }
  } catch (err) {
    logger.error("Login flow failed", { err });
    throw err;
  }
}

let signInPromise: Promise<void> | null = null

export function login(): Promise<void> {
  if (signInPromise) {
    return signInPromise
  }

  signInPromise = performLogin().finally(() => {
    signInPromise = null
  })

  return signInPromise
}