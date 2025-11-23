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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface SpeedDistributionData {
  speedRange: string;
  frequency: number;
  percentage: number;
}

interface SpeedDistributionChartProps {
  data?: SpeedDistributionData[];
  loading?: boolean;
  trackName?: string;
  avgSpeed?: number;
  stdDev?: number;
}

export function SpeedDistributionChart({
  data,
  loading,
  trackName,
  avgSpeed,
  stdDev,
}: SpeedDistributionChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data;
  }, [data]);

  const getColor = (value: number, max: number) => {
    const ratio = value / max;
    if (ratio > 0.8) return '#10B981'; // green - high frequency
    if (ratio > 0.6) return '#3B82F6'; // blue
    if (ratio > 0.4) return '#F59E0B'; // amber
    if (ratio > 0.2) return '#EF4444'; // red
    return '#6B7280'; // gray - low frequency
  };

  const maxFrequency = useMemo(() => {
    if (chartData.length === 0) return 1;
    return Math.max(...chartData.map(d => d.frequency));
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{data.speedRange}</p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Frequency:</span> {data.frequency}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Percentage:</span> {data.percentage.toFixed(1)}%
        </p>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Speed Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Speed Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No speed distribution data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Speed Distribution {trackName && `- ${trackName}`}</CardTitle>
        {(avgSpeed !== undefined || stdDev !== undefined) && (
          <div className="text-sm text-muted-foreground mt-2">
            {avgSpeed !== undefined && (
              <span className="mr-4">
                <span className="font-medium">Avg Speed:</span> {avgSpeed.toFixed(2)} km/h
              </span>
            )}
            {stdDev !== undefined && (
              <span>
                <span className="font-medium">Std Dev:</span> {stdDev.toFixed(2)} km/h
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="speedRange"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="frequency" name="Speed Frequency" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.frequency, maxFrequency)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
