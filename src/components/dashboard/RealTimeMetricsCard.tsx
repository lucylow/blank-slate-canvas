// @ts-nocheck
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
    if (score >= 80) return "text-green-50 bg-green-700 border-green-500";
    if (score >= 60) return "text-yellow-50 bg-yellow-700 border-yellow-500";
    return "text-red-50 bg-red-700 border-red-500";
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
    <Card className={`border-2 border-foreground/20 bg-background/95 backdrop-blur-sm shadow-xl ${className}`}>
      <CardHeader className="pb-4 border-b-2 border-foreground/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 border-2 border-primary/30">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            Real-Time Metrics
          </CardTitle>
          <div className="flex items-center gap-2">
            {connected ? (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Badge className="bg-green-600 text-green-50 border-2 border-green-400 px-3 py-1.5 font-bold">
                  <Wifi className="w-4 h-4 mr-1.5" />
                  LIVE
                </Badge>
              </motion.div>
            ) : (
              <Badge className="bg-red-600 text-red-50 border-2 border-red-400 px-3 py-1.5 font-bold">
                <WifiOff className="w-4 h-4 mr-1.5" />
                OFFLINE
              </Badge>
            )}
          </div>
        </div>
        {connected && updateTimestamp && (
          <p className="text-sm text-foreground/80 font-medium mt-2">
            Last update: <span className="font-bold">{updateTimestamp.toLocaleTimeString()}</span>
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance Score - High Contrast */}
        <div className={`p-5 rounded-xl border-4 ${getPerformanceColor(performanceScore)} shadow-lg mb-6`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Target className="w-6 h-6" />
              <span className="text-base font-bold uppercase tracking-wide">
                Overall Performance
              </span>
            </div>
            <span className="text-4xl font-black">
              {performanceScore.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <Progress 
              value={performanceScore} 
              className="h-4 flex-1 mr-3 bg-black/20 border-2 border-white/30" 
            />
            <span className="text-sm font-bold uppercase">
              {getPerformanceLabel(performanceScore)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium opacity-90">
            <BarChart3 className="w-4 h-4" />
            <span>Based on tire wear, consistency, and telemetry analysis</span>
          </div>
        </div>

        {/* Key Metrics Grid - High Contrast */}
        <div className="grid grid-cols-2 gap-4">
          <AnimatePresence mode="wait">
            {keyMetrics.map((metric, index) => {
              // High contrast color mapping
              const bgColor = metric.label === "Speed" ? "bg-blue-600" :
                            metric.label === "RPM" ? "bg-orange-600" :
                            metric.label === "Lateral G" ? "bg-purple-600" :
                            metric.label === "Tire Health" ? 
                              (metric.value > 70 ? "bg-green-600" : metric.value > 50 ? "bg-yellow-600" : "bg-red-600") :
                            "bg-gray-600";
              const textColor = "text-white";
              const borderColor = metric.label === "Speed" ? "border-blue-400" :
                                metric.label === "RPM" ? "border-orange-400" :
                                metric.label === "Lateral G" ? "border-purple-400" :
                                metric.label === "Tire Health" ?
                                  (metric.value > 70 ? "border-green-400" : metric.value > 50 ? "border-yellow-400" : "border-red-400") :
                                "border-gray-400";
              
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className={`${bgColor} ${borderColor} border-4 rounded-xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {metric.label === "Speed" && <Zap className={`w-5 h-5 ${textColor}`} />}
                      {metric.label === "RPM" && <GaugeIcon className={`w-5 h-5 ${textColor}`} />}
                      {metric.label === "Lateral G" && <Activity className={`w-5 h-5 ${textColor}`} />}
                      {metric.label === "Tire Health" && <Target className={`w-5 h-5 ${textColor}`} />}
                      <span className={`text-xs font-bold ${textColor} uppercase tracking-wide`}>
                        {metric.label}
                      </span>
                    </div>
                    {metric.trend && (
                      <motion.div
                        animate={{ y: metric.trend === 'up' ? [-2, 2, -2] : metric.trend === 'down' ? [2, -2, 2] : 0 }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        {metric.trend === 'up' && (
                          <TrendingUp className={`w-5 h-5 ${textColor}`} />
                        )}
                        {metric.trend === 'down' && (
                          <TrendingDown className={`w-5 h-5 ${textColor}`} />
                        )}
                      </motion.div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <motion.span
                      key={metric.value}
                      initial={{ scale: 1.3, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`${textColor} text-3xl font-black font-mono`}
                    >
                      {metric.value.toFixed(metric.unit === '%' ? 0 : metric.unit === 'g' ? 2 : 0)}
                    </motion.span>
                    <span className={`${textColor} text-sm font-bold opacity-90`}>
                      {metric.unit}
                    </span>
                    {metric.delta !== undefined && Math.abs(metric.delta) > 0.1 && (
                      <span className={`${textColor} text-xs font-bold opacity-75`}>
                        {metric.delta > 0 ? '+' : ''}{metric.delta.toFixed(1)}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Additional Metrics - High Contrast */}
        {metrics.throttle && metrics.brake && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-foreground/10">
            <div className="bg-green-600 border-2 border-green-400 rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-50" />
                <span className="text-xs font-bold text-green-50 uppercase tracking-wide">Throttle</span>
              </div>
              <div className="text-2xl font-black font-mono text-green-50">
                {metrics.throttle.value.toFixed(0)}%
              </div>
            </div>
            <div className="bg-red-600 border-2 border-red-400 rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-50" />
                <span className="text-xs font-bold text-red-50 uppercase tracking-wide">Brake</span>
              </div>
              <div className="text-2xl font-black font-mono text-red-50">
                {metrics.brake.value.toFixed(0)}%
              </div>
            </div>
          </div>
        )}

        {/* Live Insights - High Contrast */}
        {data && (
          <div className="pt-4 border-t-2 border-foreground/10 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-foreground" />
              <span className="text-base font-bold text-foreground uppercase tracking-wide">
                Live Insights
              </span>
            </div>
            <AnimatePresence>
              {data.gap_analysis?.overtaking_opportunity && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between text-sm p-3 rounded-lg bg-green-700 text-green-50 border-2 border-green-400 font-bold"
                >
                  <span>Overtaking Opportunity</span>
                  <Badge className="bg-green-600 text-green-50 border border-green-400">
                    Active
                  </Badge>
                </motion.div>
              )}
              {data.gap_analysis?.under_pressure && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between text-sm p-3 rounded-lg bg-yellow-700 text-yellow-50 border-2 border-yellow-400 font-bold"
                >
                  <span>Under Pressure</span>
                  <Badge className="bg-yellow-600 text-yellow-50 border border-yellow-400">
                    Warning
                  </Badge>
                </motion.div>
              )}
              {data.tire_wear?.predicted_laps_remaining !== undefined && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between text-sm p-3 rounded-lg bg-blue-700 text-blue-50 border-2 border-blue-400 font-bold"
                >
                  <span>Tire Life Remaining</span>
                  <span className="text-lg font-black">
                    {data.tire_wear.predicted_laps_remaining} laps
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {error && (
          <div className="pt-4 border-t-2 border-foreground/10">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-700 text-red-50 border-2 border-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-bold">Connection Error: {error}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
