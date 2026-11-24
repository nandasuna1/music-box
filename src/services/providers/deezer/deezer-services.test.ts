jest.mock("./deezer", () => ({
  deezerApi: { get: jest.fn() },
}));

import { deezerApi } from "./deezer";
import { getAlbumById } from "./getAlbumById";
import { getTopAlbums } from "./getTopAlbums";
import { searchAlbums } from "./searchAlbum";
import { DeezerCatalogProvider } from "./deezer-provider";

const deezerAlbum = {
  id: 42,
  title: "Test Album",
  cover_medium: "cover-medium",
  artist: { id: 7, name: "Test Artist", picture_small: "artist-picture" },
  contributors: [{ id: 8, name: "Guest", picture_small: "guest-picture" }],
  created_at: "2026-01-01",
  genre_id: 3,
  link_url: "album-link",
  share_url: "share-link",
};

describe("Deezer services", () => {
  beforeEach(() => jest.clearAllMocks());

  it("fetches chart albums with the requested limit and offset", async () => {
    (deezerApi.get as jest.Mock).mockResolvedValue({ data: { data: [deezerAlbum] } });

    await expect(getTopAlbums(10, 20)).resolves.toEqual([deezerAlbum]);
    expect(deezerApi.get).toHaveBeenCalledWith("/chart/0/albums", {
      params: { limit: 10, index: 20 },
    });
  });

  it("searches albums with the query", async () => {
    (deezerApi.get as jest.Mock).mockResolvedValue({ data: { data: [deezerAlbum] } });

    await expect(searchAlbums("test")).resolves.toEqual([deezerAlbum]);
    expect(deezerApi.get).toHaveBeenCalledWith("/search/album", {
      params: { q: "test" },
    });
  });

  it("fetches album details and formats the release date", async () => {
    const detail = { ...deezerAlbum, release_date: "2024-09-11", tracks: { data: [] } };
    (deezerApi.get as jest.Mock).mockResolvedValue({ data: detail });

    await expect(getAlbumById("42")).resolves.toMatchObject({
      id: 42,
      release_date: "09/2024",
    });
    expect(deezerApi.get).toHaveBeenCalledWith("/album/42");
  });

  it("maps provider responses to the app catalog contract", async () => {
    (deezerApi.get as jest.Mock).mockResolvedValue({ data: deezerAlbum });
    const provider = new DeezerCatalogProvider();

    await expect(provider.getAlbumById("42")).resolves.toEqual({
      provider: "deezer",
      albumId: "42",
      title: "Test Album",
      artistId: "7",
      artist: {
        provider: "deezer",
        artistId: "7",
        name: "Test Artist",
        pictureUrl: "artist-picture",
      },
      coverUrl: "cover-medium",
      linkUrl: "album-link",
      shareUrl: "share-link",
      genreId: "3",
      contributors: ["8"],
    });
    expect(deezerApi.get).toHaveBeenCalledWith("/album/42");
  });

  it("maps provider search results to app catalog records", async () => {
    (deezerApi.get as jest.Mock).mockResolvedValue({ data: { data: [deezerAlbum] } });

    await expect(new DeezerCatalogProvider().searchAlbums("test"))
      .resolves.toHaveLength(1);
    expect(deezerApi.get).toHaveBeenCalledWith("/search/album", {
      params: { q: "test" },
    });
  });
});
