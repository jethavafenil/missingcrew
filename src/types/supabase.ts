export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          access_token: string | null
          expires_at: number | null
          id: string
          id_token: string | null
          provider: string
          provider_account_id: string
          refresh_token: string | null
          scope: string | null
          session_state: string | null
          token_type: string | null
          type: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          expires_at?: number | null
          id: string
          id_token?: string | null
          provider: string
          provider_account_id: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          expires_at?: number | null
          id?: string
          id_token?: string | null
          provider?: string
          provider_account_id?: string
          refresh_token?: string | null
          scope?: string | null
          session_state?: string | null
          token_type?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          answers: Json
          applied_at: string
          crew_id: string
          crew_notes: string | null
          employer_notes: string | null
          id: string
          project_id: string
          status: Database["public"]["Enums"]["ApplicationStatus"]
        }
        Insert: {
          answers: Json
          applied_at?: string
          crew_id: string
          crew_notes?: string | null
          employer_notes?: string | null
          id: string
          project_id: string
          status?: Database["public"]["Enums"]["ApplicationStatus"]
        }
        Update: {
          answers?: Json
          applied_at?: string
          crew_id?: string
          crew_notes?: string | null
          employer_notes?: string | null
          id?: string
          project_id?: string
          status?: Database["public"]["Enums"]["ApplicationStatus"]
        }
        Relationships: [
          {
            foreignKeyName: "applications_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crew_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          requester_id: string
          status: Database["public"]["Enums"]["ConnectionStatus"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          receiver_id: string
          requester_id: string
          status?: Database["public"]["Enums"]["ConnectionStatus"]
          updated_at: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: Database["public"]["Enums"]["ConnectionStatus"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_profiles: {
        Row: {
          availability: boolean
          availability_end: string | null
          availability_start: string | null
          available_to_travel: boolean
          budget_range_max: number | null
          budget_range_min: number | null
          budgetFlexible: boolean
          city: string | null
          completed: boolean
          contact_whatsapp: string | null
          created_at: string
          daily_budget_max: number | null
          daily_budget_min: number | null
          id: string
          imdb_link: string | null
          languages: Json
          location: string | null
          past_projects: Json | null
          photo: string | null
          portfolio_links: Json
          primary_roles: Json
          project_types: Json
          referred_by: string | null
          subscription_tier: Database["public"]["Enums"]["SubscriptionTier"]
          terms_agreed: boolean
          trial_ends: string | null
          updated_at: string
          userId: string
          years_experience: string | null
        }
        Insert: {
          availability?: boolean
          availability_end?: string | null
          availability_start?: string | null
          available_to_travel?: boolean
          budget_range_max?: number | null
          budget_range_min?: number | null
          budgetFlexible?: boolean
          city?: string | null
          completed?: boolean
          contact_whatsapp?: string | null
          created_at?: string
          daily_budget_max?: number | null
          daily_budget_min?: number | null
          id: string
          imdb_link?: string | null
          languages: Json
          location?: string | null
          past_projects?: Json | null
          photo?: string | null
          portfolio_links: Json
          primary_roles: Json
          project_types: Json
          referred_by?: string | null
          subscription_tier?: Database["public"]["Enums"]["SubscriptionTier"]
          terms_agreed?: boolean
          trial_ends?: string | null
          updated_at: string
          userId: string
          years_experience?: string | null
        }
        Update: {
          availability?: boolean
          availability_end?: string | null
          availability_start?: string | null
          available_to_travel?: boolean
          budget_range_max?: number | null
          budget_range_min?: number | null
          budgetFlexible?: boolean
          city?: string | null
          completed?: boolean
          contact_whatsapp?: string | null
          created_at?: string
          daily_budget_max?: number | null
          daily_budget_min?: number | null
          id?: string
          imdb_link?: string | null
          languages?: Json
          location?: string | null
          past_projects?: Json | null
          photo?: string | null
          portfolio_links?: Json
          primary_roles?: Json
          project_types?: Json
          referred_by?: string | null
          subscription_tier?: Database["public"]["Enums"]["SubscriptionTier"]
          terms_agreed?: boolean
          trial_ends?: string | null
          updated_at?: string
          userId?: string
          years_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_profiles_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      employer_profiles: {
        Row: {
          company_name: string | null
          company_website: string | null
          completed: boolean
          created_at: string
          id: string
          updated_at: string
          userId: string
        }
        Insert: {
          company_name?: string | null
          company_website?: string | null
          completed?: boolean
          created_at?: string
          id: string
          updated_at: string
          userId: string
        }
        Update: {
          company_name?: string | null
          company_website?: string | null
          completed?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "employer_profiles_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id: string
          message: string
          read?: boolean
          title: string
          type: Database["public"]["Enums"]["NotificationType"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["NotificationType"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget_per_role: Json | null
          contact_preference: Json
          created_at: string
          description: string
          employer_id: string
          id: string
          location: string
          project_name: string
          project_type: string
          questions: Json
          roles_needed: Json
          shoot_end_date: string
          shoot_start_date: string
          status: Database["public"]["Enums"]["ProjectStatus"]
          updated_at: string
        }
        Insert: {
          budget_per_role?: Json | null
          contact_preference: Json
          created_at?: string
          description: string
          employer_id: string
          id: string
          location: string
          project_name: string
          project_type: string
          questions: Json
          roles_needed: Json
          shoot_end_date: string
          shoot_start_date: string
          status?: Database["public"]["Enums"]["ProjectStatus"]
          updated_at: string
        }
        Update: {
          budget_per_role?: Json | null
          contact_preference?: Json
          created_at?: string
          description?: string
          employer_id?: string
          id?: string
          location?: string
          project_name?: string
          project_type?: string
          questions?: Json
          roles_needed?: Json
          shoot_end_date?: string
          shoot_start_date?: string
          status?: Database["public"]["Enums"]["ProjectStatus"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          expires: string
          id: string
          session_token: string
          user_id: string
        }
        Insert: {
          expires: string
          id: string
          session_token: string
          user_id: string
        }
        Update: {
          expires?: string
          id?: string
          session_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string
          features: Json
          id: string
          name: string
          price: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          features: Json
          id: string
          name: string
          price: number
          stripe_price_id?: string | null
          updated_at: string
        }
        Update: {
          created_at?: string
          description?: string
          features?: Json
          id?: string
          name?: string
          price?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          razorpay_payment_id: string | null
          razorpay_subscription_id: string | null
          status: Database["public"]["Enums"]["SubscriptionStatus"]
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          userId: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          status?: Database["public"]["Enums"]["SubscriptionStatus"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at: string
          userId: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          status?: Database["public"]["Enums"]["SubscriptionStatus"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          email_verified: string | null
          id: string
          image: string | null
          name: string | null
          password: string | null
          phone: string | null
          phoneVerified: boolean
          role: Database["public"]["Enums"]["UserRole"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_verified?: string | null
          id: string
          image?: string | null
          name?: string | null
          password?: string | null
          phone?: string | null
          phoneVerified?: boolean
          role?: Database["public"]["Enums"]["UserRole"]
          updated_at: string
        }
        Update: {
          created_at?: string
          email?: string
          email_verified?: string | null
          id?: string
          image?: string | null
          name?: string | null
          password?: string | null
          phone?: string | null
          phoneVerified?: boolean
          role?: Database["public"]["Enums"]["UserRole"]
          updated_at?: string
        }
        Relationships: []
      }
      verification_tokens: {
        Row: {
          created_at: string
          expires: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires: string
          id: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          crew_id: string | null
          id: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          crew_id?: string | null
          id: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          crew_id?: string | null
          id?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crew_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ApplicationStatus: "PENDING" | "SHORTLISTED" | "REJECTED" | "HIRED"
      ConnectionStatus: "PENDING" | "ACCEPTED" | "REJECTED"
      NotificationType:
        | "APPLICATION_RECEIVED"
        | "APPLICATION_STATUS_CHANGED"
        | "PROJECT_POSTED"
        | "SUBSCRIPTION_EXPIRING"
        | "MESSAGE_RECEIVED"
        | "CONNECTION_REQUEST"
        | "CONNECTION_ACCEPTED"
      ProjectStatus: "OPEN" | "CLOSED" | "FILLED"
      SubscriptionStatus: "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID"
      SubscriptionTier: "FREE_TRIAL" | "BASIC" | "PRO"
      UserRole: "CREW" | "EMPLOYER" | "ADMIN"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ApplicationStatus: ["PENDING", "SHORTLISTED", "REJECTED", "HIRED"],
      ConnectionStatus: ["PENDING", "ACCEPTED", "REJECTED"],
      NotificationType: [
        "APPLICATION_RECEIVED",
        "APPLICATION_STATUS_CHANGED",
        "PROJECT_POSTED",
        "SUBSCRIPTION_EXPIRING",
        "MESSAGE_RECEIVED",
        "CONNECTION_REQUEST",
        "CONNECTION_ACCEPTED",
      ],
      ProjectStatus: ["OPEN", "CLOSED", "FILLED"],
      SubscriptionStatus: ["ACTIVE", "CANCELED", "PAST_DUE", "UNPAID"],
      SubscriptionTier: ["FREE_TRIAL", "BASIC", "PRO"],
      UserRole: ["CREW", "EMPLOYER", "ADMIN"],
    },
  },
} as const

