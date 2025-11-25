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
      api_logs: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          latency_ms: number | null
          method: string
          request_body: Json | null
          response_code: number | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          latency_ms?: number | null
          method: string
          request_body?: Json | null
          response_code?: number | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          latency_ms?: number | null
          method?: string
          request_body?: Json | null
          response_code?: number | null
        }
        Relationships: []
      }
      driver_profiles: {
        Row: {
          avg_lap_time: number | null
          brake_aggression: number | null
          car_number: number
          coaching_tip: string | null
          consistency_score: number | null
          fastest_lap_time: number | null
          id: string
          peak_pace_lap: number | null
          strongest_sector: string | null
          throttle_smoothness: number | null
          updated_at: string | null
          weakest_sector: string | null
        }
        Insert: {
          avg_lap_time?: number | null
          brake_aggression?: number | null
          car_number: number
          coaching_tip?: string | null
          consistency_score?: number | null
          fastest_lap_time?: number | null
          id?: string
          peak_pace_lap?: number | null
          strongest_sector?: string | null
          throttle_smoothness?: number | null
          updated_at?: string | null
          weakest_sector?: string | null
        }
        Update: {
          avg_lap_time?: number | null
          brake_aggression?: number | null
          car_number?: number
          coaching_tip?: string | null
          consistency_score?: number | null
          fastest_lap_time?: number | null
          id?: string
          peak_pace_lap?: number | null
          strongest_sector?: string | null
          throttle_smoothness?: number | null
          updated_at?: string | null
          weakest_sector?: string | null
        }
        Relationships: []
      }
      driver_telemetry: {
        Row: {
          brake_pressure: number | null
          car_number: number
          created_at: string | null
          id: string
          lap_number: number
          lateral_g: number | null
          longitudinal_g: number | null
          race_session_id: string | null
          speed: number | null
          steering_angle: number | null
          throttle_position: number | null
          timestamp: string | null
          tire_pressure_fl: number | null
          tire_pressure_fr: number | null
          tire_pressure_rl: number | null
          tire_pressure_rr: number | null
          tire_temp_front_left: number | null
          tire_temp_front_right: number | null
          tire_temp_rear_left: number | null
          tire_temp_rear_right: number | null
        }
        Insert: {
          brake_pressure?: number | null
          car_number: number
          created_at?: string | null
          id?: string
          lap_number: number
          lateral_g?: number | null
          longitudinal_g?: number | null
          race_session_id?: string | null
          speed?: number | null
          steering_angle?: number | null
          throttle_position?: number | null
          timestamp?: string | null
          tire_pressure_fl?: number | null
          tire_pressure_fr?: number | null
          tire_pressure_rl?: number | null
          tire_pressure_rr?: number | null
          tire_temp_front_left?: number | null
          tire_temp_front_right?: number | null
          tire_temp_rear_left?: number | null
          tire_temp_rear_right?: number | null
        }
        Update: {
          brake_pressure?: number | null
          car_number?: number
          created_at?: string | null
          id?: string
          lap_number?: number
          lateral_g?: number | null
          longitudinal_g?: number | null
          race_session_id?: string | null
          speed?: number | null
          steering_angle?: number | null
          throttle_position?: number | null
          timestamp?: string | null
          tire_pressure_fl?: number | null
          tire_pressure_fr?: number | null
          tire_pressure_rl?: number | null
          tire_pressure_rr?: number | null
          tire_temp_front_left?: number | null
          tire_temp_front_right?: number | null
          tire_temp_rear_left?: number | null
          tire_temp_rear_right?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_telemetry_race_session_id_fkey"
            columns: ["race_session_id"]
            isOneToOne: false
            referencedRelation: "race_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pit_recommendations: {
        Row: {
          car_number: number
          created_at: string | null
          current_lap: number
          explanation: string | null
          id: string
          probability: number | null
          race_session_id: string | null
          recommended_pit_lap: number
          risk_level: string | null
          time_saved_sec: number | null
          window_end: number | null
          window_start: number | null
        }
        Insert: {
          car_number: number
          created_at?: string | null
          current_lap: number
          explanation?: string | null
          id?: string
          probability?: number | null
          race_session_id?: string | null
          recommended_pit_lap: number
          risk_level?: string | null
          time_saved_sec?: number | null
          window_end?: number | null
          window_start?: number | null
        }
        Update: {
          car_number?: number
          created_at?: string | null
          current_lap?: number
          explanation?: string | null
          id?: string
          probability?: number | null
          race_session_id?: string | null
          recommended_pit_lap?: number
          risk_level?: string | null
          time_saved_sec?: number | null
          window_end?: number | null
          window_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pit_recommendations_race_session_id_fkey"
            columns: ["race_session_id"]
            isOneToOne: false
            referencedRelation: "race_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      race_sessions: {
        Row: {
          conditions: string | null
          created_at: string | null
          date: string | null
          id: string
          total_laps: number
          track_id: string
          track_name: string
          track_temp: number | null
          weather_temp: number | null
        }
        Insert: {
          conditions?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          total_laps: number
          track_id: string
          track_name: string
          track_temp?: number | null
          weather_temp?: number | null
        }
        Update: {
          conditions?: string | null
          created_at?: string | null
          date?: string | null
          id?: string
          total_laps?: number
          track_id?: string
          track_name?: string
          track_temp?: number | null
          weather_temp?: number | null
        }
        Relationships: []
      }
      tire_predictions: {
        Row: {
          car_number: number
          confidence: number | null
          created_at: string | null
          id: string
          lap_number: number
          laps_until_cliff: number | null
          race_session_id: string | null
          sector_1_wear: number | null
          sector_2_wear: number | null
          sector_3_wear: number | null
          top_factors: Json | null
          wear_percent: number
        }
        Insert: {
          car_number: number
          confidence?: number | null
          created_at?: string | null
          id?: string
          lap_number: number
          laps_until_cliff?: number | null
          race_session_id?: string | null
          sector_1_wear?: number | null
          sector_2_wear?: number | null
          sector_3_wear?: number | null
          top_factors?: Json | null
          wear_percent: number
        }
        Update: {
          car_number?: number
          confidence?: number | null
          created_at?: string | null
          id?: string
          lap_number?: number
          laps_until_cliff?: number | null
          race_session_id?: string | null
          sector_1_wear?: number | null
          sector_2_wear?: number | null
          sector_3_wear?: number | null
          top_factors?: Json | null
          wear_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "tire_predictions_race_session_id_fkey"
            columns: ["race_session_id"]
            isOneToOne: false
            referencedRelation: "race_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analyze_tire_degradation: {
        Args: { p_car_number: number; p_session_id: string }
        Returns: {
          confidence: number
          lap_number: number
          laps_until_cliff: number
          wear_percent: number
          wear_rate: number
        }[]
      }
      compare_drivers_realtime: {
        Args: { p_car_numbers: number[]; p_session_id: string }
        Returns: {
          avg_lap_time: number
          avg_speed: number
          car_number: number
          consistency_score: number
          position_estimate: number
          tire_wear: number
        }[]
      }
      get_lap_statistics: {
        Args: {
          p_car_number: number
          p_lap_number: number
          p_session_id: string
        }
        Returns: {
          avg_brake: number
          avg_speed: number
          avg_throttle: number
          avg_tire_temp: number
          data_points: number
          max_lateral_g: number
          max_longitudinal_g: number
          max_speed: number
        }[]
      }
      get_session_summary: {
        Args: { p_session_id: string }
        Returns: {
          active_cars: number
          session_duration: unknown
          total_laps: number
          total_predictions: number
          total_telemetry_points: number
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
