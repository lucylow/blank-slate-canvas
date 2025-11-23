import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, PieChart, Activity, Target, Zap, Loader2, AlertCircle, RefreshCw, Download, FileText, Clock, Award, TrendingDown, Gauge, Flame, CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownRight, Minus, Sparkles, Bot, ArrowLeft } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LapTimeTrendsChart } from "@/components/analytics/LapTimeTrendsChart";
import { TireWearDistributionChart } from "@/components/analytics/TireWearDistributionChart";
import { LapSplitDeltaChart } from "@/components/analytics/LapSplitDeltaChart";
import { getLiveDashboard, getTracks, getAgentStatus, type DashboardData, type TrackList, type AgentStatusResponse, type Track } from "@/api/pitwall";
import { useDemoMode } from "@/hooks/useDemoMode";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { DemoButton } from "@/components/DemoButton";
import ErrorBoundary from "@/components/ErrorBoundary";

// Default tracks fallback if API fails
const DEFAULT_TRACKS: TrackList = {
  tracks: [
    { id: "sebring", name: "Sebring International", location: "Sebring, Florida", length_miles: 3.74, turns: 17, available_races: [1, 2] },
    { id: "cota", name: "Circuit of the Americas", location: "Austin, Texas", length_miles: 3.427, turns: 20, available_races: [1, 2] },
    { id: "road-america", name: "Road America", location: "Elkhart Lake, Wisconsin", length_miles: 4.048, turns: 14, available_races: [1, 2] },
    { id: "sonoma", name: "Sonoma Raceway", location: "Sonoma, California", length_miles: 2.52, turns: 12, available_races: [1, 2] },
    { id: "barber", name: "Barber Motorsports Park", location: "Birmingham, Alabama", length_miles: 2.38, turns: 17, available_races: [1, 2] },
    { id: "vir", name: "Virginia International", location: "Alton, Virginia", length_miles: 3.27, turns: 17, available_races: [1, 2] },
    { id: "indianapolis", name: "Indianapolis Motor Speedway", location: "Indianapolis, Indiana", length_miles: 2.439, turns: 14, available_races: [1, 2] },
  ]
};

// Error types for better error handling
type ErrorType = 'network' | 'api' | 'validation' | 'data' | 'unknown';

interface ErrorInfo {
  type: ErrorType;
  message: string;
  retryable: boolean;
  details?: string;
}

// Validation helpers
const validateTrack = (trackId: string, tracks: TrackList | null): boolean => {
  if (!tracks?.tracks) return false;
  return tracks.tracks.some(t => t.id === trackId);
};

const validateRace = (race: number, trackId: string, tracks: TrackList | null): boolean => {
  if (!tracks?.tracks) return true; // Can't validate without tracks
  const track = tracks.tracks.find(t => t.id === trackId);
  return track ? track.available_races.includes(race) : true;
};

const validateVehicle = (vehicle: number): boolean => {
  const validVehicles = [7, 13, 21, 22, 46, 47, 78, 88];
  return validVehicles.includes(vehicle);
};

const validateLap = (lap: number): boolean => {
  return lap >= 1 && lap <= 30;
};

// Error message formatter
const formatError = (error: unknown): ErrorInfo => {
  if (error && typeof error === 'object') {
    // Network errors
    if ('request' in error && !('response' in error)) {
      return {
        type: 'network',
        message: 'Network connection error. Please check your internet connection.',
        retryable: true,
        details: 'The backend server may be unavailable or unreachable.'
      };
    }
    
    // API errors
    if ('response' in error) {
      const axiosError = error as { response?: { status?: number; data?: { message?: string }; statusText?: string } };
      const status = axiosError.response?.status;
      const message = axiosError.response?.data?.message || axiosError.response?.statusText || 'Unknown API error';
      
      if (status === 404) {
        return {
          type: 'api',
          message: 'Data not found. The requested race data may not exist.',
          retryable: false,
          details: `Status: ${status} - ${message}`
        };
      }
      
      if (status === 403 || status === 401) {
        return {
          type: 'api',
          message: 'Access denied. Please check your permissions.',
          retryable: false,
          details: `Status: ${status} - ${message}`
        };
      }
      
      if (status && status >= 500) {
        return {
          type: 'api',
          message: 'Server error. The backend service is experiencing issues.',
          retryable: true,
          details: `Status: ${status} - ${message}`
        };
      }
      
      return {
        type: 'api',
        message: `API error: ${message}`,
        retryable: status !== 400 && status !== 404,
        details: `Status: ${status}`
      };
    }
  }
  
  // Generic error
  const message = error instanceof Error ? error.message : String(error);
  return {
    type: 'unknown',
    message: message || 'An unexpected error occurred',
    retryable: true,
    details: typeof error === 'object' ? JSON.stringify(error) : undefined
  };
};

