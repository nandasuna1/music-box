// src/services/getAlbumById.ts
import { formatReleaseDate } from "@/utils/dataFormatter";
import { deezerApi } from "./deezer";

export type DeezerTrack = {
  id: number;
  title: string;
  duration: number;
};

export type DeezerAlbumDetail = {
  id: number;
  title: string;
  cover_big: string;
  release_date: string;
  artist: {
    id: number;
    name: string;
  };
  tracks: {
    data: DeezerTrack[];
  };
};

export async function getAlbumById(
  albumId: string | number,
): Promise<DeezerAlbumDetail> {
  const response = await deezerApi.get(`/album/${albumId}`);
  const { data } = response;
  const formattedResponse = {
    ...data,
    release_date: formatReleaseDate(data.release_date),
  };
  return formattedResponse;
}
