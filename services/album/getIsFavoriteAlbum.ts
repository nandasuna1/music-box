// services/reviews/getUserReviewByAlbum.ts
import { auth, db } from "@/services/firebase";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

export async function getIsFavoriteAlbum(
  albumId: number,
): Promise<boolean | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const q = query(
    collection(db, "saveForLater"),
    where("userId", "==", user.uid),
    where("albumId", "==", albumId),
    limit(1),
  );

  const snap = await getDocs(q);

  if (snap.empty) return null;

  const data = snap.docs[0].data();

  return Boolean(data);
}
