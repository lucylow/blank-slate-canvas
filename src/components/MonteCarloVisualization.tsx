/**
 * Monte Carlo Simulation Visualization Component
 * 
 * Interactive data visualization for pit window optimization Monte Carlo simulations
 * Features:
 * - Probability distribution charts
 * - Time series analysis
 * - Scenario comparison heatmaps
 * - Statistical summaries with confidence intervals
 * - Interactive filtering and analysis
 */

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity, 
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

export interface MonteCarloRun {
  runId: string;
  scenario: string;
  finalPosition: number;
  totalTime: number;
  timeGain: number;
  confidence: number;
  timestamp: number;
  factors: {
    tireWear: number;
    traffic: number;
    pitStopEfficiency: number;
    competitorTiming: number;
  };
}

export interface MonteCarloSimulationData {
  simulationId: string;
  carId: string;
  currentLap: number;
  totalRuns: number;
  runs: MonteCarloRun[];
  scenarios: string[];
  summary: {
    meanPosition: number;
    medianPosition: number;
    stdDevPosition: number;
    p5Position: number;
    p95Position: number;
    meanTimeGain: number;
    bestScenario: string;
    worstScenario: string;
  };
}

interface MonteCarloVisualizationProps {
  data: MonteCarloSimulationData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
};

const SCENARIO_COLORS: Record<string, string> = {
  'now': COLORS.danger,
  '+1': COLORS.warning,
  '+2': COLORS.info,
  'baseline': COLORS.primary,
  'optimal': COLORS.success,
};

