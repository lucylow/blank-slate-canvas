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
          
          // Extract vehicle number from chassis (e.g., "GR86-7" -> 7, "GR86-DEMO-01" -> 7)
          let vehicleNumber = 7; // default
          if (chassis) {
            const parts = chassis.split('-');
            // Try to extract number from last part
            const lastPart = parts[parts.length - 1];
            const num = parseInt(lastPart);
            if (!isNaN(num)) {
              vehicleNumber = num;
            } else {
              // If last part is not a number, try second to last (e.g., "GR86-DEMO-01")
              if (parts.length > 2) {
                const secondLast = parts[parts.length - 2];
                const num2 = parseInt(secondLast);
                if (!isNaN(num2)) {
                  vehicleNumber = num2;
                }
              }
            }
          }
          
          // Get the most recent prediction for this vehicle, or any prediction if none match
          let predictions = trackData.tirePredictions.filter(
            (p) => p.vehicle_number === vehicleNumber
          );
          
          // If no predictions for this vehicle, use any prediction from the track
          if (predictions.length === 0 && trackData.tirePredictions.length > 0) {
            predictions = [trackData.tirePredictions[trackData.tirePredictions.length - 1]];
          }
          
          if (predictions.length > 0) {
            const latest = predictions[predictions.length - 1];
            return {
              chassis: latest.chassis || chassis,
              track: latest.track || track,
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
        try {
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
        } catch (error) {
          // Final fallback: generate a basic mock prediction
          console.warn("Demo API failed, using basic mock prediction:", error);
          return {
            chassis: chassis,
            track: track,
            predicted_loss_per_lap_s: 0.3 + Math.random() * 0.2,
            laps_until_0_5s_loss: 1.5 + Math.random() * 0.5,
            recommended_pit_lap: 8 + Math.floor(Math.random() * 5),
            feature_scores: [
              { name: "tire_stress_S2", score: 0.35 + Math.random() * 0.1 },
              { name: "brake_energy_S1", score: 0.19 + Math.random() * 0.1 },
              { name: "avg_speed_S3", score: -0.05 + Math.random() * 0.1 },
            ],
            explanation: [
              "Mock prediction data",
              "Tire wear analysis in progress",
              "Monitoring track conditions",
            ],
            meta: {
              model_version: "v2.1-mock-fallback",
              generated_at: new Date().toISOString(),
              demo: true,
              points_analyzed: 1000,
            }
          };
        }
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
