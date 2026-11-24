import { ReviewRepository } from "@/features/reviews/review.repository";
import { supabase } from "@/lib/supabase";
import { AlbumRating } from "@/types/Album";
import { auth } from "../providers/firebase/firebase";

export async function getReviewsByUserId(userId: string, limit: number = 5) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Not authenticated");
  }

  const reviewRepository = new ReviewRepository();
  const recentReviews = await reviewRepository.getReviewsByUserId(userId, limit);
  if (recentReviews.length === 0) return [];

  const albumIds = recentReviews.map((review) => review.album_id);
  
  const { data: albums, error } = await supabase
    .from("album_catalog")
    .select("album_id, album_title, artist_id, cover_url")
    .eq("provider", "deezer")
    .in("album_id", albumIds);

  if (error) throw new Error(`Failed to fetch review albums: ${error.message}`);

  const catalogById = new Map(
    (albums ?? []).map((album) => [album.album_id, album]),
  );

  return recentReviews.map((review): AlbumRating => {
    const album = catalogById.get(review.album_id);
    return {
      albumId: Number(review.album_id),
      title: album?.album_title ?? null,
      artist: album?.artist_id ?? null,
      cover: album?.cover_url ?? null,
      rating: review.rating,
      comment: review.comment,
      ratedAt: review.updated_at,
    };
  });
}