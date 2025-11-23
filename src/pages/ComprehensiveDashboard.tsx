import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, 
  TrendingUp, 
  Target, 
  Zap, 
  MapPin, 
  Flag, 
  Sparkles, 
  Users,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Import all dashboard components
import { TireWearCard } from "@/components/dashboard/TireWearCard";
import { StrategyCard } from "@/components/dashboard/StrategyCard";
import { PerformanceCard } from "@/components/dashboard/PerformanceCard";
import { DriverCoachingCard } from "@/components/dashboard/DriverCoachingCard";
import { CompetitorModelingCard } from "@/components/dashboard/CompetitorModelingCard";
import { ExplainabilityCard } from "@/components/dashboard/ExplainabilityCard";
import { RealTimeAnalyticsCard } from "@/components/dashboard/RealTimeAnalyticsCard";
import { TrackSpecificModelsCard } from "@/components/dashboard/TrackSpecificModelsCard";
import { LiveGapAnalysisCard } from "@/components/dashboard/LiveGapAnalysisCard";

import { getLiveDashboard, getTracks, type DashboardData, type TrackList, type Track } from "@/api/pitwall";
import { useDemoMode } from "@/hooks/useDemoMode";
import { DemoButton } from "@/components/DemoButton";

// Default tracks fallback if API fails
const DEFAULT_TRACKS: TrackList = {
  tracks: [
    { id: "sebring", name: "Sebring International", location: "Sebring, Florida", length_miles: 3.74, turns: 17, available_races: [1, 2] },
    { id: "cota", name: "Circuit of the Americas", location: "Austin, Texas", length_miles: 3.427, turns: 20, available_races: [1, 2] },
    { id: "road_atlanta", name: "Road Atlanta", location: "Braselton, Georgia", length_miles: 2.54, turns: 12, available_races: [1, 2] },
    { id: "barber", name: "Barber Motorsports Park", location: "Birmingham, Alabama", length_miles: 2.38, turns: 17, available_races: [1, 2] },
    { id: "virginia", name: "Virginia International Raceway", location: "Alton, Virginia", length_miles: 3.27, turns: 17, available_races: [1, 2] },
    { id: "watkins_glen", name: "Watkins Glen International", location: "Watkins Glen, New York", length_miles: 3.4, turns: 11, available_races: [1, 2] },
    { id: "laguna_seca", name: "WeatherTech Raceway Laguna Seca", location: "Monterey, California", length_miles: 2.238, turns: 11, available_races: [1, 2] },
  ],
};

/**
 * Comprehensive Dashboard
 * 
 * Integrates all 9 core features:
 * 1. Real-Time Analytics
 * 2. Predictive Tire Models
 * 3. Driver Performance
 * 4. Strategy Optimization
 * 5. Track-Specific Models
 * 6. Live Gap Analysis
 * 7. Explainable AI & Trust
 * 8. Driver Coaching Insights
 * 9. Competitor Modeling
 */
