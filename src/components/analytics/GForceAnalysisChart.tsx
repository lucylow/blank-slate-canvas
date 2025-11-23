import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
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

export function GForceAnalysisChart() {
  const { lapTimes, loading, error } = useAnalyticsData();

  const chartData = useMemo(() => {
    if (!lapTimes || lapTimes.length === 0) return [];

    // Simulate G-force data based on lap times and lap progression
    // In real implementation, this would come from actual telemetry
    const lapGroups = new Map<number, number[]>();
    
    lapTimes.forEach((record) => {
      if (!lapGroups.has(record.lap)) {
        lapGroups.set(record.lap, []);
      }
      lapGroups.get(record.lap)!.push(record.lap_time);
    });

    const sortedLaps = Array.from(lapGroups.keys()).sort((a, b) => a - b);
    const result: Array<Record<string, number | string>> = [];

    sortedLaps.slice(0, 30).forEach((lap, index) => {
      const lapTimes = lapGroups.get(lap)!;
      const avgLapTime = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
      
      // Simulate G-forces based on lap time (better times = higher G-forces)
      // Lateral G (cornering)
      const lateralG = 1.0 + (Math.random() * 0.5) + (avgLapTime < 125 ? 0.3 : 0);
      
      // Longitudinal G (braking/acceleration)
      const longitudinalG = 0.8 + (Math.random() * 0.4) + (avgLapTime < 125 ? 0.2 : 0);
      
      // Total G-force
      const totalG = Math.sqrt(lateralG * lateralG + longitudinalG * longitudinalG);

      result.push({
        lap: `L${lap}`,
        'Lateral G': Number(lateralG.toFixed(2)),
        'Longitudinal G': Number(longitudinalG.toFixed(2)),
        'Total G': Number(totalG.toFixed(2)),
      });
    });

    return result;
  }, [lapTimes]);

  if (loading) {
    return (
      <Card>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading G-force analysis...</p>
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
          <p className="text-sm text-muted-foreground">No G-force data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>G-Force Analysis Over Laps</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorLateral" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLongitudinal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="lap"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              label={{ value: 'G-Force', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number) => [`${value.toFixed(2)}g`, '']}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="Lateral G"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorLateral)"
            />
            <Area
              type="monotone"
              dataKey="Longitudinal G"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorLongitudinal)"
            />
            <Area
              type="monotone"
              dataKey="Total G"
              stroke="#f59e0b"
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


