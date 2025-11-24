/**
 * Track Geometry Definitions
 * 
 * Defines SVG paths, sectors, and points of interest for 7 major racing tracks.
 * All coordinates are normalized to a 0-1000 scale for consistent rendering.
 */

export interface TrackDefinition {
  id: string;
  name: string;
  path: string; // SVG Path 'd' attribute
  viewBox: string;
  sectors: Sector[];
  turns: Turn[];
  length?: number; // Track length in meters (optional)
  description?: string;
}

export interface Sector {
  id: string;
  color: string;
  startPct: number; // 0-1
  endPct: number; // 0-1
  label?: string;
}

export interface Turn {
  id: string;
  x: number; // Normalized coordinates 0-1000
  y: number;
  label: string;
  type?: 'hairpin' | 'chicane' | 'sweeper' | 'ess';
}

/**
 * Calculate a point along a path at a given percentage
 */
export function getPointAtPathPercentage(
  pathElement: SVGPathElement,
  percentage: number
): { x: number; y: number; angle: number } {
  const length = pathElement.getTotalLength();
  const distance = percentage * length;
  const point = pathElement.getPointAtLength(distance);
  
  // Calculate angle for car orientation
  const lookAhead = Math.min(length, distance + 5);
  const nextPoint = pathElement.getPointAtLength(lookAhead);
  const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);
  
  return { ...point, angle };
}

/**
 * Get sector for a given progress percentage
 */
export function getSectorForProgress(
  sectors: Sector[],
  progress: number
): Sector | null {
  return sectors.find(
    (sector) => progress >= sector.startPct && progress < sector.endPct
  ) || null;
}

