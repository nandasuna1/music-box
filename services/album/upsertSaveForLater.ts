import { auth, db } from "@/services/firebase";
import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { DeezerAlbumDetail } from "./getAlbumById";

export async function upsertSaveForLater(album: DeezerAlbumDetail) {
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

  await runTransaction(db, async (transaction) => {
    const reviewSnap = await transaction.get(saveForLaterRef);
    const isNewReview = !reviewSnap.exists();

    // 1️⃣ Review global
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

    // 2️⃣ Ponteiro no usuário
    transaction.set(
      userSaveForLaterRef,
      {
        saveForLaterId,
        albumId: album.id,
        savedAt: serverTimestamp(),
      },
      { merge: true },
    );

    // 3️⃣ Contador só se for nova review
    if (isNewReview) {
      transaction.update(userRef, {
        listenLaterCount: increment(1),
      });
    }
  });

  return {
    albumId: album.id,
    id: saveForLaterId,
  };
}
