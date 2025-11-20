import { AlertTriangle, Clock, TrendingDown, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStrategy } from '@/hooks/useStrategy';

export function StrategyConsole() {
  const { strategy, predictions, alerts } = useStrategy();

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Strategy Console</h2>
        <div className="flex items-center space-x-2 text-primary">
          <Zap className="w-4 h-4" />
          <span className="text-sm">LIVE</span>
        </div>
      </div>

      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 space-y-2"
        >
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border-l-4 ${
                alert.severity === 'high'
                  ? 'bg-red-500/10 border-red-500'
                  : alert.severity === 'medium'
                  ? 'bg-yellow-500/10 border-yellow-500'
                  : 'bg-blue-500/10 border-blue-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">{alert.message}</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <div className="bg-secondary rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center">
          <TrendingDown className="w-4 h-4 mr-2" />
          Tire Wear Projection
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Current Wear</span>
              <span>{strategy.tireWear.current}%</span>
            </div>
            <div className="w-full bg-accent rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${strategy.tireWear.current}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Optimal Pit Window: Laps {strategy.pitWindow.start} - {strategy.pitWindow.end}
          </div>
        </div>
      </div>

      <div className="bg-secondary rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          Pit Stop Strategy
        </h3>
        <div className="space-y-2">
          {predictions.pitStops.map((stop, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span>Stop {index + 1}</span>
              <span className="font-mono">Lap {stop.lap}</span>
              <span className="text-xs text-muted-foreground">{stop.tyreCompound}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-secondary rounded-lg p-4 flex-1">
        <h3 className="text-sm font-semibold mb-3">Race Projection</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Current Position</span>
            <span>P{strategy.currentPosition}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Projected Finish</span>
            <span className="text-green-500">P{predictions.finishPosition}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gap to Leader</span>
            <span>{predictions.gapToLeader}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
