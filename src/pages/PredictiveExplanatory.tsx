// src/pages/PredictiveExplanatory.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DriverTelemetry {
  lap: number;
  sectorTimes: number[];
  tireWear: number; // percentage
  tireWearThreshold: number;
  paceDelta: number; // seconds
  stressIndex: number; // e.g. heart rate normalized
  position: number;
  pitLap: number | null;
  pitType: "undercut" | "overcut" | "standard" | null;
}

interface PredictiveInsight {
  lap: number;
  predictedTireLifeRemaining: number; // laps
  suggestedPitWindow: [number, number]; // start - end lap
  confidence: number; // 0-1
  explanation: string[];
}

interface DriverAnalysis {
  driverName: string;
  averageLapTime: number;
  consistencyScore: number; // low is better
  stressProfile: number[]; // per lap stress index
  tireWearRate: number; // avg % per lap
  keyStrengths: string[];
  improvementAreas: string[];
}

// Mock data
const mockTelemetry: DriverTelemetry[] = [
  { lap: 10, sectorTimes: [30.1, 31.3, 29.0], tireWear: 45, tireWearThreshold: 70, paceDelta: 0.05, position: 4, pitLap: null, pitType: null, stressIndex: 50 },
  { lap: 11, sectorTimes: [30.0, 31.0, 28.8], tireWear: 48, tireWearThreshold: 70, paceDelta: -0.10, position: 3, pitLap: null, pitType: null, stressIndex: 52 },
  { lap: 12, sectorTimes: [30.5, 32.5, 29.5], tireWear: 72, tireWearThreshold: 70, paceDelta: 0.28, position: 3, pitLap: 12, pitType: 'undercut', stressIndex: 78 },
  { lap: 13, sectorTimes: [29.8, 30.5, 28.5], tireWear: 25, tireWearThreshold: 70, paceDelta: -0.15, position: 2, pitLap: null, pitType: null, stressIndex: 55 },
  { lap: 14, sectorTimes: [29.9, 30.8, 28.6], tireWear: 30, tireWearThreshold: 70, paceDelta: -0.12, position: 2, pitLap: null, pitType: null, stressIndex: 58 },
  { lap: 15, sectorTimes: [30.2, 31.2, 29.2], tireWear: 35, tireWearThreshold: 70, paceDelta: 0.05, position: 2, pitLap: null, pitType: null, stressIndex: 60 },
];

const mockInsights: PredictiveInsight = {
  lap: 15,
  predictedTireLifeRemaining: 7,
  suggestedPitWindow: [18, 22],
  confidence: 0.92,
  explanation: [
    'High lateral G-forces contribute heavily to tire wear.',
    'Frequent heavy braking accelerates rear tire degradation.',
    'Track temperature rising, impacting tire performance.',
    'Current tire wear rate suggests optimal pit window in 3-7 laps.',
    'Traffic conditions favor undercut strategy in suggested window.',
  ],
};

const mockDriverAnalysis: DriverAnalysis = {
  driverName: 'John Doe',
  averageLapTime: 89.3,
  consistencyScore: 1.25,
  stressProfile: [50, 52, 78, 75, 70, 55, 58, 60],
  tireWearRate: 5.3,
  keyStrengths: ['Smooth cornering', 'Consistent lap times', 'Effective tire management', 'Strong sector 3 performance'],
  improvementAreas: ['Brake application control', 'Better pit timing', 'Sector 2 optimization'],
};

/**
 * Predictive & Explanatory A.I. Page
 * 
 * Unified telemetry and coaching with driver analysis.
 * 
 * Features:
 * - Real-time driver telemetry analysis
 * - Predictive tire life and pit window recommendations
 * - Explainable AI insights with confidence scores
 * - Comprehensive driver performance analysis
 * - Stress and performance pattern tracking
 */
