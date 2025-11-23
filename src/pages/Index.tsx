import React, { useState } from 'react';

interface Strategy {
  id: string;
  name: string;
  description: string;
  expectedGainSec: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  keyMetrics: { label: string; value: string | number }[];
  visualDataUrl?: string; // URL to chart/image explaining strategy
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
];

export const RaceStrategiesPage: React.FC = () => {
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(mockStrategies[0].id);

  const selectedStrategy = mockStrategies.find((s) => s.id === selectedStrategyId);

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gray-900 text-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Strategies to Win the Race</h1>

      {/* Strategy Selector */}
      <div className="mb-8 flex flex-wrap gap-4">
        {mockStrategies.map(({ id, name, riskLevel }) => (
          <button
            key={id}
            onClick={() => setSelectedStrategyId(id)}
            className={`px-5 py-3 rounded-md font-semibold ${
              selectedStrategyId === id
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            aria-pressed={selectedStrategyId === id}
          >
            {name} ({riskLevel} Risk)
          </button>
        ))}
                          </div>

      {/* Selected Strategy Details */}
      {selectedStrategy && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">{selectedStrategy.name}</h2>
          <p className="mb-4 text-gray-300">{selectedStrategy.description}</p>

          {/* Key Metrics */}
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {selectedStrategy.keyMetrics.map(({ label, value }) => (
              <li
                key={label}
                className="bg-gray-800 p-4 rounded-md shadow-inner text-center"
              >
                <div className="text-gray-400 text-sm">{label}</div>
                <div className="text-xl font-bold mt-1">{value}</div>
                  </li>
            ))}
                </ul>

          {/* Visual Explanation */}
          {selectedStrategy.visualDataUrl && (
            <div className="border border-gray-700 rounded-md overflow-hidden">
              <img
                src={selectedStrategy.visualDataUrl}
                alt={`${selectedStrategy.name} visualization`}
                className="w-full h-auto object-contain"
              />
                    </div>
          )}
      </section>
      )}
    </div>
  );
};
