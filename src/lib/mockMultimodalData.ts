// @ts-nocheck
// src/lib/mockMultimodalData.ts
// Mock data generator for Gemini Multimodal features
// Provides mock data for images, videos, audio, URLs, and responses
//
// Usage Examples:
// 
// 1. Generate mock images:
//    const images = generateMockImages(3);
//
// 2. Generate complete multimodal input:
//    const input = generateMockMultimodalInput();
//
// 3. Generate mock response:
//    const response = generateMockMultimodalResponse('race-analysis');
//
// 4. Use predefined scenarios:
//    const scenario = MOCK_SCENARIOS.fullMultimodal;
//
// 5. Create complete mock with input and response:
//    const { input, response } = createCompleteMockResponse('fullMultimodal');

import type { MediaFile, URLContext, GeminiMultimodalResponse } from '@/components/GeminiMultimodalInput';

/**
 * Generate a mock File object for testing
 * Note: This creates a File object that can be used in browser environments
 */
export function createMockFile(
  name: string,
  type: string,
  size: number = 1024 * 1024, // 1MB default
  content: string = ''
): File {
  const blob = new Blob([content || 'mock file content'], { type });
  return new File([blob], name, { type, lastModified: Date.now() });
}

/**
 * Generate mock image files
 */
export function generateMockImages(count: number = 3): MediaFile[] {
  const images: MediaFile[] = [];
  const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const imageNames = [
    'race-telemetry-chart.jpg',
    'tire-wear-analysis.png',
    'lap-time-comparison.jpg',
    'sector-analysis.png',
    'driver-performance.jpg',
    'track-map.png',
  ];

  for (let i = 0; i < count; i++) {
    const name = imageNames[i % imageNames.length];
    const type = imageTypes[i % imageTypes.length];
    const file = createMockFile(name, type, 500 * 1024 + Math.random() * 500 * 1024);
    
    // Create a data URL for preview (simple colored square)
    let preview: string | undefined;
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
          ctx.fillStyle = colors[i % colors.length];
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ffffff';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(name.replace(/\.[^.]+$/, ''), canvas.width / 2, canvas.height / 2);
        }
        preview = canvas.toDataURL();
      } catch (e) {
        // Fallback if canvas is not available
        preview = undefined;
      }
    }
    
    images.push({
      file,
      type: 'image',
      id: `mock-image-${i}-${Date.now()}`,
      preview,
    });
  }

  return images;
}

/**
 * Generate mock video files
 */
export function generateMockVideos(count: number = 2): MediaFile[] {
  const videos: MediaFile[] = [];
  const videoTypes = ['video/mp4', 'video/webm'];
  const videoNames = [
    'race-highlights.mp4',
    'onboard-footage.mp4',
    'pit-stop-analysis.mp4',
    'sector-replay.webm',
  ];

  for (let i = 0; i < count; i++) {
    const name = videoNames[i % videoNames.length];
    const type = videoTypes[i % videoTypes.length];
    const file = createMockFile(name, type, 5 * 1024 * 1024 + Math.random() * 5 * 1024 * 1024);
    
    videos.push({
      file,
      type: 'video',
      id: `mock-video-${i}-${Date.now()}`,
    });
  }

  return videos;
}

/**
 * Generate mock audio files
 */
export function generateMockAudio(count: number = 2): MediaFile[] {
  const audio: MediaFile[] = [];
  const audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
  const audioNames = [
    'team-radio.mp3',
    'engine-sound-analysis.wav',
    'pit-crew-communication.mp3',
    'race-commentary.ogg',
  ];

  for (let i = 0; i < count; i++) {
    const name = audioNames[i % audioNames.length];
    const type = audioTypes[i % audioTypes.length];
    const file = createMockFile(name, type, 2 * 1024 * 1024 + Math.random() * 2 * 1024 * 1024);
    
    audio.push({
      file,
      type: 'audio',
      id: `mock-audio-${i}-${Date.now()}`,
    });
  }

  return audio;
}

