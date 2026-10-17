import { auth } from "@/services/firebase";
import { getDoc } from "firebase/firestore";
import { getUserAlbumReview } from "./getUserAlbumReview";

jest.mock("@/services/firebase", () => ({
  auth: { currentUser: { uid: "user-123" } },
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn((...segments: string[]) => segments),
  getDoc: jest.fn(),
}));

describe("getUserAlbumReview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads the existing review by its user and album document ID", async () => {
    jest.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        albumId: 42,
        title: "Album",
        artist: "Artist",
        cover: "https://example.com/cover.jpg",
        rating: 4,
        comment: "Great record",
        ratedAt: {
          toDate: () => new Date("2026-10-17T00:00:00.000Z"),
        },
      }),
    } as never);

    await expect(getUserAlbumReview(42)).resolves.toEqual({
      albumId: 42,
      title: "Album",
      artist: "Artist",
      cover: "https://example.com/cover.jpg",
      rating: 4,
      comment: "Great record",
      ratedAt: "2026-10-17T00:00:00.000Z",
    });
    expect(getDoc).toHaveBeenCalledWith([{}, "reviews", "user-123_42"]);
  });

  it("returns null when the review does not exist", async () => {
    jest.mocked(getDoc).mockResolvedValue({
      exists: () => false,
    } as never);

    await expect(getUserAlbumReview(42)).resolves.toBeNull();
  });

  it("returns null when there is no authenticated user", async () => {
    (auth as { currentUser: null }).currentUser = null;

    await expect(getUserAlbumReview(42)).resolves.toBeNull();
    expect(getDoc).not.toHaveBeenCalled();
  });
});
