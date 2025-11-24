/**
 * InteractiveTrackMap Component
 * 
 * Renders an interactive SVG track map with:
 * - Real-time car positioning
 * - Heatmap overlays (speed, brake, throttle)
 * - Sector visualization
 * - Turn markers
 * - Zoom and pan controls
 * - Hover tooltips
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { TRACK_GEOMETRY, getPointAtPathPercentage, getSectorForProgress, type TrackDefinition } from '../../data/track_geometry';

export interface TelemetryPoint {
  id: string;
  driver: string;
  progress: number; // 0-1 along the path
  speed: number; // km/h
  throttle: number; // 0-1
  brake: number; // 0-1
  lap?: number;
  position?: number;
  color?: string;
}

export interface HeatmapData {
  progress: number; // 0-1
  value: number; // Normalized 0-1
}

interface Props {
  trackId: string;
  telemetryData: TelemetryPoint[];
  overlayMode: 'speed' | 'brake' | 'throttle' | 'none';
  heatmapData?: HeatmapData[]; // Optional pre-computed heatmap data
  onSectorClick?: (sectorId: string) => void;
  onCarClick?: (car: TelemetryPoint) => void;
  showSectors?: boolean;
  showTurns?: boolean;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  panX?: number;
  panY?: number;
  onPanChange?: (x: number, y: number) => void;
  className?: string;
}

const InteractiveTrackMap: React.FC<Props> = ({
  trackId,
  telemetryData,
  overlayMode,
  heatmapData,
  onSectorClick,
  onCarClick,
  showSectors = true,
  showTurns = true,
  zoom = 1,
  onZoomChange,
  panX = 0,
  panY = 0,
  onPanChange,
  className = '',
}) => {
  const track = TRACK_GEOMETRY[trackId];
  const [hoveredCar, setHoveredCar] = useState<string | null>(null);
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);
  const [pathLength, setPathLength] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure path length for car positioning
  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength();
      setPathLength(length);
    }
  }, [trackId]);

  // Calculate car position on SVG path with orientation
  const getCarPosition = useCallback((progress: number) => {
    if (!pathRef.current || pathLength === 0) {
      return { x: 0, y: 0, angle: 0 };
    }
    return getPointAtPathPercentage(pathRef.current, progress);
  }, [pathLength]);

  // Generate heatmap gradient stops from data
  const gradientStops = useMemo(() => {
    if (overlayMode === 'none' || !pathRef.current) return null;

    const stops: React.ReactNode[] = [];
    const numStops = 20;

    // Use provided heatmap data or generate from telemetry
    if (heatmapData && heatmapData.length > 0) {
      // Sort by progress
      const sorted = [...heatmapData].sort((a, b) => a.progress - b.progress);
      
      sorted.forEach((point, idx) => {
        const offset = point.progress * 100;
        const color = getHeatmapColor(point.value, overlayMode);
        stops.push(
          <stop key={`stop-${idx}`} offset={`${offset}%`} stopColor={color} stopOpacity={0.8} />
        );
      });
    } else {
      // Generate mock gradient based on track segments
      for (let i = 0; i <= numStops; i++) {
        const pct = i / numStops;
        const offset = pct * 100;
        
        // Simulate data: fast on straights, slow on turns
        // This is a simplified model - in production, use real telemetry
        let value = 0.5;
        if (overlayMode === 'speed') {
          // Alternate between fast and slow sections
          value = 0.3 + (Math.sin(pct * Math.PI * 4) * 0.3 + 0.4);
        } else if (overlayMode === 'brake') {
          // Higher brake usage in turns
          value = Math.abs(Math.sin(pct * Math.PI * 3)) * 0.8;
        } else if (overlayMode === 'throttle') {
          // Higher throttle on straights
          value = 0.5 + Math.cos(pct * Math.PI * 4) * 0.3;
        }
        
        const color = getHeatmapColor(value, overlayMode);
        stops.push(
          <stop key={`stop-${i}`} offset={`${offset}%`} stopColor={color} stopOpacity={0.7} />
        );
      }
    }

    return stops;
  }, [overlayMode, heatmapData]);

  // Get color for heatmap based on value and mode
  const getHeatmapColor = (value: number, mode: string): string => {
    // Normalize value to 0-1
    const normalized = Math.max(0, Math.min(1, value));
    
    if (mode === 'speed') {
      // Green (slow) to Red (fast)
      if (normalized < 0.33) return '#00FF00';
      if (normalized < 0.66) return '#FFFF00';
      return '#FF0000';
    } else if (mode === 'brake') {
      // Dark (no brake) to Yellow (heavy brake)
      if (normalized < 0.33) return '#333333';
      if (normalized < 0.66) return '#FFA500';
      return '#FFD700';
    } else if (mode === 'throttle') {
      // Dark (no throttle) to Green (full throttle)
      if (normalized < 0.33) return '#000000';
      if (normalized < 0.66) return '#00AA00';
      return '#00FF00';
    }
    return '#555555';
  };

  // Handle mouse wheel for zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!containerRef.current || !onZoomChange) return;
    
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom + delta));
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  // Handle mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onPanChange) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  }, [panX, panY, onPanChange]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !onPanChange) return;
    onPanChange(e.clientX - dragStart.x, e.clientY - dragStart.y);
  }, [isDragging, dragStart, onPanChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset zoom and pan
  const handleResetView = useCallback(() => {
    if (onZoomChange) onZoomChange(1);
    if (onPanChange) onPanChange(0, 0);
  }, [onZoomChange, onPanChange]);

  if (!track) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-400 rounded-xl">
        <div className="text-center">
          <p className="text-lg font-semibold">Track data not found</p>
          <p className="text-sm mt-2">Track ID: {trackId}</p>
        </div>
      </div>
    );
  }

  const gradientId = `track-gradient-${trackId}-${overlayMode}`;
  const [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = track.viewBox.split(' ').map(Number);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-2xl border border-gray-700 ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        ref={svgRef}
        viewBox={track.viewBox}
        className="w-full h-full transition-all duration-300 ease-in-out"
        style={{
          filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.5))',
          transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
          transformOrigin: 'center center',
        }}
      >
        <defs>
          {/* Heatmap Gradient */}
          {overlayMode !== 'none' && gradientStops && (
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {gradientStops}
            </linearGradient>
          )}
          
          {/* Glow filter for cars */}
          <filter id="carGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Base Track Layer */}
        <path
          ref={pathRef}
          d={track.path}
          fill="none"
          stroke={overlayMode !== 'none' ? `url(#${gradientId})` : '#444'}
          strokeWidth="45"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-90 transition-opacity duration-300"
        />

        {/* Track outline for depth */}
        <path
          d={track.path}
          fill="none"
          stroke="#222"
          strokeWidth="50"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-50"
          style={{ filter: 'blur(2px)' }}
        />

        {/* Sector Overlays */}
        {showSectors && track.sectors.map((sector) => {
          const isHovered = hoveredSector === sector.id;
          return (
            <g key={sector.id}>
              {/* Sector path segment - simplified visualization */}
              <path
                d={track.path}
                fill="none"
                stroke={isHovered ? sector.color : 'transparent'}
                strokeWidth="5"
                strokeDasharray={`${(sector.endPct - sector.startPct) * pathLength} ${pathLength}`}
                strokeDashoffset={-sector.startPct * pathLength}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSectorClick && onSectorClick(sector.id)}
                onMouseEnter={() => setHoveredSector(sector.id)}
                onMouseLeave={() => setHoveredSector(null)}
                opacity={isHovered ? 0.6 : 0}
              />
              {/* Sector label */}
              {isHovered && pathRef.current && (
                <SectorLabel
                  path={pathRef.current}
                  pathLength={pathLength}
                  startPct={sector.startPct}
                  endPct={sector.endPct}
                  label={sector.label || sector.id}
                  color={sector.color}
                />
              )}
            </g>
          );
        })}

        {/* Turn Markers */}
        {showTurns && track.turns.map((turn) => (
          <g key={turn.id} className="group cursor-help">
            <circle
              cx={turn.x}
              cy={turn.y}
              r="10"
              fill="#fff"
              stroke="#000"
              strokeWidth="2"
              className="opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <circle
              cx={turn.x}
              cy={turn.y}
              r="6"
              fill="#FFD700"
              className="animate-pulse"
            />
            <text
              x={turn.x + 15}
              y={turn.y}
              fill="white"
              fontSize="12"
              fontWeight="bold"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
            >
              {turn.label}
            </text>
          </g>
        ))}

        {/* Live Cars Layer */}
        {telemetryData.map((car) => {
          const pos = getCarPosition(car.progress);
          const isHovered = hoveredCar === car.id;
          const carColor = car.color || (car.driver === 'Hero' ? '#10B981' : '#EF4444');
          
          return (
            <g
              key={car.id}
              transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.angle})`}
              onMouseEnter={() => setHoveredCar(car.id)}
              onMouseLeave={() => setHoveredCar(null)}
              onClick={() => onCarClick && onCarClick(car)}
              className="cursor-pointer transition-transform duration-100"
            >
              {/* Car Halo/Glow */}
              <circle
                r={isHovered ? 25 : 15}
                fill={carColor}
                opacity={isHovered ? 0.3 : 0.15}
                filter="url(#carGlow)"
              />
              
              {/* Car Body (simplified arrow shape) */}
              <polygon
                points="-8,-4 8,0 -8,4"
                fill={carColor}
                stroke="white"
                strokeWidth="2"
              />
              
              {/* Car Dot */}
              <circle r="4" fill={carColor} stroke="white" strokeWidth="1.5" />

              {/* Tooltip */}
              {isHovered && (
                <g transform="translate(20, -30)">
                  <rect
                    width="160"
                    height="90"
                    rx="6"
                    fill="rgba(0,0,0,0.95)"
                    stroke={carColor}
                    strokeWidth="2"
                  />
                  <text x="10" y="20" fill="white" fontSize="13" fontWeight="bold">
                    {car.driver}
                  </text>
                  <text x="10" y="35" fill="#aaa" fontSize="11">
                    Speed: {car.speed.toFixed(0)} km/h
                  </text>
                  <text x="10" y="50" fill="#aaa" fontSize="11">
                    Throttle: {(car.throttle * 100).toFixed(0)}%
                  </text>
                  <text x="10" y="65" fill="#aaa" fontSize="11">
                    Brake: {(car.brake * 100).toFixed(0)}%
                  </text>
                  {car.lap && (
                    <text x="10" y="80" fill="#aaa" fontSize="11">
                      Lap: {car.lap}
                    </text>
                  )}
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Overlay Controls */}
      <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-sm p-3 rounded-lg border border-gray-700 shadow-xl">
        <div className="text-xs text-gray-400 mb-2 uppercase font-bold tracking-wide">
          Map Overlay
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-green-500 to-red-500"></div>
            <span className="text-xs text-white">
              {overlayMode === 'speed' && 'Speed Heatmap'}
              {overlayMode === 'brake' && 'Brake Heatmap'}
              {overlayMode === 'throttle' && 'Throttle Heatmap'}
              {overlayMode === 'none' && 'No Overlay'}
            </span>
          </div>
          {overlayMode !== 'none' && (
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-300">Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-300">Medium</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-300">High</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Zoom/Pan Controls */}
      {(onZoomChange || onPanChange) && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => onZoomChange && onZoomChange(Math.min(3, zoom + 0.2))}
            className="bg-black/90 backdrop-blur-sm text-white p-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          <button
            onClick={() => onZoomChange && onZoomChange(Math.max(0.5, zoom - 0.2))}
            className="bg-black/90 backdrop-blur-sm text-white p-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={handleResetView}
            className="bg-black/90 backdrop-blur-sm text-white p-2 rounded-lg border border-gray-700 hover:bg-gray-800 transition-colors"
            title="Reset View"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// Helper component for sector labels
const SectorLabel: React.FC<{
  path: SVGPathElement;
  pathLength: number;
  startPct: number;
  endPct: number;
  label: string;
  color: string;
}> = ({ path, pathLength, startPct, endPct, label, color }) => {
  const midPct = (startPct + endPct) / 2;
  const point = getPointAtPathPercentage(path, midPct);
  
  return (
    <g>
      <circle cx={point.x} cy={point.y} r="15" fill={color} opacity="0.3" />
      <text
        x={point.x}
        y={point.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="14"
        fontWeight="bold"
        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
      >
        {label}
      </text>
    </g>
  );
};

export default InteractiveTrackMap;


