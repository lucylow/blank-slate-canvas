# DashboardPage.tsx Code Structure

```typescript
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { TelemetryProvider } from '@/hooks/useTelemetry';
import { StrategyProvider } from '@/hooks/useStrategy';

const DashboardPage = () => {
  return (
    <TelemetryProvider>
      <StrategyProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="flex h-screen pt-16">
            <Sidebar />
            <main className="flex-1 overflow-hidden">
              <Dashboard />
            </main>
          </div>
        </div>
      </StrategyProvider>
    </TelemetryProvider>
  );
};

export default DashboardPage;
```

## Key Components Identified
1. **Dashboard** - Main dashboard component
2. **Header** - Navigation header
3. **Sidebar** - Side navigation
4. **TelemetryProvider** - Context provider for telemetry data
5. **StrategyProvider** - Context provider for strategy data

## Hooks Used
- `useTelemetry` - Custom hook for telemetry data management
- `useStrategy` - Custom hook for strategy optimization

These providers suggest the frontend expects real-time data streams for telemetry and strategy calculations.
