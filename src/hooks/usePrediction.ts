// src/hooks/usePrediction.ts
// React Query hook for tire predictions with caching and auto-refresh

import { useQuery } from "@tanstack/react-query";
import { predictTire, TirePredictionResponse } from "@/api/pitwall";

interface UsePredictionOptions {
  enabled?: boolean;
  refetchInterval?: number;
  staleTime?: number;
  retry?: number;
  onError?: (error: Error) => void;
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
    onError,
  } = options;

  return useQuery<TirePredictionResponse, Error>({
    queryKey: ["predict", track, chassis],
    queryFn: () => predictTire(track, chassis),
    enabled: enabled && !!track && !!chassis,
    refetchInterval,
    staleTime,
    retry,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error("[usePrediction] Error:", error);
      if (onError) {
        onError(error);
      }
    },
  });
}

