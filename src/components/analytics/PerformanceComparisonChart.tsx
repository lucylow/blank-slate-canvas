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
import { Loader2, TrendingUp } from 'lucide-react';
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

  // Calculate insights - must be before conditional returns to follow React Hooks rules
  const insights = useMemo(() => {
    if (chartData.length === 0) return null;
    const bestVehicle = chartData[0];
    const avgConsistency = chartData.reduce((sum, v) => sum + v.consistency, 0) / chartData.length;
    const topPerformer = chartData.find(v => v.bestLapTime === Math.min(...chartData.map(d => d.bestLapTime)));
    
    return {
      bestVehicle: bestVehicle?.vehicle,
      bestLapTime: bestVehicle?.bestLapTime,
      avgConsistency: avgConsistency.toFixed(1),
      topPerformer: topPerformer?.vehicle,
      performanceGap: chartData.length > 1 
        ? (chartData[chartData.length - 1].bestLapTime - chartData[0].bestLapTime).toFixed(2)
        : '0.00',
    };
  }, [chartData]);

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
    <Card className="border-primary/20 bg-card/60 backdrop-blur-md shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Performance Comparison by Vehicle
          </CardTitle>
          {insights && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                Top: {insights.bestVehicle}
              </span>
            </div>
          )}
        </div>
        {insights && (
          <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
            <div className="p-2 rounded bg-accent/30 border border-border/50">
              <div className="text-muted-foreground">Best Lap</div>
              <div className="font-bold text-foreground">{insights.bestLapTime}s</div>
            </div>
            <div className="p-2 rounded bg-accent/30 border border-border/50">
              <div className="text-muted-foreground">Avg Consistency</div>
              <div className="font-bold text-foreground">{insights.avgConsistency}%</div>
            </div>
            <div className="p-2 rounded bg-accent/30 border border-border/50">
              <div className="text-muted-foreground">Performance Gap</div>
              <div className="font-bold text-foreground">{insights.performanceGap}s</div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
            <XAxis
              dataKey="vehicle"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              label={{ value: 'Lap Time (seconds)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))' } }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string, props: any) => {
                if (name === 'avgLapTime' || name === 'bestLapTime') {
                  const label = name === 'avgLapTime' ? 'Avg Lap Time' : 'Best Lap Time';
                  const consistency = props.payload?.consistency;
                  return [
                    <div key={name} className="space-y-1">
                      <div className="font-semibold">{`${value.toFixed(2)}s`}</div>
                      {consistency && <div className="text-xs text-muted-foreground">Consistency: {consistency.toFixed(1)}%</div>}
                    </div>,
                    label
                  ];
                }
                return [value, name];
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="square"
            />
            <Bar
              dataKey="avgLapTime"
              fill="hsl(var(--primary))"
              name="Average Lap Time"
              radius={[6, 6, 0, 0]}
              opacity={0.8}
            />
            <Bar
              dataKey="bestLapTime"
              fill="#10b981"
              name="Best Lap Time"
              radius={[6, 6, 0, 0]}
              opacity={0.9}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

