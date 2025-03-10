export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      api_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key_name: string
          key_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key_name: string
          key_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key_name?: string
          key_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_failures: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          payment_intent_id: string | null
          reason: string | null
          resolved: boolean | null
          resolved_at: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_intent_id?: string | null
          reason?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_intent_id?: string | null
          reason?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          tier_access: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          tier_access?: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          tier_access?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: []
      }
      prompts: {
        Row: {
          category_id: string
          created_at: string
          difficulty_level: Database["public"]["Enums"]["difficulty_level"]
          explanation: string | null
          explanation_enabled: boolean | null
          id: string
          image_url: string | null
          prompt_text: string
          short_description: string | null
          tier_access: Database["public"]["Enums"]["subscription_tier"]
          title: string
          updated_at: string
          why_it_works: string
        }
        Insert: {
          category_id: string
          created_at?: string
          difficulty_level: Database["public"]["Enums"]["difficulty_level"]
          explanation?: string | null
          explanation_enabled?: boolean | null
          id?: string
          image_url?: string | null
          prompt_text: string
          short_description?: string | null
          tier_access?: Database["public"]["Enums"]["subscription_tier"]
          title: string
          updated_at?: string
          why_it_works: string
        }
        Update: {
          category_id?: string
          created_at?: string
          difficulty_level?: Database["public"]["Enums"]["difficulty_level"]
          explanation?: string | null
          explanation_enabled?: boolean | null
          id?: string
          image_url?: string | null
          prompt_text?: string
          short_description?: string | null
          tier_access?: Database["public"]["Enums"]["subscription_tier"]
          title?: string
          updated_at?: string
          why_it_works?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "prompt_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_prompts: {
        Row: {
          created_at: string | null
          id: string
          prompt_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          prompt_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          prompt_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_prompts_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          new_tier: string | null
          old_tier: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          new_tier?: string | null
          old_tier?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          new_tier?: string | null
          old_tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          name: string
          price_monthly: number
          price_yearly: number
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          features: Json
          id?: string
          name: string
          price_monthly: number
          price_yearly: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          name?: string
          price_monthly?: number
          price_yearly?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          brightness: number
          contrast: number
          created_at: string
          id: string
          is_active: boolean
          is_dark: boolean
          preset_name: string
          saturation: number
          updated_at: string
        }
        Insert: {
          brightness?: number
          contrast?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_dark?: boolean
          preset_name: string
          saturation?: number
          updated_at?: string
        }
        Update: {
          brightness?: number
          contrast?: number
          created_at?: string
          id?: string
          is_active?: boolean
          is_dark?: boolean
          preset_name?: string
          saturation?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_prompt_usage: {
        Row: {
          count: number
          created_at: string
          id: string
          month: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          month: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          month?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_id: string
          payment_provider: string
          product_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_id: string
          payment_provider: string
          product_id: string
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_id?: string
          payment_provider?: string
          product_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          is_manually_created: boolean | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_manually_created?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          is_manually_created?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_active_theme: {
        Args: {
          mode: boolean
        }
        Returns: {
          brightness: number
          contrast: number
          created_at: string
          id: string
          is_active: boolean
          is_dark: boolean
          preset_name: string
          saturation: number
          updated_at: string
        }[]
      }
      get_user_subscription_tier: {
        Args: {
          user_uuid: string
        }
        Returns: Database["public"]["Enums"]["subscription_tier"]
      }
      has_remaining_prompts: {
        Args: {
          user_uuid: string
        }
        Returns: boolean
      }
      has_tier_access: {
        Args: {
          user_uuid: string
          required_tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Returns: boolean
      }
      increment_prompt_usage: {
        Args: {
          user_uuid: string
        }
        Returns: undefined
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_manual_subscription: {
        Args: {
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      difficulty_level: "Beginner" | "Intermediate" | "Advanced"
      subscription_tier: "free" | "pro" | "premium" | "enterprise"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
