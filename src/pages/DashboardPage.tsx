import { Dashboard } from '../components/dashboard/Dashboard';
import { useEffect, useState } from 'react';
import { checkHealth } from '@/api/pitwall';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Play, Wifi } from 'lucide-react';
import { useDemoMode } from '@/hooks/useDemoMode';
import { checkDemoHealth } from '@/api/demo';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TelemetryProvider } from '@/hooks/useTelemetry';
import { StrategyProviderWrapper } from '@/hooks/StrategyProviderWrapper';

// Dashboard component requires both TelemetryProvider and StrategyProvider
// StrategyProviderWrapper must be inside TelemetryProvider since it uses useTelemetry()

const DashboardPage = () => {
  const { isDemoMode, setIsDemoMode } = useDemoMode();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    // Start in demo mode by default
    if (!isDemoMode) {
      setIsDemoMode(true);
    }
  }, []);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        if (isDemoMode) {
          await checkDemoHealth();
        } else {
          await checkHealth();
        }
        setBackendStatus('connected');
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, [isDemoMode]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        {/* Status Bar with Mode Toggle */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b border-border/50 flex-shrink-0 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              variant={isDemoMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsDemoMode(true)}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              Demo Mode
            </Button>
            <Button
              variant={!isDemoMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsDemoMode(false)}
              className="gap-2"
            >
              <Wifi className="w-4 h-4" />
              Live Data
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={isDemoMode ? "default" : "outline"} className="text-xs">
              {isDemoMode ? "Mock API" : "Live API"}
            </Badge>
            {backendStatus === 'disconnected' && !isDemoMode && (
              <Alert variant="destructive" className="py-2 px-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Backend disconnected
                </AlertDescription>
              </Alert>
            )}
            {backendStatus === 'connected' && !isDemoMode && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Backend connected</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* TelemetryProvider must wrap StrategyProviderWrapper since StrategyProviderWrapper uses useTelemetry() */}
          <TelemetryProvider>
            {/* StrategyProviderWrapper provides StrategyProvider context to Dashboard */}
            <StrategyProviderWrapper>
              <Dashboard />
            </StrategyProviderWrapper>
          </TelemetryProvider>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardPage;
