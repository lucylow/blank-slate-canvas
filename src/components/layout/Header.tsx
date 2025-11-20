import { Clock, Wifi, WifiOff, Flag, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTelemetry } from '@/hooks/useTelemetry';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Header() {
  const { currentLap, sessionTime, connectionStatus } = useTelemetry();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-xl border-b border-border/50 z-50 shadow-lg shadow-primary/5">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
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
            variant={connectionStatus === 'connected' ? 'default' : 'secondary'}
            className={cn(
              "flex items-center space-x-2 px-3 py-1.5",
              connectionStatus === 'connected' 
                ? 'bg-primary/20 text-primary border-primary/30' 
                : connectionStatus === 'connecting'
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                : 'bg-destructive/20 text-destructive border-destructive/30'
            )}
          >
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
          </Badge>
        </div>
      </div>
    </header>
  );
}
