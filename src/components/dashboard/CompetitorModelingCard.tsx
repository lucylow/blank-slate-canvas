import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Clock, AlertCircle } from "lucide-react";

interface CompetitorPrediction {
  vehicleNumber: number;
  predictedPitLap: number;
  confidence: number;
  typicalStintLength: number;
  tireHardness?: "soft" | "medium" | "hard";
}

interface CompetitorModelingCardProps {
  competitors?: CompetitorPrediction[];
  currentLap?: number;
  showUndercutWindow?: boolean;
}

/**
 * CompetitorModelingCard - Research-backed competitor behavior modeling
 * 
 * Based on industry practice (Mercia AI, F1 strategy):
 * - Models competitor pit timing behavior
 * - Predicts undercut/overcut windows
 * - Provides strategic advantage insights
 * 
 * This is a stub implementation that can be enhanced with:
 * - Real competitor telemetry analysis
 * - Historical behavior patterns
 * - Machine learning models for competitor prediction
 */
export const CompetitorModelingCard: React.FC<CompetitorModelingCardProps> = ({
  competitors,
  currentLap = 12,
  showUndercutWindow = true,
}) => {
  // Mock data for demo if not provided
  const displayCompetitors = competitors || [
    {
      vehicleNumber: 13,
      predictedPitLap: 15,
      confidence: 0.75,
      typicalStintLength: 14,
      tireHardness: "medium" as const,
    },
    {
      vehicleNumber: 22,
      predictedPitLap: 18,
      confidence: 0.68,
      typicalStintLength: 16,
      tireHardness: "hard" as const,
    },
    {
      vehicleNumber: 46,
      predictedPitLap: 14,
      confidence: 0.82,
      typicalStintLength: 13,
      tireHardness: "soft" as const,
    },
  ];

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.75) {
      return "bg-green-500/20 text-green-600 border-green-500/50";
    } else if (conf >= 0.60) {
      return "bg-yellow-500/20 text-yellow-600 border-yellow-500/50";
    } else {
      return "bg-red-500/20 text-red-600 border-red-500/50";
    }
  };

  const getTireColor = (hardness?: string) => {
    switch (hardness) {
      case "soft":
        return "bg-red-500/20 text-red-600 border-red-500/50";
      case "medium":
        return "bg-yellow-500/20 text-yellow-600 border-yellow-500/50";
      case "hard":
        return "bg-blue-500/20 text-blue-600 border-blue-500/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Calculate undercut window
  const calculateUndercutWindow = (predictedLap: number) => {
    const windowStart = Math.max(1, predictedLap - 2);
    const windowEnd = predictedLap - 1;
    return { start: windowStart, end: windowEnd };
  };

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Competitor Modeling
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Predicted competitor behavior (Current Lap: {currentLap})
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Competitor Predictions */}
        <div className="space-y-2">
          {displayCompetitors.map((competitor) => {
            const undercutWindow = calculateUndercutWindow(competitor.predictedPitLap);
            const isUndercutPossible = currentLap >= undercutWindow.start && currentLap <= undercutWindow.end;
            
            return (
              <div 
                key={competitor.vehicleNumber}
                className="p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors border border-border/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-semibold">
                      #{competitor.vehicleNumber}
                    </Badge>
                    {competitor.tireHardness && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getTireColor(competitor.tireHardness)}`}
                      >
                        {competitor.tireHardness.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getConfidenceColor(competitor.confidence)}`}
                  >
                    {(competitor.confidence * 100).toFixed(0)}% conf.
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Predicted Pit:
                    </span>
                    <span className="font-semibold">Lap {competitor.predictedPitLap}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Typical Stint:</span>
                    <span className="font-mono">{competitor.typicalStintLength} laps</span>
                  </div>
                  
                  {showUndercutWindow && (
                    <div className="pt-1.5 border-t border-border/30">
                      {isUndercutPossible ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="w-3 h-3" />
                          <span className="font-semibold">
                            Undercut window open (Laps {undercutWindow.start}-{undercutWindow.end})
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <AlertCircle className="w-3 h-3" />
                          <span>
                            Undercut window: Laps {undercutWindow.start}-{undercutWindow.end}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Strategic Insight */}
        <div className="pt-3 border-t border-border/50">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Strategic Insight
          </p>
          <p className="text-xs text-foreground">
            {displayCompetitors.some(c => {
              const window = calculateUndercutWindow(c.predictedPitLap);
              return currentLap >= window.start && currentLap <= window.end;
            }) 
              ? "Undercut opportunity available. Consider pitting earlier to gain track position."
              : "Monitor competitor tire wear. Undercut window may open in upcoming laps."
            }
          </p>
        </div>

        {/* Model Note */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground italic">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            Predictions based on historical behavior patterns and current race conditions
          </p>
        </div>
      </CardContent>
    </Card>
  );
};


