// src/pages/COTADashboard.tsx
// Circuit of the Americas Dashboard with Mock Data and Track Visualization

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
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
  CheckCircle2
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LiveMapSVG from '@/components/LiveMapSVG';
import { generateTimeSeriesData, generateTirePredictions, generateAgentDecisions, type DemoTelemetryPoint } from '@/lib/mockDemoData';

interface TelemetryData {
  timestamp: number;
  lap: number;
  lapdist: number;
  speed: number;
  gear: number;
  rpm: number;
  throttle: number;
  brake: number;
  tireWearFL: number;
  tireWearFR: number;
  tireWearRL: number;
  tireWearRR: number;
  position: number;
  gapToLeader: number;
}

const COTA_TRACK_LENGTH = 5513; // meters

export default function COTADashboard() {
  const [currentLap, setCurrentLap] = useState(12);
  const [lapDistance, setLapDistance] = useState(0);
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Generate mock data
  const mockTelemetry = useMemo(() => {
    const timeSeries = generateTimeSeriesData('cota', 7, 500);
    const tirePredictions = generateTirePredictions('cota', 7);
    const agentDecisions = generateAgentDecisions('cota', 7);

    return {
      timeSeries,
      tirePredictions,
      agentDecisions,
    };
  }, []);

  // Simulate real-time telemetry updates
  useEffect(() => {
    if (!isPlaying || !mockTelemetry.timeSeries.length) return;

    let currentIndex = 0;
    let accumulatedDistance = 0;
    let lastLap = currentLap;

    const interval = setInterval(() => {
      if (currentIndex >= mockTelemetry.timeSeries.length) {
        currentIndex = 0;
      }

      const dataPoint = mockTelemetry.timeSeries[currentIndex];
      
      // Calculate lap distance from speed and time
      const speedMps = (dataPoint.speed * 1000) / 3600; // Convert km/h to m/s
      const timeDelta = 0.5; // 0.5s per data point
      const distanceDelta = speedMps * timeDelta * playbackSpeed;

      accumulatedDistance += distanceDelta;
      let currentLapDistance = accumulatedDistance % COTA_TRACK_LENGTH;
      const newLap = Math.floor(accumulatedDistance / COTA_TRACK_LENGTH) + lastLap;
      
      if (newLap > lastLap) {
        setCurrentLap(newLap);
        lastLap = newLap;
      }
      
      setLapDistance(currentLapDistance);

      setTelemetry({
        timestamp: Date.now(),
        lap: dataPoint.lap || newLap,
        lapdist: currentLapDistance,
        speed: dataPoint.speed,
        gear: Math.max(3, Math.min(6, Math.floor(dataPoint.speed / 35) + 3)),
        rpm: 3000 + Math.floor((dataPoint.speed / 180) * 4000),
        throttle: Math.max(0, Math.min(100, 70 + (dataPoint.speed - 120) / 2 + (Math.random() - 0.5) * 20)),
        brake: dataPoint.speed < 80 ? 20 + Math.random() * 30 : Math.max(0, (120 - dataPoint.speed) / 3 + (Math.random() - 0.5) * 10),
        tireWearFL: dataPoint.tire_wear_front_left,
        tireWearFR: dataPoint.tire_wear_front_right,
        tireWearRL: dataPoint.tire_wear_rear_left,
        tireWearRR: dataPoint.tire_wear_rear_right,
        position: dataPoint.position,
        gapToLeader: dataPoint.gap_to_leader,
      });

      currentIndex++;
    }, 500 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, mockTelemetry, currentLap]);

  const currentTirePrediction = useMemo(() => {
    return mockTelemetry.tirePredictions.find(p => p.lap === currentLap) 
      || mockTelemetry.tirePredictions[mockTelemetry.tirePredictions.length - 1];
  }, [currentLap, mockTelemetry]);

  const recentDecisions = useMemo(() => {
    return mockTelemetry.agentDecisions
      .filter(d => d.vehicle_number === 7)
      .slice(0, 5);
  }, [mockTelemetry]);

  // Initialize telemetry with first data point
  useEffect(() => {
    if (mockTelemetry.timeSeries.length > 0 && !telemetry) {
      const firstPoint = mockTelemetry.timeSeries[0];
      setTelemetry({
        timestamp: Date.now(),
        lap: firstPoint.lap,
        lapdist: 0,
        speed: firstPoint.speed,
        gear: Math.max(3, Math.min(6, Math.floor(firstPoint.speed / 35) + 3)),
        rpm: 3000 + Math.floor((firstPoint.speed / 180) * 4000),
        throttle: 70 + (firstPoint.speed - 120) / 2,
        brake: 0,
        tireWearFL: firstPoint.tire_wear_front_left,
        tireWearFR: firstPoint.tire_wear_front_right,
        tireWearRL: firstPoint.tire_wear_rear_left,
        tireWearRR: firstPoint.tire_wear_rear_right,
        position: firstPoint.position,
        gapToLeader: firstPoint.gap_to_leader,
      });
    }
  }, [mockTelemetry, telemetry]);

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
              Circuit of the Americas
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Austin, Texas
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Activity className="w-4 h-4 mr-2" />
              Lap {currentLap}
            </Badge>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Track Visualization */}
          <div className="lg:col-span-2 space-y-6">
            {/* Track Map */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Track Map
                </CardTitle>
                <CardDescription>
                  Real-time vehicle position on Circuit of the Americas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LiveMapSVG
                  track="cota"
                  lapdist={lapDistance}
                  totalMeters={COTA_TRACK_LENGTH}
                  className="w-full h-[500px]"
                />
                {telemetry && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Speed</p>
                      <p className="text-2xl font-bold">{telemetry.speed.toFixed(0)}</p>
                      <p className="text-xs text-muted-foreground">km/h</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Position</p>
                      <p className="text-2xl font-bold">P{telemetry.position}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gap to Leader</p>
                      <p className="text-2xl font-bold">+{telemetry.gapToLeader.toFixed(2)}s</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lap Distance</p>
                      <p className="text-2xl font-bold">{(lapDistance / 1000).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">km</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Telemetry Metrics */}
            {telemetry && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="w-5 h-5" />
                      Vehicle Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Gear</p>
                        <p className="text-3xl font-bold">{telemetry.gear}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">RPM</p>
                        <p className="text-3xl font-bold">{telemetry.rpm.toLocaleString()}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Throttle</p>
                        <p className="text-3xl font-bold">{telemetry.throttle.toFixed(0)}%</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Brake</p>
                        <p className="text-3xl font-bold">{telemetry.brake.toFixed(0)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Race Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-2">Current Position</p>
                      <p className="text-5xl font-bold text-primary">P{telemetry.position}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Gap to Leader</p>
                        <p className="text-2xl font-bold">+{telemetry.gapToLeader.toFixed(2)}s</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Lap Number</p>
                        <p className="text-2xl font-bold">{telemetry.lap}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Column - Analytics */}
          <div className="space-y-6">
            {/* Tire Wear */}
            {currentTirePrediction && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    Tire Wear
                  </CardTitle>
                  <CardDescription>
                    Current tire condition and predictions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                      <p className="text-xs text-muted-foreground mb-2">Front Left</p>
                      <p className="text-3xl font-bold text-red-500">
                        {currentTirePrediction.front_left.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                      <p className="text-xs text-muted-foreground mb-2">Front Right</p>
                      <p className="text-3xl font-bold text-red-500">
                        {currentTirePrediction.front_right.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                      <p className="text-xs text-muted-foreground mb-2">Rear Left</p>
                      <p className="text-3xl font-bold text-orange-500">
                        {currentTirePrediction.rear_left.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                      <p className="text-xs text-muted-foreground mb-2">Rear Right</p>
                      <p className="text-3xl font-bold text-orange-500">
                        {currentTirePrediction.rear_right.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Recommended Pit Lap</p>
                    <p className="text-2xl font-bold text-primary">
                      Lap {currentTirePrediction.recommended_pit_lap}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Laps until 0.5s loss: {currentTirePrediction.laps_until_0_5s_loss}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Agent Decisions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  AI Recommendations
                </CardTitle>
                <CardDescription>
                  Real-time agent decisions and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recentDecisions.map((decision, idx) => (
                    <motion.div
                      key={decision.decision_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {decision.agent_type}
                        </Badge>
                        <Badge 
                          variant={decision.confidence > 0.8 ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {(decision.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold mb-2">{decision.action}</p>
                      {decision.reasoning && decision.reasoning.length > 0 && (
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {decision.reasoning.slice(0, 2).map((reason, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="mt-1">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Predicted Loss</p>
                    <p className="text-2xl font-bold">
                      {currentTirePrediction?.predicted_loss_per_lap_s.toFixed(3)}s
                    </p>
                    <p className="text-xs text-muted-foreground">per lap</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                    <p className="text-2xl font-bold">
                      {((currentTirePrediction?.confidence || 0) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">Model Version</p>
                  <p className="text-sm font-semibold">v2.1-demo</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

