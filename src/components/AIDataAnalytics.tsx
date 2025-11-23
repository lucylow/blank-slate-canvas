// src/components/AIDataAnalytics.tsx
// AI-powered data analytics component emphasizing OpenAI and Gemini for race data analysis

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Loader2,
  RefreshCw,
  Zap,
  Target,
  Activity,
} from 'lucide-react';
import { useAIAnalytics, useRealTimeAIAnalytics, useAnalyzeRaceData } from '@/hooks/useAIAnalytics';
import type { RaceDataAnalytics } from '@/api/aiAnalytics';

interface AIDataAnalyticsProps {
  track?: string;
  race?: number;
  vehicle?: number;
  lap?: number;
  raceData?: RaceDataAnalytics;
  autoRefresh?: boolean;
}

export function AIDataAnalytics({
  track,
  race,
  vehicle,
  lap,
  raceData,
  autoRefresh = false,
}: AIDataAnalyticsProps) {
  const [analysisType, setAnalysisType] = useState<
    'comprehensive' | 'tire' | 'performance' | 'strategy' | 'predictive'
  >('comprehensive');
  const [selectedModel, setSelectedModel] = useState<'openai' | 'gemini' | 'both'>('openai');

  // Real-time analytics query
  const {
    data: realtimeData,
    isLoading: realtimeLoading,
    error: realtimeError,
    refetch: refetchRealtime,
  } = useRealTimeAIAnalytics(
    track || '',
    race || 0,
    vehicle,
    lap,
    autoRefresh && !!track && !!race
  );

  // Manual analysis mutation
  const {
    analyzeAsync,
    isLoading: isAnalyzing,
    data: analysisData,
    error: analysisError,
  } = useAnalyzeRaceData();

  const currentData = realtimeData || analysisData;
  const isLoading = realtimeLoading || isAnalyzing;
  const error = realtimeError || analysisError;

  const handleAnalyze = async () => {
    if (raceData) {
      await analyzeAsync({
        data: raceData,
        analysisType,
        model: selectedModel,
      });
    } else if (track && race) {
      refetchRealtime();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl">AI Data Analytics</CardTitle>
                <CardDescription>
                  Powered by OpenAI & Gemini for advanced race data analysis
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || (!raceData && (!track || !race))}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Analysis Type Selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(['comprehensive', 'tire', 'performance', 'strategy', 'predictive'] as const).map(
              (type) => (
                <Button
                  key={type}
                  variant={analysisType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAnalysisType(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              )
            )}
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">AI Model:</span>
            <div className="flex gap-2">
              {(['openai', 'gemini', 'both'] as const).map((model) => (
                <Button
                  key={model}
                  variant={selectedModel === model ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedModel(model)}
                  className="capitalize"
                >
                  {model === 'openai' ? 'OpenAI GPT-4' : model === 'gemini' ? 'Gemini Pro' : 'Both'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Analysis Error</p>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : 'Failed to analyze data'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-semibold">Analyzing Race Data...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Using {selectedModel === 'both' ? 'OpenAI & Gemini' : selectedModel.toUpperCase()} for
                advanced analytics
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {currentData && !isLoading && (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="bg-card/60 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Analysis Summary
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="capitalize">{currentData.model}</span>
                  <span>•</span>
                  <span>{currentData.confidence}% confidence</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{currentData.summary}</p>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentData.insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-accent/50 border border-border/30"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm flex-1">{insight}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentData.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
                  >
                    <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm flex-1">{rec}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Predictions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Predictive Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {currentData.predictions.tireWear && (
                  <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                    <h4 className="font-semibold text-sm mb-2">Tire Wear Forecast</h4>
                    <p className="text-sm text-muted-foreground">{currentData.predictions.tireWear}</p>
                  </div>
                )}
                {currentData.predictions.lapTime && (
                  <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                    <h4 className="font-semibold text-sm mb-2">Lap Time Prediction</h4>
                    <p className="text-sm text-muted-foreground">{currentData.predictions.lapTime}</p>
                  </div>
                )}
                {currentData.predictions.pitWindow && (
                  <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                    <h4 className="font-semibold text-sm mb-2">Pit Window Analysis</h4>
                    <p className="text-sm text-muted-foreground">{currentData.predictions.pitWindow}</p>
                  </div>
                )}
                {currentData.predictions.performance && (
                  <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                    <h4 className="font-semibold text-sm mb-2">Performance Trends</h4>
                    <p className="text-sm text-muted-foreground">{currentData.predictions.performance}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Patterns */}
          {(currentData.patterns.identified.length > 0 ||
            currentData.patterns.anomalies.length > 0 ||
            currentData.patterns.trends.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Data Patterns & Anomalies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentData.patterns.identified.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-green-600">Identified Patterns</h4>
                      <ul className="space-y-2">
                        {currentData.patterns.identified.map((pattern, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {currentData.patterns.anomalies.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-orange-600">Anomalies Detected</h4>
                      <ul className="space-y-2">
                        {currentData.patterns.anomalies.map((anomaly, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span>{anomaly}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {currentData.patterns.trends.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-blue-600">Trends</h4>
                      <ul className="space-y-2">
                        {currentData.patterns.trends.map((trend, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{trend}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleAnalyze}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Analysis
            </Button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!currentData && !isLoading && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Brain className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-semibold mb-2">Ready for AI Analysis</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Select analysis type and AI model, then click "Run Analysis" to generate
                comprehensive insights using OpenAI or Gemini.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

