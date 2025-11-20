import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TelemetryData {
  timestamp: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  rpm: number;
  lat: number;
  lng: number;
  lapDistance: number;
}

interface Driver {
  carNumber: string;
  chassisNumber: string;
  position: number;
  gapToLeader: number;
  lastLapTime: number;
  bestLapTime: number;
}

interface TelemetryContextType {
  telemetryData: TelemetryData[];
  drivers: Driver[];
  selectedDriver: Driver | null;
  setSelectedDriver: (driver: Driver) => void;
  currentLap: number;
  sessionTime: string;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  trackData: { name: string };
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([
    { carNumber: '23', chassisNumber: 'GR001', position: 1, gapToLeader: 0, lastLapTime: 123.456, bestLapTime: 122.890 },
    { carNumber: '45', chassisNumber: 'GR002', position: 2, gapToLeader: 1.234, lastLapTime: 123.890, bestLapTime: 123.123 },
    { carNumber: '78', chassisNumber: 'GR003', position: 3, gapToLeader: 2.567, lastLapTime: 124.234, bestLapTime: 123.456 },
    { carNumber: '12', chassisNumber: 'GR004', position: 4, gapToLeader: 4.123, lastLapTime: 124.567, bestLapTime: 123.789 },
    { carNumber: '67', chassisNumber: 'GR005', position: 5, gapToLeader: 6.789, lastLapTime: 125.123, bestLapTime: 124.012 },
  ]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(drivers[0]);
  const [currentLap, setCurrentLap] = useState(12);
  const [connectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');

  useEffect(() => {
    const interval = setInterval(() => {
      const newData: TelemetryData = {
        timestamp: Date.now(),
        speed: Math.random() * 100 + 150,
        throttle: Math.random() * 100,
        brake: Math.random() * 50,
        gear: Math.floor(Math.random() * 6) + 1,
        rpm: Math.random() * 3000 + 5000,
        lat: 0,
        lng: 0,
        lapDistance: Math.random() * 5000
      };
      setTelemetryData(prev => [...prev.slice(-999), newData]);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const value = {
    telemetryData,
    drivers,
    selectedDriver,
    setSelectedDriver,
    currentLap,
    sessionTime: '45:23.456',
    connectionStatus,
    trackData: { name: 'Circuit of the Americas' }
  };

  return (
    <TelemetryContext.Provider value={value}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (context === undefined) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
