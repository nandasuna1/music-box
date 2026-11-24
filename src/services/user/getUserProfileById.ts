import { UserRepository } from "@/features/user/user.repository";
import { UserProfile } from "@/features/user/user.types";
import { auth } from "@/services/providers/firebase/firebase";
import { getListenLaterByUserId } from "@/features/listen-later/services/getListenLaterByUserId";

export async function getUserProfileById(userId?: string): Promise<UserProfile | null> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Not authenticated");
  }
    
  const userRepository = new UserRepository();

  const userToFind = userId || currentUser.uid;

  const [user, listenLater] = await Promise.all([
    userRepository.getUserById(userToFind),
    getListenLaterByUserId(userToFind)
  ]);
  
  const listenLaterCount = listenLater.length;

  if (!user) {
    return null;
  }

  return {
    ...user,
    listenLaterCount,
    listenLater
  };
}