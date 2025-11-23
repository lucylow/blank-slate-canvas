// src/components/AIDataAnalytics.tsx
// AI-powered data analytics component emphasizing OpenAI and Gemini for race data analysis

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
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
  Upload,
  Video,
  Image as ImageIcon,
  Link as LinkIcon,
  Globe,
  FileText,
  X,
} from 'lucide-react';
import { useAIAnalytics, useRealTimeAIAnalytics, useAnalyzeRaceData } from '@/hooks/useAIAnalytics';
import type { RaceDataAnalytics, GeminiOptions } from '@/api/aiAnalytics';
import {
  analyzeRaceDataWithVideo,
  analyzeRaceDataWithImages,
  analyzeRaceDataWithGrounding,
  analyzeRaceDataWithURLs,
} from '@/api/aiAnalytics';
import { useDemoMode } from '@/hooks/useDemoMode';
import { shouldUseMockData } from '@/lib/geminiMockData';

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
  const [selectedModel, setSelectedModel] = useState<'openai' | 'gemini' | 'both'>('gemini');
  
  // Gemini-specific features
  const [geminiModel, setGeminiModel] = useState<'flash' | 'flashStable' | 'pro' | 'proLatest'>('flashStable');
  const [enableGrounding, setEnableGrounding] = useState(false);
  const [groundingQueries, setGroundingQueries] = useState<string>('');
  const [urlContext, setUrlContext] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [geminiResult, setGeminiResult] = useState<import('@/api/aiAnalytics').AIAnalyticsResponse | null>(null);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const { isDemoMode } = useDemoMode();
  const isUsingMockData = shouldUseMockData();

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

  const currentData = geminiResult || realtimeData || analysisData;
  const isLoading = realtimeLoading || isAnalyzing;
  const error = realtimeError || analysisError;

  const handleAnalyze = async () => {
    if (!raceData && (!track || !race)) return;

    const baseData: RaceDataAnalytics = raceData || {
      track: track || '',
      race: race || 0,
      vehicle,
      lap,
    };

    const geminiOptions: GeminiOptions = {
      model: geminiModel,
      enableGrounding,
      groundingQueries: groundingQueries.split('\n').filter(q => q.trim()),
      urlContext,
      temperature: 0.3,
      maxOutputTokens: 4000,
    };

    try {
      // Use Gemini-specific features if Gemini is selected and has multimodal input
      if (selectedModel === 'gemini' || selectedModel === 'both') {
        // Video analysis
        if (uploadedVideo) {
          const result = await analyzeRaceDataWithVideo(
            baseData,
            uploadedVideo,
            analysisType,
            geminiOptions
          );
          setGeminiResult(result);
          return;
        }
        
        // Image analysis
        if (uploadedImages.length > 0) {
          const result = await analyzeRaceDataWithImages(
            baseData,
            uploadedImages,
            analysisType,
            geminiOptions
          );
          setGeminiResult(result);
          return;
        }
        
        // Grounding
        if (enableGrounding) {
          const result = await analyzeRaceDataWithGrounding(
            baseData,
            analysisType,
            groundingQueries.split('\n').filter(q => q.trim()),
            geminiOptions
          );
          setGeminiResult(result);
          return;
        }
        
        // URL context
        if (urlContext && urls.length > 0) {
          const result = await analyzeRaceDataWithURLs(
            { ...baseData, urls },
            urls,
            analysisType,
            geminiOptions
          );
          setGeminiResult(result);
          return;
        }
      }
      
      // Clear Gemini result if using standard analysis
      setGeminiResult(null);

      // Standard analysis
      if (raceData) {
        await analyzeAsync({
          data: raceData,
          analysisType,
          model: selectedModel,
          geminiOptions: selectedModel !== 'openai' ? geminiOptions : undefined,
        });
      } else if (track && race) {
        refetchRealtime();
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedImages([...uploadedImages, ...files]);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedVideo(e.target.files[0]);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const addUrl = () => {
    if (urlInput.trim() && !urls.includes(urlInput.trim())) {
      setUrls([...urls, urlInput.trim()]);
      setUrlInput('');
    }
  };

  const removeUrl = (index: number) => {
    setUrls(urls.filter((_, i) => i !== index));
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
                <CardTitle className="text-2xl flex items-center gap-2">
                  AI Data Analytics
                  {(isDemoMode || isUsingMockData) && (
                    <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded border border-yellow-500/30">
                      Demo Mode
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Powered by OpenAI & Gemini for advanced race data analysis
                  {(isDemoMode || isUsingMockData) && (
                    <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                      (Using mock data fallback)
                    </span>
                  )}
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
          <div className="flex items-center gap-4 mb-4">
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
                  {model === 'openai' ? 'OpenAI GPT-4' : model === 'gemini' ? 'Gemini 2.0 Flash' : 'Both'}
                </Button>
              ))}
            </div>
          </div>

          {/* Gemini-Specific Options */}
          {(selectedModel === 'gemini' || selectedModel === 'both') && (
            <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Gemini Advanced Features</Label>
              </div>

              {/* Model Selection */}
              <div className="flex items-center gap-4">
                <Label className="text-sm">Gemini Model:</Label>
                <div className="flex gap-2">
                  {([
                    { key: 'flashStable', label: 'Flash 2.0' },
                    { key: 'flash', label: 'Flash Exp' },
                    { key: 'pro', label: 'Pro 1.5' },
                    { key: 'proLatest', label: 'Pro Latest' },
                  ] as const).map(({ key, label }) => (
                    <Button
                      key={key}
                      variant={geminiModel === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGeminiModel(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Multimodal Uploads */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Multimodal Input (Gemini Exclusive)</Label>
                
                {/* Image Upload */}
                <div>
                  <Input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full justify-start"
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Upload Images ({uploadedImages.length})
                  </Button>
                  {uploadedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {uploadedImages.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-2 py-1 bg-accent rounded text-sm"
                        >
                          <FileText className="w-3 h-3" />
                          <span className="truncate max-w-[100px]">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImage(index)}
                            className="h-4 w-4 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video Upload */}
                <div>
                  <Input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full justify-start"
                    disabled={!!uploadedVideo}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {uploadedVideo ? `Video: ${uploadedVideo.name}` : 'Upload Video'}
                  </Button>
                  {uploadedVideo && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedVideo(null)}
                      className="mt-2"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove Video
                    </Button>
                  )}
                </div>
              </div>

              {/* Grounding */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-sm font-medium">Google Search Grounding</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable real-time web search for latest race data
                  </p>
                </div>
                <Switch
                  checked={enableGrounding}
                  onCheckedChange={setEnableGrounding}
                />
              </div>
              {enableGrounding && (
                <div>
                  <Label className="text-sm">Search Queries (one per line):</Label>
                  <textarea
                    value={groundingQueries}
                    onChange={(e) => setGroundingQueries(e.target.value)}
                    placeholder="GR Cup race results&#10;Track information&#10;Weather data"
                    className="w-full mt-1 p-2 text-sm border rounded-md resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* URL Context */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-sm font-medium">URL Context Retrieval</Label>
                  <p className="text-xs text-muted-foreground">
                    Fetch content from URLs for context
                  </p>
                </div>
                <Switch
                  checked={urlContext}
                  onCheckedChange={setUrlContext}
                />
              </div>
              {urlContext && (
                <div>
                  <div className="flex gap-2 mb-2">
                    <Input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/race-data"
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addUrl()}
                    />
                    <Button type="button" size="sm" onClick={addUrl}>
                      <LinkIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  {urls.length > 0 && (
                    <div className="space-y-1">
                      {urls.map((url, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-accent rounded text-sm"
                        >
                          <Globe className="w-3 h-3 mr-2" />
                          <span className="flex-1 truncate">{url}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUrl(index)}
                            className="h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
                  {(isDemoMode || isUsingMockData) && (
                    <>
                      <span>•</span>
                      <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded border border-yellow-500/30">
                        Mock Data
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>{currentData.confidence}% confidence</span>
                  {currentData.citations && currentData.citations.length > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" />
                        {currentData.citations.length} sources
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">{currentData.summary}</p>
              
              {/* Citations */}
              {currentData.citations && currentData.citations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    Sources & Citations
                  </h4>
                  <div className="space-y-2">
                    {currentData.citations.map((citation, index) => (
                      <a
                        key={index}
                        href={citation.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-xs text-primary hover:underline p-2 rounded bg-accent/50"
                      >
                        <Globe className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{citation.title || citation.uri}</div>
                          <div className="text-muted-foreground truncate">{citation.uri}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Grounding Metadata */}
              {currentData.groundingMetadata && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold mb-2">Grounding Information</h4>
                  {currentData.groundingMetadata.searchQueries && currentData.groundingMetadata.searchQueries.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground mb-1">Search Queries Used:</p>
                      <div className="flex flex-wrap gap-2">
                        {currentData.groundingMetadata.searchQueries.map((query, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-primary/10 rounded border border-primary/20"
                          >
                            {query}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {currentData.groundingMetadata.groundingChunks && currentData.groundingMetadata.groundingChunks.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Retrieved {currentData.groundingMetadata.groundingChunks.length} context chunks
                      </p>
                    </div>
                  )}
                </div>
              )}
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

