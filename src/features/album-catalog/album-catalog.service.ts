import type { AlbumCatalogProvider } from "@/services/providers/album-catalog-provider"
import type { AlbumCatalog } from "./album-catalog.types"
import { AlbumCatalogRepository } from "./album-catalog.repository"
import { deezerCatalogProvider } from "@/services/providers/deezer/deezer-provider"

export class AlbumCatalogService {
  private inFlight = new Map<string, Promise<AlbumCatalog>>()

  constructor(
    private repository = new AlbumCatalogRepository(),
    private provider: AlbumCatalogProvider = deezerCatalogProvider,
  ) {}

  async ensureAlbumCached(
    provider: string,
    albumId: string,
  ): Promise<AlbumCatalog> {
    const cached = await this.repository.getAlbumById(provider, albumId)
    if (cached) return cached

    const key = `${provider}:${albumId}`
    const existingRequest = this.inFlight.get(key)
    if (existingRequest) return existingRequest

    const request = this.resolveAndPersist(provider, albumId)
    this.inFlight.set(key, request)

    try {
      return await request
    } finally {
      this.inFlight.delete(key)
    }
  }

  private async resolveAndPersist(
    provider: string,
    albumId: string,
  ): Promise<AlbumCatalog> {
    const resolved = await this.provider.getAlbumById(albumId)
    await this.repository.upsertArtist(provider, resolved.artist)
    return this.repository.upsertAlbum(provider, resolved)
  }
}
