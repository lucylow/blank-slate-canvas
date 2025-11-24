// src/api/aiAnalytics.ts
// AI-powered data analytics service using OpenAI and Gemini APIs
// Emphasizes AI for data analytics with race telemetry and performance data

import client from './client';
import {
  generateMockAIAnalyticsResponse,
  withMockFallback,
  shouldUseMockData,
} from '@/lib/geminiMockData';

// Get API keys from environment variables (Lovable secrets)
// In Lovable, secrets are exposed as environment variables with the secret name
// "OpenAI" secret -> import.meta.env.OPENAI
// "GEMINI" secret -> import.meta.env.GEMINI
const OPENAI_API_KEY = 
  import.meta.env.OPENAI ||
  import.meta.env.VITE_OPENAI_API_KEY || 
  import.meta.env.OPENAI_API_KEY ||
  (typeof window !== 'undefined' && (window as any).__OPENAI_API_KEY__) ||
  '';
const GEMINI_API_KEY = 
  import.meta.env.GEMINI ||
  import.meta.env.VITE_GEMINI_API_KEY || 
  import.meta.env.GEMINI_API_KEY ||
  '';

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Gemini API configuration - Updated to use latest models
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODELS = {
  flash: 'gemini-2.0-flash-exp', // Latest model with video/audio support
  flashStable: 'gemini-2.0-flash', // Stable Flash model
  pro: 'gemini-1.5-pro', // For large context (1M tokens)
  proLatest: 'gemini-1.5-pro-latest', // Latest Pro model
} as const;

export interface RaceDataAnalytics {
  track: string;
  race: number;
  vehicle?: number;
  lap?: number;
  telemetry?: Record<string, unknown>;
  performance?: Record<string, unknown>;
  tireData?: Record<string, unknown>;
  weather?: Record<string, unknown>;
  // Gemini-specific multimodal inputs
  images?: Array<{
    data: string; // Base64 encoded image
    mimeType: string;
  }>;
  video?: {
    data: string; // Base64 encoded video
    mimeType: string;
  };
  audio?: {
    data: string; // Base64 encoded audio
    mimeType: string;
  };
  urls?: string[]; // URLs for context retrieval
}

export interface GroundingMetadata {
  searchQueries?: string[];
  groundingChunks?: Array<{
    segment: string;
    confidenceScore?: number;
  }>;
}

export interface Citation {
  startIndex?: number;
  endIndex?: number;
  uri?: string;
  title?: string;
  license?: string;
}

export interface AIAnalyticsResponse {
  insights: string[];
  recommendations: string[];
  predictions: {
    tireWear?: string;
    lapTime?: string;
    pitWindow?: string;
    performance?: string;
  };
  patterns: {
    identified: string[];
    anomalies: string[];
    trends: string[];
  };
  summary: string;
  confidence: number;
  model: 'openai' | 'gemini';
  timestamp: string;
  // Gemini-specific response fields
  citations?: Citation[];
  groundingMetadata?: GroundingMetadata;
  functionCalls?: Array<{
    name: string;
    args: Record<string, any>;
  }>;
}

export interface GeminiOptions {
  model?: 'flash' | 'flashStable' | 'pro' | 'proLatest';
  enableGrounding?: boolean; // Enable Google Search grounding
  groundingQueries?: string[]; // Specific queries for grounding
  temperature?: number;
  maxOutputTokens?: number;
  enableStreaming?: boolean;
  functions?: GeminiFunction[]; // Function calling support
  urlContext?: boolean; // Enable URL context retrieval
}