export default function PredictiveExplanatory() {
  const [selectedLap, setSelectedLap] = useState<number>(mockTelemetry[0]?.lap || 0);
  const [telemetry] = useState<DriverTelemetry[]>(mockTelemetry);
  const [insights] = useState<PredictiveInsight>(mockInsights);
  const [driverAnalysis] = useState<DriverAnalysis>(mockDriverAnalysis);

  const lapData = telemetry.find((t) => t.lap === selectedLap);

  const getTireWearColor = (wear: number, threshold: number) => {
    if (wear >= threshold) return 'text-red-500';
    if (wear >= threshold * 0.8) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPaceDeltaColor = (delta: number) => {
    if (delta < -0.1) return 'text-green-500';
    if (delta > 0.1) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Predictive & Explanatory A.I.</CardTitle>
            <CardDescription>
              Unified telemetry and coaching with driver analysis. Real-time insights powered by explainable AI.
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="driver-analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="driver-analysis">Driver Analysis</TabsTrigger>
            <TabsTrigger value="telemetry">Telemetry & Insights</TabsTrigger>
            <TabsTrigger value="predictions">Predictive Insights</TabsTrigger>
          </TabsList>

          {/* Driver Analysis Tab */}
          <TabsContent value="driver-analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Driver Analysis - {driverAnalysis.driverName}</CardTitle>
                <CardDescription>Comprehensive performance metrics and coaching insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Average Lap Time</p>
                    <p className="text-2xl font-bold">{driverAnalysis.averageLapTime.toFixed(2)}s</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Consistency Score</p>
                    <p className="text-2xl font-bold">{driverAnalysis.consistencyScore.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Lower is better</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Tire Wear Rate</p>
                    <p className="text-2xl font-bold">{driverAnalysis.tireWearRate.toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">Per lap</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Avg Stress Index</p>
                    <p className="text-2xl font-bold">
                      {(driverAnalysis.stressProfile.reduce((a, b) => a + b, 0) / driverAnalysis.stressProfile.length).toFixed(0)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Key Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {driverAnalysis.keyStrengths.map((strength, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                              ✓
                            </Badge>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Improvement Areas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {driverAnalysis.improvementAreas.map((area, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                              ⚠
                            </Badge>
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Stress Profile</CardTitle>
                    <CardDescription>Stress index across recent laps</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {driverAnalysis.stressProfile.map((stress, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <span className="text-sm font-medium w-16">Lap {idx + 1}</span>
                          <Progress value={stress} className="flex-1" />
                          <span className="text-sm w-12 text-right">{stress}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Telemetry & Insights Tab */}
          <TabsContent value="telemetry" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lap Telemetry & Insights</CardTitle>
                <CardDescription>Detailed per-lap performance data and analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <label htmlFor="lap-select" className="text-sm font-medium">Select Lap:</label>
                  <Select
                    value={selectedLap.toString()}
                    onValueChange={(value) => setSelectedLap(Number(value))}
                  >
                    <SelectTrigger id="lap-select" className="w-[180px]">
                      <SelectValue placeholder="Select a lap" />
                    </SelectTrigger>
                    <SelectContent>
                      {telemetry.map(({ lap }) => (
                        <SelectItem key={lap} value={lap.toString()}>
                          Lap {lap}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {lapData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Position</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-3xl font-bold">P{lapData.position}</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Tire Wear</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className={`text-3xl font-bold ${getTireWearColor(lapData.tireWear, lapData.tireWearThreshold)}`}>
                                {lapData.tireWear}%
                              </p>
                            </div>
                            <Progress value={lapData.tireWear} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              Threshold: {lapData.tireWearThreshold}%
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Pace Delta</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className={`text-3xl font-bold ${getPaceDeltaColor(lapData.paceDelta)}`}>
                            {lapData.paceDelta > 0 ? '+' : ''}{lapData.paceDelta.toFixed(2)}s
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {lapData.paceDelta < 0 ? 'Faster' : lapData.paceDelta > 0 ? 'Slower' : 'On pace'}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Stress Index</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <p className="text-3xl font-bold">{lapData.stressIndex}</p>
                            <Progress value={lapData.stressIndex} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Pit Stop</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {lapData.pitLap ? (
                            <div className="space-y-1">
                              <p className="text-lg font-semibold">Lap {lapData.pitLap}</p>
                              <Badge variant="outline">{lapData.pitType}</Badge>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">No pit stop</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Sector Times</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          {lapData.sectorTimes.map((time, idx) => (
                            <div key={idx} className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">Sector {idx + 1}</p>
                              <p className="text-2xl font-bold">{time.toFixed(2)}s</p>
                            </div>
                          ))}
                          <div className="col-span-3 text-center pt-2 border-t">
                            <p className="text-sm text-muted-foreground mb-1">Total Lap Time</p>
                            <p className="text-2xl font-bold">
                              {lapData.sectorTimes.reduce((a, b) => a + b, 0).toFixed(2)}s
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No data for selected lap.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictive Insights Tab */}
          <TabsContent value="predictions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Predictive Insights</CardTitle>
                <CardDescription>AI-powered predictions with explainable reasoning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Predicted Tire Life</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{insights.predictedTireLifeRemaining}</p>
                      <p className="text-xs text-muted-foreground mt-1">Laps remaining</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Suggested Pit Window</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        Laps {insights.suggestedPitWindow[0]} - {insights.suggestedPitWindow[1]}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Optimal window
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Confidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className={`text-3xl font-bold ${getConfidenceColor(insights.confidence)}`}>
                          {(insights.confidence * 100).toFixed(1)}%
                        </p>
                        <Progress value={insights.confidence * 100} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">AI Explanation</CardTitle>
                    <CardDescription>Reasoning behind the predictions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {insights.explanation.map((ex, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-0.5">
                            {i + 1}
                          </Badge>
                          <span className="flex-1">{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


