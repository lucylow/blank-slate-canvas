// src/pages/LiveInsightsDashboard.tsx
import React, { useState, useMemo } from 'react';
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
  Info
} from 'lucide-react';

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
import { useAgentStore } from '../stores/agentStore';
import type { DashboardData } from '@/lib/types';

export default function LiveInsightsDashboard() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState('sebring');
  const [selectedRace, setSelectedRace] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(7);
  const [selectedLap, setSelectedLap] = useState(12);

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

  return (
    <DeliveryProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="p-3 rounded-xl bg-primary/20 border-2 border-primary/30"
            >
              <Brain className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                Live Insights Dashboard
                {connected && (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Badge className="bg-green-600 text-green-50 border-2 border-green-400 px-3 py-1">
                      <Wifi className="w-3 h-3 mr-1.5" />
                      LIVE
                    </Badge>
                  </motion.div>
                )}
              </h1>
              <p className="text-muted-foreground mt-1">
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
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Connection Status & Controls */}
        <Card className="border-2 border-foreground/20 bg-background/95 backdrop-blur-sm">
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
            {/* Performance Overview */}
            {metrics && (
              <Card className="border-2 border-foreground/20 bg-background/95 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-4 border-b-2 border-foreground/10">
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20 border-2 border-primary/30">
                      <Target className="w-6 h-6 text-primary" />
                    </div>
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className={`p-6 rounded-xl border-4 ${getPerformanceColor(metrics.performanceScore)} mb-6 shadow-lg`}>
                    <div className="flex items-center justify-between mb-4">
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
                        <div className="text-5xl font-black">
                          {metrics.performanceScore.toFixed(0)}
                        </div>
                        <div className="text-lg font-bold opacity-90">%</div>
                      </div>
                    </div>
                    <Progress 
                      value={metrics.performanceScore} 
                      className="h-4 bg-black/20 border-2 border-white/30"
                    />
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-blue-600 border-4 border-blue-400 rounded-xl p-5 shadow-xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Droplet className="w-5 h-5 text-blue-50" />
                        <span className="text-xs font-bold text-blue-50 uppercase tracking-wide">Tire Health</span>
                      </div>
                      <div className="text-4xl font-black font-mono text-blue-50">
                        {metrics.tireHealth.toFixed(0)}%
                      </div>
                      {metrics.predictedLapsRemaining && (
                        <div className="text-sm text-blue-50/80 mt-2">
                          ~{metrics.predictedLapsRemaining} laps remaining
                        </div>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-purple-600 border-4 border-purple-400 rounded-xl p-5 shadow-xl"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-purple-50" />
                        <span className="text-xs font-bold text-purple-50 uppercase tracking-wide">Position</span>
                      </div>
                      <div className="text-4xl font-black font-mono text-purple-50">
                        #{metrics.position}
                      </div>
                      <div className="text-sm text-purple-50/80 mt-2">
                        Gap: {metrics.gapToLeader}s
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Insights Feed */}
            <Card className="border-2 border-foreground/20 bg-background/95 backdrop-blur-sm shadow-xl">
              <CardHeader className="pb-4 border-b-2 border-foreground/10">
                <CardTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 border-2 border-primary/30">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  Live Insights Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {insightOrder.length === 0 ? (
                  <div className="p-12 text-center">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-block p-4 rounded-full bg-muted/50 mb-4"
                    >
                      <Brain className="w-12 h-12 text-muted-foreground" />
                    </motion.div>
                    <p className="text-muted-foreground text-lg font-medium">
                      Waiting for insights...
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      AI agents are analyzing telemetry data. Insights will appear here in real-time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    <AnimatePresence>
                      {insightOrder.map((id, index) => {
                        const item = insights[id];
                        if (!item) return null;
                        return (
                          <motion.div
                            key={id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 rounded-xl border-2 border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer"
                            onClick={() => setOpenId(id)}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {item.track}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {item.chassis}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(item.created_at).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-base font-medium text-foreground line-clamp-2">
                                  {item.summary || 'New insight available'}
                                </p>
                                {item.short_explanation && (
                                  <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                                    {item.short_explanation}
                                  </p>
                                )}
                              </div>
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="p-2 rounded-lg bg-primary/10 border border-primary/20"
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

            {/* Real-time Alerts */}
            {metrics && (metrics.overtakingOpportunity || metrics.underPressure || metrics.pitWindow) && (
              <Card className="border-2 border-foreground/20 bg-background/95 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-4 border-b-2 border-foreground/10">
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20 border-2 border-primary/30">
                      <AlertTriangle className="w-6 h-6 text-primary" />
                    </div>
                    Real-time Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <AnimatePresence>
                    {metrics.overtakingOpportunity && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-green-700 text-green-50 border-2 border-green-400 font-bold"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Overtaking Opportunity Detected</span>
                        </div>
                        <Badge className="bg-green-600 text-green-50 border border-green-400">
                          Active
                        </Badge>
                      </motion.div>
                    )}
                    {metrics.underPressure && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-yellow-700 text-yellow-50 border-2 border-yellow-400 font-bold"
                      >
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-5 h-5" />
                          <span>Under Pressure</span>
                        </div>
                        <Badge className="bg-yellow-600 text-yellow-50 border border-yellow-400">
                          Warning
                        </Badge>
                      </motion.div>
                    )}
                    {metrics.pitWindow && metrics.pitWindow.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-blue-700 text-blue-50 border-2 border-blue-400 font-bold"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5" />
                          <span>Optimal Pit Window</span>
                        </div>
                        <span className="text-lg font-black">
                          Laps {metrics.pitWindow[0]}-{metrics.pitWindow[metrics.pitWindow.length - 1]}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <AgentStatusPanel />
            <TaskQueuePanel />
            
            {/* Connection Status */}
            <Card className="border-2 border-foreground/20 bg-background/95 backdrop-blur-sm">
              <CardHeader className="pb-4 border-b-2 border-foreground/10">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  {connected ? (
                    <Wifi className="w-5 h-5 text-green-500" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-red-500" />
                  )}
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Telemetry Stream</span>
                    <Badge 
                      className={connected 
                        ? "bg-green-600 text-green-50 border-green-400" 
                        : "bg-red-600 text-red-50 border-red-400"
                      }
                    >
                      {connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  {data && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Update</span>
                      <span className="text-sm font-medium">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  {reconnectAttempts > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Reconnect Attempts</span>
                      <span className="text-sm font-medium">
                        {reconnectAttempts}/{maxReconnectAttempts}
                      </span>
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
