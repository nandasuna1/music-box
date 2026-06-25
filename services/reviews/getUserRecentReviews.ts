import { db } from "@/services/firebase";
import { AlbumRating } from "@/types/Album";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

export async function getUserRecentReviews(
  userId?: string,
  max = 3,
): Promise<AlbumRating[]> {
  const q = query(
    collection(db, "reviews"),
    where("userId", "==", userId),
    limit(max),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      albumId: data.albumId,
      title: data.title,
      artist: data.artist,
      cover: data.cover,
      rating: data.rating,
      comment: data.comment,
      ratedAt: data.ratedAt.toDate().toISOString(),
    };
  });
}
