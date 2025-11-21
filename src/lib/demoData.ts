// src/lib/demoData.ts
// Utility functions for loading and using demo data from JSON files

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
 * Load a track's demo data from JSON file
 */
export async function loadTrackDemo(trackId: string): Promise<TrackDemoData> {
  try {
    const response = await fetch(`/demo_data/${trackId}_demo.json`);
    if (!response.ok) {
      throw new Error(`Failed to load demo data for ${trackId}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading demo data for ${trackId}:`, error);
    throw error;
  }
}

/**
 * Load the tracks index file
 */
export async function loadTracksIndex(): Promise<TracksIndex> {
  try {
    const response = await fetch('/demo_data/tracks_index.json');
    if (!response.ok) {
      throw new Error(`Failed to load tracks index: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading tracks index:', error);
    throw error;
  }
}

/**
 * Get available track IDs from the index
 */
export async function getAvailableTrackIds(): Promise<string[]> {
  try {
    const index = await loadTracksIndex();
    return index.tracks.map(track => track.track_id);
  } catch (error) {
    console.error('Error getting available track IDs:', error);
    // Fallback to known track IDs if index fails to load
    return ['sebring', 'vir', 'road_america', 'sonoma', 'barber', 'cota', 'indianapolis'];
  }
}

/**
 * Check if demo data is available for a track
 */
export async function isDemoDataAvailable(trackId: string): Promise<boolean> {
  try {
    const index = await loadTracksIndex();
    return index.tracks.some(track => track.track_id === trackId && track.races_available > 0);
  } catch (error) {
    // If index fails, try to load the track file directly
    try {
      const response = await fetch(`/demo_data/${trackId}_demo.json`, { method: 'HEAD' });
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
  const race = demoData.races.find(r => r.race_number === raceNumber);
  return race?.telemetry_sample || [];
}

/**
 * Get lap times for a specific race from demo data
 */
export function getLapTimesForRace(
  demoData: TrackDemoData,
  raceNumber: number
): LapTimesSample[] {
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
    if (point.vehicle_id) {
      vehicleIds.add(point.vehicle_id);
    }
  });
  return Array.from(vehicleIds).sort();
}

