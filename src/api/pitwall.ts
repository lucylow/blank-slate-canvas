// src/api/pitwall.ts
// API functions using axios client with proper error handling

import client from "./client";

export interface FeatureScore {
  name: string;
  score: number;
}

export interface TirePredictionResponse {
  chassis: string;
  track: string;
  predicted_loss_per_lap_s: number;
  laps_until_0_5s_loss: number;
  recommended_pit_lap?: number;
  feature_scores?: FeatureScore[];
  explanation?: string[];
  meta?: {
    model_version?: string;
    generated_at?: string;
    demo?: boolean;
  };
}

export interface HealthResponse {
  ok: boolean;
  model_versions?: Record<string, string>;
  timestamp?: string;
}

export async function predictTire(track: string, chassis: string): Promise<TirePredictionResponse> {
  try {
    const res = await client.get<TirePredictionResponse>(
      `/predict_tire/${encodeURIComponent(track)}/${encodeURIComponent(chassis)}`
    );
    return res.data;
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

// Fetch multi-track predictions (parallel)
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

// Get available models
export async function getModels(): Promise<Record<string, string>> {
  try {
    const res = await client.get<Record<string, string>>("/models");
    return res.data;
  } catch (error: any) {
    console.warn("[API] Models endpoint not available:", error.message);
    return {};
  }
}

// Health check
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const res = await client.get<HealthResponse>("/health");
    return res.data;
  } catch (error: any) {
    throw new Error("Health check failed: Backend may be unavailable");
  }
}

// Simulate strategy (POST)
export async function simulateStrategy(data: {
  track: string;
  chassis: string;
  strategy: any;
}): Promise<any> {
  try {
    const res = await client.post("/simulate", data);
    return res.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Simulate API error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else {
      throw new Error(`Simulate error: ${error.message}`);
    }
  }
}

