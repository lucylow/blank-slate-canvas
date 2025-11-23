import React, { useState, useEffect } from 'react';

interface CoachingMetric {
  id: string;
  name: string;
  description: string;
  currentValue: number | string;
  targetValue?: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'steady';
}

interface CoachingAlert {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string; // ISO format
}

interface CoachingTip {
  id: string;
  title: string;
  content: string;
}

interface CoachingToolsProps {
  metrics: CoachingMetric[];
  alerts: CoachingAlert[];
  tips: CoachingTip[];
}

export const CoachingToolsPage: React.FC<CoachingToolsProps> = ({
  metrics,
  alerts,
  tips,
}) => {
  const [selectedTip, setSelectedTip] = useState<CoachingTip | null>(null);

  useEffect(() => {
    if (tips.length > 0) {
      setSelectedTip(tips[0]);
    }
  }, [tips]);

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-900 text-white rounded-md shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Coaching Tools Dashboard</h1>

      {/* Key Metrics Panel */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Key Performance Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {metrics.map(({ id, name, description, currentValue, targetValue, unit, trend }) => (
            <div
              key={id}
              className="bg-gray-800 rounded-lg p-4 flex flex-col justify-between shadow-md hover:shadow-xl transition-shadow"
            >
              <div>
                <h3 className="text-lg font-medium">{name}</h3>
                <p className="text-gray-400 text-sm mb-2">{description}</p>
              </div>
              <div className="text-2xl font-semibold flex items-baseline gap-1">
                {currentValue}
                {unit && <span className="text-base font-normal">{unit}</span>}
                {trend && (
                  <span
                    className={
                      trend === 'up'
                        ? 'text-green-400'
                        : trend === 'down'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }
                    aria-label={`Trend is ${trend}`}
                    title={`Trend is ${trend}`}
                  >
                    {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '▬'}
                  </span>
                )}
              </div>
              {targetValue !== undefined && (
                <p className="text-sm text-gray-400">Target: {targetValue}{unit || ''}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Alerts Panel */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Active Alerts</h2>
        {alerts.length === 0 ? (
          <p className="text-gray-400">No alerts at the moment.</p>
        ) : (
          <ul className="space-y-3 max-h-48 overflow-y-auto">
            {alerts.map(({ id, message, severity, timestamp }) => (
              <li
                key={id}
                className={`p-3 rounded-md ${
                  severity === 'critical'
                    ? 'bg-red-700'
                    : severity === 'warning'
                    ? 'bg-yellow-700'
                    : 'bg-blue-700'
                }`}
              >
                <div className="flex justify-between items-center">
                  <p>{message}</p>
                  <time className="text-xs text-gray-200" dateTime={timestamp}>
                    {new Date(timestamp).toLocaleTimeString()}
                  </time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Coaching Tips Panel */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Coaching Tips</h2>
        <div className="flex flex-col sm:flex-row gap-6">
          <aside className="sm:w-1/3 bg-gray-800 rounded-lg p-4 max-h-[300px] overflow-y-auto">
            <ul>
              {tips.map((tip) => (
                <li
                  key={tip.id}
                  className={`cursor-pointer p-2 rounded-md mb-2 ${
                    selectedTip?.id === tip.id ? 'bg-indigo-600' : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedTip(tip)}
                >
                  {tip.title}
                </li>
              ))}
            </ul>
          </aside>
          <article className="sm:w-2/3 bg-gray-700 rounded-lg p-6 min-h-[300px]">
            {selectedTip ? (
              <>
                <h3 className="text-lg font-bold mb-2">{selectedTip.title}</h3>
                <p className="whitespace-pre-line">{selectedTip.content}</p>
              </>
            ) : (
              <p>Select a tip to see details.</p>
            )}
          </article>
        </div>
      </section>
    </div>
  );
};

// Example usage with mock data
export const exampleMetrics: CoachingMetric[] = [
  {
    id: 'lap-time',
    name: 'Average Lap Time',
    description: 'Average lap time over last 5 laps',
    currentValue: 89.5,
    targetValue: 88,
    unit: 's',
    trend: 'down',
  },
  {
    id: 'tire-wear',
    name: 'Tire Wear %',
    description: 'Current average tire wear',
    currentValue: 67,
    targetValue: 50,
    unit: '%',
    trend: 'up',
  },
  {
    id: 'stress-index',
    name: 'Driver Stress Index',
    description: 'Highest recorded stress level',
    currentValue: '85 BPM',
    trend: 'steady',
  },
];

export const exampleAlerts: CoachingAlert[] = [
  {
    id: 'alert1',
    message: 'Tire wear approaching critical limit on rear left',
    severity: 'warning',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'alert2',
    message: 'Pit stop recommended within next lap',
    severity: 'critical',
    timestamp: new Date().toISOString(),
  },
];

export const exampleTips: CoachingTip[] = [
  {
    id: 'tip1',
    title: 'Managing Tire Degradation',
    content:
      'Consider adjusting driving style to conserve tire life. Monitor lateral G forces and avoid heavy braking zones.',
  },
  {
    id: 'tip2',
    title: 'Optimal Pit Window',
    content:
      'Use Monte Carlo strategy simulation estimates to decide the best lap for your pit stop. Factor in traffic and weather.',
  },
];

