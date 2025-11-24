// @ts-nocheck
// src/components/GeminiGrounding.tsx
// Component for testing and exploring Gemini Grounding with multiple datasets

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Globe,
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Database,
  FileText,
  BarChart3,
  TrendingUp,
  Sparkles,
  Layers,
  RefreshCw,
  Download,
  Info,
  X,
} from 'lucide-react';
import { analyzeRaceDataWithGrounding } from '@/api/aiAnalytics';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

type DatasetType = 
  | 'track_demo'
  | 'demo_slice'
  | 'ai_summary'
  | 'eda_results'
  | 'mock_telemetry'
  | 'track_geometry'
  | 'custom';

interface DatasetOption {
  id: string;
  name: string;
  type: DatasetType;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}

const TRACK_OPTIONS = [
  { id: 'barber', name: 'Barber Motorsports Park' },
  { id: 'cota', name: 'Circuit of the Americas' },
  { id: 'indianapolis', name: 'Indianapolis Motor Speedway' },
  { id: 'road_america', name: 'Road America' },
  { id: 'sebring', name: 'Sebring International Raceway' },
  { id: 'sonoma', name: 'Sonoma Raceway' },
  { id: 'vir', name: 'Virginia International Raceway' },
];

const DEMO_SLICE_OPTIONS = [
  { id: 'best_overtake', name: 'Best Overtake' },
  { id: 'driver_lockup', name: 'Driver Lockup' },
  { id: 'last_lap_push', name: 'Last Lap Push' },
  { id: 'pit_window_demo', name: 'Pit Window Demo' },
  { id: 'tire_cliff', name: 'Tire Cliff' },
];

const DATASET_TYPES: DatasetOption[] = [
  {
    id: 'track_demo',
    name: 'Track Demo Data',
    type: 'track_demo',
    description: 'Full race telemetry data for a specific track',
    icon: <Database className="w-4 h-4" />,
    available: true,
  },
  {
    id: 'demo_slice',
    name: 'Demo Slice',
    type: 'demo_slice',
    description: 'Focused data slices (overtakes, lockups, pit windows)',
    icon: <FileText className="w-4 h-4" />,
    available: true,
  },
  {
    id: 'ai_summary',
    name: 'AI Summary Reports',
    type: 'ai_summary',
    description: 'Pre-generated AI analysis reports',
    icon: <Sparkles className="w-4 h-4" />,
    available: true,
  },
  {
    id: 'eda_results',
    name: 'EDA Results',
    type: 'eda_results',
    description: 'Exploratory data analysis results',
    icon: <BarChart3 className="w-4 h-4" />,
    available: true,
  },
  {
    id: 'mock_telemetry',
    name: 'Demo Telemetry Samples',
    type: 'mock_telemetry',
    description: 'Sample telemetry data for testing',
    icon: <TrendingUp className="w-4 h-4" />,
    available: true,
  },
  {
    id: 'track_geometry',
    name: 'Track Geometry',
    type: 'track_geometry',
    description: 'Track layout and geometry data',
    icon: <Layers className="w-4 h-4" />,
    available: true,
  },
];

interface GroundingResult {
  analysis: string;
  citations: Array<{ uri: string; title: string }>;
  searchQueries?: string[];
  confidence: number;
  processingTime?: number;
  tokensUsed?: number;
}

