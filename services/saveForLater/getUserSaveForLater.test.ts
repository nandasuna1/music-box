import { getUserSaveForLater } from "./getUserSaveForLater";

const mockGetDocs = jest.fn();

jest.mock("@/services/firebase", () => ({ db: {} }));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  limit: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

function createSavedAlbum(albumId: number, savedAt: number) {
  return {
    data: () => ({
      albumId,
      album: {
        title: `Album ${albumId}`,
        artist: "Artist",
        cover: `https://example.com/${albumId}.jpg`,
      },
      savedAt: {
        toDate: () => new Date(savedAt),
        toMillis: () => savedAt,
      },
    }),
  };
}

describe("getUserSaveForLater", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the most recently saved albums up to the requested limit", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        createSavedAlbum(3, 2000),
        createSavedAlbum(2, 4000),
        createSavedAlbum(4, 3000),
      ],
    });

    const albums = await getUserSaveForLater("user-123", 3);

    expect(albums.map((album) => album.albumId)).toEqual([2, 4, 3]);
    expect(albums[0].savedAt).toBe(new Date(4000).toISOString());
  });

  it("sorts and limits results in memory without a composite Firestore index", async () => {
    const { orderBy } = jest.requireMock("firebase/firestore");
    mockGetDocs.mockResolvedValue({
      docs: [
        createSavedAlbum(5, 1000),
        createSavedAlbum(1, 5000),
        createSavedAlbum(3, 3000),
        createSavedAlbum(4, 2000),
      ],
    });

    const albums = await getUserSaveForLater("user-123", 2);

    expect(albums.map((album) => album.albumId)).toEqual([1, 3]);
    expect(orderBy).not.toHaveBeenCalled();
  });
});
