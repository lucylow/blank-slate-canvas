import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Wifi, WifiOff, AlertCircle, Sparkles, Activity, RefreshCw, XCircle, Clock, Network, Server, FileX } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { TireWearCard } from '@/components/dashboard/TireWearCard';
import { StrategyCard } from '@/components/dashboard/StrategyCard';
import { PerformanceCard } from '@/components/dashboard/PerformanceCard';
import { TelemetryComparison } from '@/components/dashboard/TelemetryComparison';
import { DemoButton } from '@/components/DemoButton';

import { useBackendConfig } from '@/hooks/useBackendConfig';
import { useLiveStream } from '@/hooks/useLiveStream';
import { useDemoMode } from '@/hooks/useDemoMode';
import { getBackendUrl } from '@/utils/backendUrl';

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
  
  // Get the current backend URL for display
  const backendUrl = getBackendUrl();
  const viteBackendUrl = import.meta.env.VITE_BACKEND_URL;
  const displayBackendUrl = viteBackendUrl || backendUrl || (import.meta.env.DEV ? 'http://localhost:8000 (via Vite proxy)' : 'Relative path (/api)');
  
  const [selectedTrack, setSelectedTrack] = useState('sebring');
  const [selectedRace, setSelectedRace] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(7);

  const { 
    data, 
    connected, 
    error: streamError,
    reconnectAttempts,
    retry: retryStream,
    maxReconnectAttempts
  } = useLiveStream(
    selectedTrack,
    selectedRace,
    selectedVehicle
  );

  const getErrorIcon = (errorType?: string) => {
    switch (errorType) {
      case 'network':
        return <Network className="h-4 w-4" />;
      case 'timeout':
        return <Clock className="h-4 w-4" />;
      case 'server':
        return <Server className="h-4 w-4" />;
      case 'parse':
        return <FileX className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getErrorColor = (errorType?: string) => {
    switch (errorType) {
      case 'network':
        return 'text-blue-500';
      case 'timeout':
        return 'text-yellow-500';
      case 'server':
        return 'text-red-500';
      case 'parse':
        return 'text-orange-500';
      default:
        return 'text-red-500';
    }
  };

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
                {isDemoMode ? 'Demo Dashboard' : 'Live Dashboard'}
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
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                connected 
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20 shadow-lg shadow-green-500/20' 
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}
              animate={connected ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </motion.div>
          </div>
        </motion.header>

        {/* Backend URL Configuration Display */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Server className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Backend URL</p>
                    <p className="text-sm font-mono text-foreground break-all">
                      {displayBackendUrl}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {viteBackendUrl ? (
                    <span className="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                      VITE_BACKEND_URL
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded bg-muted border border-border">
                      Auto-detected
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {streamError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Alert 
              variant={streamError.type === 'server' || streamError.type === 'parse' ? "destructive" : "default"} 
              className="bg-card/60 backdrop-blur-md border-border/50"
            >
              <div className="flex items-start gap-3">
                <div className={getErrorColor(streamError.type)}>
                  {getErrorIcon(streamError.type)}
                </div>
                <div className="flex-1">
                  <AlertTitle className="flex items-center gap-2">
                    Stream Error
                    {reconnectAttempts > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">
                        (Reconnect attempt {reconnectAttempts}/{maxReconnectAttempts})
                      </span>
                    )}
                  </AlertTitle>
                  <AlertDescription className="mt-2 space-y-3">
                    <div>
                      <p className="font-medium mb-1">{streamError.message}</p>
                      {streamError.details && (
                        <p className="text-sm text-muted-foreground mt-1">{streamError.details}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Error occurred at {new Date(streamError.timestamp).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="bg-muted/50 p-3 rounded-md text-sm space-y-2">
                      <p className="font-medium">Possible solutions:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {streamError.type === 'network' && (
                          <>
                            <li>Check your network connection</li>
                            <li>Verify the backend server is accessible</li>
                            <li>Check firewall or proxy settings</li>
                          </>
                        )}
                        {streamError.type === 'timeout' && (
                          <>
                            <li>The backend may be slow to respond</li>
                            <li>Try refreshing the connection</li>
                            <li>Check backend server load and performance</li>
                          </>
                        )}
                        {streamError.type === 'server' && (
                          <>
                            <li>Backend server encountered an error</li>
                            <li>Check backend logs for details</li>
                            <li>The selected track/race/vehicle combination may be invalid</li>
                          </>
                        )}
                        {streamError.type === 'parse' && (
                          <>
                            <li>Data format may have changed</li>
                            <li>Backend version may be incompatible</li>
                            <li>Check browser console for details</li>
                          </>
                        )}
                        {streamError.type === 'unknown' && (
                          <>
                            <li>An unexpected error occurred</li>
                            <li>Try refreshing the page</li>
                            <li>Check browser console for more details</li>
                          </>
                        )}
                      </ul>
                    </div>

                    {streamError.retryable && (
                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          onClick={retryStream}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Retry Stream
                        </Button>
                        {reconnectAttempts > 0 && reconnectAttempts < maxReconnectAttempts && (
                          <span className="text-xs text-muted-foreground">
                            Auto-retrying... ({reconnectAttempts}/{maxReconnectAttempts})
                          </span>
                        )}
                        {reconnectAttempts >= maxReconnectAttempts && (
                          <span className="text-xs text-yellow-500">
                            Max retry attempts reached. Please retry manually.
                          </span>
                        )}
                      </div>
                    )}

                    {!streamError.retryable && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <XCircle className="w-4 h-4" />
                        <span>This error cannot be automatically retried. Please check the issue and try again.</span>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>

            {/* Additional context alerts based on error type */}
            {streamError.type === 'network' && (
              <Alert className="mt-3 bg-blue-500/10 border-blue-500/20">
                <Network className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-500">Network Connectivity Issue</AlertTitle>
                <AlertDescription className="text-sm">
                  Unable to establish or maintain connection to the backend stream. This is typically a network or server availability issue.
                </AlertDescription>
              </Alert>
            )}

            {streamError.type === 'timeout' && (
              <Alert className="mt-3 bg-yellow-500/10 border-yellow-500/20">
                <Clock className="h-4 w-4 text-yellow-500" />
                <AlertTitle className="text-yellow-500">Connection Timeout</AlertTitle>
                <AlertDescription className="text-sm">
                  The connection timed out. The backend may be experiencing high load or the network connection is slow.
                </AlertDescription>
              </Alert>
            )}
          </motion.div>
        )}

        {!connected && !streamError && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert className="mb-6 bg-card/60 backdrop-blur-md border-border/50">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <div className="flex-1">
                  <AlertTitle>Connecting to stream</AlertTitle>
                  <AlertDescription>
                    Establishing connection to live data stream from backend...
                    {reconnectAttempts > 0 && (
                      <span className="block mt-1 text-xs text-muted-foreground">
                        Reconnection attempt {reconnectAttempts}/{maxReconnectAttempts}
                      </span>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </motion.div>
        )}

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
