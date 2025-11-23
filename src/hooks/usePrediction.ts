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
        // Use mock data generator
        try {
          const { getTrackMockData } = await import("@/lib/mockDemoData");
          const trackData = getTrackMockData(track);
          
          // Extract vehicle number from chassis (e.g., "GR86-7" -> 7)
          const vehicleNumber = chassis ? parseInt(chassis.split('-').pop() || '7') : 7;
          
          // Get the most recent prediction for this vehicle
          const predictions = trackData.tirePredictions.filter(
            (p) => p.vehicle_number === vehicleNumber
          );
          
          if (predictions.length > 0) {
            const latest = predictions[predictions.length - 1];
            return {
              chassis: latest.chassis,
              track: latest.track,
              predicted_loss_per_lap_s: latest.predicted_loss_per_lap_s,
              laps_until_0_5s_loss: latest.laps_until_0_5s_loss,
              recommended_pit_lap: latest.recommended_pit_lap,
              feature_scores: latest.feature_scores,
              explanation: latest.explanation,
              meta: {
                model_version: "v2.1-mock",
                generated_at: new Date().toISOString(),
                demo: true,
                points_analyzed: 1000,
              }
            };
          }
        } catch (error) {
          console.warn("Failed to load mock data, falling back to demo API:", error);
        }
        
        // Fallback to demo endpoint if mock data not available
        const demoPred = await predictDemo(track, chassis);
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
