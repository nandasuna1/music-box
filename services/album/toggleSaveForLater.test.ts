import { auth } from "@/services/firebase";
import { DeezerAlbumDetail } from "./getAlbumById";
import { toggleSaveForLater } from "./toggleSaveForLater";

const mockRunTransaction = jest.fn();
const mockTransaction = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

jest.mock("@/services/firebase", () => ({
  auth: { currentUser: { uid: "user-123" } },
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((...segments: unknown[]) => ({
    path: segments.slice(1).join("/"),
  })),
  runTransaction: (...args: any[]) => mockRunTransaction(...args),
  serverTimestamp: jest.fn(() => "server-timestamp"),
}));

const album = {
  id: 42,
  title: "Album",
  cover_big: "https://example.com/cover.jpg",
  artist: { id: 7, name: "Artist" },
} as DeezerAlbumDetail;

function snapshot(exists: boolean, value: Record<string, unknown> = {}) {
  return {
    exists: () => exists,
    data: () => value,
  };
}

describe("toggleSaveForLater", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunTransaction.mockImplementation(async (_db, callback) => {
      return callback(mockTransaction as never);
    });
  });

  it("creates the save records and increments the profile count when unsaved", async () => {
    mockTransaction.get.mockImplementation(async (ref: { path: string }) => {
      if (ref.path === "saveForLater/user-123_42") return snapshot(false);
      return snapshot(true, { listenLaterCount: 2 });
    });

    const result = await toggleSaveForLater(album);

    expect(result.isSaved).toBe(true);
    expect(mockTransaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ path: "saveForLater/user-123_42" }),
      expect.objectContaining({ userId: "user-123", albumId: 42 }),
      { merge: true },
    );
    expect(mockTransaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/user-123" }),
      { listenLaterCount: 3 },
      { merge: true },
    );
    expect(mockTransaction.delete).not.toHaveBeenCalled();
  });

  it("deletes both save records and decrements the profile count when saved", async () => {
    mockTransaction.get.mockImplementation(async (ref: { path: string }) => {
      if (ref.path === "saveForLater/user-123_42") return snapshot(true);
      return snapshot(true, { listenLaterCount: 2 });
    });

    const result = await toggleSaveForLater(album);

    expect(result.isSaved).toBe(false);
    expect(mockTransaction.delete).toHaveBeenCalledTimes(2);
    expect(mockTransaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/user-123" }),
      { listenLaterCount: 1 },
      { merge: true },
    );
  });

  it("does not decrement the profile count below zero", async () => {
    mockTransaction.get.mockImplementation(async (ref: { path: string }) => {
      if (ref.path === "saveForLater/user-123_42") return snapshot(true);
      return snapshot(true, { listenLaterCount: 0 });
    });

    await toggleSaveForLater(album);

    expect(mockTransaction.set).toHaveBeenCalledWith(
      expect.objectContaining({ path: "users/user-123" }),
      { listenLaterCount: 0 },
      { merge: true },
    );
  });
});
