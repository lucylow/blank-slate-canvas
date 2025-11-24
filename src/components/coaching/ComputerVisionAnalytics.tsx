import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle2,
  BarChart3,
  MapPin,
  Zap,
  Gauge,
  Activity,
  Brain
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ComputerVisionInsight {
  id: string;
  type: 'line_optimization' | 'cornering' | 'positioning' | 'braking' | 'acceleration';
  track: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  impact: number; // 0-100
  confidence: number; // 0-100
  metrics: {
    current: number;
    optimal: number;
    improvement: number;
    unit: string;
  };
}

interface TrackAnalytics {
  trackId: string;
  trackName: string;
  totalEvents: number;
  avgConfidence: number;
  insights: ComputerVisionInsight[];
  performanceScore: number;
  coachingOpportunities: number;
}

interface ComputerVisionAnalyticsProps {
  selectedDriver?: string;
}

// Mock data for 7 tracks
const TRACKS = [
  { id: 'cota', name: 'Circuit of the Americas' },
  { id: 'road-america', name: 'Road America' },
  { id: 'sebring', name: 'Sebring International' },
  { id: 'sonoma', name: 'Sonoma Raceway' },
  { id: 'barber', name: 'Barber Motorsports Park' },
  { id: 'vir', name: 'Virginia International' },
  { id: 'indianapolis', name: 'Indianapolis Motor Speedway' },
];

const generateMockInsights = (trackId: string, trackName: string): ComputerVisionInsight[] => {
  const baseInsights: Omit<ComputerVisionInsight, 'track'>[] = [
    {
      id: `${trackId}-line-1`,
      type: 'line_optimization',
      severity: 'high',
      title: 'Late Apex on Turn 3',
      description: 'Computer vision detected late apex entry on Turn 3, causing 0.3s loss per lap',
      recommendation: 'Begin turn-in 2 meters earlier and aim for apex at 65% through the corner',
      impact: 85,
      confidence: 92,
      metrics: {
        current: 2.8,
        optimal: 2.5,
        improvement: 0.3,
        unit: 'seconds'
      }
    },
    {
      id: `${trackId}-cornering-1`,
      type: 'cornering',
      severity: 'medium',
      title: 'Inconsistent Cornering Speed',
      description: 'Speed variation detected across similar corners, indicating inconsistent technique',
      recommendation: 'Maintain consistent entry speeds for corners with similar radius',
      impact: 65,
      confidence: 88,
      metrics: {
        current: 12.5,
        optimal: 8.2,
        improvement: 4.3,
        unit: 'km/h variance'
      }
    },
    {
      id: `${trackId}-positioning-1`,
      type: 'positioning',
      severity: 'low',
      title: 'Optimal Racing Line Usage',
      description: 'Excellent line selection through technical sections',
      recommendation: 'Maintain current line, focus on exit speed optimization',
      impact: 45,
      confidence: 95,
      metrics: {
        current: 92,
        optimal: 95,
        improvement: 3,
        unit: '% accuracy'
      }
    },
    {
      id: `${trackId}-braking-1`,
      type: 'braking',
      severity: 'high',
      title: 'Early Braking Zone',
      description: 'Braking initiated 15m earlier than optimal, losing time on straights',
      recommendation: 'Push braking point 10-15m later, trail brake into corner',
      impact: 78,
      confidence: 90,
      metrics: {
        current: 125,
        optimal: 140,
        improvement: 15,
        unit: 'meters'
      }
    },
    {
      id: `${trackId}-acceleration-1`,
      type: 'acceleration',
      severity: 'medium',
      title: 'Throttle Application Timing',
      description: 'Delayed throttle application on corner exit, losing acceleration',
      recommendation: 'Begin throttle application at 70% through corner, smooth progressive increase',
      impact: 58,
      confidence: 85,
      metrics: {
        current: 0.45,
        optimal: 0.32,
        improvement: 0.13,
        unit: 'seconds delay'
      }
    }
  ];

  return baseInsights.map(insight => ({ ...insight, track: trackName }));
};

const generateTrackAnalytics = (): TrackAnalytics[] => {
  return TRACKS.map(track => {
    const insights = generateMockInsights(track.id, track.name);
    const avgConfidence = insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length;
    const performanceScore = insights.reduce((sum, i) => {
      const weight = i.severity === 'high' ? 1.0 : i.severity === 'medium' ? 0.7 : 0.4;
      return sum + (i.impact * weight);
    }, 0) / insights.length;
    const coachingOpportunities = insights.filter(i => i.severity === 'high' || i.severity === 'medium').length;

    return {
      trackId: track.id,
      trackName: track.name,
      totalEvents: insights.length,
      avgConfidence,
      insights,
      performanceScore: Math.round(performanceScore),
      coachingOpportunities
    };
  });
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'line_optimization':
      return <Target className="h-4 w-4" />;
    case 'cornering':
      return <Zap className="h-4 w-4" />;
    case 'positioning':
      return <MapPin className="h-4 w-4" />;
    case 'braking':
      return <Gauge className="h-4 w-4" />;
    case 'acceleration':
      return <Activity className="h-4 w-4" />;
    default:
      return <Eye className="h-4 w-4" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'bg-red-500/20 text-red-500 border-red-500/50';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
    case 'low':
      return 'bg-green-500/20 text-green-500 border-green-500/50';
    default:
      return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
  }
};