export function GeminiGrounding() {
  const [selectedDatasetType, setSelectedDatasetType] = useState<DatasetType>('track_demo');
  const [selectedTrack, setSelectedTrack] = useState<string>('road_america');
  const [selectedSlice, setSelectedSlice] = useState<string>('best_overtake');
  const [groundingQueries, setGroundingQueries] = useState<string>('');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<GroundingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [resultsWithoutGrounding, setResultsWithoutGrounding] = useState<GroundingResult | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const defaultQueries: Record<DatasetType, string[]> = {
    track_demo: [
      'GR Cup race telemetry data structure',
      'race track performance analysis',
      'tire wear patterns in motorsports',
    ],
    demo_slice: [
      'racing overtake techniques',
      'driver lockup causes and prevention',
      'pit window strategy optimization',
    ],
    ai_summary: [
      'AI race analysis best practices',
      'motorsports data analytics',
      'race strategy recommendations',
    ],
    eda_results: [
      'exploratory data analysis techniques',
      'race data visualization methods',
      'statistical analysis in motorsports',
    ],
    mock_telemetry: [
      'telemetry data formats',
      'real-time race data processing',
      'vehicle telemetry standards',
    ],
    track_geometry: [
      'race track design principles',
      'track layout analysis',
      'circuit geometry optimization',
    ],
    custom: [],
  };

  const handleAnalyze = async (withGrounding: boolean = true) => {
    setIsAnalyzing(true);
    setError(null);
    setProgress(0);

    try {
      // Build grounding queries
      const queries = groundingQueries
        .split('\n')
        .filter(q => q.trim())
        .concat(customQuery ? [customQuery] : []);

      if (queries.length === 0 && withGrounding) {
        queries.push(...defaultQueries[selectedDatasetType]);
      }

      // Load dataset based on type
      const dataset = await loadDataset(selectedDatasetType, selectedTrack, selectedSlice);
      setProgress(30);

      // Analyze with grounding
      const response = await analyzeRaceDataWithGrounding(
        dataset,
        'comprehensive',
        withGrounding ? queries : undefined
      );
      setProgress(100);

      const result: GroundingResult = {
        analysis: response.summary || response.insights?.join('\n') || 'Analysis completed',
        citations: response.citations || [],
        searchQueries: queries,
        confidence: response.confidence || 85,
        processingTime: response.metadata?.processingTime,
        tokensUsed: response.metadata?.tokensUsed,
      };

      if (withGrounding) {
        setResults(result);
      } else {
        setResultsWithoutGrounding(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze dataset';
      setError(errorMessage);
      console.error('Grounding analysis error:', err);
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const loadDataset = async (
    type: DatasetType,
    track?: string,
    slice?: string
  ): Promise<any> => {
    const baseData = {
      track: track || 'road_america',
      race: 1,
      timestamp: new Date().toISOString(),
    };

    switch (type) {
      case 'track_demo': {
        const trackName = TRACK_OPTIONS.find(t => t.id === track)?.name || track;
        // Try to load actual demo data if available
        try {
          const response = await fetch(`/demo_data/${track}_demo.json`);
          if (response.ok) {
            const demoData = await response.json();
            return {
              ...baseData,
              ...demoData,
              type: 'track_demo',
              description: `Telemetry data for ${trackName}`,
            };
          }
        } catch (e) {
          // Fall back to base data
        }
        return {
          ...baseData,
          type: 'track_demo',
          description: `Telemetry data for ${trackName}`,
        };
      }
      case 'demo_slice': {
        const sliceName = DEMO_SLICE_OPTIONS.find(s => s.id === slice)?.name || slice;
        // Try to load actual slice data if available
        try {
          const response = await fetch(`/demo_data/demo_slices/${slice}.json`);
          if (response.ok) {
            const sliceData = await response.json();
            return {
              ...baseData,
              ...sliceData,
              type: 'demo_slice',
              slice: slice || 'best_overtake',
              description: `Demo slice: ${sliceName}`,
            };
          }
        } catch (e) {
          // Fall back to base data
        }
        return {
          ...baseData,
          type: 'demo_slice',
          slice: slice || 'best_overtake',
          description: `Demo slice: ${sliceName}`,
        };
      }
      case 'ai_summary': {
        // Try to load AI summary data
        try {
          const response = await fetch('/data/ai_summary_reports.json');
          if (response.ok) {
            const summaryData = await response.json();
            return {
              ...baseData,
              ...summaryData,
              type: 'ai_summary',
              description: 'AI-generated race analysis summary',
            };
          }
        } catch (e) {
          // Fall back to base data
        }
        return {
          ...baseData,
          type: 'ai_summary',
          description: 'AI-generated race analysis summary',
        };
      }
      case 'eda_results': {
        // Try to load EDA results
        try {
          const response = await fetch('/data/eda_results_summary.json');
          if (response.ok) {
            const edaData = await response.json();
            return {
              ...baseData,
              ...edaData,
              type: 'eda_results',
              description: 'Exploratory data analysis results',
            };
          }
        } catch (e) {
          // Fall back to base data
        }
        return {
          ...baseData,
          type: 'eda_results',
          description: 'Exploratory data analysis results',
        };
      }
      case 'mock_telemetry': {
        // Try to load demo telemetry
        try {
          const response = await fetch('/data/mock_telemetry_samples.json');
          if (response.ok) {
            const mockData = await response.json();
            return {
              ...baseData,
              ...mockData,
              type: 'mock_telemetry',
              description: 'Sample telemetry data',
            };
          }
        } catch (e) {
          // Fall back to base data
        }
        return {
          ...baseData,
          type: 'mock_telemetry',
          description: 'Sample telemetry data',
        };
      }
      case 'track_geometry': {
        // Try to load track geometry
        try {
          const response = await fetch('/data/mock_track_geometry.json');
          if (response.ok) {
            const geometryData = await response.json();
            return {
              ...baseData,
              ...geometryData,
              type: 'track_geometry',
              description: 'Track layout and geometry data',
            };
          }
        } catch (e) {
          // Fall back to base data
        }
        return {
          ...baseData,
          type: 'track_geometry',
          description: 'Track layout and geometry data',
        };
      }
      default:
        return baseData;
    }
  };

  const handleCompare = async () => {
    setCompareMode(true);
    setResultsWithoutGrounding(null);
    
    // Analyze without grounding first
    await handleAnalyze(false);
    
    // Then analyze with grounding
    await handleAnalyze(true);
  };

  const selectedDataset = DATASET_TYPES.find(d => d.type === selectedDatasetType);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-r from-green-500/10 via-green-500/5 to-green-500/10 border-green-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Gemini Grounding Explorer</CardTitle>
                <CardDescription>
                  Test Google Search Grounding with multiple datasets. Compare results with and without grounding.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCompare}
                disabled={isAnalyzing}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Compare Mode
              </Button>
              <Button
                onClick={() => handleAnalyze(true)}
                disabled={isAnalyzing}
                className="flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze with Grounding
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>What is Grounding?</AlertTitle>
            <AlertDescription>
              Grounding enhances AI responses by searching the web for real-time information. 
              This provides citations, current data, and up-to-date context for more accurate analysis.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Progress */}
      {isAnalyzing && progress > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Analyzing with grounding...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dataset Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Select Dataset
          </CardTitle>
          <CardDescription>
            Choose from available datasets to test grounding capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dataset Type Selection */}
          <div className="space-y-2">
            <Label>Dataset Type</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DATASET_TYPES.map((dataset) => (
                <motion.button
                  key={dataset.id}
                  onClick={() => setSelectedDatasetType(dataset.type)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedDatasetType === dataset.type
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-border hover:border-green-500/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`${selectedDatasetType === dataset.type ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {dataset.icon}
                    </div>
                    <span className="font-medium text-sm">{dataset.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{dataset.description}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Track Selection (for track_demo) */}
          {selectedDatasetType === 'track_demo' && (
            <div className="space-y-2">
              <Label>Select Track</Label>
              <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRACK_OPTIONS.map((track) => (
                    <SelectItem key={track.id} value={track.id}>
                      {track.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Slice Selection (for demo_slice) */}
          {selectedDatasetType === 'demo_slice' && (
            <div className="space-y-2">
              <Label>Select Demo Slice</Label>
              <Select value={selectedSlice} onValueChange={setSelectedSlice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEMO_SLICE_OPTIONS.map((slice) => (
                    <SelectItem key={slice.id} value={slice.id}>
                      {slice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grounding Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Grounding Configuration
          </CardTitle>
          <CardDescription>
            Configure search queries for grounding. Leave empty to use default queries.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Grounding Queries (one per line)</Label>
            <Textarea
              value={groundingQueries}
              onChange={(e) => setGroundingQueries(e.target.value)}
              placeholder={defaultQueries[selectedDatasetType].join('\n')}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              These queries will be used to search the web for relevant information
            </p>
          </div>

          <div className="space-y-2">
            <Label>Custom Query (optional)</Label>
            <Input
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="e.g., GR Cup 2024 race results"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <div className="font-medium text-sm">Default Queries</div>
              <div className="text-xs text-muted-foreground mt-1">
                {defaultQueries[selectedDatasetType].length} queries will be used if none provided
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGroundingQueries(defaultQueries[selectedDatasetType].join('\n'))}
            >
              Use Defaults
            </Button>
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
                <p className="font-semibold">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <AnimatePresence>
        {(results || resultsWithoutGrounding) && (
          <div className="space-y-4">
            {/* Comparison Mode */}
            {compareMode && resultsWithoutGrounding && results && (
              <Card className="border-blue-500/30 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Comparison: With vs Without Grounding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-600">
                          With Grounding
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {results.citations.length} citations
                        </span>
                      </div>
                      <div className="p-3 bg-card rounded border text-sm">
                        {results.analysis.substring(0, 300)}...
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Without Grounding</Badge>
                        <span className="text-xs text-muted-foreground">No citations</span>
                      </div>
                      <div className="p-3 bg-card rounded border text-sm">
                        {resultsWithoutGrounding.analysis.substring(0, 300)}...
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results with Grounding */}
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className="border-green-500/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        Analysis Results (with Grounding)
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {results.processingTime && (
                          <>
                            <span>{(results.processingTime / 1000).toFixed(1)}s</span>
                            <span>•</span>
                          </>
                        )}
                        {results.tokensUsed && (
                          <>
                            <span>{results.tokensUsed.toLocaleString()} tokens</span>
                            <span>•</span>
                          </>
                        )}
                        <span>{results.confidence}% confidence</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Analysis */}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {results.analysis}
                      </p>
                    </div>

                    {/* Citations */}
                    {results.citations.length > 0 && (
                      <div className="pt-4 border-t border-border">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <LinkIcon className="w-4 h-4" />
                          Sources & Citations ({results.citations.length})
                        </h4>
                        <div className="space-y-2">
                          {results.citations.map((citation, index) => (
                            <a
                              key={index}
                              href={citation.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-2 text-xs text-primary hover:underline p-2 rounded bg-accent/50 transition-colors"
                            >
                              <Globe className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{citation.title}</div>
                                <div className="text-muted-foreground truncate">{citation.uri}</div>
                              </div>
                              <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Search Queries Used */}
                    {results.searchQueries && results.searchQueries.length > 0 && (
                      <div className="pt-4 border-t border-border">
                        <h4 className="text-sm font-semibold mb-2">Search Queries Used</h4>
                        <div className="flex flex-wrap gap-2">
                          {results.searchQueries.map((query, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {query}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

