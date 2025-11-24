// src/hooks/useAIDashboard.ts
// React Query hook for complete AI dashboard data
// Combines tire wear, performance, gap analysis, and strategy in one call

import { useQuery } from "@tanstack/react-query";
import { getLiveDashboard, DashboardData } from "@/api/pitwall";
import { useDemoMode } from "@/hooks/useDemoMode";

interface UseAIDashboardOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  retry?: number;
  enhanced?: boolean; // Use enhanced predictor with explainability
}

/**
 * Main AI dashboard hook - fetches complete dashboard data
 * Includes: tire wear, performance metrics, gap analysis, and strategy recommendations
 */
export function useAIDashboard(
  track: string,
  race: number,
  vehicle: number,
  lap: number,
  options: UseAIDashboardOptions = {}
) {
  const {
    enabled = true,
    refetchInterval = 5000, // Refresh every 5 seconds for live data
    staleTime = 3000,
    retry = 2,
    enhanced = true,
  } = options;

  const { isDemoMode } = useDemoMode();

  return useQuery<DashboardData, Error>({
    queryKey: ["ai-dashboard", track, race, vehicle, lap, enhanced, isDemoMode],
    queryFn: async () => {
      // Normalize track name
      const normalizedTrack = track.toLowerCase().replace(/\s+/g, "_");
      return getLiveDashboard(normalizedTrack, race, vehicle, lap);
    },
    enabled: enabled && !!track && !!race && !!vehicle && !!lap,
    refetchInterval,
    staleTime,
    retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}



