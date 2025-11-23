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
import { useAnalyticsData, type LapTimeData } from '@/hooks/useAnalyticsData';
import { Loader2 } from 'lucide-react';

interface ChartDataPoint {
  lap: number;
  [trackName: string]: number | string;
}

export function LapTimeTrendsChart() {
  const { lapTimes, loading, error } = useAnalyticsData();

  const chartData = useMemo(() => {
    if (!lapTimes || lapTimes.length === 0) return [];

    // Group by lap and track
    const lapMap = new Map<number, Map<string, number[]>>();

    for (const record of lapTimes) {
      if (!record || typeof record.lap !== 'number' || !record.track_name || typeof record.lap_time !== 'number') {
        continue; // Skip invalid records
      }
      
      const lap = record.lap;
      const trackName = record.track_name;

      if (!lapMap.has(lap)) {
        lapMap.set(lap, new Map());
      }

      const trackMap = lapMap.get(lap)!;
      if (!trackMap.has(trackName)) {
        trackMap.set(trackName, []);
      }

      trackMap.get(trackName)!.push(record.lap_time);
    }

    // Calculate average lap time per track per lap
    const result: ChartDataPoint[] = [];
    const allLaps = Array.from(lapMap.keys()).sort((a, b) => a - b);
    const allTracks = new Set<string>();

    for (const record of lapTimes) {
      if (record && record.track_name) {
        allTracks.add(record.track_name);
      }
    }

    for (const lap of allLaps) {
      const dataPoint: ChartDataPoint = { lap };
      const trackMap = lapMap.get(lap)!;

      for (const trackName of allTracks) {
        const times = trackMap.get(trackName) || [];
        if (times.length > 0) {
          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
          dataPoint[trackName] = Number(avgTime.toFixed(2));
        }
      }

      result.push(dataPoint);
    }

    return result;
  }, [lapTimes]);

  const trackColors = [
    '#ef4444', // red
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
  ];

  const tracks = useMemo(() => {
    const trackSet = new Set<string>();
    for (const record of lapTimes) {
      trackSet.add(record.track_name);
    }
    return Array.from(trackSet);
  }, [lapTimes]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading lap time data...</p>
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
        <p className="text-sm text-muted-foreground">No lap time data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
        <XAxis
          dataKey="lap"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          label={{ value: 'Lap Number', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle' } }}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          label={{ value: 'Lap Time (seconds)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            color: 'hsl(var(--foreground))',
          }}
          formatter={(value: number) => [`${value.toFixed(2)}s`, 'Lap Time']}
        />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="line"
        />
        {tracks.map((track, index) => (
          <Line
            key={track}
            type="monotone"
            dataKey={track}
            stroke={trackColors[index % trackColors.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name={track}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}


