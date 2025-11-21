import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Zap, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Agent {
  id: string;
  status: string;
}

interface Insight {
  created_at: string;
}

interface RealTimeMetricsProps {
  agents: Agent[];
  insights: Insight[];
}

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({ agents, insights }) => {
  const [metrics, setMetrics] = useState({
    insightsPerMinute: 0,
    avgProcessingTime: 0,
    agentUtilization: 0
  });

  useEffect(() => {
    // Calculate metrics
    const lastMinute = Date.now() - 60000;
    const recentInsights = insights.filter(i => 
      new Date(i.created_at).getTime() > lastMinute
    );
    
    const newMetrics = {
      insightsPerMinute: recentInsights.length,
      avgProcessingTime: calculateAvgProcessingTime(insights),
      agentUtilization: calculateAgentUtilization(agents)
    };
    
    setMetrics(newMetrics);
  }, [agents, insights]);

  const calculateAvgProcessingTime = (insights: Insight[]): number => {
    if (insights.length < 2) return 0;
    
    const times = insights
      .map(i => new Date(i.created_at).getTime())
      .sort((a, b) => a - b);
    
    const intervals: number[] = [];
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i] - times[i - 1]);
    }
    
    return intervals.length > 0 
      ? intervals.reduce((a, b) => a + b) / intervals.length 
      : 0;
  };

  const calculateAgentUtilization = (agents: Agent[]): number => {
    if (agents.length === 0) return 0;
    const activeAgents = agents.filter(a => a.status === 'active').length;
    return (activeAgents / agents.length) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle>System Metrics</CardTitle>
        </div>
        <CardDescription>
          Real-time performance and utilization statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Insights per Minute */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Zap className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Insights/Minute</p>
                  <p className="text-xs text-muted-foreground">Last 60 seconds</p>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{metrics.insightsPerMinute}</span>
                <span className="text-sm text-muted-foreground">insights</span>
              </div>
              <Progress 
                value={Math.min(100, (metrics.insightsPerMinute / 10) * 100)} 
                className="h-2"
              />
            </div>
          </div>

          {/* Average Processing Time */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Clock className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Avg Processing</p>
                  <p className="text-xs text-muted-foreground">Time between insights</p>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {metrics.avgProcessingTime > 0 ? metrics.avgProcessingTime.toFixed(0) : '0'}
                </span>
                <span className="text-sm text-muted-foreground">ms</span>
              </div>
              <Progress 
                value={Math.min(100, (metrics.avgProcessingTime / 1000) * 100)} 
                className="h-2"
              />
            </div>
          </div>

          {/* Agent Utilization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Agent Utilization</p>
                  <p className="text-xs text-muted-foreground">Active agents</p>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {metrics.agentUtilization.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <Progress 
                value={metrics.agentUtilization} 
                className="h-2"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeMetrics;

