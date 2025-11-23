// src/hooks/useComprehensiveMockData.ts
// React hook for accessing comprehensive mock data for all tracks

import { useMemo } from "react";
import {
  type TrackId,
  type ComprehensiveTrackData,
  generateComprehensiveTrackData,
  generateAllTracksData,
  getAllTracksSummary,
  getTrackData,
  TRACK_METADATA,
} from "@/lib/comprehensiveMockData";

export interface UseComprehensiveMockDataOptions {
  track?: TrackId;
  vehicle?: number;
  lap?: number;
  includeAllTracks?: boolean;
}

export function useComprehensiveMockData(options: UseComprehensiveMockDataOptions = {}) {
  const {
    track,
    vehicle = 13,
    lap = 10,
    includeAllTracks = false,
  } = options;

  const data = useMemo(() => {
    if (includeAllTracks) {
      return generateAllTracksData();
    }

    if (track) {
      return {
        [track]: [getTrackData(track, vehicle, lap)],
      };
    }

    // Return data for all tracks with default vehicle/lap
    const tracks: TrackId[] = ["barber", "cota", "indianapolis", "road_america", "sebring", "sonoma", "vir"];
    const result: Record<string, ComprehensiveTrackData[]> = {};
    
    for (const t of tracks) {
      result[t] = [getTrackData(t, vehicle, lap)];
    }
    
    return result as Record<TrackId, ComprehensiveTrackData[]>;
  }, [track, vehicle, lap, includeAllTracks]);

  const summary = useMemo(() => getAllTracksSummary(), []);

  const currentTrackData = useMemo(() => {
    if (track) {
      return getTrackData(track, vehicle, lap);
    }
    return null;
  }, [track, vehicle, lap]);

  return {
    data,
    summary,
    currentTrackData,
    trackMetadata: TRACK_METADATA,
  };
}

// Hook for single track data
export function useTrackMockData(track: TrackId, vehicle?: number, lap?: number) {
  return useComprehensiveMockData({ track, vehicle, lap });
}

// Hook for all tracks data
export function useAllTracksMockData() {
  return useComprehensiveMockData({ includeAllTracks: true });
}

