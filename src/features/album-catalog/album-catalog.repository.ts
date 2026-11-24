import { supabase } from "@/lib/supabase";
import { logger } from "@/utils/logger";
import { AlbumCatalog, AlbumCatalogInsert, CatalogAlbum, CatalogArtist } from "./album-catalog.types";

interface IAlbumCatalogRepository {
    getAlbumById(provider: string, albumId: string): Promise<AlbumCatalog | null>;
    getAlbumsByIds(provider: string, albumIds: string[]): Promise<AlbumCatalog[]>;
    getAlbumsByArtistId(provider: string, artistId: string): Promise<AlbumCatalog[]>;
    getAlbumsByGenre(provider: string, genre: string): Promise<AlbumCatalog[]>;
    getAlbumsByReleaseDate(provider: string, releaseDate: string): Promise<AlbumCatalog[]>;
    upsertArtist(provider: string, artist: CatalogArtist): Promise<void>;
    upsertAlbum(provider: string, album: CatalogAlbum): Promise<AlbumCatalog>;
}

export class AlbumCatalogRepository implements IAlbumCatalogRepository {
    async getAlbumById(provider: string, albumId: string): Promise<AlbumCatalog | null> {
        const { data, error } = await supabase
            .from("album_catalog")
            .select("*")
            .eq("provider", provider)
            .eq("album_id", albumId)
            .maybeSingle();

        if (error) {
            logger.error("Error fetching album from catalog:", error);
            throw new Error(`Failed to fetch album catalog entry: ${error.message}`);
        }

        return data;
    }

    async getAlbumsByIds(provider: string, albumIds: string[]): Promise<AlbumCatalog[]> {
        // Implementation to fetch multiple albums by their IDs from the database
        return []; // Placeholder
    }

    async getAlbumsByArtistId(provider: string, artistId: string): Promise<AlbumCatalog[]> {
        // Implementation to fetch albums by artist ID from the database
        return []; // Placeholder
    }

    async getAlbumsByGenre(provider: string, genre: string): Promise<AlbumCatalog[]> {
        // Implementation to fetch albums by genre from the database
        return []; // Placeholder
    }

    async getAlbumsByReleaseDate(provider: string, releaseDate: string): Promise<AlbumCatalog[]> {
        // Implementation to fetch albums by release date from the database
        return []; // Placeholder
    }

    async upsertArtist(provider: string, artist: CatalogArtist): Promise<void> {
        const { error } = await supabase
            .from("artist")
            .upsert({
                provider,
                artist_id: artist.artistId,
                artist_name: artist.name,
                picture_url: artist.pictureUrl,
                updated_at: new Date().toISOString(),
            }, { onConflict: "provider,artist_id" });

        if (error) {
            logger.error("Error upserting catalog artist:", error);
            throw new Error(`Failed to upsert catalog artist: ${error.message}`);
        }
    }

    async upsertAlbum(provider: string, album: CatalogAlbum): Promise<AlbumCatalog> {
        const insert: AlbumCatalogInsert = {
            provider,
            album_id: album.albumId,
            album_title: album.title,
            artist_id: album.artistId,
            cover_url: album.coverUrl,
            link_url: album.linkUrl,
            share_url: album.shareUrl,
            genre_id: album.genreId,
            contributors: album.contributors,
            cached_at: new Date().toISOString(),
            last_fetched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from("album_catalog")
            .upsert(insert, { onConflict: "provider,album_id" })
            .select()
            .single();

        if (error) {
            logger.error("Error upserting album:", error);
            throw new Error(`Failed to upsert album catalog entry: ${error.message}`);
        }

        return data as AlbumCatalog;
    }
}