export interface GeminiFunction {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AdvancedAnalyticsRequest {
  data: RaceDataAnalytics;
  analysisType: 'comprehensive' | 'tire' | 'performance' | 'strategy' | 'predictive';
  includeVisualizations?: boolean;
  model?: 'openai' | 'gemini' | 'both';
  geminiOptions?: GeminiOptions;
}

/**
 * Analyze race data using OpenAI API
 */
async function analyzeWithOpenAI(
  data: RaceDataAnalytics,
  analysisType: string
): Promise<AIAnalyticsResponse> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured. Please add "OpenAI" secret in Lovable.');
  }

  // Prepare comprehensive prompt for data analytics
  const prompt = buildAnalyticsPrompt(data, analysisType);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Using latest model for better analytics
        messages: [
          {
            role: 'system',
            content: `You are an expert motorsports data analyst specializing in race telemetry analysis, 
            performance optimization, and predictive analytics. Analyze the provided race data and provide 
            actionable insights, predictions, and recommendations based on statistical patterns and 
            performance metrics.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent analytics
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const analysisText = result.choices[0]?.message?.content || '';

    return parseAIResponse(analysisText, 'openai');
  } catch (error) {
    console.error('OpenAI analytics error:', error);
    throw error;
  }
}

/**
 * Convert file to base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Fetch URL content for context retrieval
 */
async function fetchURLContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return text.substring(0, 50000); // Limit to 50k chars
  } catch (error) {
    console.warn(`Failed to fetch URL content: ${url}`, error);
    return '';
  }
}

/**
 * Analyze race data using Gemini API with advanced features
 */
async function analyzeWithGemini(
  data: RaceDataAnalytics,
  analysisType: string,
  options: GeminiOptions = {}
): Promise<AIAnalyticsResponse> {
  // Check if we should use mock data
  if (shouldUseMockData() || !GEMINI_API_KEY) {
    console.info('[Gemini] Using mock data (no API key or demo mode)');
    return generateMockAIAnalyticsResponse(data, analysisType, {
      hasVideo: !!data.video,
      hasImages: !!(data.images && data.images.length > 0),
      hasGrounding: options.enableGrounding,
      hasURLs: !!(data.urls && data.urls.length > 0),
    });
  }

  const {
    model = 'flashStable',
    enableGrounding = false,
    groundingQueries = [],
    temperature = 0.3,
    maxOutputTokens = 4000,
    enableStreaming = false,
    functions = [],
    urlContext = false,
  } = options;

  const modelName = GEMINI_MODELS[model];
  const prompt = buildAnalyticsPrompt(data, analysisType);

  // Build multimodal parts
  const parts: any[] = [{ text: prompt }];

  // Add images if provided
  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    });
  }

  // Add video if provided
  if (data.video) {
    parts.push({
      inlineData: {
        mimeType: data.video.mimeType,
        data: data.video.data,
      },
    });
  }

  // Add audio if provided
  if (data.audio) {
    parts.push({
      inlineData: {
        mimeType: data.audio.mimeType,
        data: data.audio.data,
      },
    });
  }

  // Fetch URL contexts if enabled
  let urlContexts: string[] = [];
  if (urlContext && data.urls && data.urls.length > 0) {
    urlContexts = await Promise.all(
      data.urls.map((url) => fetchURLContent(url))
    );
    if (urlContexts.length > 0) {
      parts.push({
        text: `\n\nAdditional context from URLs:\n${urlContexts.join('\n\n')}`,
      });
    }
  }

  // Build request body
  const requestBody: any = {
    contents: [
      {
        parts,
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: 'application/json', // Request structured output
    },
  };

  // Add grounding if enabled
  if (enableGrounding) {
    requestBody.groundingConfig = {
      groundingChunkRetrievalConfig: {
        disableAttribution: false,
        maxChunks: 10,
        similarityTopK: 5,
      },
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: 'MODE_DYNAMIC',
          dynamicThreshold: 0.3,
        },
        queries: groundingQueries.length > 0 
          ? groundingQueries 
          : [
              `${data.track} race track information`,
              `GR Cup ${data.track} race results`,
              `F1 ${data.track} track data`,
            ],
      },
    };
  }

  // Add function calling if provided
  if (functions.length > 0) {
    requestBody.tools = [
      {
        functionDeclarations: functions.map((func) => ({
          name: func.name,
          description: func.description,
          parameters: func.parameters,
        })),
      },
    ];
  }

  // Build URL with API key (can use query param or X-goog-api-key header)
  const endpoint = enableStreaming ? 'streamGenerateContent' : 'generateContent';
  const url = `${GEMINI_BASE_URL}/models/${modelName}:${endpoint}?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY, // Also support header method
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    if (enableStreaming) {
      // Handle streaming response
      return await handleStreamingResponse(response, model);
    }

    const result = await response.json();
    
    // Extract text content
    const candidate = result.candidates?.[0];
    const contentParts = candidate?.content?.parts || [];
    
    let analysisText = '';
    const citations: Citation[] = [];
    const functionCalls: Array<{ name: string; args: Record<string, any> }> = [];

    // Process all parts
    for (const part of contentParts) {
      if (part.text) {
        analysisText += part.text;
      }
      
      // Extract function calls
      if (part.functionCall) {
        functionCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args || {},
        });
      }
    }

    // Extract grounding metadata and citations
    const groundingMetadata: GroundingMetadata = {};
    if (candidate?.groundingMetadata) {
      const gm = candidate.groundingMetadata;
      
      if (gm.groundingChunks) {
        groundingMetadata.groundingChunks = gm.groundingChunks.map((chunk: any) => ({
          segment: chunk.web?.uri || chunk.retrievedContext?.uri || '',
          confidenceScore: chunk.confidenceScore,
        }));
      }
      
      if (gm.webSearchQueries) {
        groundingMetadata.searchQueries = gm.webSearchQueries;
      }
    }

    // Extract citations from candidate
    if (candidate?.groundingMetadata?.groundingChunks) {
      candidate.groundingMetadata.groundingChunks.forEach((chunk: any, index: number) => {
        if (chunk.web) {
          citations.push({
            startIndex: index,
            endIndex: index + 1,
            uri: chunk.web.uri,
            title: chunk.web.title,
          });
        }
      });
    }

    // Parse response
    const parsedResponse = parseAIResponse(analysisText || JSON.stringify(result), 'gemini');
    
    // Add Gemini-specific metadata
    return {
      ...parsedResponse,
      citations: citations.length > 0 ? citations : undefined,
      groundingMetadata: Object.keys(groundingMetadata).length > 0 ? groundingMetadata : undefined,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    };
  } catch (error) {
    console.error('Gemini analytics error:', error);
    // Fallback to mock data on error (already handled in catch, but keep for safety)
    console.warn('[Gemini] Falling back to mock data due to API error');
    return generateMockAIAnalyticsResponse(data, analysisType, {
      hasVideo: !!data.video,
      hasImages: !!(data.images && data.images.length > 0),
      hasGrounding: options.enableGrounding,
      hasURLs: !!(data.urls && data.urls.length > 0),
    });
  }
}

