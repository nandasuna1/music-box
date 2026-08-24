// services/reviews/getUserReviewByAlbum.ts
import { auth, db } from "@/services/firebase";
import { AlbumRating } from "@/types/Album";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

export async function getUserAlbumReview(
  albumId: number,
): Promise<AlbumRating | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const q = query(
    collection(db, "reviews"),
    where("userId", "==", user.uid),
    where("albumId", "==", albumId),
    orderBy("ratedAt", "desc"),
    limit(1),
  );

  const snap = await getDocs(q);

  if (snap.empty) return null;

  const data = snap.docs[0].data();

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
