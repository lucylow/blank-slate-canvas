import React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Target,
  Zap,
  Activity,
  BarChart3,
  Clock,
  Users,
  Gauge,
  MapPin,
  Thermometer,
  Wind,
  Droplets,
  Award,
  AlertTriangle,
  Sparkles,
  FileText,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface TrackDetailAnalyticsProps {
  track: {
    name: string;
    location: string;
    length: string;
    turns: number;
    id: string;
    description: string;
  };
  onClose?: () => void;
}

// Mock data generator for track analytics
const generateTrackAnalytics = (trackId: string) => {
  const baseData = {
    telemetryStats: {
      totalDataPoints: Math.floor(Math.random() * 3000000) + 2000000,
      averageSamplingRate: "18.5 Hz",
      vehiclesTracked: Math.floor(Math.random() * 10) + 25,
      raceDuration: `${Math.floor(Math.random() * 10) + 40}.${Math.floor(Math.random() * 60)} min`,
    },
    performanceMetrics: {
      fastestLap: {
        time: "1:35.428",
        driver: "#13",
        speed: "139.8 kph",
        lap: 15,
      },
      averageLap: {
        time: "1:37.245",
        speed: "138.2 kph",
      },
      sectorAnalysis: [
        { sector: "Sector 1", bestTime: "26.961", avgTime: "27.185", difficulty: "High" },
        { sector: "Sector 2", bestTime: "43.160", avgTime: "43.294", difficulty: "Medium" },
        { sector: "Sector 3", bestTime: "29.163", avgTime: "29.604", difficulty: "High" },
      ],
    },
    tireWearAnalysis: {
      averageWearRate: "12.5% per lap",
      criticalSectors: ["Sector 1", "Sector 3"],
      optimalPitWindow: "Laps 12-16",
      tireLife: "18-22 laps",
    },
    weatherImpact: {
      airTemp: "24.5°C",
      trackTemp: "32.8°C",
      humidity: "65%",
      windSpeed: "8.2 km/h",
      conditions: "Dry",
    },
    driverPerformance: {
      consistencyLeader: { number: "#13", score: "99.76%", variance: "0.234s" },
      fastestDriver: { number: "#13", avgLap: "1:35.428" },
      mostImprovement: { number: "#22", improvement: "+2.3s" },
    },
    strategicInsights: [
      {
        title: "Optimal Qualifying Strategy",
        description: "Push for fast lap in Sector 1 and Sector 3, maintain consistency in Sector 2",
        impact: "High",
        icon: <Target className="w-5 h-5" />,
      },
      {
        title: "Tire Management Critical",
        description: "High wear in Sectors 1 and 3 requires careful tire preservation",
        impact: "Critical",
        icon: <AlertTriangle className="w-5 h-5" />,
      },
      {
        title: "Overtaking Opportunities",
        description: "Best passing zones: Turn 5, Turn 12, and Turn 17",
        impact: "Medium",
        icon: <Zap className="w-5 h-5" />,
      },
    ],
    aiPredictions: {
      raceWinnerProbability: [
        { driver: "#13", probability: "42%" },
        { driver: "#22", probability: "28%" },
        { driver: "#72", probability: "18%" },
      ],
      pitStopStrategy: "Single stop recommended between laps 12-16",
      weatherImpact: "Low - stable conditions expected",
    },
    telemetryInsights: {
      topSpeed: "245.8 km/h",
      averageSpeed: "138.2 km/h",
      maxGForce: "2.8g",
      brakingPoints: 8,
      accelerationZones: 6,
    },
  };

  // Track-specific adjustments
  const trackSpecifics: Record<string, Partial<typeof baseData>> = {
    cota: {
      performanceMetrics: {
        fastestLap: { time: "2:03.124", driver: "#0", speed: "145.2 kph", lap: 14 },
        averageLap: { time: "2:04.567", speed: "143.8 kph" },
        sectorAnalysis: [
          { sector: "Sector 1", bestTime: "38.245", avgTime: "38.892", difficulty: "Very High" },
          { sector: "Sector 2", bestTime: "45.678", avgTime: "46.234", difficulty: "Medium" },
          { sector: "Sector 3", bestTime: "39.201", avgTime: "39.441", difficulty: "High" },
        ],
      },
      telemetryInsights: {
        topSpeed: "265.4 km/h",
        averageSpeed: "143.8 km/h",
        maxGForce: "3.2g",
        brakingPoints: 12,
        accelerationZones: 8,
      },
    },
    "road-america": {
      performanceMetrics: {
        fastestLap: { time: "2:40.838", driver: "#2", speed: "145.8 kph", lap: 14 },
        averageLap: { time: "2:43.567", speed: "143.2 kph" },
        sectorAnalysis: [
          { sector: "Sector 1", bestTime: "52.123", avgTime: "52.789", difficulty: "Medium" },
          { sector: "Sector 2", bestTime: "68.456", avgTime: "69.234", difficulty: "Low" },
          { sector: "Sector 3", bestTime: "40.259", avgTime: "40.544", difficulty: "High" },
        ],
      },
      telemetryInsights: {
        topSpeed: "285.6 km/h",
        averageSpeed: "143.2 km/h",
        maxGForce: "2.5g",
        brakingPoints: 6,
        accelerationZones: 9,
      },
    },
    sebring: {
      performanceMetrics: {
        fastestLap: { time: "2:15.678", driver: "#7", speed: "142.3 kph", lap: 13 },
        averageLap: { time: "2:17.234", speed: "140.8 kph" },
        sectorAnalysis: [
          { sector: "Sector 1", bestTime: "42.567", avgTime: "43.123", difficulty: "High" },
          { sector: "Sector 2", bestTime: "48.901", avgTime: "49.456", difficulty: "Very High" },
          { sector: "Sector 3", bestTime: "44.210", avgTime: "44.655", difficulty: "High" },
        ],
      },
      telemetryInsights: {
        topSpeed: "248.9 km/h",
        averageSpeed: "140.8 km/h",
        maxGForce: "2.9g",
        brakingPoints: 10,
        accelerationZones: 7,
      },
    },
    sonoma: {
      performanceMetrics: {
        fastestLap: { time: "1:48.234", driver: "#21", speed: "137.5 kph", lap: 12 },
        averageLap: { time: "1:49.567", speed: "136.2 kph" },
        sectorAnalysis: [
          { sector: "Sector 1", bestTime: "35.123", avgTime: "35.678", difficulty: "Very High" },
          { sector: "Sector 2", bestTime: "38.456", avgTime: "39.012", difficulty: "High" },
          { sector: "Sector 3", bestTime: "34.655", avgTime: "34.877", difficulty: "High" },
        ],
      },
      telemetryInsights: {
        topSpeed: "235.4 km/h",
        averageSpeed: "136.2 km/h",
        maxGForce: "2.7g",
        brakingPoints: 9,
        accelerationZones: 5,
      },
    },
    barber: {
      performanceMetrics: {
        fastestLap: { time: "1:35.428", driver: "#13", speed: "139.8 kph", lap: 15 },
        averageLap: { time: "1:37.245", speed: "138.2 kph" },
        sectorAnalysis: [
          { sector: "Sector 1", bestTime: "26.961", avgTime: "27.185", difficulty: "High" },
          { sector: "Sector 2", bestTime: "43.160", avgTime: "43.294", difficulty: "Medium" },
          { sector: "Sector 3", bestTime: "29.163", avgTime: "29.604", difficulty: "High" },
        ],
      },
      telemetryInsights: {
        topSpeed: "245.8 km/h",
        averageSpeed: "138.2 km/h",
        maxGForce: "2.8g",
        brakingPoints: 8,
        accelerationZones: 6,
      },
    },
    vir: {
      performanceMetrics: {
        fastestLap: { time: "2:08.432", driver: "#13", speed: "147.5 kph", lap: 12 },
        averageLap: { time: "2:09.567", speed: "146.8 kph" },
        sectorAnalysis: [
          { sector: "Sector 1", bestTime: "41.234", avgTime: "41.678", difficulty: "High" },
          { sector: "Sector 2", bestTime: "45.567", avgTime: "46.123", difficulty: "Medium" },
          { sector: "Sector 3", bestTime: "41.631", avgTime: "41.766", difficulty: "High" },
        ],
      },
      telemetryInsights: {
        topSpeed: "258.7 km/h",
        averageSpeed: "146.8 km/h",
        maxGForce: "3.0g",
        brakingPoints: 9,
        accelerationZones: 7,
      },
    },
    indianapolis: {
      performanceMetrics: {
        fastestLap: { time: "1:52.345", driver: "#46", speed: "135.6 kph", lap: 11 },
        averageLap: { time: "1:53.789", speed: "134.2 kph" },
        sectorAnalysis: [
          { sector: "Sector 1", bestTime: "36.123", avgTime: "36.567", difficulty: "High" },
          { sector: "Sector 2", bestTime: "40.456", avgTime: "41.012", difficulty: "Medium" },
          { sector: "Sector 3", bestTime: "35.766", avgTime: "36.210", difficulty: "High" },
        ],
      },
      telemetryInsights: {
        topSpeed: "242.3 km/h",
        averageSpeed: "134.2 km/h",
        maxGForce: "2.6g",
        brakingPoints: 7,
        accelerationZones: 6,
      },
    },
  };

  const specifics = trackSpecifics[trackId] || {};
  return { ...baseData, ...specifics };
};

