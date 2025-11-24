import { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from 'react';
import { telemetryWS, TelemetryPoint } from '@/lib/api';
import { getSeedDrivers } from '@/lib/driverProfiles';
import { GRCarId, DEFAULT_VISIBLE_CARS } from '@/constants/cars';
import { generateAllCarsTelemetry } from '@/utils/mockTelemetry';
import { useDemoMode } from '@/hooks/useDemoMode';

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
  carType?: GRCarId;
  carNumber?: string;
}

interface Driver {
  carNumber: string;
  chassisNumber: string;
  position: number;
  gapToLeader: number;
  lastLapTime: number;
  bestLapTime: number;
  carType?: GRCarId;
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
  visibleCars: Record<GRCarId, boolean>;
  setVisibleCars: (cars: Record<GRCarId, boolean>) => void;
  toggleCarVisibility: (carId: GRCarId) => void;
  filteredTelemetryData: TelemetryData[];
  filteredDrivers: Driver[];
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
  const { isDemoMode } = useDemoMode();
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>(getSeedDrivers());
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(drivers[0]);
  const [currentLap, setCurrentLap] = useState(12);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [visibleCars, setVisibleCars] = useState<Record<GRCarId, boolean>>(DEFAULT_VISIBLE_CARS);
  const lastLapRef = useRef<number>(0);
  const mockDataInitialized = useRef(false);

  // Filter telemetry data based on visible cars
  const filteredTelemetryData = useMemo(() => {
    if (!telemetryData.length) return [];
    
    return telemetryData.filter((point) => {
      if (!point.carType) return true; // Show data without car type
      return visibleCars[point.carType] !== false;
    });
  }, [telemetryData, visibleCars]);

  // Filter drivers based on visible cars
  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      if (!driver.carType) return true; // Show drivers without car type
      return visibleCars[driver.carType] !== false;
    });
  }, [drivers, visibleCars]);

  const toggleCarVisibility = (carId: GRCarId) => {
    setVisibleCars((prev) => ({
      ...prev,
      [carId]: !prev[carId],
    }));
  };

  // Initialize mock data or connect to WebSocket
  useEffect(() => {
    // Always initialize with mock data for immediate display
    if (!mockDataInitialized.current) {
      const mockData = generateAllCarsTelemetry(Date.now() - 60000, 60000, 100);
      const convertedMockData = mockData.map((point) => ({
        timestamp: point.timestamp,
        speed: point.speed,
        throttle: point.throttle,
        brake: point.brake,
        gear: point.gear,
        rpm: point.rpm,
        lat: 30.1328 + (Math.random() - 0.5) * 0.01, // Mock GPS coordinates
        lng: -97.6411 + (Math.random() - 0.5) * 0.01,
        lapDistance: Math.random() * 5500,
        carType: point.carId,
        carNumber: point.carId === 'supra' ? '23' : point.carId === 'yaris' ? '7' : point.carId === 'gr86' ? '14' : '99',
      }));
      setTelemetryData(convertedMockData);
      mockDataInitialized.current = true;
      setConnectionStatus('connected');
    }

    // If not in demo mode, also try WebSocket connection
    if (!isDemoMode) {
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
    }
  }, [isDemoMode]);

  const value = {
    telemetryData,
    drivers,
    selectedDriver,
    setSelectedDriver,
    currentLap,
    sessionTime: '45:23.456', // TODO: Calculate from telemetry data
    connectionStatus,
    trackData: { name: 'Circuit of the Americas' }, // TODO: Get from backend or config
    visibleCars,
    setVisibleCars,
    toggleCarVisibility,
    filteredTelemetryData,
    filteredDrivers,
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
