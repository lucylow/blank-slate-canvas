import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  Gauge, 
  Zap, 
  Activity, 
  TrendingUp,
  Car
} from 'lucide-react';
import { grCars } from '@/lib/grCarData';
import type { TrackId } from '@/lib/grCarTypes';

interface TelemetryDataPoint {
  timestamp: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  rpm: number;
}

interface CarTelemetryData {
  carModel: string;
  data: TelemetryDataPoint[];
  color: string;
}

interface TelemetryComparisonChartsProps {
  selectedTrack?: TrackId;
  selectedCars?: string[];
}

// Generate mock telemetry data for a car on a specific track
function generateMockTelemetryData(
  carModel: string, 
  trackId: TrackId, 
  dataPoints: number = 100
): TelemetryDataPoint[] {
  const data: TelemetryDataPoint[] = [];
  const baseTime = Date.now();
  
  // Different characteristics per car model
  const carCharacteristics: Record<string, {
    maxSpeed: number;
    maxRpm: number;
    throttleAggressiveness: number;
    brakeFrequency: number;
  }> = {
    'GR Supra': { maxSpeed: 280, maxRpm: 7000, throttleAggressiveness: 0.9, brakeFrequency: 0.3 },
    'GR Yaris': { maxSpeed: 240, maxRpm: 7500, throttleAggressiveness: 0.85, brakeFrequency: 0.35 },
    'GR86': { maxSpeed: 220, maxRpm: 7400, throttleAggressiveness: 0.8, brakeFrequency: 0.4 },
    'GR Corolla': { maxSpeed: 250, maxRpm: 6500, throttleAggressiveness: 0.88, brakeFrequency: 0.32 },
  };

  const characteristics = carCharacteristics[carModel] || {
    maxSpeed: 240,
    maxRpm: 7000,
    throttleAggressiveness: 0.85,
    brakeFrequency: 0.35,
  };

  // Track-specific variations
  const trackVariations: Record<TrackId, {
    avgSpeed: number;
    speedVariation: number;
    cornerFrequency: number;
  }> = {
    'sonoma': { avgSpeed: 0.75, speedVariation: 0.3, cornerFrequency: 0.4 },
    'road-america': { avgSpeed: 0.9, speedVariation: 0.2, cornerFrequency: 0.25 },
    'vir': { avgSpeed: 0.7, speedVariation: 0.35, cornerFrequency: 0.45 },
    'cota': { avgSpeed: 0.85, speedVariation: 0.25, cornerFrequency: 0.3 },
    'barber': { avgSpeed: 0.65, speedVariation: 0.4, cornerFrequency: 0.5 },
    'indianapolis': { avgSpeed: 0.95, speedVariation: 0.15, cornerFrequency: 0.2 },
    'sebring': { avgSpeed: 0.8, speedVariation: 0.3, cornerFrequency: 0.35 },
  };

  const trackVar = trackVariations[trackId] || trackVariations['sonoma'];

  for (let i = 0; i < dataPoints; i++) {
    const progress = i / dataPoints;
    const timestamp = baseTime + i * 100; // 100ms intervals
    
    // Simulate lap progression with speed variations
    const lapPosition = (progress * 2 * Math.PI); // Full lap cycle
    const speedVariation = Math.sin(lapPosition) * trackVar.speedVariation;
    const baseSpeed = characteristics.maxSpeed * trackVar.avgSpeed;
    const speed = Math.max(50, Math.min(characteristics.maxSpeed, baseSpeed + speedVariation * characteristics.maxSpeed + (Math.random() - 0.5) * 20));
    
    // Throttle based on speed and aggressiveness
    const throttle = speed < characteristics.maxSpeed * 0.8 
      ? Math.min(100, (speed / (characteristics.maxSpeed * 0.8)) * 100 * characteristics.throttleAggressiveness + (Math.random() - 0.5) * 10)
      : Math.max(0, 100 - (speed - characteristics.maxSpeed * 0.8) / (characteristics.maxSpeed * 0.2) * 30 + (Math.random() - 0.5) * 5);
    
    // Brake when entering corners or slowing down
    const isCornering = Math.sin(lapPosition * 2) < -0.5 || Math.random() < trackVar.cornerFrequency;
    const brake = isCornering && speed > 100 
      ? Math.min(100, (speed / characteristics.maxSpeed) * 80 * characteristics.brakeFrequency + Math.random() * 20)
      : Math.max(0, (Math.random() - 0.9) * 10);
    
    // Gear based on speed
    let gear = 1;
    if (speed > 200) gear = 6;
    else if (speed > 160) gear = 5;
    else if (speed > 120) gear = 4;
    else if (speed > 80) gear = 3;
    else if (speed > 50) gear = 2;
    
    // RPM based on speed and gear
    const rpm = Math.min(characteristics.maxRpm, (speed / characteristics.maxSpeed) * characteristics.maxRpm * (1 + (gear - 3) * 0.1) + (Math.random() - 0.5) * 200);
    
    data.push({
      timestamp,
      speed: Math.round(speed),
      throttle: Math.round(Math.max(0, Math.min(100, throttle))),
      brake: Math.round(Math.max(0, Math.min(100, brake))),
      gear,
      rpm: Math.round(rpm),
    });
  }
  
  return data;
}

