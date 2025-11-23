// src/pages/AnomalyDetectionPage.tsx
// Enhanced Anomaly Detection Page with Mock Data, Interactive Features, and Charts

import { RouteLayout } from '@/components/layout/RouteLayout';
import { AlertCircle, Activity, Wifi, CheckCircle2, Filter, TrendingUp, TrendingDown, BarChart3, PieChart, LineChart as LineChartIcon, Calendar, Clock, Download, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { checkAnomalyHealth, type AnomalyDetectionResult, type AnomalyAlert, type AnomalyStats } from '@/api/anomaly';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Mock data generation
interface MockAnomalyData extends AnomalyDetectionResult {
  sensor_type: string;
  location: string;
  lap_number: number;
  session_time: number;
}

const SENSORS = [
  'Brake Temperature',
  'Tire Pressure',
  'Steering Input',
  'Engine RPM',
  'Throttle Position',
  'Lateral G-Force',
  'Longitudinal G-Force',
  'Oil Temperature',
  'Coolant Temperature',
  'Wheel Speed'
];

const SEVERITIES: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
const LOCATIONS = ['Turn 1', 'Turn 3', 'Turn 5', 'Turn 7', 'Turn 9', 'Straight', 'Chicane', 'S-Curves'];

function generateMockAnomalies(count: number = 100): MockAnomalyData[] {
  const anomalies: MockAnomalyData[] = [];
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const sensor = SENSORS[Math.floor(Math.random() * SENSORS.length)];
    const severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
    const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
    const lap = Math.floor(Math.random() * 50) + 1;
    const sessionTime = Math.random() * 3600; // 0-3600 seconds
    const anomalyScore = 0.5 + Math.random() * 0.5; // 0.5-1.0
    const timestamp = new Date(now - Math.random() * dayInMs).toISOString();

    const alerts: AnomalyAlert[] = [
      {
        type: Math.random() > 0.5 ? 'ml_detected' : 'critical',
        sensor,
        message: `${severity === 'high' ? 'Critical' : severity === 'medium' ? 'Warning' : 'Notice'}: ${sensor} anomaly detected in ${location}`,
        severity,
        score: anomalyScore,
        contributing_features: [sensor.toLowerCase().replace(/\s+/g, '_'), 'lateral_g', 'speed'],
        value: Math.random() * 100,
        threshold: 50 + Math.random() * 30,
      }
    ];

    anomalies.push({
      is_anomaly: true,
      anomaly_score: anomalyScore,
      alerts,
      timestamp,
      vehicle_id: `vehicle_${Math.floor(Math.random() * 5) + 1}`,
      vehicle_number: Math.floor(Math.random() * 5) + 1,
      lap,
      sensor_type: sensor,
      location,
      lap_number: lap,
      session_time: sessionTime,
    });
  }

  return anomalies.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function generateMockStats(anomalies: MockAnomalyData[]): AnomalyStats {
  const severityCounts = {
    high: 0,
    medium: 0,
    low: 0,
  };

  const sensorCounts: Record<string, number> = {};
  
  anomalies.forEach(anomaly => {
    const severity = anomaly.alerts[0]?.severity || 'medium';
    severityCounts[severity]++;
    const sensor = anomaly.sensor_type;
    sensorCounts[sensor] = (sensorCounts[sensor] || 0) + 1;
  });

  const topSensors = Object.entries(sensorCounts)
    .map(([sensor, count]) => ({ sensor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    total_points: anomalies.length * 10,
    anomaly_count: anomalies.length,
    anomaly_rate: (anomalies.length / (anomalies.length * 10)) * 100,
    critical_alerts: severityCounts.high,
    rate_of_change_alerts: Math.floor(anomalies.length * 0.3),
    ml_detected_anomalies: Math.floor(anomalies.length * 0.7),
    avg_anomaly_score: anomalies.reduce((sum, a) => sum + a.anomaly_score, 0) / anomalies.length,
    top_anomalous_sensors: topSensors,
  };
}

export default function AnomalyDetectionPage() {
  const [showHealth, setShowHealth] = useState(false);
  const [mockData, setMockData] = useState<MockAnomalyData[]>(generateMockAnomalies(150));
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [sensorFilter, setSensorFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('24h');
  const [sortBy, setSortBy] = useState<string>('timestamp');

  const { data: anomalyHealth, refetch: refetchAnomalyHealth, isLoading } = useQuery({
    queryKey: ['anomaly-health'],
    queryFn: checkAnomalyHealth,
    enabled: showHealth,
    retry: 1,
  });

  // Generate mock stats from current data
  const mockStats = useMemo(() => generateMockStats(mockData), [mockData]);

  // Filter anomalies based on selected filters
  const filteredAnomalies = useMemo(() => {
    let filtered = [...mockData];

    if (severityFilter !== 'all') {
      filtered = filtered.filter(a => a.alerts[0]?.severity === severityFilter);
    }

    if (sensorFilter !== 'all') {
      filtered = filtered.filter(a => a.sensor_type === sensorFilter);
    }

    const now = Date.now();
    const rangeMs = dateRange === '1h' ? 60 * 60 * 1000 :
                    dateRange === '24h' ? 24 * 60 * 60 * 1000 :
                    dateRange === '7d' ? 7 * 24 * 60 * 60 * 1000 : Infinity;
    
    if (rangeMs !== Infinity) {
      filtered = filtered.filter(a => (now - new Date(a.timestamp).getTime()) <= rangeMs);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'score':
          return b.anomaly_score - a.anomaly_score;
        case 'severity': {
          const severityOrder = { high: 3, medium: 2, low: 1 };
          return (severityOrder[b.alerts[0]?.severity || 'medium'] || 0) - 
                 (severityOrder[a.alerts[0]?.severity || 'medium'] || 0);
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [mockData, severityFilter, sensorFilter, dateRange, sortBy]);

  // Chart data transformations
  const timelineData = useMemo(() => {
    const hourGroups: Record<string, number> = {};
    filteredAnomalies.forEach(anomaly => {
      const date = new Date(anomaly.timestamp);
      const hour = date.toISOString().slice(0, 13) + ':00';
      hourGroups[hour] = (hourGroups[hour] || 0) + 1;
    });

    return Object.entries(hourGroups)
      .map(([time, count]) => ({ time: new Date(time).toLocaleString(), count }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [filteredAnomalies]);

  const severityDistribution = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    filteredAnomalies.forEach(a => {
      const severity = a.alerts[0]?.severity || 'medium';
      counts[severity]++;
    });
    return [
      { name: 'High', value: counts.high, color: '#ef4444' },
      { name: 'Medium', value: counts.medium, color: '#f59e0b' },
      { name: 'Low', value: counts.low, color: '#3b82f6' },
    ];
  }, [filteredAnomalies]);

  const sensorDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAnomalies.forEach(a => {
      counts[a.sensor_type] = (counts[a.sensor_type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredAnomalies]);

  const scoreDistribution = useMemo(() => {
    const buckets: Record<string, number> = {};
    filteredAnomalies.forEach(a => {
      const bucket = Math.floor(a.anomaly_score * 10) / 10;
      const bucketKey = `${(bucket * 100).toFixed(0)}-${((bucket + 0.1) * 100).toFixed(0)}%`;
      buckets[bucketKey] = (buckets[bucketKey] || 0) + 1;
    });
    return Object.entries(buckets)
      .map(([score, count]) => ({ score, count }))
      .sort((a, b) => a.score.localeCompare(b.score));
  }, [filteredAnomalies]);

  const locationDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredAnomalies.forEach(a => {
      counts[a.location] = (counts[a.location] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredAnomalies]);

  const lapAnomalyTrend = useMemo(() => {
    const lapGroups: Record<number, { count: number; avgScore: number }> = {};
    filteredAnomalies.forEach(a => {
      if (!lapGroups[a.lap_number]) {
        lapGroups[a.lap_number] = { count: 0, avgScore: 0 };
      }
      lapGroups[a.lap_number].count++;
      lapGroups[a.lap_number].avgScore += a.anomaly_score;
    });

    return Object.entries(lapGroups)
      .map(([lap, data]) => ({
        lap: parseInt(lap),
        count: data.count,
        avgScore: data.avgScore / data.count,
      }))
      .sort((a, b) => a.lap - b.lap);
  }, [filteredAnomalies]);

  // Real-time simulation
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance to add new anomaly
        const newAnomaly = generateMockAnomalies(1)[0];
        setMockData(prev => [newAnomaly, ...prev].slice(0, 200));
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  const handleRefresh = () => {
    setMockData(generateMockAnomalies(150));
  };

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Sensor', 'Severity', 'Score', 'Location', 'Lap', 'Vehicle'].join(','),
      ...filteredAnomalies.map(a => [
        a.timestamp,
        a.sensor_type,
        a.alerts[0]?.severity || 'medium',
        a.anomaly_score.toFixed(3),
        a.location,
        a.lap_number,
        a.vehicle_number || '',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anomalies_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <RouteLayout>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mb-4 shadow-xl shadow-red-500/20">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Real-Time Anomaly Detection
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
                AI-powered anomaly detection for telemetry data with real-time alerts and ML-based pattern recognition
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Anomalies</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredAnomalies.length}</div>
              <p className="text-xs text-muted-foreground">from {mockStats.total_points} data points</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anomaly Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.anomaly_rate.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">Average score: {(mockStats.avg_anomaly_score * 100).toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{mockStats.critical_alerts}</div>
              <p className="text-xs text-muted-foreground">{mockStats.ml_detected_anomalies} ML detected</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Real-Time</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch checked={isRealTimeEnabled} onCheckedChange={setIsRealTimeEnabled} />
                <span className="text-sm">{isRealTimeEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sensor Type</Label>
                <Select value={sensorFilter} onValueChange={setSensorFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sensors</SelectItem>
                    {SENSORS.map(sensor => (
                      <SelectItem key={sensor} value={sensor}>{sensor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="timestamp">Timestamp</SelectItem>
                    <SelectItem value="score">Score</SelectItem>
                    <SelectItem value="severity">Severity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Anomaly Timeline</CardTitle>
                  <CardDescription>Anomalies detected over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Severity Distribution</CardTitle>
                  <CardDescription>Breakdown by severity level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={severityDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {severityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Anomalous Sensors</CardTitle>
                  <CardDescription>Most frequently detected anomalies</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={sensorDistribution} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location Distribution</CardTitle>
                  <CardDescription>Anomalies by track location</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={locationDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="location" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Anomaly Timeline Analysis</CardTitle>
                <CardDescription>Detailed timeline view of anomaly occurrences</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                  <CardDescription>Anomaly score frequency</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="score" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sensor Breakdown</CardTitle>
                  <CardDescription>Anomalies by sensor type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={sensorDistribution.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sensorDistribution.slice(0, 5).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lap-by-Lap Anomaly Trend</CardTitle>
                <CardDescription>Anomaly count and average score per lap</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={lapAnomalyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="lap" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.6}
                      name="Anomaly Count"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="avgScore"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Avg Score"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Anomaly Details</CardTitle>
            <CardDescription>
              {filteredAnomalies.length} anomalies found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Sensor</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Lap</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnomalies.slice(0, 50).map((anomaly, index) => {
                    const severity = anomaly.alerts[0]?.severity || 'medium';
                    const severityColors = {
                      high: 'bg-red-500/10 text-red-500 border-red-500/50',
                      medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50',
                      low: 'bg-blue-500/10 text-blue-500 border-blue-500/50',
                    };

                    return (
                      <TableRow key={index}>
                        <TableCell className="text-sm">
                          {new Date(anomaly.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{anomaly.sensor_type}</TableCell>
                        <TableCell>
                          <Badge className={severityColors[severity]}>
                            {severity.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(anomaly.anomaly_score * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell>{anomaly.location}</TableCell>
                        <TableCell>{anomaly.lap_number}</TableCell>
                        <TableCell>#{anomaly.vehicle_number}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {anomaly.alerts[0]?.message || 'Anomaly detected'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {filteredAnomalies.length > 50 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Showing first 50 of {filteredAnomalies.length} anomalies
              </p>
            )}
          </CardContent>
        </Card>

        {/* Service Health Check */}
        <Card>
          <CardHeader>
            <CardTitle>Service Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Check the status of the anomaly detection service
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowHealth(true);
                  refetchAnomalyHealth();
                }}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                disabled={isLoading}
              >
                {anomalyHealth ? 'Refresh Service Health' : 'Check Service Health'}
              </Button>
            </div>

            {anomalyHealth && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <p className="text-lg font-semibold text-green-500">{anomalyHealth.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">PyOD Available</p>
                  <p className="text-lg font-semibold">
                    {anomalyHealth.pyod_available ? '✅ Yes' : '❌ No'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Connections</p>
                  <p className="text-lg font-semibold">{anomalyHealth.active_connections || 0}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RouteLayout>
  );
}
