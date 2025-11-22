import { Dashboard } from '@/components/dashboard/Dashboard';
import { TelemetryProvider } from '@/hooks/useTelemetry';
import { StrategyProviderWrapper } from '@/hooks/StrategyProviderWrapper';
import { useEffect, useState } from 'react';
import { checkHealth } from '@/api/pitwall';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDemoMode } from '@/hooks/useDemoMode';
import { checkDemoHealth } from '@/api/demo';

const DashboardPage = () => {
  const { isDemoMode } = useDemoMode();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

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
    const interval = setInterval(checkBackend, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isDemoMode]);

  return (
    <TelemetryProvider>
      <StrategyProviderWrapper>
        <div className="h-full flex flex-col">
          {/* Status Bar */}
          <div className="px-6 pt-4 pb-2 flex items-center justify-end border-b border-border/50">
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
          <div className="flex-1 overflow-hidden">
            <Dashboard />
          </div>
        </div>
      </StrategyProviderWrapper>
    </TelemetryProvider>
  );
};

export default DashboardPage;