/**
 * Handle streaming response from Gemini API
 */
async function handleStreamingResponse(
  response: Response,
  model: string
): Promise<AIAnalyticsResponse> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  const citations: Citation[] = [];

  if (!reader) {
    throw new Error('No response body reader available');
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);
            const candidate = json.candidates?.[0];
            if (candidate?.content?.parts) {
              for (const part of candidate.content.parts) {
                if (part.text) {
                  fullText += part.text;
                }
                
                // Collect citations from streaming
                if (candidate.groundingMetadata?.groundingChunks) {
                  candidate.groundingMetadata.groundingChunks.forEach((chunk: any) => {
                    if (chunk.web && !citations.find(c => c.uri === chunk.web.uri)) {
                      citations.push({
                        uri: chunk.web.uri,
                        title: chunk.web.title,
                      });
                    }
                  });
                }
              }
            }
          } catch (e) {
            // Skip invalid JSON chunks
            continue;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const parsedResponse = parseAIResponse(fullText, 'gemini');
  return {
    ...parsedResponse,
    citations: citations.length > 0 ? citations : undefined,
  };
}

/**
 * Build comprehensive analytics prompt for AI models
 */
function buildAnalyticsPrompt(data: RaceDataAnalytics, analysisType: string): string {
  const hasMultimodal = data.images?.length || data.video || data.audio;
  const multimodalContext = hasMultimodal 
    ? `\n\nMULTIMODAL CONTEXT: This analysis includes images, video, or audio data. Please analyze these media files in conjunction with the telemetry data to provide comprehensive insights.`
    : '';

  // Check if multi-track data is available
  const tireData = data.tireData || {};
  const hasMultiTrackData = tireData.cross_track_patterns && Array.isArray(tireData.cross_track_patterns) && tireData.cross_track_patterns.length > 0;
  const tracksAnalyzed = tireData.tracks_analyzed || 1;
  
  const multiTrackContext = hasMultiTrackData 
    ? `\n\nMULTI-TRACK ANALYSIS CONTEXT: This analysis includes data from ${tracksAnalyzed} different race tracks (${tireData.cross_track_patterns?.map((p: any) => p.track).join(', ')}). 
    
    CRITICAL INSTRUCTIONS FOR MULTI-TRACK ANALYSIS:
    1. Compare patterns across all ${tracksAnalyzed} tracks to identify universal vs track-specific behaviors
    2. Use cross-track historical data to improve prediction accuracy for the primary track (${data.track})
    3. Identify transferable insights: What works well across multiple tracks?
    4. Detect track-specific anomalies: What's unique about ${data.track} compared to other tracks?
    5. Leverage ensemble predictions: Combine insights from all tracks for more robust forecasts
    6. Cross-validate predictions: Use patterns from similar tracks to validate primary track predictions
    
    CROSS-TRACK DATA AVAILABLE:
    ${JSON.stringify(tireData.cross_track_patterns?.slice(0, 5), null, 2)}
    
    Use this multi-track context to provide more accurate and robust predictions by learning from patterns across all ${tracksAnalyzed} datasets.`
    : '';

  const basePrompt = `You are an expert motorsports data analyst specializing in race telemetry analysis, performance optimization, and predictive analytics.

Analyze the following race data and provide comprehensive data analytics insights:

PRIMARY TRACK: ${data.track}
RACE: ${data.race}
${data.vehicle ? `VEHICLE: ${data.vehicle}` : ''}
${data.lap ? `LAP: ${data.lap}` : ''}
${hasMultiTrackData ? `\nMULTI-TRACK ANALYSIS: Using data from ${tracksAnalyzed} tracks for enhanced predictions` : ''}

PRIMARY TRACK TELEMETRY DATA:
${JSON.stringify(data.telemetry || {}, null, 2)}

PRIMARY TRACK PERFORMANCE DATA:
${JSON.stringify(data.performance || {}, null, 2)}

TIRE DATA:
${JSON.stringify(data.tireData || {}, null, 2)}

${data.weather ? `WEATHER DATA:\n${JSON.stringify(data.weather, null, 2)}` : ''}
${multimodalContext}
${multiTrackContext}

ANALYSIS TYPE: ${analysisType}
${hasMultiTrackData ? '\nENHANCED ANALYSIS MODE: Multi-track cross-validation enabled - use patterns from all tracks to improve prediction accuracy' : ''}

Please provide:
1. KEY INSIGHTS: List 5-7 actionable insights from the data${hasMultimodal ? ' (including observations from media files)' : ''}${hasMultiTrackData ? ' (leveraging cross-track patterns)' : ''}
2. RECOMMENDATIONS: Provide 3-5 strategic recommendations${hasMultiTrackData ? ' based on successful strategies across multiple tracks' : ''}
3. PREDICTIONS: Forecast tire wear, lap times, pit windows, and performance trends${hasMultiTrackData ? ' using ensemble methods across all tracks' : ''}
4. PATTERNS: Identify data patterns, anomalies, and trends${hasMultiTrackData ? ' (including cross-track patterns and track-specific behaviors)' : ''}
5. SUMMARY: A concise executive summary of the analysis${hasMultiTrackData ? ' highlighting how multi-track data improved predictions' : ''}
6. CONFIDENCE: A confidence score (0-100) for the analysis${hasMultiTrackData ? ' (higher confidence expected due to cross-track validation)' : ''}

${hasMultiTrackData ? `\nSPECIAL FOCUS: 
- Compare ${data.track} performance against patterns from other tracks
- Identify which predictions are validated by cross-track data
- Highlight track-specific vs universal patterns
- Provide ensemble predictions that combine insights from all ${tracksAnalyzed} tracks` : ''}

Format your response as JSON with the following structure:
{
  "insights": ["insight1", "insight2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "predictions": {
    "tireWear": "prediction text",
    "lapTime": "prediction text",
    "pitWindow": "prediction text",
    "performance": "prediction text"
  },
  "patterns": {
    "identified": ["pattern1", "pattern2", ...],
    "anomalies": ["anomaly1", ...],
    "trends": ["trend1", "trend2", ...]
  },
  "summary": "executive summary text",
  "confidence": 85
}`;

  return basePrompt;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(text: string, model: 'openai' | 'gemini'): AIAnalyticsResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ...parsed,
        model,
        timestamp: new Date().toISOString(),
        confidence: parsed.confidence || 75,
      };
    }
  } catch (error) {
    console.warn('Failed to parse AI response as JSON, using fallback', error);
  }

  // Fallback: extract insights from text
  const insights = extractListItems(text, 'insights', 'INSIGHTS');
  const recommendations = extractListItems(text, 'recommendations', 'RECOMMENDATIONS');
  const patterns = {
    identified: extractListItems(text, 'patterns', 'PATTERNS'),
    anomalies: extractListItems(text, 'anomalies', 'ANOMALIES'),
    trends: extractListItems(text, 'trends', 'TRENDS'),
  };

  return {
    insights,
    recommendations,
    predictions: {
      tireWear: extractSection(text, 'tire wear', 'tire'),
      lapTime: extractSection(text, 'lap time', 'lap'),
      pitWindow: extractSection(text, 'pit window', 'pit'),
      performance: extractSection(text, 'performance', 'performance'),
    },
    patterns,
    summary: extractSummary(text),
    confidence: 70,
    model,
    timestamp: new Date().toISOString(),
  };
}

