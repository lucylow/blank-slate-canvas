import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Activity, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { TireWearCard } from '@/components/dashboard/TireWearCard';
import { StrategyCard } from '@/components/dashboard/StrategyCard';
import { PerformanceCard } from '@/components/dashboard/PerformanceCard';
import { TelemetryComparison } from '@/components/dashboard/TelemetryComparison';
import { CarTelemetryData } from '@/components/dashboard/CarTelemetryData';
import { DemoButton } from '@/components/DemoButton';

import { useBackendConfig } from '@/hooks/useBackendConfig';
import { useDemoMode } from '@/hooks/useDemoMode';
import { generateDemoDashboardData } from '@/lib/mockDemoData';
import type { DashboardData } from '@/lib/types';

export function Dashboard() {
  const { isDemoMode } = useDemoMode();
  const { 
    config, 
    loading: configLoading, 
    error: configError,
    retry: retryConfig,
    retryCount: configRetryCount,
    maxRetries: configMaxRetries
  } = useBackendConfig();
  
  
  const [selectedTrack, setSelectedTrack] = useState('sebring');
  const [selectedRace, setSelectedRace] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(7);
  const [currentLap, setCurrentLap] = useState(12);

  // Use mock data instead of live stream
  const mockData = useMemo(() => {
    const baseData = generateDemoDashboardData(
      selectedTrack,
      selectedRace,
      selectedVehicle,
      currentLap
    );
    
    // Convert to DashboardData format expected by components
    const dashboardData: DashboardData = {
      meta: {
        ok: true,
        track: selectedTrack,
        lap: currentLap,
        total_laps: baseData.total_laps || 30,
        enhanced_features: false,
      },
      tire_wear: baseData.tire_wear,
      performance: baseData.performance,
      gap_analysis: baseData.gap_analysis,
      strategy: baseData.strategy || {
        recommended_strategy: '2-stop strategy',
        strategies: [
          {
            name: '2-stop strategy',
            pit_lap: 12,
            expected_finish: 'P3',
            confidence: 0.85,
            reasoning: 'Optimal balance between tire wear and track position',
          },
          {
            name: '1-stop strategy',
            pit_lap: 18,
            expected_finish: 'P5',
            confidence: 0.70,
            reasoning: 'Higher tire degradation risk but track position advantage',
          },
        ],
      },
    };
    
    return dashboardData;
  }, [selectedTrack, selectedRace, selectedVehicle, currentLap]);

  // Simulate live data updates by incrementing lap periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLap((prev) => {
        const maxLap = 30;
        return prev >= maxLap ? 1 : prev + 1;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Mock connection status - always connected for mock data
  const connected = true;
  const data = mockData;


  if (configLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        
        <Card className="p-8 bg-card/60 backdrop-blur-md border-border/50 relative z-10">
          <CardContent className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-muted-foreground mb-1">Loading backend configuration...</p>
              {configRetryCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Retry attempt {configRetryCount}/{configMaxRetries}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // If config fails but we're in demo mode or want to continue anyway, show warning but allow continuation
  const showConfigError = configError && !isDemoMode;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Show config error as warning if in demo mode, otherwise show full error */}
        {configError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert 
              variant={showConfigError ? "destructive" : "default"} 
              className="bg-card/60 backdrop-blur-md border-border/50"
            >
              <div className="flex items-start gap-3">
                <div className={getErrorColor(configError.type)}>
                  {getErrorIcon(configError.type)}
                </div>
                <div className="flex-1">
                  <AlertTitle className="flex items-center gap-2">
                    {isDemoMode ? 'Backend Configuration Warning' : 'Configuration Error'}
                    {configError.statusCode && (
                      <span className="text-xs font-normal text-muted-foreground">
                        (HTTP {configError.statusCode})
                      </span>
                    )}
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-3">
                    <div>
                      <p className="font-medium mb-1">{configError.message}</p>
                      {configError.details && (
                        <p className="text-sm text-muted-foreground mt-1">{configError.details}</p>
                      )}
                      {isDemoMode && (
                        <p className="text-sm text-primary mt-2 font-medium">
                          Demo mode is active - dashboard will continue with demo data.
                        </p>
                      )}
                    </div>
                    
                    {showConfigError && (
                      <div className="bg-muted/50 p-3 rounded-md text-sm space-y-2">
                        <p className="font-medium">Troubleshooting steps:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                          <li>Verify your Python backend is running</li>
                          <li>Check the API URL configuration via <code className="bg-background px-1 rounded">VITE_BACKEND_URL</code> environment variable</li>
                          <li>Ensure the backend is accessible from your network</li>
                          <li>Check backend logs for detailed error information</li>
                          <li>Try enabling demo mode using the Demo button above</li>
                          {configError.type === 'network' && (
                            <li>Verify your internet connection and firewall settings</li>
                          )}
                          {configError.type === 'timeout' && (
                            <li>The backend may be overloaded - try again in a few moments</li>
                          )}
                          {configError.statusCode === 404 && (
                            <li>The configuration endpoint may not be available on this backend version</li>
                          )}
                          {configError.statusCode && configError.statusCode >= 500 && (
                            <li>The backend server encountered an internal error - check server logs</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {configError.retryable && (
                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          onClick={retryConfig}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Retry Connection
                        </Button>
                        {configRetryCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Attempt {configRetryCount}/{configMaxRetries}
                          </span>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}

        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Mock Data Dashboard
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              PitWall A.I. Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              {config?.tracks?.find(t => t.id === selectedTrack)?.name || selectedTrack.charAt(0).toUpperCase() + selectedTrack.slice(1)} - Race {selectedRace} - Vehicle {selectedVehicle}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <DemoButton />
            <motion.div 
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 bg-blue-500/10 text-blue-500 border border-blue-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">
                Mock Data
              </span>
            </motion.div>
          </div>
        </motion.header>

        {/* Mock Data Info */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <AlertTitle className="text-blue-500">Using Mock Data</AlertTitle>
            <AlertDescription className="text-sm">
              The dashboard is currently displaying mock data. Data updates every 5 seconds to simulate live telemetry.
              Track: {selectedTrack.charAt(0).toUpperCase() + selectedTrack.slice(1)} | Race: {selectedRace} | Vehicle: {selectedVehicle} | Lap: {currentLap}
            </AlertDescription>
          </Alert>
        </motion.div>



        {data ? (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
            >
              <div className="lg:col-span-2 grid grid-cols-1 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <PerformanceCard performance={data.performance} meta={data.meta} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <TireWearCard wear={data.tire_wear} />
                </motion.div>
              </div>
              <motion.div 
                className="lg:col-span-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <StrategyCard strategy={data.strategy} />
              </motion.div>
            </motion.div>
            
            {/* Telemetry Comparison Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <TelemetryComparison />
            </motion.div>

            {/* Car Telemetry Data Section */}
            <CarTelemetryData />
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="p-12 bg-card/60 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all duration-300">
              <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Waiting for live data</h3>
                  <p className="text-muted-foreground">
                    {connected 
                      ? 'Stream connected, waiting for data...' 
                      : 'Connecting to backend stream...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
