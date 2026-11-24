// src/features/albums/album.types.ts

import type { Database } from '@/types/database.types'

export type AlbumCatalog =
  Database['public']['Tables']['album_catalog']['Row']

export type AlbumCatalogInsert =
  Database['public']['Tables']['album_catalog']['Insert']

export type AlbumCatalogUpdate =
  Database['public']['Tables']['album_catalog']['Update']

export type CatalogArtist = {
  provider: string
  artistId: string
  name: string
  pictureUrl: string | null
}

export type CatalogAlbum = {
  provider: string
  albumId: string
  title: string
  artistId: string
  coverUrl: string | null
  linkUrl: string | null
  shareUrl: string | null
  genreId: string | null
  contributors: string[]
}