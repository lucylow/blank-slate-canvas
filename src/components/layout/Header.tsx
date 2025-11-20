import { Clock, Wifi, Signal } from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';

export function Header() {
  const { currentLap, sessionTime, connectionStatus } = useTelemetry();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-secondary/50 backdrop-blur-xl border-b border-border z-50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary via-red-600 to-red-800 rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
              <Signal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">PitWall AI</h1>
              <p className="text-xs text-muted-foreground">Toyota GR Cup Real-time Strategy</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-center px-3 py-1 bg-muted/50 rounded-lg">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Current Lap</div>
            <div className="text-xl font-mono font-bold text-foreground">{currentLap}</div>
          </div>
          
          <div className="flex items-center space-x-2 text-primary px-3 py-1 bg-primary/10 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-mono font-medium">{sessionTime}</span>
          </div>

          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' : 
            connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' : 
              connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
            }`} />
            <span className="text-sm font-medium uppercase tracking-wide">{connectionStatus === 'connected' ? 'LIVE' : connectionStatus}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
