// src/components/MultiTrackSummary.tsx

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, RefreshCw, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { TRACKS } from "@/components/TrackSelector";

import { predictMultiple, TirePredictionResponse } from "@/api/pitwall";

import { cn } from "@/lib/utils";

export default function MultiTrackSummary({ chassis = "GR86-DEMO-01" }: { chassis?: string }) {
  const [data, setData] = useState<(TirePredictionResponse | { error: string; track: string })[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const res = await predictMultiple(TRACKS, chassis);
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
  }, [chassis]);

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

