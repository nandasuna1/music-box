// src/features/user/user.types.ts

import { Album } from '@/types/Album';
import type { Database } from '@/types/database.types';


// FROM SUPABASE GENERATED TYPES
export type UserDB =
  Database['public']['Tables']['profile']['Row']

export type UserDBInsert =
  Database['public']['Tables']['profile']['Insert']

export type UserDBUpdate =
  Database['public']['Tables']['profile']['Update']

// CUSTOM TYPES
export interface User extends Omit<UserDB, 'firebase_uid' | 'display_name' | 'created_at'> {
  id: string;
  name: string | null;
}

export interface UserProfile extends User {
  listenLater: Album[];
  listenLaterCount: number;
}