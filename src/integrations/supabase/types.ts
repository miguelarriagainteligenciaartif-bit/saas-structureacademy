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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_type: string
          broker: string
          created_at: string
          funding_company: string | null
          id: string
          initial_balance: number
          is_active: boolean
          name: string
          risk_percentage: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type: string
          broker: string
          created_at?: string
          funding_company?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          name: string
          risk_percentage?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          broker?: string
          created_at?: string
          funding_company?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          name?: string
          risk_percentage?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backtest_config: {
        Row: {
          created_at: string
          id: string
          initial_capital: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          initial_capital?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          initial_capital?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backtest_strategies: {
        Row: {
          asset: string
          created_at: string
          description: string | null
          entry_models: string[]
          entry_patterns: string[]
          id: string
          initial_capital: number
          name: string
          risk_reward_ratio: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asset?: string
          created_at?: string
          description?: string | null
          entry_models?: string[]
          entry_patterns?: string[]
          id?: string
          initial_capital?: number
          name: string
          risk_reward_ratio?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asset?: string
          created_at?: string
          description?: string | null
          entry_models?: string[]
          entry_patterns?: string[]
          id?: string
          initial_capital?: number
          name?: string
          risk_reward_ratio?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backtest_trades: {
        Row: {
          asset: string
          created_at: string
          custom_news_description: string | null
          date: string
          day_of_week: string
          drawdown: number | null
          entry_model: string | null
          entry_pattern: string | null
          entry_time: string | null
          execution_timing: string | null
          exit_time: string | null
          had_news: boolean | null
          id: string
          image_link: string | null
          max_rr: number | null
          news_description: string | null
          news_time: string | null
          no_trade_day: boolean | null
          notes: string | null
          result_dollars: number | null
          result_type: string | null
          risk_percentage: number
          strategy_id: string | null
          trade_type: string | null
          updated_at: string
          user_id: string
          week_of_month: number | null
        }
        Insert: {
          asset?: string
          created_at?: string
          custom_news_description?: string | null
          date: string
          day_of_week: string
          drawdown?: number | null
          entry_model?: string | null
          entry_pattern?: string | null
          entry_time?: string | null
          execution_timing?: string | null
          exit_time?: string | null
          had_news?: boolean | null
          id?: string
          image_link?: string | null
          max_rr?: number | null
          news_description?: string | null
          news_time?: string | null
          no_trade_day?: boolean | null
          notes?: string | null
          result_dollars?: number | null
          result_type?: string | null
          risk_percentage?: number
          strategy_id?: string | null
          trade_type?: string | null
          updated_at?: string
          user_id: string
          week_of_month?: number | null
        }
        Update: {
          asset?: string
          created_at?: string
          custom_news_description?: string | null
          date?: string
          day_of_week?: string
          drawdown?: number | null
          entry_model?: string | null
          entry_pattern?: string | null
          entry_time?: string | null
          execution_timing?: string | null
          exit_time?: string | null
          had_news?: boolean | null
          id?: string
          image_link?: string | null
          max_rr?: number | null
          news_description?: string | null
          news_time?: string | null
          no_trade_day?: boolean | null
          notes?: string | null
          result_dollars?: number | null
          result_type?: string | null
          risk_percentage?: number
          strategy_id?: string | null
          trade_type?: string | null
          updated_at?: string
          user_id?: string
          week_of_month?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "backtest_trades_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "backtest_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_entries: {
        Row: {
          checklist_id: string
          created_at: string
          entry_model: string
          entry_number: number
          id: string
          result: string | null
        }
        Insert: {
          checklist_id: string
          created_at?: string
          entry_model: string
          entry_number: number
          id?: string
          result?: string | null
        }
        Update: {
          checklist_id?: string
          created_at?: string
          entry_model?: string
          entry_number?: number
          id?: string
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_entries_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "daily_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_checklists: {
        Row: {
          completion_percentage: number
          created_at: string
          daily_current_price_location: string | null
          daily_fvg_count: number | null
          daily_yesterday: string | null
          date: string
          entry_conditions_met: boolean | null
          executed_entry: boolean | null
          h1_context: string | null
          h1_fvg_count: number | null
          h1_poi_identified: boolean | null
          h4_context: string | null
          h4_fvg_count: number | null
          h4_price_location: string | null
          id: string
          is_completed: boolean | null
          monthly_current_price_location: string | null
          monthly_fvg_count: number | null
          monthly_previous_month: string | null
          no_trade_reason: string | null
          prep_30min_available: boolean | null
          prep_schedule_clear: boolean | null
          updated_at: string
          user_id: string
          weekly_current_price_location: string | null
          weekly_fvg_count: number | null
          weekly_previous_week: string | null
        }
        Insert: {
          completion_percentage?: number
          created_at?: string
          daily_current_price_location?: string | null
          daily_fvg_count?: number | null
          daily_yesterday?: string | null
          date: string
          entry_conditions_met?: boolean | null
          executed_entry?: boolean | null
          h1_context?: string | null
          h1_fvg_count?: number | null
          h1_poi_identified?: boolean | null
          h4_context?: string | null
          h4_fvg_count?: number | null
          h4_price_location?: string | null
          id?: string
          is_completed?: boolean | null
          monthly_current_price_location?: string | null
          monthly_fvg_count?: number | null
          monthly_previous_month?: string | null
          no_trade_reason?: string | null
          prep_30min_available?: boolean | null
          prep_schedule_clear?: boolean | null
          updated_at?: string
          user_id: string
          weekly_current_price_location?: string | null
          weekly_fvg_count?: number | null
          weekly_previous_week?: string | null
        }
        Update: {
          completion_percentage?: number
          created_at?: string
          daily_current_price_location?: string | null
          daily_fvg_count?: number | null
          daily_yesterday?: string | null
          date?: string
          entry_conditions_met?: boolean | null
          executed_entry?: boolean | null
          h1_context?: string | null
          h1_fvg_count?: number | null
          h1_poi_identified?: boolean | null
          h4_context?: string | null
          h4_fvg_count?: number | null
          h4_price_location?: string | null
          id?: string
          is_completed?: boolean | null
          monthly_current_price_location?: string | null
          monthly_fvg_count?: number | null
          monthly_previous_month?: string | null
          no_trade_reason?: string | null
          prep_30min_available?: boolean | null
          prep_schedule_clear?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_current_price_location?: string | null
          weekly_fvg_count?: number | null
          weekly_previous_week?: string | null
        }
        Relationships: []
      }
      economic_events: {
        Row: {
          actual: string | null
          created_at: string
          currency: string
          event_date: string
          event_name: string
          event_time: string
          forecast: string | null
          id: string
          impact: string
          previous: string | null
        }
        Insert: {
          actual?: string | null
          created_at?: string
          currency?: string
          event_date: string
          event_name: string
          event_time?: string
          forecast?: string | null
          id?: string
          impact?: string
          previous?: string | null
        }
        Update: {
          actual?: string | null
          created_at?: string
          currency?: string
          event_date?: string
          event_name?: string
          event_time?: string
          forecast?: string | null
          id?: string
          impact?: string
          previous?: string | null
        }
        Relationships: []
      }
      flip_simulations: {
        Row: {
          account_size: number
          created_at: string
          cycle_size: number
          id: string
          name: string
          reinvest_percent: number
          risk_per_cycle: number
          rr_ratio: number
          trade_results: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          account_size?: number
          created_at?: string
          cycle_size?: number
          id?: string
          name?: string
          reinvest_percent?: number
          risk_per_cycle?: number
          rr_ratio?: number
          trade_results?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          account_size?: number
          created_at?: string
          cycle_size?: number
          id?: string
          name?: string
          reinvest_percent?: number
          risk_per_cycle?: number
          rr_ratio?: number
          trade_results?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      funding_accounts: {
        Row: {
          account_label: string | null
          account_size: number
          account_type: string
          closed_date: string | null
          cost: number
          created_at: string
          funded_date: string | null
          funding_company: string
          id: string
          notes: string | null
          passed_date: string | null
          purchase_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_label?: string | null
          account_size?: number
          account_type?: string
          closed_date?: string | null
          cost?: number
          created_at?: string
          funded_date?: string | null
          funding_company: string
          id?: string
          notes?: string | null
          passed_date?: string | null
          purchase_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_label?: string | null
          account_size?: number
          account_type?: string
          closed_date?: string | null
          cost?: number
          created_at?: string
          funded_date?: string | null
          funding_company?: string
          id?: string
          notes?: string | null
          passed_date?: string | null
          purchase_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      funding_company_summary: {
        Row: {
          created_at: string
          funding_company: string
          id: string
          notes: string | null
          total_cost: number
          total_evaluations: number
          total_failed: number
          total_passed: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          funding_company: string
          id?: string
          notes?: string | null
          total_cost?: number
          total_evaluations?: number
          total_failed?: number
          total_passed?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          funding_company?: string
          id?: string
          notes?: string | null
          total_cost?: number
          total_evaluations?: number
          total_failed?: number
          total_passed?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      funding_payouts: {
        Row: {
          amount: number
          created_at: string
          funding_account_id: string
          id: string
          notes: string | null
          payout_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          funding_account_id: string
          id?: string
          notes?: string | null
          payout_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          funding_account_id?: string
          id?: string
          notes?: string | null
          payout_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funding_payouts_funding_account_id_fkey"
            columns: ["funding_account_id"]
            isOneToOne: false
            referencedRelation: "funding_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_rotational_simulations: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          state: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          config: Json
          created_at?: string
          id?: string
          name?: string
          state: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          state?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          account_id: string | null
          asset: string
          continuation_subtype: string | null
          created_at: string | null
          custom_news_description: string | null
          date: string
          day_of_week: string
          drawdown: number | null
          entry_model: string | null
          entry_subtype: string | null
          entry_time: string | null
          execution_timing: string | null
          exit_time: string | null
          fvg_count: number | null
          had_news: boolean | null
          id: string
          image_link: string | null
          max_rr: number | null
          news_description: string | null
          news_time: string | null
          no_trade_day: boolean | null
          notes: string | null
          result_dollars: number
          result_type: string | null
          risk_percentage: number
          trade_type: string | null
          updated_at: string | null
          user_id: string
          week_of_month: number | null
        }
        Insert: {
          account_id?: string | null
          asset?: string
          continuation_subtype?: string | null
          created_at?: string | null
          custom_news_description?: string | null
          date: string
          day_of_week: string
          drawdown?: number | null
          entry_model?: string | null
          entry_subtype?: string | null
          entry_time?: string | null
          execution_timing?: string | null
          exit_time?: string | null
          fvg_count?: number | null
          had_news?: boolean | null
          id?: string
          image_link?: string | null
          max_rr?: number | null
          news_description?: string | null
          news_time?: string | null
          no_trade_day?: boolean | null
          notes?: string | null
          result_dollars: number
          result_type?: string | null
          risk_percentage?: number
          trade_type?: string | null
          updated_at?: string | null
          user_id: string
          week_of_month?: number | null
        }
        Update: {
          account_id?: string | null
          asset?: string
          continuation_subtype?: string | null
          created_at?: string | null
          custom_news_description?: string | null
          date?: string
          day_of_week?: string
          drawdown?: number | null
          entry_model?: string | null
          entry_subtype?: string | null
          entry_time?: string | null
          execution_timing?: string | null
          exit_time?: string | null
          fvg_count?: number | null
          had_news?: boolean | null
          id?: string
          image_link?: string | null
          max_rr?: number | null
          news_description?: string | null
          news_time?: string | null
          no_trade_day?: boolean | null
          notes?: string | null
          result_dollars?: number
          result_type?: string | null
          risk_percentage?: number
          trade_type?: string | null
          updated_at?: string | null
          user_id?: string
          week_of_month?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trades_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
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
