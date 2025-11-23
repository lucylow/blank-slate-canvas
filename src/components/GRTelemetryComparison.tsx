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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {models.map((model, index) => {
              const carData = getGRTelemetryData(model);
              if (!carData) return null;

              const throttleIntensity = carData.telemetry.throttle.pattern === 'aggressive' ? 90 : 
                                      carData.telemetry.throttle.pattern === 'moderate' ? 60 : 40;
              const brakeIntensity = carData.telemetry.brake.pattern === 'abrupt' ? 90 : 
                                    carData.telemetry.brake.pattern === 'moderate' ? 60 : 40;
              const oversteerRisk = carData.telemetry.cornering.oversteerRisk === 'high' ? 80 : 
                                    carData.telemetry.cornering.oversteerRisk === 'moderate' ? 50 : 20;

              return (
                <motion.div
                  key={model}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className={`h-full transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 border-border/50 hover:border-primary/50 bg-gradient-to-br from-card via-card to-card/95 overflow-hidden ${
                    selectedModel === model ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
                  }`}>
                    <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 border-b border-border/50">
                      <CardTitle className="text-lg flex items-center justify-between mb-3">
                        <span className="font-bold">{carData.model}</span>
                        <span className={`text-2xl font-bold ${getPowerColor(carData.powerHp)}`}>
                          {carData.powerHp}
                        </span>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          carData.driveTrain === 'AWD' 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        }`}>
                          {carData.driveTrain}
                        </span>
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-muted/50 text-muted-foreground border border-border/50 capitalize">
                          {carData.weight.category}
                        </span>
                      </div>
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground font-medium">Throttle Pattern</p>
                          <span className="text-xs font-semibold text-foreground capitalize">
                            {carData.telemetry.throttle.pattern}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-yellow-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${throttleIntensity}%` }}
                            transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground font-medium">Brake Pattern</p>
                          <span className="text-xs font-semibold text-foreground capitalize">
                            {carData.telemetry.brake.pattern}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-red-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${brakeIntensity}%` }}
                            transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground font-medium">Oversteer Risk</p>
                          <span className={`text-xs font-semibold capitalize ${
                            carData.telemetry.cornering.oversteerRisk === 'high' ? 'text-red-500' :
                            carData.telemetry.cornering.oversteerRisk === 'moderate' ? 'text-yellow-500' :
                            'text-green-500'
                          }`}>
                            {carData.telemetry.cornering.oversteerRisk}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              carData.telemetry.cornering.oversteerRisk === 'high' ? 'bg-red-500' :
                              carData.telemetry.cornering.oversteerRisk === 'moderate' ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${oversteerRisk}%` }}
                            transition={{ delay: index * 0.1 + 0.4, duration: 0.8 }}
                          />
                        </div>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {models.map((model, index) => {
              const carData = getGRTelemetryData(model);
              if (!carData) return null;

              // Calculate strength percentages for visual bars
              const getStrengthPercentage = (strength: string) => {
                switch (strength) {
                  case 'dominant': return 100;
                  case 'strong': return 75;
                  case 'moderate': return 50;
                  case 'weaker': return 25;
                  default: return 0;
                }
              };

              const throttleIntensity = carData.telemetry.throttle.pattern === 'aggressive' ? 90 : 
                                      carData.telemetry.throttle.pattern === 'moderate' ? 60 : 40;
              const brakeIntensity = carData.telemetry.brake.pattern === 'abrupt' ? 90 : 
                                    carData.telemetry.brake.pattern === 'moderate' ? 60 : 40;
              const oversteerRisk = carData.telemetry.cornering.oversteerRisk === 'high' ? 80 : 
                                    carData.telemetry.cornering.oversteerRisk === 'moderate' ? 50 : 20;

              return (
                <motion.div
                  key={model}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="h-full group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 border-border/50 hover:border-primary/50 bg-gradient-to-br from-card via-card to-card/95 overflow-hidden">
                    {/* Header with gradient background */}
                    <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 border-b border-border/50">
                      <div className="flex items-center justify-between mb-3">
                        <CardTitle className="text-xl font-bold">{carData.model}</CardTitle>
                        <div className={`px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border ${getPowerColor(carData.powerHp)} border-current/20`}>
                          <span className={`text-2xl font-bold ${getPowerColor(carData.powerHp)}`}>
                            {carData.powerHp}
                          </span>
                          <span className="text-xs ml-1 opacity-70">HP</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                          carData.driveTrain === 'AWD' 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                            : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        }`}>
                          {carData.driveTrain}
                        </span>
                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-muted/50 text-muted-foreground border border-border/50 capitalize">
                          {carData.weight.category}
                        </span>
                      </div>
                    </div>

                    <CardContent className="p-6 space-y-5">
                      {/* Power & Performance Metrics */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            Performance Metrics
                          </h4>
                        </div>
                        
                        {/* Power Level */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-muted-foreground">Power Output</span>
                            <span className="text-xs font-semibold text-foreground">{carData.powerHp} HP</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${getPowerColor(carData.powerHp)}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${(carData.powerHp / 400) * 100}%` }}
                              transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Acceleration Metrics */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 hover:border-red-500/40 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-red-500" />
                          <h4 className="text-sm font-semibold">Acceleration</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                          {carData.telemetry.acceleration.longitudinalGs.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Longitudinal Gs</span>
                            <span className="text-xs font-mono font-semibold text-red-500">
                              {carData.telemetry.acceleration.longitudinalGs.typical}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Top Speed</span>
                            <span className="text-xs font-semibold text-foreground capitalize">
                              {carData.telemetry.acceleration.topSpeed.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cornering Metrics */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="w-4 h-4 text-blue-500" />
                          <h4 className="text-sm font-semibold">Cornering</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                          {carData.telemetry.cornering.lateralGs.description}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Lateral Gs</span>
                            <span className="text-xs font-mono font-semibold text-blue-500">
                              {carData.telemetry.cornering.lateralGs.typical}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Consistency</span>
                            <span className="text-xs font-semibold text-foreground capitalize">
                              {carData.telemetry.cornering.lateralGs.consistency}
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-blue-500/20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Oversteer Risk</span>
                              <span className={`text-xs font-semibold capitalize ${
                                carData.telemetry.cornering.oversteerRisk === 'high' ? 'text-red-500' :
                                carData.telemetry.cornering.oversteerRisk === 'moderate' ? 'text-yellow-500' :
                                'text-green-500'
                              }`}>
                                {carData.telemetry.cornering.oversteerRisk}
                              </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${
                                  carData.telemetry.cornering.oversteerRisk === 'high' ? 'bg-red-500' :
                                  carData.telemetry.cornering.oversteerRisk === 'moderate' ? 'bg-yellow-500' :
                                  'bg-green-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${oversteerRisk}%` }}
                                transition={{ delay: index * 0.1 + 0.4, duration: 0.8 }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Throttle & Brake */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <h4 className="text-sm font-semibold">Throttle & Brake</h4>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-muted-foreground">Throttle Pattern</span>
                              <span className="text-xs font-semibold text-foreground capitalize">
                                {carData.telemetry.throttle.pattern}
                              </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-yellow-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${throttleIntensity}%` }}
                                transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs text-muted-foreground">Brake Pattern</span>
                              <span className="text-xs font-semibold text-foreground capitalize">
                                {carData.telemetry.brake.pattern}
                              </span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-red-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${brakeIntensity}%` }}
                                transition={{ delay: index * 0.1 + 0.6, duration: 0.8 }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Sector Performance Summary */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/20">
                        <div className="flex items-center gap-2 mb-3">
                          <BarChart3 className="w-4 h-4 text-primary" />
                          <h4 className="text-sm font-semibold">Sector Performance</h4>
                        </div>
                        <div className="space-y-2.5">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">High-Speed</span>
                              <span className={`text-xs font-semibold capitalize ${
                                carData.sectorPerformance.highSpeed.strength === 'dominant' ? 'text-green-500' :
                                carData.sectorPerformance.highSpeed.strength === 'strong' ? 'text-blue-500' :
                                carData.sectorPerformance.highSpeed.strength === 'moderate' ? 'text-yellow-500' :
                                'text-gray-500'
                              }`}>
                                {carData.sectorPerformance.highSpeed.strength}
                              </span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${
                                  carData.sectorPerformance.highSpeed.strength === 'dominant' ? 'bg-green-500' :
                                  carData.sectorPerformance.highSpeed.strength === 'strong' ? 'bg-blue-500' :
                                  carData.sectorPerformance.highSpeed.strength === 'moderate' ? 'bg-yellow-500' :
                                  'bg-gray-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${getStrengthPercentage(carData.sectorPerformance.highSpeed.strength)}%` }}
                                transition={{ delay: index * 0.1 + 0.7, duration: 0.8 }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Technical</span>
                              <span className={`text-xs font-semibold capitalize ${
                                carData.sectorPerformance.technical.strength === 'dominant' ? 'text-green-500' :
                                carData.sectorPerformance.technical.strength === 'strong' ? 'text-blue-500' :
                                carData.sectorPerformance.technical.strength === 'moderate' ? 'text-yellow-500' :
                                'text-gray-500'
                              }`}>
                                {carData.sectorPerformance.technical.strength}
                              </span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${
                                  carData.sectorPerformance.technical.strength === 'dominant' ? 'bg-green-500' :
                                  carData.sectorPerformance.technical.strength === 'strong' ? 'bg-blue-500' :
                                  carData.sectorPerformance.technical.strength === 'moderate' ? 'bg-yellow-500' :
                                  'bg-gray-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${getStrengthPercentage(carData.sectorPerformance.technical.strength)}%` }}
                                transition={{ delay: index * 0.1 + 0.8, duration: 0.8 }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Flowing</span>
                              <span className={`text-xs font-semibold capitalize ${
                                carData.sectorPerformance.flowing.strength === 'dominant' ? 'text-green-500' :
                                carData.sectorPerformance.flowing.strength === 'strong' ? 'text-blue-500' :
                                carData.sectorPerformance.flowing.strength === 'moderate' ? 'text-yellow-500' :
                                'text-gray-500'
                              }`}>
                                {carData.sectorPerformance.flowing.strength}
                              </span>
                            </div>
                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${
                                  carData.sectorPerformance.flowing.strength === 'dominant' ? 'bg-green-500' :
                                  carData.sectorPerformance.flowing.strength === 'strong' ? 'bg-blue-500' :
                                  carData.sectorPerformance.flowing.strength === 'moderate' ? 'bg-yellow-500' :
                                  'bg-gray-500'
                                }`}
                                initial={{ width: 0 }}
                                animate={{ width: `${getStrengthPercentage(carData.sectorPerformance.flowing.strength)}%` }}
                                transition={{ delay: index * 0.1 + 0.9, duration: 0.8 }}
                              />
                            </div>
                          </div>
                        </div>
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
