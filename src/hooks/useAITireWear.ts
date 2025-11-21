// src/hooks/useAITireWear.ts
// React Query hook for AI tire wear predictions with explainability

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { analyzeTireWear, TireWearRequest, TireWearData } from "@/api/pitwall";
import { useDemoMode } from "@/hooks/useDemoMode";

interface UseAITireWearOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  retry?: number;
}

interface TireWearResponse {
  success: boolean;
  data: TireWearData;
  timestamp: string;
}

/**
 * Hook for AI tire wear predictions
 * Returns tire wear percentages for all 4 tires with confidence scores and explainability
 */
export function useAITireWear(
  track: string,
  race: number,
  vehicle: number,
  lap: number,
  options: UseAITireWearOptions = {}
) {
  const {
    enabled = true,
    refetchInterval = 10000, // Refresh every 10 seconds
    staleTime = 5000,
    retry = 2,
  } = options;

  const { isDemoMode } = useDemoMode();

  return useQuery<TireWearResponse, Error>({
    queryKey: ["ai-tire-wear", track, race, vehicle, lap, isDemoMode],
    queryFn: async () => {
      const normalizedTrack = track.toLowerCase().replace(/\s+/g, "_");
      const request: TireWearRequest = {
        track: normalizedTrack,
        race,
        vehicle_number: vehicle,
        lap,
      };
      return analyzeTireWear(request);
    },
    enabled: enabled && !!track && !!race && !!vehicle && !!lap,
    refetchInterval,
    staleTime,
    retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Mutation hook for manual tire wear analysis
 * Useful for "what-if" scenarios or manual refresh
 */
export function useAITireWearMutation() {
  const queryClient = useQueryClient();
  const { isDemoMode } = useDemoMode();

  return useMutation<TireWearResponse, Error, TireWearRequest>({
    mutationFn: async (request) => {
      const normalizedRequest = {
        ...request,
        track: request.track.toLowerCase().replace(/\s+/g, "_"),
      };
      return analyzeTireWear(normalizedRequest);
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: ["ai-tire-wear", variables.track, variables.race, variables.vehicle_number, variables.lap],
      });
      queryClient.invalidateQueries({
        queryKey: ["ai-dashboard", variables.track, variables.race, variables.vehicle_number, variables.lap],
      });
    },
  });
}

