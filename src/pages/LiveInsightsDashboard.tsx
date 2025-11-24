// src/pages/LiveInsightsDashboard.tsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Wifi, 
  WifiOff,
  AlertTriangle,
  Target,
  Clock,
  BarChart3,
  Gauge,
  Speed,
  RotateCw,
  Flame,
  Droplet,
  Brain,
  Sparkles,
  RefreshCw,
  Settings,
  Car,
  MapPin,
  Award,
  AlertCircle,
  CheckCircle2,
  Info,
  Gauge as GaugeIcon,
  Timer,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

import { DeliveryProvider } from '../components/DeliveryProvider';
import { InsightList } from '../components/InsightList';
import { AgentStatusPanel } from '../components/AgentStatusPanel';
import { TaskQueuePanel } from '../components/TaskQueuePanel';
import { InsightModal } from '../components/InsightModal';
import { useLiveStream } from '@/hooks/useLiveStream';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgentStore } from '../stores/agentStore';
import type { DashboardData } from '@/lib/types';

export default function LiveInsightsDashboard() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState('sebring');
  const [selectedRace, setSelectedRace] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(7);
  const [selectedLap, setSelectedLap] = useState(12);
  const [selectedMetric, setSelectedMetric] = useState('speed');
  const [chartExpanded, setChartExpanded] = useState(false);
  const [telemetryHistory, setTelemetryHistory] = useState<Array<{time: number; speed: number; rpm: number; throttle: number; brake: number; tireHealth: number}>>([]);
  const historyRef = useRef<typeof telemetryHistory>([]);

  const { 
    data, 
    connected, 
    error: streamError,
    reconnectAttempts,
    retry: retryStream,
    maxReconnectAttempts
  } = useLiveStream(selectedTrack, selectedRace, selectedVehicle, selectedLap);

  const insights = useAgentStore((s) => s.insights);
  const insightOrder = useAgentStore((s) => s.insightOrder);

  // Build telemetry history for charts
  useEffect(() => {
    if (data) {
      const avgTireWear = data.tire_wear
        ? (data.tire_wear.front_left +
           data.tire_wear.front_right +
           data.tire_wear.rear_left +
           data.tire_wear.rear_right) / 4
        : 50;
      const tireHealth = 100 - avgTireWear;
      
      const newPoint = {
        time: Date.now(),
        speed: 145 + Math.random() * 20, // Simulated - replace with actual data
        rpm: 6000 + Math.random() * 2000,
        throttle: 75 + Math.random() * 20,
        brake: Math.random() * 30,
        tireHealth: tireHealth
      };

      historyRef.current = [...historyRef.current.slice(-59), newPoint]; // Keep last 60 points
      setTelemetryHistory(historyRef.current);
    }
  }, [data]);

  // Calculate real-time metrics from telemetry data
  const metrics = useMemo(() => {
    if (!data) return null;

    const avgTireWear = data.tire_wear
      ? (data.tire_wear.front_left +
         data.tire_wear.front_right +
         data.tire_wear.rear_left +
         data.tire_wear.rear_right) / 4
      : 50;

    const tireHealth = 100 - avgTireWear;
    const performanceScore = Math.max(0, Math.min(100, tireHealth));

    return {
      tireHealth,
      performanceScore,
      avgTireWear,
      position: data.gap_analysis?.position || 0,
      gapToLeader: data.gap_analysis?.gap_to_leader || '0.000',
      overtakingOpportunity: data.gap_analysis?.overtaking_opportunity || false,
      underPressure: data.gap_analysis?.under_pressure || false,
      predictedLapsRemaining: data.tire_wear?.predicted_laps_remaining,
      pitWindow: data.tire_wear?.pit_window_optimal,
    };
  }, [data]);

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-green-50 bg-green-600 border-green-400";
    if (score >= 60) return "text-yellow-50 bg-yellow-600 border-yellow-400";
    return "text-red-50 bg-red-600 border-red-400";
  };

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Attention Needed";
  };

  const recentInsights = useMemo(() => {
    return insightOrder
      .slice(0, 5)
      .map(id => insights[id])
      .filter(Boolean);
  }, [insightOrder, insights]);

  // Format chart data
  const chartData = useMemo(() => {
    return telemetryHistory.map((point, index) => ({
      time: new Date(point.time).toLocaleTimeString(),
      timestamp: point.time,
      speed: point.speed,
      rpm: point.rpm,
      throttle: point.throttle,
      brake: point.brake,
      tireHealth: point.tireHealth,
      index
    }));
  }, [telemetryHistory]);

  const metricConfig = {
    speed: { color: '#3B82F6', label: 'Speed', unit: 'mph', icon: Speed },
    rpm: { color: '#F59E0B', label: 'RPM', unit: 'rpm', icon: GaugeIcon },
    throttle: { color: '#10B981', label: 'Throttle', unit: '%', icon: Flame },
    brake: { color: '#EF4444', label: 'Brake', unit: '%', icon: AlertTriangle },
    tireHealth: { color: '#8B5CF6', label: 'Tire Health', unit: '%', icon: Droplet }
  };

  return (
    <DeliveryProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 space-y-6">
        {/* Enhanced Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.9, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="p-3 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 shadow-lg shadow-primary/20"
            >
              <Brain className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                Live Insights Dashboard
                {connected && (
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-2 border-green-400 px-4 py-1.5 shadow-lg shadow-green-500/50">
                      <motion.div
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Wifi className="w-4 h-4 mr-1.5" />
                      </motion.div>
                      LIVE
                    </Badge>
                  </motion.div>
                )}
              </h1>
              <p className="text-slate-400 mt-1.5 text-sm font-medium">
                Real-time telemetry insights and AI-powered analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!connected && streamError && (
              <Button
                variant="outline"
                size="sm"
                onClick={retryStream}
                disabled={reconnectAttempts >= maxReconnectAttempts}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${reconnectAttempts > 0 ? 'animate-spin' : ''}`} />
                Retry Connection
              </Button>
            )}
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </motion.div>

        {/* Enhanced Connection Status & Controls */}
        <Card className="border-2 border-slate-800/50 bg-slate-900/50 backdrop-blur-xl shadow-2xl">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground font-medium">Track</label>
                  <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sebring">Sebring</SelectItem>
                      <SelectItem value="circuit_of_the_americas">Circuit of the Americas</SelectItem>
                      <SelectItem value="road_america">Road America</SelectItem>
                      <SelectItem value="indianapolis">Indianapolis</SelectItem>
                      <SelectItem value="sonoma">Sonoma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground font-medium">Vehicle</label>
                  <Select value={selectedVehicle.toString()} onValueChange={(v) => setSelectedVehicle(Number(v))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
                        <SelectItem key={v} value={v.toString()}>#{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground font-medium">Race</label>
                  <Select value={selectedRace.toString()} onValueChange={(v) => setSelectedRace(Number(v))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Race 1</SelectItem>
                      <SelectItem value="2">Race 2</SelectItem>
                      <SelectItem value="3">Race 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RotateCw className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground font-medium">Lap</label>
                  <Select value={selectedLap.toString()} onValueChange={(v) => setSelectedLap(Number(v))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map(lap => (
                        <SelectItem key={lap} value={lap.toString()}>Lap {lap}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {streamError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-red-600/20 border-2 border-red-400/50 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400 font-medium">
                  {streamError.message}
                  {reconnectAttempts > 0 && ` (Retry ${reconnectAttempts}/${maxReconnectAttempts})`}
                </span>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Real-time Metrics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Performance Overview */}
            {metrics && (
              <Card className="border-2 border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl shadow-2xl">
                <CardHeader className="pb-4 border-b-2 border-slate-800/50">
                  <CardTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 shadow-lg shadow-primary/20">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className={`p-6 rounded-xl border-4 ${getPerformanceColor(metrics.performanceScore)} mb-6 shadow-2xl relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                    <div className="relative z-10 flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Target className="w-8 h-8" />
                        <div>
                          <div className="text-sm font-bold opacity-90">Overall Performance</div>
                          <div className="text-2xl font-black">
                            {getPerformanceLabel(metrics.performanceScore)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <motion.div
                          key={metrics.performanceScore}
                          initial={{ scale: 1.2, opacity: 0.5 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="text-5xl font-black"
                        >
                          {metrics.performanceScore.toFixed(0)}
                        </motion.div>
                        <div className="text-lg font-bold opacity-90">%</div>
                      </div>
                    </div>
                    <Progress 
                      value={metrics.performanceScore} 
                      className="h-4 bg-black/30 border-2 border-white/30 relative z-10"
                    />
                  </div>

                  {/* Enhanced Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-br from-blue-600 to-blue-700 border-4 border-blue-400 rounded-xl p-5 shadow-2xl hover:shadow-blue-500/50 transition-all relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplet className="w-5 h-5 text-blue-50" />
                        <span className="text-xs font-bold text-blue-50 uppercase tracking-wide">Tire Health</span>
                      </div>
                        <motion.div
                          key={metrics.tireHealth}
                          initial={{ scale: 1.2, opacity: 0.5 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-4xl font-black font-mono text-blue-50"
                        >
                        {metrics.tireHealth.toFixed(0)}%
                        </motion.div>
                      {metrics.predictedLapsRemaining && (
                          <div className="text-sm text-blue-50/80 mt-2 flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                          ~{metrics.predictedLapsRemaining} laps remaining
                        </div>
                      )}
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-purple-600 to-purple-700 border-4 border-purple-400 rounded-xl p-5 shadow-2xl hover:shadow-purple-500/50 transition-all relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-purple-50" />
                        <span className="text-xs font-bold text-purple-50 uppercase tracking-wide">Position</span>
                      </div>
                        <motion.div
                          key={metrics.position}
                          initial={{ scale: 1.2, opacity: 0.5 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-4xl font-black font-mono text-purple-50"
                        >
                        #{metrics.position}
                        </motion.div>
                        <div className="text-sm text-purple-50/80 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Gap: {metrics.gapToLeader}s
                      </div>
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Real-time Telemetry Charts */}
            {chartData.length > 0 && (
              <Card className="border-2 border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl shadow-2xl">
                <CardHeader className="pb-4 border-b-2 border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 shadow-lg shadow-primary/20">
                        <BarChart3 className="w-6 h-6 text-primary" />
                      </div>
                      Real-Time Telemetry
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setChartExpanded(!chartExpanded)}
                      className="text-slate-400 hover:text-white"
                    >
                      {chartExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border border-slate-700">
                      {Object.entries(metricConfig).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <TabsTrigger
                            key={key}
                            value={key}
                            className="data-[state=active]:bg-primary data-[state=active]:text-white text-slate-400"
                          >
                            <Icon className="w-4 h-4 mr-1" />
                            {config.label}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                    {Object.entries(metricConfig).map(([key, config]) => (
                      <TabsContent key={key} value={key} className="mt-4">
                        <div className={`${chartExpanded ? 'h-[500px]' : 'h-[300px]'} w-full`}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={config.color} stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                              <XAxis 
                                dataKey="time" 
                                stroke="#94a3b8"
                                fontSize={11}
                                tickLine={false}
                                interval="preserveStartEnd"
                              />
                              <YAxis 
                                stroke="#94a3b8"
                                fontSize={11}
                                tickLine={false}
                              />
                              <Tooltip
                                contentStyle={{ 
                                  backgroundColor: '#1e293b',
                                  border: '1px solid #334155',
                                  borderRadius: '8px',
                                  color: '#f1f5f9',
                                }}
                                labelStyle={{ color: '#cbd5e1' }}
                              />
                              <Area
                                type="monotone"
                                dataKey={key}
                                stroke={config.color}
                                strokeWidth={2}
                                fill={`url(#gradient-${key})`}
                                name={config.label}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Live Insights Feed */}
            <Card className="border-2 border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-4 border-b-2 border-slate-800/50">
                <CardTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 shadow-lg shadow-primary/20">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  Live Insights Feed
                  {insightOrder.length > 0 && (
                    <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">
                      {insightOrder.length} active
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {insightOrder.length === 0 ? (
                  <div className="p-12 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-block p-4 rounded-full bg-slate-800/50 mb-4"
                    >
                      <Brain className="w-12 h-12 text-slate-500" />
                    </motion.div>
                    <p className="text-slate-400 text-lg font-medium">
                      Waiting for insights...
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                      AI agents are analyzing telemetry data. Insights will appear here in real-time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                    <AnimatePresence>
                      {insightOrder.map((id, index) => {
                        const item = insights[id];
                        if (!item) return null;
                        return (
                          <motion.div
                            key={id}
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 rounded-xl border-2 border-slate-800 bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 transition-all cursor-pointer group"
                            onClick={() => setOpenId(id)}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs border-slate-700 text-slate-300 bg-slate-800/50">
                                    {item.track}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs border-slate-700 text-slate-300 bg-slate-800/50">
                                    {item.chassis}
                                  </Badge>
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(item.created_at).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-base font-medium text-white line-clamp-2 group-hover:text-primary transition-colors">
                                  {item.summary || 'New insight available'}
                                </p>
                                {item.short_explanation && (
                                  <p className="text-sm text-slate-400 mt-2 line-clamp-1">
                                    {item.short_explanation}
                                  </p>
                                )}
                              </div>
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                className="p-2 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors"
                              >
                                <Info className="w-4 h-4 text-primary" />
                              </motion.div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Real-time Alerts */}
            {metrics && (metrics.overtakingOpportunity || metrics.underPressure || metrics.pitWindow) && (
              <Card className="border-2 border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl shadow-2xl">
                <CardHeader className="pb-4 border-b-2 border-slate-800/50">
                  <CardTitle className="text-2xl font-bold flex items-center gap-3 text-white">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/40 shadow-lg shadow-primary/20">
                      <AlertTriangle className="w-6 h-6 text-primary" />
                    </div>
                    Real-time Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <AnimatePresence>
                    {metrics.overtakingOpportunity && (
                      <motion.div
                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.95 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white border-2 border-green-400 font-bold shadow-lg shadow-green-500/30 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                        <div className="relative z-10 flex items-center gap-3">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                          >
                          <CheckCircle2 className="w-5 h-5" />
                          </motion.div>
                          <span>Overtaking Opportunity Detected</span>
                        </div>
                        <Badge className="bg-green-700 text-white border border-green-400 relative z-10">
                          Active
                        </Badge>
                      </motion.div>
                    )}
                    {metrics.underPressure && (
                      <motion.div
                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.95 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-yellow-600 to-amber-600 text-white border-2 border-yellow-400 font-bold shadow-lg shadow-yellow-500/30 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                        <div className="relative z-10 flex items-center gap-3">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                          <AlertTriangle className="w-5 h-5" />
                          </motion.div>
                          <span>Under Pressure</span>
                        </div>
                        <Badge className="bg-yellow-700 text-white border border-yellow-400 relative z-10">
                          Warning
                        </Badge>
                      </motion.div>
                    )}
                    {metrics.pitWindow && metrics.pitWindow.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -10, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-2 border-blue-400 font-bold shadow-lg shadow-blue-500/30 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                        <div className="relative z-10 flex items-center gap-3">
                          <Clock className="w-5 h-5" />
                          <span>Optimal Pit Window</span>
                        </div>
                        <span className="text-lg font-black relative z-10">
                          Laps {metrics.pitWindow[0]}-{metrics.pitWindow[metrics.pitWindow.length - 1]}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enhanced Right Column - Sidebar */}
          <div className="space-y-6">
            <AgentStatusPanel />
            <TaskQueuePanel />
            
            {/* Enhanced Connection Status */}
            <Card className="border-2 border-slate-800/50 bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-xl shadow-2xl">
              <CardHeader className="pb-4 border-b-2 border-slate-800/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                  {connected ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                    <Wifi className="w-5 h-5 text-green-500" />
                    </motion.div>
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-500" />
                  )}
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Telemetry Stream</span>
                    <Badge 
                      className={connected 
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white border-green-400 shadow-lg shadow-green-500/30" 
                        : "bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-400"
                      }
                    >
                      {connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  {data && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Last Update</span>
                      <span className="text-sm font-medium text-white flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {reconnectAttempts > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Reconnect Attempts</span>
                      <span className="text-sm font-medium text-white">
                        {reconnectAttempts}/{maxReconnectAttempts}
                      </span>
                    </div>
                  )}
                  {connected && (
                    <div className="pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Activity className="w-3 h-3" />
                        <span>Streaming at ~20Hz</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Insight Modal */}
        {openId && <InsightModal id={openId} onClose={() => setOpenId(null)} />}
      </div>
    </DeliveryProvider>
  );
}
