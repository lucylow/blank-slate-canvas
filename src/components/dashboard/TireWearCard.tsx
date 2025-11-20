import { DashboardData } from '@/lib/types';

interface Props { 
  wear: DashboardData['tire_wear']; 
}

export function TireWearCard({ wear }: Props) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Tire Wear Prediction</h3>
        <span className="text-sm bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
          Confidence: {(wear.confidence * 100).toFixed(0)}%
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-xs text-gray-400">FRONT LEFT</div>
          <div className="font-mono text-lg">{wear.front_left.toFixed(1)}%</div>
          <div className="text-xs font-mono text-gray-500">
            [{wear.ci_lower.front_left !== undefined ? wear.ci_lower.front_left.toFixed(1) : 'N/A'} - {wear.ci_upper.front_left !== undefined ? wear.ci_upper.front_left.toFixed(1) : 'N/A'}]
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">FRONT RIGHT</div>
          <div className="font-mono text-lg">{wear.front_right.toFixed(1)}%</div>
          <div className="text-xs font-mono text-gray-500">
            [{wear.ci_lower.front_right !== undefined ? wear.ci_lower.front_right.toFixed(1) : 'N/A'} - {wear.ci_upper.front_right !== undefined ? wear.ci_upper.front_right.toFixed(1) : 'N/A'}]
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">REAR LEFT</div>
          <div className="font-mono text-lg">{wear.rear_left.toFixed(1)}%</div>
          <div className="text-xs font-mono text-gray-500">
            [{wear.ci_lower.rear_left !== undefined ? wear.ci_lower.rear_left.toFixed(1) : 'N/A'} - {wear.ci_upper.rear_left !== undefined ? wear.ci_upper.rear_left.toFixed(1) : 'N/A'}]
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">REAR RIGHT</div>
          <div className="font-mono text-lg">{wear.rear_right.toFixed(1)}%</div>
          <div className="text-xs font-mono text-gray-500">
            [{wear.ci_lower.rear_right !== undefined ? wear.ci_lower.rear_right.toFixed(1) : 'N/A'} - {wear.ci_upper.rear_right !== undefined ? wear.ci_upper.rear_right.toFixed(1) : 'N/A'}]
          </div>
        </div>
      </div>
    </div>
  );
}

