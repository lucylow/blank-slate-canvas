// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Target,
  Gauge,
  Fuel,
  Clock,
  Award,
  BarChart3,
  Activity,
  Flame,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Strategy {
  id: string;
  name: string;
  description: string;
  expectedGainSec: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  keyMetrics: { label: string; value: string | number }[];
  visualDataUrl?: string;
  // Extended data for charts
  pitStops: number;
  optimalPitLap: number;
  tireDegradation: number; // percentage
  fuelConsumption: number; // kg
  positionGain: number;
  lapTimeProjection: { lap: number; time: number }[];
  tireWear: { lap: number; wear: number }[];
  fuelLevel: { lap: number; fuel: number }[];
  positionChange: { lap: number; position: number }[];
}

interface ErrorState {
  hasError: boolean;
  message: string;
}

// Enhanced mock strategies with chart data
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
    pitStops: 1,
    optimalPitLap: 13,
    tireDegradation: 75,
    fuelConsumption: 45.2,
    positionGain: 3,
    lapTimeProjection: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      time: 95.5 - (i < 13 ? i * 0.2 : (i - 13) * 0.15) + Math.random() * 0.5,
    })),
    tireWear: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      wear: Math.min(100, (i + 1) * 3.2 + Math.random() * 2),
    })),
    fuelLevel: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      fuel: Math.max(0, 50 - i * 1.5),
    })),
    positionChange: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      position: Math.max(1, 8 - (i < 13 ? 0 : (i - 13) * 0.3)),
    })),
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
    pitStops: 1,
    optimalPitLap: 17,
    tireDegradation: 60,
    fuelConsumption: 47.8,
    positionGain: 2,
    lapTimeProjection: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      time: 96.0 - (i < 17 ? i * 0.15 : (i - 17) * 0.2) + Math.random() * 0.4,
    })),
    tireWear: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      wear: Math.min(100, (i + 1) * 2.8 + Math.random() * 1.5),
    })),
    fuelLevel: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      fuel: Math.max(0, 50 - i * 1.6),
    })),
    positionChange: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      position: Math.max(1, 8 - (i < 17 ? 0 : (i - 17) * 0.25)),
    })),
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
    pitStops: 2,
    optimalPitLap: 10,
    tireDegradation: 50,
    fuelConsumption: 48.5,
    positionGain: 5,
    lapTimeProjection: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      time: 95.0 - (i % 10 < 3 ? i * 0.25 : (i % 10) * 0.18) + Math.random() * 0.6,
    })),
    tireWear: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      wear: Math.min(100, ((i % 10) + 1) * 4.5 + Math.random() * 2),
    })),
    fuelLevel: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      fuel: Math.max(0, 50 - i * 1.62),
    })),
    positionChange: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      position: Math.max(1, 8 - (i % 10 < 3 ? (i % 10) * 0.4 : 0)),
    })),
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
    pitStops: 1,
    optimalPitLap: 22,
    tireDegradation: 85,
    fuelConsumption: 49.2,
    positionGain: 1,
    lapTimeProjection: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      time: 96.5 - (i < 22 ? i * 0.1 : (i - 22) * 0.12) + Math.random() * 0.3,
    })),
    tireWear: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      wear: Math.min(100, (i + 1) * 3.5 + Math.random() * 1.8),
    })),
    fuelLevel: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      fuel: Math.max(0, 50 - i * 1.64),
    })),
    positionChange: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      position: Math.max(1, 8 - (i < 22 ? 0 : (i - 22) * 0.15)),
    })),
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
    pitStops: 1,
    optimalPitLap: 8,
    tireDegradation: 90,
    fuelConsumption: 46.8,
    positionGain: 4,
    lapTimeProjection: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      time: 94.5 - (i < 5 ? i * 0.3 : i < 8 ? i * 0.2 : (i - 8) * 0.15) + Math.random() * 0.7,
    })),
    tireWear: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      wear: Math.min(100, (i + 1) * 4.2 + Math.random() * 2.5),
    })),
    fuelLevel: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      fuel: Math.max(0, 50 - i * 1.56),
    })),
    positionChange: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      position: Math.max(1, 8 - (i < 5 ? i * 0.6 : 0)),
    })),
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
    pitStops: 1,
    optimalPitLap: 20,
    tireDegradation: 45,
    fuelConsumption: 44.5,
    positionGain: 0,
    lapTimeProjection: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      time: 97.0 - i * 0.08 + Math.random() * 0.2,
    })),
    tireWear: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      wear: Math.min(100, (i + 1) * 2.2 + Math.random() * 1),
    })),
    fuelLevel: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      fuel: Math.max(0, 50 - i * 1.48),
    })),
    positionChange: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      position: 8,
    })),
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
    pitStops: 2,
    optimalPitLap: 10,
    tireDegradation: 70,
    fuelConsumption: 47.2,
    positionGain: 6,
    lapTimeProjection: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      time: 98.0 - (i < 10 ? i * 0.2 : (i - 10) * 0.25) + Math.random() * 0.8,
    })),
    tireWear: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      wear: Math.min(100, (i + 1) * 3.5 + Math.random() * 2),
    })),
    fuelLevel: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      fuel: Math.max(0, 50 - i * 1.57),
    })),
    positionChange: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      position: Math.max(1, 8 - (i < 10 ? 0 : (i - 10) * 0.5)),
    })),
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
    pitStops: 1,
    optimalPitLap: 12,
    tireDegradation: 55,
    fuelConsumption: 45.8,
    positionGain: 5,
    lapTimeProjection: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      time: 95.8 - (i < 12 ? i * 0.18 : (i - 12) * 0.2) + Math.random() * 0.5,
    })),
    tireWear: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      wear: Math.min(100, (i + 1) * 2.9 + Math.random() * 1.5),
    })),
    fuelLevel: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      fuel: Math.max(0, 50 - i * 1.53),
    })),
    positionChange: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      position: Math.max(1, 8 - (i < 12 ? 0 : (i - 12) * 0.4)),
    })),
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
    pitStops: 1,
    optimalPitLap: 15,
    tireDegradation: 65,
    fuelConsumption: 46.5,
    positionGain: 3,
    lapTimeProjection: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      time: 95.2 - (i < 15 ? i * 0.22 : (i - 15) * 0.18) + Math.random() * 0.5,
    })),
    tireWear: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      wear: Math.min(100, (i + 1) * 3.1 + Math.random() * 1.8),
    })),
    fuelLevel: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      fuel: Math.max(0, 50 - i * 1.55),
    })),
    positionChange: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      position: Math.max(1, 8 - (i < 15 ? 0 : (i - 15) * 0.3)),
    })),
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
    pitStops: 1,
    optimalPitLap: 25,
    tireDegradation: 80,
    fuelConsumption: 48.8,
    positionGain: 2,
    lapTimeProjection: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      time: 96.2 - (i < 25 ? i * 0.12 : (i - 25) * 0.1) + Math.random() * 0.4,
    })),
    tireWear: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      wear: Math.min(100, (i + 1) * 3.8 + Math.random() * 2),
    })),
    fuelLevel: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      fuel: Math.max(0, 50 - i * 1.63),
    })),
    positionChange: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      position: Math.max(1, 8 - (i < 25 ? 0 : (i - 25) * 0.2)),
    })),
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
    pitStops: 1,
    optimalPitLap: 13,
    tireDegradation: 70,
    fuelConsumption: 46.0,
    positionGain: 0,
    lapTimeProjection: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      time: 96.0 - (i < 13 ? i * 0.15 : (i - 13) * 0.16) + Math.random() * 0.4,
    })),
    tireWear: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      wear: Math.min(100, (i + 1) * 3.3 + Math.random() * 1.5),
    })),
    fuelLevel: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      fuel: Math.max(0, 50 - i * 1.53),
    })),
    positionChange: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      position: 8,
    })),
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
    pitStops: 1,
    optimalPitLap: 18,
    tireDegradation: 50,
    fuelConsumption: 41.0,
    positionGain: 1,
    lapTimeProjection: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      time: 97.2 - (i < 18 ? i * 0.1 : (i - 18) * 0.12) + Math.random() * 0.3,
    })),
    tireWear: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      wear: Math.min(100, (i + 1) * 2.5 + Math.random() * 1.2),
    })),
    fuelLevel: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      fuel: Math.max(0, 50 - i * 1.37),
    })),
    positionChange: Array.from({ length: 30 }, (_, i) => ({
      lap: i + 1,
      position: Math.max(1, 8 - (i < 18 ? 0 : (i - 18) * 0.1)),
    })),
  },
];

