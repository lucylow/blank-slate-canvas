/**
 * Computer Vision Track Analysis Data
 * 
 * This file simulates the output of a Computer Vision model that has "scanned" 
 * PDF track maps and extracted path geometry, turn numbers, and special zones.
 * 
 * The data structure represents:
 * - Track nodes: The optimal racing line with normalized coordinates
 * - CV Features: Detected corners, straights, pit lanes, and speed traps
 * - Track characteristics: Dominant features for each track
 */

export interface TrackNode {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  dist: number; // Distance from start (meters)
  optimalSpeed: number; // KPH (derived from curvature analysis)
  curvature?: number; // Radius of curvature (meters, lower = tighter)
  elevation?: number; // Relative elevation change (-1 to 1)
}

export interface CVFeature {
  id: string;
  type: 'corner' | 'straight' | 'pit_entry' | 'pit_exit' | 'speed_trap' | 'chicane' | 'hairpin';
  label: string;
  location: { x: number; y: number };
  sector: 1 | 2 | 3;
  difficultyScore?: number; // 0-10 based on CV curvature analysis
  brakingZone?: boolean; // Whether this is a heavy braking zone
  overtakingZone?: boolean; // Whether overtaking is common here
  notes?: string; // Additional CV-detected characteristics
}

export interface TrackAnalysis {
  id: string;
  name: string;
  totalLength: number; // meters
  nodes: TrackNode[]; // The "racing line" detected by CV
  features: CVFeature[];
  dominantCharacteristics: string[]; // e.g., "High Downforce", "Bumpy"
  sectors: {
    sector1: { start: number; end: number }; // Distance markers in meters
    sector2: { start: number; end: number };
    sector3: { start: number; end: number };
  };
  elevationChange?: number; // Total elevation change in meters
  averageSpeed?: number; // Average optimal speed in KPH
}

/**
 * Helper to generate smoother curves between points for mock data
 * Uses Catmull-Rom spline interpolation for realistic track curves
 */
const interpolate = (
  points: number[][],
  steps: number,
  trackLength: number
): TrackNode[] => {
  const nodes: TrackNode[] = [];
  let distAcc = 0;
  const segmentLength = trackLength / (points.length * steps);

  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + points.length) % points.length];
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const p3 = points[(i + 2) % points.length];

    for (let j = 0; j < steps; j++) {
      const t = j / steps;
      
      // Catmull-Rom spline interpolation
      const t2 = t * t;
      const t3 = t2 * t;
      
      const x = 0.5 * (
        (2 * p1[0]) +
        (-p0[0] + p2[0]) * t +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
      );
      
      const y = 0.5 * (
        (2 * p1[1]) +
        (-p0[1] + p2[1]) * t +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
      );

      // Calculate curvature (simplified - based on angle change)
      const angle1 = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
      const angle2 = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
      const angleDiff = Math.abs(angle1 - angle2);
      const curvature = angleDiff > 0.1 ? 50 + Math.random() * 100 : 200 + Math.random() * 300;

      // Optimal speed based on curvature (tighter corners = slower)
      const optimalSpeed = Math.max(60, 250 - (curvature / 10));

      // Elevation change (simulated)
      const elevation = Math.sin(distAcc / 100) * 0.3 + (Math.random() - 0.5) * 0.2;

      nodes.push({
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
        dist: distAcc,
        optimalSpeed,
        curvature,
        elevation
      });

      distAcc += segmentLength;
    }
  }

  return nodes;
};

/**
 * Get track analysis by ID
 */
export const getTrackAnalysis = (trackId: string): TrackAnalysis | null => {
  return TRACK_CV_DATA[trackId] || null;
};

/**
 * Get all available track IDs
 */
export const getAvailableTrackIds = (): string[] => {
  return Object.keys(TRACK_CV_DATA);
};

/**
 * Find the nearest track node to a given position
 */
