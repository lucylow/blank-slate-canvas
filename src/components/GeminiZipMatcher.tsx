// src/components/GeminiZipMatcher.tsx
// Component for uploading and matching 7 zip datasets using Gemini Cloud

import React, { useState, useRef } from 'react';
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
import { Switch } from '@/components/ui/switch';
import {
  Upload,
  FileArchive,
  Brain,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  TrendingUp,
  Target,
  BarChart3,
  Link as LinkIcon,
  Globe,
  RefreshCw,
  Download,
  Layers,
} from 'lucide-react';
import {
  matchZipDatasetsWithGemini,
  validateZipFiles,
  type TrackName,
  type GeminiMatchingResponse,
  type AnalysisProgress,
  TRACK_NAMES,
} from '@/api/geminiZipMatcher';
import { Progress } from '@/components/ui/progress';

export function GeminiZipMatcher() {
  const [zipFiles, setZipFiles] = useState<Map<TrackName, File>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<GeminiMatchingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enableGrounding, setEnableGrounding] = useState(true);
  const [selectedModel, setSelectedModel] = useState<'flash' | 'flashStable' | 'pro' | 'proLatest'>('flashStable');
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const [useCache, setUseCache] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: File[]) => {
    const validation = validateZipFiles(files);

    if (validation.valid) {
      setZipFiles(validation.mapped);
      setError(null);
    } else {
      const errorMessages: string[] = [];
      if (validation.missing.length > 0) {
        errorMessages.push(`Missing tracks: ${validation.missing.join(', ')}`);
      }
      if (validation.extra.length > 0) {
        errorMessages.push(`Unrecognized files: ${validation.extra.join(', ')}`);
      }
      setError(errorMessages.join('\n'));
      // Still set the mapped files if some are valid
      if (validation.mapped.size > 0) {
        setZipFiles(validation.mapped);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.name.toLowerCase().endsWith('.zip')
    );
    
    if (files.length > 0) {
      processFiles(files);
    } else {
      setError('Please drop zip files only');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAnalyze = async () => {
    if (zipFiles.size === 0) {
      setError('Please upload zip files for all 7 tracks');
      return;
    }

    if (zipFiles.size < TRACK_NAMES.length) {
      setError(`Please upload zip files for all ${TRACK_NAMES.length} tracks. Currently have ${zipFiles.size}.`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    setProgress({
      stage: 'preparing',
      progress: 0,
      message: 'Initializing analysis...',
    });

    try {
      const response = await matchZipDatasetsWithGemini(zipFiles, {
        model: selectedModel,
        enableGrounding,
        temperature: 0.3,
        maxOutputTokens: 8000,
        useCache,
        onProgress: (progressUpdate) => {
          setProgress(progressUpdate);
        },
      });
      setResults(response);
      setProgress(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze datasets';
      setError(errorMessage);
      setProgress(null);
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removeFile = (track: TrackName) => {
    const newMap = new Map(zipFiles);
    newMap.delete(track);
    setZipFiles(newMap);
  };

  const getTrackDisplayName = (track: TrackName): string => {
    const names: Record<TrackName, string> = {
      barber: 'Barber Motorsports Park',
      cota: 'Circuit of the Americas',
      indianapolis: 'Indianapolis Motor Speedway',
      road_america: 'Road America',
      sebring: 'Sebring International Raceway',
      sonoma: 'Sonoma Raceway',
      vir: 'Virginia International Raceway',
    };
    return names[track] || track;
  };

  const allTracksUploaded = zipFiles.size === TRACK_NAMES.length;

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
                <CardTitle className="text-2xl">Gemini Cloud - 7 Zip Datasets Matcher</CardTitle>
                <CardDescription>
                  Upload and match race data from all 7 tracks using Gemini AI
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !allTracksUploaded}
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
                  Match Datasets
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Model Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Label className="text-sm font-medium">Gemini Model:</Label>
              <div className="flex gap-2 flex-wrap">
                {([
                  { key: 'flashStable' as const, label: 'Flash 2.0 Stable', badge: 'Fast', context: '8K tokens' },
                  { key: 'flash' as const, label: 'Flash 2.0 Exp', badge: 'Latest', context: '8K tokens' },
                  { key: 'pro' as const, label: 'Pro 1.5', badge: '1M+ tokens', context: 'Massive context' },
                  { key: 'proLatest' as const, label: 'Pro Latest', badge: '1M+ tokens', context: 'Massive context' },
                ]).map(({ key, label, badge, context }) => (
                  <div key={key} className="relative">
                    <Button
                      variant={selectedModel === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedModel(key)}
                      className="flex items-center gap-2"
                    >
                      {label}
                      {(key === 'pro' || key === 'proLatest') && (
                        <span className="px-1.5 py-0.5 text-xs bg-primary/20 rounded">
                          {badge}
                        </span>
                      )}
                    </Button>
                    {selectedModel === key && (key === 'pro' || key === 'proLatest') && (
                      <div className="absolute top-full left-0 mt-1 p-2 bg-primary/10 rounded text-xs text-primary border border-primary/20 whitespace-nowrap z-10">
                        💡 Perfect for analyzing all 7 track datasets in one context window
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {(selectedModel === 'pro' || selectedModel === 'proLatest') && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start gap-2">
                  <Layers className="w-4 h-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-primary">1M+ Token Context Window</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Gemini Pro can process up to 1,000,000+ tokens in a single context window - 
                      8x larger than OpenAI's 128K limit. Perfect for analyzing large datasets across all 7 tracks simultaneously.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grounding Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <Label className="text-sm font-medium">Google Search Grounding</Label>
              <p className="text-xs text-muted-foreground">
                Enable real-time web search for enhanced matching accuracy
              </p>
            </div>
            <Switch
              checked={enableGrounding}
              onCheckedChange={setEnableGrounding}
            />
          </div>

          {/* Cache Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-sm font-medium">Use Cache</Label>
              <p className="text-xs text-muted-foreground">
                Cache analysis results for faster repeated analyses
              </p>
            </div>
            <Switch
              checked={useCache}
              onCheckedChange={setUseCache}
            />
          </div>
        </CardContent>
      </Card>

      {/* Progress Card */}
      {progress && isAnalyzing && (
        <Card className="border-primary/30">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize">{progress.stage}</span>
                <span className="text-muted-foreground">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
              <p className="text-sm text-muted-foreground">{progress.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="w-5 h-5" />
            Upload Zip Files (7 Tracks Required)
          </CardTitle>
          <CardDescription>
            Upload zip files for all 7 race tracks. Files should be named to include track names.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Input with Drag & Drop */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Click to select or drag and drop zip files
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload zip files for all 7 race tracks
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Browse Files
                </Button>
              </div>
            </div>

            {/* Track Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {TRACK_NAMES.map((track) => {
                const file = zipFiles.get(track);
                const isUploaded = !!file;
                
                return (
                  <motion.div
                    key={track}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isUploaded
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : 'border-dashed border-muted-foreground/30 bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isUploaded ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">
                            {getTrackDisplayName(track)}
                          </span>
                        </div>
                        {file && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {file.name}
                          </p>
                        )}
                        {file && (
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                      {isUploaded && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(track)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Upload Status */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {zipFiles.size} of {TRACK_NAMES.length} tracks uploaded
              </span>
              {allTracksUploaded && (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Ready to analyze
                </span>
              )}
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
                <p className="font-semibold">Error</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State (fallback if no progress) */}
      {isAnalyzing && !progress && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-lg font-semibold">Matching Datasets with Gemini...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Analyzing {zipFiles.size} zip files across 7 race tracks
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && !isAnalyzing && (
        <div className="space-y-4">
          {/* Summary Card */}
          <Card className="bg-card/60 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Matching Analysis Summary
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{results.confidence}% confidence</span>
                  {results.metadata?.processingTime && (
                    <>
                      <span>•</span>
                      <span>{(results.metadata.processingTime / 1000).toFixed(1)}s</span>
                    </>
                  )}
                  {results.metadata?.tokensUsed && (
                    <>
                      <span>•</span>
                      <span>{results.metadata.tokensUsed.toLocaleString()} tokens</span>
                    </>
                  )}
                  {results.citations && results.citations.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />
                        {results.citations.length} sources
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{results.summary}</p>
              
              {/* Citations */}
              {results.citations && results.citations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Sources & Citations
                  </h4>
                  <div className="space-y-2">
                    {results.citations.map((citation, index) => (
                      <a
                        key={index}
                        href={citation.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-xs text-primary hover:underline p-2 rounded bg-accent/50"
                      >
                        <Globe className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{citation.title}</div>
                          <div className="text-muted-foreground truncate">{citation.uri}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dataset Matches */}
          {results.matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Track-to-Track Matches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.matches.map((match, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-lg border border-border bg-accent/30"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {getTrackDisplayName(match.track1)}
                          </span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="font-semibold">
                            {getTrackDisplayName(match.track2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {match.similarityScore}% similar
                          </span>
                          <div
                            className={`w-16 h-2 rounded-full ${
                              match.similarityScore >= 80
                                ? 'bg-green-500'
                                : match.similarityScore >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${match.similarityScore}%` }}
                          />
                        </div>
                      </div>
                      
                      {match.matchingFields.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Matching Fields:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {match.matchingFields.map((field, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 rounded border border-green-300 dark:border-green-700"
                              >
                                {field}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {match.differences.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Differences:
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {match.differences.map((diff, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-orange-500">•</span>
                                <span>{diff}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {match.insights.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Insights:
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {match.insights.map((insight, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-blue-500">•</span>
                                <span>{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cross-Track Insights */}
          {results.crossTrackInsights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Cross-Track Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.crossTrackInsights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20"
                    >
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm flex-1">{insight}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Patterns */}
          {(results.patterns.common.length > 0 ||
            results.patterns.unique.length > 0 ||
            results.patterns.anomalies.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Data Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.patterns.common.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-green-600">
                        Common Patterns
                      </h4>
                      <ul className="space-y-2">
                        {results.patterns.common.map((pattern, index) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results.patterns.unique.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-blue-600">
                        Unique Characteristics
                      </h4>
                      <ul className="space-y-2">
                        {results.patterns.unique.map((unique, index) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{unique}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results.patterns.anomalies.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-orange-600">
                        Anomalies Detected
                      </h4>
                      <ul className="space-y-2">
                        {results.patterns.anomalies.map((anomaly, index) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span>{anomaly}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {results.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-accent/50 border border-border/30"
                    >
                      <TrendingUp className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm flex-1">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Re-analyze
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

