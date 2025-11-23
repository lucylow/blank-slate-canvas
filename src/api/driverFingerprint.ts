// src/api/driverFingerprint.ts
// API client for driver fingerprinting endpoints

import client from "./client";

export interface TelemetryRequest {
  session_id?: string;
  brake_events?: any[];
  throttle_data?: any[];
  cornering_events?: any[];
  lap_times?: number[];
  sector_data?: any[];
  steering_data?: any[];
  session_type?: string;
}

export interface DriverFingerprint {
  id: string;
  driver_id: string;
  features: {
    braking_consistency: number;
    throttle_smoothness: number;
    cornering_style: number;
    lap_consistency: number;
    tire_stress_index: number;
    overall_score: number;
    [key: string]: any;
  };
  created_at: string;
  session_type?: string;
}

export interface CoachingAlert {
  id: string;
  type: string;
  category: string;
  message: string;
  priority: "critical" | "high" | "medium" | "low";
  improvement_area: string;
  feature_value?: number;
  threshold?: number;
  confidence?: number;
  timestamp: string;
}

export interface CoachingPlan {
  driver_id: string;
  generated_at: string;
  overall_score: number;
  priority_areas: string[];
  weekly_focus: string[];
  specific_drills: string[];
  progress_metrics: {
    target_braking_consistency: number;
    target_throttle_smoothness: number;
    target_lap_consistency: number;
    target_overall_score: number;
  };
}

export interface FingerprintResponse {
  success: boolean;
  fingerprint: DriverFingerprint;
  comparison?: {
    deviation: number;
    changes: any[];
  };
  alerts?: CoachingAlert[];
  coaching_plan?: CoachingPlan;
}

/**
 * Process telemetry data and generate driver fingerprint
 */
export async function processTelemetry(
  driverId: string,
  telemetry: TelemetryRequest
): Promise<FingerprintResponse> {
  try {
    const res = await client.post<FingerprintResponse>(
      `/api/drivers/${encodeURIComponent(driverId)}/process`,
      telemetry
    );
    return res.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail || `Failed to process telemetry: ${error.message}`
    );
  }
}

/**
 * Get driver's current fingerprint
 */
export async function getFingerprint(driverId: string): Promise<DriverFingerprint> {
  try {
    const res = await client.get<{ success: boolean; fingerprint: DriverFingerprint }>(
      `/api/drivers/${encodeURIComponent(driverId)}/fingerprint`
    );
    return res.data.fingerprint;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`No fingerprint found for driver ${driverId}`);
    }
    throw new Error(
      error.response?.data?.detail || `Failed to get fingerprint: ${error.message}`
    );
  }
}

/**
 * Get coaching alerts for driver
 */
export async function getAlerts(driverId: string): Promise<CoachingAlert[]> {
  try {
    const res = await client.get<{ success: boolean; alerts: CoachingAlert[] }>(
      `/api/drivers/${encodeURIComponent(driverId)}/alerts`
    );
    return res.data.alerts;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail || `Failed to get alerts: ${error.message}`
    );
  }
}

/**
 * Get personalized coaching plan
 */
export async function getCoachingPlan(driverId: string): Promise<CoachingPlan> {
  try {
    const res = await client.get<{ success: boolean; coaching_plan: CoachingPlan }>(
      `/api/drivers/${encodeURIComponent(driverId)}/coaching-plan`
    );
    return res.data.coaching_plan;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(`No coaching plan found for driver ${driverId}`);
    }
    throw new Error(
      error.response?.data?.detail || `Failed to get coaching plan: ${error.message}`
    );
  }
}

/**
 * Compare driver with another driver (e.g., teammate)
 */
export async function compareDrivers(
  driverId: string,
  baselineDriverId: string
): Promise<any> {
  try {
    const res = await client.get<{ success: boolean; comparison: any }>(
      `/api/drivers/${encodeURIComponent(driverId)}/compare/${encodeURIComponent(baselineDriverId)}`
    );
    return res.data.comparison;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.detail || `Failed to compare drivers: ${error.message}`
    );
  }
}


