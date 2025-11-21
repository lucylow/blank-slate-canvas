// src/lib/demoData.ts
// Utility functions for loading and using demo data from JSON files

/**
 * Demo data configuration constants
 */
export const DEMO_DATA_CONFIG = {
  BASE_PATH: '/demo_data',
  TRACKS_INDEX: '/demo_data/tracks_index.json',
  MAX_CACHE_SIZE: 500,
  REQUEST_TIMEOUT: 10000, // 10 seconds
} as const;

export interface TelemetrySample {
  expire_at: number | null;
  lap: number;
  meta_event: string;
  meta_session: string;
  meta_source: string;
  meta_time: string;
  original_vehicle_id: string;
  outing: number;
  telemetry_name: string;
  telemetry_value: number;
  timestamp: string;
  vehicle_id: string;
  vehicle_number: number;
}

export interface LapTimesSample {
  vehicle_id: string;
  lap: number;
  timestamp: string;
  [key: string]: unknown;
}

export interface WeatherSample {
  TIME_UTC_STR: string;
  AIR_TEMP?: number;
  TRACK_TEMP?: number;
  HUMIDITY?: number;
  WIND_SPEED?: number;
  RAIN?: number;
  [key: string]: unknown;
}

export interface RaceDemoData {
  race_number: number;
  telemetry_sample: TelemetrySample[] | null;
  lap_times_sample: LapTimesSample[] | null;
  weather_sample: WeatherSample[] | null;
}

export interface TrackDemoData {
  track_id: string;
  track_name: string;
  location: string;
  races: RaceDemoData[];
}

export interface TrackIndexEntry {
  track_id: string;
  track_name: string;
  location: string;
  races_available: number;
}

export interface TracksIndex {
  tracks: TrackIndexEntry[];
  total_tracks: number;
}

/**
 * Load a track's demo data from JSON file with error handling and validation
 */
