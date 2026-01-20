import { deezerApi } from "./deezer";
import { DeezerAlbum } from "./getTopCharts";

export async function searchAlbums(query: string): Promise<DeezerAlbum[]> {
  const response = await deezerApi.get("/search/album", {
    params: { q: query },
  });

  return response.data.data;
}
