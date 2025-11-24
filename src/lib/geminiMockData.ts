// src/lib/geminiMockData.ts
// Mock data generators for Gemini-specific features with fallback support
// Used when API fails or in demo mode

import type { 
  AIAnalyticsResponse, 
  RaceDataAnalytics, 
  GroundingMetadata, 
  Citation 
} from '@/api/aiAnalytics';

/**
 * Generate mock AI analytics response
 */
export function generateMockAIAnalyticsResponse(
  data: RaceDataAnalytics,
  analysisType: string,
  features?: {
    hasVideo?: boolean;
    hasImages?: boolean;
    hasGrounding?: boolean;
    hasURLs?: boolean;
  }
): AIAnalyticsResponse {
  const hasMultimodal = features?.hasVideo || features?.hasImages;
  const hasGrounding = features?.hasGrounding;
  const hasURLs = features?.hasURLs;

  // Base insights based on analysis type
  const baseInsights: Record<string, string[]> = {
    comprehensive: [
      `Vehicle ${data.vehicle || 'N/A'} showing consistent lap times with minor variations`,
      `Tire degradation appears normal for lap ${data.lap || 'N/A'}`,
      `Brake temperature within optimal range for track conditions`,
      `Fuel consumption rate aligns with expected strategy`,
      hasMultimodal 
        ? 'Video analysis indicates smooth driving lines through corners'
        : 'Telemetry data shows stable performance metrics',
      hasGrounding
        ? 'Latest track information suggests optimal racing conditions'
        : 'Historical data patterns match current performance',
      'Sector times consistent with previous laps',
    ],
    tire: [
      `Front left tire showing ${Math.round(Math.random() * 10 + 5)}% wear`,
      `Tire temperatures optimal for current track conditions`,
      `Recommended pit window: Laps ${data.lap ? data.lap + 5 : 10}-${data.lap ? data.lap + 8 : 13}`,
      `Predicted tire degradation rate: ${(Math.random() * 0.3 + 0.2).toFixed(2)}s per lap`,
      hasMultimodal 
        ? 'Visual inspection of tire condition from onboard camera shows normal wear patterns'
        : 'Tire stress analysis indicates normal operating parameters',
    ],
    performance: [
      `Lap time performance: ${(Math.random() * 0.5 + 1.5).toFixed(2)}s within optimal range`,
      `Sector 2 showing strongest performance (${(Math.random() * 0.3 + 0.2).toFixed(2)}s faster)`,
      `Speed through turns consistent with track record`,
      `Acceleration data indicates optimal gear selection`,
    ],
    strategy: [
      `Current strategy aligns with optimal pit window`,
      `Fuel load sufficient for ${Math.round(Math.random() * 5 + 8)} more laps`,
      `Competitor analysis suggests maintaining current pace`,
      `Weather conditions favor current tire compound choice`,
    ],
    predictive: [
      `Predicted finish position: P${Math.round(Math.random() * 5 + 3)}`,
      `Projected total race time: ${Math.round(Math.random() * 300 + 3600)}s`,
      `Tire wear forecast indicates pit stop needed around lap ${data.lap ? data.lap + 7 : 15}`,
      `Performance trend suggests maintaining current strategy`,
    ],
  };

  const insights = baseInsights[analysisType as keyof typeof baseInsights] || baseInsights.comprehensive;

  const recommendations = [
    'Continue current driving style for optimal tire preservation',
    'Monitor tire temperatures closely for next 3 laps',
    'Consider pit stop strategy adjustment if competitors pit early',
    hasMultimodal
      ? 'Video analysis confirms driving line optimization recommendations'
      : 'Review telemetry data for potential performance improvements',
    hasGrounding
      ? 'Latest track conditions suggest maintaining current setup'
      : 'Historical data supports current strategy decisions',
  ];

  const predictions = {
    tireWear: `Predicted tire wear increase of ${(Math.random() * 0.3 + 0.2).toFixed(2)}s per lap over next 5 laps. Pit window optimal between laps ${data.lap ? data.lap + 5 : 10}-${data.lap ? data.lap + 8 : 13}.`,
    lapTime: `Expected lap times: ${(Math.random() * 0.5 + 92.5).toFixed(2)}s ± ${(Math.random() * 0.3 + 0.1).toFixed(2)}s. Performance trend stable with slight improvement expected in final sectors.`,
    pitWindow: `Optimal pit window: Laps ${data.lap ? data.lap + 6 : 12}-${data.lap ? data.lap + 9 : 15}. Current tire compound performing well. Monitor competitor pit strategy for tactical advantage.`,
    performance: `Performance trajectory indicates ${Math.round(Math.random() * 5 + 2)} position improvement potential with current strategy. Sector analysis shows 0.${Math.round(Math.random() * 3 + 1)}s improvement opportunity in S2.`,
  };

  const patterns = {
    identified: [
      'Consistent sector time patterns across recent laps',
      'Tire temperature stabilization pattern observed',
      'Speed correlation with track position analysis',
      hasMultimodal ? 'Driving line consistency identified from video analysis' : 'Telemetry data shows repeatable patterns',
    ],
    anomalies: [
      `Lap ${data.lap ? data.lap - 1 : 5} showed ${(Math.random() * 0.5 + 0.3).toFixed(2)}s variance - likely due to traffic`,
      'Minor brake temperature spike in sector 1 - monitor closely',
      hasMultimodal ? 'Video analysis detected slight deviation in turn 7 approach' : 'Telemetry shows slight variance in sector 2',
    ],
    trends: [
      'Gradual tire degradation trend as expected',
      'Improving sector times indicate track conditions favorable',
      'Fuel consumption rate stabilizing',
      hasGrounding ? 'Track conditions improving based on latest data' : 'Historical trend aligns with current performance',
    ],
  };

  // Generate citations if grounding or URLs were used
  const citations: Citation[] = [];
  if (hasGrounding) {
    citations.push(
      {
        uri: `https://www.track-data.com/${data.track}/race-${data.race}`,
        title: `${data.track} Race ${data.race} - Official Timing Data`,
      },
      {
        uri: 'https://www.motorsports.com/weather-conditions',
        title: 'Current Track Weather Conditions',
      },
      {
        uri: `https://www.racing-reference.info/track/${data.track}`,
        title: `${data.track} Track Information & History`,
      }
    );
  }

  if (hasURLs && data.urls) {
    data.urls.forEach((url) => {
      citations.push({
        uri: url,
        title: `Context from ${new URL(url).hostname}`,
      });
    });
  }

  // Generate grounding metadata if grounding was enabled
  const groundingMetadata: GroundingMetadata | undefined = hasGrounding
    ? {
        searchQueries: [
          `${data.track} race track information`,
          `GR Cup ${data.track} race results`,
          `F1 ${data.track} track data`,
        ],
        groundingChunks: citations.slice(0, 3).map((citation) => ({
          segment: citation.uri || '',
          confidenceScore: Math.random() * 0.2 + 0.7,
        })),
      }
    : undefined;

  return {
    insights,
    recommendations,
    predictions,
    patterns,
    summary: `Analysis of ${data.track} race ${data.race}${data.vehicle ? ` for vehicle ${data.vehicle}` : ''}${data.lap ? ` on lap ${data.lap}` : ''}. ${hasMultimodal ? 'Multimodal analysis (video/images) ' : ''}${hasGrounding ? 'with real-time grounding data ' : ''}${hasURLs ? 'including URL context ' : ''}indicates optimal performance trajectory. Key findings include consistent lap times, normal tire degradation, and strategic positioning. Recommendations focus on maintaining current pace while monitoring tire conditions for optimal pit window timing.`,
    confidence: Math.round(Math.random() * 15 + 75), // 75-90% confidence
    model: 'gemini',
    timestamp: new Date().toISOString(),
    citations: citations.length > 0 ? citations : undefined,
    groundingMetadata,
  };
}

