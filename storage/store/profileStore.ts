import { getUserRecentReviews } from "@/services/reviews/getUserRecentReviews";
import { getUserProfile } from "@/services/user/getUserProfile";
import { AlbumRating } from "@/types/Album";
import { UserProfile } from "@/types/User";
import { create } from "zustand";

type ProfileStore = {
  recentReviews: AlbumRating[];
  listenLaterPreview: AlbumRating[];
  profile: UserProfile | null;

  loading: boolean;

  loadProfile: (userId: string) => Promise<void>;
  reset: () => void;
};

export const useProfileStore = create<ProfileStore>((set) => ({
  recentReviews: [],
  listenLaterPreview: [],
  profile: null,

  loading: false,

  async loadProfile(userId) {
    set({ loading: true });

    const [recentReviews, profile] = await Promise.all([
      getUserRecentReviews(userId, 3),
      getUserProfile(userId),
    ]);

    set({
      recentReviews,
      profile,
      loading: false,
    });
  },

  reset() {
    set({
      recentReviews: [],
      listenLaterPreview: [],
      profile: null,
      loading: false,
    });
  },
}));
