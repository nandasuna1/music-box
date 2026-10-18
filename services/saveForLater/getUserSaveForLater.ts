import { db } from "@/services/firebase";
import { SaveForLaterAlbum } from "@/types/Album";
import { collection, getDocs, query, where } from "firebase/firestore";

export async function getUserSaveForLater(
  userId: string,
  max = 3,
): Promise<SaveForLaterAlbum[]> {
  const q = query(
    collection(db, "saveForLater"),
    where("userId", "==", userId),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const savedAt = data.savedAt.toDate();

      return {
        album: {
          albumId: data.albumId,
          title: data.album.title,
          artist: data.album.artist,
          cover: data.album.cover,
          savedAt: savedAt.toISOString(),
        },
        savedAtMillis: savedAt.getTime(),
      };
    })
    .sort((a, b) => b.savedAtMillis - a.savedAtMillis)
    .slice(0, max)
    .map(({ album }) => album);
}