// Enhanced track definitions with more accurate geometry
export const TRACK_GEOMETRY: Record<string, TrackDefinition> = {
  road_america: {
    id: 'road_america',
    name: 'Road America',
    viewBox: '0 0 1000 600',
    length: 6400, // meters
    description: '4.014 miles, 14 turns - Fast and flowing with long straights',
    // Improved path: More accurate representation of the track layout
    path: 'M 200,500 L 100,500 C 50,500 50,450 80,400 L 80,350 C 80,300 100,250 150,200 L 200,150 L 300,150 L 400,100 L 500,80 L 600,100 L 700,150 L 800,200 L 850,250 L 900,300 L 920,350 L 900,400 L 850,450 L 800,480 L 700,500 L 500,500 Z',
    sectors: [
      { id: 'S1', color: '#FF5733', startPct: 0, endPct: 0.33, label: 'Sector 1' },
      { id: 'S2', color: '#33FF57', startPct: 0.33, endPct: 0.67, label: 'Sector 2' },
      { id: 'S3', color: '#3357FF', startPct: 0.67, endPct: 1.0, label: 'Sector 3' },
    ],
    turns: [
      { id: 'T1', x: 200, y: 500, label: 'T1', type: 'sweeper' },
      { id: 'T5', x: 300, y: 150, label: 'T5', type: 'ess' },
      { id: 'T12', x: 900, y: 300, label: 'Canada Corner', type: 'sweeper' },
      { id: 'T14', x: 850, y: 450, label: 'T14', type: 'hairpin' },
    ]
  },
  indianapolis_motor_speedway: {
    id: 'indianapolis_motor_speedway',
    name: 'Indianapolis Motor Speedway (Road)',
    viewBox: '0 0 1000 500',
    length: 3900, // meters
    description: '2.439 miles, 14 turns - Unique road course layout',
    // Rectangular outer with infield snake section
    path: 'M 100,400 L 900,400 L 900,350 L 850,300 L 900,250 L 900,100 L 100,100 L 100,150 L 150,200 L 100,250 L 100,300 L 150,350 L 100,400 Z',
    sectors: [
      { id: 'S1', color: '#FFC300', startPct: 0, endPct: 0.4, label: 'Sector 1' },
      { id: 'S2', color: '#C70039', startPct: 0.4, endPct: 0.7, label: 'Sector 2' },
      { id: 'S3', color: '#900C3F', startPct: 0.7, endPct: 1.0, label: 'Sector 3' },
    ],
    turns: [
      { id: 'T1', x: 900, y: 400, label: 'T1', type: 'sweeper' },
      { id: 'Infield', x: 200, y: 300, label: 'Snake', type: 'ess' },
      { id: 'T7', x: 150, y: 200, label: 'T7', type: 'hairpin' },
    ]
  },
  barber_motorsports_park: {
    id: 'barber_motorsports_park',
    name: 'Barber Motorsports Park',
    viewBox: '0 0 800 800',
    length: 3670, // meters
    description: '2.28 miles - Technical and twisty with elevation changes',
    // Technical, twisty layout with multiple elevation changes
    path: 'M 400,700 C 200,700 200,600 250,550 C 300,500 350,450 300,400 C 250,350 200,300 250,250 C 300,200 350,150 400,100 C 500,100 550,150 500,200 C 450,250 400,300 450,350 C 500,400 550,450 500,500 C 450,550 500,600 600,650 C 650,700 500,700 400,700 Z',
    sectors: [
      { id: 'S1', color: '#DAF7A6', startPct: 0, endPct: 0.33, label: 'Sector 1' },
      { id: 'S2', color: '#FFC300', startPct: 0.33, endPct: 0.66, label: 'Sector 2' },
      { id: 'S3', color: '#FF5733', startPct: 0.66, endPct: 1.0, label: 'Sector 3' },
    ],
    turns: [
      { id: 'T2', x: 300, y: 500, label: 'T2', type: 'hairpin' },
      { id: 'Museum', x: 500, y: 300, label: 'Museum', type: 'ess' },
      { id: 'T5', x: 400, y: 200, label: 'T5', type: 'chicane' },
    ]
  },
  cota: {
    id: 'cota',
    name: 'Circuit of the Americas',
    viewBox: '0 0 1000 800',
    length: 5513, // meters
    description: '3.416 miles - Iconic T1 hairpin, Esses, and long back straight',
    // Iconic layout: T1 hairpin top left, Esses section, long back straight
    path: 'M 200,700 L 100,700 C 50,700 50,650 100,600 L 100,500 L 150,400 L 200,300 L 250,200 L 300,150 L 400,200 L 500,250 L 600,300 L 700,350 L 800,400 L 900,450 L 950,500 L 900,600 L 800,650 L 700,700 L 600,700 L 500,650 L 400,600 L 300,550 L 200,600 Z',
    sectors: [
      { id: 'S1', color: '#FF33F6', startPct: 0, endPct: 0.35, label: 'Sector 1' },
      { id: 'S2', color: '#33FFFC', startPct: 0.35, endPct: 0.65, label: 'Sector 2' },
      { id: 'S3', color: '#F3FF33', startPct: 0.65, endPct: 1.0, label: 'Sector 3' },
    ],
    turns: [
      { id: 'T1', x: 200, y: 300, label: 'Big Red', type: 'hairpin' },
      { id: 'Esses', x: 400, y: 250, label: 'Esses', type: 'ess' },
      { id: 'T11', x: 100, y: 500, label: 'T11', type: 'hairpin' },
      { id: 'T12', x: 900, y: 500, label: 'T12', type: 'sweeper' },
    ]
  },
  sebring_international_raceway: {
    id: 'sebring_international_raceway',
    name: 'Sebring International Raceway',
    viewBox: '0 0 1000 600',
    length: 6020, // meters
    description: '3.74 miles - Bumpy concrete surface, challenging layout',
    // Bumpy, old airfield layout with long straights
    path: 'M 100,500 L 900,500 C 950,500 950,450 900,400 L 850,350 L 900,250 L 850,150 L 700,100 L 500,100 L 400,150 L 300,200 L 200,250 L 100,300 L 100,400 Z',
    sectors: [
      { id: 'S1', color: '#AABBCC', startPct: 0, endPct: 0.3, label: 'Sector 1' },
      { id: 'S2', color: '#CCBBAA', startPct: 0.3, endPct: 0.6, label: 'Sector 2' },
      { id: 'S3', color: '#BBAACC', startPct: 0.6, endPct: 1.0, label: 'Sector 3' },
    ],
    turns: [
      { id: 'T17', x: 900, y: 450, label: 'Sunset Bend', type: 'sweeper' },
      { id: 'T7', x: 800, y: 300, label: 'Hairpin', type: 'hairpin' },
      { id: 'T1', x: 100, y: 300, label: 'T1', type: 'sweeper' },
    ]
  },
  sonoma_raceway: {
    id: 'sonoma_raceway',
    name: 'Sonoma Raceway',
    viewBox: '0 0 800 600',
    length: 4030, // meters
    description: '2.505 miles - Hilly and technical with elevation changes',
    // Hilly, tight layout with elevation changes
    path: 'M 200,500 C 100,500 100,400 150,350 L 200,300 C 250,250 300,200 400,200 L 500,250 L 600,300 L 700,350 L 750,400 L 700,450 L 600,500 L 500,500 L 400,450 L 300,400 L 200,500 Z',
    sectors: [
      { id: 'S1', color: '#FF9933', startPct: 0, endPct: 0.4, label: 'Sector 1' },
      { id: 'S2', color: '#3399FF', startPct: 0.4, endPct: 0.7, label: 'Sector 2' },
      { id: 'S3', color: '#9933FF', startPct: 0.7, endPct: 1.0, label: 'Sector 3' },
    ],
    turns: [
      { id: 'T2', x: 200, y: 300, label: 'T2', type: 'hairpin' },
      { id: 'Carousel', x: 700, y: 350, label: 'Carousel', type: 'sweeper' },
      { id: 'T11', x: 750, y: 400, label: 'T11', type: 'hairpin' },
    ]
  },
  virginia_international_raceway: {
    id: 'virginia_international_raceway',
    name: 'Virginia International Raceway',
    viewBox: '0 0 900 600',
    length: 5260, // meters
    description: '3.27 miles - Fast flowing with iconic Oak Tree corner',
    // Fast flowing layout with long straights and technical sections
    path: 'M 200,500 L 100,400 L 150,300 L 200,200 L 300,100 L 500,100 L 700,150 L 800,250 L 750,350 L 700,400 L 600,450 L 500,500 L 400,500 L 300,450 L 200,500 Z',
    sectors: [
      { id: 'S1', color: '#50C878', startPct: 0, endPct: 0.3, label: 'Sector 1' },
      { id: 'S2', color: '#E34234', startPct: 0.3, endPct: 0.6, label: 'Sector 2' },
      { id: 'S3', color: '#4169E1', startPct: 0.6, endPct: 1.0, label: 'Sector 3' },
    ],
    turns: [
      { id: 'OakTree', x: 600, y: 450, label: 'Oak Tree', type: 'sweeper' },
      { id: 'Esses', x: 300, y: 150, label: 'Esses', type: 'ess' },
      { id: 'RollerCoaster', x: 200, y: 300, label: 'Roller Coaster', type: 'ess' },
    ]
  }
};

/**
 * Get all available track IDs
 */
export function getTrackIds(): string[] {
  return Object.keys(TRACK_GEOMETRY);
}

/**
 * Get track definition by ID
 */
export function getTrackById(id: string): TrackDefinition | undefined {
  return TRACK_GEOMETRY[id];
}

/**
 * Validate track definition
 */
export function validateTrackDefinition(track: TrackDefinition): boolean {
  if (!track.id || !track.name || !track.path || !track.viewBox) {
    return false;
  }
  if (track.sectors.some(s => s.startPct < 0 || s.endPct > 1 || s.startPct >= s.endPct)) {
    return false;
  }
  return true;
}

