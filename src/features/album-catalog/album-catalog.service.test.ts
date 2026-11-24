import { AlbumCatalogService } from "./album-catalog.service";
import type { AlbumCatalog } from "./album-catalog.types";
import type { AlbumCatalogProvider, ProviderAlbum } from "@/services/providers/album-catalog-provider";

jest.mock("./album-catalog.repository", () => ({
  AlbumCatalogRepository: jest.fn(),
}));
jest.mock("@/services/providers/deezer/deezer-provider", () => ({
  deezerCatalogProvider: {
    getAlbumById: jest.fn(),
    searchAlbums: jest.fn(),
  },
}));

const catalogAlbum: AlbumCatalog = {
  id: "catalog-id",
  provider: "deezer",
  album_id: "42",
  album_title: "Test Album",
  artist_id: "7",
  cover_url: null,
  link_url: null,
  share_url: null,
  genre_id: null,
  contributors: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  cached_at: "2026-01-01T00:00:00Z",
  last_fetched_at: "2026-01-01T00:00:00Z",
  source: "deezer",
};

const providerAlbum: ProviderAlbum = {
  provider: "deezer",
  albumId: "42",
  title: "Test Album",
  artistId: "7",
  artist: {
    provider: "deezer",
    artistId: "7",
    name: "Test Artist",
    pictureUrl: null,
  },
  coverUrl: null,
  linkUrl: null,
  shareUrl: null,
  genreId: null,
  contributors: [],
};

describe("AlbumCatalogService", () => {
  it("returns a cached album without calling the provider", async () => {
    const repository = {
      getAlbumById: jest.fn().mockResolvedValue(catalogAlbum),
    } as any;
    const provider = {
      getAlbumById: jest.fn(),
      searchAlbums: jest.fn(),
    } as AlbumCatalogProvider;

    const result = await new AlbumCatalogService(repository, provider)
      .ensureAlbumCached("deezer", "42");

    expect(result).toBe(catalogAlbum);
    expect(provider.getAlbumById).not.toHaveBeenCalled();
  });

  it("persists the artist before the album and returns the resolved record", async () => {
    const repository = {
      getAlbumById: jest.fn().mockResolvedValue(null),
      upsertArtist: jest.fn().mockResolvedValue(undefined),
      upsertAlbum: jest.fn().mockResolvedValue(catalogAlbum),
    } as any;
    const provider = {
      getAlbumById: jest.fn().mockResolvedValue(providerAlbum),
      searchAlbums: jest.fn(),
    } as AlbumCatalogProvider;

    const result = await new AlbumCatalogService(repository, provider)
      .ensureAlbumCached("deezer", "42");

    expect(provider.getAlbumById).toHaveBeenCalledWith("42");
    expect(repository.upsertArtist).toHaveBeenCalledWith("deezer", providerAlbum.artist);
    expect(repository.upsertAlbum).toHaveBeenCalledWith("deezer", providerAlbum);
    expect(repository.upsertArtist.mock.invocationCallOrder[0])
      .toBeLessThan(repository.upsertAlbum.mock.invocationCallOrder[0]);
    expect(result).toBe(catalogAlbum);
  });

  it("propagates provider and persistence errors", async () => {
    const repository = {
      getAlbumById: jest.fn().mockResolvedValue(null),
      upsertArtist: jest.fn(),
      upsertAlbum: jest.fn(),
    } as any;
    const providerError = new Error("Deezer unavailable");
    const provider = {
      getAlbumById: jest.fn().mockRejectedValue(providerError),
      searchAlbums: jest.fn(),
    } as AlbumCatalogProvider;

    await expect(
      new AlbumCatalogService(repository, provider).ensureAlbumCached("deezer", "42"),
    ).rejects.toBe(providerError);

    const persistenceError = new Error("Catalog write failed");
    const failingRepository = {
      getAlbumById: jest.fn().mockResolvedValue(null),
      upsertArtist: jest.fn().mockResolvedValue(undefined),
      upsertAlbum: jest.fn().mockRejectedValue(persistenceError),
    } as any;
    const successfulProvider = {
      getAlbumById: jest.fn().mockResolvedValue(providerAlbum),
      searchAlbums: jest.fn(),
    } as AlbumCatalogProvider;

    await expect(
      new AlbumCatalogService(failingRepository, successfulProvider)
        .ensureAlbumCached("deezer", "42"),
    ).rejects.toBe(persistenceError);
  });

  it("deduplicates concurrent cache misses", async () => {
    let resolveProvider!: (value: ProviderAlbum) => void;
    const providerPromise = new Promise<ProviderAlbum>((resolve) => {
      resolveProvider = resolve;
    });
    const repository = {
      getAlbumById: jest.fn().mockResolvedValue(null),
      upsertArtist: jest.fn().mockResolvedValue(undefined),
      upsertAlbum: jest.fn().mockResolvedValue(catalogAlbum),
    } as any;
    const provider = {
      getAlbumById: jest.fn().mockReturnValue(providerPromise),
      searchAlbums: jest.fn(),
    } as AlbumCatalogProvider;
    const service = new AlbumCatalogService(repository, provider);

    const first = service.ensureAlbumCached("deezer", "42");
    const second = service.ensureAlbumCached("deezer", "42");
    resolveProvider(providerAlbum);

    await expect(Promise.all([first, second])).resolves.toEqual([catalogAlbum, catalogAlbum]);
    expect(provider.getAlbumById).toHaveBeenCalledTimes(1);
  });
});
