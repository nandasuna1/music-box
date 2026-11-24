import { supabase } from "@/lib/supabase";
import { User } from "./user.types";

interface IUserRepository {
    getUserById(userId: string): Promise<User | null>;
}

export class UserRepository implements IUserRepository {
    async getUserById(userId: string): Promise<User | null> {
        const {data: user} = await supabase
            .from("profile")
            .select("*")
            .eq("firebase_uid", userId)
            .single();

        if (!user) {
            return null;
        }

        return {
            id: user.firebase_uid,
            name: user.display_name,
            avatar_url: user.avatar_url,
        };
    }
}