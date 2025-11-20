import { Clock, Wifi, Signal } from 'lucide-react';
import { useTelemetry } from '@/hooks/useTelemetry';

export function Header() {
  const { currentLap, sessionTime, connectionStatus } = useTelemetry();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Signal className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">PitWall AI</h1>
              <p className="text-xs text-muted-foreground">Real-time strategy for the GR Cup pit wall</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Current Lap</div>
            <div className="text-xl font-mono font-bold">{currentLap}</div>
          </div>
          
          <div className="flex items-center space-x-2 text-primary">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{sessionTime}</span>
          </div>

          <div className={`flex items-center space-x-2 ${
            connectionStatus === 'connected' ? 'text-green-500' : 
            connectionStatus === 'connecting' ? 'text-yellow-500' : 'text-red-500'
          }`}>
            <Wifi className="w-4 h-4" />
            <span className="text-sm capitalize">{connectionStatus}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
