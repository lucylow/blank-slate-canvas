// server/realtime/src/aggregator.worker.ts

import { parentPort } from "worker_threads";
import { TelemetryPoint, AggregateResult } from "./types";

function sampleTireStress(p: TelemetryPoint): number {
  const ax = Number(p.accx_can || 0);
  const ay = Number(p.accy_can || 0);
  const steer = Math.abs(Number(p.Steering_Angle || 0)) / 360.0;
  return ax * ax + ay * ay + steer * steer;
}

function computeSectorIndex(sectors: any[] | undefined, lapdist: number): number {
  if (!sectors || sectors.length === 0) {
    const total = 5000;
    const len = total / 3;
    if (lapdist < len) return 0;
    if (lapdist < len * 2) return 1;
    return 2;
  }

  for (let i = 0; i < sectors.length; i++) {
    const s = sectors[i];
    if (lapdist >= s.start_m && lapdist < s.end_m) return i;
  }

  return sectors.length - 1;
}

type BatchMessage = {
  type: "BATCH";
  points: TelemetryPoint[];
  sectors?: Record<string, any>;
  track?: string;
};

parentPort?.on("message", (msg: BatchMessage) => {
  if (msg.type !== "BATCH") return;

  const points = msg.points;
  const sectorsMeta = msg.sectors;

  const chassisAgg: Record<string, { perSectorStress: Record<number, number>; lapStress: number; lastLap: number }> = {};

  for (const p of points) {
    const key = p.chassis || `${p.track}_${p.lap || 0}`;
    if (!chassisAgg[key]) chassisAgg[key] = { perSectorStress: {}, lapStress: 0, lastLap: p.lap || 0 };

    const agg = chassisAgg[key];
    const stress = sampleTireStress(p);
    const trackMeta = sectorsMeta ? sectorsMeta[p.track] : undefined;
    const sidx = computeSectorIndex(trackMeta?.sectors, Number(p.lapdist_m || 0));

    agg.perSectorStress[sidx] = (agg.perSectorStress[sidx] || 0) + stress;
    agg.lapStress += stress;
    agg.lastLap = p.lap || agg.lastLap;
  }

  const results: AggregateResult[] = [];

  for (const k of Object.keys(chassisAgg)) {
    const agg = chassisAgg[k];
    const predicted_loss_per_lap_seconds = Number((agg.lapStress * 0.00005).toFixed(3));
    const laps_until_0_5s_loss = Number(Math.max(1, (0.5 / (predicted_loss_per_lap_seconds || 0.01))).toFixed(2));

    results.push({
      chassis: k,
      track: msg.track,
      lap: agg.lastLap,
      lap_tire_stress: agg.lapStress,
      perSectorStress: agg.perSectorStress,
      predicted_loss_per_lap_seconds,
      laps_until_0_5s_loss
    });
  }

  parentPort?.postMessage({ type: "AGGREGATES", results, ts: Date.now() });
});

