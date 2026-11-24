export type DeezerArtist = {
  id: number;
  name: string;
  picture_small: string;
};

export type DeezerAlbum = {
  id: number;
  title: string;
  cover_medium: string;
  artist: DeezerArtist;
  contributors: DeezerArtist[];
  created_at: string;
  genre_id: number;
  link_url: string;
  share_url: string;
};


export type DeezerTrack = {
  id: number;
  title: string;
  duration: number;
};

export interface DeezerAlbumDetail extends DeezerAlbum {
  cover_big: string;
  release_date: string;
  artist: DeezerArtist;
  tracks: {
    data: DeezerTrack[];
  };
};
