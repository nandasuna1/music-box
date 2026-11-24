import { AlbumCatalogRepository } from "@/features/album-catalog/album-catalog.repository";
import { ReviewRepository } from "@/features/reviews/review.repository";
import { ReviewWithAlbum } from "@/features/reviews/review.types";
import { auth } from "../providers/firebase/firebase";


export async function getReviewByAlbumAndUserId(
  albumId: string,
  userId?: string,  
  provider = 'deezer',
): Promise<ReviewWithAlbum | null> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Not authenticated");
  }

  const userToFind = userId || currentUser.uid;

  const reviewRepository = new ReviewRepository();
  const userReview = await reviewRepository.getReviewByUserIdAndAlbumId(userToFind, albumId, provider);

  if (!userReview) {
    return null;
  }

  const albumCatalogRepository = new AlbumCatalogRepository();
  const album = await albumCatalogRepository.getAlbumById(provider, albumId);

  const review: ReviewWithAlbum = {
    albumId,
    comment: userReview?.comment || null,
    id: userReview.id,
    provider: userReview.provider,
    rating: userReview?.rating || 0,
    userId: userReview.user_id,
    album: {
      id: album?.id || null,
      title: album?.album_title || null,
      artist: album?.artist_id || null,
      cover: album?.cover_url || null,
    }
  }

  return review || null;
}