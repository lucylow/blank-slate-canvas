// src/api/pitwall.ts
// API functions using axios client with proper error handling
// Updated to match pitwall-backend endpoints

import client from "./client";

// ============================================================================
// Type Definitions (matching backend Pydantic models)
// ============================================================================

export interface HealthResponse {
  status?: string;
  ok?: boolean;
  timestamp?: string;
  note?: string;
}

export interface Track {
  id: string;
  name: string;
  location: string;
  length_miles: number;
  turns: number;
  available_races: number[];
}

export interface TrackList {
  tracks: Track[];
}

export interface RaceInfo {
  track: string;
  race_number: number;
  vehicles: number[];
  total_laps: number;
}

export interface TireWearData {
  front_left: number;
  front_right: number;
  rear_left: number;
  rear_right: number;
  predicted_laps_remaining?: number;
  pit_window_optimal?: number[];
  // Enhanced fields for explainability and uncertainty
  confidence?: number;
  ci_lower?: Record<string, number>;
  ci_upper?: Record<string, number>;
  top_features?: Record<string, number>;
  model_version?: string;
}

export interface PerformanceMetrics {
  current_lap: string;
  best_lap: string;
  gap_to_leader: string;
  predicted_finish: string;
  position: number;
  lap_number: number;
  total_laps: number;
}

export interface GapAnalysis {
  position: number;
  gap_to_leader: string;
  gap_to_ahead?: string | null;
  gap_to_behind?: string | null;
  overtaking_opportunity: boolean;
  under_pressure: boolean;
  closing_rate_ahead?: string | null;
}

export interface StrategyRecommendation {
  name: string;
  pit_lap: number;
  expected_finish: string;
  expected_time: string;
  confidence: number;
  reasoning: string;
}

export interface StrategyOptimization {
  recommended_strategy: string;
  strategies: StrategyRecommendation[];
  current_tire_laps: number;
  fuel_remaining_laps: number;
}

export interface DashboardData {
  track: string;
  race: number;
  vehicle_number: number;
  lap: number;
  total_laps: number;
  tire_wear: TireWearData;
  performance: PerformanceMetrics;
  gap_analysis: GapAnalysis;
  timestamp: string;
  live_data: boolean;
}

export interface TireWearRequest {
  track: string;
  race: number;
  vehicle_number: number;
  lap: number;
}

export interface PerformanceRequest {
  track: string;
  race: number;
  vehicle_number: number;
  lap: number;
}

export interface StrategyRequest {
  track: string;
  race: number;
  vehicle_number: number;
  current_lap: number;
  total_laps: number;
  current_position: number;
  tire_laps: number;
}

export interface SplitDeltaData {
  lap: number;
  ref_car: number;
  compare_car: number;
  delta_S1: number | null;
  delta_S2: number | null;
  delta_S3: number | null;
}

export interface SplitDeltaResponse {
  delta_data: SplitDeltaData[];
  meta: {
    track: string;
    race: number;
    cars: number[];
    ref_car: number;
    total_records: number;
    demo?: boolean;
    message?: string;
  };
}

// Legacy interface for backward compatibility
export interface TirePredictionResponse {
  chassis: string;
  track: string;
  predicted_loss_per_lap_s: number;
  laps_until_0_5s_loss: number;
  recommended_pit_lap?: number;
  feature_scores?: Array<{ name: string; score: number }>;
  explanation?: string[];
  meta?: {
    model_version?: string;
    generated_at?: string;
    demo?: boolean;
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Health check endpoint
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const res = await client.get<HealthResponse>("/health");
    return res.data;
  } catch (error: unknown) {
    throw new Error("Health check failed: Backend may be unavailable");
  }
}

/**
 * Get list of all available tracks
 */
