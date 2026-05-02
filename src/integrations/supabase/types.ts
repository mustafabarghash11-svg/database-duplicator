export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          best_rank: number | null
          bio: string | null
          created_at: string
          custom_title: string | null
          dev_notes: string | null
          discord_username: string | null
          display_name: string
          favorite_game: string | null
          id: string
          level: number
          points: number
          team_name: string | null
          tournaments_played: number
          tournaments_won: number
          updated_at: string
          user_id: string
          username: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          best_rank?: number | null
          bio?: string | null
          created_at?: string
          custom_title?: string | null
          dev_notes?: string | null
          discord_username?: string | null
          display_name: string
          favorite_game?: string | null
          id?: string
          level?: number
          points?: number
          team_name?: string | null
          tournaments_played?: number
          tournaments_won?: number
          updated_at?: string
          user_id: string
          username?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          best_rank?: number | null
          bio?: string | null
          created_at?: string
          custom_title?: string | null
          dev_notes?: string | null
          discord_username?: string | null
          display_name?: string
          favorite_game?: string | null
          id?: string
          level?: number
          points?: number
          team_name?: string | null
          tournaments_played?: number
          tournaments_won?: number
          updated_at?: string
          user_id?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_points: number
          stock: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_points: number
          stock?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_points?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      shop_orders: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          item_id: string
          points_spent: number
          status: Database["public"]["Enums"]["shop_order_status"]
          updated_at: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          item_id: string
          points_spent: number
          status?: Database["public"]["Enums"]["shop_order_status"]
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          item_id?: string
          points_spent?: number
          status?: Database["public"]["Enums"]["shop_order_status"]
          updated_at?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "shop_items"
            referencedColumns: ["id"]
          },
        ]
      }
      site_data: {
        Row: {
          data: Json
          id: string
          updated_at: string
        }
        Insert: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Update: {
          data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_registrations: {
        Row: {
          admin_notes: string | null
          age: number | null
          created_at: string
          discord_username: string | null
          id: string
          in_game_id: string | null
          notes: string | null
          real_name: string | null
          status: Database["public"]["Enums"]["registration_status"]
          team_id: string | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          age?: number | null
          created_at?: string
          discord_username?: string | null
          id?: string
          in_game_id?: string | null
          notes?: string | null
          real_name?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          team_id?: string | null
          tournament_id: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          age?: number | null
          created_at?: string
          discord_username?: string | null
          id?: string
          in_game_id?: string | null
          notes?: string | null
          real_name?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          team_id?: string | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_teams: {
        Row: {
          captain_user_id: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          tournament_id: string
          updated_at: string
        }
        Insert: {
          captain_user_id?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          tournament_id: string
          updated_at?: string
        }
        Update: {
          captain_user_id?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          description: string | null
          game: string
          id: string
          image_url: string | null
          max_participants: number
          prize: string | null
          start_date: string
          status: Database["public"]["Enums"]["tournament_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          game: string
          id?: string
          image_url?: string | null
          max_participants?: number
          prize?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["tournament_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          game?: string
          id?: string
          image_url?: string | null
          max_participants?: number
          prize?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitor_counter: {
        Row: {
          count: number
          id: number
          updated_at: string
        }
        Insert: {
          count?: number
          id?: number
          updated_at?: string
        }
        Update: {
          count?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_increment_wins: {
        Args: { _delta?: number; _user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_visitor_count: { Args: never; Returns: number }
      redeem_shop_item: {
        Args: { _item_id: string; _user_notes: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      registration_status: "pending" | "approved" | "rejected"
      shop_order_status: "pending" | "fulfilled" | "cancelled"
      tournament_status:
        | "upcoming"
        | "open"
        | "in_progress"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      registration_status: ["pending", "approved", "rejected"],
      shop_order_status: ["pending", "fulfilled", "cancelled"],
      tournament_status: [
        "upcoming",
        "open",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
