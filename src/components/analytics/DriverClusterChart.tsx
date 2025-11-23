import React, { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ClusterData {
  cluster: number;
  avgSpeed: number;
  tireTemp: number;
  sampleCount: number;
  description: string;
}

interface DriverClusterChartProps {
  data?: ClusterData[];
  loading?: boolean;
  trackName?: string;
}

const CLUSTER_COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'];

export function DriverClusterChart({ data, loading, trackName }: DriverClusterChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((cluster, index) => ({
      x: cluster.avgSpeed,
      y: cluster.tireTemp,
      z: cluster.sampleCount,
      cluster: cluster.cluster,
      description: cluster.description,
      color: CLUSTER_COLORS[index % CLUSTER_COLORS.length],
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">Cluster {data.cluster}</p>
        <p className="text-sm text-muted-foreground mb-1">
          <span className="font-medium">Speed:</span> {data.x.toFixed(2)} km/h
        </p>
        <p className="text-sm text-muted-foreground mb-1">
          <span className="font-medium">Tire Temp:</span> {data.y.toFixed(2)}°C
        </p>
        <p className="text-sm text-muted-foreground mb-1">
          <span className="font-medium">Samples:</span> {data.z}
        </p>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-2 italic">{data.description}</p>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Driver Cluster Analysis</CardTitle>
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
          <CardTitle>Driver Cluster Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No cluster data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Cluster Analysis {trackName && `- ${trackName}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            data={chartData}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              type="number"
              dataKey="x"
              name="Average Speed"
              unit=" km/h"
              stroke="hsl(var(--muted-foreground))"
              label={{ value: 'Average Speed (km/h)', position: 'insideBottom', offset: -10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Tire Temperature"
              unit="°C"
              stroke="hsl(var(--muted-foreground))"
              label={{ value: 'Tire Temperature (°C)', angle: -90, position: 'insideLeft' }}
            />
            <ZAxis
              type="number"
              dataKey="z"
              range={[50, 400]}
              name="Sample Count"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Scatter name="Driver Clusters" data={chartData} fill="#8884d8">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.map((cluster, index) => (
            <div
              key={cluster.cluster}
              className="p-3 rounded-lg border border-border bg-card/50"
              style={{ borderLeftColor: CLUSTER_COLORS[index % CLUSTER_COLORS.length], borderLeftWidth: 4 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CLUSTER_COLORS[index % CLUSTER_COLORS.length] }}
                />
                <span className="font-semibold text-sm">Cluster {cluster.cluster}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                {cluster.sampleCount} samples
              </p>
              <p className="text-xs text-muted-foreground">
                {cluster.avgSpeed.toFixed(1)} km/h • {cluster.tireTemp.toFixed(1)}°C
              </p>
              {cluster.description && (
                <p className="text-xs text-muted-foreground mt-2 italic">{cluster.description}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

