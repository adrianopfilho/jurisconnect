export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13";
  };
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_role: Database["public"]["Enums"]["app_role"] | null;
          created_at: string;
          entity_id: string | null;
          entity_type: string | null;
          hash: string;
          id: number;
          ip: unknown;
          metadata: NonNullable<Json>;
          prev_hash: string | null;
          tenant_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_role?: Database["public"]["Enums"]["app_role"] | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          hash: string;
          id?: never;
          ip?: unknown;
          metadata?: NonNullable<Json>;
          prev_hash?: string | null;
          tenant_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_role?: Database["public"]["Enums"]["app_role"] | null;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string | null;
          hash?: string;
          id?: never;
          ip?: unknown;
          metadata?: NonNullable<Json>;
          prev_hash?: string | null;
          tenant_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          revoked_at: string | null;
          revoked_by: string | null;
          role: Database["public"]["Enums"]["app_role"];
          tenant_id: string;
          token_hash: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          invited_by: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          role: Database["public"]["Enums"]["app_role"];
          tenant_id: string;
          token_hash: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          revoked_at?: string | null;
          revoked_by?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          tenant_id?: string;
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          active_tenant_id: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          oab_number: string | null;
          oab_state: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          active_tenant_id?: string | null;
          created_at?: string;
          email: string;
          full_name: string;
          id: string;
          oab_number?: string | null;
          oab_state?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          active_tenant_id?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          oab_number?: string | null;
          oab_state?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_active_tenant_id_fkey";
            columns: ["active_tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenant_members: {
        Row: {
          created_at: string;
          disabled_at: string | null;
          disabled_by: string | null;
          id: string;
          invited_by: string | null;
          role: Database["public"]["Enums"]["app_role"];
          status: Database["public"]["Enums"]["member_status"];
          tenant_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          disabled_at?: string | null;
          disabled_by?: string | null;
          id?: string;
          invited_by?: string | null;
          role: Database["public"]["Enums"]["app_role"];
          status?: Database["public"]["Enums"]["member_status"];
          tenant_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          disabled_at?: string | null;
          disabled_by?: string | null;
          id?: string;
          invited_by?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          status?: Database["public"]["Enums"]["member_status"];
          tenant_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey";
            columns: ["tenant_id"];
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          cnpj: string | null;
          created_at: string;
          created_by: string | null;
          deleted_at: string | null;
          deleted_by: string | null;
          id: string;
          name: string;
          settings: NonNullable<Json>;
          slug: string;
          updated_at: string;
        };
        Insert: {
          cnpj?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          name: string;
          settings?: NonNullable<Json>;
          slug: string;
          updated_at?: string;
        };
        Update: {
          cnpj?: string | null;
          created_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          deleted_by?: string | null;
          id?: string;
          name?: string;
          settings?: NonNullable<Json>;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: {
        Args: {
          p_ip?: unknown;
          p_token_hash: string;
          p_user_agent?: string;
          p_user_id: string;
        };
        Returns: string;
      };
      auth_login_locked_until: { Args: { p_email: string }; Returns: string };
      auth_register_failure: {
        Args: { p_email: string; p_ip?: unknown; p_user_agent?: string };
        Returns: {
          failures: number;
          just_locked: boolean;
          locked_until: string;
        }[];
      };
      auth_register_success: {
        Args: { p_ip?: unknown; p_user_agent?: string; p_user_id: string };
        Returns: undefined;
      };
      create_invitation: {
        Args: {
          p_actor_id: string;
          p_email: string;
          p_ip?: unknown;
          p_role: Database["public"]["Enums"]["app_role"];
          p_tenant_id: string;
          p_token_hash: string;
          p_user_agent?: string;
        };
        Returns: string;
      };
      get_invitation: {
        Args: { p_token_hash: string };
        Returns: {
          email: string;
          expires_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          status: string;
          tenant_id: string;
          tenant_name: string;
        }[];
      };
      locked_members: {
        Args: Record<PropertyKey, never>;
        Returns: {
          locked_until: string;
          member_id: string;
        }[];
      };
      log_audit_event: {
        Args: {
          p_action: string;
          p_entity_id?: string;
          p_entity_type?: string;
          p_metadata?: Json;
        };
        Returns: number;
      };
      log_system_audit_event: {
        Args: {
          p_action: string;
          p_actor_id?: string;
          p_entity_id?: string;
          p_entity_type?: string;
          p_ip?: unknown;
          p_metadata?: Json;
          p_tenant_id?: string;
          p_user_agent?: string;
        };
        Returns: number;
      };
      my_memberships: {
        Args: Record<PropertyKey, never>;
        Returns: {
          is_active: boolean;
          requires_mfa: boolean;
          role: Database["public"]["Enums"]["app_role"];
          tenant_id: string;
          tenant_name: string;
        }[];
      };
      rate_limit_hit: {
        Args: { p_bucket: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      revoke_invitation: {
        Args: { p_invitation_id: string };
        Returns: undefined;
      };
      set_active_tenant: { Args: { p_tenant_id: string }; Returns: undefined };
      unlock_member: { Args: { p_member_id: string }; Returns: undefined };
      update_member: {
        Args: {
          p_member_id: string;
          p_role: Database["public"]["Enums"]["app_role"];
          p_status: Database["public"]["Enums"]["member_status"];
        };
        Returns: {
          has_other_active_membership: boolean;
          user_id: string;
        }[];
      };
      verify_audit_chain: {
        Args: Record<PropertyKey, never>;
        Returns: {
          checked: number;
          first_invalid_id: number;
          valid: boolean;
        }[];
      };
    };
    Enums: {
      app_role: "admin" | "lawyer" | "intern" | "finance" | "reception" | "dpo" | "client";
      member_status: "active" | "disabled";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
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
  public: {
    Enums: {
      app_role: ["admin", "lawyer", "intern", "finance", "reception", "dpo", "client"],
      member_status: ["active", "disabled"],
    },
  },
} as const;
