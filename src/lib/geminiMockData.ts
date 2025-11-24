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

/**
 * Example mock analytics output for photo analysis
 * Uses one of the 4 thumbnails from the coaching page /multimodal
 */
export function generateMockPhotoAnalysisResponse(): AIAnalyticsResponse {
  return {
    insights: [
      'Image analysis of overtake-turn3.jpg reveals optimal racing line through Turn 3',
      'Vehicle positioning shows clean inside line entry with proper apex timing',
      'Visual inspection indicates tire contact patch is fully engaged during corner exit',
      'Onboard camera angle shows driver maintaining consistent steering input throughout the corner',
      'Track surface appears clean with optimal grip conditions visible in the image',
      'Competitor vehicle visible in frame, confirming successful overtake maneuver',
    ],
    recommendations: [
      'Maintain this racing line approach for Turn 3 - current technique is optimal',
      'Consider applying similar late-braking technique to other similar corners',
      'The inside line entry shown in the image should be replicated for consistency',
      'Video analysis would complement this image to verify full corner technique',
    ],
    predictions: {
      tireWear: 'Image shows tire condition appears normal. Predicted wear rate: 0.25s per lap over next 5 laps based on visual tire state.',
      lapTime: 'Based on vehicle positioning in image, expected lap time improvement of 0.15s if this line is consistently maintained.',
      pitWindow: 'Visual tire inspection suggests pit window remains optimal at Laps 12-15. No premature wear visible.',
      performance: 'Image analysis indicates strong cornering technique. Performance trajectory suggests maintaining current approach for optimal results.',
    },
    patterns: {
      identified: [
        'Consistent racing line visible in image matches telemetry data patterns',
        'Vehicle positioning shows repeatable corner entry technique',
        'Tire contact patch engagement pattern indicates optimal cornering speed',
      ],
      anomalies: [
        'Slight deviation in apex point compared to ideal line - potential 0.05s gain if corrected',
        'Image shows minor oversteer correction needed in corner exit phase',
      ],
      trends: [
        'Visual analysis confirms improving corner technique trend',
        'Image quality and angle provide clear view of optimal racing line execution',
      ],
    },
    summary: 'Analysis of overtake-turn3.jpg thumbnail from coaching page reveals excellent cornering technique through Turn 3. The image shows a clean inside line entry with proper apex timing and optimal tire engagement. Vehicle positioning indicates successful overtake maneuver with competitor visible in frame. Visual inspection confirms normal tire condition and optimal track surface grip. Recommendations focus on maintaining this racing line approach and applying similar techniques to other corners. The image provides clear evidence of strong driving fundamentals that align with telemetry data patterns.',
    confidence: 87,
    model: 'gemini',
    timestamp: new Date().toISOString(),
    citations: [
      {
        uri: '/videos/posters/overtake-turn3.jpg',
        title: 'Overtake Turn 3 - Thumbnail Image',
      },
    ],
  };
}

/**
 * Example mock analytics output for video analysis
 * Uses one of the 4 videos from the coaching page /multimodal
 */
export function generateMockVideoAnalysisResponse(): AIAnalyticsResponse {
  return {
    insights: [
      'Video analysis of personal-best-sebring.mp4 shows complete lap execution with optimal sector transitions',
      'Frame-by-frame analysis reveals consistent braking points throughout all sectors',
      'Corner exit speeds are maximized with smooth throttle application visible in video',
      'Onboard footage confirms driver maintains optimal racing line through all 12 corners',
      'Video shows excellent tire management with no visible lock-ups or slides',
      'Sector transitions are smooth with minimal speed loss between sectors',
      'Video analysis indicates driver is using full track width effectively',
    ],
    recommendations: [
      'Maintain current braking technique shown in video - timing is optimal for track conditions',
      'The smooth throttle application visible in video should be replicated for consistency',
      'Consider slight adjustment to Turn 7 entry based on video frame analysis - potential 0.08s gain',
      'Video confirms optimal tire usage - continue current approach for tire preservation',
      'The racing line shown in video matches telemetry data - maintain this technique',
    ],
    predictions: {
      tireWear: 'Video analysis shows no visible tire degradation issues. Predicted wear rate: 0.22s per lap. Tire condition appears optimal for extended stint.',
      lapTime: 'Based on video analysis of complete lap, expected lap time consistency: 88.45s ± 0.15s. Performance is stable with slight improvement potential in Sector 2.',
      pitWindow: 'Video shows tire condition remains optimal. Pit window recommendation: Laps 15-18 based on visual tire state and lap count.',
      performance: 'Video analysis indicates strong performance trajectory. Expected position improvement: +2 positions with current technique maintained throughout race.',
    },
    patterns: {
      identified: [
        'Video shows consistent cornering technique across all sectors',
        'Frame analysis reveals repeatable braking and acceleration patterns',
        'Racing line consistency visible throughout entire lap in video',
        'Sector transition smoothness pattern identified from video analysis',
      ],
      anomalies: [
        'Video frame analysis detected slight early braking in Turn 5 - potential 0.06s gain if corrected',
        'Minor throttle lift visible in Turn 9 exit - could be optimized for better exit speed',
      ],
      trends: [
        'Video analysis confirms improving lap consistency trend',
        'Cornering technique shows gradual refinement throughout video',
        'Tire management visible in video indicates optimal degradation rate',
      ],
    },
    summary: 'Comprehensive video analysis of personal-best-sebring.mp4 from coaching page reveals excellent lap execution with optimal sector transitions. Frame-by-frame analysis shows consistent braking points, maximized corner exit speeds, and smooth throttle application throughout all 12 corners. The onboard footage confirms optimal racing line usage with full track width utilization. Video analysis indicates no visible tire degradation issues and excellent tire management with no lock-ups or slides. Sector transitions are smooth with minimal speed loss. The video provides clear evidence of strong driving fundamentals that align with telemetry data, showing a personal best lap time of 88.45s. Recommendations focus on maintaining current technique while identifying minor optimization opportunities in specific corners.',
    confidence: 92,
    model: 'gemini',
    timestamp: new Date().toISOString(),
    citations: [
      {
        uri: '/videos/personal-best-sebring.mp4',
        title: 'Personal Best Lap - Sebring International Raceway',
      },
    ],
  };
}

