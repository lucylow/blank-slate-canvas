import { useState } from 'react';
import { useBackendConfig } from '@/hooks/useBackendConfig';
import { useLiveStream } from '@/hooks/useLiveStream';
import { TireWearCard } from '@/components/dashboard/TireWearCard';
import { StrategyCard } from '@/components/dashboard/StrategyCard';
import { PerformanceCard } from '@/components/dashboard/PerformanceCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8">
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
      <div className="min-h-screen bg-background p-4">
        <Alert variant="destructive" className="max-w-2xl mx-auto mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{configError}</p>
            <p className="text-sm">Make sure your Python backend is running and the API URL is configured via <code className="bg-muted px-1 rounded">VITE_API_BASE_URL</code> environment variable.</p>
            <p className="text-sm mt-2">Set <code className="bg-muted px-1 rounded">VITE_API_BASE_URL</code> to your backend URL (e.g., <code className="bg-muted px-1 rounded">https://your-backend.com</code>)</p>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              PitWall A.I. Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              {config?.tracks.find(t => t.id === selectedTrack)?.name || 'Track'} - Race {selectedRace} - Vehicle {selectedVehicle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              connected 
                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
            }`}>
              {connected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="text-sm font-medium">
                {connected ? 'Live' : 'Disconnected'}
              </span>
            </div>
          </div>
        </header>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Stream Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!connected && !error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connecting to stream</AlertTitle>
            <AlertDescription>
              Waiting for live data stream from backend...
            </AlertDescription>
          </Alert>
        )}

        {data ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 gap-6">
              <PerformanceCard performance={data.performance} meta={data.meta} />
              <TireWearCard wear={data.tire_wear} />
            </div>
            <div className="lg:col-span-1">
              <StrategyCard strategy={data.strategy} />
            </div>
          </div>
        ) : (
          <Card className="p-12">
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
        )}
      </div>
    </div>
  );
}

