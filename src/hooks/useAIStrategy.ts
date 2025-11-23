// src/hooks/useAIStrategy.ts
// React Query hook for AI strategy optimization

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { optimizeStrategy, StrategyRequest, StrategyOptimization } from "@/api/pitwall";
import { useDemoMode } from "@/hooks/useDemoMode";

interface UseAIStrategyOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  retry?: number;
}

interface StrategyResponse {
  success: boolean;
  data: StrategyOptimization;
  timestamp: string;
}

/**
 * Hook for AI strategy optimization
 * Returns recommended strategy, pit windows, and expected finish times
 */
export function useAIStrategy(
  track: string,
  race: number,
  vehicle: number,
  currentLap: number,
  totalLaps: number,
  currentPosition: number,
  tireLaps: number,
  options: UseAIStrategyOptions = {}
) {
  const {
    enabled = true,
    refetchInterval = 30000, // Refresh every 30 seconds (strategy changes less frequently)
    staleTime = 15000,
    retry = 2,
  } = options;

  const { isDemoMode } = useDemoMode();

  return useQuery<StrategyResponse, Error>({
    queryKey: [
      "ai-strategy",
      track,
      race,
      vehicle,
      currentLap,
      totalLaps,
      currentPosition,
      tireLaps,
      isDemoMode,
    ],
    queryFn: async () => {
      const normalizedTrack = track.toLowerCase().replace(/\s+/g, "_");
      const request: StrategyRequest = {
        track: normalizedTrack,
        race,
        vehicle_number: vehicle,
        current_lap: currentLap,
        total_laps: totalLaps,
        current_position: currentPosition,
        tire_laps: tireLaps,
      };
      return optimizeStrategy(request);
    },
    enabled:
      enabled &&
      !!track &&
      !!race &&
      !!vehicle &&
      !!currentLap &&
      !!totalLaps &&
      currentPosition > 0 &&
      tireLaps > 0,
    refetchInterval,
    staleTime,
    retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Mutation hook for manual strategy optimization
 * Useful for "what-if" scenarios with different parameters
 */
export function useAIStrategyMutation() {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();

  return useMutation<StrategyResponse, Error, StrategyRequest>({
    mutationFn: async (request) => {
      const normalizedRequest = {
        ...request,
        track: request.track.toLowerCase().replace(/\s+/g, "_"),
      };
      return optimizeStrategy(normalizedRequest);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: [
          "ai-strategy",
          variables.track,
          variables.race,
          variables.vehicle_number,
          variables.current_lap,
          variables.total_laps,
          variables.current_position,
          variables.tire_laps,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["ai-dashboard", variables.track, variables.race, variables.vehicle_number, variables.current_lap],
      });
    },
  });
}


