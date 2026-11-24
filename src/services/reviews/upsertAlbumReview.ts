import { ReviewRepository } from "@/features/reviews/review.repository";
import { Review } from "@/features/reviews/review.types";
import { AlbumCatalogService } from "@/features/album-catalog/album-catalog.service";
import { auth } from "../providers/firebase/firebase";

export async function upsertAlbumReview(
    albumId: string, 
    rating: number, 
    coment: string, 
    provider = 'deezer')
  : Promise<Review> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Not authenticated");
  }

  await new AlbumCatalogService().ensureAlbumCached(provider, albumId.toString());

  const reviewRepository = new ReviewRepository();
  const review = await reviewRepository.upsertReview(provider, albumId.toString(), rating, coment);

  return review;
}