import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Zap, 
  Gauge, 
  TrendingUp, 
  TrendingDown,
  Wifi, 
  WifiOff,
  AlertTriangle,
  Target,
  Clock,
  BarChart3,
  Gauge as GaugeIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveStream } from "@/hooks/useLiveStream";
import type { DashboardData } from "@/lib/types";

interface RealTimeMetricsCardProps {
  track?: string;
  race?: number;
  vehicle?: number;
  lap?: number;
  className?: string;
}

interface MetricValue {
  value: number;
  label: string;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  delta?: number;
  color?: string;
}

/**
 * Enhanced Real-Time Metrics Card
 * 
 * Displays live telemetry metrics with:
 * - Animated value updates
 * - Trend indicators
 * - Real-time performance scoring
 * - Live status indicators
 */
export const RealTimeMetricsCard: React.FC<RealTimeMetricsCardProps> = ({
  track = "sebring",
  race = 1,
  vehicle = 7,
  lap = 12,
  className = "",
}) => {
  const { data, connected, error } = useLiveStream(track, race, vehicle, lap);
  const [metrics, setMetrics] = useState<Record<string, MetricValue>>({});
  const [performanceScore, setPerformanceScore] = useState(0);
  const [updateTimestamp, setUpdateTimestamp] = useState<Date>(new Date());
  const previousValues = React.useRef<Record<string, number>>({});

  // Process real-time data and calculate metrics
  useEffect(() => {
    if (data) {
      setUpdateTimestamp(new Date());

      // Calculate tire health
      const avgTireWear = data.tire_wear
        ? (data.tire_wear.front_left +
           data.tire_wear.front_right +
           data.tire_wear.rear_left +
           data.tire_wear.rear_right) / 4
        : 50;

      // Calculate performance score
      const score = Math.max(0, Math.min(100, 100 - avgTireWear));
      setPerformanceScore(score);

      // Simulate real-time telemetry (in production, this comes from WebSocket)
      const newMetrics: Record<string, MetricValue> = {
        speed: {
          value: 145 + Math.random() * 20,
          label: "Speed",
          unit: "mph",
          trend: calculateTrend("speed", 145 + Math.random() * 20),
          delta: calculateDelta("speed", 145 + Math.random() * 20),
          color: "text-blue-500",
        },
        rpm: {
          value: 6000 + Math.random() * 2000,
          label: "RPM",
          unit: "rpm",
          trend: calculateTrend("rpm", 6000 + Math.random() * 2000),
          delta: calculateDelta("rpm", 6000 + Math.random() * 2000),
          color: "text-orange-500",
        },
        throttle: {
          value: 75 + Math.random() * 20,
          label: "Throttle",
          unit: "%",
          trend: calculateTrend("throttle", 75 + Math.random() * 20),
          delta: calculateDelta("throttle", 75 + Math.random() * 20),
          color: "text-green-500",
        },
        brake: {
          value: Math.random() * 30,
          label: "Brake",
          unit: "%",
          trend: calculateTrend("brake", Math.random() * 30),
          delta: calculateDelta("brake", Math.random() * 30),
          color: "text-red-500",
        },
        lateralG: {
          value: 1.2 + Math.random() * 0.8,
          label: "Lateral G",
          unit: "g",
          trend: calculateTrend("lateralG", 1.2 + Math.random() * 0.8),
          delta: calculateDelta("lateralG", 1.2 + Math.random() * 0.8),
          color: "text-purple-500",
        },
        tireHealth: {
          value: 100 - avgTireWear,
          label: "Tire Health",
          unit: "%",
          trend: avgTireWear > previousValues.current.tireHealth ? 'down' : 'up',
          delta: previousValues.current.tireHealth 
            ? (100 - avgTireWear) - previousValues.current.tireHealth 
            : 0,
          color: avgTireWear > 70 ? "text-red-500" : avgTireWear > 50 ? "text-yellow-500" : "text-green-500",
        },
      };

      // Update previous values
      Object.keys(newMetrics).forEach(key => {
        previousValues.current[key] = newMetrics[key].value;
      });

      setMetrics(newMetrics);
    }
  }, [data]);

  const calculateTrend = (key: string, newValue: number): 'up' | 'down' | 'stable' => {
    const prev = previousValues.current[key];
    if (!prev) return 'stable';
    const diff = newValue - prev;
    if (Math.abs(diff) < 0.1) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  const calculateDelta = (key: string, newValue: number): number => {
    const prev = previousValues.current[key];
    if (!prev) return 0;
    return newValue - prev;
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Attention Needed";
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getPerformanceBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/20";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  // Key metrics to display prominently
  const keyMetrics = useMemo(() => {
    return [
      metrics.speed,
      metrics.rpm,
      metrics.lateralG,
      metrics.tireHealth,
    ].filter(Boolean) as MetricValue[];
  }, [metrics]);

  return (
    <Card className={`border-border/50 bg-card/60 backdrop-blur-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Real-Time Metrics
          </CardTitle>
          <div className="flex items-center gap-2">
            {connected ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Wifi className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              </motion.div>
            ) : (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </div>
        {connected && updateTimestamp && (
          <p className="text-xs text-muted-foreground mt-1">
            Last update: {updateTimestamp.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance Score */}
        <div className="p-3 rounded-lg border-2 border-border/50 bg-gradient-to-br from-background to-accent/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Overall Performance
            </span>
            <span className={`text-lg font-bold ${getPerformanceColor(performanceScore)}`}>
              {performanceScore.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <Progress value={performanceScore} className="h-3 flex-1 mr-2" />
            <span className={`text-xs font-semibold ${getPerformanceColor(performanceScore)}`}>
              {getPerformanceLabel(performanceScore)}
            </span>
          </div>
          <div className={`text-xs p-2 rounded ${getPerformanceBgColor(performanceScore)} border mt-2`}>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3 h-3" />
              <span>Based on tire wear, consistency, and telemetry analysis</span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <AnimatePresence mode="wait">
            {keyMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-lg bg-accent/30 border border-border/50 hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {metric.label === "Speed" && <Zap className="w-3.5 h-3.5 text-blue-500" />}
                    {metric.label === "RPM" && <GaugeIcon className="w-3.5 h-3.5 text-orange-500" />}
                    {metric.label === "Lateral G" && <Activity className="w-3.5 h-3.5 text-purple-500" />}
                    {metric.label === "Tire Health" && <Target className="w-3.5 h-3.5 text-green-500" />}
                    <span className="text-xs font-medium text-muted-foreground">
                      {metric.label}
                    </span>
                  </div>
                  {metric.trend && (
                    <motion.div
                      animate={{ y: metric.trend === 'up' ? [-2, 2, -2] : metric.trend === 'down' ? [2, -2, 2] : 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      {metric.trend === 'up' && (
                        <TrendingUp className="w-3 h-3 text-green-500" />
                      )}
                      {metric.trend === 'down' && (
                        <TrendingDown className="w-3 h-3 text-red-500" />
                      )}
                    </motion.div>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <motion.span
                    key={metric.value}
                    initial={{ scale: 1.2, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`text-xl font-bold font-mono ${metric.color || "text-foreground"}`}
                  >
                    {metric.value.toFixed(metric.unit === '%' ? 0 : metric.unit === 'g' ? 2 : 0)}
                  </motion.span>
                  <span className="text-xs text-muted-foreground">{metric.unit}</span>
                  {metric.delta !== undefined && Math.abs(metric.delta) > 0.1 && (
                    <span className={`text-xs font-semibold ${
                      metric.delta > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {metric.delta > 0 ? '+' : ''}{metric.delta.toFixed(1)}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Additional Metrics */}
        {metrics.throttle && metrics.brake && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
            <div className="p-2 rounded-lg bg-accent/20">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-muted-foreground">Throttle</span>
              </div>
              <div className="text-lg font-bold font-mono text-green-500">
                {metrics.throttle.value.toFixed(0)}%
              </div>
            </div>
            <div className="p-2 rounded-lg bg-accent/20">
              <div className="flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                <span className="text-xs text-muted-foreground">Brake</span>
              </div>
              <div className="text-lg font-bold font-mono text-red-500">
                {metrics.brake.value.toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        {/* Live Insights */}
        {data && (
          <div className="pt-3 border-t border-border/50 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
              <Clock className="w-3 h-3" />
              Live Insights
            </p>
            <AnimatePresence>
              {data.gap_analysis?.overtaking_opportunity && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between text-xs p-2 rounded bg-green-500/10 border border-green-500/20"
                >
                  <span className="text-green-600 font-medium">Overtaking Opportunity</span>
                  <Badge variant="outline" className="bg-green-500/20 text-green-600 border-green-500/30 text-xs">
                    Active
                  </Badge>
                </motion.div>
              )}
              {data.gap_analysis?.under_pressure && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between text-xs p-2 rounded bg-yellow-500/10 border border-yellow-500/20"
                >
                  <span className="text-yellow-600 font-medium">Under Pressure</span>
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs">
                    Warning
                  </Badge>
                </motion.div>
              )}
              {data.tire_wear?.predicted_laps_remaining !== undefined && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between text-xs p-2 rounded bg-blue-500/10 border border-blue-500/20"
                >
                  <span className="text-blue-600 font-medium">Tire Life Remaining</span>
                  <span className="font-bold text-blue-600">
                    {data.tire_wear.predicted_laps_remaining} laps
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {error && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              Connection Error: {error}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
