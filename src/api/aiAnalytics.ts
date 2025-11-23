// src/api/aiAnalytics.ts
// AI-powered data analytics service using OpenAI and Gemini APIs
// Emphasizes AI for data analytics with race telemetry and performance data

import { client } from './client';

// Get API keys from environment variables (Lovable secrets)
// In Lovable, secrets are exposed as environment variables
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI;

// OpenAI API configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

export interface RaceDataAnalytics {
  track: string;
  race: number;
  vehicle?: number;
  lap?: number;
  telemetry?: Record<string, unknown>;
  performance?: Record<string, unknown>;
  tireData?: Record<string, unknown>;
  weather?: Record<string, unknown>;
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
}

export interface AdvancedAnalyticsRequest {
  data: RaceDataAnalytics;
  analysisType: 'comprehensive' | 'tire' | 'performance' | 'strategy' | 'predictive';
  includeVisualizations?: boolean;
  model?: 'openai' | 'gemini' | 'both';
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
 * Analyze race data using Gemini API
 */
async function analyzeWithGemini(
  data: RaceDataAnalytics,
  analysisType: string
): Promise<AIAnalyticsResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured.');
  }

  const prompt = buildAnalyticsPrompt(data, analysisType);

  try {
    const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000,
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const analysisText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return parseAIResponse(analysisText, 'gemini');
  } catch (error) {
    console.error('Gemini analytics error:', error);
    throw error;
  }
}

/**
 * Build comprehensive analytics prompt for AI models
 */
function buildAnalyticsPrompt(data: RaceDataAnalytics, analysisType: string): string {
  const basePrompt = `Analyze the following race data and provide comprehensive data analytics insights:

TRACK: ${data.track}
RACE: ${data.race}
${data.vehicle ? `VEHICLE: ${data.vehicle}` : ''}
${data.lap ? `LAP: ${data.lap}` : ''}

TELEMETRY DATA:
${JSON.stringify(data.telemetry || {}, null, 2)}

PERFORMANCE DATA:
${JSON.stringify(data.performance || {}, null, 2)}

TIRE DATA:
${JSON.stringify(data.tireData || {}, null, 2)}

${data.weather ? `WEATHER DATA:\n${JSON.stringify(data.weather, null, 2)}` : ''}

ANALYSIS TYPE: ${analysisType}

Please provide:
1. KEY INSIGHTS: List 5-7 actionable insights from the data
2. RECOMMENDATIONS: Provide 3-5 strategic recommendations
3. PREDICTIONS: Forecast tire wear, lap times, pit windows, and performance trends
4. PATTERNS: Identify data patterns, anomalies, and trends
5. SUMMARY: A concise executive summary of the analysis
6. CONFIDENCE: A confidence score (0-100) for the analysis

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
 */
export async function performAIAnalytics(
  request: AdvancedAnalyticsRequest
): Promise<AIAnalyticsResponse> {
  const { data, analysisType, model = 'openai' } = request;

  try {
    if (model === 'both') {
      // Use both models and combine results
      const [openaiResult, geminiResult] = await Promise.allSettled([
        analyzeWithOpenAI(data, analysisType),
        analyzeWithGemini(data, analysisType),
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
      return analyzeWithGemini(data, analysisType);
    } else {
      return analyzeWithOpenAI(data, analysisType);
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
      model: 'openai', // Prioritize OpenAI
    });
  } catch (error) {
    console.error('Error fetching race data for AI analytics:', error);
    throw error;
  }
}

/**
 * Analyze specific aspect of race data
 */
export async function analyzeRaceData(
  data: RaceDataAnalytics,
  analysisType: 'comprehensive' | 'tire' | 'performance' | 'strategy' | 'predictive' = 'comprehensive',
  model: 'openai' | 'gemini' | 'both' = 'openai'
): Promise<AIAnalyticsResponse> {
  return performAIAnalytics({
    data,
    analysisType,
    model,
  });
}

