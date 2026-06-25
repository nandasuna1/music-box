import { auth, db } from "@/services/firebase";
import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { DeezerAlbumDetail } from "./getAlbumById";

export async function upsertSaveForLater(albumn: DeezerAlbumDetail) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const saveForLaterId = `${user.uid}_${albumn.id}`;

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
        albumId: albumn.id,
        album: {
          title: albumn.title,
          cover: albumn.cover_big,
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
        albumId: albumn.id,
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
    albumnId: albumn.id,
    id: saveForLaterId,
  };
}
