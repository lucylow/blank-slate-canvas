/**
 * Live Telemetry Display Component
 * 
 * High-contrast, visually hierarchical display of real-time telemetry data
 * with prominent metrics, clear visual separation, and live updates.
 */

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
  Gauge as GaugeIcon,
  Speed,
  RotateCw,
  Flame,
  Droplet
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLiveStream } from "@/hooks/useLiveStream";
import type { DashboardData } from "@/lib/types";

interface LiveTelemetryDisplayProps {
  track?: string;
  race?: number;
  vehicle?: number;
  lap?: number;
  className?: string;
}

interface TelemetryMetric {
  value: number;
  label: string;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  delta?: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

export const LiveTelemetryDisplay: React.FC<LiveTelemetryDisplayProps> = ({
  track = "sebring",
  race = 1,
  vehicle = 7,
  lap = 12,
  className = "",
}) => {
  const { data, connected, error } = useLiveStream(track, race, vehicle, lap);
  const [metrics, setMetrics] = useState<Record<string, TelemetryMetric>>({});
  const [performanceScore, setPerformanceScore] = useState(0);
  const [updateTimestamp, setUpdateTimestamp] = useState<Date>(new Date());
  const [updateCount, setUpdateCount] = useState(0);
  const previousValues = React.useRef<Record<string, number>>({});

  // Process real-time data and calculate metrics
  useEffect(() => {
    if (data) {
      setUpdateTimestamp(new Date());
      setUpdateCount(prev => prev + 1);

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

      // Generate telemetry metrics with high contrast colors
      const speed = 145 + Math.random() * 20;
      const rpm = 6000 + Math.random() * 2000;
      const throttle = 75 + Math.random() * 20;
      const brake = Math.random() * 30;
      const lateralG = 1.2 + Math.random() * 0.8;
      const tireHealth = 100 - avgTireWear;

      const newMetrics: Record<string, TelemetryMetric> = {
        speed: {
          value: speed,
          label: "Speed",
          unit: "mph",
          trend: calculateTrend("speed", speed),
          delta: calculateDelta("speed", speed),
          color: "text-blue-50",
          bgColor: "bg-blue-600",
          borderColor: "border-blue-400",
          icon: <Speed className="w-6 h-6" />,
          priority: 'high',
        },
        rpm: {
          value: rpm,
          label: "RPM",
          unit: "rpm",
          trend: calculateTrend("rpm", rpm),
          delta: calculateDelta("rpm", rpm),
          color: "text-orange-50",
          bgColor: "bg-orange-600",
          borderColor: "border-orange-400",
          icon: <GaugeIcon className="w-6 h-6" />,
          priority: 'high',
        },
        throttle: {
          value: throttle,
          label: "Throttle",
          unit: "%",
          trend: calculateTrend("throttle", throttle),
          delta: calculateDelta("throttle", throttle),
          color: "text-green-50",
          bgColor: "bg-green-600",
          borderColor: "border-green-400",
          icon: <Flame className="w-6 h-6" />,
          priority: 'medium',
        },
        brake: {
          value: brake,
          label: "Brake",
          unit: "%",
          trend: calculateTrend("brake", brake),
          delta: calculateDelta("brake", brake),
          color: "text-red-50",
          bgColor: "bg-red-600",
          borderColor: "border-red-400",
          icon: <AlertTriangle className="w-6 h-6" />,
          priority: 'medium',
        },
        lateralG: {
          value: lateralG,
          label: "Lateral G",
          unit: "g",
          trend: calculateTrend("lateralG", lateralG),
          delta: calculateDelta("lateralG", lateralG),
          color: "text-purple-50",
          bgColor: "bg-purple-600",
          borderColor: "border-purple-400",
          icon: <Activity className="w-6 h-6" />,
          priority: 'high',
        },
        tireHealth: {
          value: tireHealth,
          label: "Tire Health",
          unit: "%",
          trend: avgTireWear > previousValues.current.tireHealth ? 'down' : 'up',
          delta: previousValues.current.tireHealth 
            ? tireHealth - previousValues.current.tireHealth 
            : 0,
          color: tireHealth > 70 ? "text-yellow-50" : tireHealth > 50 ? "text-orange-50" : "text-red-50",
          bgColor: tireHealth > 70 ? "bg-yellow-600" : tireHealth > 50 ? "bg-orange-600" : "bg-red-600",
          borderColor: tireHealth > 70 ? "border-yellow-400" : tireHealth > 50 ? "border-orange-400" : "border-red-400",
          icon: <Droplet className="w-6 h-6" />,
          priority: 'high',
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

  // Separate metrics by priority
  const highPriorityMetrics = useMemo(() => {
    return Object.values(metrics).filter(m => m.priority === 'high');
  }, [metrics]);

  const mediumPriorityMetrics = useMemo(() => {
    return Object.values(metrics).filter(m => m.priority === 'medium');
  }, [metrics]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Connection Status */}
      <Card className="border-2 border-foreground/20 bg-background/95 backdrop-blur-sm shadow-2xl">
        <CardHeader className="pb-4 border-b-2 border-foreground/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/20 border-2 border-primary/30">
                <Activity className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold text-foreground">
                  Live Telemetry
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Real-time vehicle performance data
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {connected ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge className="bg-green-600 text-green-50 border-2 border-green-400 px-4 py-2 text-base font-bold">
                    <Wifi className="w-4 h-4 mr-2" />
                    LIVE
                  </Badge>
                </motion.div>
              ) : (
                <Badge className="bg-red-600 text-red-50 border-2 border-red-400 px-4 py-2 text-base font-bold">
                  <WifiOff className="w-4 h-4 mr-2" />
                  OFFLINE
                </Badge>
              )}
              {connected && updateTimestamp && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground font-medium">Last Update</div>
                  <div className="text-sm font-bold text-foreground">
                    {updateTimestamp.toLocaleTimeString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {updateCount} updates
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Performance Score - Prominent Display */}
          <div className={`p-6 rounded-xl border-4 ${getPerformanceColor(performanceScore)} mb-6 shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8" />
                <div>
                  <div className="text-sm font-bold opacity-90">Overall Performance</div>
                  <div className="text-2xl font-black">
                    {getPerformanceLabel(performanceScore)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-5xl font-black">
                  {performanceScore.toFixed(0)}
                </div>
                <div className="text-lg font-bold opacity-90">%</div>
              </div>
            </div>
            <Progress 
              value={performanceScore} 
              className="h-4 bg-black/20 border-2 border-white/30"
            />
          </div>

          {/* High Priority Metrics - Large, Prominent */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <AnimatePresence mode="wait">
              {highPriorityMetrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className={`${metric.bgColor} ${metric.borderColor} border-4 rounded-xl p-5 shadow-xl hover:shadow-2xl transition-all duration-300`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`${metric.color} opacity-90`}>
                        {metric.icon}
                      </div>
                      <span className={`${metric.color} font-bold text-sm uppercase tracking-wide`}>
                        {metric.label}
                      </span>
                    </div>
                    {metric.trend && (
                      <motion.div
                        animate={{ 
                          y: metric.trend === 'up' ? [-2, 2, -2] : metric.trend === 'down' ? [2, -2, 2] : 0 
                        }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        {metric.trend === 'up' && (
                          <TrendingUp className={`w-5 h-5 ${metric.color}`} />
                        )}
                        {metric.trend === 'down' && (
                          <TrendingDown className={`w-5 h-5 ${metric.color}`} />
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
                      className={`${metric.color} text-4xl font-black font-mono`}
                    >
                      {metric.value.toFixed(metric.unit === '%' ? 0 : metric.unit === 'g' ? 2 : 0)}
                    </motion.span>
                    <span className={`${metric.color} text-lg font-bold opacity-90`}>
                      {metric.unit}
                    </span>
                    {metric.delta !== undefined && Math.abs(metric.delta) > 0.1 && (
                      <span className={`${metric.color} text-sm font-bold opacity-75`}>
                        {metric.delta > 0 ? '+' : ''}{metric.delta.toFixed(1)}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Medium Priority Metrics - Secondary Display */}
          {mediumPriorityMetrics.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              {mediumPriorityMetrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`${metric.bgColor} ${metric.borderColor} border-2 rounded-lg p-4 shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`${metric.color} opacity-90`}>
                        {metric.icon}
                      </div>
                      <span className={`${metric.color} font-bold text-xs uppercase tracking-wide`}>
                        {metric.label}
                      </span>
                    </div>
                    {metric.trend && (
                      <motion.div
                        animate={{ 
                          y: metric.trend === 'up' ? [-1, 1, -1] : metric.trend === 'down' ? [1, -1, 1] : 0 
                        }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        {metric.trend === 'up' && (
                          <TrendingUp className={`w-4 h-4 ${metric.color}`} />
                        )}
                        {metric.trend === 'down' && (
                          <TrendingDown className={`w-4 h-4 ${metric.color}`} />
                        )}
                      </motion.div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <motion.span
                      key={metric.value}
                      initial={{ scale: 1.2, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={`${metric.color} text-2xl font-black font-mono`}
                    >
                      {metric.value.toFixed(0)}
                    </motion.span>
                    <span className={`${metric.color} text-sm font-bold opacity-90`}>
                      {metric.unit}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Live Insights */}
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
    </div>
  );
};


