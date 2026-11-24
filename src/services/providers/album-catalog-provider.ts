import type { CatalogAlbum, CatalogArtist } from "@/features/album-catalog/album-catalog.types"

export type ProviderAlbum = CatalogAlbum & {
  artist: CatalogArtist
}

export interface AlbumCatalogProvider {
  getAlbumById(albumId: string): Promise<ProviderAlbum>
  searchAlbums(query: string): Promise<ProviderAlbum[]>
}
