// server/realtime/src/index.ts

import fs from "fs";
import http from "http";
import path from "path";
import Fastify from "fastify";
import WebSocket from "ws";
import { Worker } from "worker_threads";
import { RingBuffer } from "./ringbuffer";
import { TelemetryPoint, AggregateResult, GapAnalysis, RealTimeInsight } from "./types";
import { startUdpListener } from "./udp_listener";
import { pollBucketPrefix } from "./s3_watcher";
import * as cfg from "./config";

const ring = new RingBuffer<TelemetryPoint>(cfg.RINGBUFFER_SIZE);

// Metrics tracking
interface ServerMetrics {
  messagesReceived: number;
  messagesBroadcast: number;
  wsClients: number;
  aggregationsProcessed: number;
  errors: number;
  lastMetricsTime: number;
  processingTimes: number[];
}

const metrics: ServerMetrics = {
  messagesReceived: 0,
  messagesBroadcast: 0,
  wsClients: 0,
  aggregationsProcessed: 0,
  errors: 0,
  lastMetricsTime: Date.now(),
  processingTimes: []
};

// Worker pool for parallel aggregation processing
class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private pendingTasks: Array<{ batch: TelemetryPoint[]; sectors: any; track: string; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private workerCount: number;

  constructor(count: number = cfg.AGGREGATOR_WORKER_COUNT) {
    this.workerCount = count;
    this.initializeWorkers();
  }

  private initializeWorkers() {
    const workerPath = path.join(__dirname, "aggregator.worker.js");
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker(workerPath);
      
      // Set up message handler for this worker
      worker.on("message", (result) => {
        // Worker is now available again
        this.availableWorkers.push(worker);
        // Process next pending task if any
        this.processNextPendingTask();
      });
      
      worker.on("error", (err) => {
        console.error(`Worker ${i} error:`, err);
        metrics.errors++;
        // Restart worker
        this.restartWorker(i);
      });
      
      worker.on("exit", (code) => {
        if (code !== 0) {
          console.log(`Worker ${i} exited with code ${code}`);
          this.restartWorker(i);
        }
      });
      
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  private restartWorker(index: number) {
    const oldWorker = this.workers[index];
    if (oldWorker) {
      try {
        oldWorker.terminate();
      } catch (e) {
        // Ignore termination errors
      }
    }
    
    const workerPath = path.join(__dirname, "aggregator.worker.js");
    const newWorker = new Worker(workerPath);
    
    newWorker.on("message", (result) => {
      this.availableWorkers.push(newWorker);
      this.processNextPendingTask();
    });
    
    newWorker.on("error", (err) => {
      console.error(`Worker ${index} error:`, err);
      metrics.errors++;
    });
    
    this.workers[index] = newWorker;
    this.availableWorkers.push(newWorker);
  }

  private processNextPendingTask() {
    if (this.pendingTasks.length > 0 && this.availableWorkers.length > 0) {
      const worker = this.availableWorkers.shift()!;
      const task = this.pendingTasks.shift()!;
      
      worker.once("message", (result) => {
        this.availableWorkers.push(worker);
        task.resolve(result);
        // Process next pending task
        this.processNextPendingTask();
      });
      
      worker.postMessage({ 
        type: "BATCH", 
        points: task.batch, 
        sectors: task.sectors, 
        track: task.track 
      });
    }
  }

  async processBatch(batch: TelemetryPoint[], sectors: any, track: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.availableWorkers.length > 0) {
        const worker = this.availableWorkers.shift()!;
        worker.once("message", (result) => {
          this.availableWorkers.push(worker);
          resolve(result);
          // Process next pending task
          this.processNextPendingTask();
        });
        worker.postMessage({ type: "BATCH", points: batch, sectors, track });
      } else {
        // Queue task if no workers available
        this.pendingTasks.push({ batch, sectors, track, resolve, reject });
      }
    });
  }

  shutdown() {
    this.workers.forEach(worker => {
      try {
        worker.terminate();
      } catch (e) {
        // Ignore termination errors
      }
    });
    this.workers = [];
    this.availableWorkers = [];
    this.pendingTasks = [];
  }
}

interface TrackSector {
  start_m: number;
  end_m: number;
}

interface TrackSectorsData {
  sectors?: TrackSector[];
}

// load track sectors
let trackSectors: Record<string, TrackSectorsData> = {};
try {
  trackSectors = JSON.parse(fs.readFileSync(cfg.TRACK_SECTORS_PATH, "utf8"));
} catch (e) {
  console.warn("track sectors not found / invalid; continuing with defaults");
}

