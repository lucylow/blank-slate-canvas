// This file defines the data structures for the PitWall AI V2 backend API.

export interface BackendConfig {
  version: string;
  tracks: Array<{
    id: string;
    name: string;
    location: string;
    length_miles: number;
    turns: number;
  }>;
  features: {
    enhanced_predictor: boolean;
    uncertainty_quantification: boolean;
    explainability: boolean;
    sse_streaming: boolean;
    model_evaluation: boolean;
  };
}

export interface DashboardData {
  meta: {
    ok: boolean;
    track: string;
    lap: number;
    total_laps: number;
    enhanced_features: boolean;
  };
  tire_wear: {
    front_left: number;
    front_right: number;
    rear_left: number;
    rear_right: number;
    confidence: number;
    ci_lower: Record<string, number>;
    ci_upper: Record<string, number>;
    top_features: Record<string, number>;
    pit_window_optimal: number[];
  };
  performance: {
    current_lap: string;
    best_lap: string;
    gap_to_leader: string;
    predicted_finish: string;
    position: number;
  };
  gap_analysis: {
    position: number;
    gap_to_leader: string;
    gap_to_ahead: string | null;
    gap_to_behind: string | null;
    overtaking_opportunity: boolean;
    under_pressure: boolean;
  };
  strategy: {
    recommended_strategy: string;
    strategies: Array<{
      name: string;
      pit_lap: number;
      expected_finish: string;
      confidence: number;
      reasoning: string;
    }>;
  };
}

