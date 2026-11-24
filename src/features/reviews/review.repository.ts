import { supabase } from "@/lib/supabase";
import { Review } from "./review.types";

interface IReviewRepository {
    upsertReview(provider: string, albumId: string, rating: number, comment: string): Promise<Review>;
    deleteReview(provider: string, albumId: string): Promise<void>;
    getAlbumReviews(provider: string, albumId: string): Promise<Review[]>;
    getReviewsByUserId(userId: string): Promise<Review[]>;
    getReviewByUserIdAndAlbumId(userId: string, albumId: string, provider: string): Promise<Review | null>;
}

export class ReviewRepository implements IReviewRepository {
    getAlbumReviews(provider: string, albumId: string): Promise<Review[]> {
        throw new Error("Method not implemented.");
    }

    async upsertReview(provider: string, albumId: string, rating: number, comment: string): Promise<Review> {
        const {data, error} = await supabase
            .from("album_reviews")
            .upsert(
                { provider, album_id: albumId, rating, comment },
                { onConflict: "user_id,provider,album_id" },
            )
            .select()
            .single();

        if (error) throw new Error(error.message);

        return data;
    }


    async deleteReview(provider: string, albumId: string): Promise<void> {
        const {error} = await supabase
            .from("album_reviews")
            .delete()
            .eq("provider", provider)
            .eq("album_id", albumId);
        if (error) throw new Error(error.message);
    }

    async getReviewsByUserId(userId: string, limit: number = 5): Promise<Review[]> {
        const {data, error} = await supabase
            .from("album_reviews")
            .select()
            .eq("user_id", userId)
            .limit(limit);
        if (error) throw new Error(error.message);
        return data;
    }

    async getReviewByUserIdAndAlbumId(userId: string, albumId: string, provider: string): Promise<Review | null> {
        const {data, error} = await supabase
            .from("album_reviews")
            .select()
            .eq("user_id", userId)
            .eq("album_id", albumId)
            .eq("provider", provider)
            .maybeSingle()
            
        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}