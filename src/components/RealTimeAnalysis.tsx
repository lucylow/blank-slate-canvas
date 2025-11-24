// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Zap, 
  Gauge, 
  TrendingUp, 
  TrendingDown,
  Wifi, 
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  Flame,
  BarChart3,
  GaugeCircle,
  Timer,
  Award,
  AlertTriangle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { telemetryWS, type TelemetryPoint } from '@/lib/api';
import { cn } from '@/lib/utils';

interface RealTimeMetrics {
  speed: number;
  rpm: number;
  throttle: number;
  brake: number;
  lateralG: number;
  longitudinalG: number;
  steeringAngle: number;
  gear: number;
  tireWearFL: number;
  tireWearFR: number;
  tireWearRL: number;
  tireWearRR: number;
  tireTempFL: number;
  tireTempFR: number;
  tireTempRL: number;
  tireTempRR: number;
}

interface GapAnalysis {
  gapToLeader: number;
  gapToAhead: number;
  gapBehind: number;
  position: number;
  totalCars: number;
}

interface SectorPerformance {
  sector1: number;
  sector2: number;
  sector3: number;
  predictedLapTime: number;
  bestLapTime: number;
}

interface LiveAlert {
  id: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  message: string;
  timestamp: number;
  metric?: string;
  value?: number;
}

