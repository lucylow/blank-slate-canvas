import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { useAgentSystem, type Insight } from '../../hooks/useAgentSystem';
import InsightModal from '../InsightModal/InsightModal';
import RealTimeMetrics from '../RealTimeMetrics/RealTimeMetrics';
import { DemoModeToggle } from '../DemoModeToggle';
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
      normal: 'bg-primary/10 text-primary border-primary/20',
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      <div className="container mx-auto px-6 py-8 space-y-8 relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Autonomous AI Agent System
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
                PitWall{" "}
              </span>
              <span className="bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
                AI Agents
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Real-time monitoring and insights from our distributed multi-agent system working autonomously to provide race intelligence.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 items-center">
            <DemoModeToggle />
            <Link to="/agents/review">
              <Button 
                variant="outline" 
                className="gap-2 border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm group"
              >
                <UserCheck className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Human Review
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </motion.div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{activeAgents}</p>
                    <p className="text-sm text-muted-foreground">Active Agents</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <Inbox className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{queueStats.tasksLength || 0}</p>
                    <p className="text-sm text-muted-foreground">Queue Tasks</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{insights.length}</p>
                    <p className="text-sm text-muted-foreground">Live Insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Panel - Agents & Queues */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Agents Card */}
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <CardTitle>AI Agents</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                    {agents.length}
                  </Badge>
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
                          className="bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:bg-card/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 cursor-pointer group"
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="group-hover:scale-110 transition-transform">
                                  {getStatusIcon(agent.status)}
                                </div>
                                <span className="font-semibold text-sm group-hover:text-primary transition-colors">{agent.id}</span>
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
                                  <Settings className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-muted-foreground group-hover:text-foreground/90 transition-colors">
                                    {agent.types.join(', ')}
                                  </span>
                                </div>
                              )}
                              
                              {agent.tracks && agent.tracks.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <span className="text-muted-foreground group-hover:text-foreground/90 transition-colors">
                                    {agent.tracks.join(', ')}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <Zap className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-muted-foreground group-hover:text-foreground/90 transition-colors">
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
            <Card className="bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                    <BarChart3 className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <CardTitle>Queue Status</CardTitle>
                </div>
                <CardDescription>
                  Task and message queue statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-card/60 transition-all duration-300 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Send className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">Tasks Stream</span>
                    </div>
                    <Badge variant="secondary" className="font-mono bg-primary/20 text-primary border-primary/30">
                      {queueStats.tasksLength || 0}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-card/60 transition-all duration-300 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Inbox className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">Results Stream</span>
                    </div>
                    <Badge variant="secondary" className="font-mono bg-primary/20 text-primary border-primary/30">
                      {queueStats.resultsLength || 0}
                    </Badge>
                  </div>
                  
                  <Separator className="bg-border/50" />
                  
                  {(queueStats.inboxLengths || []).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Agent Inboxes
                      </p>
                      {(queueStats.inboxLengths || []).map(queue => (
                        <div 
                          key={queue.agentId} 
                          className="flex items-center justify-between p-3 rounded-lg bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 hover:bg-card/60 transition-all duration-300 group"
                        >
                          <span className="text-sm text-muted-foreground truncate group-hover:text-foreground transition-colors">
                            {queue.agentId}
                          </span>
                          <Badge variant="outline" className="font-mono text-xs bg-primary/10 text-primary border-primary/30">
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
            <Card className="h-full flex flex-col bg-card/60 backdrop-blur-md border-primary/30 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                      <Sparkles className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <CardTitle>Real-Time Insights</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={clearInsights}
                    disabled={insights.length === 0}
                    className="gap-2 border-2 hover:bg-accent/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm group"
                  >
                    <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
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
                            "border-l-4 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/50",
                            insight.priority === 'critical' && "border-l-red-500 bg-red-500/5 hover:bg-red-500/10",
                            insight.priority === 'high' && "border-l-orange-500 bg-orange-500/5 hover:bg-orange-500/10",
                            insight.priority === 'normal' && "border-l-primary bg-primary/5 hover:bg-primary/10",
                            insight.priority === 'low' && "border-l-muted hover:bg-card/60"
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
                                  <div className="p-4 rounded-lg bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                                      Loss per Lap
                                    </p>
                                    <p className="text-xl font-bold text-red-500">
                                      {insight.predictions.predicted_loss_per_lap_seconds.toFixed(3)}s
                                    </p>
                                  </div>
                                )}
                                {insight.predictions.laps_until_0_5s_loss !== undefined && (
                                  <div className="p-4 rounded-lg bg-card/60 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300">
                                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                                      Laps until 0.5s Loss
                                    </p>
                                    <p className="text-xl font-bold text-orange-500">
                                      {insight.predictions.laps_until_0_5s_loss}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Key Features */}
                            {insight.explanation?.top_features && insight.explanation.top_features.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/50">
                                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                                  Key Factors
                                </p>
                                <div className="space-y-2">
                                  {insight.explanation.top_features.slice(0, 3).map((feature, idx) => (
                                    <div 
                                      key={idx} 
                                      className="flex items-center justify-between p-2 rounded-lg bg-card/40 backdrop-blur-sm border border-border/30 hover:border-primary/30 transition-all duration-300"
                                    >
                                      <span className="text-sm text-muted-foreground">{feature.name}</span>
                                      <span className="font-mono font-semibold text-primary">
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
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mb-4">
                        <Sparkles className="h-8 w-8 text-primary/50" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">
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

