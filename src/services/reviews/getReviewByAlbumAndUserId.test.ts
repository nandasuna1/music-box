jest.mock("../providers/firebase/firebase", () => ({
  auth: {
    currentUser: { uid: "firebase-user" },
  },
}));

jest.mock("@/features/reviews/review.repository", () => ({
  ReviewRepository: jest.fn(),
}));

jest.mock("@/features/album-catalog/album-catalog.repository", () => ({
  AlbumCatalogRepository: jest.fn(),
}));

import { ReviewRepository } from "@/features/reviews/review.repository";
import { AlbumCatalogRepository } from "@/features/album-catalog/album-catalog.repository";
import { getReviewByAlbumAndUserId } from "./getReviewByAlbumAndUserId";

describe("getReviewByAlbumAndUserId", () => {
  it("returns null when the user has not reviewed the album", async () => {
    (ReviewRepository as jest.Mock).mockImplementation(() => ({
      getReviewByUserIdAndAlbumId: jest.fn().mockResolvedValue(null),
    }));

    await expect(getReviewByAlbumAndUserId("42")).resolves.toBeNull();
  });

  it("returns the review and resolved catalog metadata when it exists", async () => {
    (ReviewRepository as jest.Mock).mockImplementation(() => ({
      getReviewByUserIdAndAlbumId: jest.fn().mockResolvedValue({
        id: "review-id",
        user_id: "firebase-user",
        provider: "deezer",
        album_id: "42",
        rating: 5,
        comment: "Excellent",
      }),
    }));
    (AlbumCatalogRepository as jest.Mock).mockImplementation(() => ({
      getAlbumById: jest.fn().mockResolvedValue({
        id: "catalog-id",
        album_title: "Test Album",
        artist_id: "7",
        cover_url: "cover",
      }),
    }));

    await expect(getReviewByAlbumAndUserId("42")).resolves.toMatchObject({
      albumId: "42",
      rating: 5,
      comment: "Excellent",
      album: {
        title: "Test Album",
        artist: "7",
        cover: "cover",
      },
    });
  });
});
