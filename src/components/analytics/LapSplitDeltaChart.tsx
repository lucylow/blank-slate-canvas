/**
 * Lap Split Delta Chart Component
 * Visualizes sector/lap split differences across cars for comparison
 * 
 * Uses Recharts to display multi-series line chart showing delta splits
 * for each car on each lap or sector
 */
import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getSplitDeltas, type SplitDeltaData, type SplitDeltaResponse } from '@/api/pitwall';
import { useQuery } from '@tanstack/react-query';

interface LapSplitDeltaChartProps {
  track: string;
  race: number;
  cars: number[];
  refCar?: number;
  className?: string;
}

type ChartView = 'all-sectors' | 'sector-1' | 'sector-2' | 'sector-3';

export function LapSplitDeltaChart({
  track,
  race,
  cars,
  refCar,
  className
}: LapSplitDeltaChartProps) {
  const [chartView, setChartView] = useState<ChartView>('all-sectors');
  const defaultRefCar = refCar ?? cars[0];

  // Fetch split delta data
  const { data, isLoading, error } = useQuery<SplitDeltaResponse>({
    queryKey: ['split-deltas', track, race, cars.join(','), defaultRefCar],
    queryFn: () => getSplitDeltas(track, race, cars, defaultRefCar),
    enabled: cars.length >= 2,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false
  });

  // Process data for chart display
  const chartData = useMemo(() => {
    if (!data?.delta_data || data.delta_data.length === 0) {
      return [];
    }

    // Group data by lap and compare_car
    const groupedByLap: Record<number, Record<number, SplitDeltaData>> = {};

    data.delta_data.forEach((item) => {
      if (!groupedByLap[item.lap]) {
        groupedByLap[item.lap] = {};
      }
      groupedByLap[item.lap][item.compare_car] = item;
    });

    // Convert to chart format
    const result: Array<Record<string, number | string>> = [];

    Object.keys(groupedByLap)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach((lap) => {
        const lapData: Record<string, number | string> = { lap: `L${lap}` };
        const lapNum = lap;

        // Add delta values for each compare car
        Object.keys(groupedByLap[lapNum]).forEach((carStr) => {
          const car = Number(carStr);
          const item = groupedByLap[lapNum][car];

          if (chartView === 'all-sectors') {
            // Show all sectors with different colors
            if (item.delta_S1 !== null) {
              lapData[`Car ${car} S1`] = item.delta_S1;
            }
            if (item.delta_S2 !== null) {
              lapData[`Car ${car} S2`] = item.delta_S2;
            }
            if (item.delta_S3 !== null) {
              lapData[`Car ${car} S3`] = item.delta_S3;
            }
          } else if (chartView === 'sector-1' && item.delta_S1 !== null) {
            lapData[`Car ${car}`] = item.delta_S1;
          } else if (chartView === 'sector-2' && item.delta_S2 !== null) {
            lapData[`Car ${car}`] = item.delta_S2;
          } else if (chartView === 'sector-3' && item.delta_S3 !== null) {
            lapData[`Car ${car}`] = item.delta_S3;
          }
        });

        result.push(lapData);
      });

    return result;
  }, [data, chartView]);

  // Generate colors for each car/sector combination
  const getColorForSeries = (seriesName: string): string => {
    if (seriesName.includes('S1')) return '#3B82F6'; // Blue
    if (seriesName.includes('S2')) return '#10B981'; // Green
    if (seriesName.includes('S3')) return '#EF4444'; // Red
    
    // For single sector view, assign colors by car
    const carNum = seriesName.match(/Car (\d+)/)?.[1];
    if (carNum) {
      const colors = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899'];
      const carIndex = cars.indexOf(Number(carNum));
      return colors[carIndex % colors.length];
    }
    
    return '#6B7280'; // Default gray
  };

  // Get all series names from chart data
  const seriesNames = useMemo(() => {
    if (chartData.length === 0) return [];
    
    const names = new Set<string>();
    chartData.forEach((item) => {
      Object.keys(item).forEach((key) => {
        if (key !== 'lap') {
          names.add(key);
        }
      });
    });
    
    return Array.from(names).sort();
  }, [chartData]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    if (!data?.delta_data || data.delta_data.length === 0) {
      return null;
    }

    const byCar: Record<number, { total: number; count: number; avg: number }> = {};

    data.delta_data.forEach((item) => {
      if (!byCar[item.compare_car]) {
        byCar[item.compare_car] = { total: 0, count: 0, avg: 0 };
      }

      const deltas = [item.delta_S1, item.delta_S2, item.delta_S3].filter(
        (d) => d !== null
      ) as number[];

      if (deltas.length > 0) {
        const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        byCar[item.compare_car].total += avgDelta;
        byCar[item.compare_car].count += 1;
      }
    });

    Object.keys(byCar).forEach((car) => {
      const carData = byCar[Number(car)];
      if (carData.count > 0) {
        carData.avg = carData.total / carData.count;
      }
    });

    return byCar;
  }, [data]);

  // Format tooltip value
  const formatDelta = (value: number): string => {
    if (value === null || value === undefined) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(3)}s`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatDelta(entry.value)}
          </p>
        ))}
      </div>
    );
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Lap Split Deltas</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Error loading split delta data: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Lap Split Deltas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.delta_data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Lap Split Deltas</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              {data?.meta?.message || 'No lap split delta data available'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Lap Split Deltas Comparison
            {data.meta.demo && (
              <Badge variant="outline" className="text-xs">
                Demo Data
              </Badge>
            )}
          </CardTitle>
          <Select value={chartView} onValueChange={(v) => setChartView(v as ChartView)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-sectors">All Sectors</SelectItem>
              <SelectItem value="sector-1">Sector 1 Only</SelectItem>
              <SelectItem value="sector-2">Sector 2 Only</SelectItem>
              <SelectItem value="sector-3">Sector 3 Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          Reference Car: <span className="font-semibold">#{data.meta.ref_car}</span> • Comparing: {cars.filter(c => c !== data.meta.ref_car).map(c => `#${c}`).join(', ')}
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Statistics */}
        {summary && (
          <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border">
            {Object.keys(summary).map((carStr) => {
              const car = Number(carStr);
              const carSummary = summary[car];
              const isFaster = carSummary.avg < 0;
              const isSlower = carSummary.avg > 0;
              
              return (
                <Badge
                  key={car}
                  variant={isFaster ? 'default' : isSlower ? 'secondary' : 'outline'}
                  className="flex items-center gap-1"
                >
                  Car #{car}:
                  {isFaster && <TrendingDown className="w-3 h-3" />}
                  {isSlower && <TrendingUp className="w-3 h-3" />}
                  {carSummary.avg === 0 && <Minus className="w-3 h-3" />}
                  {formatDelta(carSummary.avg)} avg
                </Badge>
              );
            })}
          </div>
        )}

        {/* Chart */}
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="lap"
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              label={{ value: 'Delta (s)', angle: -90, position: 'insideLeft' }}
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            {/* Reference line at zero */}
            <Line
              type="monotone"
              dataKey={() => 0}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              strokeWidth={1}
              dot={false}
              legendType="none"
              strokeOpacity={0.5}
            />
            
            {/* Dynamic lines for each series */}
            {seriesNames.map((seriesName) => (
              <Line
                key={seriesName}
                type="monotone"
                dataKey={seriesName}
                name={seriesName}
                stroke={getColorForSeries(seriesName)}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Chart explanation */}
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>
            <strong>Positive delta (+)</strong>: Compare car is slower than reference car
          </p>
          <p>
            <strong>Negative delta (-)</strong>: Compare car is faster than reference car
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default LapSplitDeltaChart;

