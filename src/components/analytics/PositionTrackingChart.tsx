import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
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

export function PositionTrackingChart() {
  const { lapTimes, loading, error } = useAnalyticsData();

  const chartData = useMemo(() => {
    if (!lapTimes || lapTimes.length === 0) return [];

    // Group by vehicle and calculate cumulative position based on lap times
    const lapMap = new Map<number, Map<number, number>>(); // lap -> vehicle -> time

    lapTimes.forEach((record) => {
      if (!lapMap.has(record.lap)) {
        lapMap.set(record.lap, new Map());
      }
      lapMap.get(record.lap)!.set(record.vehicle_number, record.lap_time);
    });

    // Calculate positions for each lap
    const vehiclePositions = new Map<number, Array<{ lap: number; position: number }>>();
    const vehicles = new Set(lapTimes.map(r => r.vehicle_number));

    vehicles.forEach(vehicle => {
      vehiclePositions.set(vehicle, []);
    });

    // Sort laps
    const sortedLaps = Array.from(lapMap.keys()).sort((a, b) => a - b);

    sortedLaps.forEach((lap) => {
      const lapTimes = lapMap.get(lap)!;
      
      // Sort vehicles by lap time for this lap
      const sortedVehicles = Array.from(lapTimes.entries())
        .sort((a, b) => a[1] - b[1])
        .map((entry, index) => ({
          vehicle: entry[0],
          position: index + 1,
        }));

      // Update positions
      sortedVehicles.forEach(({ vehicle, position }) => {
        vehiclePositions.get(vehicle)?.push({ lap, position });
      });
    });

    // Format for chart (top 5 vehicles)
    const vehicleData: Record<number, Record<number, number>> = {};
    vehicles.forEach(vehicle => {
      vehicleData[vehicle] = {};
      vehiclePositions.get(vehicle)?.forEach(({ lap, position }) => {
        vehicleData[vehicle][lap] = position;
      });
    });

    // Create chart data points
    const result: Array<Record<string, number | string>> = [];
    sortedLaps.forEach((lap) => {
      const dataPoint: Record<string, number | string> = { lap };
      let hasData = false;
      
      // Include top 5 vehicles by average position
      const vehicleAvgPositions = Array.from(vehicles).map(vehicle => {
        const positions = vehiclePositions.get(vehicle) || [];
        const avgPos = positions.length > 0
          ? positions.reduce((sum, p) => sum + p.position, 0) / positions.length
          : 999;
        return { vehicle, avgPos };
      }).sort((a, b) => a.avgPos - b.avgPos).slice(0, 5);

      vehicleAvgPositions.forEach(({ vehicle }) => {
        if (vehicleData[vehicle] && vehicleData[vehicle][lap] !== undefined) {
          dataPoint[`Car ${vehicle}`] = vehicleData[vehicle][lap];
          hasData = true;
        }
      });

      if (hasData) {
        result.push(dataPoint);
      }
    });

    return result;
  }, [lapTimes]);

  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  if (loading) {
    return (
      <Card>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading position tracking...</p>
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
          <p className="text-sm text-muted-foreground">No position tracking data available</p>
        </CardContent>
      </Card>
    );
  }

  // Get vehicle names from first data point
  const vehicleNames = Object.keys(chartData[0] || {}).filter(key => key !== 'lap');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Position Tracking Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="lap"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              reversed
              domain={[1, 'auto']}
              label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number) => [`P${value}`, 'Position']}
            />
            <Legend />
            {vehicleNames.map((vehicle, index) => (
              <Line
                key={vehicle}
                type="monotone"
                dataKey={vehicle}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


