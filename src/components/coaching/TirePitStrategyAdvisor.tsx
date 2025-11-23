import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, Clock, TrendingDown } from 'lucide-react';

interface TireCondition {
  position: 'front-left' | 'front-right' | 'rear-left' | 'rear-right';
  currentWear: number;
  predictedLapsRemaining: number;
  status: 'good' | 'warning' | 'critical';
}

interface PitWindow {
  lap: number;
  confidence: number;
  expectedGain: number;
  reasoning: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface TirePitStrategyAdvisorProps {
  selectedDriver: string;
}

const mockTireConditions: TireCondition[] = [
  { position: 'front-left', currentWear: 65, predictedLapsRemaining: 8, status: 'warning' },
  { position: 'front-right', currentWear: 68, predictedLapsRemaining: 7, status: 'warning' },
  { position: 'rear-left', currentWear: 72, predictedLapsRemaining: 6, status: 'critical' },
  { position: 'rear-right', currentWear: 70, predictedLapsRemaining: 6, status: 'warning' },
];

const mockPitWindows: PitWindow[] = [
  {
    lap: 12,
    confidence: 92,
    expectedGain: 3.5,
    reasoning: [
      'Optimal tire wear window',
      'Low traffic expected',
      'Weather conditions stable',
      'Fuel load optimal',
    ],
    riskLevel: 'low',
  },
  {
    lap: 15,
    confidence: 78,
    expectedGain: 2.1,
    reasoning: [
      'Slightly late but still viable',
      'Medium traffic risk',
      'May lose position to competitors',
    ],
    riskLevel: 'medium',
  },
  {
    lap: 18,
    confidence: 45,
    expectedGain: -1.2,
    reasoning: [
      'Tire degradation will be severe',
      'High risk of tire failure',
      'Significant time loss expected',
    ],
    riskLevel: 'high',
  },
];

const mockLapTimeProjection = [
  { lap: 8, withPit: 89.5, withoutPit: 89.2 },
  { lap: 9, withPit: 89.3, withoutPit: 89.5 },
  { lap: 10, withPit: 89.1, withoutPit: 89.8 },
  { lap: 11, withPit: 88.9, withoutPit: 90.2 },
  { lap: 12, withPit: 88.7, withoutPit: 90.8 },
  { lap: 13, withPit: 88.5, withoutPit: 91.5 },
  { lap: 14, withPit: 88.3, withoutPit: 92.2 },
  { lap: 15, withPit: 88.1, withoutPit: 93.0 },
];

export function TirePitStrategyAdvisor({ selectedDriver }: TirePitStrategyAdvisorProps) {
  const [selectedPitWindow, setSelectedPitWindow] = useState<PitWindow | null>(mockPitWindows[0]);

  const getTireStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'high':
        return 'bg-red-500/20 text-red-500 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
    }
  };

  const avgTireWear = mockTireConditions.reduce((sum, tire) => sum + tire.currentWear, 0) / mockTireConditions.length;
  const minLapsRemaining = Math.min(...mockTireConditions.map(t => t.predictedLapsRemaining));

  return (
    <div className="space-y-4">
      {/* Critical Alert */}
      {minLapsRemaining <= 6 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Tire Wear</AlertTitle>
          <AlertDescription>
            Tires are approaching critical wear levels. Pit stop recommended within {minLapsRemaining} laps.
          </AlertDescription>
        </Alert>
      )}

      {/* Tire Condition Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockTireConditions.map((tire) => (
          <Card key={tire.position} className={`border-2 ${
            tire.status === 'critical' ? 'border-red-500/50' :
            tire.status === 'warning' ? 'border-yellow-500/50' :
            'border-green-500/50'
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm capitalize">{tire.position.replace('-', ' ')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{tire.currentWear}%</span>
                  <Badge className={getTireStatusColor(tire.status)}>
                    {tire.status}
                  </Badge>
                </div>
                <Progress value={tire.currentWear} className="h-2" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{tire.predictedLapsRemaining} laps remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pit Window Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimal Pit Window Recommendations</CardTitle>
          <CardDescription>Monte Carlo simulation results for pit strategy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockPitWindows.map((window, idx) => (
              <Card 
                key={idx}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedPitWindow === window ? 'ring-2 ring-primary' : ''
                } ${getRiskColor(window.riskLevel)}`}
                onClick={() => setSelectedPitWindow(window)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">Lap {window.lap}</h3>
                        <Badge className={getRiskColor(window.riskLevel)}>
                          {window.riskLevel.toUpperCase()} RISK
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Confidence:</span>
                          <span className="font-semibold">{window.confidence}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-4 w-4" />
                          <span className="text-muted-foreground">Expected Gain:</span>
                          <span className={`font-semibold ${window.expectedGain > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {window.expectedGain > 0 ? '+' : ''}{window.expectedGain.toFixed(1)}s
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedPitWindow === window && (
                      <Button size="sm">Select Strategy</Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium mb-2">Reasoning:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {window.reasoning.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lap Time Impact Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>Lap Time Impact Forecast</CardTitle>
          <CardDescription>Projected lap times with and without pit stop</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mockLapTimeProjection}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="lap" tick={{ fill: 'currentColor' }} />
              <YAxis tick={{ fill: 'currentColor' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="withPit" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
                name="With Pit Stop (Lap 12)"
              />
              <Area 
                type="monotone" 
                dataKey="withoutPit" 
                stroke="#ef4444" 
                fill="#ef4444" 
                fillOpacity={0.3}
                name="Without Pit Stop"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-semibold">Recommendation: Pit on Lap 12</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Expected time gain of 3.5 seconds over remaining race distance. 
              Optimal balance between tire condition and track position.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

