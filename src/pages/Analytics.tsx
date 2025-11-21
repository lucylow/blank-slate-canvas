import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, PieChart, Activity, Target, Zap, Loader2, AlertCircle, RefreshCw, Download, FileText, Clock, Award, TrendingDown, Gauge, Flame, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, Sparkles, Bot } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LapTimeTrendsChart } from "@/components/analytics/LapTimeTrendsChart";
import { TireWearDistributionChart } from "@/components/analytics/TireWearDistributionChart";
import { getLiveDashboard, getTracks, getAgentStatus, type DashboardData, type TrackList, type AgentStatusResponse } from "@/api/pitwall";
import { useDemoMode } from "@/hooks/useDemoMode";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { DemoButton } from "@/components/DemoButton";

const Analytics = () => {
  const { isDemoMode } = useDemoMode();
  const [selectedTrack, setSelectedTrack] = useState("sebring");
  const [selectedRace, setSelectedRace] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(7);
  const [selectedLap, setSelectedLap] = useState(12);
  const [tracks, setTracks] = useState<TrackList | null>(null);
  const hasInitializedTracks = useRef(false);

  // Fetch tracks list
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
        console.error("Failed to fetch tracks:", error);
      }
    };
    fetchTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch dashboard data (includes analytics)
  const { data: dashboardData, isLoading, error, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ["analytics", selectedTrack, selectedRace, selectedVehicle, selectedLap],
    queryFn: () => getLiveDashboard(selectedTrack, selectedRace, selectedVehicle, selectedLap),
    enabled: !!selectedTrack,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 2,
  });

  // Fetch AI agent status
  const { data: agentStatus } = useQuery<AgentStatusResponse>({
    queryKey: ['agentStatus'],
    queryFn: getAgentStatus,
    refetchInterval: 30000,
    retry: 1,
  });
  
  const activeAgents = agentStatus?.agents.filter(a => a.status === 'active').length || 0;

  // Calculate comprehensive analytics metrics from dashboard data
  const analyticsData = dashboardData ? [
    {
      title: "Lap Time Analysis",
      value: dashboardData.performance.current_lap || "N/A",
      change: dashboardData.performance.best_lap ? `Best: ${dashboardData.performance.best_lap}` : "N/A",
      trend: "improving",
      icon: <Activity className="w-5 h-5" />,
      color: "text-green-500",
      description: "Current vs best lap performance"
    },
    {
      title: "Tire Performance",
      value: `${Math.round((dashboardData.tire_wear.front_left + dashboardData.tire_wear.front_right + dashboardData.tire_wear.rear_left + dashboardData.tire_wear.rear_right) / 4)}%`,
      change: dashboardData.tire_wear.confidence ? `${Math.round(dashboardData.tire_wear.confidence * 100)}% confidence` : "N/A",
      trend: "stable",
      icon: <PieChart className="w-5 h-5" />,
      color: "text-blue-500",
      description: "Average tire wear across all corners"
    },
    {
      title: "Gap to Leader",
      value: dashboardData.gap_analysis.gap_to_leader || "N/A",
      change: dashboardData.gap_analysis.overtaking_opportunity ? "Overtaking opportunity" : "Maintaining position",
      trend: dashboardData.gap_analysis.overtaking_opportunity ? "improving" : "stable",
      icon: <BarChart3 className="w-5 h-5" />,
      color: dashboardData.gap_analysis.overtaking_opportunity ? "text-green-500" : "text-blue-500",
      description: "Real-time gap analysis to race leader"
    },
    {
      title: "Race Position",
      value: `P${dashboardData.performance.position || "N/A"}`,
      change: dashboardData.performance.predicted_finish ? `Predicted: ${dashboardData.performance.predicted_finish}` : "N/A",
      trend: "improving",
      icon: <Target className="w-5 h-5" />,
      color: "text-purple-500",
      description: "Current and predicted finish position"
    }
  ] : [];

  // Calculate performance insights
  const performanceInsights = useMemo(() => {
    if (!dashboardData) return [];

    const insights = [];
    const avgTireWear = (dashboardData.tire_wear.front_left + dashboardData.tire_wear.front_right + dashboardData.tire_wear.rear_left + dashboardData.tire_wear.rear_right) / 4;

    // Tire wear insight
    if (avgTireWear > 75) {
      insights.push({
        type: "warning",
        icon: <AlertTriangle className="w-4 h-4" />,
        title: "High Tire Wear Detected",
        message: `Average tire wear is at ${Math.round(avgTireWear)}%. Consider pit strategy evaluation.`,
        color: "text-amber-500"
      });
    } else if (avgTireWear < 50) {
      insights.push({
        type: "success",
        icon: <CheckCircle2 className="w-4 h-4" />,
        title: "Optimal Tire Condition",
        message: `Tires are in excellent condition at ${Math.round(avgTireWear)}% wear.`,
        color: "text-green-500"
      });
    }

    // Gap analysis insight
    if (dashboardData.gap_analysis.overtaking_opportunity) {
      insights.push({
        type: "info",
        icon: <TrendingUp className="w-4 h-4" />,
        title: "Overtaking Opportunity",
        message: `Gaining on competitor ahead. Gap: ${dashboardData.gap_analysis.gap_to_leader}`,
        color: "text-blue-500"
      });
    }

    // Position prediction insight
    if (dashboardData.performance.predicted_finish && dashboardData.performance.position) {
      const currentPos = parseInt(dashboardData.performance.predicted_finish.replace('P', '')) || dashboardData.performance.position;
      if (currentPos < dashboardData.performance.position) {
        insights.push({
          type: "success",
          icon: <ArrowUpRight className="w-4 h-4" />,
          title: "Position Gain Expected",
          message: `Predicted to improve from P${dashboardData.performance.position} to ${dashboardData.performance.predicted_finish}`,
          color: "text-green-500"
        });
      }
    }

    return insights;
  }, [dashboardData]);

  // Track name for PDF export
  const trackName = useMemo(() => {
    if (!tracks || !selectedTrack) return "";
    const track = tracks.tracks.find(t => t.id === selectedTrack);
    return track?.name || "";
  }, [tracks, selectedTrack]);

  /**
   * PDF Export Handler (placeholder for future implementation)
   * 
   * Future functionality: Export comprehensive data analysis summary reports as PDFs
   * for each of the 7 tracks in the GR Cup series.
   * 
   * The PDF report should include:
   * 1. Track-specific summary and characteristics
   * 2. Performance metrics (lap times, best laps, consistency)
   * 3. Tire wear analysis and predictions
   * 4. Gap analysis and position tracking
   * 5. Driver performance insights and trends
   * 6. Strategy recommendations
   * 7. Charts and visualizations (lap time trends, tire wear distribution)
   * 8. Comparison with competitor data (if available)
   * 9. Track-specific insights and recommendations
   * 10. Summary and key takeaways
   * 
   * Implementation will require:
   * - PDF generation library (e.g., jsPDF, react-pdf, pdfkit)
   * - Chart/image rendering to PDF format
   * - Data aggregation across all races for the track
   * - Report template design
   * - Export functionality for all 7 tracks individually
   */
  const handleExportPDF = async () => {
    // TODO: Implement PDF export functionality
    // This will generate a comprehensive data analysis summary report for the selected track
    const reportInfo = {
      track: trackName || selectedTrack,
      trackId: selectedTrack,
      race: selectedRace,
      vehicle: selectedVehicle,
      lap: selectedLap,
      timestamp: dashboardData?.timestamp || new Date().toISOString(),
    };
    
    alert(
      `PDF Export functionality coming soon!\n\n` +
      `This will export a comprehensive data analysis summary report for:\n` +
      `\nTrack: ${reportInfo.track}` +
      `\nRace: ${reportInfo.race}` +
      `\nVehicle: #${reportInfo.vehicle}` +
      `\nCurrent Lap: ${reportInfo.lap}` +
      `\n\n` +
      `The PDF report will include:\n` +
      `• Performance metrics and trends\n` +
      `• Tire wear analysis\n` +
      `• Gap analysis\n` +
      `• Driver insights\n` +
      `• Strategy recommendations\n` +
      `• Charts and visualizations`
    );
    
    // Future implementation:
    // const pdfReport = await generatePDFReport(reportInfo, dashboardData);
    // downloadPDF(pdfReport, `PitWall_AI_Report_${selectedTrack}_Race${selectedRace}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                <TrendingUp className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Analytics</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <DemoButton />
            <Link to="/dashboard">
              <Button className="bg-primary hover:bg-primary/90">
                View Dashboard
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs />
          </div>
          
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Performance Analytics
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mb-2">
                  Deep dive into race performance metrics, trends, and insights powered by our AI agent system to optimize your strategy.
                </p>
                {activeAgents > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>{activeAgents} AI agents actively analyzing data</span>
                  </div>
                )}
              </div>
              {dashboardData && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Button
                    onClick={handleExportPDF}
                    className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105"
                    size="lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    <FileText className="w-4 h-4 mr-2" />
                    Export PDF Report
                  </Button>
                </motion.div>
              )}
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Track</label>
                <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select track" />
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
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Race</label>
                <Select value={selectedRace.toString()} onValueChange={(v) => setSelectedRace(parseInt(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Race 1</SelectItem>
                    <SelectItem value="2">Race 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Vehicle</label>
                <Select value={selectedVehicle.toString()} onValueChange={(v) => setSelectedVehicle(parseInt(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[7, 13, 21, 22, 46, 47, 78, 88].map((v) => (
                      <SelectItem key={v} value={v.toString()}>
                        #{v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-muted-foreground">Lap</label>
                <Select value={selectedLap.toString()} onValueChange={(v) => setSelectedLap(parseInt(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((lap) => (
                      <SelectItem key={lap} value={lap.toString()}>
                        Lap {lap}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading analytics</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "Failed to load analytics data. Please check your backend connection."}
                {!isDemoMode && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && !dashboardData && (
            <Card className="p-12">
              <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Loading Analytics</h3>
                  <p className="text-muted-foreground">Fetching performance data from backend...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metrics Grid */}
          {dashboardData && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {analyticsData.map((metric, index) => {
                const TrendIcon = metric.trend === "improving" ? ArrowDownRight : 
                                 metric.trend === "declining" ? ArrowUpRight : Minus;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card/60 backdrop-blur-md hover:bg-card/80 transition-all duration-300 hover:scale-[1.02] border-border/50 hover:border-primary/30 hover:shadow-xl group">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-lg bg-primary/10 ${metric.color} group-hover:scale-110 transition-transform`}>
                            {metric.icon}
                          </div>
                          <div className={`flex items-center gap-1 ${metric.trend === "improving" ? "text-green-500" : metric.trend === "declining" ? "text-red-500" : "text-muted-foreground"}`}>
                            <TrendIcon className="w-4 h-4" />
                            <span className="text-xs font-semibold">
                              {metric.trend === "improving" ? "↓" : metric.trend === "declining" ? "↑" : "→"}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                          {metric.title}
                        </h3>
                        <p className="text-2xl font-bold mb-2">{metric.value}</p>
                        <p className="text-xs text-muted-foreground">{metric.description}</p>
                        <div className="mt-3 pt-3 border-t border-border/30">
                          <p className={`text-xs font-medium ${metric.color}`}>
                            {metric.change}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Performance Insights */}
          {dashboardData && performanceInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-12"
            >
              <Card className="bg-card/60 backdrop-blur-md border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Performance Insights
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Bot className="w-4 h-4 text-primary" />
                      <span>AI Agent Powered</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {performanceInsights.map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className={`p-4 rounded-lg border-2 ${
                          insight.type === "warning" ? "bg-amber-500/10 border-amber-500/30" :
                          insight.type === "success" ? "bg-green-500/10 border-green-500/30" :
                          "bg-blue-500/10 border-blue-500/30"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 ${insight.color}`}>
                            {insight.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{insight.title}</h4>
                            <p className="text-sm text-muted-foreground">{insight.message}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Track-Specific Insights */}
          {dashboardData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-12"
            >
              <Card className="bg-card/60 backdrop-blur-md border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Track-Specific Insights for {trackName || selectedTrack}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Predictor Agent</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Lap Progress</span>
                      </div>
                      <p className="text-2xl font-bold">{dashboardData.performance.lap_number || selectedLap}</p>
                      <p className="text-xs text-muted-foreground mt-1">of {dashboardData.performance.total_laps || 30} total laps</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Current Position</span>
                      </div>
                      <p className="text-2xl font-bold">P{dashboardData.performance.position || "N/A"}</p>
                      <p className="text-xs text-muted-foreground mt-1">in Race {selectedRace}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Performance Trend</span>
                      </div>
                      <p className="text-2xl font-bold flex items-center gap-2">
                        {dashboardData.performance.predicted_finish || "P" + (dashboardData.performance.position || "N/A")}
                        {dashboardData.performance.predicted_finish && parseInt(dashboardData.performance.predicted_finish.replace('P', '')) < (dashboardData.performance.position || 999) && (
                          <ArrowUpRight className="w-5 h-5 text-green-500" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Predicted finish</p>
                    </div>
                  </div>
                  {dashboardData.tire_wear.pit_window_optimal && dashboardData.tire_wear.pit_window_optimal.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Optimal Pit Window</h4>
                      <div className="flex flex-wrap gap-2">
                        {dashboardData.tire_wear.pit_window_optimal.map((lap, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-sm font-medium text-primary"
                          >
                            Lap {lap}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-card/60 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Lap Time Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <LapTimeTrendsChart />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-card/60 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Tire Wear Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <TireWearDistributionChart />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Enhanced Driver Performance Section */}
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            {/* Driver Performance Details */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-card/60 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Driver Performance Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50 border border-border/30 hover:bg-accent/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <span className="font-medium block">Current Lap</span>
                          <span className="text-xs text-muted-foreground">Lap {dashboardData?.performance.lap_number || selectedLap}/{dashboardData?.performance.total_laps || 30}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-lg">{dashboardData?.performance.current_lap || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50 border border-border/30 hover:bg-accent/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-primary" />
                        <div>
                          <span className="font-medium block">Best Lap</span>
                          <span className="text-xs text-muted-foreground">Personal best</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-lg text-primary">{dashboardData?.performance.best_lap || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50 border border-border/30 hover:bg-accent/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <span className="font-medium block">Gap to Leader</span>
                          <span className="text-xs text-muted-foreground">{dashboardData?.gap_analysis.overtaking_opportunity ? "Closing gap" : "Maintaining"}</span>
                        </div>
                      </div>
                      <span className={`font-mono font-bold text-lg ${dashboardData?.gap_analysis.overtaking_opportunity ? "text-green-500" : ""}`}>
                        {dashboardData?.gap_analysis.gap_to_leader || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-primary" />
                        <div>
                          <span className="font-medium block">Predicted Finish</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Bot className="w-3 h-3 text-primary" />
                            Strategy Agent
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-lg text-primary">{dashboardData?.performance.predicted_finish || "N/A"}</span>
                    </div>
                    {dashboardData?.gap_analysis && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Position Analysis</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {dashboardData.gap_analysis.gap_to_ahead && (
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                              <span className="text-xs text-muted-foreground block mb-1">Gap Ahead</span>
                              <p className="font-mono font-bold text-sm">{dashboardData.gap_analysis.gap_to_ahead}</p>
                            </div>
                          )}
                          {dashboardData.gap_analysis.gap_to_behind && (
                            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                              <span className="text-xs text-muted-foreground block mb-1">Gap Behind</span>
                              <p className="font-mono font-bold text-sm">{dashboardData.gap_analysis.gap_to_behind}</p>
                            </div>
                          )}
                          {dashboardData.gap_analysis.under_pressure && (
                            <div className="col-span-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                              <span className="text-xs font-semibold text-red-500 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Under Pressure
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tire Wear Analysis */}
            {dashboardData?.tire_wear && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="bg-card/60 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300 h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-primary" />
                        Tire Wear Analysis
                      </CardTitle>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>Predictor Agent</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-4 rounded-lg border-2 ${
                          dashboardData.tire_wear.front_left > 75 ? "bg-red-500/10 border-red-500/30" :
                          dashboardData.tire_wear.front_left > 50 ? "bg-amber-500/10 border-amber-500/30" :
                          "bg-green-500/10 border-green-500/30"
                        }`}>
                          <span className="text-xs text-muted-foreground block mb-2">Front Left</span>
                          <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold">{Math.round(dashboardData.tire_wear.front_left)}%</p>
                            {dashboardData.tire_wear.front_left > 75 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          </div>
                          <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                dashboardData.tire_wear.front_left > 75 ? "bg-red-500" :
                                dashboardData.tire_wear.front_left > 50 ? "bg-amber-500" :
                                "bg-green-500"
                              }`}
                              style={{ width: `${dashboardData.tire_wear.front_left}%` }}
                            />
                          </div>
                        </div>
                        <div className={`p-4 rounded-lg border-2 ${
                          dashboardData.tire_wear.front_right > 75 ? "bg-red-500/10 border-red-500/30" :
                          dashboardData.tire_wear.front_right > 50 ? "bg-amber-500/10 border-amber-500/30" :
                          "bg-green-500/10 border-green-500/30"
                        }`}>
                          <span className="text-xs text-muted-foreground block mb-2">Front Right</span>
                          <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold">{Math.round(dashboardData.tire_wear.front_right)}%</p>
                            {dashboardData.tire_wear.front_right > 75 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          </div>
                          <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                dashboardData.tire_wear.front_right > 75 ? "bg-red-500" :
                                dashboardData.tire_wear.front_right > 50 ? "bg-amber-500" :
                                "bg-green-500"
                              }`}
                              style={{ width: `${dashboardData.tire_wear.front_right}%` }}
                            />
                          </div>
                        </div>
                        <div className={`p-4 rounded-lg border-2 ${
                          dashboardData.tire_wear.rear_left > 75 ? "bg-red-500/10 border-red-500/30" :
                          dashboardData.tire_wear.rear_left > 50 ? "bg-amber-500/10 border-amber-500/30" :
                          "bg-green-500/10 border-green-500/30"
                        }`}>
                          <span className="text-xs text-muted-foreground block mb-2">Rear Left</span>
                          <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold">{Math.round(dashboardData.tire_wear.rear_left)}%</p>
                            {dashboardData.tire_wear.rear_left > 75 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          </div>
                          <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                dashboardData.tire_wear.rear_left > 75 ? "bg-red-500" :
                                dashboardData.tire_wear.rear_left > 50 ? "bg-amber-500" :
                                "bg-green-500"
                              }`}
                              style={{ width: `${dashboardData.tire_wear.rear_left}%` }}
                            />
                          </div>
                        </div>
                        <div className={`p-4 rounded-lg border-2 ${
                          dashboardData.tire_wear.rear_right > 75 ? "bg-red-500/10 border-red-500/30" :
                          dashboardData.tire_wear.rear_right > 50 ? "bg-amber-500/10 border-amber-500/30" :
                          "bg-green-500/10 border-green-500/30"
                        }`}>
                          <span className="text-xs text-muted-foreground block mb-2">Rear Right</span>
                          <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold">{Math.round(dashboardData.tire_wear.rear_right)}%</p>
                            {dashboardData.tire_wear.rear_right > 75 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          </div>
                          <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                dashboardData.tire_wear.rear_right > 75 ? "bg-red-500" :
                                dashboardData.tire_wear.rear_right > 50 ? "bg-amber-500" :
                                "bg-green-500"
                              }`}
                              style={{ width: `${dashboardData.tire_wear.rear_right}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {dashboardData.tire_wear.predicted_laps_remaining && (
                        <div className="mt-4 pt-4 border-t border-border/50">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <span className="text-sm font-medium">Predicted Laps Remaining</span>
                            <span className="font-mono font-bold text-primary">{dashboardData.tire_wear.predicted_laps_remaining} laps</span>
                          </div>
                        </div>
                      )}
                      {dashboardData.tire_wear.confidence && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Model Confidence</span>
                            <span>{Math.round(dashboardData.tire_wear.confidence * 100)}%</span>
                          </div>
                          <div className="h-2 bg-background rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${dashboardData.tire_wear.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Analytics;


