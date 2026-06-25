export type ListenLaterAlbum = {
  albumId: number;
  addedAt: string;
};

export type AlbumRating = {
  albumId: number;
  title: string;
  artist: string;
  cover: string;
  rating: number; // 1–5
  comment?: string;
  ratedAt: string;
};
