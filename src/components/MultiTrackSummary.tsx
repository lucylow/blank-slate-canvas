// src/components/MultiTrackSummary.tsx

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, RefreshCw, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { TRACKS } from "@/components/TrackSelector";

import { predictMultiple, TirePredictionResponse } from "@/api/pitwall";
import { predictDemo } from "@/api/demo";
import { useDemoMode } from "@/hooks/useDemoMode";

import { cn } from "@/lib/utils";

export default function MultiTrackSummary({ chassis = "GR86-DEMO-01" }: { chassis?: string }) {
  const [data, setData] = useState<(TirePredictionResponse | { error: string; track: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDemoMode } = useDemoMode();
  
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        let res: (TirePredictionResponse | { error: string; track: string })[];
        
        if (isDemoMode) {
          // Try to use mock data first, then fallback to demo API
          try {
            const { getTrackMockData } = await import("@/lib/mockDemoData");
            
            // Extract vehicle number from chassis
            let vehicleNumber = 7;
            if (chassis) {
              const parts = chassis.split('-');
              const lastPart = parts[parts.length - 1];
              const num = parseInt(lastPart);
              if (!isNaN(num)) {
                vehicleNumber = num;
              } else if (parts.length > 2) {
                const num2 = parseInt(parts[parts.length - 2]);
                if (!isNaN(num2)) {
                  vehicleNumber = num2;
                }
              }
            }
            
            // Get mock predictions for all tracks
            const promises = TRACKS.map(async (track) => {
              try {
                const trackData = getTrackMockData(track);
                let predictions = trackData.tirePredictions.filter(
                  (p) => p.vehicle_number === vehicleNumber
                );
                
                // If no predictions for this vehicle, use any prediction
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
                  } as TirePredictionResponse;
                }
              } catch (e) {
                console.warn(`Failed to get mock data for ${track}:`, e);
              }
              
              // Fallback to demo API
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
                } as TirePredictionResponse;
              } catch (e) {
                // Final fallback: generate basic mock
                return {
                  chassis: chassis,
                  track: track,
                  predicted_loss_per_lap_s: 0.3 + Math.random() * 0.2,
                  laps_until_0_5s_loss: 1.5 + Math.random() * 0.5,
                  recommended_pit_lap: 8 + Math.floor(Math.random() * 5),
                  feature_scores: [
                    { name: "tire_stress_S2", score: 0.35 + Math.random() * 0.1 },
                    { name: "brake_energy_S1", score: 0.19 + Math.random() * 0.1 },
                  ],
                  explanation: ["Mock prediction data"],
                  meta: {
                    model_version: "v2.1-mock-fallback",
                    generated_at: new Date().toISOString(),
                    demo: true,
                  }
                } as TirePredictionResponse;
              }
            });
            res = await Promise.all(promises);
          } catch (error) {
            console.warn("Failed to load mock data, using demo API:", error);
            // Fallback to demo API for each track
            const promises = TRACKS.map(async (track) => {
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
                } as TirePredictionResponse;
              } catch (e) {
                return {
                  error: e instanceof Error ? e.message : String(e),
                  track: track,
                };
              }
            });
            res = await Promise.all(promises);
          }
        } else {
          // Use real backend API
          res = await predictMultiple(TRACKS, chassis);
        }
        
        if (!mounted) return;
        setData(res);
      } catch (error) {
        console.error("Failed to load multi-track data:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 8000);
    return () => { 
      mounted = false; 
      clearInterval(t); 
    };
  }, [chassis, isDemoMode]);

  const formatTrackName = (track: string) => {
    return track.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-xl sticky top-20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            Multi-Track Summary
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {loading ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-1" />
            )}
            Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {loading && data.length === 0 ? (
          <div className="space-y-3">
            {TRACKS.map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {TRACKS.map((track, i) => {
              const trackData = data[i];
              const isError = trackData && 'error' in trackData;
              const isPrediction = trackData && 'predicted_loss_per_lap_s' in trackData;
              const prediction = isPrediction ? trackData as TirePredictionResponse : null;
              const lossPerLap = prediction?.predicted_loss_per_lap_s ?? 0;
              const percentage = Math.min(100, (lossPerLap / 1) * 100);
              
              return (
                <motion.div
                  key={track}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate">
                      {formatTrackName(isError ? (trackData as { error: string; track: string }).track : (prediction?.track || track))}
                    </span>
                    <span className="font-mono font-semibold text-foreground ml-2">
                      {prediction
                        ? `${prediction.predicted_loss_per_lap_s.toFixed(2)}s`
                        : '—'}
                    </span>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className={cn(
                        "h-2 rounded-full",
                        percentage > 70 
                          ? "bg-gradient-to-r from-destructive to-red-600"
                          : percentage > 40
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                          : "bg-gradient-to-r from-primary to-primary/80"
                      )}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

