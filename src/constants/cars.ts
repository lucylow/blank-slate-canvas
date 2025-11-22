// Toyota GR Car constants with colors and metadata
// Used for telemetry visualization, filtering, and UI badges

export type GRCarId = 'supra' | 'yaris' | 'gr86' | 'corolla';

export interface GRCarConfig {
  id: GRCarId;
  name: string;
  color: string;
  shortName: string;
}

export const GR_CARS: GRCarConfig[] = [
  { 
    id: 'supra', 
    name: 'GR Supra', 
    color: '#EF4444', // Red
    shortName: 'Supra'
  },
  { 
    id: 'yaris', 
    name: 'GR Yaris', 
    color: '#10B981', // Green
    shortName: 'Yaris'
  },
  { 
    id: 'gr86', 
    name: 'GR86', 
    color: '#3B82F6', // Blue
    shortName: 'GR86'
  },
  { 
    id: 'corolla', 
    name: 'GR Corolla', 
    color: '#F59E0B', // Orange/Amber
    shortName: 'Corolla'
  },
];

// Map car ID to config for quick lookup
export const GR_CAR_MAP: Record<GRCarId, GRCarConfig> = GR_CARS.reduce(
  (acc, car) => {
    acc[car.id] = car;
    return acc;
  },
  {} as Record<GRCarId, GRCarConfig>
);

// Helper to get car config by ID
export function getCarConfig(carId: string | null | undefined): GRCarConfig | null {
  if (!carId) return null;
  return GR_CAR_MAP[carId as GRCarId] || null;
}

// Default visibility state (all cars visible)
export const DEFAULT_VISIBLE_CARS: Record<GRCarId, boolean> = GR_CARS.reduce(
  (acc, car) => {
    acc[car.id] = true;
    return acc;
  },
  {} as Record<GRCarId, boolean>
);