const COLORS = {
  Low: '#10b981',
  Medium: '#f59e0b',
  High: '#ef4444',
};

export const RaceStrategiesPage: React.FC = () => {
  const [error, setError] = useState<ErrorState>({ hasError: false, message: '' });
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>(
    mockStrategies[0]?.id || ''
  );
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompareIds, setSelectedCompareIds] = useState<Set<string>>(new Set());
  const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');

  const selectedStrategy = mockStrategies.find((s) => s.id === selectedStrategyId);
  const filteredStrategies = useMemo(() => {
    if (riskFilter === 'All') return mockStrategies;
    return mockStrategies.filter((s) => s.riskLevel === riskFilter);
  }, [riskFilter]);

  // Comparison chart data
  const comparisonData = useMemo(() => {
    if (!compareMode || selectedCompareIds.size === 0) return [];
    const compareStrategies = mockStrategies.filter((s) =>
      selectedCompareIds.has(s.id)
    );
    return compareStrategies.map((s) => ({
      name: s.name,
      expectedGain: s.expectedGainSec,
      risk: s.riskLevel === 'Low' ? 1 : s.riskLevel === 'Medium' ? 2 : 3,
      tireDeg: s.tireDegradation,
      fuelCons: s.fuelConsumption,
      positionGain: s.positionGain,
    }));
  }, [compareMode, selectedCompareIds]);

  // Risk vs Reward scatter data
  const riskRewardData = useMemo(() => {
    return mockStrategies.map((s) => ({
      name: s.name,
      risk: s.riskLevel === 'Low' ? 1 : s.riskLevel === 'Medium' ? 2 : 3,
      reward: s.expectedGainSec,
      id: s.id,
    }));
  }, []);

  const handleStrategySelect = (id: string) => {
    if (compareMode) {
      setSelectedCompareIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      setSelectedStrategyId(id);
    }
  };

  const getRiskColor = (risk: 'Low' | 'Medium' | 'High') => COLORS[risk];

  return (
    <main role="main" className="min-h-screen bg-gradient-to-br from-[#0A0A0A] via-[#0F0F0F] to-[#0A0A0A] text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-2">
                Race Strategies
              </h1>
              <p className="text-gray-400 text-lg">
                Analyze and compare race strategies with interactive data visualizations
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={compareMode ? 'default' : 'outline'}
                onClick={() => {
                  setCompareMode(!compareMode);
                  setSelectedCompareIds(new Set());
                }}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                {compareMode ? 'Exit Compare' : 'Compare Mode'}
              </Button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex gap-2">
              {(['All', 'Low', 'Medium', 'High'] as const).map((level) => (
                <Button
                  key={level}
                  variant={riskFilter === level ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRiskFilter(level)}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Error Banner */}
        {error.hasError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 bg-yellow-900/50 border border-yellow-500 rounded-lg p-4"
          >
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
          </motion.div>
        )}

        {/* Strategy Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          <AnimatePresence>
            {filteredStrategies.map((strategy, index) => {
              const isSelected =
                compareMode
                  ? selectedCompareIds.has(strategy.id)
                  : selectedStrategyId === strategy.id;
              return (
                <motion.div
                  key={strategy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                      isSelected
                        ? 'ring-2 ring-primary shadow-lg'
                        : 'hover:border-gray-600'
                    } bg-gray-900/50 border-gray-800 backdrop-blur-sm`}
                    onClick={() => handleStrategySelect(strategy.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-bold">{strategy.name}</CardTitle>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: getRiskColor(strategy.riskLevel),
                            color: getRiskColor(strategy.riskLevel),
                          }}
                        >
                          {strategy.riskLevel}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-gray-400 line-clamp-2">
                        {strategy.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-green-400">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-bold text-lg">
                            +{strategy.expectedGainSec.toFixed(1)}s
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {strategy.pitStops} stop{strategy.pitStops !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Comparison Charts */}
        {compareMode && comparisonData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Strategy Comparison
                </CardTitle>
                <CardDescription>
                  Compare selected strategies across key metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-4 text-gray-300">
                      Expected Time Gain
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="expectedGain" fill="#EB0A1E" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold mb-4 text-gray-300">
                      Tire Degradation vs Fuel Consumption
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart data={comparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          type="number"
                          dataKey="tireDeg"
                          name="Tire Degradation"
                          stroke="#9CA3AF"
                          label={{ value: 'Tire Degradation %', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                          type="number"
                          dataKey="fuelCons"
                          name="Fuel Consumption"
                          stroke="#9CA3AF"
                          label={{ value: 'Fuel (kg)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Scatter dataKey="fuelCons" fill="#EB0A1E">
                          {comparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.risk as keyof typeof COLORS] || '#EB0A1E'} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Risk vs Reward Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Risk vs Reward Analysis
              </CardTitle>
              <CardDescription>
                Visualize the trade-off between risk level and expected time gain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    type="number"
                    dataKey="risk"
                    name="Risk Level"
                    domain={[0.5, 3.5]}
                    stroke="#9CA3AF"
                    label={{ value: 'Risk Level (1=Low, 2=Medium, 3=High)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="reward"
                    name="Expected Gain"
                    stroke="#9CA3AF"
                    label={{ value: 'Expected Time Gain (seconds)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload as { name: string; risk: number; reward: number };
                        return (
                          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
                            <p className="font-semibold text-white">{data.name}</p>
                            <p className="text-sm text-gray-300">
                              Risk: {data.risk === 1 ? 'Low' : data.risk === 2 ? 'Medium' : 'High'}
                            </p>
                            <p className="text-sm text-green-400">
                              Gain: +{data.reward.toFixed(1)}s
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={riskRewardData} fill="#EB0A1E">
                    {riskRewardData.map((entry, index) => {
                      const riskLevel = entry.risk === 1 ? 'Low' : entry.risk === 2 ? 'Medium' : 'High';
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[riskLevel as keyof typeof COLORS]}
                        />
                      );
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Selected Strategy Details */}
        {selectedStrategy && !compareMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5 bg-gray-900/50">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="tires">Tires</TabsTrigger>
                <TabsTrigger value="fuel">Fuel</TabsTrigger>
                <TabsTrigger value="position">Position</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Strategy Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{selectedStrategy.name}</h3>
                        <p className="text-gray-300">{selectedStrategy.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-1">Expected Gain</div>
                          <div className="text-2xl font-bold text-green-400">
                            +{selectedStrategy.expectedGainSec.toFixed(1)}s
                          </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-1">Risk Level</div>
                          <div
                            className="text-2xl font-bold"
                            style={{ color: getRiskColor(selectedStrategy.riskLevel) }}
                          >
                            {selectedStrategy.riskLevel}
                          </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-1">Pit Stops</div>
                          <div className="text-2xl font-bold text-white">
                            {selectedStrategy.pitStops}
                          </div>
                        </div>
                        <div className="bg-gray-800/50 rounded-lg p-4">
                          <div className="text-sm text-gray-400 mb-1">Optimal Pit Lap</div>
                          <div className="text-2xl font-bold text-white">
                            Lap {selectedStrategy.optimalPitLap}
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold mb-3 text-gray-300">Key Metrics</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedStrategy.keyMetrics.map((metric, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-800/30 rounded p-3 border border-gray-700"
                            >
                              <div className="text-xs text-gray-400">{metric.label}</div>
                              <div className="text-sm font-semibold text-white mt-1">
                                {metric.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Strategy Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Tire Degradation</span>
                            <span className="font-semibold">{selectedStrategy.tireDegradation}%</span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all"
                              style={{ width: `${selectedStrategy.tireDegradation}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Fuel Consumption</span>
                            <span className="font-semibold">
                              {selectedStrategy.fuelConsumption.toFixed(1)} kg
                            </span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${(selectedStrategy.fuelConsumption / 50) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Position Gain</span>
                            <span className="font-semibold text-green-400">
                              +{selectedStrategy.positionGain}
                            </span>
                          </div>
                          <div className="w-full bg-gray-800 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${(selectedStrategy.positionGain / 8) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="mt-6">
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="w-5 h-5" />
                      Lap Time Projection
                    </CardTitle>
                    <CardDescription>
                      Predicted lap times throughout the race
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={selectedStrategy.lapTimeProjection}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="lap"
                          stroke="#9CA3AF"
                          label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          label={{ value: 'Lap Time (seconds)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="time"
                          stroke="#EB0A1E"
                          strokeWidth={2}
                          dot={{ fill: '#EB0A1E', r: 3 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tires" className="mt-6">
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flame className="w-5 h-5" />
                      Tire Wear Analysis
                    </CardTitle>
                    <CardDescription>
                      Tire degradation over race distance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={selectedStrategy.tireWear}>
                        <defs>
                          <linearGradient id="tireWearGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="lap"
                          stroke="#9CA3AF"
                          label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          domain={[0, 100]}
                          label={{ value: 'Tire Wear %', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="wear"
                          stroke="#ef4444"
                          strokeWidth={2}
                          fill="url(#tireWearGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="fuel" className="mt-6">
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Fuel className="w-5 h-5" />
                      Fuel Consumption
                    </CardTitle>
                    <CardDescription>
                      Fuel level throughout the race
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={selectedStrategy.fuelLevel}>
                        <defs>
                          <linearGradient id="fuelGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="lap"
                          stroke="#9CA3AF"
                          label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          domain={[0, 50]}
                          label={{ value: 'Fuel (kg)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="fuel"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          fill="url(#fuelGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="position" className="mt-6">
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Position Tracking
                    </CardTitle>
                    <CardDescription>
                      Expected position changes throughout the race
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={selectedStrategy.positionChange}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="lap"
                          stroke="#9CA3AF"
                          reversed
                          label={{ value: 'Lap Number', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          domain={[1, 8]}
                          reversed
                          label={{ value: 'Position', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: '1px solid #374151',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="position"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: '#10b981', r: 4 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default RaceStrategiesPage;
