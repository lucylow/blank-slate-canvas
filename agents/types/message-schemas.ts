// agents/types/message-schemas.ts
// TypeScript type definitions for multi-agent message schemas

export interface TelemetryPoint {
  meta_time: string;
  track: string;
  chassis: string;
  lap: number;
  lapdist_m: number;
  speed_kmh: number;
  accx_can: number;
  accy_can: number;
  rpm: number;
  throttle_pct: number;
  brake_pct: number;
  yaw_rate?: number;
  gear?: number;
  steering_angle?: number;
  lateral_g?: number;
  long_g?: number;
  slip_estimate?: number;
  brake_energy_inst?: number;
  driver_input_rate?: number;
  sector?: string;
}

export interface TelemetryUpdate {
  type: 'telemetry_update';
  data: TelemetryPoint[];
  source: 'udp' | 'demo' | 's3' | 'api';
  received_at: string;
}

export interface AgentTask {
  task_id: string;
  task_type: 'preprocessor' | 'eda' | 'predictor' | 'simulator' | 'explainer';
  track: string;
  chassis: string;
  priority: 'high' | 'medium' | 'low';
  payload: Record<string, unknown>;
  created_at: string;
  attempts?: number;
  max_attempts?: number;
}

export interface SectorAggregate {
  avg_speed: number;
  max_lat_g: number;
  tire_stress: number;
  brake_energy: number;
  sample_count: number;
}

export interface AggregateWindow {
  window_id: string;
  track: string;
  chassis: string;
  timestamp: string;
  point_count: number;
  sectors: Record<string, SectorAggregate>;
  recent_points: TelemetryPoint[];
  lap_range: {
    min: number;
    max: number;
  };
}

export interface AggregateUpdate {
  type: 'aggregate_update';
  data: AggregateWindow;
  timestamp: string;
}

export interface ClusteringResult {
  clusters: number[];
  n_clusters: number;
  centroids: number[][];
  embedding?: number[][];
  noise_count?: number;
  method: 'umap_hdbscan' | 'kmeans_fallback';
}

export interface EDAResult {
  success: boolean;
  aggregate_window_id: string;
  track: string;
  chassis: string;
  clustering: ClusteringResult;
  cluster_drift: boolean;
  evidence_frames: TelemetryPoint[];
  timestamp: string;
}

export interface PredictionResult {
  success: boolean;
  track: string;
  chassis: string;
  model_version: string;
  predictions: {
    predicted_loss_per_lap_seconds: number;
    laps_until_0_5s_loss: number;
    confidence: number;
  };
  explanation: {
    top_features: Array<{
      name: string;
      value: number;
      importance: number;
      shap_value?: number;
    }>;
    method: 'shap' | 'simple_importance';
  };
  evidence_frames: TelemetryPoint[];
  timestamp: string;
}

export interface StrategyScenario {
  name: 'pit_now' | 'pit_later' | 'stay_out';
  pit_lap: number | null;
  total_time: number;
  description: string;
}

export interface StrategyResult {
  success: boolean;
  track: string;
  chassis: string;
  strategy: {
    scenarios: StrategyScenario[];
    best_strategy: StrategyScenario;
    recommendation: string;
    time_saved_vs_pit_now: number;
  };
  timestamp: string;
}

export interface InsightRecommendation {
  one_liner: string;
  bullets: string[];
  voiceover_script: string;
}

export interface EvidenceFrame {
  meta_time: string;
  lap: number;
  sector: string;
  sample_idx: number;
  trace: {
    speed_kmh: number;
    lateral_g: number;
    tire_stress: number;
  };
}

export interface Insight {
  id: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  score: number;
  explanation: string;
  top_features: Array<{
    name: string;
    value: number;
    importance: number;
  }>;
  recommendation: InsightRecommendation;
  evidence: EvidenceFrame[];
  model_version: string;
  timestamp: string;
}

export interface InsightUpdate {
  type: 'insight_update';
  data: Insight;
  timestamp: string;
}

export interface AgentResult {
  task_id: string;
  agent_id: string;
  task_type: string;
  success: boolean;
  result: Record<string, unknown>;
  latency_ms: number;
  completed_at: string;
}

export interface AgentStatus {
  agents: Array<{
    id: string;
    types: string[];
    tracks: string[];
    capacity: number;
    currentLoad: number;
    lastHeartbeat: string;
  }>;
  metrics: {
    tasksProcessed: number;
    tasksFailed: number;
    avgLatency: number;
    agentCount: number;
  };
  timestamp: string;
}


