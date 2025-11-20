import { DashboardData } from '@/lib/types';

interface Props { 
  strategy: DashboardData['strategy']; 
}

export function StrategyCard({ strategy }: Props) {
  const recommended = strategy.strategies.find(s => s.name === strategy.recommended_strategy);
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg h-full">
      <h3 className="font-bold mb-2">Strategy Recommendation</h3>
      {recommended && (
        <div className="bg-green-500/10 border border-green-500 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-bold text-green-300">{recommended.name}</span>
            <span className="text-sm">{(recommended.confidence * 100).toFixed(0)}% Conf.</span>
          </div>
          <div className="mt-2">Pit on Lap: <strong>{recommended.pit_lap}</strong></div>
          <p className="text-xs text-gray-400 mt-1">{recommended.reasoning}</p>
        </div>
      )}
      <h4 className="text-sm font-bold mt-4 mb-2">Alternatives</h4>
      <div className="space-y-2">
        {strategy.strategies
          .filter(s => s.name !== strategy.recommended_strategy)
          .map(s => (
            <div key={s.name} className="text-xs flex justify-between p-2 bg-gray-700/50 rounded">
              <span>{s.name} (Pit Lap {s.pit_lap})</span>
              <span className="font-mono">{(s.confidence * 100).toFixed(0)}%</span>
            </div>
          ))}
      </div>
    </div>
  );
}

