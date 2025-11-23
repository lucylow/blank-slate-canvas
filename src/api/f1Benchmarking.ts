/**
 * F1 Benchmarking API Client
 * Free F1 APIs: Ergast, OpenF1, F1API.dev (no API keys required)
 */

import { getBackendUrl } from '@/utils/backendUrl';

const BASE_URL = getBackendUrl() || (import.meta.env.DEV ? '/api' : '');

export interface F1Race {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    url: string;
    circuitName: string;
    Location: {
      lat: string;
      long: string;
      locality: string;
      country: string;
    };
  };
  date: string;
  time?: string;
}

export interface F1DriverStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver: {
    driverId: string;
    permanentNumber?: string;
    code: string;
    url: string;
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    nationality: string;
  };
  Constructors: Array<{
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  }>;
}

export interface F1RaceResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: {
    driverId: string;
    permanentNumber?: string;
    code: string;
    url: string;
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    nationality: string;
  };
  Constructor: {
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  };
  grid: string;
  laps: string;
  status: string;
  Time?: {
    millis: string;
    time: string;
  };
  FastestLap?: {
    rank: string;
    lap: string;
    Time: {
      time: string;
    };
    AverageSpeed: {
      units: string;
      speed: string;
    };
  };
}

export interface F1LapTime {
  number: string;
  Timings: Array<{
    driverId: string;
    position: string;
    time: string;
  }>;
}

export interface F1PitStop {
  driverId: string;
  lap: string;
  stop: string;
  time: string;
  duration: string;
}

export interface F1Circuit {
  circuitId: string;
  url: string;
  circuitName: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
}

// Ergast F1 API endpoints

/**
 * Get current F1 season race calendar
 */
export async function getCurrentF1Season(): Promise<{ success: boolean; data: F1Race[]; count: number }> {
  const response = await fetch(`${BASE_URL}/f1/seasons/current`);
  if (!response.ok) {
    throw new Error(`Failed to fetch current F1 season: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get all races for a specific F1 season
 */
export async function getF1Season(year: number): Promise<{ success: boolean; year: number; data: F1Race[]; count: number }> {
  const response = await fetch(`${BASE_URL}/f1/seasons/${year}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch F1 season ${year}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get comprehensive race data
 */
export async function getF1Race(
  year: number,
  round: number,
  options?: {
    includeQualifying?: boolean;
    includeLaps?: boolean;
    includePitstops?: boolean;
  }
): Promise<{
  success: boolean;
  year: number;
  round: number;
  race: any;
  qualifying?: any;
  lap_times?: F1LapTime[];
  pit_stops?: F1PitStop[];
}> {
  const params = new URLSearchParams();
  if (options?.includeQualifying) params.append('include_qualifying', 'true');
  if (options?.includeLaps) params.append('include_laps', 'true');
  if (options?.includePitstops) params.append('include_pitstops', 'true');
  
  const url = `${BASE_URL}/f1/races/${year}/${round}${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch F1 race ${year}/${round}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get F1 race data for strategy comparison
 */
export async function getF1StrategyComparison(
  year: number,
  round: number,
  comparisonType: 'pit_stops' | 'lap_times' | 'tire_deg' = 'pit_stops'
): Promise<{
  success: boolean;
  comparison_type: string;
  race: any;
  pit_stops?: F1PitStop[];
  lap_times?: F1LapTime[];
  use_case: string;
}> {
  const response = await fetch(
    `${BASE_URL}/f1/strategies/comparison?year=${year}&round=${round}&comparison_type=${comparisonType}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch F1 strategy comparison: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get F1 driver championship standings
 */
export async function getF1DriverStandings(
  year?: number
): Promise<{ success: boolean; year: number | string; data: F1DriverStanding[]; count: number }> {
  const url = year 
    ? `${BASE_URL}/f1/standings/drivers?year=${year}`
    : `${BASE_URL}/f1/standings/drivers`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch F1 driver standings: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get all F1 circuits
 */
export async function getF1Circuits(): Promise<{ success: boolean; data: F1Circuit[]; count: number }> {
  const response = await fetch(`${BASE_URL}/f1/circuits`);
  if (!response.ok) {
    throw new Error(`Failed to fetch F1 circuits: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get detailed circuit information
 */
export async function getF1CircuitInfo(circuitId: string): Promise<{ success: boolean; circuit_id: string; data: F1Circuit }> {
  const response = await fetch(`${BASE_URL}/f1/circuits/${circuitId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch F1 circuit info: ${response.statusText}`);
  }
  return response.json();
}

// OpenF1 API endpoints

/**
 * Get F1 sessions from OpenF1 (for telemetry analysis)
 */
export async function getOpenF1Sessions(
  options?: {
    date?: string; // YYYY-MM-DD
    location?: string;
  }
): Promise<{ success: boolean; data: any[]; count: number }> {
  const params = new URLSearchParams();
  if (options?.date) params.append('date_filter', options.date);
  if (options?.location) params.append('location', options.location);
  
  const url = `${BASE_URL}/f1/telemetry/sessions${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenF1 sessions: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get lap time telemetry from OpenF1
 */
export async function getOpenF1LapTimes(
  sessionKey: number,
  options?: {
    driverNumber?: number;
    lapNumber?: number;
  }
): Promise<{ success: boolean; session_key: number; data: any[]; count: number }> {
  const params = new URLSearchParams();
  if (options?.driverNumber) params.append('driver_number', options.driverNumber.toString());
  if (options?.lapNumber) params.append('lap_number', options.lapNumber.toString());
  
  const url = `${BASE_URL}/f1/telemetry/laps/${sessionKey}${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenF1 lap times: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get car telemetry data from OpenF1
 */
export async function getOpenF1CarTelemetry(
  sessionKey: number,
  driverNumber?: number
): Promise<{ success: boolean; session_key: number; driver_number?: number; data: any[]; count: number }> {
  const params = driverNumber ? `?driver_number=${driverNumber}` : '';
  const response = await fetch(`${BASE_URL}/f1/telemetry/car_data/${sessionKey}${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenF1 car telemetry: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get stint data (tire compounds, pit stops) from OpenF1
 */
export async function getOpenF1Stints(
  sessionKey: number,
  driverNumber?: number
): Promise<{ success: boolean; session_key: number; data: any[]; count: number }> {
  const params = driverNumber ? `?driver_number=${driverNumber}` : '';
  const response = await fetch(`${BASE_URL}/f1/telemetry/stints/${sessionKey}${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenF1 stints: ${response.statusText}`);
  }
  return response.json();
}

