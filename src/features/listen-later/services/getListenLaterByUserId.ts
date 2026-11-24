import { ListenLaterRepository } from "@/features/listen-later/listen-later.repository";
import { auth } from "@/services/providers/firebase/firebase";
import { Album } from "@/types/Album";
import { supabase } from "@/lib/supabase";
import { AlbumCatalogService } from "@/features/album-catalog/album-catalog.service";

export async function getListenLaterByUserId(
  userId: string | undefined = undefined,
  max = 3,
  provider = "deezer",
): Promise<Album[]> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Not authenticated");
  }

  const searchUser = userId || user.uid;

  const listenLaterRepository = new ListenLaterRepository();
  const savedAlbums = await listenLaterRepository.getListenLaterByUserId(searchUser, provider, max);
  if (savedAlbums.length === 0) return [];

  const catalogService = new AlbumCatalogService();
  const resolvedCatalogs = await Promise.all(
    savedAlbums.map((saved) =>
      catalogService.ensureAlbumCached(saved.provider, saved.album_id),
    ),
  );
  const catalogById = new Map(
    resolvedCatalogs.map((album) => [album.album_id, album]),
  );
  const artistIds = resolvedCatalogs
    .map((album) => album.artist_id)
    .filter((artistId): artistId is string => !!artistId);

  let artistById = new Map<string, string>();
  if (artistIds.length > 0) {
    const { data: artists, error: artistError } = await supabase
      .from("artist")
      .select("artist_id, artist_name")
      .eq("provider", provider)
      .in("artist_id", artistIds);

    if (artistError) {
      throw new Error(`Failed to fetch Listen Later artists: ${artistError.message}`);
    }

    artistById = new Map(
      (artists ?? []).map((artist) => [artist.artist_id, artist.artist_name]),
    );
  }

  return savedAlbums
    .map((saved) => catalogById.get(saved.album_id))
    .filter((album): album is NonNullable<typeof album> => !!album)
    .map((album) => ({
      albumId: album.album_id,
      title: album.album_title,
      artist: album.artist_id ? artistById.get(album.artist_id) ?? "" : "",
      cover: album.cover_url ?? "",
    }));
}