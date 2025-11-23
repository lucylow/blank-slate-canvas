import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface BehaviorMetric {
  category: string;
  value: number;
  optimal: number;
  pattern: 'aggressive' | 'defensive' | 'optimal';
}

interface TrackPoint {
  sector: string;
  brakingPoint: number;
  throttleApplication: number;
  corneringSpeed: number;
  gForce: number;
}

interface DriverBehaviorAnalyticsProps {
  selectedDriver: string;
}

const mockBehaviorData: BehaviorMetric[] = [
  { category: 'Braking Points', value: 85, optimal: 90, pattern: 'defensive' },
  { category: 'Throttle Application', value: 78, optimal: 85, pattern: 'aggressive' },
  { category: 'Cornering Speed', value: 92, optimal: 90, pattern: 'optimal' },
  { category: 'Smoothness', value: 88, optimal: 85, pattern: 'optimal' },
  { category: 'Overtaking', value: 65, optimal: 75, pattern: 'defensive' },
];

const mockTrackPoints: TrackPoint[] = [
  { sector: 'T1', brakingPoint: 120, throttleApplication: 85, corneringSpeed: 95, gForce: 2.1 },
  { sector: 'T2', brakingPoint: 115, throttleApplication: 90, corneringSpeed: 98, gForce: 2.3 },
  { sector: 'T3', brakingPoint: 125, throttleApplication: 80, corneringSpeed: 92, gForce: 2.0 },
  { sector: 'T4', brakingPoint: 110, throttleApplication: 88, corneringSpeed: 96, gForce: 2.2 },
  { sector: 'T5', brakingPoint: 118, throttleApplication: 82, corneringSpeed: 94, gForce: 2.1 },
];

const radarData = mockBehaviorData.map(item => ({
  category: item.category,
  current: item.value,
  optimal: item.optimal,
}));

export function DriverBehaviorAnalytics({ selectedDriver }: DriverBehaviorAnalyticsProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'track-map' | 'patterns'>('overview');

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'optimal':
        return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'aggressive':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'defensive':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
    }
  };

  const insights = [
    {
      type: 'warning' as const,
      icon: <AlertTriangle className="h-4 w-4" />,
      message: 'Throttle application is aggressive - may increase tire wear',
    },
    {
      type: 'info' as const,
      icon: <Info className="h-4 w-4" />,
      message: 'Overtaking opportunities being missed - consider more aggressive approach',
    },
    {
      type: 'success' as const,
      icon: <CheckCircle2 className="h-4 w-4" />,
      message: 'Cornering speed and smoothness are optimal',
    },
  ];

  return (
    <div className="space-y-4">
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="track-map">Track Analysis</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Insights */}
          <div className="grid grid-cols-1 gap-2">
            {insights.map((insight, idx) => (
              <Card key={idx} className={`border-l-4 ${
                insight.type === 'warning' ? 'border-yellow-500' :
                insight.type === 'success' ? 'border-green-500' :
                'border-blue-500'
              }`}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    {insight.icon}
                    <p className="text-sm">{insight.message}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Radar</CardTitle>
              <CardDescription>Current vs Optimal performance across key metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" tick={{ fill: 'currentColor', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'currentColor', fontSize: 10 }} />
                  <Radar 
                    name="Current" 
                    dataKey="current" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6} 
                  />
                  <Radar 
                    name="Optimal" 
                    dataKey="optimal" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3} 
                  />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Behavior Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockBehaviorData.map((metric) => (
              <Card key={metric.category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{metric.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">{metric.value}%</span>
                    <Badge className={getPatternColor(metric.pattern)}>
                      {metric.pattern}
                    </Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        metric.value >= metric.optimal ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Optimal: {metric.optimal}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="track-map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Track Sector Analysis</CardTitle>
              <CardDescription>Telemetry data mapped to track sectors</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={mockTrackPoints}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="sector" tick={{ fill: 'currentColor' }} />
                  <YAxis tick={{ fill: 'currentColor' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="brakingPoint" fill="#ef4444" name="Braking Point (m)" />
                  <Bar dataKey="throttleApplication" fill="#10b981" name="Throttle (%)" />
                  <Bar dataKey="corneringSpeed" fill="#3b82f6" name="Cornering Speed (km/h)" />
                  <Bar dataKey="gForce" fill="#f59e0b" name="G-Force" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Track Heatmap Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Track Heatmap</CardTitle>
              <CardDescription>Visual representation of driver performance across track</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {mockTrackPoints.map((point) => (
                  <div key={point.sector} className="text-center">
                    <div 
                      className="h-16 rounded-md mb-2 flex items-center justify-center text-white font-bold"
                      style={{
                        backgroundColor: point.gForce > 2.2 ? '#ef4444' : 
                                       point.gForce > 2.1 ? '#f59e0b' : 
                                       point.gForce > 2.0 ? '#10b981' : '#3b82f6'
                      }}
                    >
                      {point.sector}
                    </div>
                    <p className="text-xs text-muted-foreground">{point.gForce}G</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>High G-Force</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Medium</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Optimal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Low</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Driving Pattern Analysis</CardTitle>
              <CardDescription>Detected patterns in driver behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Over-Aggression Detected</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Driver is applying throttle too aggressively in sectors T2 and T4, 
                    leading to increased tire wear and potential instability.
                  </p>
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500">
                    Moderate Risk
                  </Badge>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Defensive Driving Pattern</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Driver is being overly cautious in overtaking situations, 
                    missing opportunities to gain positions.
                  </p>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-500">
                    Low Risk
                  </Badge>
                </div>
                <div className="p-4 border rounded-lg border-green-500/50">
                  <h4 className="font-semibold mb-2">Optimal Cornering</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Cornering speed and smoothness are at optimal levels, 
                    maintaining good tire life while maximizing speed.
                  </p>
                  <Badge variant="outline" className="bg-green-500/20 text-green-500">
                    Excellent
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