export default function MonteCarloVisualization({
  data,
  isLoading = false,
  onRefresh,
  className = '',
}: MonteCarloVisualizationProps) {
  const [selectedScenario, setSelectedScenario] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'distribution' | 'time-series' | 'heatmap' | 'statistics'>('distribution');

  // Generate mock data if no data provided
  const simulationData = useMemo(() => {
    if (data) return data;
    
    // Generate comprehensive mock Monte Carlo data
    const scenarios = ['now', '+1', '+2', 'optimal'];
    const runs: MonteCarloRun[] = [];
    
    scenarios.forEach((scenario, scenarioIdx) => {
      for (let i = 0; i < 100; i++) {
        const basePosition = 5;
        const baseTime = 2000;
        
        // Simulate variability
        const positionVariation = Math.random() * 4 - 2; // ±2 positions
        const timeVariation = (Math.random() - 0.5) * 50; // ±25 seconds
        
        // Scenario-specific adjustments
        let positionAdjustment = 0;
        let timeAdjustment = 0;
        
        switch (scenario) {
          case 'now':
            positionAdjustment = -0.5; // Slightly better (early pit)
            timeAdjustment = -15;
            break;
          case '+1':
            positionAdjustment = 0.2;
            timeAdjustment = -5;
            break;
          case '+2':
            positionAdjustment = 0.8;
            timeAdjustment = 5;
            break;
          case 'optimal':
            positionAdjustment = -1.2; // Best outcome
            timeAdjustment = -25;
            break;
        }
        
        runs.push({
          runId: `run_${scenario}_${i}`,
          scenario,
          finalPosition: Math.max(1, Math.min(10, basePosition + positionVariation + positionAdjustment)),
          totalTime: baseTime + timeVariation + timeAdjustment,
          timeGain: -timeAdjustment + (Math.random() - 0.5) * 10,
          confidence: 0.7 + Math.random() * 0.25,
          timestamp: Date.now() - (100 - i) * 1000,
          factors: {
            tireWear: 0.5 + Math.random() * 0.3,
            traffic: 0.3 + Math.random() * 0.4,
            pitStopEfficiency: 0.6 + Math.random() * 0.3,
            competitorTiming: 0.4 + Math.random() * 0.4,
          },
        });
      }
    });
    
    // Calculate summary statistics
    const positions = runs.map(r => r.finalPosition);
    const sortedPositions = [...positions].sort((a, b) => a - b);
    const meanPosition = positions.reduce((a, b) => a + b, 0) / positions.length;
    const medianPosition = sortedPositions[Math.floor(sortedPositions.length / 2)];
    const variance = positions.reduce((sum, pos) => sum + Math.pow(pos - meanPosition, 2), 0) / positions.length;
    const stdDevPosition = Math.sqrt(variance);
    
    // Find best/worst scenarios
    const scenarioMeans = scenarios.map(scenario => {
      const scenarioRuns = runs.filter(r => r.scenario === scenario);
      const mean = scenarioRuns.reduce((sum, r) => sum + r.finalPosition, 0) / scenarioRuns.length;
      return { scenario, mean };
    });
    
    const bestScenario = scenarioMeans.reduce((best, curr) => 
      curr.mean < best.mean ? curr : best
    ).scenario;
    const worstScenario = scenarioMeans.reduce((worst, curr) => 
      curr.mean > worst.mean ? curr : worst
    ).scenario;
    
    return {
      simulationId: 'mock_sim_' + Date.now(),
      carId: '7',
      currentLap: 12,
      totalRuns: runs.length,
      runs,
      scenarios,
      summary: {
        meanPosition,
        medianPosition,
        stdDevPosition,
        p5Position: sortedPositions[Math.floor(sortedPositions.length * 0.05)],
        p95Position: sortedPositions[Math.floor(sortedPositions.length * 0.95)],
        meanTimeGain: runs.reduce((sum, r) => sum + r.timeGain, 0) / runs.length,
        bestScenario,
        worstScenario,
      },
    };
  }, [data]);

  // Filter runs by scenario
  const filteredRuns = useMemo(() => {
    if (selectedScenario === 'all') {
      return simulationData.runs;
    }
    return simulationData.runs.filter(r => r.scenario === selectedScenario);
  }, [simulationData.runs, selectedScenario]);

  // Prepare distribution data
  const distributionData = useMemo(() => {
    const positionCounts: Record<number, number> = {};
    filteredRuns.forEach(run => {
      const pos = Math.round(run.finalPosition);
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });
    
    return Object.entries(positionCounts)
      .map(([position, count]) => ({
        position: parseInt(position),
        count,
        percentage: (count / filteredRuns.length) * 100,
      }))
      .sort((a, b) => a.position - b.position);
  }, [filteredRuns]);

  // Prepare time series data
  const timeSeriesData = useMemo(() => {
    const scenarioGroups: Record<string, MonteCarloRun[]> = {};
    simulationData.scenarios.forEach(scenario => {
      scenarioGroups[scenario] = simulationData.runs
        .filter(r => r.scenario === scenario)
        .sort((a, b) => a.timestamp - b.timestamp);
    });
    
    // Group by time windows
    const windows: Array<{ time: number; [key: string]: number | string }> = [];
    const windowSize = Math.ceil(simulationData.runs.length / 20);
    
    for (let i = 0; i < 20; i++) {
      const windowStart = i * windowSize;
      const windowEnd = Math.min(windowStart + windowSize, simulationData.runs.length);
      const window: { time: number; [key: string]: number | string } = { time: i };
      
      simulationData.scenarios.forEach(scenario => {
        const scenarioRuns = scenarioGroups[scenario].slice(windowStart, windowEnd);
        if (scenarioRuns.length > 0) {
          const avgPosition = scenarioRuns.reduce((sum, r) => sum + r.finalPosition, 0) / scenarioRuns.length;
          window[scenario] = parseFloat(avgPosition.toFixed(2));
        }
      });
      
      windows.push(window);
    }
    
    return windows;
  }, [simulationData]);

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    const scenarioStats = simulationData.scenarios.map(scenario => {
      const scenarioRuns = simulationData.runs.filter(r => r.scenario === scenario);
      const positions = scenarioRuns.map(r => r.finalPosition);
      const times = scenarioRuns.map(r => r.totalTime);
      
      return {
        scenario,
        meanPosition: positions.reduce((a, b) => a + b, 0) / positions.length,
        meanTime: times.reduce((a, b) => a + b, 0) / times.length,
        stdDev: Math.sqrt(
          positions.reduce((sum, pos) => {
            const mean = positions.reduce((a, b) => a + b, 0) / positions.length;
            return sum + Math.pow(pos - mean, 2);
          }, 0) / positions.length
        ),
        winRate: (positions.filter(p => p <= 3).length / positions.length) * 100,
        riskLevel: positions.filter(p => p >= 8).length / positions.length,
      };
    });
    
    return scenarioStats;
  }, [simulationData]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{`${label}`}</p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value?.toFixed(2) || entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Running Monte Carlo simulation...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Activity className="w-6 h-6 text-blue-400" />
                Monte Carlo Simulation Analysis
              </CardTitle>
              <CardDescription className="mt-2">
                Interactive visualization of {simulationData.totalRuns.toLocaleString()} simulation runs
                across {simulationData.scenarios.length} scenarios
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-background/50 rounded-lg p-4 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Mean Position</div>
              <div className="text-2xl font-bold">{simulationData.summary.meanPosition.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                ±{simulationData.summary.stdDevPosition.toFixed(2)} std dev
              </div>
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Median Position</div>
              <div className="text-2xl font-bold">{simulationData.summary.medianPosition.toFixed(1)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {simulationData.summary.p5Position.toFixed(1)} - {simulationData.summary.p95Position.toFixed(1)} (5-95%)
              </div>
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Expected Time Gain</div>
              <div className="text-2xl font-bold text-green-400">
                {simulationData.summary.meanTimeGain > 0 ? '+' : ''}
                {simulationData.summary.meanTimeGain.toFixed(1)}s
              </div>
              <div className="text-xs text-muted-foreground mt-1">Average across all runs</div>
            </div>
            <div className="bg-background/50 rounded-lg p-4 border border-border/50">
              <div className="text-sm text-muted-foreground mb-1">Best Scenario</div>
              <div className="text-2xl font-bold text-green-400 flex items-center gap-2">
                <Target className="w-5 h-5" />
                {simulationData.summary.bestScenario}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Lowest mean position</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by Scenario:</span>
            </div>
            <Select value={selectedScenario} onValueChange={setSelectedScenario}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scenarios</SelectItem>
                {simulationData.scenarios.map(scenario => (
                  <SelectItem key={scenario} value={scenario}>
                    {scenario === 'now' ? 'Box Now' : 
                     scenario === '+1' ? '+1 Lap' :
                     scenario === '+2' ? '+2 Laps' :
                     scenario.charAt(0).toUpperCase() + scenario.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main visualization tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Distribution
          </TabsTrigger>
          <TabsTrigger value="time-series" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Time Series
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Comparison
          </TabsTrigger>
          <TabsTrigger value="statistics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        {/* Distribution View */}
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Final Position Distribution</CardTitle>
              <CardDescription>
                Probability distribution of final race positions across {filteredRuns.length} simulation runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="position" 
                    label={{ value: 'Final Position', position: 'insideBottom', offset: -5 }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    label={{ value: 'Frequency (%)', angle: -90, position: 'insideLeft' }}
                    stroke="#9ca3af"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="percentage" fill={COLORS.primary} radius={[4, 4, 0, 0]}>
                    {distributionData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.position <= 3 ? COLORS.success :
                          entry.position <= 5 ? COLORS.info :
                          entry.position <= 7 ? COLORS.warning :
                          COLORS.danger
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-4 grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                  <div className="text-2xl font-bold text-green-400">
                    {((distributionData.filter(d => d.position <= 3).reduce((sum, d) => sum + d.percentage, 0))).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Podium Probability</div>
                </div>
                <div className="text-center p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-400">
                    {((distributionData.filter(d => d.position <= 5).reduce((sum, d) => sum + d.percentage, 0))).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Top 5 Probability</div>
                </div>
                <div className="text-center p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                  <div className="text-2xl font-bold text-yellow-400">
                    {((distributionData.filter(d => d.position <= 7).reduce((sum, d) => sum + d.percentage, 0))).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Top 7 Probability</div>
                </div>
                <div className="text-center p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                  <div className="text-2xl font-bold text-red-400">
                    {((distributionData.filter(d => d.position >= 8).reduce((sum, d) => sum + d.percentage, 0))).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Risk (8+)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Gain Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Time Gain Distribution</CardTitle>
              <CardDescription>
                Distribution of time gains/losses across simulation runs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={filteredRuns.map(r => ({ 
                  gain: Math.round(r.timeGain / 5) * 5, // Round to 5s buckets
                  run: r.runId 
                })).reduce((acc: any[], curr) => {
                  const existing = acc.find(a => a.gain === curr.gain);
                  if (existing) {
                    existing.count++;
                  } else {
                    acc.push({ gain: curr.gain, count: 1 });
                  }
                  return acc;
                }, []).sort((a, b) => a.gain - b.gain)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="gain" 
                    label={{ value: 'Time Gain (seconds)', position: 'insideBottom', offset: -5 }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                    stroke="#9ca3af"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={COLORS.success} 
                    fill={COLORS.success} 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Time Series View */}
        <TabsContent value="time-series" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Position Evolution Over Simulation Runs</CardTitle>
              <CardDescription>
                Average final position by scenario across simulation batches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    label={{ value: 'Simulation Batch', position: 'insideBottom', offset: -5 }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    label={{ value: 'Average Final Position', angle: -90, position: 'insideLeft' }}
                    stroke="#9ca3af"
                    reversed
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {simulationData.scenarios.map((scenario, idx) => (
                    <Line
                      key={scenario}
                      type="monotone"
                      dataKey={scenario}
                      stroke={SCENARIO_COLORS[scenario] || COLORS.primary}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name={scenario === 'now' ? 'Box Now' : 
                            scenario === '+1' ? '+1 Lap' :
                            scenario === '+2' ? '+2 Laps' :
                            scenario.charAt(0).toUpperCase() + scenario.slice(1)}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Heatmap/Comparison View */}
        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Comparison Matrix</CardTitle>
              <CardDescription>
                Comprehensive comparison of all scenarios across key metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {heatmapData.map((stat, idx) => (
                  <Card 
                    key={stat.scenario}
                    className={`${
                      stat.scenario === simulationData.summary.bestScenario 
                        ? 'border-green-500/50 bg-green-900/10' 
                        : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>
                          {stat.scenario === 'now' ? 'Box Now' : 
                           stat.scenario === '+1' ? '+1 Lap' :
                           stat.scenario === '+2' ? '+2 Laps' :
                           stat.scenario.charAt(0).toUpperCase() + stat.scenario.slice(1)}
                        </span>
                        {stat.scenario === simulationData.summary.bestScenario && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Best
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Mean Position</div>
                          <div className="text-xl font-bold">{stat.meanPosition.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Std Deviation</div>
                          <div className="text-xl font-bold">{stat.stdDev.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Win Rate</div>
                          <div className="text-xl font-bold text-green-400">{stat.winRate.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Risk Level</div>
                          <div className={`text-xl font-bold ${
                            stat.riskLevel > 0.3 ? 'text-red-400' :
                            stat.riskLevel > 0.15 ? 'text-yellow-400' :
                            'text-green-400'
                          }`}>
                            {(stat.riskLevel * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Visual risk indicator */}
                      <div className="pt-2 border-t">
                        <div className="text-xs text-muted-foreground mb-2">Risk Assessment</div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              stat.riskLevel > 0.3 ? 'bg-red-500' :
                              stat.riskLevel > 0.15 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${stat.riskLevel * 100}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Scatter plot: Position vs Time */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Position vs Total Time Scatter</CardTitle>
                  <CardDescription>
                    Relationship between final position and total race time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        type="number" 
                        dataKey="totalTime" 
                        name="Total Time"
                        label={{ value: 'Total Race Time (seconds)', position: 'insideBottom', offset: -5 }}
                        stroke="#9ca3af"
                      />
                      <YAxis 
                        type="number" 
                        dataKey="finalPosition" 
                        name="Final Position"
                        label={{ value: 'Final Position', angle: -90, position: 'insideLeft' }}
                        stroke="#9ca3af"
                        reversed
                      />
                      <ZAxis type="number" dataKey="confidence" range={[50, 400]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                      <Legend />
                      {simulationData.scenarios.map((scenario) => (
                        <Scatter
                          key={scenario}
                          name={scenario === 'now' ? 'Box Now' : 
                                scenario === '+1' ? '+1 Lap' :
                                scenario === '+2' ? '+2 Laps' :
                                scenario.charAt(0).toUpperCase() + scenario.slice(1)}
                          data={simulationData.runs.filter(r => r.scenario === scenario)}
                          fill={SCENARIO_COLORS[scenario] || COLORS.primary}
                        />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics View */}
        <TabsContent value="statistics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {simulationData.scenarios.map((scenario) => {
              const scenarioRuns = simulationData.runs.filter(r => r.scenario === scenario);
              const positions = scenarioRuns.map(r => r.finalPosition);
              const times = scenarioRuns.map(r => r.totalTime);
              const gains = scenarioRuns.map(r => r.timeGain);
              
              const sortedPositions = [...positions].sort((a, b) => a - b);
              const meanPos = positions.reduce((a, b) => a + b, 0) / positions.length;
              const medianPos = sortedPositions[Math.floor(sortedPositions.length / 2)];
              const p25Pos = sortedPositions[Math.floor(sortedPositions.length * 0.25)];
              const p75Pos = sortedPositions[Math.floor(sortedPositions.length * 0.75)];
              
              return (
                <Card key={scenario}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        {scenario === 'now' ? 'Box Now' : 
                         scenario === '+1' ? '+1 Lap' :
                         scenario === '+2' ? '+2 Laps' :
                         scenario.charAt(0).toUpperCase() + scenario.slice(1)}
                      </span>
                      {scenario === simulationData.summary.bestScenario && (
                        <Badge variant="default" className="bg-green-600">
                          Best
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Position Statistics</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Mean</div>
                          <div className="text-lg font-bold">{meanPos.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Median</div>
                          <div className="text-lg font-bold">{medianPos.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">25th Percentile</div>
                          <div className="text-lg font-bold">{p25Pos.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">75th Percentile</div>
                          <div className="text-lg font-bold">{p75Pos.toFixed(1)}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Time Statistics</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Mean Time</div>
                          <div className="text-lg font-bold">{times.reduce((a, b) => a + b, 0) / times.length}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Mean Gain</div>
                          <div className={`text-lg font-bold ${
                            gains.reduce((a, b) => a + b, 0) / gains.length > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {gains.reduce((a, b) => a + b, 0) / gains.length > 0 ? '+' : ''}
                            {(gains.reduce((a, b) => a + b, 0) / gains.length).toFixed(1)}s
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-2">Confidence Intervals</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">95% CI</span>
                          <span className="font-mono">
                            [{sortedPositions[Math.floor(sortedPositions.length * 0.025)].toFixed(1)}, 
                             {sortedPositions[Math.floor(sortedPositions.length * 0.975)].toFixed(1)}]
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">90% CI</span>
                          <span className="font-mono">
                            [{sortedPositions[Math.floor(sortedPositions.length * 0.05)].toFixed(1)}, 
                             {sortedPositions[Math.floor(sortedPositions.length * 0.95)].toFixed(1)}]
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


