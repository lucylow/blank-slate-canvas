import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Gauge, 
  Activity, 
  TrendingUp, 
  Clock, 
  Zap, 
  Target,
  BarChart3,
  Users,
  Car,
  Play,
  Pause,
  RefreshCw,
  ChevronRight
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

// Import telemetry data
import telemetryDataRaw from '../../../data/mock_cota_telemetry_22.json';

interface TelemetryPoint {
  timestamp_ms: number;
  speed_kmh: number;
  throttle_pct: number;
  brake_pct: number;
  gear: number;
  engine_rpm: number;
}

interface DriverData {
  driver_id: string;
  driver_index: number;
  generated_at_utc: string;
  style: {
    max_speed: number;
    accel: number;
    brake_aggr: number;
    throttle_style: number;
    shift_bias: number;
    rpm_peak: number;
  };
  telemetry: TelemetryPoint[];
}

type TelemetryData = Record<string, DriverData>;

const COLORS = [
  '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#A855F7', '#F43F5E', '#0EA5E9', '#22C55E',
  '#EAB308', '#FB923C', '#A78BFA', '#34D399', '#60A5FA',
  '#F472B6', '#818CF8'
];

export function COTATelemetryDashboard() {
  const telemetryData = telemetryDataRaw as TelemetryData;
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeMetric, setActiveMetric] = useState<'speed' | 'throttle' | 'brake' | 'gear' | 'rpm'>('speed');
  const [viewMode, setViewMode] = useState<'overview' | 'comparison' | 'analytics'>('overview');

  const drivers = Object.keys(telemetryData);
  const maxSamples = Math.max(...Object.values(telemetryData).map(d => d.telemetry.length));

  // Get current telemetry for all drivers
  const currentTelemetry = useMemo(() => {
    const result: Record<string, TelemetryPoint | null> = {};
    drivers.forEach((driverId) => {
      const driver = telemetryData[driverId];
      if (driver.telemetry[currentIndex]) {
        result[driverId] = driver.telemetry[currentIndex];
      }
    });
    return result;
  }, [currentIndex, drivers]);

  // Get selected driver's full telemetry for charts
  const selectedDriverData = useMemo(() => {
    if (!selectedDriver) return null;
    return telemetryData[selectedDriver];
  }, [selectedDriver, telemetryData]);

  // Chart data for selected driver
  const chartData = useMemo(() => {
    if (!selectedDriverData) return [];
    return selectedDriverData.telemetry.map((point, idx) => ({
      time: point.timestamp_ms / 1000, // Convert to seconds
      speed: point.speed_kmh,
      throttle: point.throttle_pct,
      brake: point.brake_pct,
      gear: point.gear,
      rpm: point.engine_rpm,
      index: idx
    }));
  }, [selectedDriverData]);

  // Comparison chart data - all drivers for selected metric
  const comparisonChartData = useMemo(() => {
    if (viewMode !== 'comparison') return [];
    
    const data: Record<number, Record<string, number>> = {};
    const maxLength = Math.max(...Object.values(telemetryData).map(d => d.telemetry.length));
    
    for (let i = 0; i < Math.min(maxLength, 200); i++) {
      const time = (i * 250) / 1000; // Convert to seconds
      data[time] = { time };
      
      drivers.forEach((driverId) => {
        const driver = telemetryData[driverId];
        if (driver.telemetry[i]) {
          const value = driver.telemetry[i][activeMetric === 'speed' ? 'speed_kmh' : 
                       activeMetric === 'throttle' ? 'throttle_pct' :
                       activeMetric === 'brake' ? 'brake_pct' :
                       activeMetric === 'gear' ? 'gear' : 'engine_rpm'];
          data[time][driverId] = value;
        }
      });
    }
    
    return Object.values(data);
  }, [viewMode, activeMetric, telemetryData, drivers]);

  // Simulate playback
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        return next >= maxSamples ? 0 : next;
      });
    }, 250 / playbackSpeed); // 250ms base interval

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, maxSamples]);

  // Calculate driver statistics
  const driverStats = useMemo(() => {
    const stats: Record<string, {
      avgSpeed: number;
      maxSpeed: number;
      avgThrottle: number;
      avgBrake: number;
      avgRPM: number;
      maxRPM: number;
    }> = {};

    drivers.forEach((driverId) => {
      const driver = telemetryData[driverId];
      const telemetry = driver.telemetry;
      
      const speeds = telemetry.map(t => t.speed_kmh);
      const throttles = telemetry.map(t => t.throttle_pct);
      const brakes = telemetry.map(t => t.brake_pct);
      const rpms = telemetry.map(t => t.engine_rpm);

      stats[driverId] = {
        avgSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
        maxSpeed: Math.max(...speeds),
        avgThrottle: throttles.reduce((a, b) => a + b, 0) / throttles.length,
        avgBrake: brakes.reduce((a, b) => a + b, 0) / brakes.length,
        avgRPM: rpms.reduce((a, b) => a + b, 0) / rpms.length,
        maxRPM: Math.max(...rpms),
      };
    });

    return stats;
  }, [drivers, telemetryData]);

  // Sort drivers by average speed
  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => {
      return driverStats[b].avgSpeed - driverStats[a].avgSpeed;
    });
  }, [drivers, driverStats]);

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case 'speed': return 'Speed (km/h)';
      case 'throttle': return 'Throttle (%)';
      case 'brake': return 'Brake (%)';
      case 'gear': return 'Gear';
      case 'rpm': return 'RPM';
      default: return metric;
    }
  };

  const getMetricColorHex = (metric: string): string => {
    switch (metric) {
      case 'speed': return '#3B82F6';
      case 'throttle': return '#10B981';
      case 'brake': return '#EF4444';
      case 'gear': return '#8B5CF6';
      case 'rpm': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Circuit of the Americas - 22 Drivers Telemetry
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Austin, Texas | Real-time Telemetry Dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              22 Drivers
            </Badge>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                variant="outline"
                size="sm"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border bg-background text-sm"
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="4">4x</option>
              </select>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="w-full" value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Driver Grid */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      All Drivers - Current Telemetry
                    </CardTitle>
                    <CardDescription>
                      Real-time telemetry for all 22 drivers at COTA
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                      {sortedDrivers.map((driverId, idx) => {
                        const driver = telemetryData[driverId];
                        const telemetry = currentTelemetry[driverId];
                        const stats = driverStats[driverId];
                        const color = COLORS[idx % COLORS.length];
                        const isSelected = selectedDriver === driverId;

                        return (
                          <motion.div
                            key={driverId}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            onClick={() => setSelectedDriver(driverId)}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/10 shadow-lg'
                                : 'border-border hover:border-primary/50 bg-card'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="font-bold text-sm">{driverId}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Driver #{driver.driver_index}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                #{idx + 1}
                              </Badge>
                            </div>

                            {telemetry && (
                              <div className="space-y-2 mt-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Speed</span>
                                  <span className="font-bold text-blue-500">
                                    {telemetry.speed_kmh.toFixed(0)} km/h
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Throttle</span>
                                  <span className="font-semibold text-sm text-green-500">
                                    {telemetry.throttle_pct.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Brake</span>
                                  <span className="font-semibold text-sm text-red-500">
                                    {telemetry.brake_pct.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Gear</span>
                                  <span className="font-bold">{telemetry.gear}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">RPM</span>
                                  <span className="font-semibold text-sm text-orange-500">
                                    {telemetry.engine_rpm.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="mt-3 pt-3 border-t border-border/50">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Avg Speed</span>
                                <span className="font-semibold">{stats.avgSpeed.toFixed(0)} km/h</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Selected Driver Details */}
              <div className="space-y-6">
                {selectedDriver && selectedDriverData ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="w-5 h-5" />
                          {selectedDriver}
                        </CardTitle>
                        <CardDescription>
                          Current telemetry snapshot
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {currentTelemetry[selectedDriver] && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                                <p className="text-xs text-muted-foreground mb-1">Speed</p>
                                <p className="text-3xl font-bold text-blue-500">
                                  {currentTelemetry[selectedDriver]!.speed_kmh.toFixed(0)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">km/h</p>
                              </div>
                              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                                <p className="text-xs text-muted-foreground mb-1">Gear</p>
                                <p className="text-3xl font-bold text-purple-500">
                                  {currentTelemetry[selectedDriver]!.gear}
                                </p>
                              </div>
                              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                                <p className="text-xs text-muted-foreground mb-1">Throttle</p>
                                <p className="text-3xl font-bold text-green-500">
                                  {currentTelemetry[selectedDriver]!.throttle_pct.toFixed(0)}%
                                </p>
                              </div>
                              <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                                <p className="text-xs text-muted-foreground mb-1">Brake</p>
                                <p className="text-3xl font-bold text-red-500">
                                  {currentTelemetry[selectedDriver]!.brake_pct.toFixed(0)}%
                                </p>
                              </div>
                            </div>
                            <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                              <p className="text-xs text-muted-foreground mb-1">Engine RPM</p>
                              <p className="text-4xl font-bold text-orange-500">
                                {currentTelemetry[selectedDriver]!.engine_rpm.toLocaleString()}
                              </p>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Average Speed</span>
                          <span className="font-bold">{driverStats[selectedDriver].avgSpeed.toFixed(1)} km/h</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Max Speed</span>
                          <span className="font-bold">{driverStats[selectedDriver].maxSpeed.toFixed(1)} km/h</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Avg Throttle</span>
                          <span className="font-bold">{driverStats[selectedDriver].avgThrottle.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Avg Brake</span>
                          <span className="font-bold">{driverStats[selectedDriver].avgBrake.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Avg RPM</span>
                          <span className="font-bold">{driverStats[selectedDriver].avgRPM.toFixed(0)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">Select a driver to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Selected Driver Chart */}
            {selectedDriver && selectedDriverData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {selectedDriver} - Telemetry Charts
                  </CardTitle>
                  <CardDescription>
                    Detailed telemetry analysis over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Metric Selector */}
                  <div className="flex gap-2 flex-wrap">
                    {(['speed', 'throttle', 'brake', 'gear', 'rpm'] as const).map((metric) => (
                      <Button
                        key={metric}
                        variant={activeMetric === metric ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setActiveMetric(metric)}
                      >
                        {metric.charAt(0).toUpperCase() + metric.slice(1)}
                      </Button>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id={`color${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={getMetricColorHex(activeMetric)} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={getMetricColorHex(activeMetric)} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis 
                          dataKey="time" 
                          stroke="hsl(var(--muted-foreground))"
                          label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          label={{ value: getMetricLabel(activeMetric), angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey={activeMetric}
                          stroke={getMetricColorHex(activeMetric)}
                          fill={`url(#color${activeMetric})`}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Multi-Driver Comparison
                </CardTitle>
                <CardDescription>
                  Compare all 22 drivers for selected metric
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Metric Selector */}
                <div className="flex gap-2 flex-wrap">
                  {(['speed', 'throttle', 'brake', 'gear', 'rpm'] as const).map((metric) => (
                    <Button
                      key={metric}
                      variant={activeMetric === metric ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveMetric(metric)}
                    >
                      {metric.charAt(0).toUpperCase() + metric.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Comparison Chart */}
                <div className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="time" 
                        stroke="hsl(var(--muted-foreground))"
                        label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        label={{ value: getMetricLabel(activeMetric), angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      {sortedDrivers.slice(0, 10).map((driverId, idx) => (
                        <Line
                          key={driverId}
                          type="monotone"
                          dataKey={driverId}
                          stroke={COLORS[idx % COLORS.length]}
                          strokeWidth={1.5}
                          dot={false}
                          name={driverId}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedDrivers.map((driverId, idx) => {
                const driver = telemetryData[driverId];
                const stats = driverStats[driverId];
                const color = COLORS[idx % COLORS.length];

                return (
                  <Card key={driverId}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {driverId} - Driver #{driver.driver_index}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Position</span>
                        <Badge variant="outline">#{idx + 1}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Avg Speed</span>
                        <span className="font-bold">{stats.avgSpeed.toFixed(0)} km/h</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Max Speed</span>
                        <span className="font-bold">{stats.maxSpeed.toFixed(0)} km/h</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Avg Throttle</span>
                        <span className="font-bold">{stats.avgThrottle.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Avg Brake</span>
                        <span className="font-bold">{stats.avgBrake.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Max RPM</span>
                        <span className="font-bold">{stats.maxRPM.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

