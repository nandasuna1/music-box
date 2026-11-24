export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      album_catalog: {
        Row: {
          album_id: string;
          album_title: string;
          artist_id: string | null;
          cached_at: string;
          contributors: string[] | null;
          cover_url: string | null;
          created_at: string;
          genre_id: string | null;
          id: string;
          last_fetched_at: string | null;
          link_url: string | null;
          provider: string;
          share_url: string | null;
          source: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          album_id: string;
          album_title: string;
          artist_id?: string | null;
          cached_at?: string;
          contributors?: string[] | null;
          cover_url?: string | null;
          created_at?: string;
          genre_id?: string | null;
          id?: string;
          last_fetched_at?: string | null;
          link_url?: string | null;
          provider: string;
          share_url?: string | null;
          source?: string;
          updated_at?: string;
        };
        Update: {
          album_id?: string;
          album_title?: string;
          artist_id?: string | null;
          cached_at?: string;
          contributors?: string[] | null;
          cover_url?: string | null;
          created_at?: string;
          genre_id?: string | null;
          id?: string;
          last_fetched_at?: string | null;
          link_url?: string | null;
          provider?: string;
          share_url?: string | null;
          source?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "album_catalog_artist_fkey";
            columns: ["provider", "artist_id"];
            isOneToOne: false;
            referencedRelation: "artist";
            referencedColumns: ["provider", "artist_id"];
          },
        ];
      };
      album_reviews: {
        Row: {
          album_id: string;
          comment: string | null;
          created_at: string;
          id: string;
          provider: string;
          rating: number;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          album_id: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          provider?: string;
          rating: number;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          album_id?: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          provider?: string;
          rating?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "album_reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["firebase_uid"];
          },
        ];
      };
      artist: {
        Row: {
          artist_id: string;
          artist_name: string;
          created_at: string;
          id: string;
          picture_url: string | null;
          provider: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          artist_id: string;
          artist_name: string;
          created_at?: string;
          id?: string;
          picture_url?: string | null;
          provider: string;
          updated_at?: string;
        };
        Update: {
          artist_id?: string;
          artist_name?: string;
          created_at?: string;
          id?: string;
          picture_url?: string | null;
          provider?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      listen_later: {
        Row: {
          album_id: string;
          created_at: string;
          provider: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          album_id: string;
          created_at?: string;
          provider?: string;
          user_id?: string;
        };
        Update: {
          album_id?: string;
          created_at?: string;
          provider?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "listen_later_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profile";
            referencedColumns: ["firebase_uid"];
          },
        ];
      };
      profile: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          firebase_uid: string;
        };
        ComputedFields: never;
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          firebase_uid: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          firebase_uid?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
