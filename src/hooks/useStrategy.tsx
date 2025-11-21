import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getLiveDashboard, analyzeTireWear, TireWearRequest } from '@/api/pitwall';

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

    if (!finalTrack) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const normalizedTrack = normalizeTrackName(finalTrack);
      
      // Extract vehicle number from chassis (e.g., "GR86-016-7" -> 7) or use default
      const vehicleNumber = finalChassis ? parseInt(finalChassis.split('-').pop() || '7') : 7;
      const race = 1; // Default to race 1
      
      // Use the main dashboard endpoint which provides all data
      const dashboardData = await getLiveDashboard(normalizedTrack, race, vehicleNumber, finalLap);

      // Convert API response to frontend format
      const avgTireWear = (
        dashboardData.tire_wear.front_left +
        dashboardData.tire_wear.front_right +
        dashboardData.tire_wear.rear_left +
        dashboardData.tire_wear.rear_right
      ) / 4;

      setStrategy({
        tireWear: {
          current: Math.max(0, 100 - avgTireWear) // Tire wear is already a percentage
        },
        pitWindow: {
          start: dashboardData.tire_wear.pit_window_optimal?.[0] || 15,
          end: dashboardData.tire_wear.pit_window_optimal?.[1] || 17
        },
        currentPosition: dashboardData.gap_analysis.position
      });

      // Generate pit stops from strategy recommendations if available
      const pitStops = dashboardData.tire_wear.pit_window_optimal?.map(lap => ({
        lap,
        tyreCompound: 'Medium' // TODO: Get compound from backend
      })) || [{ lap: 15, tyreCompound: 'Medium' }];

      setPredictions({
        pitStops,
        finishPosition: dashboardData.performance.position,
        gapToLeader: dashboardData.gap_analysis.gap_to_leader
      });

      // Generate alerts from tire wear and gap analysis
      const newAlerts: Alert[] = [];
      
      // Tire wear alerts
      if (avgTireWear > 80) {
        newAlerts.push({
          severity: 'high',
          message: `Critical tire wear: ${avgTireWear.toFixed(1)}% remaining. Pit window: Laps ${dashboardData.tire_wear.pit_window_optimal?.join('-') || '15-17'}`
        });
      } else if (avgTireWear > 60) {
        newAlerts.push({
          severity: 'medium',
          message: `Tire wear: ${avgTireWear.toFixed(1)}% remaining. Monitor for pit stop opportunity.`
        });
      }

      // Gap analysis alerts
      if (dashboardData.gap_analysis.overtaking_opportunity) {
        newAlerts.push({
          severity: 'low',
          message: `Overtaking opportunity ahead. Gap: ${dashboardData.gap_analysis.gap_to_ahead || 'N/A'}`
        });
      }

      if (dashboardData.gap_analysis.under_pressure) {
        newAlerts.push({
          severity: 'medium',
          message: `Under pressure from behind. Gap: ${dashboardData.gap_analysis.gap_to_behind || 'N/A'}`
        });
      }

      setAlerts(newAlerts.length > 0 ? newAlerts : [
        { severity: 'low', message: 'All systems normal. Strategy on track.' }
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
      setError(errorMessage);
      console.error('Error fetching dashboard data:', err);
      
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
