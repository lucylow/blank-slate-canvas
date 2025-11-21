// dist/index.js
const fs = require('fs');
const http = require('http');
const Fastify = require('fastify');
const WebSocket = require('ws');
const { Worker } = require('worker_threads');
const path = require('path');

const config = require('./config');
const RingBuffer = require('./ringbuffer');
const { startUdpListener } = require('./udp_listener');
const { pollBucketPrefix } = require('./s3_watcher');

const ring = new RingBuffer(config.RINGBUFFER_SIZE);

// load track sectors
let trackSectors = {};
try {
  trackSectors = JSON.parse(fs.readFileSync(config.TRACK_SECTORS_PATH, 'utf8'));
} catch (e) {
  console.warn('track sectors not found / invalid; continuing with defaults', e.message);
}

// start worker
const workerPath = path.join(__dirname, 'aggregator.worker.js');
const worker = new Worker(workerPath);
worker.on('message', (m) => {
  if (m.type === 'AGGREGATES') {
    const payload = JSON.stringify({ type: 'insight_update', data: m.results, meta: { generated_at: new Date(m.ts).toISOString() } });
    broadcast(payload);
  }
});
worker.on('error', (err) => console.error('Aggregator worker error', err));
worker.on('exit', (code) => console.log('Aggregator worker exit', code));

const fastify = Fastify({ logger: false });

// Register static file serving for public folder
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/public/',
});

// API routes
fastify.get('/api/health', async (req, reply) => reply.send({ ok: true, now: new Date().toISOString(), demo: config.DEMO_DATA_PATH }));
fastify.get('/api/recent/:n', async (req, reply) => {
  const n = Math.min(5000, parseInt(req.params.n || '200', 10));
  return reply.send({ recent: ring.snapshot(n) });
});
fastify.post('/api/ingest', async (req, reply) => {
  const p = req.body;
  if (Array.isArray(p)) {
    for (const item of p) ring.push(item);
  } else {
    ring.push(p);
  }
  return reply.send({ ok: true });
});

const server = http.createServer(fastify.server);
const wss = new WebSocket.Server({ server, path: config.WS_PATH, maxPayload: 1 << 20 });

function broadcast(msg) {
  const buf = Buffer.from(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      if (client.bufferedAmount > config.MAX_WS_BUFFER) {
        continue;
      }
      client.send(buf, { binary: false }, (err) => {
        if (err) console.warn('ws send err', err.message);
      });
    }
  }
}

setInterval(() => {
  if (ring.size === 0) return;
  const batchSize = 500;
  const batch = ring.snapshot(batchSize);
  worker.postMessage({ type: 'BATCH', points: batch, sectors: trackSectors, track: 'unknown' });
}, config.BATCH_MS);

let rawBatch = [];
let lastBroadcast = Date.now();
function onParsed(parsed) {
  if (!parsed.meta_time) parsed.meta_time = new Date().toISOString();
  rawBatch.push(parsed);
  if (rawBatch.length >= 40 || (Date.now() - lastBroadcast > 300)) {
    broadcast(JSON.stringify({ type: 'telemetry_update', data: rawBatch }));
    rawBatch = [];
    lastBroadcast = Date.now();
  }
}

startUdpListener(ring, onParsed);

if (process.env.S3_BUCKET && process.env.S3_PREFIX) {
  pollBucketPrefix(process.env.S3_BUCKET, process.env.S3_PREFIX, ring, onParsed, 60 * 1000);
}

if (fs.existsSync(config.DEMO_DATA_PATH)) {
  const demo = JSON.parse(fs.readFileSync(config.DEMO_DATA_PATH, 'utf8'));
  const points = Array.isArray(demo) ? demo : (demo.telemetry || []);
  let i = 0;
  setInterval(() => {
    const p = points[i % points.length];
    if (p) {
      p.raw_source = 'demo';
      ring.push(p);
      onParsed(p);
    }
    i++;
  }, 100);
}

// Start server after Fastify is ready
fastify.ready().then(() => {
  server.listen(config.HTTP_PORT, () => {
    console.log(`Server listening on ${config.HTTP_PORT}; WS path ${config.WS_PATH}`);
    console.log('Demo data docs (for reference):', config.DEMO_DATA_PATH);
    console.log('Static files served from:', path.join(__dirname, 'public'));
  });
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
