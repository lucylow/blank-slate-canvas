// src/data/mock_cv_track_analysis.ts

export interface CVDetectedFeature {
  type: 'turn' | 'straight' | 'sector_line' | 'speed_trap' | 'pit_lane' | 'logo' | 'surface_anomaly' | 'track_variation';
  confidence: number;
  coordinates: { x: number; y: number }; // Normalized 0-1 coordinates (Top-Left origin)
  label?: string;
}

export interface CVImageAnalysis {
  resolution: string;
  dominantColors: string[];
}

export interface CVComplexityMetrics {
  cornerCount: number;
  trackWidthVariance: number; // 0-1 scale, higher means wider variance
  curvatureScore: number; // 0-1 scale, higher is twistier
}

export interface CVAnalysisResult {
  trackId: string;
  metadata: {
    extractedName: string;
    ocrText: string[];
  };
  imageAnalysis: CVImageAnalysis;
  detectedFeatures: CVDetectedFeature[];
  complexityMetrics: CVComplexityMetrics;
}

export const CV_TRACK_DATA: CVAnalysisResult[] = [
  {
    trackId: 'road_america',
    metadata: {
      extractedName: 'Road America',
      ocrText: ['4.014 miles', '14', 'AL KAMEL', 'S1', 'S2', 'S3']
    },
    imageAnalysis: {
      resolution: '1920x1080',
      dominantColors: ['#333333', '#2E8B57', '#FF0000'] // Asphalt, Grass, Curbs
    },
    detectedFeatures: [
      { type: 'sector_line', confidence: 0.98, coordinates: { x: 0.2, y: 0.8 }, label: 'S1' },
      { type: 'sector_line', confidence: 0.97, coordinates: { x: 0.5, y: 0.4 }, label: 'S2' },
      { type: 'turn', confidence: 0.95, coordinates: { x: 0.15, y: 0.85 }, label: 'T5' }, // Bottom-left-ish
      { type: 'turn', confidence: 0.99, coordinates: { x: 0.8, y: 0.1 }, label: 'T12' }, // Canada Corner area
      { type: 'speed_trap', confidence: 0.92, coordinates: { x: 0.75, y: 0.15 }, label: 'ST' }, // Long straight before 12
      { type: 'turn', confidence: 0.96, coordinates: { x: 0.85, y: 0.3 }, label: '14' }
    ],
    complexityMetrics: {
      cornerCount: 14,
      trackWidthVariance: 0.15,
      curvatureScore: 0.45
    }
  },
  {
    trackId: 'indianapolis_motor_speedway',
    metadata: {
      extractedName: 'Indianapolis Motor Speedway',
      ocrText: ['2.439 miles', '14 turns', 'Road Course', 'Indianapolis']
    },
    imageAnalysis: {
      resolution: '1920x1080',
      dominantColors: ['#444444', '#3CB371', '#CCCCCC']
    },
    detectedFeatures: [
      { type: 'straight', confidence: 0.99, coordinates: { x: 0.1, y: 0.5 }, label: 'Main Straight' },
      { type: 'pit_lane', confidence: 0.96, coordinates: { x: 0.15, y: 0.55 }, label: 'Pit In' },
      { type: 'pit_lane', confidence: 0.96, coordinates: { x: 0.15, y: 0.45 }, label: 'Pit Out' },
      { type: 'turn', confidence: 0.89, coordinates: { x: 0.5, y: 0.6 }, label: 'Infield Section' }
    ],
    complexityMetrics: {
      cornerCount: 14,
      trackWidthVariance: 0.2,
      curvatureScore: 0.35
    }
  },
  {
    trackId: 'barber_motorsports_park',
    metadata: {
      extractedName: 'Barber Motorsports Park',
      ocrText: ['2.28 miles', 'Al Kamel Systems', 'Alabama']
    },
    imageAnalysis: {
      resolution: '1920x1080',
      dominantColors: ['#2F4F4F', '#228B22', '#FFFFFF'] // Heavy green/park aesthetic
    },
    detectedFeatures: [
      { type: 'turn', confidence: 0.98, coordinates: { x: 0.3, y: 0.3 }, label: 'T2' },
      { type: 'turn', confidence: 0.95, coordinates: { x: 0.7, y: 0.7 }, label: 'T12' },
      { type: 'logo', confidence: 0.85, coordinates: { x: 0.9, y: 0.1 }, label: 'Spider' }, // Simulating logo detection
      { type: 'sector_line', confidence: 0.91, coordinates: { x: 0.5, y: 0.5 }, label: 'S2' }
    ],
    complexityMetrics: {
      cornerCount: 17, // Often cited differently, CV counted 17 visual turns
      trackWidthVariance: 0.3,
      curvatureScore: 0.88 // Very technical
    }
  },
  {
    trackId: 'cota',
    metadata: {
      extractedName: 'Circuit of the Americas',
      ocrText: ['3.416 Miles', 'COTA', 'Austin', 'Speed Trap']
    },
    imageAnalysis: {
      resolution: '2048x1536', // Higher res for complex track
      dominantColors: ['#1C1C1C', '#B22222', '#1E90FF', '#FFFFFF'] // Red/Blue runoffs
    },
    detectedFeatures: [
      { type: 'turn', confidence: 0.99, coordinates: { x: 0.1, y: 0.1 }, label: 'T1' }, // Big hill top-left
      { type: 'turn', confidence: 0.94, coordinates: { x: 0.4, y: 0.3 }, label: 'Esses' },
      { type: 'turn', confidence: 0.97, coordinates: { x: 0.15, y: 0.8 }, label: 'T11' },
      { type: 'speed_trap', confidence: 0.93, coordinates: { x: 0.5, y: 0.85 }, label: 'ST' }, // Back straight
      { type: 'turn', confidence: 0.96, coordinates: { x: 0.6, y: 0.8 }, label: 'T12' },
      { type: 'surface_anomaly', confidence: 0.88, coordinates: { x: 0.3, y: 0.3 }, label: 'Runoff Pattern' }
    ],
    complexityMetrics: {
      cornerCount: 20,
      trackWidthVariance: 0.4, // Wide straights, tight corners
      curvatureScore: 0.75
    }
  },
  {
    trackId: 'sebring_international_raceway',
    metadata: {
      extractedName: 'Sebring International Raceway',
      ocrText: ['3.74 Miles', '17 turns', 'Respect the Bumps']
    },
    imageAnalysis: {
      resolution: '1920x1080',
      dominantColors: ['#808080', '#A9A9A9', '#000000'] // Concrete/Asphalt mix
    },
    detectedFeatures: [
      { type: 'turn', confidence: 0.98, coordinates: { x: 0.9, y: 0.8 }, label: 'T17 (Sunset)' }, // Bottom right
      { type: 'turn', confidence: 0.95, coordinates: { x: 0.1, y: 0.2 }, label: 'T1' },
      { type: 'turn', confidence: 0.92, coordinates: { x: 0.8, y: 0.2 }, label: 'Hairpin' },
      { type: 'surface_anomaly', confidence: 0.82, coordinates: { x: 0.9, y: 0.85 }, label: 'Surface Noise/Bumps' },
      { type: 'surface_anomaly', confidence: 0.80, coordinates: { x: 0.1, y: 0.25 }, label: 'Concrete Seams' }
    ],
    complexityMetrics: {
      cornerCount: 17,
      trackWidthVariance: 0.5, // Very wide in parts
      curvatureScore: 0.55
    }
  },
  {
    trackId: 'sonoma_raceway',
    metadata: {
      extractedName: 'Sonoma Raceway',
      ocrText: ['2.505 Miles', '12 turns', 'S/F']
    },
    imageAnalysis: {
      resolution: '1920x1080',
      dominantColors: ['#555555', '#F4A460', '#8B4513'] // Dry hills/dirt aesthetic
    },
    detectedFeatures: [
      { type: 'turn', confidence: 0.96, coordinates: { x: 0.5, y: 0.2 }, label: 'T2' },
      { type: 'track_variation', confidence: 0.89, coordinates: { x: 0.6, y: 0.4 }, label: 'The Chute' },
      { type: 'turn', confidence: 0.98, coordinates: { x: 0.9, y: 0.8 }, label: 'T11' }, // Bottom right hairpin
      { type: 'turn', confidence: 0.92, coordinates: { x: 0.4, y: 0.5 }, label: 'Carousel' }
    ],
    complexityMetrics: {
      cornerCount: 12,
      trackWidthVariance: 0.25,
      curvatureScore: 0.82
    }
  },
  {
    trackId: 'virginia_international_raceway',
    metadata: {
      extractedName: 'Virginia International Raceway',
      ocrText: ['3.27 Miles', 'VIR', 'North Course']
    },
    imageAnalysis: {
      resolution: '1920x1080',
      dominantColors: ['#2F4F4F', '#90EE90', '#000000']
    },
    detectedFeatures: [
      { type: 'turn', confidence: 0.99, coordinates: { x: 0.5, y: 0.7 }, label: 'Oak Tree' }, // Distinct feature
      { type: 'turn', confidence: 0.94, coordinates: { x: 0.2, y: 0.3 }, label: 'Roller Coaster' },
      { type: 'sector_line', confidence: 0.90, coordinates: { x: 0.3, y: 0.5 }, label: 'Esses Start' },
      { type: 'straight', confidence: 0.95, coordinates: { x: 0.6, y: 0.4 }, label: 'Back Straight' }
    ],
    complexityMetrics: {
      cornerCount: 17,
      trackWidthVariance: 0.1, // Narrow/Technical
      curvatureScore: 0.70
    }
  }
];

