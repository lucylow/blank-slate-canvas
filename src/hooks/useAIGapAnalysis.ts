// src/hooks/useAIGapAnalysis.ts
// React Query hook for AI gap analysis

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGapAnalysis, GapAnalysis } from "@/api/pitwall";
import { useDemoMode } from "@/hooks/useDemoMode";

interface UseAIGapAnalysisOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  retry?: number;
}

interface GapAnalysisResponse {
  success: boolean;
  data: GapAnalysis;
  timestamp: string;
}

/**
 * Hook for AI gap analysis
 * Returns gap to leader, gap to car ahead/behind, overtaking opportunities, and pressure indicators
 */
export function useAIGapAnalysis(
  track: string,
  race: number,
  vehicle: number,
  lap: number,
  options: UseAIGapAnalysisOptions = {}
) {
  const {
    enabled = true,
    refetchInterval = 5000, // Refresh every 5 seconds for live gap data
    staleTime = 3000,
    retry = 2,
  } = options;

  const { isDemoMode } = useDemoMode();

  return useQuery<GapAnalysisResponse, Error>({
    queryKey: ["ai-gap-analysis", track, race, vehicle, lap, isDemoMode],
    queryFn: async () => {
      const normalizedTrack = track.toLowerCase().replace(/\s+/g, "_");
      return getGapAnalysis(normalizedTrack, race, vehicle, lap);
    },
    enabled: enabled && !!track && !!race && !!vehicle && !!lap,
    refetchInterval,
    staleTime,
    retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Mutation hook for manual gap analysis
 */
export function useAIGapAnalysisMutation() {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();

  return useMutation<GapAnalysisResponse, Error, { track: string; race: number; vehicle: number; lap: number }>({
    mutationFn: async ({ track, race, vehicle, lap }) => {
      const normalizedTrack = track.toLowerCase().replace(/\s+/g, "_");
      return getGapAnalysis(normalizedTrack, race, vehicle, lap);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: ["ai-gap-analysis", variables.track, variables.race, variables.vehicle, variables.lap],
      });
      queryClient.invalidateQueries({
        queryKey: ["ai-dashboard", variables.track, variables.race, variables.vehicle, variables.lap],
      });
    },
  });
}



