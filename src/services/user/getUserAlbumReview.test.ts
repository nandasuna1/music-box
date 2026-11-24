jest.mock("@/services/providers/firebase/firebase", () => ({
  auth: { currentUser: { uid: "firebase-user" } },
  db: {},
}));
jest.mock("firebase/firestore", () => ({
  doc: jest.fn((...parts) => parts),
  getDoc: jest.fn(),
}));

import { auth, db } from "@/services/providers/firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { getUserAlbumReview } from "./getUserAlbumReview";

describe("getUserAlbumReview", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns null when the user is not authenticated", async () => {
    (auth as any).currentUser = null;

    await expect(getUserAlbumReview(42)).resolves.toBeNull();
    expect(getDoc).not.toHaveBeenCalled();
  });

  it("returns null when the review document does not exist", async () => {
    (auth as any).currentUser = { uid: "firebase-user" };
    (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

    await expect(getUserAlbumReview(42)).resolves.toBeNull();
    expect(doc).toHaveBeenCalledWith(db, "reviews", "firebase-user_42");
  });

  it("maps a stored review and timestamp to the app type", async () => {
    const date = new Date("2026-01-03T00:00:00Z");
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => ({
        albumId: 42,
        title: "Test Album",
        artist: "Test Artist",
        cover: "cover",
        rating: 4,
        comment: "Good",
        ratedAt: { toDate: () => date },
      }),
    });

    await expect(getUserAlbumReview(42)).resolves.toEqual({
      albumId: 42,
      title: "Test Album",
      artist: "Test Artist",
      cover: "cover",
      rating: 4,
      comment: "Good",
      ratedAt: date.toISOString(),
    });
  });

  it("propagates Firestore errors", async () => {
    const failure = new Error("Firestore unavailable");
    (getDoc as jest.Mock).mockRejectedValue(failure);

    await expect(getUserAlbumReview(42)).rejects.toBe(failure);
  });
});
