export type ListenLaterAlbum = {
  albumId: string | null;
  addedAt: string | null;
};

export type AlbumRating = {
  albumId: number | null;
  title: string | null;
  artist: string | null;
  cover: string | null;
  rating: number | null; // 1–5
  comment?: string | null;
  ratedAt: string | null;
};

export type SaveForLaterAlbum = {
  albumId: string | null;
  title: string | null;
  artist: string | null;
  cover: string | null;
  savedAt: string | null;
};

export type Album = {
  albumId: string;
  title: string;
  artist: string;
  cover: string;
};

