import { ListenLaterRepository } from "@/features/listen-later/listen-later.repository";
import { AlbumCatalogService } from "@/features/album-catalog/album-catalog.service";
import { auth } from "@/services/providers/firebase/firebase";
import { DeezerAlbum } from "@/types/DeezerTypes";
import { logger } from "@/utils/logger/logger";

export async function addToListenLater( album: DeezerAlbum, provider = 'deezer'): Promise<boolean> {
  
  const user = auth.currentUser;
  logger.log("addToListenLater", { user, album, provider });

  if (!user) {
    throw new Error("Not authenticated");
  }

  const albumId = album.id.toString();
  await new AlbumCatalogService().ensureAlbumCached(provider, albumId);

  const listenLaterRepository = new ListenLaterRepository();
  return listenLaterRepository.addToListenLater(user.uid, provider, albumId);

}