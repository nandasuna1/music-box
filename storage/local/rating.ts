// src/storage/ratings.ts
import { AlbumRating } from "@/types/Album";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProfileStore } from "../store/profileStore";

const STORAGE_KEY = "@album_ratings";

export async function getAllRatings(): Promise<AlbumRating[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export async function getRatingByAlbumId(
  albumId: number,
): Promise<AlbumRating | undefined> {
  const ratings = await getAllRatings();
  return ratings.find((r) => r.albumId === albumId);
}

export async function saveRating(rating: AlbumRating) {
  const ratings = await getAllRatings();

  const updatedRatings = [
    ...ratings.filter((r) => r.albumId !== rating.albumId),
    rating,
  ];

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRatings));
}

// src/utils/migrateOldRatings.ts
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { useProfileStore } from "@/store/profileStore";

const OLD_KEY = "@album_ratings";
const MIGRATED_KEY = "@ratings_migrated";

export async function migrateOldRatings() {
  const migrated = await AsyncStorage.getItem(MIGRATED_KEY);
  if (migrated) return;

  const data = await AsyncStorage.getItem(OLD_KEY);
  if (!data) return;

  const oldRatings = JSON.parse(data);

  useProfileStore.setState((state) => ({
    reviews: [...state.reviews, ...oldRatings],
  }));

  await AsyncStorage.setItem(MIGRATED_KEY, "true");
}
