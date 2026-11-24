jest.mock("@/features/album-catalog/album-catalog.repository", () => ({
  AlbumCatalogRepository: jest.fn(),
}));
jest.mock("@/features/artist/artist.respository", () => ({
  ArtistRepository: jest.fn(),
}));

import { AlbumCatalogRepository } from "@/features/album-catalog/album-catalog.repository";
import { ArtistRepository } from "@/features/artist/artist.respository";
import { updateDatabaseCatalog } from "../actions";
import { upsertAlbumCatalog } from "./upsertAlbumCatalog";

const album = {
  id: 42,
  title: "Test Album",
  cover_medium: "cover",
  artist: { id: 7, name: "Test Artist", picture_small: "artist-picture" },
  contributors: [{ id: 8, name: "Guest", picture_small: "" }],
  created_at: "2026-01-01",
  genre_id: 3,
  link_url: "album-link",
  share_url: "share-link",
};

describe("catalog services", () => {
  beforeEach(() => jest.clearAllMocks());

  it("upserts the artist before the album and maps Deezer metadata", async () => {
    const calls: string[] = [];
    const upsertArtist = jest.fn(async () => { calls.push("artist"); });
    const upsertAlbum = jest.fn(async () => {
      calls.push("album");
      return { album_id: "42", provider: "deezer" };
    });
    (AlbumCatalogRepository as jest.Mock).mockImplementation(() => ({
      upsertArtist,
      upsertAlbum,
    }));

    await expect(upsertAlbumCatalog("deezer", album as any)).resolves.toEqual({
      album_id: "42",
      provider: "deezer",
    });
    expect(calls).toEqual(["artist", "album"]);
    expect(upsertArtist).toHaveBeenCalledWith("deezer", {
      provider: "deezer",
      artistId: "7",
      name: "Test Artist",
      pictureUrl: "artist-picture",
    });
    expect(upsertAlbum).toHaveBeenCalledWith("deezer", expect.objectContaining({
      albumId: "42",
      title: "Test Album",
      artistId: "7",
      genreId: "3",
      contributors: ["8"],
    }));
  });

  it("returns both catalog and artist after synchronizing metadata", async () => {
    const calls: string[] = [];
    const albumRecord = { album_id: "42" };
    const artistRecord = { artist_id: "7" };
    (AlbumCatalogRepository as jest.Mock).mockImplementation(() => ({
      upsertArtist: jest.fn(async () => { calls.push("catalog-artist"); }),
      upsertAlbum: jest.fn(async () => {
        calls.push("album");
        return albumRecord;
      }),
    }));
    (ArtistRepository as jest.Mock).mockImplementation(() => ({
      upsertArtist: jest.fn(async () => {
        calls.push("artist");
        return artistRecord;
      }),
    }));

    await expect(updateDatabaseCatalog("deezer", album as any)).resolves.toEqual({
      album: albumRecord,
      artist: artistRecord,
    });
    expect(calls).toEqual(["catalog-artist", "album", "artist"]);
  });
});
