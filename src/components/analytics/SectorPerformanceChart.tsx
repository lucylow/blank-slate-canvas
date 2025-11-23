import React, { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface SectorData {
  sector: string;
  avgTime: number;
  bestTime: number;
  consistency: number;
  improvement?: number;
}

interface SectorPerformanceChartProps {
  data?: SectorData[];
  loading?: boolean;
  trackName?: string;
}

export function SectorPerformanceChart({
  data,
  loading,
  trackName,
}: SectorPerformanceChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Normalize data for radar chart (0-100 scale)
    const maxTime = Math.max(...data.map(d => d.avgTime));
    const maxConsistency = Math.max(...data.map(d => d.consistency));
    
    return data.map(sector => ({
      sector: sector.sector,
      'Average Time': (sector.avgTime / maxTime) * 100,
      'Best Time': (sector.bestTime / maxTime) * 100,
      'Consistency': (sector.consistency / maxConsistency) * 100,
      improvement: sector.improvement || 0,
    }));
  }, [data]);

  const rawData = useMemo(() => data || [], [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    
    const sector = payload[0].payload.sector;
    const rawSector = rawData.find(d => d.sector === sector);
    
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{sector}</p>
        {rawSector && (
          <>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Avg Time:</span> {rawSector.avgTime.toFixed(3)}s
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Best Time:</span> {rawSector.bestTime.toFixed(3)}s
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Consistency:</span> {rawSector.consistency.toFixed(1)}%
            </p>
            {rawSector.improvement && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Improvement:</span> {rawSector.improvement > 0 ? '+' : ''}
                {rawSector.improvement.toFixed(3)}s
              </p>
            )}
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sector Performance Analysis</CardTitle>
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
          <CardTitle>Sector Performance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No sector performance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sector Performance Analysis {trackName && `- ${trackName}`}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="sector"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Radar
              name="Average Time"
              dataKey="Average Time"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
            />
            <Radar
              name="Best Time"
              dataKey="Best Time"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.4}
            />
            <Radar
              name="Consistency"
              dataKey="Consistency"
              stroke="#F59E0B"
              fill="#F59E0B"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {rawData.map((sector) => (
            <div
              key={sector.sector}
              className="p-3 rounded-lg border border-border bg-card/50"
            >
              <div className="font-semibold text-sm mb-2">{sector.sector}</div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Avg:</span> {sector.avgTime.toFixed(3)}s
                </div>
                <div>
                  <span className="font-medium">Best:</span> {sector.bestTime.toFixed(3)}s
                </div>
                <div>
                  <span className="font-medium">Consistency:</span> {sector.consistency.toFixed(1)}%
                </div>
                {sector.improvement !== undefined && (
                  <div className={sector.improvement > 0 ? 'text-green-500' : 'text-red-500'}>
                    <span className="font-medium">Δ:</span> {sector.improvement > 0 ? '+' : ''}
                    {sector.improvement.toFixed(3)}s
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

