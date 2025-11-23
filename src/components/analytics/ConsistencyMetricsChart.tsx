import React, { useMemo } from 'react';
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ConsistencyMetricsChart() {
  const { lapTimes, loading, error } = useAnalyticsData();

  const chartData = useMemo(() => {
    if (!lapTimes || lapTimes.length === 0) return [];

    // Group by vehicle and calculate consistency metrics
    const vehicleMap = new Map<number, number[]>();

    lapTimes.forEach((record) => {
      if (!vehicleMap.has(record.vehicle_number)) {
        vehicleMap.set(record.vehicle_number, []);
      }
      vehicleMap.get(record.vehicle_number)!.push(record.lap_time);
    });

    const result: Array<{ name: string; value: number; fill: string }> = [];

    // Calculate top 8 vehicles by consistency
    const vehicleMetrics = Array.from(vehicleMap.entries()).map(([vehicle, times]) => {
      if (times.length === 0) return null;

      const avgLapTime = times.reduce((a, b) => a + b, 0) / times.length;
      const variance = times.reduce((sum, time) => sum + Math.pow(time - avgLapTime, 2), 0) / times.length;
      const stdDev = Math.sqrt(variance);
      const consistency = Math.max(0, 100 - (stdDev / avgLapTime) * 100);

      return { vehicle, consistency, avgLapTime };
    }).filter((v): v is { vehicle: number; consistency: number; avgLapTime: number } => v !== null)
      .sort((a, b) => b.consistency - a.consistency)
      .slice(0, 8);

    const colors = [
      '#ef4444', '#3b82f6', '#10b981', '#f59e0b',
      '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
    ];

    vehicleMetrics.forEach((metric, index) => {
      result.push({
        name: `Car ${metric.vehicle}`,
        value: Number(metric.consistency.toFixed(1)),
        fill: colors[index % colors.length],
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
            <p className="text-sm text-muted-foreground">Loading consistency metrics...</p>
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
          <p className="text-sm text-muted-foreground">No consistency data available</p>
        </CardContent>
      </Card>
    );
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Consistency Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="20%"
            outerRadius="80%"
            barSize={20}
            data={chartData}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              minAngle={15}
              label={<CustomLabel />}
              background
              dataKey="value"
              cornerRadius={10}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </RadialBar>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Consistency']}
            />
            <Legend
              iconSize={12}
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

