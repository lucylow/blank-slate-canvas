// @ts-nocheck
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, Gauge, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLiveStream } from "@/hooks/useLiveStream";

interface TelemetryMetrics {
  speed: number;
  rpm: number;
  throttle: number;
  brake: number;
  lateralG: number;
  longitudinalG: number;
  steeringAngle: number;
}

interface RealTimeAnalyticsCardProps {
  track?: string;
  race?: number;
  vehicle?: number;
  lap?: number;
}

/**
 * Real-Time Analytics Card
 * 
 * Processes live telemetry data to provide instant insights on:
 * - Car performance metrics
 * - Tire wear indicators
 * - Race strategy insights
 */
export const RealTimeAnalyticsCard: React.FC<RealTimeAnalyticsCardProps> = ({
  track = "sebring",
  race = 1,
  vehicle = 7,
  lap = 12,
}) => {
  const { data, connected, error } = useLiveStream(track, race, vehicle, lap);
  const [metrics, setMetrics] = useState<TelemetryMetrics | null>(null);
  const [performanceScore, setPerformanceScore] = useState(0);

  useEffect(() => {
    if (data) {
      // Simulate real-time telemetry processing
      // In production, this would come from WebSocket stream
      const mockMetrics: TelemetryMetrics = {
        speed: 145 + Math.random() * 20,
        rpm: 6000 + Math.random() * 2000,
        throttle: 75 + Math.random() * 20,
        brake: Math.random() * 30,
        lateralG: 1.2 + Math.random() * 0.8,
        longitudinalG: 0.8 + Math.random() * 0.6,
        steeringAngle: -15 + Math.random() * 30,
      };
      setMetrics(mockMetrics);

      // Calculate performance score based on tire wear and consistency
      const avgTireWear = 
        (data.tire_wear.front_left + 
         data.tire_wear.front_right + 
         data.tire_wear.rear_left + 
         data.tire_wear.rear_right) / 4;
      const score = Math.max(0, Math.min(100, 100 - avgTireWear));
      setPerformanceScore(score);
    }
  }, [data]);

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Real-Time Analytics
          </CardTitle>
          <div className="flex items-center gap-2">
            {connected ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                <Wifi className="w-3 h-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Overall Performance Score
            </span>
            <span className={`text-sm font-bold ${getPerformanceColor(performanceScore)}`}>
              {performanceScore.toFixed(0)}% - {getPerformanceLabel(performanceScore)}
            </span>
          </div>
          <Progress value={performanceScore} className="h-2" />
        </div>

        {/* Live Telemetry Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div className="p-2 rounded-lg bg-accent/30">
              <div className="flex items-center gap-1 mb-1">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">Speed</span>
              </div>
              <div className="text-lg font-bold font-mono">
                {metrics.speed.toFixed(0)} <span className="text-xs text-muted-foreground">mph</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-accent/30">
              <div className="flex items-center gap-1 mb-1">
                <Gauge className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">RPM</span>
              </div>
              <div className="text-lg font-bold font-mono">
                {metrics.rpm.toFixed(0)} <span className="text-xs text-muted-foreground">rpm</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-accent/30">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">Throttle</span>
              </div>
              <div className="text-lg font-bold font-mono">
                {metrics.throttle.toFixed(0)}<span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-accent/30">
              <div className="flex items-center gap-1 mb-1">
                <Activity className="w-3 h-3 text-primary" />
                <span className="text-xs text-muted-foreground">Lateral G</span>
              </div>
              <div className="text-lg font-bold font-mono">
                {metrics.lateralG.toFixed(2)}<span className="text-xs text-muted-foreground">g</span>
              </div>
            </div>
          </div>
        )}

        {/* Instant Insights */}
        {data && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Instant Insights
            </p>
            <div className="space-y-1.5">
              {data.tire_wear.predicted_laps_remaining !== undefined && (
                <div className="flex items-center justify-between text-xs p-2 rounded bg-accent/20">
                  <span className="text-muted-foreground">Tire Life Remaining:</span>
                  <span className="font-semibold">
                    {data.tire_wear.predicted_laps_remaining} laps
                  </span>
                </div>
              )}
              {data.gap_analysis.overtaking_opportunity && (
                <div className="flex items-center justify-between text-xs p-2 rounded bg-green-500/10 border border-green-500/20">
                  <span className="text-green-600">Overtaking Opportunity:</span>
                  <span className="font-semibold text-green-600">Available</span>
                </div>
              )}
              {data.gap_analysis.under_pressure && (
                <div className="flex items-center justify-between text-xs p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                  <span className="text-yellow-600">Under Pressure:</span>
                  <span className="font-semibold text-yellow-600">Car Behind Close</span>
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-red-500">
              Error: {error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};



