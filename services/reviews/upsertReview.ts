import { auth, db } from "@/services/firebase";
import { AlbumRating } from "@/types/Album";
import {
  doc,
  increment,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

export async function upsertReview(review: AlbumRating) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const reviewId = `${user.uid}_${review.albumId}`;

  const userRef = doc(db, "users", user.uid);
  const reviewRef = doc(db, "reviews", reviewId);
  const userReviewRef = doc(db, "users", user.uid, "reviews", reviewId);

  await runTransaction(db, async (transaction) => {
    const reviewSnap = await transaction.get(reviewRef);
    const isNewReview = !reviewSnap.exists();

    // 1️⃣ Review global
    transaction.set(
      reviewRef,
      {
        ...review,
        userId: user.uid,
        albumId: review.albumId,
        ratedAt: serverTimestamp(),
      },
      { merge: true },
    );

    // 2️⃣ Ponteiro no usuário
    transaction.set(
      userReviewRef,
      {
        albumId: review.albumId,
        reviewId,
        ratedAt: serverTimestamp(),
      },
      { merge: true },
    );

    // 3️⃣ Contador só se for nova review
    if (isNewReview) {
      transaction.update(userRef, {
        reviewsCount: increment(1),
      });
    }
  });

  return {
    id: reviewId,
    ...review,
  };
}
