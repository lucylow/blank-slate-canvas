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

// Default export for routing
const Index = RaceStrategiesPage;
export default Index;
