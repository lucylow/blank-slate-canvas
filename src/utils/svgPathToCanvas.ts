// src/utils/svgPathToCanvas.ts
// Utilities for converting SVG paths to Canvas-compatible coordinate arrays

export interface Point {
  x: number;
  y: number;
}

export interface PathProperties {
  points: Point[];
  totalLength: number;
  viewBox: { x: number; y: number; width: number; height: number };
}

/**
 * Convert SVG path string to array of points for Canvas rendering
 * Uses a temporary SVG element to extract points at regular intervals
 */
export async function svgPathToPoints(
  pathData: string,
  viewBox: string | null,
  pointCount: number = 500
): Promise<PathProperties> {
  // Create a temporary SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', pathData);
  svg.appendChild(path);
  document.body.appendChild(svg);
  svg.style.position = 'absolute';
  svg.style.visibility = 'hidden';
  svg.style.width = '0';
  svg.style.height = '0';

  try {
    // Get path length
    const totalLength = path.getTotalLength();
    
    // Extract points along the path
    const points: Point[] = [];
    for (let i = 0; i <= pointCount; i++) {
      const distance = (i / pointCount) * totalLength;
      const point = path.getPointAtLength(distance);
      points.push({ x: point.x, y: point.y });
    }

    // Parse viewBox
    let parsedViewBox = { x: 0, y: 0, width: 1000, height: 1000 };
    if (viewBox) {
      const [x, y, width, height] = viewBox.split(' ').map(Number);
      parsedViewBox = { x: x || 0, y: y || 0, width: width || 1000, height: height || 1000 };
    }

    return {
      points,
      totalLength,
      viewBox: parsedViewBox,
    };
  } finally {
    document.body.removeChild(svg);
  }
}

/**
 * Get point along path by distance ratio (0-1)
 */
export function getPointAtRatio(points: Point[], ratio: number): Point {
  const index = Math.floor(ratio * (points.length - 1));
  const nextIndex = Math.min(index + 1, points.length - 1);
  const localRatio = (ratio * (points.length - 1)) - index;
  
  const current = points[index];
  const next = points[nextIndex];
  
  return {
    x: current.x + (next.x - current.x) * localRatio,
    y: current.y + (next.y - current.y) * localRatio,
  };
}

/**
 * Get tangent angle at a point along the path
 */
export function getAngleAtRatio(points: Point[], ratio: number): number {
  const index = Math.floor(ratio * (points.length - 1));
  const nextIndex = Math.min(index + 1, points.length - 1);
  
  const current = points[index];
  const next = points[nextIndex];
  
  return Math.atan2(next.y - current.y, next.x - current.x);
}
