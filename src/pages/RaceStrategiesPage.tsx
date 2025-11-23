import React, { useState, useEffect } from 'react';

interface Strategy {
  id: string;
  name: string;
  description: string;
  expectedGainSec: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  keyMetrics: { label: string; value: string | number }[];
  visualDataUrl?: string; // URL to chart/image explaining strategy
}

interface ErrorState {
  hasError: boolean;
  message: string;
}

const mockStrategies: Strategy[] = [
  {
    id: 'undercut',
    name: 'Undercut',
    description:
      'Pit earlier than rivals to gain time on fresh tires while they stay out longer.',
    expectedGainSec: 3.5,
    riskLevel: 'Medium',
    keyMetrics: [
      { label: 'Optimal Pit Window', value: 'Laps 12-15' },
      { label: 'Tire Degradation', value: 'High' },
      { label: 'Traffic Risk', value: 'Medium' },
    ],
    visualDataUrl: '/images/undercut-strategy.png',
  },
  {
    id: 'overcut',
    name: 'Overcut',
    description:
      'Stay out longer on track to push rivals into early pits, gain track position.',
    expectedGainSec: 2.1,
    riskLevel: 'Low',
    keyMetrics: [
      { label: 'Optimal Pit Window', value: 'Laps 16-18' },
      { label: 'Tire Degradation', value: 'Moderate' },
      { label: 'Traffic Risk', value: 'Low' },
    ],
    visualDataUrl: '/images/overcut-strategy.png',
  },
  {
    id: 'two-stop',
    name: 'Two-Stop Strategy',
    description:
      'Plan two pit stops to maximize tire performance but balance track time loss.',
    expectedGainSec: 5.2,
    riskLevel: 'High',
    keyMetrics: [
      { label: 'Pit Stops', value: 2 },
      { label: 'Tire Management', value: 'High' },
      { label: 'Fuel Load', value: 'Medium' },
    ],
    visualDataUrl: '/images/two-stop-strategy.png',
  },
  {
    id: 'one-stop',
    name: 'One-Stop Strategy',
    description:
      'Minimize pit stops to reduce track time loss, relying on tire preservation and fuel management.',
    expectedGainSec: 1.8,
    riskLevel: 'Medium',
    keyMetrics: [
      { label: 'Pit Stops', value: 1 },
      { label: 'Tire Management', value: 'Critical' },
      { label: 'Fuel Load', value: 'High' },
      { label: 'Optimal Pit Window', value: 'Laps 20-25' },
    ],
    visualDataUrl: '/images/one-stop-strategy.png',
  },
  {
    id: 'aggressive-start',
    name: 'Aggressive Start',
    description:
      'Push hard in opening laps to gain positions early, accepting higher tire degradation.',
    expectedGainSec: 4.3,
    riskLevel: 'High',
    keyMetrics: [
      { label: 'Opening Laps Push', value: 'Laps 1-5' },
      { label: 'Position Gain', value: '+3 positions' },
      { label: 'Tire Degradation', value: 'Very High' },
      { label: 'Safety Car Risk', value: 'Medium' },
    ],
    visualDataUrl: '/images/aggressive-start-strategy.png',
  },
  {
    id: 'defensive',
    name: 'Defensive Strategy',
    description:
      'Maintain position and preserve tires, responding to threats rather than attacking.',
    expectedGainSec: 0.5,
    riskLevel: 'Low',
    keyMetrics: [
      { label: 'Position Target', value: 'Maintain' },
      { label: 'Tire Preservation', value: 'Maximum' },
      { label: 'Overtake Attempts', value: 'Minimal' },
      { label: 'Fuel Saving', value: 'High' },
    ],
    visualDataUrl: '/images/defensive-strategy.png',
  },
  {
    id: 'rain-strategy',
    name: 'Wet Weather Strategy',
    description:
      'Adapt pit strategy for wet conditions, optimizing timing for tire changes as track dries.',
    expectedGainSec: 8.7,
    riskLevel: 'High',
    keyMetrics: [
      { label: 'Weather Window', value: 'Laps 8-12' },
      { label: 'Tire Switch', value: 'Wet to Dry' },
      { label: 'Track Conditions', value: 'Drying' },
      { label: 'Visibility Risk', value: 'High' },
    ],
    visualDataUrl: '/images/rain-strategy.png',
  },
  {
    id: 'safety-car',
    name: 'Safety Car Opportunity',
    description:
      'Optimize pit timing during safety car periods to minimize time loss while gaining positions.',
    expectedGainSec: 6.2,
    riskLevel: 'Medium',
    keyMetrics: [
      { label: 'Safety Car Window', value: 'Laps 10-15' },
      { label: 'Pit Under SC', value: 'Yes' },
      { label: 'Track Position', value: '+5 positions' },
      { label: 'SC Duration', value: '3-5 laps' },
    ],
    visualDataUrl: '/images/safety-car-strategy.png',
  },
  {
    id: 'split-strategy',
    name: 'Split Strategy',
    description:
      'Different tire compounds for each stint to capitalize on changing track conditions.',
    expectedGainSec: 3.9,
    riskLevel: 'Medium',
    keyMetrics: [
      { label: 'Stint 1 Compound', value: 'Soft' },
      { label: 'Stint 2 Compound', value: 'Medium' },
      { label: 'Track Evolution', value: 'Improving' },
      { label: 'Temperature Delta', value: '-5°C' },
    ],
    visualDataUrl: '/images/split-strategy.png',
  },
  {
    id: 'long-run',
    name: 'Long First Stint',
    description:
      'Extend first stint significantly to run fewer overall laps on older tires later.',
    expectedGainSec: 2.7,
    riskLevel: 'Medium',
    keyMetrics: [
      { label: 'First Stint Length', value: '28 laps' },
      { label: 'Final Stint Length', value: '15 laps' },
      { label: 'Tire Performance', value: 'Declining' },
      { label: 'Fuel Efficiency', value: 'High' },
    ],
    visualDataUrl: '/images/long-run-strategy.png',
  },
  {
    id: 'undercut-defense',
    name: 'Undercut Defense',
    description:
      'React to rivals attempting undercut by pitting earlier than planned to maintain position.',
    expectedGainSec: 1.2,
    riskLevel: 'Low',
    keyMetrics: [
      { label: 'Reaction Window', value: 'Laps 13-14' },
      { label: 'Position Maintained', value: 'Yes' },
      { label: 'Tire Age Loss', value: '2 laps' },
      { label: 'Out Lap Performance', value: 'Critical' },
    ],
    visualDataUrl: '/images/undercut-defense-strategy.png',
  },
  {
    id: 'fuel-save',
    name: 'Fuel Saving Mode',
    description:
      'Lift and coast strategy to save fuel, enabling lighter car and better tire performance.',
    expectedGainSec: 1.5,
    riskLevel: 'Low',
    keyMetrics: [
      { label: 'Fuel Saved', value: '3.5 kg' },
      { label: 'Lift Points', value: '8 zones' },
      { label: 'Time Loss per Lap', value: '0.3s' },
      { label: 'Tire Benefit', value: '+2 laps' },
    ],
    visualDataUrl: '/images/fuel-save-strategy.png',
  },
];