export const RealTimeAnalysis: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<RealTimeMetrics | null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [sectorPerformance, setSectorPerformance] = useState<SectorPerformance | null>(null);
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [performanceScore, setPerformanceScore] = useState(85);
  const [selectedChart, setSelectedChart] = useState<'speed' | 'throttle' | 'brake' | 'gforces' | 'tirewear'>('speed');
  const [currentLap, setCurrentLap] = useState(12);
  const [lapTime, setLapTime] = useState(99.234);
  const listenerRef = useRef<((data: TelemetryPoint) => void) | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    const handleConnectionChange = (status: 'connected' | 'connecting' | 'disconnected') => {
      setConnected(status === 'connected');
    };

    telemetryWS.setConnectionChangeHandler(handleConnectionChange);

    // Set up telemetry listener
    listenerRef.current = (data: TelemetryPoint) => {
      setTelemetryHistory(prev => {
        const updated = [...prev, data].slice(-100); // Keep last 100 points
        return updated;
      });

      // Update current metrics
      const metrics: RealTimeMetrics = {
        speed: data.speed || 0,
        rpm: data.rpm || 0,
        throttle: (data.throttle || 0) * 100,
        brake: (data.brake || 0) * 100,
        lateralG: data.g_force_lat || 0,
        longitudinalG: data.g_force_long || 0,
        steeringAngle: 0,
        gear: data.gear || 0,
        tireWearFL: data.tire_pressure_fl || 0,
        tireWearFR: data.tire_pressure_fr || 0,
        tireWearRL: data.tire_pressure_rl || 0,
        tireWearRR: data.tire_pressure_rr || 0,
        tireTempFL: data.tire_temp_fl || 0,
        tireTempFR: data.tire_temp_fr || 0,
        tireTempRL: data.tire_temp_rl || 0,
        tireTempRR: data.tire_temp_rr || 0,
      };
      setCurrentMetrics(metrics);

      // Calculate performance score
      const avgTireWear = (metrics.tireWearFL + metrics.tireWearFR + metrics.tireWearRL + metrics.tireWearRR) / 4;
      const score = Math.max(0, Math.min(100, 100 - (avgTireWear / 10)));
      setPerformanceScore(score);

      // Generate gap analysis (mock for demo)
      if (Math.random() > 0.95) {
        setGapAnalysis({
          gapToLeader: 2.345 + Math.random() * 0.5,
          gapToAhead: 0.5 + Math.random() * 0.3,
          gapBehind: 1.2 + Math.random() * 0.4,
          position: 3,
          totalCars: 28,
        });
      }

      // Update sector performance
      if (data.sector) {
        setSectorPerformance({
          sector1: 26.5 + Math.random() * 0.3,
          sector2: 43.2 + Math.random() * 0.4,
          sector3: 29.1 + Math.random() * 0.3,
          predictedLapTime: 99.234 + Math.random() * 0.5,
          bestLapTime: 98.456,
        });
      }

      // Generate alerts
      if (metrics.tireTempFL > 120 || metrics.tireTempFR > 120) {
        addAlert('warning', `High tire temperature detected: ${metrics.tireTempFL.toFixed(0)}°C`, 'tireTemp', metrics.tireTempFL);
      }
      if (metrics.brake > 80) {
        addAlert('info', 'Heavy braking detected', 'brake', metrics.brake);
      }
      if (metrics.lateralG > 2.0) {
        addAlert('info', 'High lateral G-force', 'lateralG', metrics.lateralG);
      }
    };

    const unsubscribe = telemetryWS.subscribe(listenerRef.current);

    // Connect if not already connected
    if (!telemetryWS.isConnected()) {
      telemetryWS.connect();
    } else {
      setConnected(true);
    }

    // Demo mode: Generate mock data if not connected
    let mockInterval: NodeJS.Timeout | null = null;
    if (!telemetryWS.isConnected()) {
      mockInterval = setInterval(() => {
        const mockData: TelemetryPoint = {
          lap: currentLap,
          sector: Math.floor(Math.random() * 3) + 1,
          speed: 120 + Math.random() * 40,
          throttle: 0.5 + Math.random() * 0.5,
          brake: Math.random() * 0.3,
          g_force_lat: 0.5 + Math.random() * 1.5,
          g_force_long: 0.3 + Math.random() * 0.7,
          tire_pressure_fl: 20 + Math.random() * 5,
          tire_pressure_fr: 20 + Math.random() * 5,
          tire_pressure_rl: 20 + Math.random() * 5,
          tire_pressure_rr: 20 + Math.random() * 5,
          tire_temp_fl: 80 + Math.random() * 30,
          tire_temp_fr: 80 + Math.random() * 30,
          tire_temp_rl: 75 + Math.random() * 25,
          tire_temp_rr: 75 + Math.random() * 25,
          brake_temp: 200 + Math.random() * 100,
          gear: Math.floor(3 + Math.random() * 4),
          rpm: 5000 + Math.random() * 3000,
          timestamp: Date.now(),
        };
        listenerRef.current?.(mockData);
      }, 100); // Update every 100ms for smooth real-time feel
    }

    return () => {
      if (mockInterval) {
        clearInterval(mockInterval);
      }
      unsubscribe();
      telemetryWS.setConnectionChangeHandler(undefined);
    };
  }, [currentLap]);

  const addAlert = (type: LiveAlert['type'], message: string, metric?: string, value?: number) => {
    const alert: LiveAlert = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now(),
      metric,
      value,
    };
    setAlerts(prev => [alert, ...prev].slice(0, 10)); // Keep last 10 alerts
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    return telemetryHistory.slice(-50).map((point, index) => ({
      time: index,
      speed: point.speed || 0,
      throttle: (point.throttle || 0) * 100,
      brake: (point.brake || 0) * 100,
      lateralG: point.g_force_lat || 0,
      longitudinalG: point.g_force_long || 0,
      tireWearFL: point.tire_pressure_fl || 0,
      tireWearFR: point.tire_pressure_fr || 0,
      tireWearRL: point.tire_pressure_rl || 0,
      tireWearRR: point.tire_pressure_rr || 0,
    }));
  }, [telemetryHistory]);

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getAlertIcon = (type: LiveAlert['type']) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getAlertColor = (type: LiveAlert['type']) => {
    switch (type) {
      case 'critical':
        return 'border-red-500/50 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'success':
        return 'border-green-500/50 bg-green-500/10';
      default:
        return 'border-blue-500/50 bg-blue-500/10';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            Real-Time Analysis Dashboard
          </h2>
          <p className="text-muted-foreground mt-2">
            Live telemetry monitoring, performance metrics, and strategic insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          {connected ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 px-4 py-2">
              <Wifi className="w-4 h-4 mr-2" />
              Live Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-4 py-2">
              <WifiOff className="w-4 h-4 mr-2" />
              Demo Mode
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Performance Score */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Performance Score</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className={cn("text-4xl font-bold", getPerformanceColor(performanceScore))}>
                  {performanceScore.toFixed(0)}
                </span>
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className={cn("text-sm font-semibold", getPerformanceColor(performanceScore))}>
                {getPerformanceLabel(performanceScore)}
              </p>
              <Progress value={performanceScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Current Lap Time */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">Lap Time</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-mono">{lapTime.toFixed(3)}</span>
                <span className="text-sm text-muted-foreground">s</span>
              </div>
              <p className="text-sm text-muted-foreground">Lap {currentLap}</p>
              <div className="flex items-center gap-2 text-xs">
                <TrendingDown className="w-3 h-3 text-green-500" />
                <span className="text-green-500">-0.234s vs best</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Speed */}
        {currentMetrics && (
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">Speed</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-mono">{currentMetrics.speed.toFixed(0)}</span>
                  <span className="text-sm text-muted-foreground">mph</span>
                </div>
                <p className="text-sm text-muted-foreground">Gear {currentMetrics.gear}</p>
                <Progress value={(currentMetrics.speed / 180) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* RPM */}
        {currentMetrics && (
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-muted-foreground">RPM</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-mono">{currentMetrics.rpm.toFixed(0)}</span>
                  <span className="text-sm text-muted-foreground">rpm</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentMetrics.throttle.toFixed(0)}% throttle
                </p>
                <Progress value={(currentMetrics.rpm / 8000) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts and Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Charts */}
        <Card className="lg:col-span-2 border-border/50 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Real-Time Telemetry Charts
              </CardTitle>
              <div className="flex gap-2">
                {(['speed', 'throttle', 'brake', 'gforces', 'tirewear'] as const).map((chart) => (
                  <Button
                    key={chart}
                    variant={selectedChart === chart ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedChart(chart)}
                    className="text-xs"
                  >
                    {chart.charAt(0).toUpperCase() + chart.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            <CardDescription>Live telemetry data visualization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {selectedChart === 'speed' && (
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="speed" 
                      stroke="#3B82F6" 
                      fill="#3B82F6" 
                      fillOpacity={0.3}
                      name="Speed (mph)"
                    />
                  </AreaChart>
                )}
                {selectedChart === 'throttle' && (
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="throttle" 
                      stroke="#10B981" 
                      fill="#10B981" 
                      fillOpacity={0.3}
                      name="Throttle (%)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="brake" 
                      stroke="#EF4444" 
                      fill="#EF4444" 
                      fillOpacity={0.3}
                      name="Brake (%)"
                    />
                  </AreaChart>
                )}
                {selectedChart === 'brake' && (
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="brake" 
                      stroke="#EF4444" 
                      fill="#EF4444" 
                      fillOpacity={0.3}
                      name="Brake (%)"
                    />
                  </AreaChart>
                )}
                {selectedChart === 'gforces' && (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="lateralG" 
                      stroke="#8B5CF6" 
                      strokeWidth={2}
                      name="Lateral G"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="longitudinalG" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="Longitudinal G"
                    />
                  </LineChart>
                )}
                {selectedChart === 'tirewear' && (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="tireWearFL" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Front Left"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tireWearFR" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      name="Front Right"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tireWearRL" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Rear Left"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tireWearRR" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      name="Rear Right"
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gap Analysis & Sector Performance */}
        <div className="space-y-6">
          {/* Gap Analysis */}
          {gapAnalysis && (
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-primary" />
                  Gap Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <span className="text-sm text-muted-foreground">Position</span>
                    <span className="text-2xl font-bold">
                      P{gapAnalysis.position} / {gapAnalysis.totalCars}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <span className="text-sm text-muted-foreground">Gap to Leader</span>
                    <span className="text-xl font-bold font-mono text-yellow-500">
                      +{gapAnalysis.gapToLeader.toFixed(3)}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <span className="text-sm text-muted-foreground">Gap Ahead</span>
                    <span className="text-lg font-semibold font-mono">
                      +{gapAnalysis.gapToAhead.toFixed(3)}s
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <span className="text-sm text-muted-foreground">Gap Behind</span>
                    <span className="text-lg font-semibold font-mono text-red-500">
                      -{gapAnalysis.gapBehind.toFixed(3)}s
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sector Performance */}
          {sectorPerformance && (
            <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  Sector Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <span className="text-sm text-muted-foreground">Sector 1</span>
                    <span className="text-lg font-bold font-mono">{sectorPerformance.sector1.toFixed(3)}s</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <span className="text-sm text-muted-foreground">Sector 2</span>
                    <span className="text-lg font-bold font-mono">{sectorPerformance.sector2.toFixed(3)}s</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                    <span className="text-sm text-muted-foreground">Sector 3</span>
                    <span className="text-lg font-bold font-mono">{sectorPerformance.sector3.toFixed(3)}s</span>
                  </div>
                  <div className="pt-3 border-t border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Predicted Lap</span>
                      <span className="text-xl font-bold font-mono text-primary">
                        {sectorPerformance.predictedLapTime.toFixed(3)}s
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Best Lap</span>
                      <span className="text-sm font-semibold font-mono">
                        {sectorPerformance.bestLapTime.toFixed(3)}s
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tire Monitoring & G-Forces */}
      {currentMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tire Monitoring */}
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                Tire Monitoring
              </CardTitle>
              <CardDescription>Real-time tire pressure and temperature</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Front Left</div>
                  <div className="p-3 rounded-lg bg-accent/30">
                    <div className="text-sm text-muted-foreground mb-1">Pressure</div>
                    <div className="text-2xl font-bold font-mono">{currentMetrics.tireWearFL.toFixed(1)} PSI</div>
                    <div className="text-sm text-muted-foreground mt-2">Temperature</div>
                    <div className="text-xl font-bold font-mono">{currentMetrics.tireTempFL.toFixed(0)}°C</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Front Right</div>
                  <div className="p-3 rounded-lg bg-accent/30">
                    <div className="text-sm text-muted-foreground mb-1">Pressure</div>
                    <div className="text-2xl font-bold font-mono">{currentMetrics.tireWearFR.toFixed(1)} PSI</div>
                    <div className="text-sm text-muted-foreground mt-2">Temperature</div>
                    <div className="text-xl font-bold font-mono">{currentMetrics.tireTempFR.toFixed(0)}°C</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Rear Left</div>
                  <div className="p-3 rounded-lg bg-accent/30">
                    <div className="text-sm text-muted-foreground mb-1">Pressure</div>
                    <div className="text-2xl font-bold font-mono">{currentMetrics.tireWearRL.toFixed(1)} PSI</div>
                    <div className="text-sm text-muted-foreground mt-2">Temperature</div>
                    <div className="text-xl font-bold font-mono">{currentMetrics.tireTempRL.toFixed(0)}°C</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Rear Right</div>
                  <div className="p-3 rounded-lg bg-accent/30">
                    <div className="text-sm text-muted-foreground mb-1">Pressure</div>
                    <div className="text-2xl font-bold font-mono">{currentMetrics.tireWearRR.toFixed(1)} PSI</div>
                    <div className="text-sm text-muted-foreground mt-2">Temperature</div>
                    <div className="text-xl font-bold font-mono">{currentMetrics.tireTempRR.toFixed(0)}°C</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* G-Forces */}
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GaugeCircle className="w-5 h-5 text-primary" />
                G-Force Analysis
              </CardTitle>
              <CardDescription>Lateral and longitudinal forces</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-accent/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Lateral G-Force</span>
                    <span className="text-2xl font-bold font-mono">{currentMetrics.lateralG.toFixed(2)}g</span>
                  </div>
                  <Progress value={Math.abs((currentMetrics.lateralG / 3) * 100)} className="h-2" />
                </div>
                <div className="p-4 rounded-lg bg-accent/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Longitudinal G-Force</span>
                    <span className="text-2xl font-bold font-mono">{currentMetrics.longitudinalG.toFixed(2)}g</span>
                  </div>
                  <Progress value={Math.abs((currentMetrics.longitudinalG / 2) * 100)} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                  <div className="text-center p-3 rounded-lg bg-accent/20">
                    <div className="text-xs text-muted-foreground mb-1">Throttle</div>
                    <div className="text-xl font-bold font-mono text-green-500">{currentMetrics.throttle.toFixed(0)}%</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-accent/20">
                    <div className="text-xs text-muted-foreground mb-1">Brake</div>
                    <div className="text-xl font-bold font-mono text-red-500">{currentMetrics.brake.toFixed(0)}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Alerts */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Live Alerts & Notifications
          </CardTitle>
          <CardDescription>Real-time system alerts and performance notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <AnimatePresence>
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      getAlertColor(alert.type)
                    )}
                  >
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{alert.message}</div>
                      {alert.metric && alert.value !== undefined && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {alert.metric}: {alert.value.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No alerts at this time</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

