import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, 
  Activity, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  BarChart3,
  Sparkles,
  Trash2,
  MapPin,
  Settings,
  Inbox,
  Send,
  UserCheck
} from 'lucide-react';
import { useAgentSystem, type Insight } from '../../hooks/useAgentSystem';
import InsightModal from '../InsightModal/InsightModal';
import RealTimeMetrics from '../RealTimeMetrics/RealTimeMetrics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const AgentDashboard: React.FC = () => {
  const {
    agents,
    insights,
    queueStats,
    selectedInsight,
    isModalOpen,
    setIsModalOpen,
    fetchInsightDetails,
    clearInsights
  } = useAgentSystem();

  const activeAgents = agents.filter(a => a.status === 'active').length;
  const idleAgents = agents.filter(a => a.status === 'idle').length;
  const errorAgents = agents.filter(a => a.status === 'error').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      idle: 'secondary',
      error: 'destructive'
    };
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500 border-green-500/20',
      idle: 'bg-muted text-muted-foreground',
      error: 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    return colors[status] || colors.idle;
  };

  const getPriorityBadge = (priority?: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-500/10 text-red-500 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      normal: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      low: 'bg-muted text-muted-foreground'
    };
    return colors[priority || 'normal'] || colors.normal;
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="h-3.5 w-3.5" />;
      case 'high':
        return <TrendingUp className="h-3.5 w-3.5" />;
      default:
        return <Sparkles className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PitWall AI Agent System
            </h1>
            <p className="text-muted-foreground mt-2">
              Real-time AI agents monitoring and insights dashboard
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Link to="/agents/review">
              <Button variant="outline" className="gap-2">
                <UserCheck className="h-4 w-4" />
                Human Review
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Stats Cards */}
          <div className="flex gap-4">
            <Card className="flex-1 min-w-[120px]">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Activity className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeAgents}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="flex-1 min-w-[120px]">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Inbox className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{queueStats.tasksLength || 0}</p>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="flex-1 min-w-[120px]">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{insights.length}</p>
                    <p className="text-xs text-muted-foreground">Insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Panel - Agents & Queues */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Agents Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <CardTitle>AI Agents</CardTitle>
                  </div>
                  <Badge variant="secondary">{agents.length}</Badge>
                </div>
                <CardDescription>
                  Connected agent instances and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {agents.length > 0 ? (
                    <div className="space-y-3">
                      {agents.map(agent => (
                        <Card 
                          key={agent.id} 
                          className="border-2 hover:border-primary/50 transition-colors cursor-pointer"
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(agent.status)}
                                <span className="font-semibold text-sm">{agent.id}</span>
                              </div>
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", getStatusBadge(agent.status))}
                              >
                                {agent.status}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              {agent.types && agent.types.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {agent.types.join(', ')}
                                  </span>
                                </div>
                              )}
                              
                              {agent.tracks && agent.tracks.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {agent.tracks.join(', ')}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Capacity: {agent.capacity || 1}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <Bot className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-sm text-muted-foreground">
                        No agents registered
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Waiting for agents to connect...
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Queue Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle>Queue Status</CardTitle>
                </div>
                <CardDescription>
                  Task and message queue statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Tasks Stream</span>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {queueStats.tasksLength || 0}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Inbox className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Results Stream</span>
                    </div>
                    <Badge variant="secondary" className="font-mono">
                      {queueStats.resultsLength || 0}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  {(queueStats.inboxLengths || []).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Agent Inboxes
                      </p>
                      {(queueStats.inboxLengths || []).map(queue => (
                        <div 
                          key={queue.agentId} 
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <span className="text-sm text-muted-foreground truncate">
                            {queue.agentId}
                          </span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {queue.length}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Insights */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <CardTitle>Real-Time Insights</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearInsights}
                    disabled={insights.length === 0}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </div>
                <CardDescription>
                  AI-generated insights and predictions from telemetry data
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ScrollArea className="h-[600px]">
                  {insights.length > 0 ? (
                    <div className="space-y-4">
                      {insights.map(insight => (
                        <Card
                          key={insight.insight_id}
                          className={cn(
                            "border-l-4 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.01]",
                            insight.priority === 'critical' && "border-l-red-500 bg-red-500/5",
                            insight.priority === 'high' && "border-l-orange-500 bg-orange-500/5",
                            insight.priority === 'normal' && "border-l-blue-500 bg-blue-500/5",
                            insight.priority === 'low' && "border-l-muted"
                          )}
                          onClick={() => fetchInsightDetails(insight.insight_id)}
                        >
                          <CardContent className="pt-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge 
                                  variant="outline" 
                                  className={cn("gap-1", getPriorityBadge(insight.priority))}
                                >
                                  {getPriorityIcon(insight.priority)}
                                  {insight.priority || 'normal'}
                                </Badge>
                                <Badge variant="secondary" className="gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {insight.track}
                                </Badge>
                                <Badge variant="outline">
                                  Chassis #{insight.chassis}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(insight.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            
                            {/* Title */}
                            <h4 className="font-semibold text-lg mb-3 capitalize">
                              {insight.type?.replace(/_/g, ' ') || 'Insight'}
                            </h4>
                            
                            {/* Predictions */}
                            {insight.predictions && (
                              <div className="grid grid-cols-2 gap-3 mb-4">
                                {insight.predictions.predicted_loss_per_lap_seconds !== undefined && (
                                  <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Loss per Lap
                                    </p>
                                    <p className="text-lg font-bold text-red-500">
                                      {insight.predictions.predicted_loss_per_lap_seconds.toFixed(3)}s
                                    </p>
                                  </div>
                                )}
                                {insight.predictions.laps_until_0_5s_loss !== undefined && (
                                  <div className="p-3 rounded-lg bg-muted/50">
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Laps until 0.5s Loss
                                    </p>
                                    <p className="text-lg font-bold text-orange-500">
                                      {insight.predictions.laps_until_0_5s_loss}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Key Features */}
                            {insight.explanation?.top_features && insight.explanation.top_features.length > 0 && (
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                                  Key Factors
                                </p>
                                <div className="space-y-1.5">
                                  {insight.explanation.top_features.slice(0, 3).map((feature, idx) => (
                                    <div 
                                      key={idx} 
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="text-muted-foreground">{feature.name}</span>
                                      <span className="font-mono font-semibold">
                                        {typeof feature.value === 'number' 
                                          ? feature.value.toFixed(3) 
                                          : feature.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-sm text-muted-foreground">
                        No insights yet
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Waiting for telemetry data to generate insights...
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Real-time Metrics */}
        <RealTimeMetrics agents={agents} insights={insights} />
      </div>

      {/* Insight Modal */}
      <InsightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        insight={selectedInsight}
      />
    </div>
  );
};

export default AgentDashboard;

