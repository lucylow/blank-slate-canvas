import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GR_CARS, type GRCarId } from '@/constants/cars';
import { generateAllCarsTelemetry, getLatestTelemetryForAllCars, type TelemetryDataPoint } from '@/utils/mockTelemetry';

interface TelemetryComparisonProps {
  className?: string;
}

type MetricType = 'speed' | 'throttle' | 'brake' | 'gear' | 'rpm';

const metricConfigs: Record<MetricType, { label: string; unit: string; color: string }> = {
  speed: { label: 'Speed', unit: 'km/h', color: '#3B82F6' },
  throttle: { label: 'Throttle', unit: '%', color: '#10B981' },
  brake: { label: 'Brake', unit: '%', color: '#EF4444' },
  gear: { label: 'Gear', unit: '', color: '#8B5CF6' },
  rpm: { label: 'RPM', unit: '', color: '#F59E0B' },
};

export function TelemetryComparison({ className }: TelemetryComparisonProps) {
  const [compareMode, setCompareMode] = useState(false);
  const [activeMetric, setActiveMetric] = useState<MetricType>('speed');
  const [selectedCars, setSelectedCars] = useState<Set<GRCarId>>(new Set(GR_CARS.map(c => c.id)));
  const [telemetryData, setTelemetryData] = useState<TelemetryDataPoint[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Generate initial telemetry data
  useEffect(() => {
    const data = generateAllCarsTelemetry(Date.now() - 60000, 60000, 100);
    setTelemetryData(data);
  }, []);

  // Update current time for real-time effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      // Add new data points periodically
      if (Math.random() > 0.7) {
        setTelemetryData((prev) => {
          const newData = generateAllCarsTelemetry(Date.now() - 1000, 1000, 100);
          return [...prev.slice(-500), ...newData].slice(-600);
        });
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Get latest values for all cars
  const latestValues = useMemo(() => {
    return getLatestTelemetryForAllCars(telemetryData, currentTime);
  }, [telemetryData, currentTime]);

  // Prepare chart data for comparison
  const chartData = useMemo(() => {
    if (!compareMode) return [];
    
    // Group data by timestamp
    const grouped: Record<number, Record<string, number>> = {};
    
    telemetryData
      .filter((point) => selectedCars.has(point.carId))
      .forEach((point) => {
        const timeKey = Math.floor(point.timestamp / 1000) * 1000;
        if (!grouped[timeKey]) {
          grouped[timeKey] = { timestamp: timeKey };
        }
        grouped[timeKey][`${activeMetric}_${point.carId}`] = point[activeMetric];
      });
    
    return Object.values(grouped).slice(-60);
  }, [telemetryData, compareMode, activeMetric, selectedCars]);

  const toggleCar = (carId: GRCarId) => {
    setSelectedCars((prev) => {
      const next = new Set(prev);
      if (next.has(carId)) {
        next.delete(carId);
      } else {
        next.add(carId);
      }
      return next;
    });
  };

  return (
    <div className={className}>
      <Card className="bg-card/60 backdrop-blur-md border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Telemetry Comparison</CardTitle>
            <Button
              onClick={() => setCompareMode(!compareMode)}
              variant={compareMode ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              {compareMode ? 'Single View' : 'Compare Cars'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Car Selection */}
          {compareMode && (
            <div className="flex flex-wrap gap-2">
              {GR_CARS.map((car) => (
                <Button
                  key={car.id}
                  onClick={() => toggleCar(car.id)}
                  variant={selectedCars.has(car.id) ? 'default' : 'outline'}
                  size="sm"
                  style={{
                    backgroundColor: selectedCars.has(car.id) ? car.color : undefined,
                    borderColor: car.color,
                  }}
                >
                  {car.shortName}
                </Button>
              ))}
            </div>
          )}

          {/* Metric Selection */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(metricConfigs) as MetricType[]).map((metric) => (
              <Button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                variant={activeMetric === metric ? 'default' : 'outline'}
                size="sm"
              >
                {metricConfigs[metric].label}
              </Button>
            ))}
          </div>

          {/* Current Values Display */}
          {!compareMode && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {GR_CARS.map((car) => {
                const latest = latestValues[car.id];
                const value = latest ? latest[activeMetric] : 0;
                return (
                  <motion.div
                    key={car.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-lg border-2"
                    style={{ borderColor: car.color }}
                  >
                    <div className="text-sm font-medium mb-2" style={{ color: car.color }}>
                      {car.name}
                    </div>
                    <div className="text-2xl font-bold">{value.toFixed(activeMetric === 'speed' || activeMetric === 'rpm' ? 0 : 1)}</div>
                    <div className="text-xs text-muted-foreground">{metricConfigs[activeMetric].unit}</div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Main Chart */}
          <div className="h-96 w-full">
            {compareMode ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    {GR_CARS.filter(car => selectedCars.has(car.id)).map((car) => (
                      <linearGradient key={car.id} id={`gradient_${car.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={car.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={car.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="timestamp"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    label={{ value: metricConfigs[activeMetric].unit, angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--secondary))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <Legend />
                  {GR_CARS
                    .filter(car => selectedCars.has(car.id))
                    .map((car) => (
                      <Area
                        key={car.id}
                        type="monotone"
                        dataKey={`${activeMetric}_${car.id}`}
                        stroke={car.color}
                        strokeWidth={2.5}
                        fill={`url(#gradient_${car.id})`}
                        name={car.shortName}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
                {GR_CARS.map((car) => {
                  const latest = latestValues[car.id];
                  const value = latest ? latest[activeMetric] : 0;
                  const maxValue = activeMetric === 'speed' ? 200 : activeMetric === 'rpm' ? 8000 : activeMetric === 'gear' ? 6 : 100;
                  
                  return (
                    <Card key={car.id} className="p-4">
                      <div className="text-sm font-medium mb-2" style={{ color: car.color }}>
                        {car.name}
                      </div>
                      <div className="relative h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[{ value, name: metricConfigs[activeMetric].label }]}>
                            <Bar
                              dataKey="value"
                              fill={car.color}
                              radius={[8, 8, 0, 0]}
                            />
                            <YAxis domain={[0, maxValue]} hide />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-center mt-2">
                        <div className="text-xl font-bold">{value.toFixed(activeMetric === 'speed' || activeMetric === 'rpm' ? 0 : 1)}</div>
                        <div className="text-xs text-muted-foreground">{metricConfigs[activeMetric].unit}</div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mini Charts for All Metrics */}
          <div className="grid grid-cols-5 gap-3">
            {(Object.keys(metricConfigs) as MetricType[]).map((metric) => (
              <motion.div
                key={metric}
                whileHover={{ scale: 1.05 }}
                className={`rounded-lg p-3 cursor-pointer border-2 transition-all ${
                  activeMetric === metric
                    ? 'border-primary bg-primary/20'
                    : 'border-border/50 bg-secondary/50 hover:bg-secondary'
                }`}
                onClick={() => setActiveMetric(metric)}
              >
                <div className={`text-xs font-semibold mb-2 ${activeMetric === metric ? 'text-primary' : 'text-muted-foreground'}`}>
                  {metricConfigs[metric].label}
                </div>
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.slice(-10)}>
                      {compareMode && selectedCars.size > 0 ? (
                        GR_CARS
                          .filter(car => selectedCars.has(car.id))
                          .map((car) => (
                            <Line
                              key={car.id}
                              type="monotone"
                              dataKey={`${metric}_${car.id}`}
                              stroke={activeMetric === metric ? car.color : 'hsl(var(--muted-foreground))'}
                              strokeWidth={activeMetric === metric ? 2 : 1}
                              dot={false}
                            />
                          ))
                      ) : (
                        GR_CARS.length > 0 && (
                          <Line
                            type="monotone"
                            dataKey={`${metric}_${GR_CARS[0].id}`}
                            stroke={activeMetric === metric ? metricConfigs[metric].color : 'hsl(var(--muted-foreground))'}
                            strokeWidth={activeMetric === metric ? 2 : 1}
                            dot={false}
                          />
                        )
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

