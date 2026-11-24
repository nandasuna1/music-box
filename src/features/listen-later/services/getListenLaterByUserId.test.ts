jest.mock("@/services/providers/firebase/firebase", () => ({
  auth: {
    currentUser: { uid: "firebase-user" },
  },
}));

jest.mock("@/features/listen-later/listen-later.repository", () => ({
  ListenLaterRepository: jest.fn(),
}));

jest.mock("@/features/album-catalog/album-catalog.service", () => ({
  AlbumCatalogService: jest.fn(),
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { ListenLaterRepository } from "@/features/listen-later/listen-later.repository";
import { AlbumCatalogService } from "@/features/album-catalog/album-catalog.service";
import { supabase } from "@/lib/supabase";
import { getListenLaterByUserId } from "./getListenLaterByUserId";

describe("getListenLaterByUserId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReset();
  });

  it("returns an empty list when the user has no saved albums", async () => {
    (ListenLaterRepository as jest.Mock).mockImplementation(() => ({
      getListenLaterByUserId: jest.fn().mockResolvedValue([]),
    }));

    await expect(getListenLaterByUserId()).resolves.toEqual([]);
  });

  it("resolves saved albums to catalog metadata and artist names", async () => {
    (ListenLaterRepository as jest.Mock).mockImplementation(() => ({
      getListenLaterByUserId: jest.fn().mockResolvedValue([
        {
          user_id: "firebase-user",
          provider: "deezer",
          album_id: "42",
          created_at: "2026-01-01",
        },
      ]),
    }));
    (AlbumCatalogService as jest.Mock).mockImplementation(() => ({
      ensureAlbumCached: jest.fn().mockResolvedValue({
        album_id: "42",
        album_title: "Test Album",
        artist_id: "7",
        cover_url: "cover",
      }),
    }));

    const artistChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [{ artist_id: "7", artist_name: "Test Artist" }],
        error: null,
      }),
    };
    (supabase.from as jest.Mock).mockReturnValueOnce(artistChain);

    await expect(getListenLaterByUserId()).resolves.toEqual([
      {
        albumId: "42",
        title: "Test Album",
        artist: "Test Artist",
        cover: "cover",
      },
    ]);
  });

  it("uses the catalog record returned by cache hydration when the relationship is uncached", async () => {
    (ListenLaterRepository as jest.Mock).mockImplementation(() => ({
      getListenLaterByUserId: jest.fn().mockResolvedValue([
        {
          user_id: "firebase-user",
          provider: "deezer",
          album_id: "1123748782",
          created_at: "2026-11-08",
        },
      ]),
    }));
    (AlbumCatalogService as jest.Mock).mockImplementation(() => ({
      ensureAlbumCached: jest.fn().mockResolvedValue({
        album_id: "1123748782",
        album_title: "No Sentimento em Brasília Vol. 1",
        artist_id: "123",
        cover_url: "cover-url",
      }),
    }));

    const artistChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [{ artist_id: "123", artist_name: "Henrique & Juliano" }],
        error: null,
      }),
    };
    (supabase.from as jest.Mock).mockReturnValueOnce(artistChain);

    await expect(getListenLaterByUserId()).resolves.toEqual([
      {
        albumId: "1123748782",
        title: "No Sentimento em Brasília Vol. 1",
        artist: "Henrique & Juliano",
        cover: "cover-url",
      },
    ]);
  });
});
