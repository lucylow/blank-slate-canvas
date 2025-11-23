import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Heart, Activity, Zap, Brain } from 'lucide-react';

interface PhysiologicalMetric {
  type: 'heart-rate' | 'g-force' | 'stress-index' | 'fatigue-level';
  label: string;
  current: number;
  max: number;
  status: 'normal' | 'elevated' | 'critical';
  historicalData: { timestamp: string; value: number }[];
  unit: string;
}

interface StressFatigueMonitoringProps {
  selectedDriver: string;
}

const mockPhysiologicalData: PhysiologicalMetric[] = [
  {
    type: 'heart-rate',
    label: 'Heart Rate',
    current: 145,
    max: 180,
    status: 'normal',
    unit: 'BPM',
    historicalData: [
      { timestamp: '0:00', value: 120 },
      { timestamp: '0:05', value: 135 },
      { timestamp: '0:10', value: 142 },
      { timestamp: '0:15', value: 145 },
      { timestamp: '0:20', value: 145 },
    ],
  },
  {
    type: 'g-force',
    label: 'G-Force Stress',
    current: 2.3,
    max: 3.5,
    status: 'elevated',
    unit: 'G',
    historicalData: [
      { timestamp: '0:00', value: 1.8 },
      { timestamp: '0:05', value: 2.0 },
      { timestamp: '0:10', value: 2.2 },
      { timestamp: '0:15', value: 2.3 },
      { timestamp: '0:20', value: 2.3 },
    ],
  },
  {
    type: 'stress-index',
    label: 'Stress Index',
    current: 72,
    max: 100,
    status: 'elevated',
    unit: '%',
    historicalData: [
      { timestamp: '0:00', value: 55 },
      { timestamp: '0:05', value: 62 },
      { timestamp: '0:10', value: 68 },
      { timestamp: '0:15', value: 70 },
      { timestamp: '0:20', value: 72 },
    ],
  },
  {
    type: 'fatigue-level',
    label: 'Fatigue Level',
    current: 35,
    max: 100,
    status: 'normal',
    unit: '%',
    historicalData: [
      { timestamp: '0:00', value: 15 },
      { timestamp: '0:05', value: 22 },
      { timestamp: '0:10', value: 28 },
      { timestamp: '0:15', value: 32 },
      { timestamp: '0:20', value: 35 },
    ],
  },
];

const mockHighRiskMoments = [
  {
    timestamp: '0:12:34',
    type: 'high-g-force' as const,
    message: 'Sustained 2.8G through Turn 3 - driver stress elevated',
    severity: 'warning' as const,
  },
  {
    timestamp: '0:18:45',
    type: 'heart-rate-spike' as const,
    message: 'Heart rate spike to 165 BPM during overtake',
    severity: 'info' as const,
  },
];

const mockRestStrategies = [
  {
    title: 'Breathing Exercise',
    description: 'Deep breathing pattern: 4-7-8 technique',
    duration: '2 minutes',
    effectiveness: 85,
  },
  {
    title: 'Focus Reset',
    description: 'Visualization exercise to reset mental state',
    duration: '1 minute',
    effectiveness: 75,
  },
  {
    title: 'Physical Relaxation',
    description: 'Progressive muscle relaxation during straight sections',
    duration: '30 seconds',
    effectiveness: 70,
  },
];

export function StressFatigueMonitoring({ selectedDriver }: StressFatigueMonitoringProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'elevated':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'critical':
        return 'bg-red-500/20 text-red-500 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'heart-rate':
        return <Heart className="h-5 w-5" />;
      case 'g-force':
        return <Zap className="h-5 w-5" />;
      case 'stress-index':
        return <Brain className="h-5 w-5" />;
      case 'fatigue-level':
        return <Activity className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const criticalMetrics = mockPhysiologicalData.filter(m => m.status === 'critical');
  const elevatedMetrics = mockPhysiologicalData.filter(m => m.status === 'elevated');

  return (
    <div className="space-y-4">
      {/* Critical Alerts */}
      {criticalMetrics.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Physiological Alert</AlertTitle>
          <AlertDescription>
            {criticalMetrics.map(metric => (
              <div key={metric.type}>
                {metric.label} is at critical level: {metric.current}{metric.unit}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* High Risk Moments */}
      {mockHighRiskMoments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>High Risk Moments</CardTitle>
            <CardDescription>Moments requiring coaching intervention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockHighRiskMoments.map((moment, idx) => (
                <Alert 
                  key={idx}
                  className={moment.severity === 'warning' ? 'border-yellow-500' : ''}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{moment.timestamp}</AlertTitle>
                  <AlertDescription>{moment.message}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Physiological Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockPhysiologicalData.map((metric) => (
          <Card key={metric.type} className={`border-2 ${getStatusColor(metric.status)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getIcon(metric.type)}
                  {metric.label}
                </CardTitle>
                <Badge className={getStatusColor(metric.status)}>
                  {metric.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{metric.current}</span>
                  <span className="text-sm text-muted-foreground">{metric.unit}</span>
                </div>
                <Progress value={(metric.current / metric.max) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Max: {metric.max}{metric.unit}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Historical Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockPhysiologicalData.map((metric) => (
          <Card key={`chart-${metric.type}`}>
            <CardHeader>
              <CardTitle className="text-lg">{metric.label} Trend</CardTitle>
              <CardDescription>Real-time monitoring over race duration</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={metric.historicalData}>
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
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={metric.status === 'critical' ? '#ef4444' : metric.status === 'elevated' ? '#f59e0b' : '#10b981'}
                    fill={metric.status === 'critical' ? '#ef4444' : metric.status === 'elevated' ? '#f59e0b' : '#10b981'}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rest & Recovery Strategies */}
      {elevatedMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommended Rest Strategies</CardTitle>
            <CardDescription>Strategies to manage elevated stress and fatigue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockRestStrategies.map((strategy, idx) => (
                <Card key={idx} className="border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{strategy.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      {strategy.description}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Duration:</span>
                        <span className="font-semibold">{strategy.duration}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Effectiveness:</span>
                        <span className="font-semibold">{strategy.effectiveness}%</span>
                      </div>
                      <Progress value={strategy.effectiveness} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

