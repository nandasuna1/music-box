import type { AlbumCatalogProvider, ProviderAlbum } from "../album-catalog-provider"
import type { DeezerAlbum } from "@/types/DeezerTypes"
import { deezerApi } from "./deezer"

function mapDeezerAlbum(album: DeezerAlbum): ProviderAlbum {
  const provider = "deezer"

  return {
    provider,
    albumId: album.id.toString(),
    title: album.title,
    artistId: album.artist.id.toString(),
    artist: {
      provider,
      artistId: album.artist.id.toString(),
      name: album.artist.name,
      pictureUrl: album.artist.picture_small ?? null,
    },
    coverUrl: album.cover_medium ?? null,
    linkUrl: album.link_url ?? null,
    shareUrl: album.share_url ?? null,
    genreId: album.genre_id?.toString() ?? null,
    contributors: (album.contributors ?? []).map((contributor) =>
      contributor.id.toString(),
    ),
  }
}

export class DeezerCatalogProvider implements AlbumCatalogProvider {
  async getAlbumById(albumId: string): Promise<ProviderAlbum> {
    const { data } = await deezerApi.get<DeezerAlbum>(`/album/${albumId}`)
    return mapDeezerAlbum(data)
  }

  async searchAlbums(query: string): Promise<ProviderAlbum[]> {
    const { data } = await deezerApi.get<{ data: DeezerAlbum[] }>(
      "/search/album",
      { params: { q: query } },
    )
    return data.data.map(mapDeezerAlbum)
  }
}

export const deezerCatalogProvider = new DeezerCatalogProvider()
