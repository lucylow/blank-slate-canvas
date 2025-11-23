// src/api/edgeFunctions.ts
// API client for Edge Functions with proper error handling and observability

import client from "./client";

// ============================================================================
// Type Definitions
// ============================================================================

export interface CoachingInput {
  chassisId: string;
  lap: number;
  sector?: number;
  telemetryWindow: Array<{
    t: number;
    speed: number;
    accx: number;
    accy: number;
    brake: number;
    throttle: number;
    steering: number;
  }>;
  modelVersion?: string;
}

export interface CoachingOutput {
  requestId: string;
  adviceId: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
  evidence: Array<{ time: string; metric: string; value: number }>;
  confidence: number;
  cached_until?: string | null;
}

export interface PitWindowInput {
  sessionMeta?: Record<string, any>;
  chassisId: string;
  lapNumber: number;
  remainingLaps: number;
  pitLossSeconds?: number;
  currentTireState?: Record<string, any>;
  competitorPositions?: Array<any>;
}

export interface PitWindowOutput {
  requestId: string;
  recommendedWindow: [number, number] | null;
  expectedGainSeconds: number;
  confidence: number;
  scenarios: Array<{ label: string; totalTime: number }>;
  cached_until?: string | null;
  reason?: string;
  safeFallback?: string;
}

export interface TireWearInput {
  chassisId: string;
  lapHistory: Array<any>;
  ambientTemp?: number;
  compound?: string;
}

export interface TireWearOutput {
  requestId: string;
  pred_loss_per_lap_seconds: number;
  laps_until_0_5s: number;
  temp_map: number[][];
  confidence: number;
  cached_until?: string | null;
  stale?: boolean;
}

export interface EdgeFunctionStatus {
  name: string;
  status: 'active' | 'idle' | 'degraded' | 'failed';
  invocations: number;
  successRate: number;
  p95Latency: number;
  avgConfidence: number;
  lastUpdated: string;
}

export interface EdgeFunctionMetrics {
  invocations: number;
  success_rate: number;
  p95_latency_ms: number;
  avg_confidence: number;
  last_seen: string;
}

// ============================================================================
// API Functions
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function getEdgeFunctionUrl(functionName: string): string {
  if (SUPABASE_URL) {
    return `${SUPABASE_URL}/functions/v1/${functionName}`;
  }
  // Fallback for local development
  return `/api/edge/${functionName}`;
}

/**
 * Call coaching edge function
 */
export async function callCoaching(input: CoachingInput): Promise<CoachingOutput> {
  try {
    const response = await fetch(getEdgeFunctionUrl('coaching'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.message || `Coaching function failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to call coaching function');
  }
}

/**
 * Call pit-window edge function
 */
export async function callPitWindow(input: PitWindowInput): Promise<PitWindowOutput> {
  try {
    const response = await fetch(getEdgeFunctionUrl('pit-window'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.message || `Pit window function failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to call pit-window function');
  }
}

/**
 * Call predict-tire-wear edge function
 */
export async function callPredictTireWear(input: TireWearInput): Promise<TireWearOutput> {
  try {
    const response = await fetch(getEdgeFunctionUrl('predict-tire-wear'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.message || `Tire wear prediction function failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to call predict-tire-wear function');
  }
}

/**
 * Get metrics for all edge functions (last hour)
 */
export async function getEdgeFunctionMetrics(): Promise<Record<string, EdgeFunctionMetrics>> {
  try {
    // In a real implementation, this would query your observability backend
    // For now, we'll return mock data structure
    const response = await client.get('/api/edge-functions/metrics');
    return response.data;
  } catch (error) {
    // Return empty metrics if endpoint doesn't exist
    return {
      coaching: {
        invocations: 0,
        success_rate: 0,
        p95_latency_ms: 0,
        avg_confidence: 0,
        last_seen: new Date().toISOString(),
      },
      'pit-window': {
        invocations: 0,
        success_rate: 0,
        p95_latency_ms: 0,
        avg_confidence: 0,
        last_seen: new Date().toISOString(),
      },
      'predict-tire-wear': {
        invocations: 0,
        success_rate: 0,
        p95_latency_ms: 0,
        avg_confidence: 0,
        last_seen: new Date().toISOString(),
      },
    };
  }
}

/**
 * Test an edge function with sample data
 */
export async function testEdgeFunction(
  functionName: 'coaching' | 'pit-window' | 'predict-tire-wear'
): Promise<any> {
  const testInputs = {
    coaching: {
      chassisId: 'test-chassis-1',
      lap: 5,
      sector: 1,
      telemetryWindow: [
        { t: 0, speed: 120, accx: 0.5, accy: 0.3, brake: 0, throttle: 0.8, steering: 0.1 },
        { t: 1, speed: 125, accx: 0.6, accy: 0.2, brake: 0, throttle: 0.9, steering: 0.05 },
      ],
      modelVersion: 'v1.0',
    },
    'pit-window': {
      chassisId: 'test-chassis-1',
      lapNumber: 10,
      remainingLaps: 15,
      pitLossSeconds: 25,
      currentTireState: { wear: 0.6 },
      competitorPositions: [],
    },
    'predict-tire-wear': {
      chassisId: 'test-chassis-1',
      lapHistory: [
        { lap: 1, avgSpeed: 120, tireTemp: 85 },
        { lap: 2, avgSpeed: 122, tireTemp: 87 },
      ],
      ambientTemp: 25,
      compound: 'medium',
    },
  };

  const input = testInputs[functionName];

  switch (functionName) {
    case 'coaching':
      return callCoaching(input as CoachingInput);
    case 'pit-window':
      return callPitWindow(input as PitWindowInput);
    case 'predict-tire-wear':
      return callPredictTireWear(input as TireWearInput);
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
}


