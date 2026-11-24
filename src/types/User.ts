// types/UserProfile.ts

export type UserProfile = {
  uid: string;
  name: string | null;
  email: string | null;
  photoURL: string | null;

  reviewsCount: number;
  listenLaterCount: number;

  //   lastReviews: AlbumRating[]; // só 3
  //   createdAt: Date;
};
