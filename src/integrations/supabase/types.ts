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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bot_jobs: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string | null
          guild_id: string
          id: string
          payload: Json
          result: string | null
          run_after: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          guild_id: string
          id?: string
          payload?: Json
          result?: string | null
          run_after?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          created_by?: string | null
          guild_id?: string
          id?: string
          payload?: Json
          result?: string | null
          run_after?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      bot_leaderboards: {
        Row: {
          id: string
          snapshot: Json
          updated_at: string
        }
        Insert: {
          id: string
          snapshot?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          snapshot?: Json
          updated_at?: string
        }
        Relationships: []
      }
      credit_balances: {
        Row: {
          avatar: string | null
          credits: number
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar?: string | null
          credits?: number
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar?: string | null
          credits?: number
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          amount: number
          created_at: string
          from_avatar: string | null
          from_balance: number | null
          from_id: string | null
          from_name: string | null
          id: string
          kind: string
          note: string | null
          to_avatar: string | null
          to_balance: number | null
          to_id: string | null
          to_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          from_avatar?: string | null
          from_balance?: number | null
          from_id?: string | null
          from_name?: string | null
          id?: string
          kind: string
          note?: string | null
          to_avatar?: string | null
          to_balance?: number | null
          to_id?: string | null
          to_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          from_avatar?: string | null
          from_balance?: number | null
          from_id?: string | null
          from_name?: string | null
          id?: string
          kind?: string
          note?: string | null
          to_avatar?: string | null
          to_balance?: number | null
          to_id?: string | null
          to_name?: string | null
        }
        Relationships: []
      }
      daily_rewards: {
        Row: {
          amount: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_access: {
        Row: {
          created_at: string
          granted_by: string
          guild_id: string
          role: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          granted_by: string
          guild_id: string
          role: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          granted_by?: string
          guild_id?: string
          role?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      guild_embeds: {
        Row: {
          created_at: string
          data: Json
          guild_id: string
          id: string
          last_channel_id: string | null
          last_message_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json
          guild_id: string
          id?: string
          last_channel_id?: string | null
          last_message_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          guild_id?: string
          id?: string
          last_channel_id?: string | null
          last_message_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      guild_live: {
        Row: {
          guild_id: string
          live: Json
          updated_at: string
        }
        Insert: {
          guild_id: string
          live?: Json
          updated_at?: string
        }
        Update: {
          guild_id?: string
          live?: Json
          updated_at?: string
        }
        Relationships: []
      }
      guild_settings: {
        Row: {
          aliases: Json
          guild_id: string
          modules: Json
          ticket: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          aliases?: Json
          guild_id: string
          modules?: Json
          ticket?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          aliases?: Json
          guild_id?: string
          modules?: Json
          ticket?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      guild_telemetry: {
        Row: {
          guild_id: string
          snapshot: Json
          updated_at: string
        }
        Insert: {
          guild_id: string
          snapshot?: Json
          updated_at?: string
        }
        Update: {
          guild_id?: string
          snapshot?: Json
          updated_at?: string
        }
        Relationships: []
      }
      member_invites: {
        Row: {
          fake: boolean
          guild_id: string
          invited_id: string
          inviter_id: string
          joined_at: string | null
          left_at: string | null
          left_guild: boolean
          updated_at: string
        }
        Insert: {
          fake?: boolean
          guild_id: string
          invited_id: string
          inviter_id: string
          joined_at?: string | null
          left_at?: string | null
          left_guild?: boolean
          updated_at?: string
        }
        Update: {
          fake?: boolean
          guild_id?: string
          invited_id?: string
          inviter_id?: string
          joined_at?: string | null
          left_at?: string | null
          left_guild?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      member_notes: {
        Row: {
          author_id: string
          author_name: string | null
          body: string
          created_at: string
          guild_id: string
          id: string
          user_id: string
        }
        Insert: {
          author_id: string
          author_name?: string | null
          body: string
          created_at?: string
          guild_id: string
          id?: string
          user_id: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          body?: string
          created_at?: string
          guild_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      member_punishments: {
        Row: {
          created_at: string
          duration_seconds: number | null
          external_id: string | null
          guild_id: string
          id: string
          kind: string
          moderator_id: string | null
          moderator_name: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          external_id?: string | null
          guild_id: string
          id?: string
          kind: string
          moderator_id?: string | null
          moderator_name?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          external_id?: string | null
          guild_id?: string
          id?: string
          kind?: string
          moderator_id?: string | null
          moderator_name?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      member_stats: {
        Row: {
          avatar: string | null
          ban_reason: string | null
          banned: boolean
          banned_at: string | null
          created_at_discord: string | null
          display_name: string | null
          guild_id: string
          in_guild: boolean
          invites_fake: number
          invites_left: number
          invites_total: number
          is_booster: boolean
          joined_at: string | null
          level: number
          messages: number
          muted_until: string | null
          posts: number
          updated_at: string
          user_id: string
          username: string | null
          voice_seconds: number
          xp: number
        }
        Insert: {
          avatar?: string | null
          ban_reason?: string | null
          banned?: boolean
          banned_at?: string | null
          created_at_discord?: string | null
          display_name?: string | null
          guild_id: string
          in_guild?: boolean
          invites_fake?: number
          invites_left?: number
          invites_total?: number
          is_booster?: boolean
          joined_at?: string | null
          level?: number
          messages?: number
          muted_until?: string | null
          posts?: number
          updated_at?: string
          user_id: string
          username?: string | null
          voice_seconds?: number
          xp?: number
        }
        Update: {
          avatar?: string | null
          ban_reason?: string | null
          banned?: boolean
          banned_at?: string | null
          created_at_discord?: string | null
          display_name?: string | null
          guild_id?: string
          in_guild?: boolean
          invites_fake?: number
          invites_left?: number
          invites_total?: number
          is_booster?: boolean
          joined_at?: string | null
          level?: number
          messages?: number
          muted_until?: string | null
          posts?: number
          updated_at?: string
          user_id?: string
          username?: string | null
          voice_seconds?: number
          xp?: number
        }
        Relationships: []
      }
      music_state: {
        Row: {
          guild_id: string
          state: Json
          updated_at: string
        }
        Insert: {
          guild_id: string
          state?: Json
          updated_at?: string
        }
        Update: {
          guild_id?: string
          state?: Json
          updated_at?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "site_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_style: {
        Row: {
          background: string | null
          badges: Json
          bio: string | null
          color: string | null
          effect: string | null
          frame: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          background?: string | null
          badges?: Json
          bio?: string | null
          color?: string | null
          effect?: string | null
          frame?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          background?: string | null
          badges?: Json
          bio?: string | null
          color?: string | null
          effect?: string | null
          frame?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_items: {
        Row: {
          active: boolean
          emoji: string | null
          id: string
          kind: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          emoji?: string | null
          id: string
          kind: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          emoji?: string | null
          id?: string
          kind?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      shop_purchases: {
        Row: {
          created_at: string
          gifted_by: string | null
          id: string
          item_id: string
          price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          gifted_by?: string | null
          id?: string
          item_id: string
          price: number
          user_id: string
        }
        Update: {
          created_at?: string
          gifted_by?: string | null
          id?: string
          item_id?: string
          price?: number
          user_id?: string
        }
        Relationships: []
      }
      site_activity: {
        Row: {
          action: string
          created_at: string
          details: Json
          guild_id: string | null
          id: string
          user_id: string
          username: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          guild_id?: string | null
          id?: string
          user_id: string
          username?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          guild_id?: string | null
          id?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      site_posts: {
        Row: {
          author_id: string
          author_name: string | null
          body: string
          created_at: string
          id: string
          image_url: string | null
          title: string
        }
        Insert: {
          author_id: string
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          title: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string
        }
        Relationships: []
      }
      site_roles: {
        Row: {
          role: string
          user_id: string
        }
        Insert: {
          role: string
          user_id: string
        }
        Update: {
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      site_users: {
        Row: {
          avatar: string | null
          first_login: string
          last_login: string
          login_count: number
          user_id: string
          username: string | null
        }
        Insert: {
          avatar?: string | null
          first_login?: string
          last_login?: string
          login_count?: number
          user_id: string
          username?: string | null
        }
        Update: {
          avatar?: string | null
          first_login?: string
          last_login?: string
          login_count?: number
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      ticket_transcripts: {
        Row: {
          channel_id: string | null
          channel_name: string | null
          closed_at: string
          closed_by: string | null
          guild_id: string
          html: string
          id: string
          opened_at: string | null
          ticket_type: string | null
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          channel_name?: string | null
          closed_at?: string
          closed_by?: string | null
          guild_id: string
          html: string
          id?: string
          opened_at?: string | null
          ticket_type?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string | null
          channel_name?: string | null
          closed_at?: string
          closed_by?: string | null
          guild_id?: string
          html?: string
          id?: string
          opened_at?: string | null
          ticket_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar: string | null
          snapshot: Json
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar?: string | null
          snapshot?: Json
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar?: string | null
          snapshot?: Json
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_bot_jobs: {
        Args: { guild_ids: string[]; worker: string }
        Returns: {
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          created_by: string | null
          guild_id: string
          id: string
          payload: Json
          result: string | null
          run_after: string | null
          status: string
          type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "bot_jobs"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_daily_reward: {
        Args: { p_amount: number; p_user: string }
        Returns: {
          amount: number
          created_at: string
          id: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "daily_rewards"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      interaction_top: {
        Args: { p_limit?: number }
        Returns: {
          avatar: string
          messages: number
          user_id: string
          username: string
          voice_seconds: number
          xp: number
        }[]
      }
      member_totals: {
        Args: { p_user: string }
        Returns: {
          interaction_rank: number
          max_level: number
          messages: number
          voice_seconds: number
          xp: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
