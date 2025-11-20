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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      tech_blog_posts: {
        Row: {
          id: string
          user_id: string
          topic: string
          title: string
          content: string
          reference_url: string | null
          cover_image_url: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          topic: string
          title: string
          content: string
          reference_url?: string | null
          cover_image_url?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          topic?: string
          title?: string
          content?: string
          reference_url?: string | null
          cover_image_url?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_blog_posts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_engagement_status: {
        Row: {
          id: string
          user_id: string
          status: string
          commits_last_7days: number
          commits_last_14days: number
          last_commit_date: string | null
          recommended_message_type: string | null
          last_notified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status: string
          commits_last_7days?: number
          commits_last_14days?: number
          last_commit_date?: string | null
          recommended_message_type?: string | null
          last_notified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          commits_last_7days?: number
          commits_last_14days?: number
          last_commit_date?: string | null
          recommended_message_type?: string | null
          last_notified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "tech_blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "tech_blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_connections: {
        Row: {
          id: string
          user_id: string
          connected_user_id: string | null
          connected_company_id: string | null
          connection_type: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          connected_user_id?: string | null
          connected_company_id?: string | null
          connection_type: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          connected_user_id?: string | null
          connected_company_id?: string | null
          connection_type?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_connections_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_connections_connected_user_id_fkey"
            columns: ["connected_user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          discord_username: string | null
          email: string | null
          facebook_url: string | null
          full_name: string | null
          github_username: string | null
          id: string
          instagram_username: string | null
          interests: string | null
          line_avatar_url: string | null
          line_display_name: string | null
          line_friend_added: boolean | null
          line_friend_added_at: string | null
          line_user_id: string | null
          linkedin_url: string | null
          location: string | null
          portfolio_url: string | null
          skills: string | null
          twitter_username: string | null
          updated_at: string | null
          username: string | null
          website: string | null
          youtube_url: string | null
          github_access_token: string | null
          job_interest: string | null
          skill_level: string | null
          learning_goal: string | null
          graduation_year: number | null
          education: string | null
          main_role: string | null
          career_interests: Json | null
          tech_stack: Json | null
          tech_stack_experienced: Json | null
          career_goal: string | null
          work_values: Json | null
          preferred_locations: Json | null
          experience: string | null
          portfolio_projects: Json | null
          awards: string | null
          ai_perspective: string | null
          hard_skills: Json | null
          soft_skills: Json | null
          ai_usage_scenarios: Json | null
          ai_tools_experience: Json | null
          ai_interest_direction: string | null
          onboarding_completed: boolean | null
          profile_completion: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          discord_username?: string | null
          email?: string | null
          facebook_url?: string | null
          full_name?: string | null
          github_username?: string | null
          id: string
          instagram_username?: string | null
          interests?: string | null
          line_avatar_url?: string | null
          line_display_name?: string | null
          line_friend_added?: boolean | null
          line_friend_added_at?: string | null
          line_user_id?: string | null
          linkedin_url?: string | null
          location?: string | null
          portfolio_url?: string | null
          skills?: string | null
          twitter_username?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
          youtube_url?: string | null
          github_access_token?: string | null
          job_interest?: string | null
          skill_level?: string | null
          learning_goal?: string | null
          graduation_year?: number | null
          education?: string | null
          main_role?: string | null
          career_interests?: Json | null
          tech_stack?: Json | null
          tech_stack_experienced?: Json | null
          career_goal?: string | null
          work_values?: Json | null
          preferred_locations?: Json | null
          experience?: string | null
          portfolio_projects?: Json | null
          awards?: string | null
          ai_perspective?: string | null
          hard_skills?: Json | null
          soft_skills?: Json | null
          ai_usage_scenarios?: Json | null
          ai_tools_experience?: Json | null
          ai_interest_direction?: string | null
          onboarding_completed?: boolean | null
          profile_completion?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          discord_username?: string | null
          email?: string | null
          facebook_url?: string | null
          full_name?: string | null
          github_username?: string | null
          id?: string
          instagram_username?: string | null
          interests?: string | null
          line_avatar_url?: string | null
          line_display_name?: string | null
          line_friend_added?: boolean | null
          line_friend_added_at?: string | null
          line_user_id?: string | null
          linkedin_url?: string | null
          location?: string | null
          portfolio_url?: string | null
          skills?: string | null
          twitter_username?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
          youtube_url?: string | null
          github_access_token?: string | null
          job_interest?: string | null
          skill_level?: string | null
          learning_goal?: string | null
          graduation_year?: number | null
          education?: string | null
          main_role?: string | null
          career_interests?: Json | null
          tech_stack?: Json | null
          tech_stack_experienced?: Json | null
          career_goal?: string | null
          work_values?: Json | null
          preferred_locations?: Json | null
          experience?: string | null
          portfolio_projects?: Json | null
          awards?: string | null
          ai_perspective?: string | null
          hard_skills?: Json | null
          soft_skills?: Json | null
          ai_usage_scenarios?: Json | null
          ai_tools_experience?: Json | null
          ai_interest_direction?: string | null
          onboarding_completed?: boolean | null
          profile_completion?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
