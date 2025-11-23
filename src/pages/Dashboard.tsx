import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Wifi, WifiOff, AlertCircle, Sparkles, Activity } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { TireWearCard } from '@/components/dashboard/TireWearCard';
import { StrategyCard } from '@/components/dashboard/StrategyCard';
import { PerformanceCard } from '@/components/dashboard/PerformanceCard';
import { DemoButton } from '@/components/DemoButton';

import { useBackendConfig } from '@/hooks/useBackendConfig';
import { useLiveStream } from '@/hooks/useLiveStream';

export function Dashboard() {
  const { config, loading: configLoading, error: configError } = useBackendConfig();
  const [selectedTrack, setSelectedTrack] = useState('sebring');
  const [selectedRace, setSelectedRace] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(7);

  const { data, connected, error } = useLiveStream(
    selectedTrack,
    selectedRace,
    selectedVehicle
  );

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
            <p className="text-muted-foreground">Loading backend configuration...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (configError) {
    return (
      <div className="min-h-screen bg-background p-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_70%)]" />
        
        <Alert variant="destructive" className="max-w-2xl mx-auto mt-8 relative z-10 bg-card/60 backdrop-blur-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{configError}</p>
            <p className="text-sm">Make sure your Python backend is running and the API URL is configured via <code className="bg-muted px-1 rounded">VITE_BACKEND_URL</code> environment variable.</p>
            <p className="text-sm mt-2">Set <code className="bg-muted px-1 rounded">VITE_BACKEND_URL</code> to your backend URL (e.g., <code className="bg-muted px-1 rounded">https://your-backend.com</code>)</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Live Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              PitWall A.I. Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              {config?.tracks.find(t => t.id === selectedTrack)?.name || 'Track'} - Race {selectedRace} - Vehicle {selectedVehicle}
            </p>
          </div>
          <div className="flex items-center gap-3">
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

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant="destructive" className="mb-6 bg-card/60 backdrop-blur-md border-border/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Stream Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}

        {!connected && !error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert className="mb-6 bg-card/60 backdrop-blur-md border-border/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connecting to stream</AlertTitle>
              <AlertDescription>
                Waiting for live data stream from backend...
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {data ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
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

