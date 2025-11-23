// src/hooks/useAIPerformance.ts
// React Query hook for AI performance analysis

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzePerformance, PerformanceRequest, PerformanceMetrics } from "@/api/pitwall";
import { useDemoMode } from "@/hooks/useDemoMode";

interface UseAIPerformanceOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  retry?: number;
}

interface PerformanceResponse {
  success: boolean;
  data: PerformanceMetrics;
  timestamp: string;
}

/**
 * Hook for AI performance analysis
 * Returns current lap, best lap, gap to leader, predicted finish, and position
 */
export function useAIPerformance(
  track: string,
  race: number,
  vehicle: number,
  lap: number,
  options: UseAIPerformanceOptions = {}
) {
  const {
    enabled = true,
    refetchInterval = 10000, // Refresh every 10 seconds
    staleTime = 5000,
    retry = 2,
  } = options;

  const { isDemoMode } = useDemoMode();

  return useQuery<PerformanceResponse, Error>({
    queryKey: ["ai-performance", track, race, vehicle, lap, isDemoMode],
    queryFn: async () => {
      const normalizedTrack = track.toLowerCase().replace(/\s+/g, "_");
      const request: PerformanceRequest = {
        track: normalizedTrack,
        race,
        vehicle_number: vehicle,
        lap,
      };
      return analyzePerformance(request);
    },
    enabled: enabled && !!track && !!race && !!vehicle && !!lap,
    refetchInterval,
    staleTime,
    retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Mutation hook for manual performance analysis
 */
export function useAIPerformanceMutation() {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();

  return useMutation<PerformanceResponse, Error, PerformanceRequest>({
    mutationFn: async (request) => {
      const normalizedRequest = {
        ...request,
        track: request.track.toLowerCase().replace(/\s+/g, "_"),
      };
      return analyzePerformance(normalizedRequest);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: ["ai-performance", variables.track, variables.race, variables.vehicle_number, variables.lap],
      });
      queryClient.invalidateQueries({
        queryKey: ["ai-dashboard", variables.track, variables.race, variables.vehicle_number, variables.lap],
      });
    },
  });
}


