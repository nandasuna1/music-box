import { db } from "@/services/firebase";
import { SaveForLaterAlbum } from "@/types/Album";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

export async function getUserSaveForLater(
  userId?: string,
  max = 3,
): Promise<SaveForLaterAlbum[]> {
  const q = query(
    collection(db, "saveForLater"),
    where("userId", "==", userId),
    limit(max),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
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
