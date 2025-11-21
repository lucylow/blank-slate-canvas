// src/api/demo.ts
// Demo API functions for offline/demo mode

/**
 * Demo API configuration
 */
const DEMO_API_CONFIG = {
  BASE_URL: import.meta.env.VITE_DEMO_API_URL || 'http://localhost:8081',
  REQUEST_TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * Create a fetch request with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEMO_API_CONFIG.REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: ${url}`);
    }
    throw error;
  }
}

/**
 * Retry a fetch request with exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  attempts: number = DEMO_API_CONFIG.RETRY_ATTEMPTS
): Promise<Response> {
  let lastError: Error | null = null;

  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchWithTimeout(url, options);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Response && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (i < attempts - 1) {
        const delay = DEMO_API_CONFIG.RETRY_DELAY * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries');
}

export interface TelemetryRecord {
  [key: string]: unknown;
  timestamp?: string;
  vehicle_id?: string;
  vehicle_number?: number;
  lap?: number;
}

export interface TrackData {
  [key: string]: unknown;
  track_id?: string;
  track_name?: string;
  location?: string;
}

export interface DemoDataResponse {
  meta: {
    source: string;
    count: number;
    tracks_available: number;
    loaded_at: string;
  };
  telemetry: TelemetryRecord[];
  tracks: Record<string, TrackData>;
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
  const url = `${DEMO_API_CONFIG.BASE_URL}/api/demo_data`;
  
  try {
    const response = await fetchWithRetry(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch demo data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Basic validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid demo data response format');
    }

    return data as DemoDataResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unexpected error fetching demo data: ${String(error)}`);
  }
}

/**
 * Get demo prediction for a track and chassis
 */
export async function predictDemo(
  track: string,
  chassis: string = 'GR86-DEMO-01'
): Promise<DemoPredictionResponse> {
  if (!track || typeof track !== 'string') {
    throw new Error('Invalid track parameter');
  }

  if (!chassis || typeof chassis !== 'string') {
    throw new Error('Invalid chassis parameter');
  }

  const encodedTrack = encodeURIComponent(track);
  const encodedChassis = encodeURIComponent(chassis);
  const url = `${DEMO_API_CONFIG.BASE_URL}/api/predict_demo/${encodedTrack}/${encodedChassis}`;

  try {
    const response = await fetchWithRetry(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Demo prediction not found for track: ${track}, chassis: ${chassis}`);
      }
      throw new Error(`Failed to fetch demo prediction: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Basic validation
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid demo prediction response format');
    }

    return data as DemoPredictionResponse;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unexpected error fetching demo prediction: ${String(error)}`);
  }
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
  active_track?: string;
  active_vehicles?: string[];
}> {
  const url = `${DEMO_API_CONFIG.BASE_URL}/api/health`;

  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json',
      },
    }, 5000); // Shorter timeout for health checks

    if (!response.ok) {
      throw new Error(`Demo server health check failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Basic validation
    if (!data || typeof data !== 'object' || typeof data.ok !== 'boolean') {
      throw new Error('Invalid health check response format');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Unexpected error checking demo server health: ${String(error)}`);
  }
}

