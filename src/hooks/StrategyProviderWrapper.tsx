// Wrapper component that integrates StrategyProvider with TelemetryProvider
import { ReactNode, useCallback } from 'react';
import { StrategyProvider } from './useStrategy';
import { useTelemetry } from './useTelemetry';

export function StrategyProviderWrapper({ children }: { children: ReactNode }) {
  // This component must be used within TelemetryProvider
  const telemetry = useTelemetry();

  const getTelemetryData = useCallback(() => {
    if (!telemetry?.selectedDriver || !telemetry?.trackData?.name) {
      return null;
    }
    return {
      track: telemetry.trackData.name,
      chassis: telemetry.selectedDriver.chassisNumber,
      currentLap: telemetry.currentLap
    };
  }, [telemetry?.selectedDriver, telemetry?.trackData?.name, telemetry?.currentLap]);

  return (
    <StrategyProvider getTelemetryData={getTelemetryData}>
      {children}
    </StrategyProvider>
  );
}