/**
 * Generate mock URL contexts
 */
export function generateMockUrls(count: number = 3): URLContext[] {
  const urls: URLContext[] = [];
  const urlTemplates = [
    {
      url: 'https://www.racing-reference.info/track/barber-motorsports-park',
      title: 'Barber Motorsports Park - Racing Reference',
    },
    {
      url: 'https://www.circuitoftheamericas.com/racing',
      title: 'Circuit of the Americas - Official Racing Information',
    },
    {
      url: 'https://www.sebringraceway.com/events',
      title: 'Sebring International Raceway - Events',
    },
    {
      url: 'https://www.sonomaraceway.com/track-info',
      title: 'Sonoma Raceway - Track Information',
    },
    {
      url: 'https://www.roadamerica.com/racing',
      title: 'Road America - Racing Events',
    },
    {
      url: 'https://www.virnow.com/track',
      title: 'Virginia International Raceway - Track Details',
    },
    {
      url: 'https://www.indianapolismotorspeedway.com/events',
      title: 'Indianapolis Motor Speedway - Events',
    },
  ];

  for (let i = 0; i < count; i++) {
    const template = urlTemplates[i % urlTemplates.length];
    urls.push({
      url: template.url,
      id: `mock-url-${i}-${Date.now()}`,
      title: template.title,
      loading: false,
    });
  }

  return urls;
}

/**
 * Generate mock Gemini multimodal responses
 */
