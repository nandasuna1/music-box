// src/features/albums/album.types.ts

import type { Database } from '@/types/database.types'

export type Artist =
  Database['public']['Tables']['artist']['Row']

export type ArtistInsert =
  Database['public']['Tables']['artist']['Insert']

export type ArtistUpdate =
  Database['public']['Tables']['artist']['Update']