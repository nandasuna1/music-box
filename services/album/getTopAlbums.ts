// src/services/getTopAlbums.ts
import { deezerApi } from "../deezer";

export type DeezerAlbum = {
  id: number;
  title: string;
  cover_medium: string;
  artist: {
    id: number;
    name: string;
  };
};

export async function getTopAlbums(
  limit: number = 20,
  offset: number = 0,
): Promise<DeezerAlbum[]> {
  const response = await deezerApi.get("/chart/0/albums", {
    params: {
      limit,
      index: offset,
    },
  });

  // Deezer retorna { data: Album[] }
  return response.data.data;
}