export default function TrackDetailAnalytics({ track, onClose }: TrackDetailAnalyticsProps) {
  const analytics = generateTrackAnalytics(track.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      <Card className="bg-card/90 backdrop-blur-lg border-border/50 shadow-2xl">
        <CardHeader className="pb-4 border-b border-border/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {onClose && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="hover:bg-primary/10"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                  <MapPin className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-3xl mb-1">{track.name}</CardTitle>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {track.location}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <Badge variant="outline" className="text-sm">
                  <Gauge className="w-3 h-3 mr-1" />
                  {track.length}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  <Zap className="w-3 h-3 mr-1" />
                  {track.turns} Turns
                </Badge>
                <Badge variant="outline" className="text-sm">
                  <Activity className="w-3 h-3 mr-1" />
                  {analytics.telemetryStats.vehiclesTracked} Vehicles
                </Badge>
                <Badge variant="outline" className="text-sm bg-primary/10 border-primary/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI-Powered Analytics
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
              <TabsTrigger value="tires">Tires</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="ai">AI Insights</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card/60 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Data Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Data Points</span>
                      <span className="font-bold text-lg">
                        {(analytics.telemetryStats.totalDataPoints / 1000000).toFixed(1)}M+
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Sampling Rate</span>
                      <span className="font-bold">{analytics.telemetryStats.averageSamplingRate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Vehicles Tracked</span>
                      <span className="font-bold">{analytics.telemetryStats.vehiclesTracked}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Race Duration</span>
                      <span className="font-bold">{analytics.telemetryStats.raceDuration}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Thermometer className="w-5 h-5 text-primary" />
                      Weather Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Thermometer className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Air Temp</span>
                        </div>
                        <p className="font-bold">{analytics.weatherImpact.airTemp}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Thermometer className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Track Temp</span>
                        </div>
                        <p className="font-bold">{analytics.weatherImpact.trackTemp}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Droplets className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Humidity</span>
                        </div>
                        <p className="font-bold">{analytics.weatherImpact.humidity}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Wind className="w-4 h-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Wind Speed</span>
                        </div>
                        <p className="font-bold">{analytics.weatherImpact.windSpeed}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border/50">
                      <Badge variant="outline" className="w-full justify-center py-2">
                        {analytics.weatherImpact.conditions}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Track Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{track.description}</p>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-4">
                {analytics.strategicInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card/60 border-border/50 hover:border-primary/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/20 rounded-lg">
                            {insight.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-sm">{insight.title}</h4>
                              <Badge
                                variant={
                                  insight.impact === "Critical"
                                    ? "destructive"
                                    : insight.impact === "High"
                                    ? "default"
                                    : "outline"
                                }
                                className="text-xs"
                              >
                                {insight.impact}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{insight.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card/60 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      Fastest Lap Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center p-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/30">
                      <p className="text-4xl font-bold font-mono mb-2">
                        {analytics.performanceMetrics.fastestLap.time}
                      </p>
                      <div className="flex items-center justify-center gap-4 text-sm">
                        <Badge variant="default" className="text-lg px-3 py-1">
                          {analytics.performanceMetrics.fastestLap.driver}
                        </Badge>
                        <span className="text-muted-foreground">
                          {analytics.performanceMetrics.fastestLap.speed}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Set on Lap {analytics.performanceMetrics.fastestLap.lap}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                      <div>
                        <span className="text-xs text-muted-foreground">Average Lap</span>
                        <p className="font-bold font-mono">{analytics.performanceMetrics.averageLap.time}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Avg Speed</span>
                        <p className="font-bold">{analytics.performanceMetrics.averageLap.speed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Sector Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analytics.performanceMetrics.sectorAnalysis.map((sector, index) => (
                      <div key={index} className="p-4 rounded-lg bg-accent/30 border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold">{sector.sector}</h4>
                          <Badge
                            variant={
                              sector.difficulty === "Very High"
                                ? "destructive"
                                : sector.difficulty === "High"
                                ? "default"
                                : "outline"
                            }
                          >
                            {sector.difficulty}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <span className="text-xs text-muted-foreground">Best Time</span>
                            <p className="font-bold font-mono text-primary">{sector.bestTime}s</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Avg Time</span>
                            <p className="font-bold font-mono">{sector.avgTime}s</p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Progress
                            value={
                              ((parseFloat(sector.bestTime) / parseFloat(sector.avgTime)) * 100 - 95) * 20
                            }
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card/60 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Driver Performance Leaders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-muted-foreground">Consistency Leader</span>
                      </div>
                      <p className="text-2xl font-bold">{analytics.driverPerformance.consistencyLeader.number}</p>
                      <p className="text-sm font-semibold text-blue-500">
                        {analytics.driverPerformance.consistencyLeader.score}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Variance: {analytics.driverPerformance.consistencyLeader.variance}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">Fastest Driver</span>
                      </div>
                      <p className="text-2xl font-bold">{analytics.driverPerformance.fastestDriver.number}</p>
                      <p className="text-sm font-semibold text-yellow-500 font-mono">
                        {analytics.driverPerformance.fastestDriver.avgLap}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-muted-foreground">Most Improved</span>
                      </div>
                      <p className="text-2xl font-bold">{analytics.driverPerformance.mostImprovement.number}</p>
                      <p className="text-sm font-semibold text-green-500">
                        {analytics.driverPerformance.mostImprovement.improvement}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Telemetry Tab */}
            <TabsContent value="telemetry" className="space-y-6 mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card/60 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Top Speed</span>
                    </div>
                    <p className="text-2xl font-bold">{analytics.telemetryInsights.topSpeed}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/60 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Average Speed</span>
                    </div>
                    <p className="text-2xl font-bold">{analytics.telemetryInsights.averageSpeed}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/60 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Max G-Force</span>
                    </div>
                    <p className="text-2xl font-bold">{analytics.telemetryInsights.maxGForce}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/60 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">Braking Points</span>
                    </div>
                    <p className="text-2xl font-bold">{analytics.telemetryInsights.brakingPoints}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card/60 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Telemetry Data Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold mb-3">Speed Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Straight Sections</span>
                          <div className="flex items-center gap-2">
                            <Progress value={85} className="w-32 h-2" />
                            <span className="text-sm font-bold">85%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Corner Entry</span>
                          <div className="flex items-center gap-2">
                            <Progress value={65} className="w-32 h-2" />
                            <span className="text-sm font-bold">65%</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Corner Exit</span>
                          <div className="flex items-center gap-2">
                            <Progress value={72} className="w-32 h-2" />
                            <span className="text-sm font-bold">72%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold mb-3">Performance Zones</h4>
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-accent/30 border border-border/50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Acceleration Zones</span>
                            <Badge>{analytics.telemetryInsights.accelerationZones}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Key areas for maximizing acceleration
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-accent/30 border border-border/50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Braking Zones</span>
                            <Badge>{analytics.telemetryInsights.brakingPoints}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Critical braking points for optimal lap times
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tires Tab */}
            <TabsContent value="tires" className="space-y-6 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card/60 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Tire Wear Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Average Wear Rate</span>
                        <Badge variant="destructive">{analytics.tireWearAnalysis.averageWearRate}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Per lap degradation rate across all sectors
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/30 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Optimal Pit Window</span>
                        <Badge variant="default">{analytics.tireWearAnalysis.optimalPitWindow}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recommended pit stop timing for optimal race strategy
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/30 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Expected Tire Life</span>
                        <Badge variant="outline">{analytics.tireWearAnalysis.tireLife}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Estimated laps before significant performance drop
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-primary" />
                      Critical Wear Sectors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.tireWearAnalysis.criticalSectors.map((sector, index) => (
                        <div
                          key={index}
                          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <span className="font-semibold">{sector}</span>
                          </div>
                          <Badge variant="destructive">High Wear</Badge>
                        </div>
                      ))}
                      <div className="pt-3 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">
                          These sectors show significantly higher tire degradation rates. Drivers should
                          manage tire temperature and avoid aggressive cornering in these areas.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Tire Management Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="default" className="mt-0.5">1</Badge>
                      <p className="text-sm flex-1">
                        Monitor tire temperatures closely in {analytics.tireWearAnalysis.criticalSectors.join(" and ")}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="default" className="mt-0.5">2</Badge>
                      <p className="text-sm flex-1">
                        Plan pit stops during {analytics.tireWearAnalysis.optimalPitWindow} for optimal track position
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="default" className="mt-0.5">3</Badge>
                      <p className="text-sm flex-1">
                        Expect tire performance drop after {analytics.tireWearAnalysis.tireLife} - adjust driving style accordingly
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="default" className="mt-0.5">4</Badge>
                      <p className="text-sm flex-1">
                        Use tire preservation techniques in high-wear sectors to extend tire life
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Strategy Tab */}
            <TabsContent value="strategy" className="space-y-6 mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card/60 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      Pit Stop Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                      <p className="font-semibold mb-2">Recommended Strategy</p>
                      <p className="text-sm text-muted-foreground">
                        {analytics.aiPredictions.pitStopStrategy}
                      </p>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between p-2 rounded bg-accent/30">
                        <span className="text-sm">Optimal Window</span>
                        <Badge>{analytics.tireWearAnalysis.optimalPitWindow}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-accent/30">
                        <span className="text-sm">Tire Life</span>
                        <Badge variant="outline">{analytics.tireWearAnalysis.tireLife}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Weather Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30">
                      <p className="font-semibold mb-2">Forecast Impact</p>
                      <p className="text-sm text-muted-foreground">
                        {analytics.aiPredictions.weatherImpact}
                      </p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="p-2 rounded bg-accent/30 text-center">
                        <p className="text-xs text-muted-foreground">Current Temp</p>
                        <p className="font-bold">{analytics.weatherImpact.trackTemp}</p>
                      </div>
                      <div className="p-2 rounded bg-accent/30 text-center">
                        <p className="text-xs text-muted-foreground">Conditions</p>
                        <Badge variant="outline" className="mt-1">
                          {analytics.weatherImpact.conditions}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card/60 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Strategic Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.strategicInsights.map((insight, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-accent/30 border border-border/50 flex items-start gap-4"
                      >
                        <div className="p-2 bg-primary/20 rounded-lg">{insight.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <Badge
                              variant={
                                insight.impact === "Critical"
                                  ? "destructive"
                                  : insight.impact === "High"
                                  ? "default"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {insight.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{insight.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Insights Tab */}
            <TabsContent value="ai" className="space-y-6 mt-6">
              <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI-Powered Race Predictions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Winner Probability</h4>
                      <div className="space-y-2">
                        {analytics.aiPredictions.raceWinnerProbability.map((prediction, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Badge variant="default" className="w-16 justify-center">
                              {prediction.driver}
                            </Badge>
                            <div className="flex-1">
                              <Progress value={parseInt(prediction.probability)} className="h-3" />
                            </div>
                            <span className="font-bold w-12 text-right">{prediction.probability}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card/60 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      AI Performance Clustering
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <h4 className="font-semibold mb-1">Elite Cluster</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Top performers with highest speeds and consistency
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="default">#13</Badge>
                          <Badge variant="default">#22</Badge>
                          <Badge variant="default">#72</Badge>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <h4 className="font-semibold mb-1">Competitive Midfield</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Consistent pace with room for improvement
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="outline">#46</Badge>
                          <Badge variant="outline">#55</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card/60 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      AI Strategic Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-accent/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-sm">Optimal Fast Lap Window</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Best position outcomes when setting fast lap during Laps 12-16
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-accent/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-sm">Speed Efficiency</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Strong negative correlation (-0.82) with final position
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-accent/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Zap className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-sm">Early Pace Advantage</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          +3.8 positions gained by drivers setting fast laps before lap 8
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 border-primary/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    AI Winning Formula
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge variant="default" className="mt-0.5">1</Badge>
                      <p className="text-sm flex-1">
                        Qualify in top 5 for optimal starting position and track position advantage
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="default" className="mt-0.5">2</Badge>
                      <p className="text-sm flex-1">
                        Push for fast lap between {analytics.tireWearAnalysis.optimalPitWindow} for best position outcomes
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="default" className="mt-0.5">3</Badge>
                      <p className="text-sm flex-1">
                        Maintain speed efficiency above 0.85 throughout the race for optimal tire management
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <Badge variant="default" className="mt-0.5">4</Badge>
                      <p className="text-sm flex-1">
                        Target critical gaps at position transitions for strategic overtaking opportunities
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