export function generateMockMultimodalResponse(
  scenario: 'race-analysis' | 'tire-analysis' | 'driver-coaching' | 'strategy' | 'general' = 'general'
): GeminiMultimodalResponse {
  const responses = {
    'race-analysis': {
      text: `## Race Analysis Summary

Based on the provided telemetry data and track information, here are the key insights:

### Performance Metrics
- **Average Lap Time**: 1:39.284 seconds
- **Best Lap**: 1:38.956 seconds (Lap 12)
- **Consistency Score**: 99.76%
- **Gap to Leader**: 2.346 seconds

### Sector Analysis
- **Sector 1**: 26.961s (Strong - 0.2s faster than average)
- **Sector 2**: 43.160s (Needs improvement - 0.1s slower)
- **Sector 3**: 29.163s (Optimal - matches best sector time)

### Recommendations
1. Focus on Sector 2 optimization - potential 0.3s gain
2. Tire management is optimal - current wear at 65%
3. Consider pit stop window: Laps 18-22 for optimal strategy

### Competitive Position
Currently running in P2, with strong pace in S1 and S3. The main opportunity lies in improving Sector 2 performance through better braking points and corner exit speed.`,
      citations: [
        {
          uri: 'https://www.racing-reference.info/track/barber-motorsports-park',
          title: 'Barber Motorsports Park Track Guide',
        },
        {
          uri: 'https://www.fia.com/regulations',
          title: 'FIA Racing Regulations',
        },
      ],
      tokensUsed: 1247,
    },
    'tire-analysis': {
      text: `## Tire Wear Analysis

### Current Tire Status
- **Front Left**: 68% wear
- **Front Right**: 65% wear
- **Rear Left**: 62% wear
- **Rear Right**: 64% wear

### Degradation Rate
- **Predicted Loss per Lap**: 0.34 seconds
- **Laps Until 0.5s Loss**: 1.47 laps
- **Recommended Pit Lap**: 8

### Key Factors
1. **Lateral Load in Sector 2**: High stress (+0.42 impact)
2. **Brake Energy in Sector 1**: Repeated heavy braking (+0.19 impact)
3. **Surface Temperature**: Rising +2.2°C over last 3 laps
4. **Lateral G-forces**: Elevated in Sector 2

### Strategic Recommendations
- **Immediate Action**: Prepare for pit stop on Lap 8
- **Alternative Strategy**: Stay out until Lap 10 (higher risk, track position advantage)
- **Tire Compound**: Recommend soft compound for next stint

The analysis indicates that tire degradation is accelerating, particularly in the front tires due to heavy braking zones and high-speed corners.`,
      citations: [
        {
          uri: 'https://www.pirelli.com/racing/tire-technology',
          title: 'Pirelli Tire Technology Guide',
        },
      ],
      tokensUsed: 892,
    },
    'driver-coaching': {
      text: `## Driver Coaching Insights

### Performance Review - Lap 12

**Overall Assessment**: Strong lap with room for improvement in specific sectors.

### Sector Breakdown
- **Sector 1**: 26.961s ⭐ (Excellent - 0.2s faster than average)
- **Sector 2**: 43.160s ⚠️ (Needs work - 0.1s slower than optimal)
- **Sector 3**: 29.163s ✅ (Good - consistent performance)

### Key Observations

1. **Turn 3 - Early Braking**
   - Braking point is 5 meters early
   - Potential gain: 0.15s per lap
   - Recommendation: Brake 5m later, maintain speed through entry

2. **Turn 7 - Late Apex**
   - Apex point is 2 meters late
   - Potential gain: 0.10s per lap
   - Recommendation: Turn in earlier, hit apex at optimal point

3. **Sector 2 Exit Speed**
   - Corner exit speed is 3 mph lower than optimal
   - Potential gain: 0.08s per lap
   - Recommendation: More aggressive throttle application on exit

### Consistency Score: 99.76%
Your lap-to-lap consistency is excellent. Focus on implementing these sector-specific improvements to maximize your potential.

### Next Steps
1. Practice Turn 3 braking point adjustment
2. Work on Turn 7 apex timing
3. Improve Sector 2 exit speeds

**Total Potential Gain**: 0.33s per lap`,
      citations: [],
      tokensUsed: 654,
    },
    'strategy': {
      text: `## Race Strategy Analysis

### Current Race Position
- **Position**: P2
- **Gap to Leader**: 2.346 seconds
- **Gap to P3**: 1.892 seconds
- **Laps Remaining**: 18

### Strategy Options

#### Option 1: 2-Stop Strategy (Recommended)
- **Pit Window 1**: Laps 8-10
- **Pit Window 2**: Laps 18-20
- **Expected Finish**: P2-P3
- **Win Probability**: 15%
- **Risk Level**: Moderate

**Advantages**:
- Fresh tires for final stint
- Better pace in closing laps
- Flexibility to respond to competitors

**Disadvantages**:
- Two pit stop time losses (~40 seconds total)
- Track position risk

#### Option 2: 1-Stop Strategy
- **Pit Window**: Laps 12-14
- **Expected Finish**: P4-P5
- **Win Probability**: 5%
- **Risk Level**: High

**Advantages**:
- Single pit stop time loss (~20 seconds)
- Track position maintained

**Disadvantages**:
- High tire degradation in final stint
- Limited pace in closing laps
- Vulnerable to competitors on fresher tires

### Simulation Results
Based on 1000 race scenario simulations:
- **2-Stop**: 65% chance of podium finish
- **1-Stop**: 35% chance of podium finish

### Recommendation
Proceed with **2-Stop Strategy** for optimal race outcome. The simulation data strongly favors this approach given current tire wear rates and competitive positioning.`,
      citations: [
        {
          uri: 'https://www.fia.com/regulations',
          title: 'FIA Strategy Regulations',
        },
      ],
      tokensUsed: 1456,
    },
    'general': {
      text: `## Multimodal Analysis Complete

I've analyzed the provided content including images, videos, audio, and web context. Here's a comprehensive summary:

### Content Overview
- **Images Processed**: 3 files
- **Videos Processed**: 2 files
- **Audio Files**: 2 files
- **URLs Analyzed**: 3 web pages

### Key Insights
1. The telemetry data shows consistent performance across multiple sectors
2. Visual analysis of track maps reveals optimal racing lines
3. Audio analysis indicates clear team communication
4. Web context provides additional track-specific information

### Recommendations
- Continue monitoring tire wear patterns
- Optimize braking points in Sector 1
- Maintain current pace consistency

### Technical Details
- **Processing Time**: 2.3 seconds
- **Model Used**: Gemini 2.0 Flash
- **Grounding Enabled**: Yes
- **Citations Found**: 2 sources

This analysis combines visual, audio, and textual data to provide a comprehensive understanding of the race performance and strategic options.`,
      citations: [
        {
          uri: 'https://www.racing-reference.info',
          title: 'Racing Reference Database',
        },
      ],
      tokensUsed: 1023,
    },
  };

  return responses[scenario];
}

