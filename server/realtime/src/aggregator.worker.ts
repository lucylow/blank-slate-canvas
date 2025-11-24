// server/realtime/src/aggregator.worker.ts

import { parentPort } from "worker_threads";
import { TelemetryPoint, AggregateResult } from "./types";

function sampleTireStress(p: TelemetryPoint): number {
  const ax = Number(p.accx_can || 0);
  const ay = Number(p.accy_can || 0);
  const steer = Math.abs(Number(p.Steering_Angle || 0)) / 360.0;
  return ax * ax + ay * ay + steer * steer;
}

interface Sector {
  start_m: number;
  end_m: number;
}

function computeSectorIndex(sectors: Sector[] | undefined, lapdist: number): number {
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

interface EnhancedMetrics {
  avgSpeed: number;
  maxSpeed: number;
  avgAcceleration: number;
  maxAcceleration: number;
  avgBraking: number;
  maxBraking: number;
  avgCornering: number;
  maxCornering: number;
  sectorTimes: Record<number, { time: number; count: number }>;
  consistency: number;
  performanceTrend: 'improving' | 'stable' | 'degrading';
}

type BatchMessage = {
  type: "BATCH";
  points: TelemetryPoint[];
  sectors?: Record<string, { sectors?: Sector[] }>;
  track?: string;
};

parentPort?.on("message", (msg: BatchMessage) => {
  if (msg.type !== "BATCH") return;

  const points = msg.points;
  const sectorsMeta = msg.sectors;

  // Enhanced aggregation with more metrics
  const chassisAgg: Record<string, {
    perSectorStress: Record<number, number>;
    lapStress: number;
    lastLap: number;
    metrics: EnhancedMetrics;
    points: TelemetryPoint[];
    timestamps: number[];
  }> = {};

  // First pass: collect all points and basic aggregations
  for (const p of points) {
    const key = p.chassis || `${p.track}_${p.lap || 0}`;
    if (!chassisAgg[key]) {
      chassisAgg[key] = {
        perSectorStress: {},
        lapStress: 0,
        lastLap: p.lap || 0,
        metrics: {
          avgSpeed: 0,
          maxSpeed: 0,
          avgAcceleration: 0,
          maxAcceleration: 0,
          avgBraking: 0,
          maxBraking: 0,
          avgCornering: 0,
          maxCornering: 0,
          sectorTimes: {},
          consistency: 0,
          performanceTrend: 'stable'
        },
        points: [],
        timestamps: []
      };
    }

    const agg = chassisAgg[key];
    const stress = sampleTireStress(p);
    const trackMeta = sectorsMeta ? sectorsMeta[p.track || ''] : undefined;
    const sidx = computeSectorIndex(trackMeta?.sectors, Number(p.lapdist_m || 0));

    agg.perSectorStress[sidx] = (agg.perSectorStress[sidx] || 0) + stress;
    agg.lapStress += stress;
    agg.lastLap = p.lap || agg.lastLap;
    agg.points.push(p);
    
    const ts = new Date(p.meta_time || Date.now()).getTime();
    agg.timestamps.push(ts);

    // Collect metrics
    const speed = Number(p.speed_kmh || 0);
    const accx = Number(p.accx_can || 0);
    const accy = Number(p.accy_can || 0);
    const braking = Number(p.pbrake_f || 0);
    const cornering = Math.abs(Number(p.Steering_Angle || 0));

    agg.metrics.maxSpeed = Math.max(agg.metrics.maxSpeed, speed);
    agg.metrics.maxAcceleration = Math.max(agg.metrics.maxAcceleration, accx);
    agg.metrics.maxBraking = Math.max(agg.metrics.maxBraking, braking);
    agg.metrics.maxCornering = Math.max(agg.metrics.maxCornering, cornering);
  }

  // Second pass: calculate averages and advanced metrics
  const results: AggregateResult[] = [];

  for (const k of Object.keys(chassisAgg)) {
    const agg = chassisAgg[k];
    const pointCount = agg.points.length;

    if (pointCount === 0) continue;

    // Calculate averages
    let sumSpeed = 0, sumAccx = 0, sumBraking = 0, sumCornering = 0;
    for (const p of agg.points) {
      sumSpeed += Number(p.speed_kmh || 0);
      sumAccx += Number(p.accx_can || 0);
      sumBraking += Number(p.pbrake_f || 0);
      sumCornering += Math.abs(Number(p.Steering_Angle || 0));
    }

    agg.metrics.avgSpeed = sumSpeed / pointCount;
    agg.metrics.avgAcceleration = sumAccx / pointCount;
    agg.metrics.avgBraking = sumBraking / pointCount;
    agg.metrics.avgCornering = sumCornering / pointCount;

    // Calculate sector times (simplified - based on timestamps)
    if (agg.timestamps.length > 1) {
      const timeSpan = (Math.max(...agg.timestamps) - Math.min(...agg.timestamps)) / 1000; // seconds
      const sectorsMeta = msg.sectors ? msg.sectors[k.split('_')[0]] : undefined;
      const sectorCount = sectorsMeta?.sectors?.length || 3;
      
      for (let i = 0; i < sectorCount; i++) {
        if (!agg.metrics.sectorTimes[i]) {
          agg.metrics.sectorTimes[i] = { time: 0, count: 0 };
        }
        // Estimate sector time based on points in sector
        const sectorPoints = agg.points.filter(p => {
          const sidx = computeSectorIndex(sectorsMeta?.sectors, Number(p.lapdist_m || 0));
          return sidx === i;
        });
        if (sectorPoints.length > 0) {
          agg.metrics.sectorTimes[i].time += (timeSpan * sectorPoints.length) / pointCount;
          agg.metrics.sectorTimes[i].count += sectorPoints.length;
        }
      }
    }

    // Calculate consistency (coefficient of variation of speed)
    const speeds = agg.points.map(p => Number(p.speed_kmh || 0)).filter(s => s > 0);
    if (speeds.length > 1) {
      const mean = speeds.reduce((a, b) => a + b, 0) / speeds.length;
      const variance = speeds.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / speeds.length;
      const stdDev = Math.sqrt(variance);
      agg.metrics.consistency = mean > 0 ? (1 - (stdDev / mean)) * 100 : 0; // Higher is better
    }

    // Performance trend (simplified - compare first half vs second half average speed)
    if (agg.points.length > 10) {
      const mid = Math.floor(agg.points.length / 2);
      const firstHalf = agg.points.slice(0, mid);
      const secondHalf = agg.points.slice(mid);
      
      const firstAvg = firstHalf.reduce((sum, p) => sum + Number(p.speed_kmh || 0), 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, p) => sum + Number(p.speed_kmh || 0), 0) / secondHalf.length;
      
      const diff = secondAvg - firstAvg;
      if (diff > 2) agg.metrics.performanceTrend = 'improving';
      else if (diff < -2) agg.metrics.performanceTrend = 'degrading';
      else agg.metrics.performanceTrend = 'stable';
    }

    // Tire wear predictions
    const predicted_loss_per_lap_seconds = Number((agg.lapStress * 0.00005).toFixed(3));
    const laps_until_0_5s_loss = Number(Math.max(1, (0.5 / (predicted_loss_per_lap_seconds || 0.01))).toFixed(2));

    // Enhanced result with all metrics
    results.push({
      chassis: k,
      track: msg.track,
      lap: agg.lastLap,
      lap_tire_stress: agg.lapStress,
      perSectorStress: agg.perSectorStress,
      predicted_loss_per_lap_seconds,
      laps_until_0_5s_loss,
      meta: {
        avgSpeed: Number(agg.metrics.avgSpeed.toFixed(2)),
        maxSpeed: Number(agg.metrics.maxSpeed.toFixed(2)),
        avgAcceleration: Number(agg.metrics.avgAcceleration.toFixed(3)),
        maxAcceleration: Number(agg.metrics.maxAcceleration.toFixed(3)),
        avgBraking: Number(agg.metrics.avgBraking.toFixed(2)),
        maxBraking: Number(agg.metrics.maxBraking.toFixed(2)),
        avgCornering: Number(agg.metrics.avgCornering.toFixed(2)),
        maxCornering: Number(agg.metrics.maxCornering.toFixed(2)),
        consistency: Number(agg.metrics.consistency.toFixed(2)),
        performanceTrend: agg.metrics.performanceTrend,
        sectorTimes: Object.fromEntries(
          Object.entries(agg.metrics.sectorTimes).map(([k, v]) => [
            k,
            v.count > 0 ? Number((v.time / v.count).toFixed(3)) : 0
          ])
        ),
        pointCount
      }
    });
  }

  parentPort?.postMessage({ type: "AGGREGATES", results, ts: Date.now() });
});

