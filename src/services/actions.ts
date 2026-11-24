import { AlbumCatalogRepository } from "@/features/album-catalog/album-catalog.repository";
import { ArtistRepository } from "@/features/artist/artist.respository";
import { Artist } from "@/features/artist/artist.types";
import type { CatalogAlbum } from "@/features/album-catalog/album-catalog.types";
import { DeezerAlbum } from "@/types/DeezerTypes";

export async function updateDatabaseCatalog(provider: string, album: DeezerAlbum) {
  const albumCatalogRepository = new AlbumCatalogRepository();
  const catalogAlbum: CatalogAlbum = {
    provider,
    albumId: album.id.toString(),
    title: album.title,
    artistId: album.artist.id.toString(),
    coverUrl: album.cover_medium ?? null,
    linkUrl: album.link_url ?? null,
    shareUrl: album.share_url ?? null,
    genreId: album.genre_id?.toString() ?? null,
    contributors: (album.contributors ?? []).map((contributor) => contributor.id.toString()),
  };
  await albumCatalogRepository.upsertArtist(provider, {
    provider,
    artistId: album.artist.id.toString(),
    name: album.artist.name,
    pictureUrl: album.artist.picture_small ?? null,
  });
  const upsertedAlbum = await albumCatalogRepository.upsertAlbum(provider, catalogAlbum);

  const artistRepository = new ArtistRepository();

  const artist: Artist = {
    id: album.artist.id.toString(),
    artist_id: album.artist.id.toString(),
    artist_name: album.artist.name,
    picture_url: album.artist.picture_small,
    provider: provider,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const upsertedArtist = await artistRepository.upsertArtist(artist);

  return {
    album: upsertedAlbum,
    artist: upsertedArtist,
  };
}