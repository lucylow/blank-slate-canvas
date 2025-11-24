// src/pages/COTA22DriversDashboard.tsx
// Circuit of the Americas Dashboard with 22 Drivers Telemetry

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
  AlertCircle,
  CheckCircle2,
  Users,
  Car,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Import telemetry data
import telemetryDataRaw from '../../data/cota_22_drivers_telemetry.json';

const telemetryData = telemetryDataRaw as {
  track: string;
  track_id: string;
  location: string;
  track_length_m: number;
  sample_rate_hz: number;
  samples_per_driver: number;
  drivers: Record<string, {
    driver_name: string;
    telemetry: TelemetryPoint[];
  }>;
};

interface TelemetryPoint {
  timestamp_ms: number;
  speed_kmh: number;
  throttle_pct: number;
  brake_pct: number;
  gear: number;
  engine_rpm: number;
}

interface DriverData {
  driver_name: string;
  telemetry: TelemetryPoint[];
}

type DriverId = keyof typeof telemetryData.drivers;

const COLORS = [
  '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  '#14B8A6', '#A855F7', '#F43F5E', '#0EA5E9', '#22C55E',
  '#EAB308', '#FB923C', '#A78BFA', '#34D399', '#60A5FA',
  '#F472B6', '#818CF8'
];

export default function COTA22DriversDashboard() {
  const [selectedDriver, setSelectedDriver] = useState<DriverId | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeMetric, setActiveMetric] = useState<'speed' | 'throttle' | 'brake' | 'gear' | 'rpm'>('speed');

  const drivers = telemetryData.drivers;
  const maxSamples = Math.max(...Object.values(drivers).map(d => d.telemetry.length));

  // Get current telemetry for all drivers
  const currentTelemetry = useMemo(() => {
    const result: Record<DriverId, TelemetryPoint | null> = {} as any;
    Object.keys(drivers).forEach((driverId) => {
      const driver = drivers[driverId as DriverId];
      if (driver.telemetry[currentIndex]) {
        result[driverId as DriverId] = driver.telemetry[currentIndex];
      }
    });
    return result;
  }, [currentIndex, drivers]);

  // Get selected driver's full telemetry for charts
  const selectedDriverData = useMemo(() => {
    if (!selectedDriver) return null;
    return drivers[selectedDriver];
  }, [selectedDriver, drivers]);

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
    const stats: Record<DriverId, {
      avgSpeed: number;
      maxSpeed: number;
      avgThrottle: number;
      avgBrake: number;
      avgRPM: number;
    }> = {} as any;

    Object.keys(drivers).forEach((driverId) => {
      const driver = drivers[driverId as DriverId];
      const telemetry = driver.telemetry;
      
      const speeds = telemetry.map(t => t.speed_kmh);
      const throttles = telemetry.map(t => t.throttle_pct);
      const brakes = telemetry.map(t => t.brake_pct);
      const rpms = telemetry.map(t => t.engine_rpm);

      stats[driverId as DriverId] = {
        avgSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
        maxSpeed: Math.max(...speeds),
        avgThrottle: throttles.reduce((a, b) => a + b, 0) / throttles.length,
        avgBrake: brakes.reduce((a, b) => a + b, 0) / brakes.length,
        avgRPM: rpms.reduce((a, b) => a + b, 0) / rpms.length,
      };
    });

    return stats;
  }, [drivers]);

  // Sort drivers by average speed
  const sortedDrivers = useMemo(() => {
    return Object.keys(drivers).sort((a, b) => {
      return driverStats[b as DriverId].avgSpeed - driverStats[a as DriverId].avgSpeed;
    }) as DriverId[];
  }, [drivers, driverStats]);

  const getMetricValue = (driverId: DriverId, metric: string): number => {
    const telemetry = currentTelemetry[driverId];
    if (!telemetry) return 0;
    
    switch (metric) {
      case 'speed': return telemetry.speed_kmh;
      case 'throttle': return telemetry.throttle_pct;
      case 'brake': return telemetry.brake_pct;
      case 'gear': return telemetry.gear;
      case 'rpm': return telemetry.engine_rpm;
      default: return 0;
    }
  };

  const getMetricColor = (value: number, metric: string): string => {
    switch (metric) {
      case 'speed':
        if (value > 250) return 'text-green-500';
        if (value > 200) return 'text-blue-500';
        if (value > 150) return 'text-yellow-500';
        return 'text-orange-500';
      case 'throttle':
        if (value > 80) return 'text-green-500';
        if (value > 50) return 'text-blue-500';
        return 'text-gray-500';
      case 'brake':
        if (value > 60) return 'text-red-500';
        if (value > 30) return 'text-orange-500';
        return 'text-gray-500';
      case 'rpm':
        if (value > 10000) return 'text-red-500';
        if (value > 8000) return 'text-orange-500';
        if (value > 6000) return 'text-yellow-500';
        return 'text-green-500';
      default:
        return 'text-foreground';
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
              Circuit of the Americas - 22 Drivers
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

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="drivers">All Drivers</TabsTrigger>
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
                      Real-time telemetry for all 22 drivers
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                      {sortedDrivers.map((driverId, idx) => {
                        const driver = drivers[driverId];
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
                                  {driver.driver_name}
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
                                  <span className={`font-bold ${getMetricColor(telemetry.speed_kmh, 'speed')}`}>
                                    {telemetry.speed_kmh.toFixed(0)} km/h
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Throttle</span>
                                  <span className="font-semibold text-sm">
                                    {telemetry.throttle_pct.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Brake</span>
                                  <span className="font-semibold text-sm">
                                    {telemetry.brake_pct.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">Gear</span>
                                  <span className="font-bold">{telemetry.gear}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">RPM</span>
                                  <span className={`font-semibold text-sm ${getMetricColor(telemetry.engine_rpm, 'rpm')}`}>
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
                          {selectedDriver} - {selectedDriverData.driver_name}
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
          </TabsContent>

          <TabsContent value="drivers" className="space-y-6">
            {selectedDriver && selectedDriverData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {selectedDriver} - {selectedDriverData.driver_name} - Telemetry Charts
                  </CardTitle>
                  <CardDescription>
                    Detailed telemetry analysis
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
                      <LineChart data={chartData}>
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
                        <Line
                          type="monotone"
                          dataKey={activeMetric}
                          stroke={getMetricColor(activeMetric)}
                          strokeWidth={2}
                          dot={false}
                          name={getMetricLabel(activeMetric)}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedDrivers.map((driverId, idx) => {
                const driver = drivers[driverId];
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
                        {driverId} - {driver.driver_name}
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

  function getMetricLabel(metric: string): string {
    switch (metric) {
      case 'speed': return 'Speed (km/h)';
      case 'throttle': return 'Throttle (%)';
      case 'brake': return 'Brake (%)';
      case 'gear': return 'Gear';
      case 'rpm': return 'RPM';
      default: return metric;
    }
  }

  function getMetricColor(metric: string): string {
    switch (metric) {
      case 'speed': return '#3B82F6';
      case 'throttle': return '#10B981';
      case 'brake': return '#EF4444';
      case 'gear': return '#8B5CF6';
      case 'rpm': return '#F59E0B';
      default: return '#6B7280';
    }
  }
}

