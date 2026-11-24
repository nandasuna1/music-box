// src/features/albums/album.types.ts

import type { Database } from '@/types/database.types';

export type Review =
  Database['public']['Tables']['album_reviews']['Row']

export type ReviewInsert =
  Database['public']['Tables']['album_reviews']['Insert']

export type ReviewUpdate =
  Database['public']['Tables']['album_reviews']['Update']


export interface ReviewWithAlbum {
  albumId: string
  comment: string | null
  id: string 
  provider: string 
  rating: number;
  userId: string
  album: {
    id: string | null;
    title: string | null;
    artist: string | null;
    cover: string | null;
  } | null;
}