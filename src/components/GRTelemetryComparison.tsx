/**
 * GR Telemetry Comparison Component
 * 
 * Visualizes telemetry, lap times, and sensor data differences among
 * Toyota GR Supra, GR Yaris, GR86, and GR Corolla performance models.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap, 
  AlertTriangle,
  CheckCircle2,
  Info,
  BarChart3,
  Activity
} from 'lucide-react';
import { 
  GR_TELEMETRY_DATA, 
  TRACK_CAR_PERFORMANCE,
  getGRTelemetryData,
  getOptimalCarForTrack,
  getTrackPerformance
} from '@/lib/grTelemetryData';
import { getAllGRModels } from '@/lib/grTelemetryData';

interface GRTelemetryComparisonProps {
  selectedTrack?: string;
  selectedModel?: string;
}

export function GRTelemetryComparison({ 
  selectedTrack,
  selectedModel 
}: GRTelemetryComparisonProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'sectors' | 'tires'>('overview');
  const models = getAllGRModels();

  const selectedCarData = selectedModel ? getGRTelemetryData(selectedModel) : null;
  const trackPerformance = selectedTrack ? getTrackPerformance(selectedTrack) : null;
  const optimalCar = selectedTrack ? getOptimalCarForTrack(selectedTrack) : null;

  const getPowerColor = (hp: number) => {
    if (hp >= 350) return 'text-red-500';
    if (hp >= 280) return 'text-orange-500';
    if (hp >= 250) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getStrengthColor = (strength?: string) => {
    switch (strength) {
      case 'dominant': return 'bg-green-500/20 text-green-600 border-green-500/30';
      case 'strong': return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30';
      case 'weaker': return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          GR Model Telemetry Characteristics
        </h2>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          Comprehensive telemetry, lap times, and sensor data differences among Toyota GR performance models.
          Track how these models uniquely respond to driving conditions, track demands, and driver inputs.
        </p>
      </div>

      {/* Track Selection Info */}
      {selectedTrack && trackPerformance && (
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{selectedTrack}</h3>
                <p className="text-sm text-muted-foreground">{trackPerformance.notes}</p>
              </div>
              {optimalCar && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Optimal: {optimalCar}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
          <TabsTrigger value="sectors">Sectors</TabsTrigger>
          <TabsTrigger value="tires">Tires & Brakes</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {models.map((model, index) => {
              const carData = getGRTelemetryData(model);
              if (!carData) return null;

              return (
                <motion.div
                  key={model}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`h-full transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                    selectedModel === model ? 'ring-2 ring-primary' : ''
                  }`}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{carData.model}</span>
                        <span className={`text-2xl font-bold ${getPowerColor(carData.powerHp)}`}>
                          {carData.powerHp}
                        </span>
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          carData.driveTrain === 'AWD' 
                            ? 'bg-blue-500/20 text-blue-600' 
                            : 'bg-orange-500/20 text-orange-600'
                        }`}>
                          {carData.driveTrain}
                        </span>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gray-500/20 text-gray-600">
                          {carData.weight.category}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Throttle Pattern</p>
                        <p className="text-sm font-medium capitalize">
                          {carData.telemetry.throttle.pattern}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Brake Pattern</p>
                        <p className="text-sm font-medium capitalize">
                          {carData.telemetry.brake.pattern}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Oversteer Risk</p>
                        <p className="text-sm font-medium capitalize">
                          {carData.telemetry.cornering.oversteerRisk}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-500" />
                  High-Speed Sectors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {models.map(model => {
                  const carData = getGRTelemetryData(model);
                  if (!carData) return null;
                  const strength = carData.sectorPerformance.highSpeed.strength;
                  return (
                    <div key={model} className="flex items-center justify-between">
                      <span className="text-sm">{model}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStrengthColor(strength)}`}>
                        {strength}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  Technical Sectors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {models.map(model => {
                  const carData = getGRTelemetryData(model);
                  if (!carData) return null;
                  const strength = carData.sectorPerformance.technical.strength;
                  return (
                    <div key={model} className="flex items-center justify-between">
                      <span className="text-sm">{model}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStrengthColor(strength)}`}>
                        {strength}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-500" />
                  Flowing Sectors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {models.map(model => {
                  const carData = getGRTelemetryData(model);
                  if (!carData) return null;
                  const strength = carData.sectorPerformance.flowing.strength;
                  return (
                    <div key={model} className="flex items-center justify-between">
                      <span className="text-sm">{model}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStrengthColor(strength)}`}>
                        {strength}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Telemetry Tab */}
        <TabsContent value="telemetry" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {models.map((model, index) => {
              const carData = getGRTelemetryData(model);
              if (!carData) return null;

              return (
                <motion.div
                  key={model}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-xl flex items-center justify-between">
                        <span>{carData.model}</span>
                        <span className={`text-2xl font-bold ${getPowerColor(carData.powerHp)}`}>
                          {carData.powerHp} HP
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Acceleration */}
                      <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          Longitudinal Gs (Acceleration/Braking)
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {carData.telemetry.acceleration.longitudinalGs.description}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          <p>Typical: {carData.telemetry.acceleration.longitudinalGs.typical}</p>
                          <p>Top Speed: {carData.telemetry.acceleration.topSpeed.description}</p>
                        </div>
                      </div>

                      {/* Cornering */}
                      <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-500" />
                          Lateral Gs (Cornering)
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {carData.telemetry.cornering.lateralGs.description}
                        </p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Consistency: {carData.telemetry.cornering.lateralGs.consistency}</p>
                          <p>Traction out of slow corners: {carData.telemetry.cornering.traction.outOfSlowCorners}</p>
                          <p>Wheelspin: {carData.telemetry.cornering.traction.wheelspin}</p>
                        </div>
                      </div>

                      {/* Throttle & Brake */}
                      <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          Throttle & Brake Sequencing
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {carData.telemetry.sequencing.throttleApplication}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {carData.telemetry.sequencing.brakePressures}
                        </p>
                      </div>

                      {/* Driver Inputs */}
                      <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Target className="w-4 h-4 text-purple-500" />
                          Driver Inputs
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {carData.driverInputs.precision}
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                          {carData.driverInputs.techniques.map((tech, idx) => (
                            <li key={idx}>{tech}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Sectors Tab */}
        <TabsContent value="sectors" className="space-y-6">
          {selectedTrack && trackPerformance ? (
            <Card>
              <CardHeader>
                <CardTitle>Sector Performance: {selectedTrack}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(trackPerformance.sectors).map(([sectorType, optimalCar]) => (
                    <div key={sectorType} className="p-4 rounded-lg bg-card border border-border">
                      <h4 className="font-semibold mb-2 capitalize">{sectorType}</h4>
                      <p className="text-sm text-muted-foreground">{optimalCar}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Select a track to view sector-specific performance data
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {models.map((model, index) => {
              const carData = getGRTelemetryData(model);
              if (!carData) return null;

              return (
                <motion.div
                  key={model}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>{carData.model} - Sector Characteristics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* High Speed */}
                      <div className={`p-4 rounded-lg border ${getStrengthColor(carData.sectorPerformance.highSpeed.strength)}`}>
                        <h4 className="font-semibold mb-2">High-Speed Sectors</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {carData.sectorPerformance.highSpeed.description}
                        </p>
                        {carData.sectorPerformance.highSpeed.tracks.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <p className="font-medium mb-1">Optimal Tracks:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {carData.sectorPerformance.highSpeed.tracks.map((track, idx) => (
                                <li key={idx}>{track}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Technical */}
                      <div className={`p-4 rounded-lg border ${getStrengthColor(carData.sectorPerformance.technical.strength)}`}>
                        <h4 className="font-semibold mb-2">Technical Sectors</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {carData.sectorPerformance.technical.description}
                        </p>
                        {carData.sectorPerformance.technical.tracks.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <p className="font-medium mb-1">Optimal Tracks:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {carData.sectorPerformance.technical.tracks.map((track, idx) => (
                                <li key={idx}>{track}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Flowing */}
                      <div className={`p-4 rounded-lg border ${getStrengthColor(carData.sectorPerformance.flowing.strength)}`}>
                        <h4 className="font-semibold mb-2">Flowing Sectors</h4>
                        <p className="text-sm text-muted-foreground">
                          {carData.sectorPerformance.flowing.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Tires & Brakes Tab */}
        <TabsContent value="tires" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {models.map((model, index) => {
              const carData = getGRTelemetryData(model);
              if (!carData) return null;

              return (
                <motion.div
                  key={model}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>{carData.model} - Tire & Brake Characteristics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Tire Wear */}
                      <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-orange-500" />
                          Tire Wear Patterns
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {carData.tireWear.pattern}
                        </p>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="font-medium mb-1">Long, High-Speed Tracks:</p>
                            <p className="text-muted-foreground text-xs">
                              {carData.tireWear.trackTypes.longHighSpeed}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Tight, Twisty Courses:</p>
                            <p className="text-muted-foreground text-xs">
                              {carData.tireWear.trackTypes.tightTwisty}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Temperature Management:</p>
                            <p className="text-muted-foreground text-xs">
                              {carData.tireWear.temperatureManagement}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Brake Balance */}
                      <div className="p-4 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          Brake Balance Patterns
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {carData.brakeBalance.pattern}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Stress Points: </span>
                          {carData.brakeBalance.stressPoints}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
