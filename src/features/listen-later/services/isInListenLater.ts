import { ListenLaterRepository } from "@/features/listen-later/listen-later.repository";
import { auth } from "@/services/providers/firebase/firebase";

export async function isInListenLater(albumId: number, provider = 'deezer'): Promise<boolean> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Not authenticated");
  }

  const listenLaterRepository = new ListenLaterRepository();
  return listenLaterRepository.isInListenLater(currentUser.uid, provider, albumId.toString());
}