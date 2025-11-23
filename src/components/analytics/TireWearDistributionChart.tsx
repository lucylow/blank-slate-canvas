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
  Cell,
} from 'recharts';
import { useAnalyticsData, type TireWearData } from '@/hooks/useAnalyticsData';
import { Loader2 } from 'lucide-react';

interface ChartDataPoint {
  track: string;
  avg_wear: number;
  min_wear: number;
  max_wear: number;
  vehicle_count: number;
}

export function TireWearDistributionChart() {
  const { tireWear, loading, error } = useAnalyticsData();

  const chartData = useMemo(() => {
    if (!tireWear || tireWear.length === 0) return [];

    // Group by track
    const trackMap = new Map<string, number[]>();

    for (const record of tireWear) {
      if (!record || !record.track_name || typeof record.tire_wear !== 'number') {
        continue; // Skip invalid records
      }
      
      const trackName = record.track_name;
      if (!trackMap.has(trackName)) {
        trackMap.set(trackName, []);
      }
      trackMap.get(trackName)!.push(record.tire_wear);
    }

    // Calculate statistics per track
    const result: ChartDataPoint[] = [];

    for (const [trackName, wearValues] of trackMap) {
      if (wearValues.length > 0) {
        const sorted = [...wearValues].sort((a, b) => a - b);
        const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        result.push({
          track: trackName,
          avg_wear: Number(avg.toFixed(2)),
          min_wear: Number(min.toFixed(2)),
          max_wear: Number(max.toFixed(2)),
          vehicle_count: wearValues.length,
        });
      }
    }

    // Sort by average wear (descending)
    return result.sort((a, b) => b.avg_wear - a.avg_wear);
  }, [tireWear]);

  const getColor = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio > 0.8) return '#ef4444'; // red - high wear
    if (ratio > 0.6) return '#f59e0b'; // amber - medium-high wear
    if (ratio > 0.4) return '#eab308'; // yellow - medium wear
    if (ratio > 0.2) return '#10b981'; // green - low-medium wear
    return '#06b6d4'; // cyan - low wear
  };

  const maxWear = useMemo(() => {
    if (chartData.length === 0) return 1;
    return Math.max(...chartData.map(d => d.avg_wear));
  }, [chartData]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading tire wear data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-destructive">Error: {error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No tire wear data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="track"
          stroke="hsl(var(--muted-foreground))"
          fontSize={11}
          tickLine={false}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          label={{ value: 'Tire Wear Index', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))',
          }}
          formatter={(value: number, name: string) => {
            if (name === 'avg_wear') return [`${value.toFixed(2)}`, 'Average Wear'];
            if (name === 'min_wear') return [`${value.toFixed(2)}`, 'Min Wear'];
            if (name === 'max_wear') return [`${value.toFixed(2)}`, 'Max Wear'];
            return [value, name];
          }}
        />
        <Legend />
        <Bar dataKey="avg_wear" name="Average Tire Wear" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.avg_wear, maxWear)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}


