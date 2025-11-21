import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, Target, CheckCircle2 } from "lucide-react";

interface TrackModel {
  trackId: string;
  trackName: string;
  modelAccuracy: number;
  dataPoints: number;
  lastTrained: string;
  features: string[];
}

interface TrackSpecificModelsCardProps {
  currentTrack?: string;
  models?: TrackModel[];
}

/**
 * Track-Specific Models Card
 * 
 * Displays custom AI models trained on data from all 7 GR Cup tracks:
 * - Circuit-specific insights
 * - Model accuracy per track
 * - Training data statistics
 */
export const TrackSpecificModelsCard: React.FC<TrackSpecificModelsCardProps> = ({
  currentTrack = "sebring",
  models,
}) => {
  // Default models for all 7 GR Cup tracks
  const defaultModels: TrackModel[] = [
    {
      trackId: "sebring",
      trackName: "Sebring International",
      modelAccuracy: 0.95,
      dataPoints: 2847563,
      lastTrained: "2025-01-15",
      features: ["lateral_g", "longitudinal_g", "speed", "braking_events"],
    },
    {
      trackId: "cota",
      trackName: "Circuit of the Americas",
      modelAccuracy: 0.94,
      dataPoints: 3124789,
      lastTrained: "2025-01-15",
      features: ["lateral_g", "longitudinal_g", "speed", "braking_events"],
    },
    {
      trackId: "road_america",
      trackName: "Road America",
      modelAccuracy: 0.96,
      dataPoints: 2678901,
      lastTrained: "2025-01-15",
      features: ["lateral_g", "longitudinal_g", "speed", "braking_events"],
    },
    {
      trackId: "sonoma",
      trackName: "Sonoma Raceway",
      modelAccuracy: 0.93,
      dataPoints: 2567890,
      lastTrained: "2025-01-15",
      features: ["lateral_g", "longitudinal_g", "speed", "braking_events"],
    },
    {
      trackId: "barber",
      trackName: "Barber Motorsports Park",
      modelAccuracy: 0.95,
      dataPoints: 2847563,
      lastTrained: "2025-01-15",
      features: ["lateral_g", "longitudinal_g", "speed", "braking_events"],
    },
    {
      trackId: "vir",
      trackName: "Virginia International",
      modelAccuracy: 0.94,
      dataPoints: 2789012,
      lastTrained: "2025-01-15",
      features: ["lateral_g", "longitudinal_g", "speed", "braking_events"],
    },
    {
      trackId: "indianapolis",
      trackName: "Indianapolis Motor Speedway",
      modelAccuracy: 0.95,
      dataPoints: 3456123,
      lastTrained: "2025-01-15",
      features: ["lateral_g", "longitudinal_g", "speed", "braking_events"],
    },
  ];

  const displayModels = models || defaultModels;
  const currentModel = displayModels.find(m => m.trackId === currentTrack);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.95) return "bg-green-500/20 text-green-600 border-green-500/50";
    if (accuracy >= 0.90) return "bg-yellow-500/20 text-yellow-600 border-yellow-500/50";
    return "bg-red-500/20 text-red-600 border-red-500/50";
  };

  const formatDataPoints = (points: number) => {
    if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M`;
    if (points >= 1000) return `${(points / 1000).toFixed(1)}K`;
    return points.toString();
  };

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Track-Specific AI Models
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Custom models trained on data from all 7 GR Cup tracks
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Track Model */}
        {currentModel && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">{currentModel.trackName}</span>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs ${getAccuracyColor(currentModel.modelAccuracy)}`}
              >
                {(currentModel.modelAccuracy * 100).toFixed(0)}% Accuracy
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mt-2">
              <div>
                <span className="text-muted-foreground">Data Points:</span>
                <span className="font-semibold ml-1">{formatDataPoints(currentModel.dataPoints)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Trained:</span>
                <span className="font-semibold ml-1">{currentModel.lastTrained}</span>
              </div>
            </div>
          </div>
        )}

        {/* All Tracks Summary */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            All Track Models
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {displayModels.map((model) => {
              const isCurrent = model.trackId === currentTrack;
              return (
                <div
                  key={model.trackId}
                  className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                    isCurrent
                      ? "bg-primary/10 border border-primary/20"
                      : "bg-accent/30 hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className={`w-3 h-3 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={isCurrent ? "font-semibold" : ""}>
                      {model.trackName}
                    </span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getAccuracyColor(model.modelAccuracy)}`}
                  >
                    {(model.modelAccuracy * 100).toFixed(0)}%
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Model Features */}
        {currentModel && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Model Features
            </p>
            <div className="flex flex-wrap gap-1.5">
              {currentModel.features.map((feature) => (
                <Badge
                  key={feature}
                  variant="outline"
                  className="text-xs bg-accent/30"
                >
                  <Target className="w-3 h-3 mr-1" />
                  {feature.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="pt-2 border-t border-border/50">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Total Models:</span>
              <span className="font-semibold ml-1">{displayModels.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg Accuracy:</span>
              <span className="font-semibold ml-1">
                {(displayModels.reduce((sum, m) => sum + m.modelAccuracy, 0) / displayModels.length * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

