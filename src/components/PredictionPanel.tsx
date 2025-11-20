// src/components/PredictionPanel.tsx

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Clock, TrendingUp, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { predictTire } from "../api/pitwall";
import { cn } from "@/lib/utils";

type Props = { track: string; chassis?: string; pollMs?: number; onExplain?: (evidence:string[]) => void };

export default function PredictionPanel({ track, chassis = "GR86-DEMO-01", pollMs = 4000, onExplain }: Props) {
  const [prediction, setPrediction] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    let timer: any;

    async function fetchPred() {
      setLoading(true);
      try {
        const p = await predictTire(track, chassis);
        if (!mounted) return;
        setPrediction(p);
      } catch (e: any) {
        setPrediction({ error: e.message || String(e) });
      } finally {
        setLoading(false);
      }
    }
    fetchPred();
    timer = setInterval(fetchPred, pollMs);
    return () => {
      mounted = false;
      clearInterval(timer);
    }
  }, [track, chassis, pollMs]);

  const renderBars = (items: {name:string,score:number}[] = []) => {
    const max = Math.max(...items.map(i => Math.abs(i.score)), 0.0001);
    return items.map((it, idx) => (
      <motion.div
        key={it.name}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.05 }}
        className="flex items-center gap-3 py-1.5"
      >
        <div className="w-28 text-xs text-muted-foreground truncate">{it.name}</div>
        <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.abs(it.score)/max * 100}%` }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            className={cn(
              "h-2.5 rounded-full",
              it.score > 0 
                ? "bg-gradient-to-r from-destructive to-red-600" 
                : "bg-gradient-to-r from-chart-2 to-green-600"
            )}
          />
        </div>
        <div className="w-12 text-right text-xs font-mono font-semibold text-foreground">
          {it.score.toFixed(2)}
        </div>
      </motion.div>
    ));
  };

  return (
    <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-xl h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Tire Prediction
          </CardTitle>
          {prediction?.meta?.generated_at && (
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {new Date(prediction.meta.generated_at).toLocaleTimeString()}
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Track: <span className="font-semibold text-foreground">{track.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading && !prediction ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : prediction?.error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="w-8 h-8 text-destructive mb-2" />
            <p className="text-sm text-muted-foreground">{prediction.error}</p>
          </div>
        ) : (
          <>
            {/* Main Metrics */}
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20">
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Predicted loss per lap
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">
                  {prediction ? `${(prediction.predicted_loss_per_lap_s ?? 0).toFixed(2)}` : '—'}
                  <span className="text-lg text-muted-foreground ml-1">s/lap</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Laps until 0.5s loss: <span className="font-semibold text-foreground">{prediction?.laps_until_0_5s_loss ?? '—'}</span>
                </div>
              </div>

              {prediction?.recommended_pit_lap && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 bg-gradient-to-br from-destructive/20 via-destructive/10 to-transparent rounded-xl border border-destructive/30"
                >
                  <div className="text-xs text-muted-foreground mb-2">Recommended Action</div>
                  <Badge className="bg-primary text-primary-foreground text-sm px-4 py-2">
                    Pit on Lap {prediction.recommended_pit_lap}
                  </Badge>
                </motion.div>
              )}
            </div>

            {/* Top Features */}
            {prediction?.explanation && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <Target className="w-3 h-3 text-primary" />
                  Top Contributing Features
                </div>
                <div className="space-y-1.5 p-3 bg-muted/30 rounded-lg border border-border/50">
                  {renderBars(
                    Array.isArray(prediction.explanation) 
                      ? prediction.explanation.map((s:string, i:number) => ({
                          name: s,
                          score: (prediction.feature_scores?.[i] ?? (1/(i+1)))
                        })) 
                      : []
                  )}
                </div>
              </div>
            )}

            {/* Explain Button */}
            {prediction?.explanation && onExplain && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onExplain(prediction.explanation ?? [])}
                >
                  Explain Prediction
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

