// src/api/demo.ts
// Demo API functions for offline/demo mode

export interface DemoDataResponse {
  meta: {
    source: string;
    count: number;
    tracks_available: number;
    loaded_at: string;
  };
  telemetry: any[];
  tracks: Record<string, any>;
}

export interface DemoPredictionResponse {
  chassis: string;
  track: string;
  predicted_loss_per_lap_s: number;
  laps_until_0_5s_loss: number;
  recommended_pit_lap: number;
  feature_scores: Array<{ name: string; score: number }>;
  explanation: string[];
  meta: {
    model_version: string;
    generated_at: string;
    demo: boolean;
    points_analyzed?: number;
  };
}

/**
 * Get full demo dataset
 */
export async function getDemoData(): Promise<DemoDataResponse> {
  const baseUrl = import.meta.env.VITE_DEMO_API_URL || 'http://localhost:8081';
  const response = await fetch(`${baseUrl}/api/demo_data`);
  if (!response.ok) {
    throw new Error(`Failed to fetch demo data: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get demo prediction for a track and chassis
 */
export async function predictDemo(
  track: string,
  chassis: string = 'GR86-DEMO-01'
): Promise<DemoPredictionResponse> {
  const baseUrl = import.meta.env.VITE_DEMO_API_URL || 'http://localhost:8081';
  const encodedTrack = encodeURIComponent(track);
  const encodedChassis = encodeURIComponent(chassis);
  const response = await fetch(
    `${baseUrl}/api/predict_demo/${encodedTrack}/${encodedChassis}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch demo prediction: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Check demo server health
 */
export async function checkDemoHealth(): Promise<{
  ok: boolean;
  status: string;
  demo_count: number;
  tracks_available: number;
  time: string;
  demo_mode: boolean;
}> {
  const baseUrl = import.meta.env.VITE_DEMO_API_URL || 'http://localhost:8081';
  const response = await fetch(`${baseUrl}/api/health`);
  if (!response.ok) {
    throw new Error(`Demo server health check failed: ${response.statusText}`);
  }
  return response.json();
}