/**
 * Example mock analytics output for link/URL analysis
 */
export function generateMockLinkAnalysisResponse(): AIAnalyticsResponse {
  return {
    insights: [
      'URL context analysis from racing-reference.info provides comprehensive track data for strategy planning',
      'Web content analysis reveals current track conditions favor soft compound tire strategy',
      'Historical race data from URL indicates optimal pit window patterns for this track',
      'Weather information extracted from URL suggests track temperature will increase by 3°C over next hour',
      'Competitor analysis from URL context shows top teams using 2-stop strategy approach',
      'Track layout information confirms optimal racing line matches current telemetry data',
      'URL analysis provides additional context on track-specific characteristics affecting tire wear',
    ],
    recommendations: [
      'Based on URL context analysis, recommend switching to 2-stop strategy to match competitor approach',
      'Track temperature increase from URL data suggests adjusting tire pressure by +2 PSI',
      'Historical data from URL indicates optimal pit window is Laps 12-14 for this track configuration',
      'URL analysis confirms current tire compound choice is optimal for track conditions',
      'Consider URL-provided track layout insights for optimizing sector-specific strategies',
    ],
    predictions: {
      tireWear: 'URL context analysis combined with telemetry suggests tire wear rate: 0.28s per lap. Track temperature increase from URL data may accelerate degradation slightly.',
      lapTime: 'Based on URL-provided historical data and current performance, expected lap times: 89.2s ± 0.2s. URL analysis indicates track conditions favor current pace.',
      pitWindow: 'URL context from racing-reference.info suggests optimal pit window: Laps 12-14 based on historical patterns and current track conditions.',
      performance: 'URL analysis of competitor strategies indicates position improvement potential: +3 positions with recommended 2-stop strategy approach.',
    },
    patterns: {
      identified: [
        'URL-provided historical data shows consistent pit window patterns for this track',
        'Track layout information from URL matches telemetry-based racing line analysis',
        'Weather data from URL correlates with current tire temperature trends',
      ],
      anomalies: [
        'URL analysis reveals slight deviation from historical tire wear patterns - may indicate track surface changes',
        'Competitor strategy data from URL shows unexpected 1-stop approach by some teams',
      ],
      trends: [
        'URL context confirms improving track conditions trend aligns with telemetry data',
        'Historical race results from URL indicate performance trajectory is on track for podium finish',
        'Weather trend from URL suggests optimal conditions for remaining race duration',
      ],
    },
    summary: 'Comprehensive URL context analysis from racing-reference.info and related sources provides valuable strategic insights for race planning. Web content analysis reveals current track conditions favor soft compound tire strategy, with historical race data indicating optimal pit window patterns. Weather information extracted from URLs suggests track temperature will increase by 3°C over the next hour, requiring tire pressure adjustments. Competitor analysis from URL context shows top teams using 2-stop strategy approach, which aligns with current performance metrics. Track layout information confirms optimal racing line matches current telemetry data. The URL analysis provides additional context on track-specific characteristics affecting tire wear and performance. Recommendations focus on strategy adjustments based on URL-provided insights, including pit window timing and tire management approaches.',
    confidence: 85,
    model: 'gemini',
    timestamp: new Date().toISOString(),
    citations: [
      {
        uri: 'https://www.racing-reference.info/track/sebring-international-raceway',
        title: 'Sebring International Raceway - Racing Reference',
      },
      {
        uri: 'https://www.motorsports.com/track-conditions/sebring',
        title: 'Sebring Track Conditions & Weather Data',
      },
      {
        uri: 'https://www.grcup.com/race-results/sebring',
        title: 'GR Cup Sebring Race Results & Strategy Analysis',
      },
    ],
    groundingMetadata: {
      searchQueries: [
        'Sebring International Raceway track information',
        'GR Cup Sebring race results and strategy',
        'Sebring track conditions weather data',
      ],
      groundingChunks: [
        {
          segment: 'https://www.racing-reference.info/track/sebring-international-raceway',
          confidenceScore: 0.89,
        },
        {
          segment: 'https://www.motorsports.com/track-conditions/sebring',
          confidenceScore: 0.85,
        },
        {
          segment: 'https://www.grcup.com/race-results/sebring',
          confidenceScore: 0.82,
        },
      ],
    },
  };
}

/**
 * Get example mock analytics response based on input type
 */
export function getExampleMockAnalytics(
  type: 'photo' | 'video' | 'link'
): AIAnalyticsResponse {
  switch (type) {
    case 'photo':
      return generateMockPhotoAnalysisResponse();
    case 'video':
      return generateMockVideoAnalysisResponse();
    case 'link':
      return generateMockLinkAnalysisResponse();
    default:
      return generateMockPhotoAnalysisResponse();
  }
}


