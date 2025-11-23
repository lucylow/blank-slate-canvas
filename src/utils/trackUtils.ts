/**
 * Track utility functions for mapping lap distance to XY coordinates
 * and working with track centerlines
 */

export interface TrackPoint {
  m: number; // cumulative meters from start
  x: number; // normalized x coordinate (0..1) or pixel space
  y: number; // normalized y coordinate (0..1) or pixel space
}

export interface PointAtDistanceResult {
  x: number;
  y: number;
  segmentIndex: number;
  segmentT: number;
}

/**
 * Maps a lap distance (in meters) to XY coordinates on the track centerline
 * @param centerline - Array of track points sorted by cumulative distance (m) ascending
 * @param m - Distance in meters (can wrap around track length)
 * @returns Point coordinates and segment information
 */
export function pointAtDistance(
  centerline: TrackPoint[],
  m: number
): PointAtDistanceResult {
  if (!centerline || centerline.length === 0) {
    return { x: 0, y: 0, segmentIndex: 0, segmentT: 0 };
  }

  // Wrap lap distance to track length
  const total = centerline[centerline.length - 1].m;
  if (total <= 0) {
    return { x: centerline[0].x, y: centerline[0].y, segmentIndex: 0, segmentT: 0 };
  }

  // Handle wrapping for multi-lap scenarios
  m = ((m % total) + total) % total;

  // Binary search for the segment containing this distance
  let lo = 0;
  let hi = centerline.length - 1;

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (centerline[mid].m <= m) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  // Ensure we have valid indices
  const i = Math.max(1, Math.min(lo, centerline.length - 1));
  const a = centerline[i - 1];
  const b = centerline[i];

  // Linear interpolation between points
  const segmentLength = b.m - a.m || 1;
  const t = (m - a.m) / segmentLength;
  const x = a.x + (b.x - a.x) * t;
  const y = a.y + (b.y - a.y) * t;

  return {
    x,
    y,
    segmentIndex: i - 1,
    segmentT: t,
  };
}

/**
 * Calculates the total track length from centerline
 */
export function getTrackLength(centerline: TrackPoint[]): number {
  if (!centerline || centerline.length === 0) return 0;
  return centerline[centerline.length - 1].m;
}

/**
 * Converts normalized coordinates (0..1) to pixel coordinates
 */
export function normalizeToPixels(
  point: TrackPoint,
  width: number,
  height: number
): { x: number; y: number } {
  return {
    x: point.x * width,
    y: point.y * height,
  };
}

/**
 * Finds the nearest point on the centerline to a given XY coordinate
 * Useful for click-to-select or drag interactions
 */
export function nearestPointOnTrack(
  centerline: TrackPoint[],
  x: number,
  y: number,
  width: number = 1,
  height: number = 1
): { point: TrackPoint; distance: number; index: number } {
  if (!centerline || centerline.length === 0) {
    return {
      point: { m: 0, x: 0, y: 0 },
      distance: Infinity,
      index: 0,
    };
  }

  let minDistance = Infinity;
  let nearestIndex = 0;
  let nearestPoint = centerline[0];

  for (let i = 0; i < centerline.length; i++) {
    const p = centerline[i];
    const px = p.x * width;
    const py = p.y * height;
    const distance = Math.sqrt((px - x) ** 2 + (py - y) ** 2);

    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
      nearestPoint = p;
    }
  }

  return {
    point: nearestPoint,
    distance: minDistance,
    index: nearestIndex,
  };
}