export const findNearestNode = (
  track: TrackAnalysis,
  x: number,
  y: number
): TrackNode | null => {
  if (!track.nodes.length) return null;

  let minDist = Infinity;
  let nearest: TrackNode | null = null;

  for (const node of track.nodes) {
    const dist = Math.sqrt(
      Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = node;
    }
  }

  return nearest;
};

/**
 * Get features in a specific sector
 */
export const getFeaturesBySector = (
  track: TrackAnalysis,
  sector: 1 | 2 | 3
): CVFeature[] => {
  return track.features.filter(f => f.sector === sector);
};

export const TRACK_CV_DATA: Record<string, TrackAnalysis> = {
  cota: {
    id: 'cota',
    name: 'Circuit of the Americas',
    totalLength: 5513,
    dominantCharacteristics: ['Technical', 'Elevation Change', 'High Speed Straights'],
    sectors: {
      sector1: { start: 0, end: 1837 },
      sector2: { start: 1837, end: 3674 },
      sector3: { start: 3674, end: 5513 }
    },
    elevationChange: 41,
    averageSpeed: 185,
    nodes: interpolate(
      [
        [0.1, 0.8], [0.1, 0.1], [0.4, 0.3], [0.15, 0.8],
        [0.5, 0.85], [0.6, 0.8], [0.6, 0.6], [0.1, 0.8]
      ],
      50,
      5513
    ),
    features: [
      {
        id: 't1',
        type: 'corner',
        label: 'T1 (Big Red)',
        location: { x: 0.1, y: 0.1 },
        sector: 1,
        difficultyScore: 9,
        brakingZone: true,
        overtakingZone: true,
        notes: 'Heavy braking from 320+ kph, elevation drop'
      },
      {
        id: 'esses',
        type: 'corner',
        label: 'Esses (T3-T6)',
        location: { x: 0.4, y: 0.3 },
        sector: 1,
        difficultyScore: 8,
        notes: 'High-speed S-curves, critical for sector time'
      },
      {
        id: 'st_back',
        type: 'speed_trap',
        label: 'Speed Trap',
        location: { x: 0.5, y: 0.85 },
        sector: 2,
        notes: 'Back straight speed measurement'
      },
      {
        id: 'pit_entry',
        type: 'pit_entry',
        label: 'Pit Entry',
        location: { x: 0.6, y: 0.75 },
        sector: 3
      },
      {
        id: 'pit_exit',
        type: 'pit_exit',
        label: 'Pit Exit',
        location: { x: 0.1, y: 0.75 },
        sector: 1
      }
    ]
  },

  barber: {
    id: 'barber',
    name: 'Barber Motorsports Park',
    totalLength: 3830,
    dominantCharacteristics: ['Flowing', 'Blind Crests', 'Technical'],
    sectors: {
      sector1: { start: 0, end: 1277 },
      sector2: { start: 1277, end: 2554 },
      sector3: { start: 2554, end: 3830 }
    },
    elevationChange: 25,
    averageSpeed: 165,
    nodes: interpolate(
      [
        [0.2, 0.8], [0.2, 0.5], [0.5, 0.2], [0.8, 0.4],
        [0.7, 0.7], [0.4, 0.6], [0.2, 0.8]
      ],
      40,
      3830
    ),
    features: [
      {
        id: 't2',
        type: 'corner',
        label: 'Turn 2',
        location: { x: 0.2, y: 0.5 },
        sector: 1,
        difficultyScore: 7,
        brakingZone: true
      },
      {
        id: 'museum',
        type: 'corner',
        label: 'Museum Turn',
        location: { x: 0.8, y: 0.4 },
        sector: 2,
        difficultyScore: 8,
        notes: 'Blind crest, late apex critical'
      },
      {
        id: 'pit_entry',
        type: 'pit_entry',
        label: 'Pit Entry',
        location: { x: 0.7, y: 0.65 },
        sector: 3
      }
    ]
  },

  road_america: {
    id: 'road_america',
    name: 'Road America',
    totalLength: 6515,
    dominantCharacteristics: ['Very High Speed', 'Heavy Braking', 'Long Laps'],
    sectors: {
      sector1: { start: 0, end: 2172 },
      sector2: { start: 2172, end: 4344 },
      sector3: { start: 4344, end: 6515 }
    },
    elevationChange: 55,
    averageSpeed: 195,
    nodes: interpolate(
      [
        [0.1, 0.9], [0.1, 0.5], [0.3, 0.5], [0.3, 0.1],
        [0.7, 0.1], [0.7, 0.3], [0.9, 0.5], [0.9, 0.8], [0.1, 0.9]
      ],
      60,
      6515
    ),
    features: [
      {
        id: 't1',
        type: 'corner',
        label: 'Turn 1',
        location: { x: 0.1, y: 0.5 },
        sector: 1,
        difficultyScore: 8,
        brakingZone: true,
        overtakingZone: true,
        notes: 'Heavy braking from 300+ kph'
      },
      {
        id: 'canada',
        type: 'corner',
        label: 'Canada Corner',
        location: { x: 0.9, y: 0.8 },
        sector: 3,
        difficultyScore: 9,
        brakingZone: true,
        notes: 'Fastest corner, critical for lap time'
      },
      {
        id: 'kink',
        type: 'corner',
        label: 'The Kink',
        location: { x: 0.7, y: 0.15 },
        sector: 2,
        difficultyScore: 10,
        notes: 'Flat-out commitment corner, no room for error'
      },
      {
        id: 'pit_entry',
        type: 'pit_entry',
        label: 'Pit Entry',
        location: { x: 0.9, y: 0.7 },
        sector: 3
      }
    ]
  },

  sebring: {
    id: 'sebring',
    name: 'Sebring International Raceway',
    totalLength: 6020,
    dominantCharacteristics: ['Bumpy', 'Concrete Surface', 'Night Racing'],
    sectors: {
      sector1: { start: 0, end: 2007 },
      sector2: { start: 2007, end: 4014 },
      sector3: { start: 4014, end: 6020 }
    },
    elevationChange: 8,
    averageSpeed: 175,
    nodes: interpolate(
      [
        [0.1, 0.2], [0.9, 0.2], [0.95, 0.4], [0.8, 0.5],
        [0.6, 0.8], [0.2, 0.8], [0.1, 0.4], [0.1, 0.2]
      ],
      55,
      6020
    ),
    features: [
      {
        id: 'sunset',
        type: 'corner',
        label: 'Sunset Bend',
        location: { x: 0.9, y: 0.2 },
        sector: 3,
        difficultyScore: 10,
        brakingZone: true,
        notes: 'Extremely bumpy, high-speed commitment'
      },
      {
        id: 'hairpin',
        type: 'hairpin',
        label: 'Hairpin',
        location: { x: 0.6, y: 0.8 },
        sector: 2,
        difficultyScore: 7,
        brakingZone: true,
        overtakingZone: true
      },
      {
        id: 't17',
        type: 'corner',
        label: 'Turn 17',
        location: { x: 0.1, y: 0.3 },
        sector: 1,
        difficultyScore: 8,
        notes: 'Bumpy concrete, tricky exit'
      },
      {
        id: 'pit_entry',
        type: 'pit_entry',
        label: 'Pit Entry',
        location: { x: 0.2, y: 0.75 },
        sector: 2
      }
    ]
  },

  indy: {
    id: 'indy',
    name: 'Indianapolis Motor Speedway Road Course',
    totalLength: 4149,
    dominantCharacteristics: ['High Speed', 'Technical Infield', 'Oval Section'],
    sectors: {
      sector1: { start: 0, end: 1383 },
      sector2: { start: 1383, end: 2766 },
      sector3: { start: 2766, end: 4149 }
    },
    elevationChange: 5,
    averageSpeed: 190,
    nodes: interpolate(
      [
        [0.5, 0.1], [0.9, 0.2], [0.9, 0.8], [0.5, 0.9],
        [0.1, 0.8], [0.1, 0.2], [0.5, 0.1]
      ],
      45,
      4149
    ),
    features: [
      {
        id: 't1',
        type: 'corner',
        label: 'Turn 1',
        location: { x: 0.5, y: 0.1 },
        sector: 1,
        difficultyScore: 8,
        brakingZone: true,
        overtakingZone: true,
        notes: 'Entry to infield section'
      },
      {
        id: 'oval',
        type: 'straight',
        label: 'Oval Section',
        location: { x: 0.9, y: 0.5 },
        sector: 2,
        notes: 'High-speed banking'
      },
      {
        id: 'pit_entry',
        type: 'pit_entry',
        label: 'Pit Entry',
        location: { x: 0.5, y: 0.05 },
        sector: 1
      }
    ]
  },

  sonoma: {
    id: 'sonoma',
    name: 'Sonoma Raceway',
    totalLength: 3854,
    dominantCharacteristics: ['Elevation Change', 'Technical', 'Tight Corners'],
    sectors: {
      sector1: { start: 0, end: 1285 },
      sector2: { start: 1285, end: 2569 },
      sector3: { start: 2569, end: 3854 }
    },
    elevationChange: 60,
    averageSpeed: 160,
    nodes: interpolate(
      [
        [0.2, 0.9], [0.2, 0.5], [0.5, 0.2], [0.8, 0.3],
        [0.9, 0.6], [0.7, 0.8], [0.4, 0.9], [0.2, 0.9]
      ],
      42,
      3854
    ),
    features: [
      {
        id: 't1',
        type: 'corner',
        label: 'Turn 1',
        location: { x: 0.2, y: 0.5 },
        sector: 1,
        difficultyScore: 9,
        brakingZone: true,
        overtakingZone: true,
        notes: 'Steep uphill braking zone'
      },
      {
        id: 'carousel',
        type: 'corner',
        label: 'The Carousel',
        location: { x: 0.8, y: 0.3 },
        sector: 2,
        difficultyScore: 8,
        notes: 'Long, sweeping corner'
      },
      {
        id: 'pit_entry',
        type: 'pit_entry',
        label: 'Pit Entry',
        location: { x: 0.3, y: 0.95 },
        sector: 3
      }
    ]
  },

  vir: {
    id: 'vir',
    name: 'Virginia International Raceway',
    totalLength: 5284,
    dominantCharacteristics: ['Elevation Change', 'Blind Corners', 'High Speed'],
    sectors: {
      sector1: { start: 0, end: 1761 },
      sector2: { start: 1761, end: 3522 },
      sector3: { start: 3522, end: 5284 }
    },
    elevationChange: 45,
    averageSpeed: 180,
    nodes: interpolate(
      [
        [0.1, 0.8], [0.1, 0.3], [0.4, 0.1], [0.7, 0.2],
        [0.9, 0.5], [0.8, 0.8], [0.5, 0.9], [0.1, 0.8]
      ],
      52,
      5284
    ),
    features: [
      {
        id: 'oak_tree',
        type: 'corner',
        label: 'Oak Tree',
        location: { x: 0.1, y: 0.3 },
        sector: 1,
        difficultyScore: 9,
        brakingZone: true,
        notes: 'Blind, downhill braking'
      },
      {
        id: 'roller_coaster',
        type: 'corner',
        label: 'Roller Coaster',
        location: { x: 0.4, y: 0.1 },
        sector: 1,
        difficultyScore: 8,
        notes: 'Elevation change through corner'
      },
      {
        id: 'pit_entry',
        type: 'pit_entry',
        label: 'Pit Entry',
        location: { x: 0.1, y: 0.75 },
        sector: 3
      }
    ]
  }
};


