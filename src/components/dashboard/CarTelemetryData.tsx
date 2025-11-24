import { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gauge, Zap, Activity } from 'lucide-react';
import { GR_CARS, type GRCarId } from '@/constants/cars';
import { generateAllCarsTelemetry, getLatestTelemetryForAllCars, type TelemetryDataPoint } from '@/utils/mockTelemetry';

export function CarTelemetryData() {
  const [telemetryData, setTelemetryData] = useState<TelemetryDataPoint[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Generate initial telemetry data
  useEffect(() => {
    const data = generateAllCarsTelemetry(Date.now() - 60000, 60000, 100);
    setTelemetryData(data);
  }, []);

  // Update current time and add new data points periodically
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <Card className="bg-card/60 backdrop-blur-md border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-bold">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            Car Telemetry Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Car</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Speed</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">RPM</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Gear</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Throttle</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Brake</th>
                </tr>
              </thead>
              <tbody>
                {GR_CARS.map((car, index) => {
                  const latest = latestValues[car.id];
                  return (
                    <motion.tr
                      key={car.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: car.color }}
                          />
                          <div>
                            <div className="font-semibold" style={{ color: car.color }}>
                              {car.name}
                            </div>
                            <div className="text-xs text-muted-foreground">{car.shortName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Gauge className="w-4 h-4 text-muted-foreground" />
                          <span className="font-bold text-lg">
                            {latest ? `${latest.speed.toFixed(0)}` : '--'}
                          </span>
                          <span className="text-xs text-muted-foreground">km/h</span>
                        </div>
                      </td>
                      <td className="text-right py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Zap className="w-4 h-4 text-muted-foreground" />
                          <span className="font-bold text-lg">
                            {latest ? `${latest.rpm.toLocaleString()}` : '--'}
                          </span>
                          <span className="text-xs text-muted-foreground">RPM</span>
                        </div>
                      </td>
                      <td className="text-right py-4 px-4">
                        <div className="flex items-center justify-end">
                          <span className="font-bold text-lg">
                            {latest ? latest.gear : '--'}
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-green-500"
                              initial={{ width: 0 }}
                              animate={{ width: latest ? `${latest.throttle}%` : '0%' }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <span className="font-semibold text-sm w-12 text-right">
                            {latest ? `${latest.throttle.toFixed(0)}%` : '--'}
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-red-500"
                              initial={{ width: 0 }}
                              animate={{ width: latest ? `${latest.brake}%` : '0%' }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <span className="font-semibold text-sm w-12 text-right">
                            {latest ? `${latest.brake.toFixed(0)}%` : '--'}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

