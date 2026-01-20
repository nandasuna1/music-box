// src/services/getTopAlbums.ts
import { deezerApi } from "./deezer";

export type DeezerAlbum = {
  id: number;
  title: string;
  cover_medium: string;
  artist: {
    id: number;
    name: string;
  };
};

export async function getTopAlbums(): Promise<DeezerAlbum[]> {
  const response = await deezerApi.get("/chart/0/albums");

  // Deezer retorna { data: Album[] }
  return response.data.data;
}