export const RaceStrategiesPage: React.FC = () => {
  const [error, setError] = useState<ErrorState>({ hasError: false, message: '' });
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  // Safe initialization with error handling
  const getInitialStrategyId = (): string => {
    try {
      if (!mockStrategies || mockStrategies.length === 0) {
        throw new Error('No strategies available');
      }
      return mockStrategies[0].id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize strategies';
      setError({ hasError: true, message: errorMessage });
      return '';
    }
  };

  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(getInitialStrategyId());

  // Validate strategies on mount
  useEffect(() => {
    try {
      if (!mockStrategies || mockStrategies.length === 0) {
        setError({ hasError: true, message: 'No strategies available to display' });
        return;
      }

      // Validate strategy data integrity
      const invalidStrategies = mockStrategies.filter(
        (strategy) =>
          !strategy.id ||
          !strategy.name ||
          !strategy.description ||
          !Array.isArray(strategy.keyMetrics) ||
          strategy.keyMetrics.length === 0
      );

      if (invalidStrategies.length > 0) {
        console.warn('Invalid strategies detected:', invalidStrategies);
        setError({
          hasError: true,
          message: `Found ${invalidStrategies.length} invalid strategy(s). Some data may not display correctly.`,
        });
      }

      // Validate selected strategy exists
      if (selectedStrategyId && !mockStrategies.find((s) => s.id === selectedStrategyId)) {
        setError({
          hasError: true,
          message: `Selected strategy "${selectedStrategyId}" not found. Resetting to first available strategy.`,
        });
        setSelectedStrategyId(mockStrategies[0].id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError({ hasError: true, message: errorMessage });
    }
  }, []);

  const selectedStrategy = mockStrategies.find((s) => s.id === selectedStrategyId);

  const handleStrategySelect = (id: string) => {
    try {
      if (!id) {
        throw new Error('Strategy ID is required');
      }

      const strategy = mockStrategies.find((s) => s.id === id);
      if (!strategy) {
        throw new Error(`Strategy with ID "${id}" not found`);
      }

      setSelectedStrategyId(id);
      setError({ hasError: false, message: '' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to select strategy';
      setError({ hasError: true, message: errorMessage });
      console.error('Error selecting strategy:', err);
    }
  };

  const handleImageError = (strategyId: string, imageUrl: string) => {
    try {
      setImageErrors((prev) => new Set(prev).add(strategyId));
      console.warn(`Failed to load image for strategy "${strategyId}": ${imageUrl}`);
    } catch (err) {
      console.error('Error handling image error:', err);
    }
  };

  // Early return if no strategies available
  if (!mockStrategies || mockStrategies.length === 0) {
    return (
      <main role="main" className="min-h-screen bg-[#0A0A0A] text-white">
        <section className="max-w-6xl mx-auto py-16 px-6">
          <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-6">Strategies to Win the Race</h1>
          <div className="bg-red-900/50 border border-red-500 rounded-md p-4">
            <h2 className="text-xl font-semibold mb-2 text-red-300">Error Loading Strategies</h2>
            <p className="text-red-200">
              {error.message || 'No strategies are currently available. Please try again later.'}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main role="main" className="min-h-screen bg-[#0A0A0A] text-white">
      <section className="max-w-6xl mx-auto py-16 px-6">
        <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-6">Strategies to Win the Race</h1>

      {/* Error Banner */}
      {error.hasError && (
        <div className="mb-6 bg-yellow-900/50 border border-yellow-500 rounded-md p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1 text-yellow-300">Warning</h3>
              <p className="text-yellow-200 text-sm">{error.message}</p>
            </div>
            <button
              onClick={() => setError({ hasError: false, message: '' })}
              className="text-yellow-300 hover:text-yellow-100 ml-4"
              aria-label="Dismiss warning"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Strategy Selector */}
      <div className="mb-8 flex flex-wrap gap-4">
        {mockStrategies.map(({ id, name, riskLevel }) => {
          if (!id || !name) {
            console.warn('Invalid strategy data:', { id, name, riskLevel });
            return null;
          }

          return (
            <button
              key={id}
              onClick={() => handleStrategySelect(id)}
              className={`px-5 py-3 rounded font-semibold transition-colors ${
                selectedStrategyId === id
                  ? 'bg-[#EB0A1E] hover:bg-red-700 text-white'
                  : 'bg-gray-900 border border-gray-800 text-gray-200 hover:bg-gray-800 hover:border-gray-700'
              }`}
              aria-pressed={selectedStrategyId === id}
              disabled={!id}
            >
              {name} ({riskLevel || 'Unknown'} Risk)
            </button>
          );
        })}
      </div>

      {/* Selected Strategy Details */}
      {selectedStrategy ? (
        <section>
          <h2 className="text-2xl font-semibold mb-2">
            {selectedStrategy.name || 'Unnamed Strategy'}
          </h2>
          <p className="mb-4 text-gray-300">
            {selectedStrategy.description || 'No description available.'}
          </p>

          {/* Key Metrics */}
          {selectedStrategy.keyMetrics && selectedStrategy.keyMetrics.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {selectedStrategy.keyMetrics.map(({ label, value }, index) => {
                if (!label) {
                  console.warn('Metric missing label at index:', index);
                  return null;
                }

                return (
                  <li
                    key={`${label}-${index}`}
                    className="bg-gray-900 border border-gray-800 p-4 rounded-lg text-center hover:border-gray-700 transition-colors"
                  >
                    <div className="text-gray-400 text-sm">{label || 'Unknown Metric'}</div>
                    <div className="text-xl font-bold mt-1">
                      {value !== undefined && value !== null ? value : 'N/A'}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mb-6 bg-gray-900 border border-gray-800 p-4 rounded-lg text-center text-gray-400">
              No key metrics available for this strategy.
            </div>
          )}

          {/* Visual Explanation */}
          {selectedStrategy.visualDataUrl ? (
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-gray-700 transition-colors">
            {imageErrors.has(selectedStrategy.id) ? (
              <div className="bg-gray-900 p-8 text-center">
                <p className="text-gray-400 mb-2">Image could not be loaded</p>
                <p className="text-sm text-gray-500">
                  {selectedStrategy.visualDataUrl}
                </p>
                <button
                  onClick={() => {
                    setImageErrors((prev) => {
                      const next = new Set(prev);
                      next.delete(selectedStrategy.id);
                      return next;
                    });
                  }}
                  className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 text-sm transition-colors"
                >
                  Retry Loading Image
                </button>
              </div>
            ) : (
              <img
                src={selectedStrategy.visualDataUrl}
                alt={`${selectedStrategy.name} visualization`}
                className="w-full h-auto object-contain"
                onError={() => handleImageError(selectedStrategy.id, selectedStrategy.visualDataUrl!)}
                loading="lazy"
              />
            )}
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center text-gray-400">
              No visual data available for this strategy.
            </div>
          )}
        </section>
      ) : (
        <section className="bg-gray-900 border border-gray-800 p-8 rounded-lg text-center hover:border-gray-700 transition-colors">
          <h2 className="text-xl font-semibold mb-2 text-gray-300">No Strategy Selected</h2>
          <p className="text-gray-400">
            {selectedStrategyId
              ? `Strategy with ID "${selectedStrategyId}" could not be found.`
              : 'Please select a strategy from the options above.'}
          </p>
        </section>
      )}
      </section>
    </main>
  );
};

export default RaceStrategiesPage;

