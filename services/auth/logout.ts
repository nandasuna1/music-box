import { auth } from "@/services/firebase";
import { useProfileStore } from "@/storage/store/profileStore";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { signOut } from "firebase/auth";

export async function handleLogout() {
  try {
    // Firebase
    await signOut(auth);

    // Google (opcional, mas recomendado)
    await GoogleSignin.signOut();
    useProfileStore.getState().reset();
  } catch (err) {
    console.log("Logout error:", err);
    throw err;
  }
}
