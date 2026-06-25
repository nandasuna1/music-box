import { auth } from "@/services/firebase";
import { useProfileStore } from "@/storage/store/profileStore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { upsertUser } from "../user/upsert";

export async function login() {
  try {
    await GoogleSignin.hasPlayServices();
  } catch (err) {
    console.error("Google services are unavailable", { err });
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
      await useProfileStore.getState().loadProfile(user.uid);
    }
  } catch (err) {
    console.log({ err });
  }
}
