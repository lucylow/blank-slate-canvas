// server/realtime/src/index.ts

import fs from "fs";
import http from "http";
import path from "path";
import Fastify from "fastify";
import WebSocket from "ws";
import { Worker } from "worker_threads";
import { RingBuffer } from "./ringbuffer";
import { TelemetryPoint, AggregateResult } from "./types";
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
  private pendingTasks: Array<{ task: any; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private workerCount: number;

  constructor(count: number = cfg.AGGREGATOR_WORKER_COUNT) {
    this.workerCount = count;
    this.initializeWorkers();
  }

  private initializeWorkers() {
    const workerPath = path.join(__dirname, "aggregator.worker.js");
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker(workerPath);
      worker.on("message", (result) => {
        this.availableWorkers.push(worker);
        this.processNextTask(worker, result);
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
    const workerPath = path.join(__dirname, "aggregator.worker.js");
    const newWorker = new Worker(workerPath);
    newWorker.on("message", (result) => {
      this.availableWorkers.push(newWorker);
      this.processNextTask(newWorker, result);
    });
    newWorker.on("error", (err) => {
      console.error(`Worker ${index} error:`, err);
      metrics.errors++;
    });
    this.workers[index] = newWorker;
    this.availableWorkers.push(newWorker);
  }

  private processNextTask(worker: Worker, result: any) {
    if (this.pendingTasks.length > 0) {
      const task = this.pendingTasks.shift()!;
      task.resolve(result);
    }
  }

  async processBatch(batch: TelemetryPoint[], sectors: any, track: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.availableWorkers.length > 0) {
        const worker = this.availableWorkers.shift()!;
        worker.once("message", (result) => {
          this.availableWorkers.push(worker);
          resolve(result);
        });
        worker.postMessage({ type: "BATCH", points: batch, sectors, track });
      } else {
        // Queue task if no workers available
        this.pendingTasks.push({ task: { batch, sectors, track }, resolve, reject });
        // Process when worker becomes available
        const checkWorker = () => {
          if (this.availableWorkers.length > 0) {
            const worker = this.availableWorkers.shift()!;
            worker.once("message", (result) => {
              this.availableWorkers.push(worker);
              resolve(result);
            });
            worker.postMessage({ type: "BATCH", points: batch, sectors, track });
          } else {
            setTimeout(checkWorker, 10);
          }
        };
        checkWorker();
      }
    });
  }

  shutdown() {
    this.workers.forEach(worker => worker.terminate());
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
let lastBatchTime = Date.now();
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
      const payload = JSON.stringify({ 
        type: "insight_update", 
        data: result.results, 
        meta: { generated_at: new Date(result.ts).toISOString() } 
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