const Analytics = () => {
  const { isDemoMode } = useDemoMode();
  const [searchParams] = useSearchParams();
  const [selectedTrack, setSelectedTrack] = useState("sebring");
  const [selectedRace, setSelectedRace] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(7);
  const [selectedLap, setSelectedLap] = useState(12);
  const [comparisonCars, setComparisonCars] = useState<number[]>([7, 13, 22]); // Default cars for comparison
  const [tracks, setTracks] = useState<TrackList | null>(DEFAULT_TRACKS);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const hasInitializedTracks = useRef(false);

  // Validate URL parameters and filters
  useEffect(() => {
    const errors: string[] = [];
    
    if (!validateTrack(selectedTrack, tracks)) {
      errors.push(`Invalid track: ${selectedTrack}. Using default track.`);
      const defaultTrack = tracks?.tracks?.[0]?.id || DEFAULT_TRACKS.tracks[0].id;
      setSelectedTrack(defaultTrack);
    }
    
    if (!validateRace(selectedRace, selectedTrack, tracks)) {
      errors.push(`Race ${selectedRace} may not be available for this track.`);
    }
    
    if (!validateVehicle(selectedVehicle)) {
      errors.push(`Invalid vehicle: ${selectedVehicle}. Using default vehicle.`);
      setSelectedVehicle(7);
    }
    
    if (!validateLap(selectedLap)) {
      errors.push(`Invalid lap: ${selectedLap}. Lap must be between 1 and 30.`);
      setSelectedLap(Math.max(1, Math.min(30, selectedLap)));
    }
    
    setValidationErrors(errors);
  }, [selectedTrack, selectedRace, selectedVehicle, selectedLap, tracks]);

  // Read track from URL params with validation
  useEffect(() => {
    const trackParam = searchParams.get('track');
    if (trackParam) {
      if (validateTrack(trackParam, tracks)) {
        setSelectedTrack(trackParam);
      } else {
        console.warn(`Invalid track in URL: ${trackParam}`);
        setValidationErrors(prev => [...prev, `Invalid track in URL: ${trackParam}`]);
      }
    }
  }, [searchParams, tracks]);

  // Fetch tracks list with enhanced error handling
  useEffect(() => {
    if (hasInitializedTracks.current) return;
    
    const fetchTracks = async () => {
      try {
        const tracksData = await getTracks();
        
        // Validate tracks data
        if (!tracksData || !tracksData.tracks || tracksData.tracks.length === 0) {
          throw new Error('Invalid tracks data received from API');
        }
        
        setTracks(tracksData);
        // Only set default track if no track param in URL
        const trackParam = searchParams.get('track');
        if (tracksData.tracks.length > 0 && !trackParam) {
          setSelectedTrack(tracksData.tracks[0].id);
        }
        hasInitializedTracks.current = true;
      } catch (error) {
        const errorInfo = formatError(error);
        console.error("Failed to fetch tracks, using default tracks:", errorInfo);
        
        // Use default tracks as fallback
        setTracks(DEFAULT_TRACKS);
        setValidationErrors(prev => [...prev, `Using default tracks: ${errorInfo.message}`]);
        hasInitializedTracks.current = true;
      }
    };
    fetchTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch dashboard data (includes analytics) with enhanced error handling
  const { data: dashboardData, isLoading, error, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ["analytics", selectedTrack, selectedRace, selectedVehicle, selectedLap, isDemoMode],
    queryFn: async () => {
      // Validate inputs before making request
      if (!validateTrack(selectedTrack, tracks)) {
        throw new Error(`Invalid track: ${selectedTrack}`);
      }
      if (!validateLap(selectedLap)) {
        throw new Error(`Invalid lap: ${selectedLap}. Must be between 1 and 30.`);
      }
      
      // Use demo mode fallback if enabled
      if (isDemoMode) {
        try {
          const { generateMockDashboardData } = await import("@/lib/mockDemoData");
          const mockData = generateMockDashboardData(selectedTrack, selectedRace, selectedVehicle, selectedLap);
          
          // Validate mock data structure
          if (!mockData || typeof mockData !== 'object') {
            throw new Error('Invalid mock data structure');
          }
          
          return mockData;
        } catch (importError) {
          const errorInfo = formatError(importError);
          console.warn("Failed to load mock data generator, trying API:", errorInfo);
          // Continue to API call
        }
      }
      
      try {
        const data = await getLiveDashboard(selectedTrack, selectedRace, selectedVehicle, selectedLap);
        
        // Validate response data structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data structure received from API');
        }
        
        return data;
      } catch (error) {
        const errorInfo = formatError(error);
        
        // If API fails and not in demo mode, try demo fallback
        if (!isDemoMode && errorInfo.retryable) {
          console.warn("API failed, falling back to demo data:", errorInfo);
          try {
            const { generateMockDashboardData } = await import("@/lib/mockDemoData");
            const fallbackData = generateMockDashboardData(selectedTrack, selectedRace, selectedVehicle, selectedLap);
            
            if (!fallbackData || typeof fallbackData !== 'object') {
              throw new Error('Invalid fallback data structure');
            }
            
            return fallbackData;
          } catch (fallbackError) {
            const fallbackErrorInfo = formatError(fallbackError);
            console.error("Both API and demo fallback failed:", fallbackErrorInfo);
            throw error; // Throw original error if fallback also fails
          }
        }
        
        // Log error with details
        console.error("Dashboard API error:", errorInfo);
        throw error;
      }
    },
    enabled: !!selectedTrack && validateTrack(selectedTrack, tracks),
    refetchInterval: isDemoMode ? false : 30000, // Don't refetch in demo mode
    retry: (failureCount, error) => {
      if (isDemoMode) return false;
      const errorInfo = formatError(error);
      // Don't retry on validation errors or non-retryable errors
      if (errorInfo.type === 'validation' || !errorInfo.retryable) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 10000, // Consider data fresh for 10 seconds
  });

  // Fetch AI agent status with error handling
  const { data: agentStatus, error: agentStatusError, isLoading: agentStatusLoading } = useQuery<AgentStatusResponse>({
    queryKey: ['agentStatus'],
    queryFn: async () => {
      try {
        const status = await getAgentStatus();
        
        // Validate agent status structure
        if (!status || typeof status !== 'object') {
          throw new Error('Invalid agent status structure');
        }
        
        return status;
      } catch (error) {
        const errorInfo = formatError(error);
        console.error("Failed to fetch agent status:", errorInfo);
        throw error;
      }
    },
    enabled: !isDemoMode,
    refetchInterval: 30000,
    retry: (failureCount, error) => {
      const errorInfo = formatError(error);
      // Don't retry on non-retryable errors
      if (!errorInfo.retryable) return false;
      return failureCount < 1;
    },
    staleTime: 15000, // Consider status fresh for 15 seconds
  });
  
  const activeAgents = agentStatus?.agents?.filter(a => a.status === 'active').length || 0;
  const agentStatusErrorInfo = agentStatusError ? formatError(agentStatusError) : null;

  // Calculate comprehensive analytics metrics from dashboard data
  const analyticsData = dashboardData ? [
    {
      title: "Lap Time Analysis",
      value: dashboardData.performance?.current_lap || "N/A",
      change: dashboardData.performance?.best_lap ? `Best: ${dashboardData.performance.best_lap}` : "N/A",
      trend: "improving",
      icon: <Activity className="w-5 h-5" />,
      color: "text-green-500",
      description: "Current vs best lap performance"
    },
    {
      title: "Tire Performance",
      value: dashboardData.tire_wear && typeof dashboardData.tire_wear.front_left === 'number' && typeof dashboardData.tire_wear.front_right === 'number' && typeof dashboardData.tire_wear.rear_left === 'number' && typeof dashboardData.tire_wear.rear_right === 'number' 
        ? `${Math.round((dashboardData.tire_wear.front_left + dashboardData.tire_wear.front_right + dashboardData.tire_wear.rear_left + dashboardData.tire_wear.rear_right) / 4)}%` 
        : "N/A",
      change: dashboardData.tire_wear?.confidence ? `${Math.round(dashboardData.tire_wear.confidence * 100)}% confidence` : "N/A",
      trend: "stable",
      icon: <PieChart className="w-5 h-5" />,
      color: "text-blue-500",
      description: "Average tire wear across all corners"
    },
    {
      title: "Gap to Leader",
      value: dashboardData.gap_analysis?.gap_to_leader || "N/A",
      change: dashboardData.gap_analysis?.overtaking_opportunity ? "Overtaking opportunity" : "Maintaining position",
      trend: dashboardData.gap_analysis?.overtaking_opportunity ? "improving" : "stable",
      icon: <BarChart3 className="w-5 h-5" />,
      color: dashboardData.gap_analysis?.overtaking_opportunity ? "text-green-500" : "text-blue-500",
      description: "Real-time gap analysis to race leader"
    },
    {
      title: "Race Position",
      value: `P${dashboardData.performance?.position || "N/A"}`,
      change: dashboardData.performance?.predicted_finish ? `Predicted: ${dashboardData.performance.predicted_finish}` : "N/A",
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
    
    // Tire wear insight - safely check if tire_wear exists and has valid values
    if (dashboardData.tire_wear && 
        typeof dashboardData.tire_wear.front_left === 'number' && 
        typeof dashboardData.tire_wear.front_right === 'number' && 
        typeof dashboardData.tire_wear.rear_left === 'number' && 
        typeof dashboardData.tire_wear.rear_right === 'number') {
      const avgTireWear = (dashboardData.tire_wear.front_left + dashboardData.tire_wear.front_right + dashboardData.tire_wear.rear_left + dashboardData.tire_wear.rear_right) / 4;

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
    }

    // Gap analysis insight - safely check if gap_analysis exists
    if (dashboardData.gap_analysis?.overtaking_opportunity) {
      insights.push({
        type: "info",
        icon: <TrendingUp className="w-4 h-4" />,
        title: "Overtaking Opportunity",
        message: `Gaining on competitor ahead. Gap: ${dashboardData.gap_analysis?.gap_to_leader || "N/A"}`,
        color: "text-blue-500"
      });
    }

    // Position prediction insight - safely check if performance exists
    if (dashboardData.performance?.predicted_finish && dashboardData.performance?.position) {
      const predictedFinishStr = typeof dashboardData.performance.predicted_finish === 'string' 
        ? dashboardData.performance.predicted_finish.replace('P', '') 
        : String(dashboardData.performance.predicted_finish).replace('P', '');
      const currentPos = parseInt(predictedFinishStr) || dashboardData.performance.position;
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
    if (!selectedTrack) return "";
    const tracksList = tracks?.tracks || DEFAULT_TRACKS.tracks;
    const track = tracksList.find(t => t.id === selectedTrack);
    return track?.name || selectedTrack;
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
    try {
      // Validate data before export
      if (!dashboardData) {
        throw new Error('No data available to export. Please wait for data to load.');
      }
      
      if (!validateTrack(selectedTrack, tracks)) {
        throw new Error(`Invalid track: ${selectedTrack}`);
      }
      
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
    } catch (error) {
      const errorInfo = formatError(error);
      console.error("PDF export error:", errorInfo);
      alert(`Failed to prepare PDF export: ${errorInfo.message}`);
    }
  };

  return (
    <main role="main" className="min-h-screen bg-[#0A0A0A] text-white relative overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-800 shadow-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-all duration-300">
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
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 hover:scale-105">
                View Dashboard
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="hover:bg-primary/10 transition-all duration-300"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
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
                    {(tracks?.tracks || DEFAULT_TRACKS.tracks).map((track) => (
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

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="default" className="mb-6 border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-500">Validation Warnings</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx} className="text-sm">{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Agent Status Error */}
          {agentStatusErrorInfo && !isDemoMode && (
            <Alert variant="default" className="mb-6 border-blue-500/50 bg-blue-500/10">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-blue-500">Agent Status Unavailable</AlertTitle>
              <AlertDescription>
                {agentStatusErrorInfo.message}
                {agentStatusErrorInfo.retryable && (
                  <span className="block mt-2 text-xs text-muted-foreground">
                    Analytics will continue to work, but agent status may not be displayed.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Main Error State */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading analytics</AlertTitle>
              <AlertDescription>
                {(() => {
                  const errorInfo = formatError(error);
                  return (
                    <div>
                      <p className="mb-2">{errorInfo.message}</p>
                      {errorInfo.details && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                            Technical details
                          </summary>
                          <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-auto">
                            {errorInfo.details}
                          </pre>
                        </details>
                      )}
                      {errorInfo.retryable && !isDemoMode && (
                        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                          <RefreshCw className="w-3 h-3 mr-2" />
                          Retry
                        </Button>
                      )}
                      {!errorInfo.retryable && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          This error may require checking your filters or contacting support.
                        </p>
                      )}
                    </div>
                  );
                })()}
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
                      <p className="text-2xl font-bold">{dashboardData.performance?.lap_number || selectedLap}</p>
                      <p className="text-xs text-muted-foreground mt-1">of {dashboardData.performance?.total_laps || 30} total laps</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Current Position</span>
                      </div>
                      <p className="text-2xl font-bold">P{dashboardData.performance?.position || "N/A"}</p>
                      <p className="text-xs text-muted-foreground mt-1">in Race {selectedRace}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Performance Trend</span>
                      </div>
                      <p className="text-2xl font-bold flex items-center gap-2">
                        {dashboardData.performance?.predicted_finish || "P" + (dashboardData.performance?.position || "N/A")}
                        {dashboardData.performance?.predicted_finish && dashboardData.performance?.position && (() => {
                          const predictedFinishStr = typeof dashboardData.performance.predicted_finish === 'string' 
                            ? dashboardData.performance.predicted_finish.replace('P', '') 
                            : String(dashboardData.performance.predicted_finish).replace('P', '');
                          return parseInt(predictedFinishStr) < dashboardData.performance.position;
                        })() && (
                          <ArrowUpRight className="w-5 h-5 text-green-500" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Predicted finish</p>
                    </div>
                  </div>
                  {dashboardData.tire_wear?.pit_window_optimal && Array.isArray(dashboardData.tire_wear.pit_window_optimal) && dashboardData.tire_wear.pit_window_optimal.length > 0 && (
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
          {dashboardData ? (
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
                      <ErrorBoundary fallback={
                        <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground p-4">
                          <AlertCircle className="w-6 h-6 mb-2 text-destructive" />
                          <p className="text-center">Unable to load chart data</p>
                          <p className="text-xs mt-1 text-center">The chart component encountered an error</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3"
                            onClick={() => window.location.reload()}
                          >
                            Reload Page
                          </Button>
                        </div>
                      }>
                        <LapTimeTrendsChart />
                      </ErrorBoundary>
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
                      <ErrorBoundary fallback={
                        <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground p-4">
                          <AlertCircle className="w-6 h-6 mb-2 text-destructive" />
                          <p className="text-center">Unable to load chart data</p>
                          <p className="text-xs mt-1 text-center">The chart component encountered an error</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3"
                            onClick={() => window.location.reload()}
                          >
                            Reload Page
                          </Button>
                        </div>
                      }>
                        {dashboardData.tire_wear ? (
                          <TireWearDistributionChart />
                        ) : (
                          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Tire wear data not available
                          </div>
                        )}
                      </ErrorBoundary>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ) : (
            !isLoading && (
              <Alert variant="default" className="mb-12 border-border/50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Charts Unavailable</AlertTitle>
                <AlertDescription>
                  Charts require dashboard data to be loaded. Please wait for data to load or check your connection.
                </AlertDescription>
              </Alert>
            )
          )}

          {/* Lap Split Delta Comparison Section */}
          {dashboardData && validateTrack(selectedTrack, tracks) ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-12"
            >
              <ErrorBoundary fallback={
                <Card className="bg-card/60 backdrop-blur-md border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Lap Split Delta Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex flex-col items-center justify-center text-sm text-muted-foreground p-4">
                      <AlertCircle className="w-6 h-6 mb-2 text-destructive" />
                      <p className="text-center">Unable to load comparison chart</p>
                      <p className="text-xs mt-1 text-center">The chart component encountered an error</p>
                    </div>
                  </CardContent>
                </Card>
              }>
                <LapSplitDeltaChart
                  track={selectedTrack}
                  race={selectedRace}
                  cars={comparisonCars}
                  refCar={selectedVehicle}
                />
              </ErrorBoundary>
            </motion.div>
          ) : (
            !isLoading && dashboardData && (
              <Alert variant="default" className="mb-12 border-border/50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Comparison Chart Unavailable</AlertTitle>
                <AlertDescription>
                  The comparison chart requires valid track and race data. Please check your selections.
                </AlertDescription>
              </Alert>
            )
          )}

          {/* Enhanced Driver Performance Section */}
          {dashboardData ? (
            <div className="grid lg:grid-cols-2 gap-6 mb-12">
              {/* Driver Performance Details */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <ErrorBoundary fallback={
                  <Card className="bg-card/60 backdrop-blur-md border-border/50 h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        Driver Performance Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex flex-col items-center justify-center text-sm text-muted-foreground p-4">
                        <AlertCircle className="w-6 h-6 mb-2 text-destructive" />
                        <p className="text-center">Unable to load performance details</p>
                      </div>
                    </CardContent>
                  </Card>
                }>
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
                              <span className="text-xs text-muted-foreground">Lap {dashboardData?.performance?.lap_number || selectedLap}/{dashboardData?.performance?.total_laps || 30}</span>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-lg">{dashboardData?.performance?.current_lap || "N/A"}</span>
                        </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50 border border-border/30 hover:bg-accent/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-primary" />
                        <div>
                          <span className="font-medium block">Best Lap</span>
                          <span className="text-xs text-muted-foreground">Personal best</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-lg text-primary">{dashboardData?.performance?.best_lap || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-accent/50 border border-border/30 hover:bg-accent/70 transition-colors">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <span className="font-medium block">Gap to Leader</span>
                          <span className="text-xs text-muted-foreground">{dashboardData?.gap_analysis?.overtaking_opportunity ? "Closing gap" : "Maintaining"}</span>
                        </div>
                      </div>
                      <span className={`font-mono font-bold text-lg ${dashboardData?.gap_analysis?.overtaking_opportunity ? "text-green-500" : ""}`}>
                        {dashboardData?.gap_analysis?.gap_to_leader || "N/A"}
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
                      <span className="font-mono font-bold text-lg text-primary">{dashboardData?.performance?.predicted_finish || "N/A"}</span>
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
                </ErrorBoundary>
              </motion.div>

            {/* Tire Wear Analysis */}
            {dashboardData?.tire_wear && typeof dashboardData.tire_wear.front_left === 'number' && typeof dashboardData.tire_wear.front_right === 'number' && typeof dashboardData.tire_wear.rear_left === 'number' && typeof dashboardData.tire_wear.rear_right === 'number' ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <ErrorBoundary fallback={
                  <Card className="bg-card/60 backdrop-blur-md border-border/50 h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-primary" />
                        Tire Wear Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex flex-col items-center justify-center text-sm text-muted-foreground p-4">
                        <AlertCircle className="w-6 h-6 mb-2 text-destructive" />
                        <p className="text-center">Unable to load tire wear analysis</p>
                      </div>
                    </CardContent>
                  </Card>
                }>
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
                              style={{ width: `${Math.min(100, Math.max(0, dashboardData.tire_wear.front_left))}%` }}
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
                              style={{ width: `${Math.min(100, Math.max(0, dashboardData.tire_wear.front_right))}%` }}
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
                              style={{ width: `${Math.min(100, Math.max(0, dashboardData.tire_wear.rear_left))}%` }}
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
                              style={{ width: `${Math.min(100, Math.max(0, dashboardData.tire_wear.rear_right))}%` }}
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
                      {dashboardData.tire_wear.confidence && typeof dashboardData.tire_wear.confidence === 'number' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>Model Confidence</span>
                            <span>{Math.round(dashboardData.tire_wear.confidence * 100)}%</span>
                          </div>
                          <div className="h-2 bg-background rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${Math.min(100, Math.max(0, dashboardData.tire_wear.confidence * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                </ErrorBoundary>
              </motion.div>
            ) : (
              !isLoading && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Card className="bg-card/60 backdrop-blur-md border-border/50 h-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gauge className="w-5 h-5 text-primary" />
                        Tire Wear Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex flex-col items-center justify-center text-sm text-muted-foreground p-4">
                        <AlertCircle className="w-4 h-4 mb-2" />
                        <p className="text-center">Tire wear data not available</p>
                        <p className="text-xs mt-1 text-center">Tire wear data is missing or incomplete</p>
                      </div>
                    </CardContent>
                    </Card>
                  </motion.div>
                )
              )
            }
            </div>
          ) : null}
          </div>
        </div>
    </main>
  );
};

export default Analytics;


