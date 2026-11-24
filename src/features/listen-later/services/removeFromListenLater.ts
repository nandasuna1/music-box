import { ListenLaterRepository } from "@/features/listen-later/listen-later.repository";
import { auth } from "@/services/providers/firebase/firebase";

export async function removeFromListenLater(albumId: number, provider = 'deezer'): Promise<boolean> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Not authenticated");
  }

  const listenLaterRepository = new ListenLaterRepository();
  const result = await listenLaterRepository.removeFromListenLater(currentUser.uid, provider, albumId.toString());

  return !!result;
}