// Initialize worker pool
const workerPool = new WorkerPool(cfg.AGGREGATOR_WORKER_COUNT);

// Gap analysis computation
function computeGapAnalysis(results: AggregateResult[]): GapAnalysis[] {
  if (results.length === 0) return [];

  // Sort by average speed (proxy for position)
  const sorted = [...results].sort((a, b) => {
    const speedA = a.meta?.avgSpeed || 0;
    const speedB = b.meta?.avgSpeed || 0;
    return speedB - speedA; // Descending
  });

  const gaps: GapAnalysis[] = [];
  const leaderSpeed = sorted[0]?.meta?.avgSpeed || 0;

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const currentSpeed = current.meta?.avgSpeed || 0;
    const ahead = i > 0 ? sorted[i - 1] : null;
    const behind = i < sorted.length - 1 ? sorted[i + 1] : null;

    // Estimate gaps based on speed differential (simplified)
    const gapToLeader = leaderSpeed > 0 
      ? ((leaderSpeed - currentSpeed) / leaderSpeed) * 100 // percentage gap
      : 0;
    
    const gapToAhead = ahead && currentSpeed > 0
      ? ((ahead.meta?.avgSpeed || 0) - currentSpeed) / currentSpeed * 100
      : null;

    const gapToBehind = behind && currentSpeed > 0
      ? (currentSpeed - (behind.meta?.avgSpeed || 0)) / currentSpeed * 100
      : null;

    // Overtaking opportunity: within 2% speed and behind someone
    const overtakingOpportunity = ahead !== null && gapToAhead !== null && gapToAhead < 2 && gapToAhead > 0;
    
    // Under pressure: someone close behind (within 1% speed)
    const underPressure = behind !== null && gapToBehind !== null && gapToBehind < 1 && gapToBehind > 0;

    gaps.push({
      chassis: current.chassis,
      position: i + 1,
      gapToLeader: Number(gapToLeader.toFixed(2)),
      gapToAhead: gapToAhead !== null ? Number(gapToAhead.toFixed(2)) : null,
      gapToBehind: gapToBehind !== null ? Number(gapToBehind.toFixed(2)) : null,
      relativeSpeed: Number((currentSpeed - leaderSpeed).toFixed(2)),
      overtakingOpportunity,
      underPressure
    });
  }

  return gaps;
}

// Generate real-time insights
function generateInsights(results: AggregateResult[], gaps: GapAnalysis[]): RealTimeInsight[] {
  const insights: RealTimeInsight[] = [];
  const now = Date.now();

  for (const result of results) {
    // Tire wear insights
    if (result.laps_until_0_5s_loss < 5) {
      insights.push({
        type: 'tire_wear',
        severity: result.laps_until_0_5s_loss < 2 ? 'critical' : 'high',
        message: `Critical tire wear: ${result.laps_until_0_5s_loss.toFixed(1)} laps until 0.5s loss`,
        chassis: result.chassis,
        timestamp: now,
        data: {
          laps_until_loss: result.laps_until_0_5s_loss,
          predicted_loss_per_lap: result.predicted_loss_per_lap_seconds
        }
      });
    } else if (result.laps_until_0_5s_loss < 10) {
      insights.push({
        type: 'tire_wear',
        severity: 'medium',
        message: `Tire wear monitoring: ${result.laps_until_0_5s_loss.toFixed(1)} laps until significant loss`,
        chassis: result.chassis,
        timestamp: now,
        data: { laps_until_loss: result.laps_until_0_5s_loss }
      });
    }

    // Performance degradation
    if (result.meta?.performanceTrend === 'degrading') {
      insights.push({
        type: 'performance',
        severity: 'medium',
        message: `Performance degrading - consider strategy adjustment`,
        chassis: result.chassis,
        timestamp: now,
        data: {
          trend: result.meta.performanceTrend,
          consistency: result.meta.consistency
        }
      });
    }

    // Low consistency alert
    if (result.meta?.consistency !== undefined && result.meta.consistency < 80) {
      insights.push({
        type: 'performance',
        severity: 'low',
        message: `Low consistency detected: ${result.meta.consistency.toFixed(1)}%`,
        chassis: result.chassis,
        timestamp: now,
        data: { consistency: result.meta.consistency }
      });
    }
  }

  // Gap analysis insights
  for (const gap of gaps) {
    if (gap.overtakingOpportunity) {
      insights.push({
        type: 'gap_analysis',
        severity: 'low',
        message: `Overtaking opportunity: ${gap.gapToAhead?.toFixed(2)}% gap to car ahead`,
        chassis: gap.chassis,
        timestamp: now,
        data: {
          gapToAhead: gap.gapToAhead,
          position: gap.position
        }
      });
    }

    if (gap.underPressure) {
      insights.push({
        type: 'gap_analysis',
        severity: 'medium',
        message: `Under pressure: ${gap.gapToBehind?.toFixed(2)}% gap to car behind`,
        chassis: gap.chassis,
        timestamp: now,
        data: {
          gapToBehind: gap.gapToBehind,
          position: gap.position
        }
      });
    }
  }

  return insights;
}

