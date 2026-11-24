import { supabase } from "@/lib/supabase";
import { Artist } from "./artist.types";

interface IArtistRepository {
    getArtistById(artistId: string): Promise<Artist | null>;
    upsertArtist(artist: Artist): Promise<Artist>;
}

export class ArtistRepository implements IArtistRepository {
    async getArtistById(artistId: string): Promise<Artist | null> {
        // Implementation to fetch artist by ID from the database
        const { data, error } = await supabase
            .from("artist")
            .select("*")
            .eq("artist_id", artistId)
            .single();

        if (error) {
            throw new Error(`Failed to fetch artist: ${error.message}`);
        }

        return data as Artist | null;
    }

    async upsertArtist(artist: Artist): Promise<Artist> {
        // Implementation to insert or update an artist in the database
        const { data, error } = await supabase
            .from("artist")
            .upsert({
                id: artist.id,
                artist_id: artist.artist_id,
                artist_name: artist.artist_name,
                picture_url: artist.picture_url,
                provider: artist.provider,
                created_at: artist.created_at,
                updated_at: artist.updated_at,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to upsert artist: ${error.message}`);
        }

        return data as Artist;
    }


}