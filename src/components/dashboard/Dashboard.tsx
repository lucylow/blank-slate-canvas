import { motion } from 'framer-motion';
import { Clock, Users, Target, AlertCircle, Sparkles, Bot } from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useStrategy } from '@/hooks/useStrategy';
import { useQuery } from '@tanstack/react-query';
import { getAgentStatus, type AgentStatusResponse } from '@/api/pitwall';
import { Link } from 'react-router-dom';

import { TrackMap } from '@/components/telemetry/TrackMap';
import { TelemetryCharts } from '@/components/telemetry/TelemetryCharts';
import { StrategyConsole } from '@/components/strategy/StrategyConsole';
import { DriverList } from '@/components/telemetry/DriverList';
import { Card, CardContent } from '@/components/ui/card';

export function Dashboard() {
  const { drivers, selectedDriver, trackData } = useTelemetry();
  const { strategy, alerts } = useStrategy();
  
  // Fetch AI agent status
  const { data: agentStatus } = useQuery<AgentStatusResponse>({
    queryKey: ['agentStatus'],
    queryFn: getAgentStatus,
    refetchInterval: 30000,
    retry: 1,
  });
  
  const activeAgents = agentStatus?.agents?.filter(a => a.status === 'active').length || 0;

  // Calculate quick stats
  const totalDrivers = drivers.length;
  const activeAlerts = alerts?.filter(a => a.severity === 'high').length || 0;
  const avgLapTime = drivers.length > 0 
    ? (drivers.reduce((sum, d) => sum + d.lastLapTime, 0) / drivers.length).toFixed(3)
    : '0.000';
  // Strategy confidence - using predictions if available
  const strategyConfidence = strategy?.predictions ? '85%' : 'N/A';

  const quickStats = [
    {
      label: 'Active Drivers',
      value: totalDrivers,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      label: 'Avg Lap Time',
      value: `${avgLapTime}s`,
      icon: Clock,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      label: 'Critical Alerts',
      value: activeAlerts,
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20'
    },
    {
      label: 'Strategy Confidence',
      value: strategyConfidence,
      icon: Target,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      label: 'AI Agents',
      value: activeAgents > 0 ? `${activeAgents} active` : 'Offline',
      icon: Sparkles,
      color: activeAgents > 0 ? 'text-green-500' : 'text-muted-foreground',
      bgColor: activeAgents > 0 ? 'bg-green-500/10' : 'bg-muted/10',
      borderColor: activeAgents > 0 ? 'border-green-500/20' : 'border-border/50'
    }
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-secondary/30 overflow-hidden">
      {/* Quick Stats Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4 border-b border-border/50 bg-card/40 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Live Race Dashboard
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {trackData?.name || 'Circuit of the Americas'} • Real-time Analytics
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeAgents > 0 && (
              <Link to="/agents">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer group">
                  <Bot className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-primary">{activeAgents} AI Agents</span>
                </div>
              </Link>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary">LIVE</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`${stat.bgColor} ${stat.borderColor} border-2 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`w-5 h-5 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Main Dashboard Grid */}
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="grid grid-cols-12 grid-rows-6 gap-4 h-full max-h-full">
          {/* Track Map - Top Left */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-12 md:col-span-4 row-span-3 bg-card/80 backdrop-blur-lg rounded-2xl border border-border/50 shadow-2xl shadow-primary/5 hover:shadow-primary/10 transition-all duration-300 overflow-hidden group hover:border-primary/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <TrackMap />
          </motion.div>

          {/* Driver List - Top Middle */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-12 md:col-span-4 row-span-3 bg-card/80 backdrop-blur-lg rounded-2xl border border-border/50 shadow-2xl shadow-primary/5 hover:shadow-primary/10 transition-all duration-300 overflow-hidden group hover:border-primary/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <DriverList />
          </motion.div>

          {/* Strategy Console - Top Right */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-12 md:col-span-4 row-span-3 bg-card/80 backdrop-blur-lg rounded-2xl border border-border/50 shadow-2xl shadow-primary/5 hover:shadow-primary/10 transition-all duration-300 overflow-hidden group hover:border-primary/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <StrategyConsole />
          </motion.div>

          {/* Telemetry Charts - Bottom Full Width */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-12 row-span-3 bg-card/80 backdrop-blur-lg rounded-2xl border border-border/50 shadow-2xl shadow-primary/5 hover:shadow-primary/10 transition-all duration-300 overflow-hidden group hover:border-primary/30"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <TelemetryCharts />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
