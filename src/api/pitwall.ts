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
  } catch (error: any) {
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
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Tracks API error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      throw new Error(`Request error: ${error.message}`);
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
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Track API error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      throw new Error(`Request error: ${error.message}`);
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
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Race info API error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      throw new Error(`Request error: ${error.message}`);
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
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Dashboard API error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      throw new Error(`Request error: ${error.message}`);
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
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Tire wear API error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
}

/**
 * Analyze driver performance
 */
export async function analyzePerformance(request: PerformanceRequest): Promise<{ success: boolean; data: PerformanceMetrics; timestamp: string }> {
  try {
    const res = await client.post("/api/analytics/performance", request);
    return res.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Performance API error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      throw new Error(`Request error: ${error.message}`);
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
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Strategy API error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      throw new Error(`Request error: ${error.message}`);
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
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Gap analysis API error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      throw new Error(`Request error: ${error.message}`);
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
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Predict API error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
}

/**
 * Legacy strategy simulation function (for backward compatibility)
 */
export async function simulateStrategy(data: {
  track: string;
  chassis: string;
  strategy: any;
}): Promise<any> {
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
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Simulate API error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else {
      throw new Error(`Simulate error: ${error.message}`);
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

