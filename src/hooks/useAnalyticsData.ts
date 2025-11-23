import { useState, useEffect } from 'react';
import { loadTracksIndex, loadTrackDemo, type TrackDemoData, type TelemetrySample } from '@/lib/demoData';

export interface LapTimeData {
  track_id: string;
  track_name: string;
  lap: number;
  vehicle_number: number;
  lap_time: number; // in seconds
  race_number: number;
}

export interface TireWearData {
  track_id: string;
  track_name: string;
  vehicle_number: number;
  tire_wear: number; // cumulative wear index
  race_number: number;
}

export interface AnalyticsData {
  lapTimes: LapTimeData[];
  tireWear: TireWearData[];
  loading: boolean;
  error: string | null;
}

/**
 * Calculate tire wear from telemetry data
 * Uses cumulative G-force exposure (accx_can + accy_can)
 * Also considers braking and cornering events
 */
function calculateTireWear(telemetry: TelemetrySample[]): number {
  if (!telemetry || telemetry.length === 0) return 0;
  
  let cumulativeWear = 0;
  let gForceCount = 0;
  
  for (const point of telemetry) {
    if (point.telemetry_name === 'accx_can' || point.telemetry_name === 'accy_can') {
      const gForce = Math.abs(point.telemetry_value || 0);
      cumulativeWear += gForce;
      gForceCount++;
    } else if (point.telemetry_name === 'pbrake_f' || point.telemetry_name === 'pbrake_r') {
      // Braking contributes to tire wear
      const brakePressure = Math.abs(point.telemetry_value || 0);
      cumulativeWear += brakePressure * 0.1; // Scale down brake contribution
    }
  }
  
  // Normalize by number of data points to get average wear per sample
  if (gForceCount > 0) {
    return cumulativeWear / Math.max(gForceCount, 1);
  }
  
  return cumulativeWear;
}

/**
 * Extract lap times from lap_times_sample data
 */
function extractLapTimes(trackData: TrackDemoData): LapTimeData[] {
  const lapTimes: LapTimeData[] = [];
  
  for (const race of trackData.races) {
    if (!race.lap_times_sample || race.lap_times_sample.length === 0) {
      // If no lap times, try to estimate from telemetry
      const telemetry = race.telemetry_sample || [];
      if (telemetry.length > 0) {
        // Group by lap and vehicle
        const lapMap = new Map<string, { vehicle: number; lap: number; timestamps: string[] }>();
        
        for (const point of telemetry) {
          const key = `${point.vehicle_number}-${point.lap}`;
          if (!lapMap.has(key)) {
            lapMap.set(key, { vehicle: point.vehicle_number, lap: point.lap, timestamps: [] });
          }
          lapMap.get(key)!.timestamps.push(point.timestamp);
        }
        
        // Estimate lap time from timestamp range
        for (const [_, data] of lapMap) {
          if (data.timestamps.length > 1) {
            const times = data.timestamps.map(t => new Date(t).getTime()).sort((a, b) => a - b);
            const lapTime = (times[times.length - 1] - times[0]) / 1000; // seconds
            
            if (lapTime > 0 && lapTime < 300) { // reasonable lap time range
              lapTimes.push({
                track_id: trackData.track_id,
                track_name: trackData.track_name,
                lap: data.lap,
                vehicle_number: data.vehicle,
                lap_time: lapTime,
                race_number: race.race_number,
              });
            }
          }
        }
      }
    } else {
      // Use actual lap times data
      for (const lapTimeRecord of race.lap_times_sample) {
        // Try to extract lap time from various possible fields
        let lapTime: number | null = null;
        const record = lapTimeRecord as Record<string, unknown>;
        const vehicleNumber = (record.vehicle_number as number | undefined) || 
                             parseInt((lapTimeRecord.vehicle_id || '').split('-').pop() || '0');
        
        // Check common lap time field names
        if ('lap_time' in record && typeof record.lap_time === 'number') {
          lapTime = record.lap_time;
        } else if ('LapTime' in record && typeof record.LapTime === 'number') {
          lapTime = record.LapTime as number;
        } else if ('time' in record && typeof record.time === 'number') {
          lapTime = record.time as number;
        } else if ('value' in record && typeof record.value === 'number') {
          // Value might be in milliseconds, convert to seconds
          const value = record.value as number;
          if (value > 1000) {
            // Likely milliseconds
            lapTime = value / 1000;
          } else if (value > 0 && value < 300) {
            // Likely already in seconds
            lapTime = value;
          }
        }
        
        // Only add if we have a valid lap time
        if (lapTime && lapTime > 0 && lapTime < 300) {
          lapTimes.push({
            track_id: trackData.track_id,
            track_name: trackData.track_name,
            lap: lapTimeRecord.lap || 1,
            vehicle_number: vehicleNumber,
            lap_time: lapTime,
            race_number: race.race_number,
          });
        }
      }
    }
  }
  
  return lapTimes;
}

/**
 * Extract tire wear data from telemetry
 */
function extractTireWear(trackData: TrackDemoData): TireWearData[] {
  const tireWear: TireWearData[] = [];
  
  for (const race of trackData.races) {
    if (!race.telemetry_sample || race.telemetry_sample.length === 0) continue;
    
    // Group telemetry by vehicle
    const vehicleMap = new Map<number, TelemetrySample[]>();
    
    for (const point of race.telemetry_sample) {
      if (!vehicleMap.has(point.vehicle_number)) {
        vehicleMap.set(point.vehicle_number, []);
      }
      vehicleMap.get(point.vehicle_number)!.push(point);
    }
    
    // Calculate tire wear for each vehicle
    for (const [vehicleNumber, telemetry] of vehicleMap) {
      const wear = calculateTireWear(telemetry);
      if (wear > 0) {
        tireWear.push({
          track_id: trackData.track_id,
          track_name: trackData.track_name,
          vehicle_number: vehicleNumber,
          tire_wear: wear,
          race_number: race.race_number,
        });
      }
    }
  }
  
  return tireWear;
}

/**
 * Hook to load and process analytics data from all tracks
 */
export function useAnalyticsData(): AnalyticsData {
  const [lapTimes, setLapTimes] = useState<LapTimeData[]>([]);
  const [tireWear, setTireWear] = useState<TireWearData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        let index;
        try {
          index = await loadTracksIndex();
        } catch (err) {
          console.warn('Failed to load tracks index, using empty data:', err);
          setLapTimes([]);
          setTireWear([]);
          setLoading(false);
          return;
        }
        
        const allLapTimes: LapTimeData[] = [];
        const allTireWear: TireWearData[] = [];
        
        // Load data from all tracks
        for (const track of index.tracks) {
          if (track.races_available > 0) {
            try {
              const trackData = await loadTrackDemo(track.track_id);
              const trackLapTimes = extractLapTimes(trackData);
              const trackTireWear = extractTireWear(trackData);
              
              allLapTimes.push(...trackLapTimes);
              allTireWear.push(...trackTireWear);
            } catch (err) {
              console.warn(`Failed to load data for ${track.track_id}:`, err);
              // Continue loading other tracks even if one fails
            }
          }
        }
        
        setLapTimes(allLapTimes);
        setTireWear(allTireWear);
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
        // Set empty arrays on error so charts can still render with empty state
        setLapTimes([]);
        setTireWear([]);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  return { lapTimes, tireWear, loading, error };
}

