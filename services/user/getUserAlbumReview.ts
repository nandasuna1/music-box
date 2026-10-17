// services/reviews/getUserReviewByAlbum.ts
import { auth, db } from "@/services/firebase";
import { AlbumRating } from "@/types/Album";
import { doc, getDoc } from "firebase/firestore";

export async function getUserAlbumReview(
  albumId: number,
): Promise<AlbumRating | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const reviewRef = doc(db, "reviews", `${user.uid}_${albumId}`);
  const snap = await getDoc(reviewRef);

  if (!snap.exists()) return null;

  const data = snap.data();

  return {
    albumId: data.albumId,
    title: data.title,
    artist: data.artist,
    cover: data.cover,
    rating: data.rating,
    comment: data.comment,
    ratedAt: data.ratedAt.toDate().toISOString(),
  };
}
