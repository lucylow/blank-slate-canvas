import React, { useMemo } from 'react';
import { TrackPoint } from '../utils/trackUtils';
import { theme, getTireWearColor, getTireWearOpacity } from '../styles/theme';

export interface CarData {
  id: string;
  chassis: string;
  x: number; // pixel coordinates
  y: number;
  heading?: number; // degrees
  color?: string;
  speed?: number; // km/h
  tire_wear?: number; // 0-1
  selected?: boolean;
  lap?: number;
  lapdist_m?: number;
  // Additional telemetry for tooltips
  tire_temp_fl?: number;
  tire_temp_fr?: number;
  tire_temp_rl?: number;
  tire_temp_rr?: number;
  predicted_laps_to_cliff?: number;
}

interface TrackMapSVGProps {
  centerline: TrackPoint[];
  cars: CarData[];
  width?: number;
  height?: number;
  onCarClick?: (car: CarData) => void;
  onCarHover?: (car: CarData | null) => void;
  showLabels?: boolean;
  showPredictedPath?: boolean;
  selectedCarId?: string | null;
}

export default function TrackMapSVG({
  centerline,
  cars,
  width = 1000,
  height = 600,
  onCarClick = () => {},
  onCarHover = () => {},
  showLabels = true,
  showPredictedPath = false,
  selectedCarId = null,
}: TrackMapSVGProps) {
  const pathD = useMemo(() => {
    if (!centerline || centerline.length === 0) return '';
    return centerline
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * width} ${p.y * height}`)
      .join(' ');
  }, [centerline, width, height]);

  const handleCarClick = (car: CarData) => {
    onCarClick(car);
  };

  const handleCarMouseEnter = (car: CarData) => {
    onCarHover(car);
  };

  const handleCarMouseLeave = () => {
    onCarHover(null);
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      role="img"
      aria-label="Track map with race cars"
      style={{ background: theme.colors.background }}
    >
      {/* Track baseline */}
      <path
        d={pathD}
        fill="none"
        stroke={theme.colors.trackLine}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sector overlays (placeholder - can be enhanced with actual sector data) */}
      {/* Example: shaded bands for sectors with stress heatmap */}

      {/* Car markers */}
      {cars.map((car) => {
        const isSelected = car.selected || car.id === selectedCarId;
        const tireWear = car.tire_wear ?? 0;
        const wearColor = getTireWearColor(tireWear);
        const wearOpacity = getTireWearOpacity(tireWear);
        const carColor = car.color || theme.colors.grRed;
        const heading = car.heading || 0;

        return (
          <g
            key={car.id}
            transform={`translate(${car.x}, ${car.y}) rotate(${heading})`}
            onMouseEnter={() => handleCarMouseEnter(car)}
            onMouseLeave={handleCarMouseLeave}
            onClick={() => handleCarClick(car)}
            style={{ cursor: 'pointer' }}
          >
            {/* Pulsing halo for selected car */}
            {isSelected && (
              <circle
                cx={0}
                cy={0}
                r={18}
                fill="none"
                stroke={theme.colors.grRed}
                strokeWidth={2}
                strokeOpacity={0.6}
                className="animate-pulse"
              />
            )}

            {/* Tire wear glow ring */}
            <circle
              cx={0}
              cy={0}
              r={12}
              fill="none"
              stroke={wearColor}
              strokeOpacity={wearOpacity}
              strokeWidth={6}
            />

            {/* Car body rectangle */}
            <g transform="translate(-10, -6)">
              <rect
                width={20}
                height={12}
                rx={2}
                fill={carColor}
                stroke="#222"
                strokeWidth={0.6}
                opacity={isSelected ? 1 : 0.9}
              />
              {/* Car number/chassis indicator */}
              <text
                x={10}
                y={9}
                fontSize={8}
                fill="#fff"
                textAnchor="middle"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                {car.chassis.slice(-2) || car.id.slice(-2)}
              </text>
            </g>

            {/* Speed indicator (small dot) */}
            {car.speed !== undefined && (
              <circle
                cx={14}
                cy={-8}
                r={3}
                fill={car.speed > 200 ? theme.colors.critical : theme.colors.healthy}
                opacity={0.8}
              />
            )}

            {/* Label with chassis name */}
            {showLabels && (
              <text
                x={16}
                y={-6}
                fontSize={12}
                fill={theme.colors.textPrimary}
                fontWeight="medium"
                style={{ pointerEvents: 'none' }}
              >
                {car.chassis}
              </text>
            )}

            {/* Predicted path (dashed line ahead) */}
            {showPredictedPath && car.speed && (
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={-30}
                stroke={theme.colors.info}
                strokeWidth={2}
                strokeDasharray="4 4"
                opacity={0.5}
                transform={`rotate(${heading})`}
              />
            )}
          </g>
        );
      })}

      {/* Tooltip will be rendered via React portal or separate component */}
    </svg>
  );
}


