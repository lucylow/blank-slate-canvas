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
 */
function calculateTireWear(telemetry: TelemetrySample[]): number {
  if (!telemetry || telemetry.length === 0) return 0;
  
  let cumulativeWear = 0;
  for (const point of telemetry) {
    if (point.telemetry_name === 'accx_can' || point.telemetry_name === 'accy_can') {
      cumulativeWear += Math.abs(point.telemetry_value || 0);
    }
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
        const vehicleNumber = (lapTimeRecord as any).vehicle_number || 
                             parseInt((lapTimeRecord.vehicle_id || '').split('-').pop() || '0');
        
        // Check common lap time field names
        if ('lap_time' in lapTimeRecord && typeof lapTimeRecord.lap_time === 'number') {
          lapTime = lapTimeRecord.lap_time;
        } else if ('LapTime' in lapTimeRecord && typeof (lapTimeRecord as any).LapTime === 'number') {
          lapTime = (lapTimeRecord as any).LapTime;
        } else if ('time' in lapTimeRecord && typeof (lapTimeRecord as any).time === 'number') {
          lapTime = (lapTimeRecord as any).time;
        }
        
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
        
        const index = await loadTracksIndex();
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
            }
          }
        }
        
        setLapTimes(allLapTimes);
        setTireWear(allTireWear);
      } catch (err) {
        console.error('Error loading analytics data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  return { lapTimes, tireWear, loading, error };
}

