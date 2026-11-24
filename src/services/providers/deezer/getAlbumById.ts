// src/services/getAlbumById.ts
import { formatReleaseDate } from "@/utils/dataFormatter";
import { DeezerAlbumDetail } from "../../../types/DeezerTypes";
import { deezerApi } from "./deezer";


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