// fastify
const fastify = Fastify({ logger: false });

fastify.get("/api/health", async (req, reply) => {
  const elapsed = (Date.now() - metrics.lastMetricsTime) / 1000;
  const msgRate = elapsed > 0 ? metrics.messagesReceived / elapsed : 0;
  const avgProcessingTime = metrics.processingTimes.length > 0
    ? metrics.processingTimes.reduce((a, b) => a + b, 0) / metrics.processingTimes.length
    : 0;
  
  return reply.send({ 
    ok: true, 
    now: new Date().toISOString(), 
    demo: cfg.DEMO_DATA_PATH,
    metrics: {
      messagesReceived: metrics.messagesReceived,
      messagesBroadcast: metrics.messagesBroadcast,
      wsClients: wss.clients.size,
      aggregationsProcessed: metrics.aggregationsProcessed,
      errors: metrics.errors,
      messageRate: msgRate.toFixed(2),
      avgProcessingTimeMs: avgProcessingTime.toFixed(2),
      ringBufferSize: ring.size
    }
  });
});

fastify.get("/api/recent/:n", async (req, reply) => {
  const params = req.params as { n?: string };
  const n = Math.min(5000, Number(params.n || 200));
  return reply.send({ recent: ring.snapshot(n) });
});

fastify.post("/api/ingest", async (req, reply) => {
  const p = req.body;
  if (Array.isArray(p)) {
    for (const item of p) ring.push(item);
  } else {
    ring.push(p as TelemetryPoint);
  }
  return reply.send({ ok: true });
});

// http + ws
const server = http.createServer(fastify.server);
const wss = new WebSocket.Server({ server, path: cfg.WS_PATH, maxPayload: 1 << 20 });

// Backpressure-aware broadcasting with rate limiting
function broadcast(msg: string, skipIfBackpressure: boolean = true) {
  const buf = Buffer.from(msg);
  let sent = 0;
  let skipped = 0;
  
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      // Check backpressure
      if (client.bufferedAmount > cfg.MAX_WS_BUFFER) {
        if (skipIfBackpressure) {
          skipped++;
          continue;
        }
      }
      
      try {
        client.send(buf, (err) => {
          if (err) {
            console.warn("ws send err", (err as Error).message);
            metrics.errors++;
          } else {
            metrics.messagesBroadcast++;
          }
        });
        sent++;
      } catch (err) {
        console.warn("ws send exception", err);
        metrics.errors++;
      }
    }
  }
  
  // Log if many clients skipped due to backpressure
  if (skipped > 0 && skipped > wss.clients.size * 0.5) {
    console.warn(`High backpressure: skipped ${skipped}/${wss.clients.size} clients`);
  }
  
  return { sent, skipped };
}

// Optimized periodic batch processing with worker pool
setInterval(async () => {
  if (ring.size === 0) return;
  
  const batchStart = Date.now();
  const batchSize = 500;
  const batch = ring.snapshot(batchSize);
  
  if (batch.length === 0) return;
  
  try {
    const result = await workerPool.processBatch(batch, trackSectors, "unknown");
    
    if (result && result.type === "AGGREGATES") {
      metrics.aggregationsProcessed++;
      
      // Compute gap analysis
      const gaps = computeGapAnalysis(result.results);
      
      // Generate insights
      const insights = generateInsights(result.results, gaps);
      
      // Enhanced payload with all analysis
      const payload = JSON.stringify({ 
        type: "insight_update", 
        data: result.results,
        gaps: gaps,
        insights: insights,
        meta: { 
          generated_at: new Date(result.ts).toISOString(),
          vehicle_count: result.results.length,
          analysis_version: "2.0"
        } 
      });
      broadcast(payload);
    }
    
    const processingTime = Date.now() - batchStart;
    metrics.processingTimes.push(processingTime);
    if (metrics.processingTimes.length > 100) {
      metrics.processingTimes = metrics.processingTimes.slice(-100);
    }
  } catch (err) {
    console.error("Batch processing error:", err);
    metrics.errors++;
  }
}, cfg.BATCH_MS);