/**
 * Generate comprehensive mock multimodal input data
 */
export function generateMockMultimodalInput() {
  return {
    text: 'Analyze this race data and provide insights on tire wear, sector performance, and strategic recommendations.',
    images: generateMockImages(3),
    videos: generateMockVideos(2),
    audio: generateMockAudio(2),
    urls: generateMockUrls(3),
    options: {
      enableGrounding: true,
      model: 'flashStable' as const,
      temperature: 0.7,
      maxTokens: 8192,
    },
  };
}

/**
 * Sample text prompts for different use cases
 */
export const SAMPLE_PROMPTS = {
  raceAnalysis: 'Analyze the race telemetry data and provide insights on lap times, sector performance, and driver consistency.',
  tireAnalysis: 'Examine the tire wear data and predict optimal pit stop windows. Include recommendations for tire compound selection.',
  driverCoaching: 'Review the onboard footage and telemetry to provide driver coaching feedback. Focus on braking points, apex timing, and corner exit speeds.',
  strategy: 'Simulate different race strategies (1-stop vs 2-stop) and provide recommendations based on current tire wear and track position.',
  imageAnalysis: 'Describe what you see in these images. Analyze any charts, graphs, or visual data presented.',
  videoAnalysis: 'Analyze the video footage and provide insights on driving technique, track conditions, and performance opportunities.',
  audioAnalysis: 'Transcribe and analyze the audio content. Extract key information from team radio communications.',
  urlAnalysis: 'Summarize the content from the provided URLs and extract relevant information for race strategy.',
  multimodal: 'Combine insights from all provided media (images, videos, audio, URLs) to create a comprehensive race analysis.',
};

/**
 * Mock data for testing different scenarios
 */
export const MOCK_SCENARIOS = {
  minimal: {
    text: 'What can you tell me about this?',
    images: generateMockImages(1),
    videos: [],
    audio: [],
    urls: [],
  },
  imagesOnly: {
    text: 'Analyze these images',
    images: generateMockImages(5),
    videos: [],
    audio: [],
    urls: [],
  },
  videosOnly: {
    text: 'Review this video footage',
    images: [],
    videos: generateMockVideos(2),
    audio: [],
    urls: [],
  },
  audioOnly: {
    text: 'Transcribe and analyze this audio',
    images: [],
    videos: [],
    audio: generateMockAudio(3),
    urls: [],
  },
  urlsOnly: {
    text: 'Summarize these web pages',
    images: [],
    videos: [],
    audio: [],
    urls: generateMockUrls(5),
  },
  fullMultimodal: generateMockMultimodalInput(),
};

/**
 * Helper to create a complete mock response with all fields
 */
export function createCompleteMockResponse(
  scenario: keyof typeof MOCK_SCENARIOS = 'fullMultimodal'
): {
  input: ReturnType<typeof generateMockMultimodalInput>;
  response: GeminiMultimodalResponse;
} {
  const input = MOCK_SCENARIOS[scenario];
  const responseScenario = 
    scenario === 'raceAnalysis' ? 'race-analysis' :
    scenario === 'tireAnalysis' ? 'tire-analysis' :
    scenario === 'driverCoaching' ? 'driver-coaching' :
    scenario === 'strategy' ? 'strategy' :
    'general';
  
  return {
    input: input as ReturnType<typeof generateMockMultimodalInput>,
    response: generateMockMultimodalResponse(responseScenario as any),
  };
}

