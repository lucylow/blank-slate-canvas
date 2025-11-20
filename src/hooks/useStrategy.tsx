import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient, TirePredictionResponse } from '@/lib/api';

interface Alert {
  severity: 'high' | 'medium' | 'low';
  message: string;
}

interface PitStop {
  lap: number;
  tyreCompound: string;
}

interface Strategy {
  tireWear: {
    current: number;
  };
  pitWindow: {
    start: number;
    end: number;
  };
  currentPosition: number;
}

interface Predictions {
  pitStops: PitStop[];
  finishPosition: number;
  gapToLeader: string;
}

interface StrategyContextType {
  strategy: Strategy;
  predictions: Predictions;
  alerts: Alert[];
  isLoading: boolean;
  error: string | null;
  refreshPrediction: (track?: string, chassis?: string, currentLap?: number) => Promise<void>;
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

// Convert track name to API format (lowercase, replace spaces with underscores)
function normalizeTrackName(trackName: string): string {
  return trackName.toLowerCase().replace(/\s+/g, '_');
}

interface StrategyProviderProps {
  children: ReactNode;
  // Optional props to allow standalone usage or integration with TelemetryProvider
  defaultTrack?: string;
  defaultChassis?: string;
  defaultLap?: number;
  // Optional callback to get telemetry data when available
  getTelemetryData?: () => { track?: string; chassis?: string; currentLap?: number } | null;
}

export function StrategyProvider({ 
  children, 
  defaultTrack = 'circuit_of_the_americas',
  defaultChassis = 'GR001',
  defaultLap = 12,
  getTelemetryData
}: StrategyProviderProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [strategy, setStrategy] = useState<Strategy>({
    tireWear: { current: 71 },
    pitWindow: { start: 15, end: 17 },
    currentPosition: 3
  });
  const [predictions, setPredictions] = useState<Predictions>({
    pitStops: [
      { lap: 16, tyreCompound: 'Soft' },
      { lap: 32, tyreCompound: 'Medium' }
    ],
    finishPosition: 3,
    gapToLeader: '+1.24'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTirePrediction = useCallback(async (track?: string, chassis?: string, currentLap?: number) => {
    // Get data from telemetry if available, otherwise use provided params or defaults
    const telemetryData = getTelemetryData?.();
    const finalTrack = track || telemetryData?.track || defaultTrack;
    const finalChassis = chassis || telemetryData?.chassis || defaultChassis;
    const finalLap = currentLap ?? telemetryData?.currentLap ?? defaultLap;

    if (!finalTrack || !finalChassis) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const normalizedTrack = normalizeTrackName(finalTrack);
      
      const response: TirePredictionResponse = await apiClient.fetchTirePrediction(normalizedTrack, finalChassis);

      // Convert API response to frontend format
      setStrategy({
        tireWear: {
          current: Math.max(0, 100 - (response.predicted_loss_per_lap_s * finalLap * 10)) // Estimate current wear
        },
        pitWindow: {
          start: Math.max(1, response.recommended_pit_lap - 1),
          end: response.recommended_pit_lap + 1
        },
        currentPosition: 3 // TODO: Get from telemetry
      });

      setPredictions({
        pitStops: [
          { lap: response.recommended_pit_lap, tyreCompound: 'Medium' } // TODO: Get compound from backend
        ],
        finishPosition: 3, // TODO: Calculate from predictions
        gapToLeader: `+${(response.predicted_loss_per_lap_s * response.laps_until_0_5s_loss).toFixed(2)}s`
      });

      // Convert explanations to alerts
      const newAlerts: Alert[] = response.explanation.map((explanation) => {
        let severity: 'high' | 'medium' | 'low' = 'medium';
        if (response.laps_until_0_5s_loss <= 2) {
          severity = 'high';
        } else if (response.laps_until_0_5s_loss <= 5) {
          severity = 'medium';
        } else {
          severity = 'low';
        }
        return {
          severity,
          message: explanation
        };
      });

      // Add pit stop recommendation if critical
      if (response.laps_until_0_5s_loss <= 3) {
        newAlerts.unshift({
          severity: 'high',
          message: `Critical: Recommended pit stop on lap ${response.recommended_pit_lap} (${response.laps_until_0_5s_loss} laps until 0.5s loss)`
        });
      }

      setAlerts(newAlerts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tire prediction';
      setError(errorMessage);
      console.error('Error fetching tire prediction:', err);
      
      // Set fallback alerts
      setAlerts([
        { severity: 'medium', message: 'Unable to fetch real-time predictions. Using cached data.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [defaultTrack, defaultChassis, defaultLap, getTelemetryData]);

  // Fetch prediction on mount and when telemetry data changes
  useEffect(() => {
    fetchTirePrediction();
    
    // Refresh prediction every 30 seconds
    const interval = setInterval(() => {
      fetchTirePrediction();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTirePrediction]);

  const value = {
    strategy,
    predictions,
    alerts,
    isLoading,
    error,
    refreshPrediction: fetchTirePrediction
  };

  return (
    <StrategyContext.Provider value={value}>
      {children}
    </StrategyContext.Provider>
  );
}

export function useStrategy() {
  const context = useContext(StrategyContext);
  if (context === undefined) {
    throw new Error('useStrategy must be used within a StrategyProvider');
  }
  return context;
}
