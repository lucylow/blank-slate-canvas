import { createContext, useContext, useState, ReactNode } from 'react';

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
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

export function StrategyProvider({ children }: { children: ReactNode }) {
  const [alerts] = useState<Alert[]>([
    { severity: 'high', message: 'High tire degradation detected - consider pit stop in 3-5 laps' },
    { severity: 'medium', message: 'Driver losing time in Sector 2 - focus on braking points' }
  ]);

  const value = {
    strategy: {
      tireWear: { current: 71 },
      pitWindow: { start: 15, end: 17 },
      currentPosition: 3
    },
    predictions: {
      pitStops: [
        { lap: 16, tyreCompound: 'Soft' },
        { lap: 32, tyreCompound: 'Medium' }
      ],
      finishPosition: 3,
      gapToLeader: '+1.24'
    },
    alerts
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
