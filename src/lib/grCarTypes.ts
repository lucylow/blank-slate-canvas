// Type definitions for Toyota GR car comparison data

export type DrivetrainType = "RWD" | "AWD";
export type TransmissionType = "6MT" | "8AT" | "6MT/8AT" | "6MT/6AT" | "6MT/8AT ZF";
export type TrackId = "sonoma" | "road-america" | "vir" | "cota" | "barber" | "indianapolis" | "sebring";

export interface GRCarSpecs {
  model: string;
  engine: string;
  drivetrain: DrivetrainType;
  power_hp: number;
  torque_nm: number;
  weight_kg: number;
  transmission: TransmissionType;
  accel_0_100: number; // seconds
  advantages: string;
  notes: {
    best_tracks: TrackId[];
    description?: string;
  };
}

export interface TrackPerformance {
  track: TrackId;
  trackName: string;
  performance: {
    [key: string]: string; // car model -> performance description
  };
  strengths: {
    [key: string]: string[]; // car model -> array of strengths
  };
  weaknesses: {
    [key: string]: string[]; // car model -> array of weaknesses
  };
  telemetry_focus: string[]; // What telemetry metrics matter most
}

export interface GRCarComparisonData {
  cars: GRCarSpecs[];
  trackPerformance: TrackPerformance[];
  trackCarMatrix: {
    track: TrackId;
    trackName: string;
    cars: {
      model: string;
      rating: "Excellent" | "Good" | "Average" | "Challenging";
      notes: string;
    }[];
  }[];
}


