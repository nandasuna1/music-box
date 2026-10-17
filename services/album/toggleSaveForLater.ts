import { auth, db } from "@/services/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { DeezerAlbumDetail } from "./getAlbumById";

export async function toggleSaveForLater(album: DeezerAlbumDetail) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const saveForLaterId = `${user.uid}_${album.id}`;

  const userRef = doc(db, "users", user.uid);
  const saveForLaterRef = doc(db, "saveForLater", saveForLaterId);
  const userSaveForLaterRef = doc(
    db,
    "users",
    user.uid,
    "saveForLater",
    saveForLaterId,
  );

  return runTransaction(db, async (transaction) => {
    const saveForLaterSnap = await transaction.get(saveForLaterRef);
    const userSnap = await transaction.get(userRef);
    const currentCount = Number(userSnap.data()?.listenLaterCount) || 0;
    const isSaved = !saveForLaterSnap.exists();

    if (isSaved) {
      transaction.set(
        saveForLaterRef,
        {
          userId: user.uid,
          albumId: album.id,
          album: {
            title: album.title,
            cover: album.cover_big,
            artist: album.artist.name,
          },
          savedAt: serverTimestamp(),
        },
        { merge: true },
      );

      transaction.set(
        userSaveForLaterRef,
        {
          saveForLaterId,
          albumId: album.id,
          savedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } else {
      transaction.delete(saveForLaterRef);
      transaction.delete(userSaveForLaterRef);
    }

    transaction.set(
      userRef,
      {
        listenLaterCount: Math.max(0, currentCount + (isSaved ? 1 : -1)),
      },
      { merge: true },
    );

    return {
      albumId: album.id,
      id: saveForLaterId,
      isSaved,
    };
  });
}
