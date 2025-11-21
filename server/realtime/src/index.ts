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

// spawn worker (compiled JS path)
const workerPath = path.join(__dirname, "aggregator.worker.js");
const worker = new Worker(workerPath);

interface WorkerMessage {
  type: string;
  results?: AggregateResult[];
  ts?: number;
}

worker.on("message", (m: WorkerMessage) => {
  if (m.type === "AGGREGATES") {
    const payload = JSON.stringify({ 
      type: "insight_update", 
      data: m.results, 
      meta: { generated_at: new Date(m.ts).toISOString() } 
    });
    broadcast(payload);
  }
});

worker.on("error", (err) => console.error("Aggregator worker error", err));
worker.on("exit", (code) => console.log("Aggregator worker exit", code));

// fastify
const fastify = Fastify({ logger: false });

fastify.get("/api/health", async (req, reply) => 
  reply.send({ ok: true, now: new Date().toISOString(), demo: cfg.DEMO_DATA_PATH }));

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

function broadcast(msg: string) {
  const buf = Buffer.from(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      if (client.bufferedAmount > cfg.MAX_WS_BUFFER) {
        continue;
      }
      client.send(buf, (err) => {
        if (err) console.warn("ws send err", (err as Error).message);
      });
    }
  }
}

// periodic batch to worker
setInterval(() => {
  if (ring.size === 0) return;
  const batchSize = 500;
  const batch = ring.snapshot(batchSize);
  worker.postMessage({ type: "BATCH", points: batch, sectors: trackSectors, track: "unknown" });
}, cfg.BATCH_MS);

let rawBatch: TelemetryPoint[] = [];
let lastBroadcast = Date.now();

function onParsed(parsed: TelemetryPoint) {
  if (!parsed.meta_time) parsed.meta_time = new Date().toISOString();
  rawBatch.push(parsed);
  if (rawBatch.length >= 40 || Date.now() - lastBroadcast > 300) {
    broadcast(JSON.stringify({ type: "telemetry_update", data: rawBatch }));
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

server.listen(cfg.HTTP_PORT, () => {
  console.log(`Server listening on ${cfg.HTTP_PORT}; WS path ${cfg.WS_PATH}`);
  console.log("Demo data reference path:", cfg.DEMO_DATA_PATH);
});