export async function getTracks(): Promise<TrackList> {
  try {
    const res = await client.get<TrackList>("/api/tracks");
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Tracks API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Get specific track details
 */
export async function getTrack(trackId: string): Promise<Track> {
  try {
    const res = await client.get<Track>(`/api/tracks/${encodeURIComponent(trackId)}`);
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Track API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Get race information for a track
 */
export async function getRaceInfo(trackId: string, raceNumber: number): Promise<RaceInfo> {
  try {
    const res = await client.get<RaceInfo>(`/api/tracks/${encodeURIComponent(trackId)}/races/${raceNumber}`);
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Race info API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Get complete live dashboard data (main endpoint)
 * This combines all AI analytics: tire wear, performance, gap analysis
 */
export async function getLiveDashboard(
  track: string,
  race: number,
  vehicle: number,
  lap: number
): Promise<DashboardData> {
  try {
    const res = await client.get<DashboardData>("/api/dashboard/live", {
      params: { track, race, vehicle, lap }
    });
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Dashboard API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Get lap split deltas across cars for comparison
 * Returns sector/lap split differences for each car compared to a reference car
 */
export async function getSplitDeltas(
  track: string,
  race: number,
  cars: number[],
  refCar?: number
): Promise<SplitDeltaResponse> {
  try {
    const carsParam = cars.join(',');
    const params: Record<string, string | number> = {
      track,
      race,
      cars: carsParam
    };
    if (refCar !== undefined) {
      params.ref_car = refCar;
    }
    
    const res = await client.get<SplitDeltaResponse>("/api/analytics/split-deltas", {
      params
    });
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Split deltas API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Predict tire wear based on telemetry
 */
export async function analyzeTireWear(request: TireWearRequest): Promise<{ success: boolean; data: TireWearData; timestamp: string }> {
  try {
    const res = await client.post("/api/analytics/tire-wear", request);
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Tire wear API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Analyze driver performance
 */
export async function analyzePerformance(request: PerformanceRequest): Promise<{ success: boolean; data: PerformanceMetrics; timestamp: string }> {
  try {
    const res = await client.post<{ success: boolean; data: PerformanceMetrics; timestamp: string }>(
      "/api/analytics/performance",
      request
    );
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Performance API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Evaluate tire wear prediction model
 * Returns RMSE, MAE, and calibration stats per track
 */
export interface TireWearEvalResult {
  track?: string;
  race?: number;
  vehicle?: number;
  rmse?: number;
  mae?: number;
  samples?: number;
  predictions?: Array<{
    lap: number;
    predicted_wear: number;
    expected_wear: number;
    error: number;
  }>;
}

export interface TireWearEvalResponse {
  success: boolean;
  data: TireWearEvalResult | {
    tracks: Record<string, {
      name: string;
      rmse?: number;
      mae?: number;
      samples: number;
    }>;
    summary: {
      overall_rmse?: number;
      overall_mae?: number;
      tracks_evaluated: number;
      total_samples: number;
    };
  };
  timestamp: string;
}

export async function evaluateTireWear(
  track?: string,
  race?: number,
  vehicle?: number,
  maxLaps: number = 20
): Promise<TireWearEvalResponse> {
  try {
    const params: Record<string, string | number> = { max_laps: maxLaps };
    if (track) params.track = track;
    if (race) params.race = race;
    if (vehicle) params.vehicle = vehicle;
    
    const res = await client.get<TireWearEvalResponse>("/api/analytics/eval/tire-wear", { params });
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Evaluation API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Optimize race strategy
 */
export async function optimizeStrategy(request: StrategyRequest): Promise<{ success: boolean; data: StrategyOptimization; timestamp: string }> {
  try {
    const res = await client.post("/api/analytics/strategy", request);
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Strategy API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Calculate gaps to competitors
 */
export async function getGapAnalysis(
  track: string,
  race: number,
  vehicle: number,
  lap: number
): Promise<{ success: boolean; data: GapAnalysis; timestamp: string }> {
  try {
    const res = await client.get("/api/analytics/gap-analysis", {
      params: { track, race, vehicle, lap }
    });
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Gap analysis API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

// ============================================================================
// Legacy Functions (for backward compatibility)
// ============================================================================

/**
 * Legacy tire prediction function (for backward compatibility)
 * Maps to the new analyzeTireWear endpoint
 */
export async function predictTire(track: string, chassis: string): Promise<TirePredictionResponse> {
  try {
    // Convert track name to track ID format (normalize)
    const normalizedTrack = track.toLowerCase().replace(/\s+/g, '_');
    
    // For legacy compatibility, use default values
    // In production, these should come from telemetry context
    const request: TireWearRequest = {
      track: normalizedTrack,
      race: 1,
      vehicle_number: 7, // Default vehicle
      lap: 12 // Default lap
    };
    
    const response = await analyzeTireWear(request);
    const tireWear = response.data;
    
    // Convert to legacy format
    const avgWear = (tireWear.front_left + tireWear.front_right + tireWear.rear_left + tireWear.rear_right) / 4;
    const predictedLossPerLap = (100 - avgWear) / 12; // Estimate based on current wear
    
    return {
      chassis,
      track,
      predicted_loss_per_lap_s: predictedLossPerLap,
      laps_until_0_5s_loss: tireWear.predicted_laps_remaining || 5,
      recommended_pit_lap: tireWear.pit_window_optimal?.[0] || 15,
      explanation: [`Tire wear: ${avgWear.toFixed(1)}%`, `Optimal pit window: Laps ${tireWear.pit_window_optimal?.join('-') || '15-17'}`],
      meta: {
        generated_at: response.timestamp,
        demo: false
      }
    };
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Predict API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Legacy strategy simulation function (for backward compatibility)
 */
export async function simulateStrategy(data: {
  track: string;
  chassis: string;
  strategy: unknown;
}): Promise<{ success: boolean; data: StrategyOptimization; timestamp: string }> {
  try {
    const normalizedTrack = data.track.toLowerCase().replace(/\s+/g, '_');
    
    const request: StrategyRequest = {
      track: normalizedTrack,
      race: 1,
      vehicle_number: 7,
      current_lap: 12,
      total_laps: 25,
      current_position: 3,
      tire_laps: 12
    };
    
    return await optimizeStrategy(request);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Simulate API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Simulate error: ${message}`);
    }
  }
}

/**
 * Fetch multi-track predictions (parallel) - Legacy function
 */
export async function predictMultiple(
  tracks: string[], 
  chassis = "GR86-DEMO-01"
): Promise<(TirePredictionResponse | { error: string; track: string })[]> {
  const promises = tracks.map((t) =>
    predictTire(t, chassis).catch((e) => ({
      error: e instanceof Error ? e.message : String(e),
      track: t,
    }))
  );
  return Promise.all(promises);
}

// ============================================================================
// AI AGENTS API FUNCTIONS
// ============================================================================

export interface Agent {
  id: string;
  type: string;
  status: 'active' | 'idle' | 'error';
  registered_at?: string;
  tracks?: string[];
}

export interface AgentStatusResponse {
  success: boolean;
  agents: Agent[];
  queues?: {
    tasksLength?: number;
    resultsLength?: number;
    inboxLengths?: Array<{
      agentId: string;
      length: number;
    }>;
  };
  redis_available?: boolean;
  timestamp: string;
}

export interface AgentDecision {
  type: 'agent_decision';
  agent_id: string;
  decision_id: string;
  track: string;
  chassis: string;
  action: string;
  confidence: number;
  risk_level: string;
  decision_type?: 'pit' | 'coach' | 'anomaly' | 'strategy';
  reasoning?: string[];
  evidence?: Record<string, unknown>;
  created_at: string;
}

export interface AgentDecisionsResponse {
  success: boolean;
  decisions: AgentDecision[];
  count: number;
  timestamp: string;
}

export interface AgentDecision {
  decision_id: string;
  agent_id: string;
  agent_type: string;
  decision_type: string;
  action: string;
  confidence: number;
  risk_level: string;
  reasoning: string[];
  evidence?: Record<string, unknown>;
  alternatives?: Array<{
    action: string;
    risk: string;
    rationale: string;
  }>;
  evidence_frames?: Array<Record<string, unknown>>;
}

export interface InsightResponse {
  success: boolean;
  insight: InsightDetail;
  timestamp: string;
}

/**
 * Get AI agent status
 */
export async function getAgentStatus(): Promise<AgentStatusResponse> {
  try {
    const res = await client.get<AgentStatusResponse>("/api/agents/status");
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Agent status API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Get AI agent decisions
 */
export async function getAgentDecisions(
  track?: string,
  chassis?: string,
  limit: number = 50,
  decisionType?: 'pit' | 'coach' | 'anomaly' | 'strategy'
): Promise<AgentDecisionsResponse> {
  try {
    const params: Record<string, string | number> = { limit };
    if (track) params.track = track;
    if (chassis) params.chassis = chassis;
    if (decisionType) params.decision_type = decisionType;
    
    const res = await client.get<AgentDecisionsResponse>("/api/agents/decisions", { params });
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Agent decisions API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Get detailed insight by ID
 */
export async function getInsightDetails(insightId: string): Promise<InsightResponse> {
  try {
    const res = await client.get<InsightResponse>(`/api/agents/insights/${encodeURIComponent(insightId)}`);
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Insight API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Submit telemetry data to AI agents
 */
export async function submitTelemetryToAgents(telemetry: Record<string, unknown>): Promise<{ success: boolean; message: string; timestamp: string }> {
  try {
    const res = await client.post("/api/agents/telemetry", telemetry);
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Telemetry submission error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

// ============================================================================
// HUMAN-IN-THE-LOOP API FUNCTIONS
// ============================================================================

export interface HumanReview {
  decision_id: string;
  action: 'approve' | 'reject' | 'modify';
  modified_action?: string;
  feedback?: string;
  reviewer?: string;
  reviewed_at: string;
}

export interface ReviewRequest {
  action: 'approve' | 'reject' | 'modify';
  modified_action?: string;
  feedback?: string;
  reviewer?: string;
}

export interface ReviewResponse {
  success: boolean;
  message: string;
  review: HumanReview;
  timestamp: string;
}

export interface PendingDecisionsResponse {
  success: boolean;
  decisions: AgentDecision[];
  count: number;
  timestamp: string;
}

export interface ReviewHistoryResponse {
  success: boolean;
  reviews: HumanReview[];
  count: number;
  timestamp: string;
}

/**
 * Review an agent decision (approve/reject/modify)
 */
export async function reviewAgentDecision(
  decisionId: string,
  review: ReviewRequest
): Promise<ReviewResponse> {
  try {
    const res = await client.post<ReviewResponse>(
      `/api/agents/decisions/${encodeURIComponent(decisionId)}/review`,
      review
    );
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Review API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Get pending decisions that require human review
 */
export async function getPendingDecisions(
  track?: string,
  chassis?: string,
  riskLevel?: string,
  limit: number = 50
): Promise<PendingDecisionsResponse> {
  try {
    const params: Record<string, string | number> = { limit };
    if (track) params.track = track;
    if (chassis) params.chassis = chassis;
    if (riskLevel) params.risk_level = riskLevel;
    
    const res = await client.get<PendingDecisionsResponse>("/api/agents/decisions/pending", { params });
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Pending decisions API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Get review for a specific decision
 */
export async function getDecisionReview(decisionId: string): Promise<{ success: boolean; review: HumanReview; timestamp: string }> {
  try {
    const res = await client.get<{ success: boolean; review: HumanReview; timestamp: string }>(
      `/api/agents/decisions/${encodeURIComponent(decisionId)}/review`
    );
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Review fetch API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Get review history
 */
export async function getReviewHistory(
  limit: number = 50,
  reviewer?: string
): Promise<ReviewHistoryResponse> {
  try {
    const params: Record<string, string | number> = { limit };
    if (reviewer) params.reviewer = reviewer;
    
    const res = await client.get<ReviewHistoryResponse>("/api/agents/reviews/history", { params });
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Review history API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

// ============================================================================
// AGENT WORKFLOW & COLLABORATION API FUNCTIONS
// ============================================================================

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  status?: string;
}

export interface WorkflowRequest {
  workflow: WorkflowNode[];
  track: string;
  session: string;
}

export interface WorkflowResponse {
  success: boolean;
  results: Record<string, unknown>;
  timestamp: string;
}

export interface AgentAnalysisRequest {
  telemetry: Record<string, unknown>;
  sessionState?: Record<string, unknown>;
}

export interface AgentAnalysisResponse {
  success: boolean;
  recommendation: string;
  confidence: number;
  decision_type?: string;
  reasoning?: string[];
  timestamp: string;
}

/**
 * Execute agent workflow
 */
export async function executeAgentWorkflow(
  request: WorkflowRequest
): Promise<WorkflowResponse> {
  try {
    const res = await client.post<WorkflowResponse>("/api/agent-workflow", request);
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Workflow API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Request analysis from a specific agent
 */
export async function requestAgentAnalysis(
  agentId: string,
  request: AgentAnalysisRequest
): Promise<AgentAnalysisResponse> {
  try {
    const res = await client.post<AgentAnalysisResponse>(
      `/api/agents/${encodeURIComponent(agentId)}/analyze`,
      request
    );
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Agent analysis API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

// ============================================================================
// AGENT CONSENSUS API FUNCTIONS
// ============================================================================

export interface AgentConsensusRequest {
  track: string;
  chassis: string;
  lap: number;
  telemetry?: Record<string, unknown>;
  sessionState?: Record<string, unknown>;
}

export interface AgentVote {
  vote: 'box_now' | 'stay_out' | 'box_later';
  confidence: number;
  rationale: string;
  agent_type?: string;
}

export interface AgentConsensusResponse {
  success: boolean;
  agent_votes: Record<string, AgentVote>;
  consensus: {
    decision: 'box_now' | 'stay_out' | 'box_later';
    confidence: number;
    votes_for: number;
    votes_against: number;
    total_agents: number;
  };
  explanation: string;
  disagreement_score?: number;
  timestamp: string;
}

/**
 * Run agent consensus - get all agents to vote on a decision
 */
export async function runAgentConsensus(
  request: AgentConsensusRequest
): Promise<AgentConsensusResponse> {
  try {
    const res = await client.post<AgentConsensusResponse>("/api/agents/run", request);
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Agent consensus API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

// ============================================================================
// ANALYTICS API FUNCTIONS
// ============================================================================

export interface TireWearEvalByTrack {
  rmse_mean: number;
  rmse_std: number;
  rmse_list: number[];
  r2_mean: number;
  r2_list: number[];
  n_samples: number;
  folds: number;
}

export interface TireWearEvalResponse {
  eval_metric: string;
  model_version: string;
  by_track: Record<string, TireWearEvalByTrack>;
  summary: {
    avg_rmse: number;
    timestamp: number;
  };
}

export interface DatasetCoverage {
  n_laps: number;
  n_drivers: number;
  n_sessions: number;
  date_min: string;
  date_max: string;
  tire_compounds: string[];
  data_sha: string;
}

export interface DatasetCoverageResponse {
  by_track: Record<string, DatasetCoverage>;
  summary: {
    total_laps: number;
    total_drivers: number;
    total_sessions: number;
    training_complete: boolean;
  };
}

export interface AnomalySummary {
  anomalies: Record<string, {
    count: number;
    severity: string;
  }>;
  track: string | null;
  period: string;
}

/**
 * Evaluate tire wear prediction model
 */
export async function evaluateTireWearModel(
  track?: string,
  foldN: number = 5
): Promise<TireWearEvalResponse> {
  try {
    const params: Record<string, string | number> = { fold_n: foldN };
    if (track) params.track = track;
    
    const res = await client.get<TireWearEvalResponse>("/api/analytics/eval/tire-wear", { params });
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Tire wear eval API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Get dataset coverage information
 */
export async function getDatasetCoverage(): Promise<DatasetCoverageResponse> {
  try {
    const res = await client.get<DatasetCoverageResponse>("/api/analytics/dataset/coverage");
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Dataset coverage API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Get anomaly summary
 */
export async function getAnomalySummary(
  track?: string,
  limit: number = 10
): Promise<AnomalySummary> {
  try {
    const params: Record<string, string | number> = { limit };
    if (track) params.track = track;
    
    const res = await client.get<AnomalySummary>("/api/analytics/alerts/anomaly-summary", { params });
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Anomaly summary API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

// ============================================================================
// INSIGHTS API FUNCTIONS
// ============================================================================

export interface Insight {
  insight_id: string;
  type: string;
  created_at: number;
}

export interface InsightsListResponse {
  insights: Insight[];
}

export interface InsightDetail {
  insight_id: string;
  type: string;
  title?: string;
  lap?: number;
  sector?: string;
  severity?: string;
  evidence?: Record<string, unknown>;
  trace?: {
    timestamps: number[];
    brake_pressure?: number[];
    speed_kmh?: number[];
  };
}

/**
 * List recent insights
 */
export async function listInsights(
  vehicleId?: string,
  limit: number = 20
): Promise<InsightsListResponse> {
  try {
    const params: Record<string, string | number> = { limit };
    if (vehicleId) params.vehicle_id = vehicleId;
    
    const res = await client.get<InsightsListResponse>("/api/insights", { params });
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Insights list API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

/**
 * Get insight details
 */
export async function getInsight(insightId: string): Promise<InsightDetail> {
  try {
    const res = await client.get<InsightDetail>(`/api/insights/${encodeURIComponent(insightId)}`);
    return res.data;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      throw new Error(`Insight API error (${axiosError.response?.status}): ${axiosError.response?.data?.message || axiosError.response?.statusText}`);
    } else if (error && typeof error === 'object' && 'request' in error) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Request error: ${message}`);
    }
  }
}

