import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { telemetryWS, TelemetryPoint } from '@/lib/api';

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

// Convert backend TelemetryPoint to frontend TelemetryData format
function convertTelemetryPoint(point: TelemetryPoint): TelemetryData {
  return {
    timestamp: point.timestamp || Date.now(),
    speed: point.speed,
    throttle: point.throttle * 100, // Convert 0-1 to 0-100
    brake: point.brake * 100, // Convert 0-1 to 0-100
    gear: point.gear || 0,
    rpm: point.rpm || 0,
    lat: point.lat || 0,
    lng: point.lng || 0,
    lapDistance: point.lapDistance || 0,
  };
}

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
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const lastLapRef = useRef<number>(0);

  // Connect to WebSocket and handle telemetry data
  useEffect(() => {
    // Set up connection status handler
    telemetryWS.setConnectionChangeHandler((status) => {
      setConnectionStatus(status);
    });

    // Connect to WebSocket
    telemetryWS.connect();

    // Subscribe to telemetry data
    const unsubscribe = telemetryWS.subscribe((point: TelemetryPoint) => {
      const converted = convertTelemetryPoint(point);
      
      // Update current lap when it changes
      if (point.lap !== lastLapRef.current) {
        lastLapRef.current = point.lap;
        setCurrentLap(point.lap);
      }

      // Add to telemetry data array (keep last 1000 points)
      setTelemetryData(prev => [...prev.slice(-999), converted]);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      telemetryWS.disconnect();
    };
  }, []);

  const value = {
    telemetryData,
    drivers,
    selectedDriver,
    setSelectedDriver,
    currentLap,
    sessionTime: '45:23.456', // TODO: Calculate from telemetry data
    connectionStatus,
    trackData: { name: 'Circuit of the Americas' } // TODO: Get from backend or config
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
