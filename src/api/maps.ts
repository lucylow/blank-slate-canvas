// src/api/maps.ts
// Maps and Location API client for PitWall

import client from './client';
import type { TrackId } from '@/lib/grCarTypes';

// ============================================================================
// Types
// ============================================================================

export interface GPSPoint {
  ts: number;
  lat: number;
  lon: number;
}

export interface MatchedPoint extends GPSPoint {
  s: number;
  offset_m: number;
  sector: string;
  arc_kappa: number;
  elevation?: number;
  matched_lat?: number;
  matched_lon?: number;
}

export interface TrackGeometry {
  track_id: string;
  name: string;
  centerline_geojson: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  sectors: Array<{
    id: string;
    start_s: number;
    end_s: number;
    name: string;
  }>;
  length_m: number;
  elevation_profile: Array<{
    s: number;
    elev: number;
  }>;
}

export interface TelemetrySample {
  ts: number;
  lat?: number;
  lon?: number;
  speed_kmh?: number;
  rpm?: number;
  can_brake?: number;
  brake?: number;
  throttle?: number;
  gear?: number;
  can_data?: Record<string, any>;
}

export interface EnrichedTelemetrySample extends TelemetrySample {
  s?: number;
  sector?: string;
  elevation?: number;
  curvature?: number;
  offset_m?: number;
  on_racing_line?: boolean;
}

export interface SectorMetric {
  sector_id: string;
  avg_speed_kmh?: number;
  peak_brake_g?: number;
  tire_temp_avg?: number;
  min_speed_kmh?: number;
  max_speed_kmh?: number;
  avg_throttle?: number;
  time_in_sector?: number;
}

export interface PitRouteResponse {
  entry_s: number;
  exit_s: number;
  expected_time_loss: number;
  route_geojson?: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  recommendation: string;
}

export interface HUDInsightUpdate {
  vehicle: string;
  ts: number;
  pit_window?: {
    recommendation: string;
    delta_s: number;
    risk: number;
  };
  highlight_path?: Array<{ lat: number; lon: number }>;
  evidence?: Record<string, any>;
  message?: string;
}

// ============================================================================
// Track Geometry APIs
// ============================================================================

/**
 * Get track geometry, sectors, and metadata
 */
export async function getTrackGeometry(trackId: TrackId | string): Promise<TrackGeometry> {
  const response = await client.get<TrackGeometry>(`/api/maps/track/${trackId}`);
  return response.data;
}

/**
 * Get tile specification for track
 */
export async function getTileSpec(trackId: TrackId | string) {
  const response = await client.get(`/api/maps/track/${trackId}/tilespec`);
  return response.data;
}

// ============================================================================
// Map Matching APIs
// ============================================================================

/**
 * Snap raw GPS telemetry points to nearest track centerline
 */
export async function matchPoints(
  trackId: TrackId | string,
  points: GPSPoint[]
): Promise<MatchedPoint[]> {
  const response = await client.post<{ matches: MatchedPoint[] }>('/api/maps/match', {
    track_id: trackId,
    points,
  });
  return response.data.matches;
}

// ============================================================================
// Telemetry Enrichment APIs
// ============================================================================

/**
 * Enrich telemetry samples with spatial data
 */
export async function enrichTelemetry(
  chassis: string,
  samples: TelemetrySample[],
  trackId?: TrackId | string
): Promise<EnrichedTelemetrySample[]> {
  const response = await client.post<{ enriched_samples: EnrichedTelemetrySample[] }>(
    '/api/maps/telemetry/enrich',
    {
      chassis,
      track_id: trackId,
      samples,
    }
  );
  return response.data.enriched_samples;
}

// ============================================================================
// Sector Metrics APIs
// ============================================================================

/**
 * Get per-sector metrics computed from telemetry for a lap
 */
export async function getSectorMetrics(
  trackId: TrackId | string,
  lap: number,
  chassis: string
): Promise<{
  lap: number;
  chassis: string;
  track_id: string;
  sectors: SectorMetric[];
}> {
  const response = await client.get<{
    lap: number;
    chassis: string;
    track_id: string;
    sectors: SectorMetric[];
  }>(`/api/maps/track/${trackId}/sector_metrics`, {
    params: { lap, chassis },
  });
  return response.data;
}

// ============================================================================
// Pit Route Optimization APIs
// ============================================================================

/**
 * Compute safe pit entry routing
 */
export async function optimizePitRoute(
  vehicle: string,
  sCurrent: number,
  trackId: TrackId | string,
  predictedTraffic?: any[]
): Promise<PitRouteResponse> {
  const response = await client.post<PitRouteResponse>('/api/maps/optimization/pit-route', {
    vehicle,
    s_current: sCurrent,
    track_id: trackId,
    predicted_traffic: predictedTraffic,
  });
  return response.data;
}

// ============================================================================
// HUD/XR Feed APIs
// ============================================================================

/**
 * Create EventSource for HUD/XR SSE feed
 */
export function createHUDEventSource(vehicle: string): EventSource {
  const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
  const url = baseUrl ? `${baseUrl}/api/maps/sse/hud/${vehicle}` : `/api/maps/sse/hud/${vehicle}`;
  return new EventSource(url);
}

/**
 * Create WebSocket connection for HUD/XR feed
 */
export function createHUDWebSocket(vehicle: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const baseUrl = import.meta.env.VITE_BACKEND_WS_URL;
  
  if (baseUrl) {
    const wsUrl = baseUrl.startsWith('ws://') || baseUrl.startsWith('wss://')
      ? baseUrl
      : `${protocol}//${baseUrl.replace(/^https?:\/\//, '')}`;
    return new WebSocket(`${wsUrl}/ws/maps/hud/${vehicle}`);
  }
  
  // Fallback: use current host
  return new WebSocket(`${protocol}//${host}/ws/maps/hud/${vehicle}`);
}

// ============================================================================
// Edge Export APIs
// ============================================================================

/**
 * Export map assets and models for edge devices
 */
export async function exportEdgeAssets(
  trackId: TrackId | string,
  bbox?: [number, number, number, number],
  modelVersion?: string
) {
  const response = await client.post('/api/maps/edge/export', {
    track_id: trackId,
    bbox,
    model_version: modelVersion,
  });
  return response.data;
}


