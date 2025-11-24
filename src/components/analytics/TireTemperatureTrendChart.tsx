import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';

interface TireTempDataPoint {
  lap: number;
  temperature: number;
  predicted?: number;
  threshold?: number;
}

interface TireTemperatureTrendChartProps {
  data?: TireTempDataPoint[];
  loading?: boolean;
  trackName?: string;
  showPrediction?: boolean;
  warningThreshold?: number;
}

export function TireTemperatureTrendChart({
  data,
  loading,
  trackName,
  showPrediction = false,
  warningThreshold,
}: TireTemperatureTrendChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.sort((a, b) => a.lap - b.lap);
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">Lap {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-medium">{entry.name}:</span> {entry.value.toFixed(2)}°C
          </p>
        ))}
        {warningThreshold && payload[0]?.value > warningThreshold && (
          <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Above warning threshold
          </p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tire Temperature Trends</CardTitle>
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
          <CardTitle>Tire Temperature Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No tire temperature data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tire Temperature Trends {trackName && `- ${trackName}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              {showPrediction && (
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              )}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="lap"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {warningThreshold && (
              <ReferenceLine
                y={warningThreshold}
                stroke="#F59E0B"
                strokeDasharray="5 5"
                label={{ value: 'Warning Threshold', position: 'right' }}
              />
            )}
            <Area
              type="monotone"
              dataKey="temperature"
              name="Tire Temperature"
              stroke="#EF4444"
              fillOpacity={1}
              fill="url(#colorTemp)"
            />
            {showPrediction && chartData.some(d => d.predicted !== undefined) && (
              <Area
                type="monotone"
                dataKey="predicted"
                name="Predicted Temperature"
                stroke="#3B82F6"
                strokeDasharray="5 5"
                fillOpacity={1}
                fill="url(#colorPredicted)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
        {warningThreshold && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2 text-sm text-amber-500">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Warning threshold: {warningThreshold}°C - Monitor tire temperatures closely
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


