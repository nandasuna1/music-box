// src/services/getTopAlbums.ts
import { DeezerAlbum } from "../../../types/DeezerTypes";
import { deezerApi } from "./deezer";


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

  return response.data.data;
}
