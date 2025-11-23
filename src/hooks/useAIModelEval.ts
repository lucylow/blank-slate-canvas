// src/hooks/useAIModelEval.ts
// React Query hook for AI model evaluation

import { useQuery } from "@tanstack/react-query";
import { evaluateTireWear, TireWearEvalResponse } from "@/api/pitwall";
import { useDemoMode } from "@/hooks/useDemoMode";

interface UseAIModelEvalOptions {
  enabled?: boolean;
  staleTime?: number;
  retry?: number;
  maxLaps?: number;
}

/**
 * Hook for AI model evaluation
 * Returns RMSE, MAE, and calibration stats for tire wear predictions
 * Can evaluate a specific track/race/vehicle or all tracks
 */
export function useAIModelEval(
  track?: string,
  race?: number,
  vehicle?: number,
  options: UseAIModelEvalOptions = {}
) {
  const {
    enabled = true,
    staleTime = 300000, // 5 minutes - evaluation results don't change frequently
    retry = 1,
    maxLaps = 20,
  } = options;

  const { isDemoMode } = useDemoMode();

  return useQuery<TireWearEvalResponse, Error>({
    queryKey: ["ai-model-eval", track, race, vehicle, maxLaps, isDemoMode],
    queryFn: async () => {
      return evaluateTireWear(track, race, vehicle, maxLaps);
    },
    enabled: enabled,
    staleTime,
    retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}


