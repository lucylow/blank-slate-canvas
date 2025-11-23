import { Clock, Wifi, WifiOff, Flag, MapPin, Play, Bot, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTelemetry } from '@/hooks/useTelemetry';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDemoMode } from '@/hooks/useDemoMode';
import { useQuery } from '@tanstack/react-query';
import { getAgentStatus, type AgentStatusResponse } from '@/api/pitwall';

// Navigation link component with active state
function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={cn(
        "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative group",
        isActive 
          ? "text-primary bg-primary/10" 
          : "text-foreground/80 hover:text-foreground hover:bg-accent/50"
      )}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
    </Link>
  );
}

export function Header() {
  const { currentLap, sessionTime, connectionStatus } = useTelemetry();
  const { isDemoMode } = useDemoMode();
  const location = useLocation();
  
  // Fetch AI agent status
  const { data: agentStatus } = useQuery<AgentStatusResponse>({
    queryKey: ['agentStatus'],
    queryFn: getAgentStatus,
    refetchInterval: 30000,
    retry: 1,
  });
  
  const activeAgents = agentStatus?.agents?.filter(a => a.status === 'active').length || 0;

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border/50 z-50 shadow-lg shadow-primary/5">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3 sm:space-x-4 group">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30 transition-transform duration-300"
          >
            <Flag className="w-5 h-5 text-primary-foreground" />
          </motion.div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:text-primary transition-colors">
              PitWall <span className="text-primary">AI</span>
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Toyota GR Cup Real-time Strategy</p>
          </div>
        </Link>

        {/* Navigation Menu */}
        <nav className="hidden md:flex items-center space-x-1">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/tracks">Tracks</NavLink>
          <NavLink to="/analytics">Analytics</NavLink>
          <NavLink to="/pitwall">Strategy</NavLink>
          <Link 
            to="/agents" 
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative group flex items-center gap-2",
              location.pathname === '/agents'
                ? "text-primary bg-primary/10" 
                : "text-foreground/80 hover:text-foreground hover:bg-accent/50"
            )}
          >
            <Bot className="w-4 h-4" />
            <span>AI Agents</span>
            {activeAgents > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-500 border-green-500/30">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse mr-1" />
                {activeAgents}
              </Badge>
            )}
            {location.pathname === '/agents' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
          <NavLink to="/about">About</NavLink>
        </nav>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="hidden sm:block text-center px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50 backdrop-blur-sm">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Current Lap</div>
            <div className="text-xl font-mono font-bold text-foreground">{currentLap}</div>
          </div>
          
          <div className="flex items-center space-x-2 text-primary px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20 backdrop-blur-sm">
            <Clock className="w-4 h-4" />
            <span className="font-mono font-medium text-sm sm:text-base">{sessionTime}</span>
          </div>

          <Badge
            variant={connectionStatus === 'connected' || isDemoMode ? 'default' : 'secondary'}
            className={cn(
              "flex items-center space-x-2 px-3 py-1.5",
              isDemoMode
                ? 'bg-primary/20 text-primary border-primary/30'
                : connectionStatus === 'connected' 
                ? 'bg-primary/20 text-primary border-primary/30' 
                : connectionStatus === 'connecting'
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                : 'bg-destructive/20 text-destructive border-destructive/30'
            )}
          >
            {isDemoMode ? (
              <>
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
                <Play className="w-3 h-3" />
                <span className="text-xs font-semibold uppercase tracking-wide hidden sm:inline">DEMO</span>
              </>
            ) : (
              <>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  connectionStatus === 'connected' 
                    ? 'bg-primary animate-pulse shadow-lg shadow-primary/50' 
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-400'
                    : 'bg-destructive'
                )} />
                {connectionStatus === 'connected' ? (
                  <>
                    <Wifi className="w-3 h-3" />
                    <span className="text-xs font-semibold uppercase tracking-wide hidden sm:inline">LIVE</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    <span className="text-xs font-semibold uppercase tracking-wide hidden sm:inline">{connectionStatus}</span>
                  </>
                )}
              </>
            )}
          </Badge>
        </div>
      </div>
    </header>
  );
}
