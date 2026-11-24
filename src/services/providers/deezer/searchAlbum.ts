import { DeezerAlbum } from "../../../types/DeezerTypes";
import { deezerApi } from "./deezer";

export async function searchAlbums(query: string): Promise<DeezerAlbum[]> {
  const response = await deezerApi.get("/search/album", {
    params: { q: query },
  });

  return response.data.data;
}
