// src/features/albums/album.types.ts

import type { Database } from '@/types/database.types'

export type ListenLater =
  Database['public']['Tables']['listen_later']['Row']

export type ListenLaterInsert =
  Database['public']['Tables']['listen_later']['Insert']

export type ListenLaterUpdate =
  Database['public']['Tables']['listen_later']['Update']