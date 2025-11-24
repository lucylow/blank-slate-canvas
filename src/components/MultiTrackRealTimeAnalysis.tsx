// src/components/MultiTrackRealTimeAnalysis.tsx
// Real-time analysis component using data from all 7 datasets for enhanced predictions

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Loader2,
  RefreshCw,
  Zap,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Target,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { getRealTimeAIAnalyticsMultiTrack, ALL_TRACKS } from '@/api/aiAnalytics';
import type { AIAnalyticsResponse } from '@/api/aiAnalytics';
import { useDemoMode } from '@/hooks/useDemoMode';

interface MultiTrackRealTimeAnalysisProps {
  primaryTrack?: string;
  race?: number;
  vehicle?: number;
  lap?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function MultiTrackRealTimeAnalysis({
  primaryTrack = 'cota',
  race = 1,
  vehicle = 7,
  lap = 12,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: MultiTrackRealTimeAnalysisProps) {
  const [analysis, setAnalysis] = useState<AIAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [tracksAnalyzed, setTracksAnalyzed] = useState<number>(0);
  const { isDemoMode } = useDemoMode();

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getRealTimeAIAnalyticsMultiTrack(
        primaryTrack,
        race,
        vehicle,
        lap,
        {
          includeAllTracks: true,
          model: 'gemini', // Use Gemini for better multi-track analysis
          geminiOptions: {
            enableGrounding: true,
            model: 'flashStable',
            temperature: 0.3,
            maxOutputTokens: 4000,
          },
        }
      );
      
      setAnalysis(result);
      setLastUpdate(new Date());
      setTracksAnalyzed(ALL_TRACKS.length);
    } catch (err) {
      console.error('Multi-track analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze multi-track data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryTrack, race, vehicle, lap]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAnalysis();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, primaryTrack, race, vehicle, lap]);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-primary/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Real-Time Multi-Track Analysis
                  {isDemoMode && (
                    <Badge variant="outline" className="text-xs">
                      Demo Mode
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Using data from all {ALL_TRACKS.length} datasets for enhanced predictions
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={fetchAnalysis}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-medium">Primary Track:</span>
              <span className="capitalize">{primaryTrack}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span className="font-medium">Tracks Analyzed:</span>
              <Badge variant="secondary">{tracksAnalyzed || ALL_TRACKS.length}</Badge>
            </div>
            {lastUpdate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
          
          {/* Track List */}
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-sm font-medium mb-2">Analyzing data from:</p>
            <div className="flex flex-wrap gap-2">
              {ALL_TRACKS.map((track) => (
                <Badge
                  key={track}
                  variant={track === primaryTrack ? 'default' : 'outline'}
                  className="capitalize"
                >
                  {track.replace('_', ' ')}
                </Badge>
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
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && !analysis && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-semibold">Analyzing Multi-Track Data...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Aggregating insights from all {ALL_TRACKS.length} tracks
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {analysis && !isLoading && (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="bg-card/60 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Multi-Track Analysis Summary
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="capitalize">{analysis.model}</span>
                  <span>•</span>
                  <span>{analysis.confidence}% confidence</span>
                  {tracksAnalyzed > 1 && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary" className="text-xs">
                        {tracksAnalyzed} tracks
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{analysis.summary}</p>
              {tracksAnalyzed > 1 && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm font-medium text-primary mb-1">
                    ✨ Enhanced Predictions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This analysis leverages cross-track patterns from all {tracksAnalyzed} datasets 
                    to provide more accurate and robust predictions compared to single-track analysis.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Key Insights (Cross-Track Validated)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.insights.map((insight, index) => (
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
                {analysis.recommendations.map((rec, index) => (
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
                Predictive Analytics (Multi-Track Ensemble)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.predictions.tireWear && (
                  <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold text-sm">Tire Wear Forecast</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.predictions.tireWear}</p>
                  </div>
                )}
                {analysis.predictions.lapTime && (
                  <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold text-sm">Lap Time Prediction</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.predictions.lapTime}</p>
                  </div>
                )}
                {analysis.predictions.pitWindow && (
                  <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold text-sm">Pit Window Analysis</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.predictions.pitWindow}</p>
                  </div>
                )}
                {analysis.predictions.performance && (
                  <div className="p-4 rounded-lg bg-accent/50 border border-border/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <h4 className="font-semibold text-sm">Performance Trends</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{analysis.predictions.performance}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Patterns */}
          {(analysis.patterns.identified.length > 0 ||
            analysis.patterns.anomalies.length > 0 ||
            analysis.patterns.trends.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Cross-Track Patterns & Anomalies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.patterns.identified.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-green-600">Identified Patterns</h4>
                      <ul className="space-y-2">
                        {analysis.patterns.identified.map((pattern, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.patterns.anomalies.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-orange-600">Anomalies Detected</h4>
                      <ul className="space-y-2">
                        {analysis.patterns.anomalies.map((anomaly, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span>{anomaly}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.patterns.trends.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-blue-600">Trends</h4>
                      <ul className="space-y-2">
                        {analysis.patterns.trends.map((trend, index) => (
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
        </div>
      )}
    </div>
  );
}

