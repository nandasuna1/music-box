import { UserRepository } from "@/features/user/user.repository";
import { User } from "@/features/user/user.types";
import { auth } from "@/services/providers/firebase/firebase";

export async function getUserById(userId?: string): Promise<User | null> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Not authenticated");
  }
    
  const userRepository = new UserRepository();

  const userToFind = userId || currentUser.uid;
  
  const user = await userRepository.getUserById(userToFind);

  if (!user) {
    return null;
  }

  return user;
}