// Optimized batching with adaptive sizing
let rawBatch: TelemetryPoint[] = [];
let lastBroadcast = Date.now();
const BATCH_SIZE = 50; // Increased batch size for better throughput
const MAX_BATCH_DELAY = 200; // Max delay in ms before forcing broadcast

function onParsed(parsed: TelemetryPoint) {
  if (!parsed.meta_time) parsed.meta_time = new Date().toISOString();
  
  metrics.messagesReceived++;
  rawBatch.push(parsed);
  
  const timeSinceLastBroadcast = Date.now() - lastBroadcast;
  const shouldBroadcast = 
    rawBatch.length >= BATCH_SIZE || 
    timeSinceLastBroadcast >= MAX_BATCH_DELAY;
  
  if (shouldBroadcast && rawBatch.length > 0) {
    const payload = JSON.stringify({ type: "telemetry_update", data: rawBatch });
    broadcast(payload);
    rawBatch = [];
    lastBroadcast = Date.now();
  }
}

// start UDP
startUdpListener(ring, onParsed);

// optionally poll S3
if (process.env.S3_BUCKET && process.env.S3_PREFIX) {
  pollBucketPrefix(process.env.S3_BUCKET, process.env.S3_PREFIX, ring, onParsed, 60 * 1000);
}

// demo replay (if demo file present)
if (fs.existsSync(cfg.DEMO_DATA_PATH)) {
  try {
    const demoRaw = JSON.parse(fs.readFileSync(cfg.DEMO_DATA_PATH, "utf8"));
    const points: TelemetryPoint[] = Array.isArray(demoRaw) ? demoRaw : (demoRaw.telemetry || []);
    let i = 0;
    setInterval(() => {
      const p = points[i % points.length];
      if (p) {
        p.raw_source = "demo";
        ring.push(p);
        onParsed(p);
      }
      i++;
    }, 100); // 10Hz
  } catch (e) {
    console.warn("failed to read demo data", e);
  }
}

// Metrics logging interval
setInterval(() => {
  const elapsed = (Date.now() - metrics.lastMetricsTime) / 1000;
  if (elapsed > 0) {
    const msgRate = metrics.messagesReceived / elapsed;
    const broadcastRate = metrics.messagesBroadcast / elapsed;
    const avgProcessingTime = metrics.processingTimes.length > 0
      ? metrics.processingTimes.reduce((a, b) => a + b, 0) / metrics.processingTimes.length
      : 0;
    
    console.log(
      `Metrics: received=${metrics.messagesReceived} (${msgRate.toFixed(1)}/s), ` +
      `broadcast=${metrics.messagesBroadcast} (${broadcastRate.toFixed(1)}/s), ` +
      `clients=${wss.clients.size}, ` +
      `aggregations=${metrics.aggregationsProcessed}, ` +
      `errors=${metrics.errors}, ` +
      `avg_processing=${avgProcessingTime.toFixed(2)}ms, ` +
      `ring_size=${ring.size}`
    );
    
    // Reset metrics
    metrics.messagesReceived = 0;
    metrics.messagesBroadcast = 0;
    metrics.aggregationsProcessed = 0;
    metrics.errors = 0;
    metrics.lastMetricsTime = Date.now();
    metrics.processingTimes = [];
  }
}, 60000); // Log every minute

// WebSocket connection tracking
wss.on("connection", (ws) => {
  metrics.wsClients = wss.clients.size;
  ws.on("close", () => {
    metrics.wsClients = wss.clients.size;
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  workerPool.shutdown();
  wss.close(() => {
    server.close(() => {
      process.exit(0);
    });
  });
});

server.listen(cfg.HTTP_PORT, () => {
  console.log(`Server listening on ${cfg.HTTP_PORT}; WS path ${cfg.WS_PATH}`);
  console.log(`Worker pool size: ${cfg.AGGREGATOR_WORKER_COUNT}`);
  console.log("Demo data reference path:", cfg.DEMO_DATA_PATH);
});

