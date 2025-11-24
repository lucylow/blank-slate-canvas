import { DashboardData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, CheckCircle2 } from 'lucide-react';
import { DemoButton } from '@/components/DemoButton';

interface Props { 
  strategy: DashboardData['strategy']; 
}

export function StrategyCard({ strategy }: Props) {
  const strategies = strategy?.strategies || [];
  const recommended = strategies.find(s => s.name === strategy?.recommended_strategy);
  
  if (!strategy || !Array.isArray(strategies) || strategies.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Strategy Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No strategy data available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Strategy Recommendation
          </CardTitle>
          <DemoButton size="sm" variant="ghost" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommended && (
          <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="font-bold text-green-500">{recommended.name}</span>
              </div>
              <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/30">
                {(recommended.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
            <div className="mt-3 text-sm">
              <span className="text-muted-foreground">Pit on Lap: </span>
              <span className="font-bold text-lg">{recommended.pit_lap}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{recommended.reasoning}</p>
          </div>
        )}
        {strategies.filter(s => s.name !== (strategy?.recommended_strategy || '')).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground">Alternatives</h4>
            <div className="space-y-2">
              {strategies
                .filter(s => s.name !== (strategy?.recommended_strategy || ''))
                .map(s => (
                  <div key={s.name} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg text-sm">
                    <div>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground ml-2">(Lap {s.pit_lap})</span>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {(s.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

