import { AlbumCatalogRepository } from "@/features/album-catalog/album-catalog.repository";
import { AlbumCatalog, CatalogAlbum } from "@/features/album-catalog/album-catalog.types";
import { DeezerAlbum } from "@/types/DeezerTypes";

export async function upsertAlbumCatalog(provider: string, album: DeezerAlbum): Promise<AlbumCatalog> {
  const albumCatalogRepository = new AlbumCatalogRepository();
  await albumCatalogRepository.upsertArtist(provider, {
    provider,
    artistId: album.artist.id.toString(),
    name: album.artist.name,
    pictureUrl: album.artist.picture_small ?? null,
  });
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
  const upsertedAlbum = await albumCatalogRepository.upsertAlbum(provider, catalogAlbum);
  return upsertedAlbum;
}   