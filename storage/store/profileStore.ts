// src/store/profileStore.ts
import { AlbumRating } from "@/types/Album";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AlbumReview = {
  albumId: number;
  rating: number;
  comment?: string;
  reviewedAt: string;
};

type ListenLaterAlbum = {
  albumId: number;
  addedAt: string;
};

type ProfileStore = {
  reviews: AlbumRating[];
  listenLater: ListenLaterAlbum[];

  upsertReview: (review: AlbumRating) => void;
  getReviewByAlbumId: (albumId: number) => AlbumRating | undefined;

  addToListenLater: (albumId: number) => void;
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      reviews: [],
      listenLater: [],

      upsertReview: (review) =>
        set((state) => {
          const exists = state.reviews.some(
            (r) => r.albumId === review.albumId,
          );

          if (exists) {
            return {
              reviews: state.reviews.map((r) =>
                r.albumId === review.albumId ? review : r,
              ),
            };
          }

          return {
            reviews: [...state.reviews, review],
          };
        }),

      getReviewByAlbumId: (albumId) =>
        get().reviews.find((r) => r.albumId === albumId),

      addToListenLater: (albumId) =>
        set((state) => ({
          listenLater: [
            ...state.listenLater,
            { albumId, addedAt: new Date().toISOString() },
          ],
        })),
    }),
    {
      name: "profile-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
