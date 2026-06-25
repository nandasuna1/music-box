import { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export async function ensureUserProfileExists(user: User) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      name: user.displayName,
      photoURL: user.photoURL,
      reviewsCount: 0,
      listenLaterCount: 0,
      createdAt: serverTimestamp(),
    });
  }
}
