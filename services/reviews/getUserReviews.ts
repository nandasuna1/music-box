import { auth, db } from "@/services/firebase";
import { AlbumRating } from "@/types/Album";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export async function getUserReviews(): Promise<AlbumRating[]> {
  const user = auth.currentUser;
  if (!user) return [];

  // 1️⃣ buscar ponteiros
  const pointersSnap = await getDocs(
    collection(db, "users", user.uid, "reviews"),
  );

  if (pointersSnap.empty) return [];

  // 2️⃣ buscar reviews reais
  const reviewPromises = pointersSnap.docs.map(async (docSnap) => {
    const reviewRef = doc(db, "reviews", docSnap.id);
    const reviewDoc = await getDoc(reviewRef);

    if (reviewDoc.exists()) {
      const currentReview = reviewDoc.data();
      return { id: reviewDoc.id, ...currentReview } as AlbumRating;
    }

    return null;
  });

  const reviews = (await Promise.all(reviewPromises)).filter(Boolean);

  return reviews as AlbumRating[];
}