export function ComputerVisionAnalytics({ selectedDriver }: ComputerVisionAnalyticsProps) {
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const trackAnalytics = generateTrackAnalytics();

  const allInsights = trackAnalytics.flatMap(ta => ta.insights);
  const filteredInsights = selectedTrack === 'all' 
    ? allInsights 
    : trackAnalytics.find(ta => ta.trackId === selectedTrack)?.insights || [];

  const overallStats = {
    totalInsights: allInsights.length,
    highPriority: allInsights.filter(i => i.severity === 'high').length,
    avgConfidence: Math.round(allInsights.reduce((sum, i) => sum + i.confidence, 0) / allInsights.length),
    avgImpact: Math.round(allInsights.reduce((sum, i) => sum + i.impact, 0) / allInsights.length),
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle>Computer Vision & Coaching Analytics</CardTitle>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              AI-Powered Analysis
            </Badge>
          </div>
          <CardDescription>
            Data-driven insights from computer vision analysis across 7 tracks with coaching recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Total Insights</p>
              <p className="text-2xl font-bold">{overallStats.totalInsights}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">High Priority</p>
              <p className="text-2xl font-bold text-red-500">{overallStats.highPriority}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Avg Confidence</p>
              <p className="text-2xl font-bold text-blue-500">{overallStats.avgConfidence}%</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Avg Impact</p>
              <p className="text-2xl font-bold text-green-500">{overallStats.avgImpact}%</p>
            </div>
          </div>

          {/* Track Selector */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Filter by Track</label>
            <select
              value={selectedTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="w-full md:w-64 px-3 py-2 bg-background border rounded-md"
            >
              <option value="all">All Tracks</option>
              {TRACKS.map(track => (
                <option key={track.id} value={track.id}>{track.name}</option>
              ))}
            </select>
          </div>

          <Tabs defaultValue="insights" className="space-y-4">
            <TabsList>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="tracks">Track Comparison</TabsTrigger>
              <TabsTrigger value="coaching">Coaching Plan</TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              <div className="grid gap-4">
                {filteredInsights.map((insight) => (
                  <Card key={insight.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getSeverityColor(insight.severity)}`}>
                            {getTypeIcon(insight.type)}
                          </div>
                          <div>
                            <h4 className="font-semibold">{insight.title}</h4>
                            <p className="text-sm text-muted-foreground">{insight.track}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(insight.severity)}>
                            {insight.severity}
                          </Badge>
                          <Badge variant="outline">
                            {insight.confidence}% confidence
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm mb-4">{insight.description}</p>

                      <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Recommendation:</strong> {insight.recommendation}
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Current</p>
                          <p className="text-lg font-semibold">{insight.metrics.current} {insight.metrics.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Optimal</p>
                          <p className="text-lg font-semibold text-green-500">{insight.metrics.optimal} {insight.metrics.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Improvement</p>
                          <p className="text-lg font-semibold text-blue-500">
                            {insight.metrics.improvement > 0 ? '+' : ''}{insight.metrics.improvement} {insight.metrics.unit}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Impact</p>
                          <div className="flex items-center gap-2">
                            <Progress value={insight.impact} className="flex-1" />
                            <span className="text-sm font-semibold">{insight.impact}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tracks" className="space-y-4">
              <div className="grid gap-4">
                {trackAnalytics.map((track) => (
                  <Card key={track.trackId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{track.trackName}</CardTitle>
                        <Badge variant="outline">{track.trackId}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Events</p>
                          <p className="text-2xl font-bold">{track.totalEvents}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Avg Confidence</p>
                          <p className="text-2xl font-bold text-blue-500">{Math.round(track.avgConfidence)}%</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Performance Score</p>
                          <p className="text-2xl font-bold text-green-500">{track.performanceScore}/100</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Coaching Opportunities</p>
                          <p className="text-2xl font-bold text-yellow-500">{track.coachingOpportunities}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {track.insights.slice(0, 3).map((insight) => (
                          <div key={insight.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center gap-2">
                              {getTypeIcon(insight.type)}
                              <span className="text-sm">{insight.title}</span>
                            </div>
                            <Badge className={getSeverityColor(insight.severity)} variant="outline">
                              {insight.severity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="coaching" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Prioritized Coaching Plan</CardTitle>
                  <CardDescription>
                    High-impact recommendations sorted by potential improvement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allInsights
                      .filter(i => i.severity === 'high' || i.severity === 'medium')
                      .sort((a, b) => b.impact - a.impact)
                      .slice(0, 10)
                      .map((insight, idx) => (
                        <div key={insight.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">{idx + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{insight.title}</h4>
                              <Badge className={getSeverityColor(insight.severity)} variant="outline">
                                {insight.severity}
                              </Badge>
                              <Badge variant="outline">{insight.track}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                            <Alert>
                              <CheckCircle2 className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Action:</strong> {insight.recommendation}
                              </AlertDescription>
                            </Alert>
                            <div className="mt-2 flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">
                                Potential improvement: <span className="font-semibold text-green-500">
                                  {insight.metrics.improvement > 0 ? '+' : ''}{insight.metrics.improvement} {insight.metrics.unit}
                                </span>
                              </span>
                              <span className="text-muted-foreground">
                                Impact: <span className="font-semibold">{insight.impact}%</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