const CAR_COLORS = {
  'GR Supra': '#EF4444',      // Red
  'GR Yaris': '#3B82F6',      // Blue
  'GR86': '#10B981',          // Green
  'GR Corolla': '#F59E0B',    // Amber
};

export function TelemetryComparisonCharts({ 
  selectedTrack = 'sonoma',
  selectedCars 
}: TelemetryComparisonChartsProps) {
  const [activeMetric, setActiveMetric] = useState<'speed' | 'throttle' | 'brake' | 'gear' | 'rpm'>('speed');
  
  // Default to all cars if none selected
  const carsToCompare = selectedCars && selectedCars.length > 0 
    ? selectedCars 
    : grCars.map(car => car.model);

  // Generate mock data for selected cars
  const telemetryData = useMemo(() => {
    return carsToCompare.map(carModel => ({
      carModel,
      data: generateMockTelemetryData(carModel, selectedTrack),
      color: CAR_COLORS[carModel as keyof typeof CAR_COLORS] || '#6B7280',
    })) as CarTelemetryData[];
  }, [selectedTrack, carsToCompare]);

  // Prepare chart data - combine all cars' data by index (since all have same number of points)
  const chartData = useMemo(() => {
    if (telemetryData.length === 0) return [];
    
    // Use the first car's data length as reference
    const dataLength = telemetryData[0]?.data.length || 0;
    if (dataLength === 0) return [];
    
    // Create data points by index
    return Array.from({ length: dataLength }, (_, index) => {
      const firstCarTimestamp = telemetryData[0].data[index]?.timestamp || 0;
      const dataPoint: Record<string, number | string> = {
        timestamp: firstCarTimestamp - telemetryData[0].data[0].timestamp, // Relative time in ms
        time: ((firstCarTimestamp - telemetryData[0].data[0].timestamp) / 1000).toFixed(1), // Time in seconds for display
      };
      
      telemetryData.forEach(carData => {
        const point = carData.data[index];
        if (point) {
          dataPoint[`${carData.carModel}_${activeMetric}`] = point[activeMetric];
        }
      });
      
      return dataPoint;
    });
  }, [telemetryData, activeMetric]);

  const metricConfigs = {
    speed: { label: 'Speed', unit: 'km/h', color: '#3B82F6', icon: TrendingUp },
    throttle: { label: 'Throttle', unit: '%', color: '#10B981', icon: Zap },
    brake: { label: 'Brake', unit: '%', color: '#EF4444', icon: Activity },
    gear: { label: 'Gear', unit: '', color: '#8B5CF6', icon: Gauge },
    rpm: { label: 'RPM', unit: '', color: '#F59E0B', icon: Gauge },
  };

  const currentConfig = metricConfigs[activeMetric];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          Telemetry Comparison
        </h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Compare telemetry data across selected cars for {selectedTrack.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} track
        </p>
      </div>

      {/* Selected Cars Badges */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {carsToCompare.map(carModel => (
          <Badge 
            key={carModel}
            variant="outline"
            className="px-4 py-2 text-sm"
            style={{ 
              borderColor: CAR_COLORS[carModel as keyof typeof CAR_COLORS] || '#6B7280',
              color: CAR_COLORS[carModel as keyof typeof CAR_COLORS] || '#6B7280',
            }}
          >
            <Car className="w-3 h-3 mr-2" />
            {carModel}
          </Badge>
        ))}
      </div>

      <Card className="bg-card/60 backdrop-blur-md border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(currentConfig.icon, { className: 'w-5 h-5', style: { color: currentConfig.color } })}
            {currentConfig.label} Comparison {currentConfig.unit && `(${currentConfig.unit})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Metric Selector */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(metricConfigs).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveMetric(key as typeof activeMetric)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeMetric === key
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                {config.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  {telemetryData.map(carData => (
                    <linearGradient key={carData.carModel} id={`gradient-${carData.carModel}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={carData.color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={carData.color} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  label={{ 
                    value: `${currentConfig.label} ${currentConfig.unit}`, 
                    angle: -90, 
                    position: 'insideLeft' 
                  }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                {telemetryData.map(carData => (
                  <Line
                    key={carData.carModel}
                    type="monotone"
                    dataKey={`${carData.carModel}_${activeMetric}`}
                    name={carData.carModel}
                    stroke={carData.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, fill: carData.color }}
                    animationDuration={300}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {telemetryData.map(carData => {
          const data = carData.data;
          const avgSpeed = Math.round(data.reduce((sum, p) => sum + p.speed, 0) / data.length);
          const maxSpeed = Math.max(...data.map(p => p.speed));
          const avgThrottle = Math.round(data.reduce((sum, p) => sum + p.throttle, 0) / data.length);
          const avgRpm = Math.round(data.reduce((sum, p) => sum + p.rpm, 0) / data.length);
          
          return (
            <motion.div
              key={carData.carModel}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-card/60 backdrop-blur-md border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Car className="w-4 h-4" style={{ color: carData.color }} />
                    {carData.carModel}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Speed:</span>
                    <span className="font-semibold">{avgSpeed} km/h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Max Speed:</span>
                    <span className="font-semibold">{maxSpeed} km/h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Throttle:</span>
                    <span className="font-semibold">{avgThrottle}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg RPM:</span>
                    <span className="font-semibold">{avgRpm.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

