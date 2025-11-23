// src/components/GeminiFeaturesShowcase.tsx
// Showcase component highlighting A.I. features

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Video,
  Music,
  Globe,
  Brain,
  Zap,
  TrendingUp,
  Link as LinkIcon,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Layers,
  Search,
  Play,
  BarChart3,
  Activity,
  Clock,
  FileCode,
  Database,
} from 'lucide-react';

const features = [
  {
    icon: Video,
    title: 'Video Processing',
    description: 'Upload and analyze video files directly. Process video content frame-by-frame for comprehensive analysis of race footage, driver behavior, and track conditions.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: Music,
    title: 'Audio Processing',
    description: 'Upload audio files for transcription, analysis, and insights. Extract spoken content, analyze tone, and process audio data natively.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    icon: ImageIcon,
    title: 'Image Analysis',
    description: 'Analyze images, charts, and visual data. Perfect for processing telemetry graphs, track maps, and race photography.',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
  },
  {
    icon: Search,
    title: 'Web Search Grounding',
    description: 'Enable real-time web search to ground responses with current information. Get citations and sources automatically included in responses.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    icon: Layers,
    title: 'Large Context Windows',
    description: 'Process massive amounts of context - up to 1 million tokens. Perfect for analyzing entire race seasons, multiple tracks, or extensive documentation in one go.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  {
    icon: LinkIcon,
    title: 'URL Context Retrieval',
    description: 'Provide URLs and automatically fetch, parse, and analyze web page content. No need to manually copy-paste content.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
  {
    icon: Sparkles,
    title: 'Unified Multimodal API',
    description: 'Single API call handles text, images, videos, audio, and URLs together. No need to process different media types separately.',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  {
    icon: Brain,
    title: 'Advanced Race Data Analysis',
    description: 'Leverage advanced A.I. models for predictive insights, strategic recommendations, and comprehensive race data analysis.',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    description: 'Get predictive insights for tire wear, pit strategies, and race outcomes based on historical data and real-time telemetry.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
];


// Mock data generators for demonstrations
const generateMockRaceAnalytics = () => ({
  vehicles: Array.from({ length: 10 }, (_, i) => ({
    id: `GR86-00${i + 1}-${(i + 1) * 10}`,
    number: (i + 1) * 10,
    lap: 15 + Math.floor(Math.random() * 10),
    gapToLeader: i === 0 ? 0 : (Math.random() * 30).toFixed(3),
    speed: 110 + Math.random() * 20,
    tireWear: 1200 + Math.random() * 300,
    consistency: 95 + Math.random() * 5,
  })),
  totalDataPoints: 2847563,
  tracksAnalyzed: 7,
  racesProcessed: 14,
});

const generateMockVideoAnalysis = () => ({
  frames: 1250,
  duration: '45.2s',
  insights: [
    { type: 'driver', description: 'Late braking detected at Turn 5', confidence: 0.94 },
    { type: 'track', description: 'Wet conditions observed in Sector 2', confidence: 0.87 },
    { type: 'vehicle', description: 'Excessive body roll at Turn 9', confidence: 0.91 },
  ],
});

const generateMockDatasetStats = () => ({
  totalTokens: 1245632,
  tracks: ['barber', 'cota', 'indianapolis', 'road_america', 'sebring', 'sonoma', 'vir'],
  dataPoints: 41989346,
  analysisTime: '2.3s',
});

const generateMockAudioTranscription = () => ({
  transcript: "Alright team, we're looking at about 2.3 seconds to the leader. Tires are holding up well, track temperature is rising. Suggest staying out another 3 laps before pitting.",
  duration: '12.5s',
  speakers: 2,
  keywords: ['leader', 'tires', 'track temperature', 'pitting'],
});

export function GeminiFeaturesShowcase() {
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [mockRaceData] = useState(generateMockRaceAnalytics());
  const [mockVideoData] = useState(generateMockVideoAnalysis());
  const [mockDatasetData] = useState(generateMockDatasetStats());
  const [mockAudioData] = useState(generateMockAudioTranscription());
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isProcessing && processingProgress < 100) {
      const timer = setTimeout(() => {
        setProcessingProgress((prev) => Math.min(prev + 10, 100));
      }, 200);
      return () => clearTimeout(timer);
    } else if (processingProgress >= 100) {
      setIsProcessing(false);
    }
  }, [isProcessing, processingProgress]);

  const handleDemoClick = (demoId: string) => {
    setSelectedDemo(demoId);
    setProcessingProgress(0);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setProcessingProgress(100);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mb-4 shadow-xl shadow-primary/20">
          <Brain className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          A.I. Features
        </h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Powerful A.I. capabilities for race data analysis, multimodal processing, and strategic insights
        </p>
      </div>

      {/* Interactive Demo Section */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Live Demo - Mock Data Analysis
          </CardTitle>
          <CardDescription>
            Experience Gemini AI capabilities with interactive mock data demonstrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Button
              variant={selectedDemo === 'race' ? 'default' : 'outline'}
              onClick={() => handleDemoClick('race')}
              className="h-auto py-4 flex flex-col items-start gap-2"
            >
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                <span className="font-semibold">Race Analytics</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Analyze {mockRaceData.totalDataPoints.toLocaleString()} data points across {mockRaceData.tracksAnalyzed} tracks
              </span>
            </Button>
            <Button
              variant={selectedDemo === 'video' ? 'default' : 'outline'}
              onClick={() => handleDemoClick('video')}
              className="h-auto py-4 flex flex-col items-start gap-2"
            >
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                <span className="font-semibold">Video Analysis</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Process {mockVideoData.frames} frames in real-time
              </span>
            </Button>
            <Button
              variant={selectedDemo === 'dataset' ? 'default' : 'outline'}
              onClick={() => handleDemoClick('dataset')}
              className="h-auto py-4 flex flex-col items-start gap-2"
            >
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                <span className="font-semibold">Large Dataset</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Process {mockDatasetData.totalTokens.toLocaleString()} tokens in {mockDatasetData.analysisTime}
              </span>
            </Button>
          </div>

          {isProcessing && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processing with Gemini AI...</span>
                <span className="text-primary font-semibold">{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="h-2" />
            </div>
          )}

          {selectedDemo && processingProgress >= 100 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              {selectedDemo === 'race' && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Race Analytics Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">{mockRaceData.totalDataPoints.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Data Points</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{mockRaceData.tracksAnalyzed}</div>
                        <div className="text-xs text-muted-foreground">Tracks</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-primary">{mockRaceData.racesProcessed}</div>
                        <div className="text-xs text-muted-foreground">Races</div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="text-sm font-semibold mb-2">Top 5 Vehicles (Live Gaps)</div>
                      <div className="space-y-2">
                        {mockRaceData.vehicles.slice(0, 5).map((vehicle, idx) => (
                          <div key={vehicle.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">#{vehicle.number}</Badge>
                              <span className="text-sm">Lap {vehicle.lap}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">Gap: {vehicle.gapToLeader}s</span>
                              <span className="text-muted-foreground">Speed: {vehicle.speed.toFixed(1)} mph</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedDemo === 'video' && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Video Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded">
                        <div className="text-sm text-muted-foreground mb-1">Frames Analyzed</div>
                        <div className="text-2xl font-bold">{mockVideoData.frames}</div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded">
                        <div className="text-sm text-muted-foreground mb-1">Duration</div>
                        <div className="text-2xl font-bold">{mockVideoData.duration}</div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="text-sm font-semibold mb-2">AI-Generated Insights</div>
                      <div className="space-y-3">
                        {mockVideoData.insights.map((insight, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 rounded">
                            <Badge className="mt-0.5">{insight.type}</Badge>
                            <div className="flex-1">
                              <div className="text-sm font-medium">{insight.description}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Confidence: {(insight.confidence * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedDemo === 'dataset' && (
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Large Dataset Analysis Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-muted/50 rounded text-center">
                        <div className="text-sm text-muted-foreground mb-1">Tokens Processed</div>
                        <div className="text-2xl font-bold text-primary">{mockDatasetData.totalTokens.toLocaleString()}</div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded text-center">
                        <div className="text-sm text-muted-foreground mb-1">Analysis Time</div>
                        <div className="text-2xl font-bold text-primary">{mockDatasetData.analysisTime}</div>
                      </div>
                      <div className="p-4 bg-muted/50 rounded text-center">
                        <div className="text-sm text-muted-foreground mb-1">Data Points</div>
                        <div className="text-2xl font-bold text-primary">{mockDatasetData.dataPoints.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="text-sm font-semibold mb-2">Tracks Analyzed</div>
                      <div className="flex flex-wrap gap-2">
                        {mockDatasetData.tracks.map((track) => (
                          <Badge key={track} variant="secondary" className="capitalize">
                            {track.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Feature Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>


      {/* Use Cases */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Perfect For
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Video Analysis</div>
                  <div className="text-sm text-muted-foreground">
                    Analyze race footage, driver behavior, and track conditions from video
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Large Dataset Analysis</div>
                  <div className="text-sm text-muted-foreground">
                    Process entire race seasons or multiple tracks in one context window
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Web-Enhanced Insights</div>
                  <div className="text-sm text-muted-foreground">
                    Get real-time race data and track information with automatic citations
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Multimedia Content</div>
                  <div className="text-sm text-muted-foreground">
                    Combine text, images, videos, audio, and URLs in a single analysis
                  </div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Key Advantages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div>
                  <div className="font-medium">Massive Context Windows</div>
                  <div className="text-sm text-muted-foreground">
                    Process up to 1M+ tokens for analyzing entire race seasons or multiple tracks
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div>
                  <div className="font-medium">Native Media Support</div>
                  <div className="text-sm text-muted-foreground">
                    No need for external transcription or video processing tools
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div>
                  <div className="font-medium">Real-Time Grounding</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically fetch current information from Google Search
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <div>
                  <div className="font-medium">Unified API</div>
                  <div className="text-sm text-muted-foreground">
                    One endpoint for all media types - simpler integration
                  </div>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