function extractListItems(text: string, ...keywords: string[]): string[] {
  const items: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[\\s:]*[\\n]*([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      const section = match[1];
      const lines = section.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        const cleaned = line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
        if (cleaned.length > 10) {
          items.push(cleaned);
        }
      });
    }
  }
  
  return items.slice(0, 7); // Limit to 7 items
}

function extractSection(text: string, ...keywords: string[]): string {
  for (const keyword of keywords) {
    const regex = new RegExp(`${keyword}[\\s:]*[\\n]*([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
    const match = text.match(regex);
    if (match && match[1].trim().length > 20) {
      return match[1].trim().substring(0, 300);
    }
  }
  return '';
}

function extractSummary(text: string): string {
  const summaryMatch = text.match(/summary[\\s:]*[\\n]*([\\s\\S]*?)(?=\\n\\n|$)/i);
  if (summaryMatch) {
    return summaryMatch[1].trim().substring(0, 500);
  }
  // Fallback: use first paragraph
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 50);
  return paragraphs[0]?.trim().substring(0, 500) || 'Analysis completed';
}

/**
 * Main function to perform advanced AI analytics
 * Tries OpenAI first, then falls back to Gemini if OpenAI is unavailable or fails
 */
export async function performAIAnalytics(
  request: AdvancedAnalyticsRequest
): Promise<AIAnalyticsResponse> {
  const { data, analysisType, model = 'openai', geminiOptions = {} } = request;

  try {
    if (model === 'both') {
      // Use both models and combine results
      const [openaiResult, geminiResult] = await Promise.allSettled([
        analyzeWithOpenAI(data, analysisType),
        analyzeWithGemini(data, analysisType, geminiOptions),
      ]);

      const results: AIAnalyticsResponse[] = [];
      if (openaiResult.status === 'fulfilled') {
        results.push(openaiResult.value);
      }
      if (geminiResult.status === 'fulfilled') {
        results.push(geminiResult.value);
      }

      if (results.length === 0) {
        throw new Error('Both AI models failed to analyze data');
      }

      // Combine results
      return combineAnalyticsResults(results);
    } else if (model === 'gemini') {
      return analyzeWithGemini(data, analysisType, geminiOptions);
    } else {
      // Default: try OpenAI first, fallback to Gemini if OpenAI fails or is unavailable
      if (OPENAI_API_KEY) {
        try {
          return await analyzeWithOpenAI(data, analysisType);
        } catch (openaiError) {
          console.warn('OpenAI analysis failed, falling back to Gemini:', openaiError);
          // Fallback to Gemini if available
          if (GEMINI_API_KEY) {
            return await analyzeWithGemini(data, analysisType, geminiOptions);
          }
          // If Gemini is also not available, throw the original OpenAI error
          throw openaiError;
        }
      } else if (GEMINI_API_KEY) {
        // OpenAI not available, but Gemini is - use Gemini
        console.info('OpenAI not configured, using Gemini');
        return await analyzeWithGemini(data, analysisType, geminiOptions);
      } else {
        throw new Error('No AI API keys configured. Please add "OpenAI" or "GEMINI" secret in Lovable.');
      }
    }
  } catch (error) {
    console.error('AI Analytics error:', error);
    throw error;
  }
}

/**
 * Combine multiple AI analytics results
 */
function combineAnalyticsResults(results: AIAnalyticsResponse[]): AIAnalyticsResponse {
  const combined: AIAnalyticsResponse = {
    insights: [],
    recommendations: [],
    predictions: {
      tireWear: '',
      lapTime: '',
      pitWindow: '',
      performance: '',
    },
    patterns: {
      identified: [],
      anomalies: [],
      trends: [],
    },
    summary: '',
    confidence: 0,
    model: 'openai',
    timestamp: new Date().toISOString(),
  };

  // Aggregate insights and recommendations (deduplicate)
  const insightsSet = new Set<string>();
  const recommendationsSet = new Set<string>();
  const patternsSet = new Set<string>();
  const anomaliesSet = new Set<string>();
  const trendsSet = new Set<string>();

  let totalConfidence = 0;

  results.forEach(result => {
    result.insights.forEach(i => insightsSet.add(i));
    result.recommendations.forEach(r => recommendationsSet.add(r));
    result.patterns.identified.forEach(p => patternsSet.add(p));
    result.patterns.anomalies.forEach(a => anomaliesSet.add(a));
    result.patterns.trends.forEach(t => trendsSet.add(t));
    totalConfidence += result.confidence;
  });

  combined.insights = Array.from(insightsSet).slice(0, 10);
  combined.recommendations = Array.from(recommendationsSet).slice(0, 7);
  combined.patterns.identified = Array.from(patternsSet).slice(0, 5);
  combined.patterns.anomalies = Array.from(anomaliesSet).slice(0, 5);
  combined.patterns.trends = Array.from(trendsSet).slice(0, 5);
  combined.confidence = Math.round(totalConfidence / results.length);
  combined.summary = results.map(r => r.summary).join('\n\n').substring(0, 500);
  
  // Combine predictions
  const predictions = results.map(r => r.predictions).filter(p => p);
  if (predictions.length > 0) {
    combined.predictions = {
      tireWear: predictions.map(p => p.tireWear).filter(Boolean).join(' ').substring(0, 200),
      lapTime: predictions.map(p => p.lapTime).filter(Boolean).join(' ').substring(0, 200),
      pitWindow: predictions.map(p => p.pitWindow).filter(Boolean).join(' ').substring(0, 200),
      performance: predictions.map(p => p.performance).filter(Boolean).join(' ').substring(0, 200),
    };
  }

  combined.model = 'openai'; // Indicates combined

  return combined;
}

/**
 * Get real-time analytics for live race data
 */
export async function getRealTimeAIAnalytics(
  track: string,
  race: number,
  vehicle?: number,
  lap?: number
): Promise<AIAnalyticsResponse> {
  // First, fetch the actual race data
  try {
    const dashboardData = await client.get('/api/dashboard/live', {
      params: { track, race, vehicle, lap }
    });

    const raceData: RaceDataAnalytics = {
      track,
      race,
      vehicle,
      lap,
      telemetry: dashboardData.data as Record<string, unknown>,
      performance: dashboardData.data as Record<string, unknown>,
    };

    return performAIAnalytics({
      data: raceData,
      analysisType: 'comprehensive',
      model: 'openai', // Will try OpenAI first, fallback to Gemini if needed
    });
  } catch (error) {
    console.error('Error fetching race data for AI analytics:', error);
    throw error;
  }
}

/**
 * All 7 track datasets for multi-track analysis
 */
export const ALL_TRACKS = [
  'barber',
  'cota',
  'indianapolis',
  'road_america',
  'sebring',
  'sonoma',
  'vir'
] as const;

/**
 * Fetch dashboard data from multiple tracks in parallel
 */
async function fetchMultiTrackData(
  tracks: string[],
  race: number,
  vehicle?: number,
  lap?: number
): Promise<Array<{ track: string; data: any; error?: string }>> {
  const fetchPromises = tracks.map(async (track) => {
    try {
      const dashboardData = await client.get('/api/dashboard/live', {
        params: { track, race, vehicle, lap }
      });
      return {
        track,
        data: dashboardData.data,
      };
    } catch (error) {
      console.warn(`Failed to fetch data for track ${track}:`, error);
      return {
        track,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  return Promise.all(fetchPromises);
}

/**
 * Get real-time analytics using data from all 7 datasets for enhanced predictions
 * This leverages cross-track patterns and historical data from all tracks
 */
export async function getRealTimeAIAnalyticsMultiTrack(
  primaryTrack: string,
  race: number,
  vehicle?: number,
  lap?: number,
  options?: {
    includeAllTracks?: boolean;
    tracks?: string[];
    model?: 'openai' | 'gemini' | 'both';
    geminiOptions?: GeminiOptions;
  }
): Promise<AIAnalyticsResponse> {
  const {
    includeAllTracks = true,
    tracks = includeAllTracks ? [...ALL_TRACKS] : [primaryTrack],
    model = 'openai',
    geminiOptions = {},
  } = options || {};

  try {
    // Fetch data from all tracks in parallel
    const multiTrackData = await fetchMultiTrackData(tracks, race, vehicle, lap);
    
    // Separate primary track data from other tracks
    const primaryData = multiTrackData.find(d => d.track === primaryTrack);
    const otherTracksData = multiTrackData.filter(d => d.track !== primaryTrack && !d.error);

    // Build comprehensive race data with multi-track context
    const raceData: RaceDataAnalytics = {
      track: primaryTrack,
      race,
      vehicle,
      lap,
      telemetry: primaryData?.data as Record<string, unknown> || {},
      performance: primaryData?.data as Record<string, unknown> || {},
      // Include multi-track context for cross-track analysis
      tireData: {
        primary_track: primaryData?.data,
        cross_track_patterns: otherTracksData.map(d => ({
          track: d.track,
          data: d.data,
        })),
        tracks_analyzed: multiTrackData.length,
        successful_fetches: multiTrackData.filter(d => !d.error).length,
      },
    };

    // Use enhanced prompt that leverages multi-track data
    return performAIAnalytics({
      data: raceData,
      analysisType: 'predictive', // Use predictive for cross-track learning
      model,
      geminiOptions: {
        ...geminiOptions,
        enableGrounding: true, // Enable grounding for better context
        groundingQueries: [
          `${primaryTrack} race track characteristics`,
          `GR Cup ${primaryTrack} vs other tracks comparison`,
          `cross-track tire wear patterns`,
          `multi-track race strategy optimization`,
        ],
      },
    });
  } catch (error) {
    console.error('Error fetching multi-track data for AI analytics:', error);
    // Fallback to single-track analysis
    return getRealTimeAIAnalytics(primaryTrack, race, vehicle, lap);
  }
}

/**
 * Analyze specific aspect of race data
 */
export async function analyzeRaceData(
  data: RaceDataAnalytics,
  analysisType: 'comprehensive' | 'tire' | 'performance' | 'strategy' | 'predictive' = 'comprehensive',
  model: 'openai' | 'gemini' | 'both' = 'openai',
  geminiOptions?: GeminiOptions
): Promise<AIAnalyticsResponse> {
  return performAIAnalytics({
    data,
    analysisType,
    model,
    geminiOptions,
  });
}

/**
 * Analyze race data with video input (Gemini-specific)
 */
export async function analyzeRaceDataWithVideo(
  data: RaceDataAnalytics,
  videoFile: File,
  analysisType: 'comprehensive' | 'tire' | 'performance' | 'strategy' | 'predictive' = 'comprehensive',
  options: GeminiOptions = {}
): Promise<AIAnalyticsResponse> {
  return withMockFallback(
    async () => {
      const videoBase64 = await fileToBase64(videoFile);
      const mimeType = videoFile.type || 'video/mp4';
      
      const enhancedData: RaceDataAnalytics = {
        ...data,
        video: {
          data: videoBase64,
          mimeType,
        },
      };

      return performAIAnalytics({
        data: enhancedData,
        analysisType,
        model: 'gemini',
        geminiOptions: {
          model: 'flash', // Use flash for video support
          ...options,
        },
      });
    },
    () => generateMockAIAnalyticsResponse(data, analysisType, {
      hasVideo: true,
      hasImages: false,
      hasGrounding: options.enableGrounding,
      hasURLs: !!(data.urls && data.urls.length > 0),
    }),
    {
      useMock: shouldUseMockData(),
      onError: (error) => console.warn('[Gemini Video] API error, using mock:', error),
    }
  );
}

/**
 * Analyze race data with image input (Gemini-specific)
 */
export async function analyzeRaceDataWithImages(
  data: RaceDataAnalytics,
  imageFiles: File[],
  analysisType: 'comprehensive' | 'tire' | 'performance' | 'strategy' | 'predictive' = 'comprehensive',
  options: GeminiOptions = {}
): Promise<AIAnalyticsResponse> {
  return withMockFallback(
    async () => {
      const images = await Promise.all(
        imageFiles.map(async (file) => ({
          data: await fileToBase64(file),
          mimeType: file.type || 'image/jpeg',
        }))
      );

      const enhancedData: RaceDataAnalytics = {
        ...data,
        images,
      };

      return performAIAnalytics({
        data: enhancedData,
        analysisType,
        model: 'gemini',
        geminiOptions: options,
      });
    },
    () => generateMockAIAnalyticsResponse(data, analysisType, {
      hasVideo: false,
      hasImages: true,
      hasGrounding: options.enableGrounding,
      hasURLs: !!(data.urls && data.urls.length > 0),
    }),
    {
      useMock: shouldUseMockData(),
      onError: (error) => console.warn('[Gemini Images] API error, using mock:', error),
    }
  );
}

/**
 * Analyze race data with grounding enabled (Gemini-specific)
 */
export async function analyzeRaceDataWithGrounding(
  data: RaceDataAnalytics,
  analysisType: 'comprehensive' | 'tire' | 'performance' | 'strategy' | 'predictive' = 'comprehensive',
  groundingQueries?: string[],
  options: GeminiOptions = {}
): Promise<AIAnalyticsResponse> {
  return withMockFallback(
    async () => performAIAnalytics({
      data,
      analysisType,
      model: 'gemini',
      geminiOptions: {
        enableGrounding: true,
        groundingQueries,
        ...options,
      },
    }),
    () => generateMockAIAnalyticsResponse(data, analysisType, {
      hasVideo: !!data.video,
      hasImages: !!(data.images && data.images.length > 0),
      hasGrounding: true,
      hasURLs: !!(data.urls && data.urls.length > 0),
    }),
    {
      useMock: shouldUseMockData(),
      onError: (error) => console.warn('[Gemini Grounding] API error, using mock:', error),
    }
  );
}

/**
 * Analyze race data with URL context retrieval (Gemini-specific)
 */
export async function analyzeRaceDataWithURLs(
  data: RaceDataAnalytics,
  urls: string[],
  analysisType: 'comprehensive' | 'tire' | 'performance' | 'strategy' | 'predictive' = 'comprehensive',
  options: GeminiOptions = {}
): Promise<AIAnalyticsResponse> {
  return withMockFallback(
    async () => {
      const enhancedData: RaceDataAnalytics = {
        ...data,
        urls,
      };

      return performAIAnalytics({
        data: enhancedData,
        analysisType,
        model: 'gemini',
        geminiOptions: {
          urlContext: true,
          ...options,
        },
      });
    },
    () => generateMockAIAnalyticsResponse(data, analysisType, {
      hasVideo: !!data.video,
      hasImages: !!(data.images && data.images.length > 0),
      hasGrounding: options.enableGrounding,
      hasURLs: true,
    }),
    {
      useMock: shouldUseMockData(),
      onError: (error) => console.warn('[Gemini URL Context] API error, using mock:', error),
    }
  );
}

/**
 * Stream analysis results (Gemini-specific)
 */
export async function* streamRaceDataAnalysis(
  data: RaceDataAnalytics,
  analysisType: 'comprehensive' | 'tire' | 'performance' | 'strategy' | 'predictive' = 'comprehensive',
  options: GeminiOptions = {}
): AsyncGenerator<string, AIAnalyticsResponse, unknown> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Please add "GEMINI" secret in Lovable.');
  }

  const {
    model = 'flashStable',
    enableGrounding = false,
    groundingQueries = [],
    temperature = 0.3,
    maxOutputTokens = 4000,
    functions = [],
    urlContext = false,
  } = { ...options, enableStreaming: true };

  const modelName = GEMINI_MODELS[model];
  const prompt = buildAnalyticsPrompt(data, analysisType);

  // Build parts (same as analyzeWithGemini)
  const parts: any[] = [{ text: prompt }];
  
  if (data.images?.length) {
    data.images.forEach((image) => {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      });
    });
  }

  if (data.video) {
    parts.push({
      inlineData: {
        mimeType: data.video.mimeType,
        data: data.video.data,
      },
    });
  }

  const requestBody: any = {
    contents: [{ parts }],
    generationConfig: {
      temperature,
      maxOutputTokens,
    },
  };

  if (enableGrounding) {
    requestBody.groundingConfig = {
      googleSearchRetrieval: {
        dynamicRetrievalConfig: {
          mode: 'MODE_DYNAMIC',
          dynamicThreshold: 0.3,
        },
        queries: groundingQueries.length > 0 
          ? groundingQueries 
          : [`${data.track} race track information`],
      },
    };
  }

  const url = `${GEMINI_BASE_URL}/models/${modelName}:streamGenerateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY, // Also support header method
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    if (!reader) {
      throw new Error('No response body reader available');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const json = JSON.parse(data);
              const candidate = json.candidates?.[0];
              if (candidate?.content?.parts) {
                for (const part of candidate.content.parts) {
                  if (part.text) {
                    fullText += part.text;
                    yield part.text; // Stream each text chunk
                  }
                }
              }
            } catch (e) {
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Return final parsed response
    return parseAIResponse(fullText, 'gemini');
  } catch (error) {
    console.error('Gemini streaming error:', error);
    throw error;
  }
}

// Export types
export type { GeminiOptions, GeminiFunction, GroundingMetadata, Citation };

