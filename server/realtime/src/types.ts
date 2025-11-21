// server/realtime/src/types.ts

export type RawSource = string;

export interface TelemetryPoint {
  meta_time: string;        // ISO timestamp
  track: string;
  chassis: string;
  lap: number;
  lapdist_m: number;
  speed_kmh: number;
  accx_can?: number;
  accy_can?: number;
  Steering_Angle?: number;
  pbrake_f?: number;
  rpm?: number;
  raw_source?: RawSource;
  // optional: other vendor fields can be present
  [key: string]: string | number | undefined;
}

export interface AggregateResult {
  chassis: string;
  track?: string;
  lap?: number;
  lap_tire_stress: number;
  perSectorStress: { [sectorIndex: number]: number };
  predicted_loss_per_lap_seconds: number;
  laps_until_0_5s_loss: number;
  meta?: Record<string, string | number | boolean>;
}

export type TelemetryUpdateMessage = {
  type: 'telemetry_update';
  data: TelemetryPoint[]; // batched
};

export type AggregateUpdateMessage = {
  type: 'aggregate_update';
  data: AggregateResult[];
};

export type InsightUpdateMessage = {
  type: 'insight_update';
  data: AggregateResult[]; // reuse AggregateResult shape for demo
};

