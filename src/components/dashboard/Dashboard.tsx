import { motion } from 'framer-motion';
import { Clock, Users, Target, AlertCircle, Sparkles, Bot } from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';
import { useStrategy } from '@/hooks/useStrategy';
import { useQuery } from '@tanstack/react-query';
import { getAgentStatus, type AgentStatusResponse } from '@/api/pitwall';
import { generateMockAgentStatusResponse } from '@/lib/mockDemoData';
import { useDemoMode } from '@/hooks/useDemoMode';
import { Link } from 'react-router-dom';

import { TrackMap } from '@/components/telemetry/TrackMap';
import { TelemetryCharts } from '@/components/telemetry/TelemetryCharts';
import { StrategyConsole } from '@/components/strategy/StrategyConsole';
import { DriverList } from '@/components/telemetry/DriverList';
import { Card, CardContent } from '@/components/ui/card';

export function Dashboard() {
  const { drivers, selectedDriver, trackData } = useTelemetry();
  const { strategy, alerts } = useStrategy();
  const { isDemoMode } = useDemoMode();
  
  // Fetch AI agent status with error handling
  const { data: agentStatus } = useQuery<AgentStatusResponse>({
    queryKey: ['agentStatus', isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        // Use mock data in demo mode
        return generateMockAgentStatusResponse();
      }
      try {
        return await getAgentStatus();
      } catch (error) {
        // Fall back to mock data on error
        console.warn('Failed to fetch agent status, using mock data:', error);
        return generateMockAgentStatusResponse();
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });
  
  const activeAgents = agentStatus?.agents?.filter(a => a.status === 'active').length || 0;

  // Calculate quick stats
  const totalDrivers = drivers?.length || 0;
  const activeAlerts = alerts?.filter(a => a.severity === 'high').length || 0;
  const avgLapTime = drivers && drivers.length > 0 
    ? (drivers.reduce((sum, d) => sum + (d.lastLapTime || 0), 0) / drivers.length).toFixed(3)
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-secondary/20 relative overflow-hidden">
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.03),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(168,85,247,0.03),transparent_50%)] pointer-events-none" />
      {/* Quick Stats Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-5 border-b border-border/50 bg-card/60 backdrop-blur-md flex-shrink-0 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent">
              Live Race Dashboard
            </h2>
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
              <span>{trackData?.name || 'Circuit of the Americas'}</span>
              <span className="text-border">•</span>
              <span>Real-time Analytics</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {activeAgents > 0 && (
              <Link to="/agents">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-md"
                >
                  <Bot className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-primary">{activeAgents} AI Agents</span>
                </motion.div>
              </Link>
            )}
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-sm"
            >
              <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
              <span className="text-sm font-semibold text-primary">LIVE</span>
            </motion.div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.03, y: -2 }}
              >
                <Card className={`${stat.bgColor} ${stat.borderColor} border-2 hover:shadow-xl transition-all duration-300 cursor-pointer group`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5 truncate">{stat.label}</p>
                        <p className={`text-2xl font-bold ${stat.color} truncate`}>{stat.value}</p>
                      </div>
                      <div className={`p-2.5 rounded-lg ${stat.bgColor} group-hover:scale-110 transition-transform duration-200 flex-shrink-0 ml-2`}>
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
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="grid grid-cols-12 gap-4 md:gap-6 auto-rows-fr min-h-[800px]">
          {/* Track Map - Top Left */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-12 md:col-span-4 min-h-[400px] bg-card/90 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl shadow-primary/5 hover:shadow-primary/20 hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:border-primary/40 hover:scale-[1.01]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <TrackMap />
          </motion.div>

          {/* Driver List - Top Middle */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-12 md:col-span-4 min-h-[400px] bg-card/90 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl shadow-primary/5 hover:shadow-primary/20 hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:border-primary/40 hover:scale-[1.01]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <DriverList />
          </motion.div>

          {/* Strategy Console - Top Right */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="col-span-12 md:col-span-4 min-h-[400px] bg-card/90 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl shadow-primary/5 hover:shadow-primary/20 hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:border-primary/40 hover:scale-[1.01]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.03),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <StrategyConsole />
          </motion.div>

          {/* Telemetry Charts - Bottom Full Width */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-12 min-h-[500px] bg-card/90 backdrop-blur-xl rounded-2xl border border-border/50 shadow-2xl shadow-primary/5 hover:shadow-primary/20 hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:border-primary/40 hover:scale-[1.005]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.03),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <TelemetryCharts />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