export default function ComprehensiveDashboard() {
  const { isDemoMode } = useDemoMode();
  const [selectedTrack, setSelectedTrack] = useState("sebring");
  const [selectedRace, setSelectedRace] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(7);
  const [selectedLap, setSelectedLap] = useState(12);
  const [tracks, setTracks] = useState<TrackList>(DEFAULT_TRACKS);
  const hasInitializedTracks = useRef(false);

  // Fetch tracks list with fallback
  useEffect(() => {
    if (hasInitializedTracks.current) return;
    
    const fetchTracks = async () => {
      try {
        const tracksData = await getTracks();
        setTracks(tracksData);
        if (tracksData.tracks.length > 0 && !selectedTrack) {
          setSelectedTrack(tracksData.tracks[0].id);
        }
        hasInitializedTracks.current = true;
      } catch (error) {
        console.warn("Failed to fetch tracks, using default tracks:", error);
        // Use default tracks as fallback
        setTracks(DEFAULT_TRACKS);
        hasInitializedTracks.current = true;
      }
    };
    fetchTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch dashboard data with demo mode fallback
  const { data: dashboardData, isLoading, error, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ["comprehensive-dashboard", selectedTrack, selectedRace, selectedVehicle, selectedLap, isDemoMode],
    queryFn: async () => {
      // If in demo mode, try mock data first
      if (isDemoMode) {
        try {
          const { generateMockDashboardData } = await import("@/lib/mockDemoData");
          return generateMockDashboardData(selectedTrack, selectedRace, selectedVehicle, selectedLap);
        } catch (importError) {
          console.warn("Failed to load mock data generator, trying API:", importError);
        }
      }
      
      try {
        return await getLiveDashboard(selectedTrack, selectedRace, selectedVehicle, selectedLap);
      } catch (error) {
        // If API fails and not in demo mode, try demo fallback
        if (!isDemoMode) {
          console.warn("API failed, falling back to demo data:", error);
          try {
            const { generateMockDashboardData } = await import("@/lib/mockDemoData");
            return generateMockDashboardData(selectedTrack, selectedRace, selectedVehicle, selectedLap);
          } catch (fallbackError) {
            console.error("Both API and demo fallback failed:", fallbackError);
            throw error; // Throw original error if fallback also fails
          }
        }
        // Log error but don't throw - let React Query handle retries
        console.error("Dashboard API error:", error);
        throw error;
      }
    },
    enabled: !!selectedTrack,
    refetchInterval: isDemoMode ? false : 5000, // Don't refetch in demo mode, otherwise every 5 seconds
    retry: isDemoMode ? 0 : 2, // Don't retry in demo mode
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const features = [
    {
      id: "realtime",
      title: "Real-Time Analytics",
      description: "Process live telemetry data to provide instant insights on car performance, tire wear, and race strategy.",
      icon: <Activity className="w-5 h-5" />,
    },
    {
      id: "tire",
      title: "Predictive Tire Models",
      description: "AI algorithms forecast tire degradation and recommend optimal pit stop windows with 95% accuracy.",
      icon: <Target className="w-5 h-5" />,
    },
    {
      id: "driver",
      title: "Driver Performance",
      description: "Analyze driver inputs and provide actionable feedback to improve lap times and consistency.",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      id: "strategy",
      title: "Strategy Optimization",
      description: "Simulate race scenarios to determine the optimal strategy for qualifying and race conditions.",
      icon: <Zap className="w-5 h-5" />,
    },
    {
      id: "track",
      title: "Track-Specific Models",
      description: "Custom AI models trained on data from all 7 GR Cup tracks for circuit-specific insights.",
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      id: "gap",
      title: "Live Gap Analysis",
      description: "Monitor real-time gaps to competitors and calculate overtaking opportunities.",
      icon: <Flag className="w-5 h-5" />,
    },
    {
      id: "explainable",
      title: "Explainable AI & Trust",
      description: "Research-backed confidence intervals, uncertainty bands, and feature attribution for transparent decision-making.",
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      id: "coaching",
      title: "Driver Coaching Insights",
      description: "Corner-by-corner analysis with anomaly detection (lockups, early lifts) and actionable coaching feedback.",
      icon: <Target className="w-5 h-5" />,
    },
    {
      id: "competitor",
      title: "Competitor Modeling",
      description: "Predict competitor pit timing and identify undercut/overcut windows for strategic advantage.",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-all duration-300">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                <Activity className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Comprehensive Dashboard</h1>
                <p className="text-xs text-muted-foreground">All AI Features Integrated</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DemoButton size="sm" />
            <Button
              onClick={() => refetch()}
              disabled={isRefetching}
              variant="outline"
              size="sm"
            >
              {isRefetching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 relative z-10">
        <div className="container mx-auto max-w-7xl">
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Track
                  </label>
                  <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tracks?.tracks.map((track) => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Race
                  </label>
                  <Select value={selectedRace.toString()} onValueChange={(v) => setSelectedRace(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Race 1</SelectItem>
                      <SelectItem value="2">Race 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Vehicle
                  </label>
                  <Select value={selectedVehicle.toString()} onValueChange={(v) => setSelectedVehicle(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[7, 13, 22, 46, 47, 21, 72, 0].map((v) => (
                        <SelectItem key={v} value={v.toString()}>
                          #{v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Lap
                  </label>
                  <Select value={selectedLap.toString()} onValueChange={(v) => setSelectedLap(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 25 }, (_, i) => i + 1).map((lap) => (
                        <SelectItem key={lap} value={lap.toString()}>
                          Lap {lap}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Loading Dashboard</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "Failed to load dashboard data"}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && !dashboardData && (
            <Card className="p-12">
              <CardContent className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Loading Dashboard...</h3>
                  <p className="text-muted-foreground">
                    Fetching real-time analytics and AI predictions
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dashboard Content */}
          {dashboardData && (
            <div className="space-y-6">
              {/* Feature Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="p-6">
                  <h2 className="text-xl font-bold mb-4">Integrated Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {features.map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-center gap-2 p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                      >
                        <div className="text-primary">{feature.icon}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{feature.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Metrics */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Real-Time Analytics */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <RealTimeAnalyticsCard
                      track={selectedTrack}
                      race={selectedRace}
                      vehicle={selectedVehicle}
                      lap={selectedLap}
                    />
                  </motion.div>

                  {/* Performance */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <PerformanceCard
                      performance={dashboardData.performance}
                      meta={dashboardData.meta || { 
                        ok: true, 
                        track: selectedTrack, 
                        lap: selectedLap, 
                        total_laps: dashboardData.total_laps || 25,
                        enhanced_features: false
                      }}
                    />
                  </motion.div>

                  {/* Tire Wear */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <TireWearCard wear={dashboardData.tire_wear} />
                  </motion.div>

                  {/* Driver Coaching */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <DriverCoachingCard />
                  </motion.div>
                </div>

                {/* Right Column - Strategy & Analysis */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Strategy */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <StrategyCard 
                      strategy={dashboardData.strategy ? {
                        recommended_strategy: dashboardData.strategy.recommended_strategy,
                        strategies: dashboardData.strategy.strategies,
                      } : undefined} 
                    />
                  </motion.div>

                  {/* Live Gap Analysis */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <LiveGapAnalysisCard
                      gapAnalysis={dashboardData.gap_analysis}
                      performance={dashboardData.performance}
                    />
                  </motion.div>

                  {/* Competitor Modeling */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <CompetitorModelingCard currentLap={selectedLap} />
                  </motion.div>

                  {/* Track-Specific Models */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <TrackSpecificModelsCard currentTrack={selectedTrack} />
                  </motion.div>

                  {/* Explainable AI */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <ExplainabilityCard topFeatures={dashboardData.tire_wear.top_features} />
                  </motion.div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

