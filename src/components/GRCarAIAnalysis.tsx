// @ts-nocheck
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { grCars } from '@/lib/grCarData';
import { useTelemetry } from '@/hooks/useTelemetry';
import { Brain, TrendingUp, Zap, Gauge, Users, Car, Target } from 'lucide-react';

interface GRCarAIAnalysisProps {
  selectedTrack?: string;
}

const COLORS = {
  supra: '#ef4444',
  yaris: '#3b82f6',
  corolla: '#10b981',
  gr86: '#f59e0b',
};

const GRCarAIAnalysis: React.FC<GRCarAIAnalysisProps> = ({ selectedTrack }) => {
  const { drivers, telemetryData } = useTelemetry();

  // Calculate power-to-weight ratio data
  const powerToWeightData = useMemo(() => {
    return grCars.map(car => ({
      model: car.model,
      powerToWeight: parseFloat((car.power_hp / car.weight_kg).toFixed(3)),
      power: car.power_hp,
      weight: car.weight_kg,
    })).sort((a, b) => b.powerToWeight - a.powerToWeight);
  }, []);

  // Calculate performance metrics by car type
  const carPerformanceData = useMemo(() => {
    if (!drivers.length) {
      // Generate mock data based on car specs
      return grCars.map(car => {
        const baseLapTime = 100 + (1500 - car.weight_kg) * 0.01 + (400 - car.power_hp) * 0.05;
        return {
          model: car.model,
          avgLapTime: baseLapTime,
          bestLapTime: baseLapTime - 2,
          consistency: 95 - (car.weight_kg / 100),
          avgSpeed: 120 + (car.power_hp / 10),
          topSpeed: 180 + (car.power_hp / 5),
        };
      });
    }

    // Group drivers by car type
    const carGroups: Record<string, any[]> = {};
    drivers.forEach(driver => {
      const carType = driver.carType || 'unknown';
      if (!carGroups[carType]) carGroups[carType] = [];
      carGroups[carType].push(driver);
    });

    return Object.entries(carGroups).map(([carType, carDrivers]) => {
      const lapTimes = carDrivers.map(d => d.lastLapTime || d.bestLapTime).filter(Boolean);
      const avgLapTime = lapTimes.length > 0 
        ? lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length 
        : 100;
      const bestLapTime = lapTimes.length > 0 ? Math.min(...lapTimes) : avgLapTime - 2;
      
      // Calculate consistency (lower std dev = higher consistency)
      const variance = lapTimes.length > 0
        ? lapTimes.reduce((sum, time) => sum + Math.pow(time - avgLapTime, 2), 0) / lapTimes.length
        : 0;
      const stdDev = Math.sqrt(variance);
      const consistency = Math.max(0, 100 - (stdDev / avgLapTime) * 100);

      const car = grCars.find(c => c.model.toLowerCase().includes(carType.toLowerCase()) || 
                                   carType.toLowerCase().includes(c.model.toLowerCase().split(' ')[1]?.toLowerCase() || ''));
      
      return {
        model: car?.model || carType,
        avgLapTime: Number(avgLapTime.toFixed(2)),
        bestLapTime: Number(bestLapTime.toFixed(2)),
        consistency: Number(consistency.toFixed(1)),
        avgSpeed: 120 + ((car?.power_hp || 250) / 10),
        topSpeed: 180 + ((car?.power_hp || 250) / 5),
        driverCount: carDrivers.length,
      };
    });
  }, [drivers]);

  // Driver performance analysis
  const driverAnalysisData = useMemo(() => {
    if (!drivers.length) return [];

    return drivers.slice(0, 10).map(driver => ({
      carNumber: driver.carNumber,
      position: driver.position,
      gapToLeader: driver.gapToLeader,
      lastLapTime: driver.lastLapTime,
      bestLapTime: driver.bestLapTime,
      consistency: driver.lastLapTime && driver.bestLapTime 
        ? Math.max(0, 100 - Math.abs(driver.lastLapTime - driver.bestLapTime) * 10)
        : 95,
    })).sort((a, b) => a.position - b.position);
  }, [drivers]);

  // Car distribution pie chart data
  const carDistributionData = useMemo(() => {
    if (!drivers.length) {
      return grCars.map(car => ({
        name: car.model,
        value: 25, // Equal distribution for mock
      }));
    }

    const distribution: Record<string, number> = {};
    drivers.forEach(driver => {
      const carType = driver.carType || 'unknown';
      distribution[carType] = (distribution[carType] || 0) + 1;
    });

    return Object.entries(distribution).map(([carType, count]) => {
      const car = grCars.find(c => 
        c.model.toLowerCase().includes(carType.toLowerCase()) || 
        carType.toLowerCase().includes(c.model.toLowerCase().split(' ')[1]?.toLowerCase() || '')
      );
      return {
        name: car?.model || carType,
        value: count,
      };
    });
  }, [drivers]);

  // Radar chart data for car comparison
  const radarData = useMemo(() => {
    return grCars.map(car => ({
      model: car.model,
      Power: Math.min(100, (car.power_hp / 400) * 100),
      Weight: Math.max(0, Math.min(100, 100 - ((car.weight_kg - 1200) / 300) * 100)), // Inverted (lighter is better)
      'P/W Ratio': Math.min(100, (car.power_hp / car.weight_kg) * 100),
      Acceleration: Math.max(0, Math.min(100, 100 - ((car.accel_0_100 - 4) / 2) * 100)), // Inverted (faster is better)
      'Top Speed': Math.min(100, (car.power_hp / 400) * 100),
    }));
  }, []);

  // AI Insights
  const insights = useMemo(() => {
    const bestPowerToWeight = powerToWeightData[0];
    const bestPerformer = carPerformanceData.length > 0
      ? carPerformanceData.reduce((best, current) => 
          current.bestLapTime < best.bestLapTime ? current : best
        )
      : null;
    const mostConsistent = carPerformanceData.length > 0
      ? carPerformanceData.reduce((best, current) => 
          current.consistency > best.consistency ? current : best
        )
      : null;

    return {
      bestPowerToWeight: bestPowerToWeight?.model || 'N/A',
      bestPerformer: bestPerformer?.model || 'N/A',
      bestLapTime: bestPerformer?.bestLapTime || 0,
      mostConsistent: mostConsistent?.model || 'N/A',
      consistencyScore: mostConsistent?.consistency || 0,
      totalDrivers: drivers.length,
    };
  }, [powerToWeightData, carPerformanceData, drivers]);

  return (
    <div className="w-full space-y-6">
      {/* AI Insights Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            AI-Powered Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-card/60 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Best Power/Weight</div>
              <div className="text-lg font-bold text-primary">{insights.bestPowerToWeight}</div>
            </div>
            <div className="p-4 rounded-lg bg-card/60 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Fastest Lap</div>
              <div className="text-lg font-bold text-green-500">{insights.bestPerformer}</div>
              <div className="text-xs text-muted-foreground">{insights.bestLapTime}s</div>
            </div>
            <div className="p-4 rounded-lg bg-card/60 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Most Consistent</div>
              <div className="text-lg font-bold text-blue-500">{insights.mostConsistent}</div>
              <div className="text-xs text-muted-foreground">{insights.consistencyScore.toFixed(1)}%</div>
            </div>
            <div className="p-4 rounded-lg bg-card/60 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Total Drivers</div>
              <div className="text-lg font-bold">{insights.totalDrivers}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Power-to-Weight Ratio Chart */}
        <Card className="bg-card/60 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-4 h-4 text-primary" />
              Power-to-Weight Ratio Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={powerToWeightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis 
                  dataKey="model" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  label={{ value: 'hp/kg', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string, props: any) => {
                    if (name === 'powerToWeight') {
                      return [`${value.toFixed(3)} hp/kg`, 'Power/Weight'];
                    }
                    return [value, name];
                  }}
                />
                <Bar 
                  dataKey="powerToWeight" 
                  fill="hsl(var(--primary))"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Car Distribution Pie Chart */}
        <Card className="bg-card/60 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-4 h-4 text-primary" />
              Car Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={carDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {carDistributionData.map((entry, index) => {
                    const colorKey = entry.name.toLowerCase().includes('supra') ? 'supra' :
                                    entry.name.toLowerCase().includes('yaris') ? 'yaris' :
                                    entry.name.toLowerCase().includes('corolla') ? 'corolla' : 'gr86';
                    return <Cell key={`cell-${index}`} fill={COLORS[colorKey as keyof typeof COLORS] || '#8884d8'} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Comparison Line Chart */}
        <Card className="bg-card/60 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-4 h-4 text-primary" />
              Lap Time Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={carPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis 
                  dataKey="model" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  label={{ value: 'Time (s)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgLapTime" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Avg Lap Time"
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="bestLapTime" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Best Lap Time"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Consistency Chart */}
        <Card className="bg-card/60 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-4 h-4 text-primary" />
              Driver Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={driverAnalysisData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                <XAxis 
                  dataKey="carNumber" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  label={{ value: 'Car Number', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  label={{ value: 'Consistency %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Consistency']}
                />
                <Bar 
                  dataKey="consistency" 
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart for Multi-Dimensional Comparison */}
      <Card className="bg-card/60 backdrop-blur-md border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            Multi-Dimensional Car Performance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              />
              {radarData.map((entry) => {
                const colorKey = entry.model.toLowerCase().includes('supra') ? 'supra' :
                                entry.model.toLowerCase().includes('yaris') ? 'yaris' :
                                entry.model.toLowerCase().includes('corolla') ? 'corolla' : 'gr86';
                // Transform data for radar chart
                const radarChartData = [
                  { metric: 'Power', value: entry.Power },
                  { metric: 'Weight', value: entry.Weight },
                  { metric: 'P/W Ratio', value: entry['P/W Ratio'] },
                  { metric: 'Acceleration', value: entry.Acceleration },
                  { metric: 'Top Speed', value: entry['Top Speed'] },
                ];
                return (
                  <Radar
                    key={entry.model}
                    name={entry.model}
                    data={radarChartData}
                    dataKey="value"
                    stroke={COLORS[colorKey as keyof typeof COLORS] || '#8884d8'}
                    fill={COLORS[colorKey as keyof typeof COLORS] || '#8884d8'}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                );
              })}
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Driver Performance Table */}
      {driverAnalysisData.length > 0 && (
        <Card className="bg-card/60 backdrop-blur-md border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Top Driver Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-2 font-semibold">Position</th>
                    <th className="text-left p-2 font-semibold">Car #</th>
                    <th className="text-left p-2 font-semibold">Best Lap</th>
                    <th className="text-left p-2 font-semibold">Last Lap</th>
                    <th className="text-left p-2 font-semibold">Gap to Leader</th>
                    <th className="text-left p-2 font-semibold">Consistency</th>
                  </tr>
                </thead>
                <tbody>
                  {driverAnalysisData.slice(0, 10).map((driver, idx) => (
                    <tr key={idx} className="border-b border-border/30 hover:bg-accent/50 transition-colors">
                      <td className="p-2 font-medium">
                        <Badge variant={driver.position <= 3 ? "default" : "outline"}>
                          P{driver.position}
                        </Badge>
                      </td>
                      <td className="p-2">#{driver.carNumber}</td>
                      <td className="p-2">{driver.bestLapTime?.toFixed(2) || 'N/A'}s</td>
                      <td className="p-2">{driver.lastLapTime?.toFixed(2) || 'N/A'}s</td>
                      <td className="p-2">{driver.gapToLeader?.toFixed(2) || '0.00'}s</td>
                      <td className="p-2">
                        <Badge 
                          variant="outline" 
                          className={driver.consistency >= 95 ? "border-green-500/50 text-green-700 dark:text-green-400" : 
                                     driver.consistency >= 90 ? "border-yellow-500/50 text-yellow-700 dark:text-yellow-400" : 
                                     "border-red-500/50 text-red-700 dark:text-red-400"}
                        >
                          {driver.consistency.toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GRCarAIAnalysis;

