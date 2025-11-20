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
            <motion.div
              key={index}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`p-3 rounded-xl border-l-4 backdrop-blur-sm shadow-lg ${
                alert.severity === 'high'
                  ? 'bg-red-500/20 border-red-500 shadow-red-500/10'
                  : alert.severity === 'medium'
                  ? 'bg-yellow-500/20 border-yellow-500 shadow-yellow-500/10'
                  : 'bg-blue-500/20 border-blue-500 shadow-blue-500/10'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className={`w-4 h-4 ${
                  alert.severity === 'high' ? 'text-red-400' :
                  alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                }`} />
                <span className="text-sm font-semibold text-foreground">{alert.message}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="bg-gradient-to-br from-secondary/80 to-muted/50 rounded-xl p-4 mb-4 border border-border/50 shadow-lg">
        <h3 className="text-sm font-bold mb-3 flex items-center text-foreground">
          <TrendingDown className="w-4 h-4 mr-2 text-destructive" />
          Tire Wear Projection
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-medium mb-2">
              <span className="text-muted-foreground">Current Wear</span>
              <span className={`font-bold ${
                strategy.tireWear.current > 80 ? 'text-destructive' :
                strategy.tireWear.current > 60 ? 'text-yellow-400' : 'text-chart-2'
              }`}>{strategy.tireWear.current}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${strategy.tireWear.current}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-3 rounded-full ${
                  strategy.tireWear.current > 80 ? 'bg-gradient-to-r from-destructive to-red-600' :
                  strategy.tireWear.current > 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-chart-2 to-green-600'
                }`}
              />
            </div>
          </div>
          <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
            <span className="font-semibold text-foreground">Optimal Pit Window:</span> Laps {strategy.pitWindow.start} - {strategy.pitWindow.end}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-secondary/80 to-muted/50 rounded-xl p-4 mb-4 border border-border/50 shadow-lg">
        <h3 className="text-sm font-bold mb-3 flex items-center text-foreground">
          <Clock className="w-4 h-4 mr-2 text-chart-1" />
          Pit Stop Strategy
        </h3>
        <div className="space-y-2">
          {predictions.pitStops.map((stop, index) => (
            <div key={index} className="flex justify-between items-center text-sm bg-muted/50 rounded-lg p-2 hover:bg-muted transition-colors">
              <span className="font-semibold text-foreground">Stop {index + 1}</span>
              <span className="font-mono font-bold text-primary">Lap {stop.lap}</span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                stop.tyreCompound === 'Soft' ? 'bg-red-500/20 text-red-400' :
                stop.tyreCompound === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>{stop.tyreCompound}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-secondary/80 to-muted/50 rounded-xl p-4 flex-1 border border-border/50 shadow-lg">
        <h3 className="text-sm font-bold mb-3 text-foreground">Race Projection</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm bg-muted/50 rounded-lg p-2">
            <span className="text-muted-foreground">Current Position</span>
            <span className="font-bold text-xl text-foreground">P{strategy.currentPosition}</span>
          </div>
          <div className="flex justify-between items-center text-sm bg-chart-2/20 rounded-lg p-2">
            <span className="text-muted-foreground">Projected Finish</span>
            <span className="font-bold text-xl text-chart-2">P{predictions.finishPosition}</span>
          </div>
          <div className="flex justify-between items-center text-sm bg-muted/50 rounded-lg p-2">
            <span className="text-muted-foreground">Gap to Leader</span>
            <span className="font-mono font-bold text-primary">{predictions.gapToLeader}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
