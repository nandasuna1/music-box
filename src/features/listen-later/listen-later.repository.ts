import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger/logger";
import { ListenLater } from "./listen-later.types";

interface IListenLaterRepository {
    addToListenLater(userId: string, provider: string, albumId: string): Promise<boolean>;
    removeFromListenLater(userId: string, provider: string, albumId: string): Promise<boolean>;
    getListenLater(): Promise<ListenLater[]>;
    isInListenLater(userId: string, provider: string, albumId: string): Promise<boolean>;
    getListenLaterByUserId(userId: string, provider?: string, max?: number): Promise<ListenLater[]>;
}

export class ListenLaterRepository implements IListenLaterRepository {
    async addToListenLater(userId: string, provider: string, albumId: string): Promise<boolean> {
        const {data, error} = await supabase
            .from("listen_later")
            .upsert(
                { user_id: userId, provider, album_id: albumId },
                { onConflict: "user_id,provider,album_id" },
            )
            .select()
            .single();

        if (error || !data) {
            logger.error("Error adding album to listen later:", error);
            throw new Error(error?.message ?? "Failed to add album to Listen Later");
        }

        logger.log("Successfully added album to listen later:", data);

        return true;
    }

    async removeFromListenLater(userId: string, provider: string, albumId: string): Promise<boolean> {
        const { error } = await supabase
            .from("listen_later")
            .delete()
            .eq("user_id", userId)
            .eq("provider", provider)
            .eq("album_id", albumId);

        if (error) {
            logger.error("Error removing album from listen later:", error);
            throw new Error(`Failed to remove album from Listen Later: ${error.message}`);
        }

        return true;
    }

    async getListenLater(max?: number): Promise<ListenLater[]> {
        const { data, error } = await supabase
            .from("listen_later")
            .select("*")
            .limit(max || 3)
            .order("created_at", { ascending: false });

        if (error) {
            logger.error("Error fetching listen later albums:", error);
            throw new Error(`Failed to fetch Listen Later albums: ${error.message}`);
        }

        return data;
    }

    async isInListenLater(userId: string, provider: string, albumId: string): Promise<boolean> {
        const { data, error } = await supabase
            .from("listen_later")
            .select("album_id")
            .eq("user_id", userId)
            .eq("provider", provider)
            .eq("album_id", albumId)

        if (error) {
            logger.error("Error checking if album is in listen later:", error);
            throw new Error(`Failed to check Listen Later: ${error.message}`);
        }

        return data.length > 0;
    }

    async getListenLaterByUserId(userId: string, provider = "deezer", max?: number): Promise<ListenLater[]> {
        const { data, error } = await supabase
            .from("listen_later")
            .select("*")
            .eq("user_id", userId)
            .eq("provider", provider)
            .limit(max || 3)
            .order("created_at", { ascending: false });

        if (error) {
            logger.error("Error fetching listen later albums by user ID:", error);
            throw new Error(`Failed to fetch Listen Later albums: ${error.message}`);
        }

        return data;
    }
}