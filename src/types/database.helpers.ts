// src/types/database.helpers.ts

import type { Database } from './database.types'

export type Tables<
  TableName extends keyof Database['public']['Tables']
> = Database['public']['Tables'][TableName]['Row']

export type TablesInsert<
  TableName extends keyof Database['public']['Tables']
> = Database['public']['Tables'][TableName]['Insert']

export type TablesUpdate<
  TableName extends keyof Database['public']['Tables']
> = Database['public']['Tables'][TableName]['Update']