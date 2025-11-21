import { DashboardData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Clock, TrendingUp, Target } from 'lucide-react';
import { DemoButton } from '@/components/DemoButton';

interface Props {
  performance: DashboardData['performance'];
  meta: DashboardData['meta'];
}

export function PerformanceCard({ performance, meta }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Live Performance - Lap {meta.lap}/{meta.total_laps}
          </CardTitle>
          <DemoButton size="sm" variant="ghost" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Position
            </div>
            <div className="text-3xl font-bold font-mono">{performance.position}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Best Lap
            </div>
            <div className="text-3xl font-bold font-mono">{performance.best_lap}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Gap to Leader
            </div>
            <div className="text-3xl font-bold font-mono text-primary">{performance.gap_to_leader}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground">Predicted Finish</div>
            <div className="text-3xl font-bold font-mono">{performance.predicted_finish}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

