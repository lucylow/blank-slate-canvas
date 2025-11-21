// src/hooks/usePrediction.ts
// React Query hook for tire predictions with caching and auto-refresh

import { useQuery } from "@tanstack/react-query";
import { predictTire, TirePredictionResponse } from "@/api/pitwall";
import { predictDemo } from "@/api/demo";
import { useDemoMode } from "@/hooks/useDemoMode";

interface UsePredictionOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  retry?: number;
}

export function usePrediction(
  track: string,
  chassis: string,
  options: UsePredictionOptions = {}
) {
  const {
    enabled = true,
    refetchInterval = 5000,
    staleTime = 3000,
    retry = 2,
  } = options;

  const { isDemoMode } = useDemoMode();

  return useQuery<TirePredictionResponse, Error>({
    queryKey: ["predict", track, chassis, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        // Use demo endpoint
        const demoPred = await predictDemo(track, chassis);
        // Convert demo response to TirePredictionResponse format
        return {
          chassis: demoPred.chassis,
          track: demoPred.track,
          predicted_loss_per_lap_s: demoPred.predicted_loss_per_lap_s,
          laps_until_0_5s_loss: demoPred.laps_until_0_5s_loss,
          recommended_pit_lap: demoPred.recommended_pit_lap,
          feature_scores: demoPred.feature_scores,
          explanation: demoPred.explanation,
          meta: demoPred.meta
        };
      } else {
        // Use real backend endpoint
        return predictTire(track, chassis);
      }
    },
    enabled: enabled && !!track && !!chassis,
    refetchInterval,
    staleTime,
    retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
