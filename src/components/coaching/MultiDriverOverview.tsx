import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { Users, TrendingUp, AlertTriangle, Target } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Driver {
  id: string;
  name: string;
  carNumber: number;
  position: number;
  lapTime: number;
  tireWear: number;
  stressLevel: number;
  status: 'optimal' | 'needs-attention' | 'critical';
  metrics: {
    label: string;
    value: number;
    unit: string;
  }[];
}

interface MultiDriverOverviewProps {
  onSelectDriver: (driverId: string) => void;
}

const mockDrivers: Driver[] = [
  {
    id: 'driver-1',
    name: 'Alex Johnson',
    carNumber: 23,
    position: 3,
    lapTime: 89.45,
    tireWear: 72,
    stressLevel: 65,
    status: 'needs-attention',
    metrics: [
      { label: 'Lap Time', value: 89.45, unit: 's' },
      { label: 'Tire Wear', value: 72, unit: '%' },
      { label: 'Stress', value: 65, unit: '%' },
      { label: 'Fuel', value: 45, unit: '%' },
    ],
  },
  {
    id: 'driver-2',
    name: 'Sarah Chen',
    carNumber: 45,
    position: 1,
    lapTime: 88.12,
    tireWear: 68,
    stressLevel: 58,
    status: 'optimal',
    metrics: [
      { label: 'Lap Time', value: 88.12, unit: 's' },
      { label: 'Tire Wear', value: 68, unit: '%' },
      { label: 'Stress', value: 58, unit: '%' },
      { label: 'Fuel', value: 52, unit: '%' },
    ],
  },
  {
    id: 'driver-3',
    name: 'Mike Rodriguez',
    carNumber: 12,
    position: 5,
    lapTime: 90.23,
    tireWear: 78,
    stressLevel: 72,
    status: 'critical',
    metrics: [
      { label: 'Lap Time', value: 90.23, unit: 's' },
      { label: 'Tire Wear', value: 78, unit: '%' },
      { label: 'Stress', value: 72, unit: '%' },
      { label: 'Fuel', value: 38, unit: '%' },
    ],
  },
];

const comparisonData = mockDrivers.map(driver => ({
  name: driver.name,
  lapTime: driver.lapTime,
  tireWear: driver.tireWear,
  stressLevel: driver.stressLevel,
}));

export function MultiDriverOverview({ onSelectDriver }: MultiDriverOverviewProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'comparison' | 'outliers'>('overview');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'needs-attention':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'critical':
        return 'bg-red-500/20 text-red-500 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
    }
  };

  const outliers = mockDrivers.filter(d => d.status === 'critical' || d.status === 'needs-attention');

  return (
    <div className="space-y-4">
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="outliers">Outliers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Outliers Alert */}
          {outliers.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Drivers Requiring Attention</AlertTitle>
              <AlertDescription>
                {outliers.length} driver{outliers.length > 1 ? 's' : ''} need coaching intervention
              </AlertDescription>
            </Alert>
          )}

          {/* Driver Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockDrivers.map((driver) => (
              <Card
                key={driver.id}
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  driver.status === 'critical' ? 'border-red-500/50' :
                  driver.status === 'needs-attention' ? 'border-yellow-500/50' :
                  'border-green-500/50'
                }`}
                onClick={() => onSelectDriver(driver.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{driver.name}</CardTitle>
                      <CardDescription>Car #{driver.carNumber} • P{driver.position}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(driver.status)}>
                      {driver.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {driver.metrics.map((metric) => (
                      <div key={metric.label} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{metric.label}</span>
                        <span className="font-semibold">
                          {metric.value}{metric.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDriver(driver.id);
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          {/* Performance Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Comparison</CardTitle>
              <CardDescription>Side-by-side comparison of all drivers</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="lap-time" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="lap-time">Lap Time</TabsTrigger>
                  <TabsTrigger value="tire-wear">Tire Wear</TabsTrigger>
                  <TabsTrigger value="stress">Stress Level</TabsTrigger>
                </TabsList>

                <TabsContent value="lap-time">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fill: 'currentColor' }} />
                      <YAxis tick={{ fill: 'currentColor' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="lapTime" fill="#3b82f6" name="Lap Time (s)" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="tire-wear">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fill: 'currentColor' }} />
                      <YAxis tick={{ fill: 'currentColor' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="tireWear" fill="#f59e0b" name="Tire Wear (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="stress">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fill: 'currentColor' }} />
                      <YAxis tick={{ fill: 'currentColor' }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="stressLevel" fill="#ef4444" name="Stress Level (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Driver</th>
                      <th className="text-right p-2">Lap Time</th>
                      <th className="text-right p-2">Tire Wear</th>
                      <th className="text-right p-2">Stress</th>
                      <th className="text-center p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockDrivers.map((driver) => (
                      <tr key={driver.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{driver.name}</td>
                        <td className="text-right p-2">{driver.lapTime}s</td>
                        <td className="text-right p-2">{driver.tireWear}%</td>
                        <td className="text-right p-2">{driver.stressLevel}%</td>
                        <td className="text-center p-2">
                          <Badge className={getStatusColor(driver.status)}>
                            {driver.status.replace('-', ' ')}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drivers Requiring Coaching Attention</CardTitle>
              <CardDescription>Outliers detected in performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {outliers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>All drivers performing within optimal ranges</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {outliers.map((driver) => (
                    <Card key={driver.id} className="border-2 border-yellow-500/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{driver.name} - Car #{driver.carNumber}</CardTitle>
                            <CardDescription>Position: P{driver.position}</CardDescription>
                          </div>
                          <Badge className={getStatusColor(driver.status)}>
                            {driver.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {driver.status === 'critical' && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                Critical issues detected. Immediate coaching intervention recommended.
                              </AlertDescription>
                            </Alert>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Issue</p>
                              <p className="font-semibold">
                                {driver.tireWear > 75 ? 'High Tire Wear' :
                                 driver.stressLevel > 70 ? 'Elevated Stress' :
                                 'Performance Decline'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Recommended Action</p>
                              <p className="font-semibold">
                                {driver.tireWear > 75 ? 'Pit Strategy Review' :
                                 driver.stressLevel > 70 ? 'Stress Management' :
                                 'Performance Analysis'}
                              </p>
                            </div>
                          </div>
                          <Button
                            className="w-full mt-4"
                            onClick={() => onSelectDriver(driver.id)}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Analyze Driver
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