/**
 * Check if we should use mock data
 */
export function shouldUseMockData(): boolean {
  // Check if in demo mode
  if (typeof window !== 'undefined') {
    const isDemoMode = localStorage.getItem('pitwall_demo_mode') === 'true';
    if (isDemoMode) return true;
  }

  // Check if Gemini API key is missing
  const geminiKey = 
    import.meta.env.GEMINI ||
    import.meta.env.VITE_GEMINI_API_KEY || 
    import.meta.env.GEMINI_API_KEY;

  return !geminiKey;
}

/**
 * Create mock response with delay to simulate API call
 */
export async function createMockResponse<T>(
  generator: () => T,
  delay: number = 1000 + Math.random() * 1000
): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(generator());
    }, delay);
  });
}

/**
 * Wrap Gemini API call with mock fallback
 */
export async function withMockFallback<T>(
  apiCall: () => Promise<T>,
  mockGenerator: () => T,
  options?: {
    useMock?: boolean;
    onError?: (error: Error) => void;
  }
): Promise<T> {
  const { useMock, onError } = options || {};

  // Use mock if explicitly requested or if should use mock
  if (useMock || shouldUseMockData()) {
    console.info('[Gemini] Using mock data fallback');
    return createMockResponse(mockGenerator);
  }

  try {
    return await apiCall();
  } catch (error) {
    console.warn('[Gemini] API call failed, falling back to mock data:', error);
    onError?.(error as Error);
    return createMockResponse(mockGenerator, 500); // Faster fallback
  }
}


