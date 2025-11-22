import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { useTelemetry } from '@/hooks/useTelemetry';
import { CarTypeToggle, CarTypeLegend } from '@/components/CarTypeToggle';
import { GR_CARS } from '@/constants/cars';
import type { GRCarId } from '@/constants/cars';

const chartConfigs = {
  speed: { color: '#3B82F6', label: 'Speed (km/h)' },
  throttle: { color: '#10B981', label: 'Throttle (%)' },
  brake: { color: '#EF4444', label: 'Brake Pressure' },
  gear: { color: '#8B5CF6', label: 'Gear' },
  rpm: { color: '#F59E0B', label: 'RPM' }
};

export function TelemetryCharts() {
  const { 
    telemetryData, 
    selectedDriver, 
    visibleCars,
    toggleCarVisibility,
    filteredTelemetryData 
  } = useTelemetry();
  const [activeChart, setActiveChart] = useState('speed');
  const [multiCarMode, setMultiCarMode] = useState(false);

  // Group telemetry data by car type for multi-car visualization
  const multiCarChartData = useMemo(() => {
    if (!multiCarMode || !filteredTelemetryData.length) return [];

    // Group data by timestamp and car type
    const grouped: Record<number, Record<string, number>> = {};
    
    filteredTelemetryData.forEach((point) => {
      const timestamp = Math.floor(point.timestamp / 1000) * 1000; // Round to nearest second
      if (!grouped[timestamp]) {
        grouped[timestamp] = { timestamp };
      }
      
      if (point.carType) {
        const carId = point.carType;
        const key = `${activeChart}_${carId}`;
        grouped[timestamp][key] = point[activeChart as keyof typeof point] as number;
        // Also store car type for legend
        grouped[timestamp][`carType_${carId}`] = 1;
      }
    });

    return Object.values(grouped).slice(-50);
  }, [filteredTelemetryData, activeChart, multiCarMode]);

  // Single car mode chart data
  const singleCarChartData = useMemo(() => {
    if (multiCarMode) return [];
    
    const selectedData = selectedDriver
      ? filteredTelemetryData.filter((point) => point.carNumber === selectedDriver.carNumber)
      : filteredTelemetryData;
    
    return selectedData.slice(-50);
  }, [filteredTelemetryData, selectedDriver, multiCarMode]);

  const chartData = multiCarMode ? multiCarChartData : singleCarChartData;

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {multiCarMode 
            ? 'Multi-Car Telemetry Comparison'
            : `Telemetry - Car #${selectedDriver?.carNumber || '23'}`
          }
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMultiCarMode(!multiCarMode)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              multiCarMode 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
          >
            {multiCarMode ? 'Single Car' : 'Compare Cars'}
          </button>
        </div>
      </div>

      {multiCarMode && (
        <div className="mb-4 space-y-2">
          <CarTypeToggle
            visibleCars={visibleCars}
            onToggle={toggleCarVisibility}
            variant="compact"
            className="justify-center"
          />
          <CarTypeLegend className="justify-center text-xs" />
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          {Object.entries(chartConfigs).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveChart(key)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                activeChart === key 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {config.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-br from-secondary/30 to-muted/30 rounded-lg p-4 border border-border/50">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              {multiCarMode ? (
                GR_CARS.filter(car => visibleCars[car.id]).map((car) => (
                  <linearGradient key={car.id} id={`chartGradient_${car.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={car.color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={car.color} stopOpacity={0}/>
                  </linearGradient>
                ))
              ) : (
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartConfigs[activeChart as keyof typeof chartConfigs].color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={chartConfigs[activeChart as keyof typeof chartConfigs].color} stopOpacity={0}/>
                </linearGradient>
              )}
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
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'hsl(var(--secondary))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                color: 'hsl(var(--foreground))',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
              }}
              labelFormatter={(value) => new Date(value).toLocaleTimeString()}
            />
            {multiCarMode ? (
              // Multi-car mode: show lines for each visible car
              GR_CARS
                .filter(car => visibleCars[car.id])
                .map((car) => (
                  <Line
                    key={car.id}
                    type="monotone"
                    dataKey={`${activeChart}_${car.id}`}
                    stroke={car.color}
                    strokeWidth={2.5}
                    name={`${car.shortName} ${chartConfigs[activeChart as keyof typeof chartConfigs].label.split(' ')[0]}`}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, fill: car.color }}
                    fillOpacity={0.6}
                    fill={`url(#chartGradient_${car.id})`}
                  />
                ))
            ) : (
              // Single car mode: show one line
              <Line
                type="monotone"
                dataKey={activeChart}
                stroke={chartConfigs[activeChart as keyof typeof chartConfigs].color}
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, fill: chartConfigs[activeChart as keyof typeof chartConfigs].color }}
                fillOpacity={1}
                fill="url(#chartGradient)"
                name={chartConfigs[activeChart as keyof typeof chartConfigs].label}
              />
            )}
            {multiCarMode && <Legend />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-5 gap-3 mt-4 h-24">
        {Object.entries(chartConfigs).map(([key, config]) => (
          <motion.div
            key={key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className={`rounded-xl p-3 cursor-pointer border-2 transition-all backdrop-blur-sm ${
              activeChart === key 
                ? 'border-primary bg-primary/20 shadow-lg shadow-primary/20' 
                : 'border-border/50 bg-secondary/50 hover:bg-secondary hover:border-accent'
            }`}
            onClick={() => setActiveChart(key)}
          >
            <div className={`text-xs font-semibold mb-1 ${activeChart === key ? 'text-primary' : 'text-muted-foreground'}`}>
              {config.label.split(' ')[0]}
            </div>
            <div className="h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.slice(-10)}>
                  {multiCarMode ? (
                    GR_CARS
                      .filter(car => visibleCars[car.id])
                      .map((car) => (
                        <Line
                          key={car.id}
                          type="monotone"
                          dataKey={`${key}_${car.id}`}
                          stroke={activeChart === key ? car.color : 'hsl(var(--muted-foreground))'}
                          strokeWidth={activeChart === key ? 2 : 1.5}
                          dot={false}
                        />
                      ))
                  ) : (
                    <Line
                      type="monotone"
                      dataKey={key}
                      stroke={activeChart === key ? config.color : 'hsl(var(--muted-foreground))'}
                      strokeWidth={activeChart === key ? 2 : 1.5}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