export async function loadTrackDemo(trackId: string): Promise<TrackDemoData> {
  if (!trackId || typeof trackId !== 'string') {
    throw new Error('Invalid track ID provided');
  }

  const normalizedTrackId = trackId.toLowerCase().trim().replace(/\s+/g, '_');
  const url = `${DEMO_DATA_CONFIG.BASE_PATH}/${normalizedTrackId}_demo.json`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEMO_DATA_CONFIG.REQUEST_TIMEOUT);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Demo data not found for track: ${trackId}`);
      }
      throw new Error(`Failed to load demo data for ${trackId}: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Basic validation
    if (!data || typeof data !== 'object') {
      throw new Error(`Invalid demo data format for track: ${trackId}`);
    }

    // Ensure track_id matches
    if (data.track_id && data.track_id !== normalizedTrackId) {
      console.warn(`Track ID mismatch: expected ${normalizedTrackId}, got ${data.track_id}`);
    }

    return data as TrackDemoData;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout loading demo data for ${trackId}`);
      }
      throw error;
    }
    throw new Error(`Unexpected error loading demo data for ${trackId}: ${String(error)}`);
  }
}

/**
 * Load the tracks index file with error handling and caching
 */
let tracksIndexCache: TracksIndex | null = null;
let tracksIndexCacheTime: number = 0;
const TRACKS_INDEX_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function loadTracksIndex(useCache: boolean = true): Promise<TracksIndex> {
  const now = Date.now();
  
  // Return cached data if available and fresh
  if (useCache && tracksIndexCache && (now - tracksIndexCacheTime) < TRACKS_INDEX_CACHE_TTL) {
    return tracksIndexCache;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEMO_DATA_CONFIG.REQUEST_TIMEOUT);

    const response = await fetch(DEMO_DATA_CONFIG.TRACKS_INDEX, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to load tracks index: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate structure
    if (!data || typeof data !== 'object' || !Array.isArray(data.tracks)) {
      throw new Error('Invalid tracks index format');
    }

    // Update cache
    tracksIndexCache = data as TracksIndex;
    tracksIndexCacheTime = now;

    return tracksIndexCache;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout loading tracks index');
      }
      throw error;
    }
    throw new Error(`Unexpected error loading tracks index: ${String(error)}`);
  }
}

/**
 * Clear the tracks index cache
 */
export function clearTracksIndexCache(): void {
  tracksIndexCache = null;
  tracksIndexCacheTime = 0;
}

/**
 * Get available track IDs from the index with fallback
 */
const FALLBACK_TRACK_IDS = ['sebring', 'vir', 'road_america', 'sonoma', 'barber', 'cota', 'indianapolis'] as const;

export async function getAvailableTrackIds(): Promise<string[]> {
  try {
    const index = await loadTracksIndex();
    const trackIds = index.tracks
      .filter(track => track.races_available > 0) // Only tracks with available races
      .map(track => track.track_id);
    
    return trackIds.length > 0 ? trackIds : [...FALLBACK_TRACK_IDS];
  } catch (error) {
    console.warn('Error getting available track IDs from index, using fallback:', error);
    // Fallback to known track IDs if index fails to load
    return [...FALLBACK_TRACK_IDS];
  }
}

/**
 * Check if demo data is available for a track
 */
export async function isDemoDataAvailable(trackId: string): Promise<boolean> {
  if (!trackId || typeof trackId !== 'string') {
    return false;
  }

  const normalizedTrackId = trackId.toLowerCase().trim().replace(/\s+/g, '_');

  try {
    const index = await loadTracksIndex();
    return index.tracks.some(
      track => track.track_id === normalizedTrackId && track.races_available > 0
    );
  } catch (error) {
    // If index fails, try to load the track file directly
    try {
      const url = `${DEMO_DATA_CONFIG.BASE_PATH}/${normalizedTrackId}_demo.json`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEMO_DATA_CONFIG.REQUEST_TIMEOUT);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Get telemetry data for a specific race from demo data
 */
export function getTelemetryForRace(
  demoData: TrackDemoData,
  raceNumber: number
): TelemetrySample[] {
  if (!demoData || !Array.isArray(demoData.races)) {
    console.warn('Invalid demo data structure');
    return [];
  }

  const race = demoData.races.find(r => r.race_number === raceNumber);
  if (!race) {
    console.warn(`Race ${raceNumber} not found in demo data for track ${demoData.track_id}`);
    return [];
  }

  return race.telemetry_sample || [];
}

/**
 * Get lap times for a specific race from demo data
 */
export function getLapTimesForRace(
  demoData: TrackDemoData,
  raceNumber: number
): LapTimesSample[] {
  if (!demoData || !Array.isArray(demoData.races)) {
    return [];
  }

  const race = demoData.races.find(r => r.race_number === raceNumber);
  return race?.lap_times_sample || [];
}

/**
 * Get weather data for a specific race from demo data
 */
export function getWeatherForRace(
  demoData: TrackDemoData,
  raceNumber: number
): WeatherSample[] {
  if (!demoData || !Array.isArray(demoData.races)) {
    return [];
  }

  const race = demoData.races.find(r => r.race_number === raceNumber);
  return race?.weather_sample || [];
}

/**
 * Convert demo telemetry sample to format expected by frontend components
 */
export function convertTelemetrySample(sample: TelemetrySample): Record<string, unknown> {
  return {
    vehicle_id: sample.vehicle_id,
    vehicle_number: sample.vehicle_number,
    lap: sample.lap,
    timestamp: sample.timestamp,
    [sample.telemetry_name]: sample.telemetry_value,
  };
}

/**
 * Get all unique telemetry metrics from a race
 */
export function getTelemetryMetrics(
  demoData: TrackDemoData,
  raceNumber: number
): string[] {
  const telemetry = getTelemetryForRace(demoData, raceNumber);
  const metrics = new Set<string>();
  telemetry.forEach(point => {
    if (point.telemetry_name) {
      metrics.add(point.telemetry_name);
    }
  });
  return Array.from(metrics).sort();
}

/**
 * Get all unique vehicle IDs from a race
 */
export function getVehicleIds(
  demoData: TrackDemoData,
  raceNumber: number
): string[] {
  const telemetry = getTelemetryForRace(demoData, raceNumber);
  const vehicleIds = new Set<string>();
  
  telemetry.forEach(point => {
    if (point.vehicle_id && typeof point.vehicle_id === 'string') {
      vehicleIds.add(point.vehicle_id);
    }
  });
  
  return Array.from(vehicleIds).sort();
}

/**
 * Normalize track ID to standard format
 */
export function normalizeTrackId(trackId: string): string {
  if (!trackId || typeof trackId !== 'string') {
    return '';
  }
  return trackId.toLowerCase().trim().replace(/\s+/g, '_');
}

/**
 * Validate demo data structure
 */
export function validateTrackDemoData(data: unknown): data is TrackDemoData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const demo = data as Partial<TrackDemoData>;
  
  if (!demo.track_id || typeof demo.track_id !== 'string') {
    return false;
  }

  if (!Array.isArray(demo.races)) {
    return false;
  }

  return true;
}

