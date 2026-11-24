jest.mock("../providers/firebase/firebase", () => ({
  auth: { currentUser: { uid: "firebase-user" } },
}));
jest.mock("@/features/reviews/review.repository", () => ({
  ReviewRepository: jest.fn(),
}));
jest.mock("@/features/album-catalog/album-catalog.service", () => ({
  AlbumCatalogService: jest.fn(),
}));
jest.mock("@/lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

import { ReviewRepository } from "@/features/reviews/review.repository";
import { AlbumCatalogService } from "@/features/album-catalog/album-catalog.service";
import { supabase } from "@/lib/supabase";
import { getReviewsByUserId } from "./getReviewsByUserId";
import { upsertAlbumReview } from "./upsertAlbumReview";

describe("review services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReset();
  });

  it("returns an empty array when the user has no reviews", async () => {
    (ReviewRepository as jest.Mock).mockImplementation(() => ({
      getReviewsByUserId: jest.fn().mockResolvedValue([]),
    }));

    await expect(getReviewsByUserId("firebase-user")).resolves.toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("combines reviews with catalog album metadata", async () => {
    (ReviewRepository as jest.Mock).mockImplementation(() => ({
      getReviewsByUserId: jest.fn().mockResolvedValue([{
        album_id: "42",
        provider: "deezer",
        rating: 4,
        comment: "Good",
        updated_at: "2026-01-02T00:00:00Z",
      }]),
    }));
    const catalogQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [{
          album_id: "42",
          album_title: "Test Album",
          artist_id: "7",
          cover_url: "cover",
        }],
        error: null,
      }),
    };
    (supabase.from as jest.Mock).mockReturnValue(catalogQuery);

    await expect(getReviewsByUserId("firebase-user", 3)).resolves.toEqual([{
      albumId: 42,
      title: "Test Album",
      artist: "7",
      cover: "cover",
      rating: 4,
      comment: "Good",
      ratedAt: "2026-01-02T00:00:00Z",
    }]);
    expect(catalogQuery.eq).toHaveBeenCalledWith("provider", "deezer");
  });

  it("throws if catalog metadata lookup fails", async () => {
    (ReviewRepository as jest.Mock).mockImplementation(() => ({
      getReviewsByUserId: jest.fn().mockResolvedValue([{ album_id: "42" }]),
    }));
    const query = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({ data: null, error: { message: "offline" } }),
    };
    (supabase.from as jest.Mock).mockReturnValue(query);

    await expect(getReviewsByUserId("firebase-user")).rejects.toThrow(
      "Failed to fetch review albums: offline",
    );
  });

  it("ensures catalog persistence before upserting the user's review", async () => {
    const calls: string[] = [];
    (AlbumCatalogService as jest.Mock).mockImplementation(() => ({
      ensureAlbumCached: jest.fn(async () => {
        calls.push("catalog");
        return {};
      }),
    }));
    const savedReview = { album_id: "42", rating: 5 };
    (ReviewRepository as jest.Mock).mockImplementation(() => ({
      upsertReview: jest.fn(async () => {
        calls.push("review");
        return savedReview;
      }),
    }));

    await expect(upsertAlbumReview("42", 5, "Excellent")).resolves.toBe(savedReview);
    expect(calls).toEqual(["catalog", "review"]);
  });

  it("does not write a review if catalog persistence fails", async () => {
    (AlbumCatalogService as jest.Mock).mockImplementation(() => ({
      ensureAlbumCached: jest.fn().mockRejectedValue(new Error("catalog unavailable")),
    }));
    const upsertReview = jest.fn();
    (ReviewRepository as jest.Mock).mockImplementation(() => ({ upsertReview }));

    await expect(upsertAlbumReview("42", 5, "")).rejects.toThrow("catalog unavailable");
    expect(upsertReview).not.toHaveBeenCalled();
  });
});
