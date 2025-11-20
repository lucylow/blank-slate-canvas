import { DashboardData } from '@/lib/types';

interface Props {
  performance: DashboardData['performance'];
  meta: DashboardData['meta'];
}

export function PerformanceCard({ performance, meta }: Props) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="font-bold mb-2">Live Performance - Lap {meta.lap}/{meta.total_laps}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>Position: <span className="font-mono text-xl">{performance.position}</span></div>
        <div>Best Lap: <span className="font-mono text-xl">{performance.best_lap}</span></div>
        <div>Gap to Leader: <span className="font-mono text-xl">{performance.gap_to_leader}</span></div>
        <div>Predicted Finish: <span className="font-mono text-xl">{performance.predicted_finish}</span></div>
      </div>
    </div>
  );
}

