import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface KPIMetric {
  id: string;
  label: string;
  value: number | string;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'steady';
  trendValue?: number;
  historicalData: { timestamp: string; value: number }[];
  target?: number;
}

interface RealTimeKPIsProps {
  selectedDriver: string;
}

const mockKPIData: KPIMetric[] = [
  {
    id: 'lap-time',
    label: 'Lap Time',
    value: 89.45,
    unit: 's',
    status: 'good',
    trend: 'down',
    trendValue: -0.8,
    target: 88.0,
    historicalData: [
      { timestamp: 'Lap 1', value: 91.2 },
      { timestamp: 'Lap 2', value: 90.5 },
      { timestamp: 'Lap 3', value: 90.1 },
      { timestamp: 'Lap 4', value: 89.8 },
      { timestamp: 'Lap 5', value: 89.45 },
    ],
  },
  {
    id: 'tire-health',
    label: 'Tire Health',
    value: 72,
    unit: '%',
    status: 'warning',
    trend: 'down',
    trendValue: -3,
    target: 80,
    historicalData: [
      { timestamp: 'Lap 1', value: 85 },
      { timestamp: 'Lap 2', value: 82 },
      { timestamp: 'Lap 3', value: 78 },
      { timestamp: 'Lap 4', value: 75 },
      { timestamp: 'Lap 5', value: 72 },
    ],
  },
  {
    id: 'heart-rate',
    label: 'Heart Rate',
    value: 145,
    unit: 'BPM',
    status: 'good',
    trend: 'steady',
    target: 150,
    historicalData: [
      { timestamp: 'Lap 1', value: 142 },
      { timestamp: 'Lap 2', value: 144 },
      { timestamp: 'Lap 3', value: 145 },
      { timestamp: 'Lap 4', value: 145 },
      { timestamp: 'Lap 5', value: 145 },
    ],
  },
  {
    id: 'fuel-efficiency',
    label: 'Fuel Efficiency',
    value: 4.2,
    unit: 'L/lap',
    status: 'good',
    trend: 'up',
    trendValue: 0.1,
    target: 4.5,
    historicalData: [
      { timestamp: 'Lap 1', value: 4.5 },
      { timestamp: 'Lap 2', value: 4.4 },
      { timestamp: 'Lap 3', value: 4.3 },
      { timestamp: 'Lap 4', value: 4.25 },
      { timestamp: 'Lap 5', value: 4.2 },
    ],
  },
];

export function RealTimeKPIs({ selectedDriver }: RealTimeKPIsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'critical':
        return 'bg-red-500/20 text-red-500 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const criticalAlerts = useMemo(() => {
    return mockKPIData.filter(kpi => kpi.status === 'critical');
  }, []);

  return (
    <div className="space-y-4">
      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Critical Alerts</AlertTitle>
          <AlertDescription>
            {criticalAlerts.map(kpi => (
              <div key={kpi.id}>
                {kpi.label} is at critical level: {kpi.value}{kpi.unit}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockKPIData.map((kpi) => (
          <Card key={kpi.id} className={`border-2 ${getStatusColor(kpi.status)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                <Badge variant="outline" className={getStatusColor(kpi.status)}>
                  {kpi.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{kpi.value}</span>
                <span className="text-sm text-muted-foreground">{kpi.unit}</span>
                <div className="ml-auto flex items-center gap-1">
                  {getTrendIcon(kpi.trend)}
                  {kpi.trendValue && (
                    <span className={`text-xs ${kpi.trend === 'up' ? 'text-green-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                      {kpi.trendValue > 0 ? '+' : ''}{kpi.trendValue}{kpi.unit}
                    </span>
                  )}
                </div>
              </div>
              {kpi.target && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Target: {kpi.target}{kpi.unit}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Historical Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockKPIData.map((kpi) => (
          <Card key={`chart-${kpi.id}`}>
            <CardHeader>
              <CardTitle className="text-lg">{kpi.label} Trend</CardTitle>
              <CardDescription>Last 5 laps performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={kpi.historicalData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="timestamp" 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={kpi.status === 'good' ? '#10b981' : kpi.status === 'warning' ? '#f59e0b' : '#ef4444'}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name={`${kpi.label} (${kpi.unit})`}
                  />
                  {kpi.target && (
                    <Line 
                      type="monotone" 
                      dataKey={() => kpi.target!} 
                      stroke="#6b7280"
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      dot={false}
                      name="Target"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

