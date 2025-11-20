import { Dashboard } from '@/components/dashboard/Dashboard';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { TelemetryProvider } from '@/hooks/useTelemetry';
import { StrategyProviderWrapper } from '@/hooks/StrategyProviderWrapper';

const DashboardPage = () => {
  return (
    <TelemetryProvider>
      <StrategyProviderWrapper>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="flex h-screen pt-16">
            <Sidebar />
            <main className="flex-1 overflow-hidden">
              <Dashboard />
            </main>
          </div>
        </div>
      </StrategyProviderWrapper>
    </TelemetryProvider>
  );
};

export default DashboardPage;
