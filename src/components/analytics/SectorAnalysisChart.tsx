import React, { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SectorData {
  sector: string;
  avgTime: number;
  bestTime: number;
  consistency: number;
}

export function SectorAnalysisChart() {
  const { lapTimes, loading, error } = useAnalyticsData();

  const chartData = useMemo(() => {
    if (!lapTimes || lapTimes.length === 0) return [];

    // Simulate sector data from lap times
    // In real implementation, this would come from actual sector timing data
    const sectors = ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4'];
    
    // Group lap times by approximate sectors (divide lap time by number of sectors)
    const sectorTimes: Record<string, number[]> = {
      'Sector 1': [],
      'Sector 2': [],
      'Sector 3': [],
      'Sector 4': [],
    };

    lapTimes.forEach((record) => {
      const sectorTime = record.lap_time / 4; // Divide into 4 sectors
      sectors.forEach((sector) => {
        // Add some variation to simulate different sector times
        const variation = 0.8 + Math.random() * 0.4;
        sectorTimes[sector].push(sectorTime * variation);
      });
    });

    const result: SectorData[] = sectors.map((sector) => {
      const times = sectorTimes[sector];
      if (times.length === 0) {
        return {
          sector,
          avgTime: 0,
          bestTime: 0,
          consistency: 0,
        };
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const bestTime = Math.min(...times);
      
      // Calculate consistency
      const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
      const stdDev = Math.sqrt(variance);
      const consistency = Math.max(0, 100 - (stdDev / avgTime) * 100);

      return {
        sector,
        avgTime: Number(avgTime.toFixed(2)),
        bestTime: Number(bestTime.toFixed(2)),
        consistency: Number(consistency.toFixed(1)),
      };
    });

    return result;
  }, [lapTimes]);

  if (loading) {
    return (
      <Card>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading sector analysis...</p>
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

  if (chartData.length === 0 || chartData.every(d => d.avgTime === 0)) {
    return (
      <Card>
        <CardContent className="h-96 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No sector data available</p>
        </CardContent>
      </Card>
    );
  }

  // Normalize data for radar chart (scale to 0-100)
  const maxValue = Math.max(...chartData.map(d => Math.max(d.avgTime, d.bestTime)));
  const normalizedData = chartData.map((d) => ({
    sector: d.sector,
    'Average Time': (d.avgTime / maxValue) * 100,
    'Best Time': (d.bestTime / maxValue) * 100,
    'Consistency': d.consistency,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector Performance Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={normalizedData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <PolarGrid stroke="hsl(var(--border))" opacity={0.3} />
            <PolarAngleAxis
              dataKey="sector"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Consistency') {
                  return [`${value.toFixed(1)}%`, 'Consistency'];
                }
                return [`${value.toFixed(1)}%`, name === 'Average Time' ? 'Avg Performance' : 'Best Performance'];
              }}
            />
            <Legend />
            <Radar
              name="Average Time"
              dataKey="Average Time"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Radar
              name="Best Time"
              dataKey="Best Time"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Radar
              name="Consistency"
              dataKey="Consistency"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

