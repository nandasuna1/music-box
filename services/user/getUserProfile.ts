import { db } from "@/services/firebase";
import { UserProfile } from "@/types/User";
import { doc, getDoc } from "firebase/firestore";

// export type UserProfile = {
//   id: string;
//   name: string;
//   photoURL: string;
//   reviewsCount: number;
//   listenLaterCount: number;
// };

export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();

  return {
    uid: userId,
    name: data.name,
    photoURL: data.photoURL,
    reviewsCount: data.reviewsCount ?? 0,
    listenLaterCount: data.listenLaterCount ?? 0,
    email: data.email,
  };
}
