jest.mock("@/services/providers/firebase/firebase", () => ({
  auth: { currentUser: { uid: "firebase-user" } },
}));
jest.mock("@/features/listen-later/listen-later.repository", () => ({
  ListenLaterRepository: jest.fn(),
}));
jest.mock("@/features/album-catalog/album-catalog.service", () => ({
  AlbumCatalogService: jest.fn(),
}));
jest.mock("@/utils/logger/logger", () => ({
  logger: { log: jest.fn(), error: jest.fn() },
}));

import { AlbumCatalogService } from "@/features/album-catalog/album-catalog.service";
import { ListenLaterRepository } from "@/features/listen-later/listen-later.repository";
import { auth } from "@/services/providers/firebase/firebase";
import { addToListenLater } from "./addToListenLater";
import { isInListenLater } from "./isInListenLater";
import { removeFromListenLater } from "./removeFromListenLater";

const deezerAlbum = {
  id: 42,
  title: "Test Album",
  cover_medium: "cover",
  artist: { id: 7, name: "Test Artist", picture_small: "artist" },
  contributors: [],
  created_at: "2026-01-01",
  genre_id: 1,
  link_url: "link",
  share_url: "share",
};

describe("Listen Later services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as any).currentUser = { uid: "firebase-user" };
  });

  it("ensures the catalog exists before saving the relationship", async () => {
    const calls: string[] = [];
    (AlbumCatalogService as jest.Mock).mockImplementation(() => ({
      ensureAlbumCached: jest.fn(async () => {
        calls.push("catalog");
        return {};
      }),
    }));
    (ListenLaterRepository as jest.Mock).mockImplementation(() => ({
      addToListenLater: jest.fn(async () => {
        calls.push("listen-later");
        return true;
      }),
    }));

    await expect(addToListenLater(deezerAlbum)).resolves.toBe(true);

    expect(calls).toEqual(["catalog", "listen-later"]);
    expect(AlbumCatalogService).toHaveBeenCalled();
    expect(ListenLaterRepository).toHaveBeenCalled();
  });

  it("does not save the relationship if catalog persistence fails", async () => {
    (AlbumCatalogService as jest.Mock).mockImplementation(() => ({
      ensureAlbumCached: jest.fn().mockRejectedValue(new Error("catalog error")),
    }));
    const add = jest.fn();
    (ListenLaterRepository as jest.Mock).mockImplementation(() => ({
      addToListenLater: add,
    }));

    await expect(addToListenLater(deezerAlbum)).rejects.toThrow("catalog error");
    expect(add).not.toHaveBeenCalled();
  });

  it("removes the current user's album reference", async () => {
    const remove = jest.fn().mockResolvedValue(true);
    (ListenLaterRepository as jest.Mock).mockImplementation(() => ({
      removeFromListenLater: remove,
    }));

    await expect(removeFromListenLater(42)).resolves.toBe(true);
    expect(remove).toHaveBeenCalledWith("firebase-user", "deezer", "42");
  });

  it("checks membership for the current user and provider", async () => {
    const contains = jest.fn().mockResolvedValue(true);
    (ListenLaterRepository as jest.Mock).mockImplementation(() => ({
      isInListenLater: contains,
    }));

    await expect(isInListenLater(42, "deezer")).resolves.toBe(true);
    expect(contains).toHaveBeenCalledWith("firebase-user", "deezer", "42");
  });

  it("rejects mutations and membership checks without authentication", async () => {
    (auth as any).currentUser = null;

    await expect(addToListenLater(deezerAlbum)).rejects.toThrow("Not authenticated");
    await expect(removeFromListenLater(42)).rejects.toThrow("Not authenticated");
    await expect(isInListenLater(42)).rejects.toThrow("Not authenticated");
  });
});
