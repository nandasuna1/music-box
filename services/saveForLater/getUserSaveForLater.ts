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
    .sort(
      (a, b) =>
        (b.data().savedAt?.toMillis() ?? 0) -
        (a.data().savedAt?.toMillis() ?? 0),
    )
    .slice(0, max)
    .map((doc) => {
      const data = doc.data();

      return {
        albumId: data.albumId,
        title: data.album.title,
        artist: data.album.artist,
        cover: data.album.cover,
        savedAt: data.savedAt.toDate().toISOString(),
      };
    });
}
