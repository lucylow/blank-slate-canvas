import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  Zap,
  Gauge,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface GapAnalysis {
  chassis: string;
  position: number;
  gapToLeader: number;
  gapToAhead: number | null;
  gapToBehind: number | null;
  relativeSpeed: number;
  overtakingOpportunity: boolean;
  underPressure: boolean;
}

export interface RealTimeInsight {
  type: 'tire_wear' | 'performance' | 'gap_analysis' | 'anomaly' | 'strategy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  chassis: string;
  timestamp: number;
  data?: Record<string, any>;
}

export interface EnhancedMetrics {
  avgSpeed?: number;
  maxSpeed?: number;
  avgAcceleration?: number;
  maxAcceleration?: number;
  avgBraking?: number;
  maxBraking?: number;
  avgCornering?: number;
  maxCornering?: number;
  consistency?: number;
  performanceTrend?: 'improving' | 'stable' | 'degrading';
  sectorTimes?: Record<string, number>;
}

interface RealTimeInsightsProps {
  gaps?: GapAnalysis[];
  insights?: RealTimeInsight[];
  metrics?: EnhancedMetrics;
  chassis?: string;
}

const severityColors = {
  critical: 'bg-red-500/20 border-red-500 text-red-400',
  high: 'bg-orange-500/20 border-orange-500 text-orange-400',
  medium: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
  low: 'bg-blue-500/20 border-blue-500 text-blue-400'
};

const severityIcons = {
  critical: AlertCircle,
  high: AlertTriangle,
  medium: AlertTriangle,
  low: Info
};

export function RealTimeInsights({ gaps = [], insights = [], metrics, chassis }: RealTimeInsightsProps) {
  // Filter insights for current chassis if provided
  const filteredInsights = chassis 
    ? insights.filter(i => i.chassis === chassis)
    : insights;

  // Filter gaps for current chassis if provided
  const filteredGaps = chassis
    ? gaps.filter(g => g.chassis === chassis)
    : gaps;

  const currentGap = filteredGaps[0];

  // Sort insights by severity
  const sortedInsights = [...filteredInsights].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="space-y-4">
      {/* Current Vehicle Gap Analysis */}
      {currentGap && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Gap Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="text-2xl font-bold text-primary">#{currentGap.position}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Gap to Leader</p>
                <p className="text-2xl font-bold">{currentGap.gapToLeader.toFixed(2)}%</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
              {currentGap.gapToAhead !== null && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gap Ahead</p>
                  <p className="text-lg font-semibold">{currentGap.gapToAhead.toFixed(2)}%</p>
                </div>
              )}
              {currentGap.gapToBehind !== null && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gap Behind</p>
                  <p className="text-lg font-semibold">{currentGap.gapToBehind.toFixed(2)}%</p>
                </div>
              )}
            </div>

            {(currentGap.overtakingOpportunity || currentGap.underPressure) && (
              <div className="flex gap-2 pt-2">
                {currentGap.overtakingOpportunity && (
                  <Badge variant="outline" className="bg-green-500/20 border-green-500 text-green-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Overtaking Opportunity
                  </Badge>
                )}
                {currentGap.underPressure && (
                  <Badge variant="outline" className="bg-orange-500/20 border-orange-500 text-orange-400">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Under Pressure
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="w-5 h-5 text-primary" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {metrics.avgSpeed !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Avg Speed</p>
                  <p className="text-xl font-semibold">{metrics.avgSpeed.toFixed(1)} km/h</p>
                </div>
              )}
              {metrics.maxSpeed !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Max Speed</p>
                  <p className="text-xl font-semibold">{metrics.maxSpeed.toFixed(1)} km/h</p>
                </div>
              )}
              {metrics.consistency !== undefined && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Consistency</p>
                  <p className="text-xl font-semibold">{metrics.consistency.toFixed(1)}%</p>
                </div>
              )}
              {metrics.performanceTrend && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Trend</p>
                  <div className="flex items-center gap-2">
                    {metrics.performanceTrend === 'improving' ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : metrics.performanceTrend === 'degrading' ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <Activity className="w-5 h-5 text-blue-500" />
                    )}
                    <span className="text-lg font-semibold capitalize">{metrics.performanceTrend}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sector Times */}
            {metrics.sectorTimes && Object.keys(metrics.sectorTimes).length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground mb-2">Sector Times</p>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(metrics.sectorTimes).map(([sector, time]) => (
                    <div key={sector} className="text-center p-2 bg-muted/50 rounded">
                      <p className="text-xs text-muted-foreground">S{sector}</p>
                      <p className="text-sm font-semibold">{time.toFixed(2)}s</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Real-Time Insights */}
      {sortedInsights.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Real-Time Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {sortedInsights.map((insight, index) => {
                  const Icon = severityIcons[insight.severity];
                  return (
                    <motion.div
                      key={`${insight.chassis}-${insight.timestamp}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-lg border-l-4 ${severityColors[insight.severity]}`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{insight.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {insight.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {insight.chassis}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {sortedInsights.length === 0 && !currentGap && !metrics && (
        <Card className="border-border/50">
          <CardContent className="py-8 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Waiting for real-time data...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

