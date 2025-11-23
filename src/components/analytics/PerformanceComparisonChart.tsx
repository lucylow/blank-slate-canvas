import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PerformanceData {
  vehicle: string;
  avgLapTime: number;
  bestLapTime: number;
  consistency: number;
  totalLaps: number;
}

export function PerformanceComparisonChart() {
  const { lapTimes, loading, error } = useAnalyticsData();

  const chartData = useMemo(() => {
    if (!lapTimes || lapTimes.length === 0) return [];

    // Group by vehicle
    const vehicleMap = new Map<number, number[]>();

    for (const record of lapTimes) {
      if (!vehicleMap.has(record.vehicle_number)) {
        vehicleMap.set(record.vehicle_number, []);
      }
      vehicleMap.get(record.vehicle_number)!.push(record.lap_time);
    }

    // Calculate metrics for each vehicle
    const result: PerformanceData[] = [];

    for (const [vehicleNumber, times] of vehicleMap) {
      if (times.length === 0) continue;

      const avgLapTime = times.reduce((a, b) => a + b, 0) / times.length;
      const bestLapTime = Math.min(...times);
      
      // Calculate consistency (lower std dev = higher consistency)
      const variance = times.reduce((sum, time) => sum + Math.pow(time - avgLapTime, 2), 0) / times.length;
      const stdDev = Math.sqrt(variance);
      const consistency = Math.max(0, 100 - (stdDev / avgLapTime) * 100);

      result.push({
        vehicle: `Car ${vehicleNumber}`,
        avgLapTime: Number(avgLapTime.toFixed(2)),
        bestLapTime: Number(bestLapTime.toFixed(2)),
        consistency: Number(consistency.toFixed(1)),
        totalLaps: times.length,
      });
    }

    // Sort by best lap time
    return result.sort((a, b) => a.bestLapTime - b.bestLapTime).slice(0, 10);
  }, [lapTimes]);

  if (loading) {
    return (
      <Card>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading performance data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="h-96 flex items-center justify-center">
          <p className="text-sm text-destructive">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="h-96 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No performance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Comparison by Vehicle</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="vehicle"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              label={{ value: 'Lap Time (seconds)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'avgLapTime' || name === 'bestLapTime') {
                  return [`${value.toFixed(2)}s`, name === 'avgLapTime' ? 'Avg Lap Time' : 'Best Lap Time'];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Bar
              dataKey="avgLapTime"
              fill="#ef4444"
              name="Average Lap Time"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="bestLapTime"
              fill="#10b981"
              name="Best Lap Time"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

