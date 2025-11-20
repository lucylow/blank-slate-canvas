// Wrapper component that integrates StrategyProvider with TelemetryProvider
import { ReactNode } from 'react';
import { StrategyProvider } from './useStrategy';
import { useTelemetry } from './useTelemetry';

export function StrategyProviderWrapper({ children }: { children: ReactNode }) {
  const telemetry = useTelemetry();

  const getTelemetryData = () => {
    if (!telemetry.selectedDriver || !telemetry.trackData.name) {
      return null;
    }
    return {
      track: telemetry.trackData.name,
      chassis: telemetry.selectedDriver.chassisNumber,
      currentLap: telemetry.currentLap
    };
  };

  return (
    <StrategyProvider getTelemetryData={getTelemetryData}>
      {children}
    </StrategyProvider>
  );
}

