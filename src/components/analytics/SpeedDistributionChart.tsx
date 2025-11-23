import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SpeedDistributionChart() {
  const { lapTimes, loading, error } = useAnalyticsData();

  const chartData = useMemo(() => {
    if (!lapTimes || lapTimes.length === 0) return [];

    // Calculate average lap time ranges and count occurrences
    const ranges = [
      { range: '1:50-1:55', min: 110, max: 115, count: 0 },
      { range: '1:55-2:00', min: 115, max: 120, count: 0 },
      { range: '2:00-2:05', min: 120, max: 125, count: 0 },
      { range: '2:05-2:10', min: 125, max: 130, count: 0 },
      { range: '2:10-2:15', min: 130, max: 135, count: 0 },
      { range: '2:15-2:20', min: 135, max: 140, count: 0 },
      { range: '2:20+', min: 140, max: 300, count: 0 },
    ];

    lapTimes.forEach((record) => {
      const lapTime = record.lap_time;
      for (const rangeItem of ranges) {
        if (lapTime >= rangeItem.min && lapTime < rangeItem.max) {
          rangeItem.count++;
          break;
        } else if (rangeItem.range === '2:20+' && lapTime >= rangeItem.min) {
          rangeItem.count++;
          break;
        }
      }
    });

    return ranges.filter(r => r.count > 0).map(r => ({
      range: r.range,
      count: r.count,
      percentage: ((r.count / lapTimes.length) * 100).toFixed(1),
    }));
  }, [lapTimes]);

  if (loading) {
    return (
      <Card>
        <CardContent className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading speed distribution...</p>
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
          <p className="text-sm text-muted-foreground">No speed distribution data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lap Time Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="range"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              label={{ value: 'Number of Laps', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value} laps (${props.payload.percentage}%)`,
                'Count',
              ]}
            />
            <Bar
              dataKey="count"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
              name="Number of Laps"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

