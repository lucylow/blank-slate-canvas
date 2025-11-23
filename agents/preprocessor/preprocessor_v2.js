// preprocessor/preprocessor_v2.js
// Improved Preprocessor Agent for PitWall A.I.
// - reads telemetry.stream (Redis Streams)
// - canonicalizes, sectorizes, aggregates per (track,chassis,lap,sector)
// - emits aggregates.stream and tasks.stream for Predictor and EDA agents
//
// Uses: ioredis, ajv (for schema validation), lodash
// Start: REDIS_URL=redis://127.0.0.1:6379 node preprocessor_v2.js
//
// Seed doc path (agents may reference for domain rules):
// /mnt/data/2 Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .md

const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv').default;
const { v4: uuidv4 } = require('uuid');
const _ = require('lodash');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const TELEMETRY_STREAM = process.env.TELEMETRY_STREAM || 'telemetry.stream';
const AGG_STREAM = process.env.AGG_STREAM || 'aggregates.stream';
const TASK_STREAM = process.env.TASK_STREAM || 'tasks.stream';
const METRICS_HASH = process.env.METRICS_HASH || 'preproc.metrics';
const TRACK_SECTORS_PATH = process.env.TRACK_SECTORS_PATH || path.join(__dirname, '../../public/tracks/track_sectors.json');

const redis = new Redis(REDIS_URL);

// load sector maps (fallback to empty)
let trackSectors = {};
try { 
  trackSectors = JSON.parse(fs.readFileSync(TRACK_SECTORS_PATH, 'utf8')); 
  console.log(`[Preprocessor v2] Loaded sectors for ${Object.keys(trackSectors).length} tracks`);
} catch (e) { 
  console.warn('[Preprocessor v2] track sectors not found, defaulting to equal-thirds when needed.'); 
}

// canonical telemetry schema (AJV)
const ajv = new Ajv({ coerceTypes: true, allErrors: true });
const telemetrySchema = {
  type: 'object',
  properties: {
    meta_time: { type: 'string' },
    track: { type: 'string' },
    chassis: { type: 'string' },
    lap: { type: 'integer' },
    lapdist_m: { type: 'number' },
    speed_kmh: { type: 'number' },
    accx_can: { type: 'number' },
    accy_can: { type: 'number' },
    Steering_Angle: { type: 'number' },
    throttle_pct: { type: 'number' },
    brake_pct: { type: 'number' },
    rpm: { type: 'number' },
    source: { type: 'string' }
  },
  required: ['meta_time','track','chassis','lap','lapdist_m']
};
const validate = ajv.compile(telemetrySchema);

// utility: compute derived features for a sample
function computeDerived(sample) {
  const accx = Number(sample.accx_can||0);
  const accy = Number(sample.accy_can||0);
  const lateral_g = accy; // if data already in g units; if m/s^2 convert divide by 9.81
  const long_g = accx;
  const inst_tire_stress = accx*accx + accy*accy;
  const brake_power = (Number(sample.brake_pct||0) / 100) * Number(sample.speed_kmh||0);
  // steering rate is computed externally in buffer from previous sample
  return { lateral_g, long_g, inst_tire_stress, brake_power };
}

// compute sector index safely
function getSectorIndex(track, lapdist_m) {
  const meta = trackSectors[track];
  if (!meta || !Array.isArray(meta.sectors) || meta.sectors.length === 0) {
    // fallback to equal-thirds using meta.total_m or default 5000m
    const total = meta && meta.total_m ? meta.total_m : 5000;
    const sLen = total / 3;
    if (lapdist_m < sLen) return 0;
    if (lapdist_m < 2 * sLen) return 1;
    return 2;
  }
  for (let i = 0; i < meta.sectors.length; i++) {
    const s = meta.sectors[i];
    if (lapdist_m >= s.start_m && lapdist_m < s.end_m) return i;
  }
  return meta.sectors.length - 1;
}

// buffer store for active windows keyed by track|chassis|lap
const buffers = new Map();
const BUFFER_TTL_MS = 60 * 1000; // drop buffers inactive > 60s

function bufferKey(track,chassis,lap){ return `${track}::${chassis}::lap:${lap}`; }

function getOrCreateBuffer(track,chassis,lap) {
  const key = bufferKey(track,chassis,lap);
  let b = buffers.get(key);
  if (!b) {
    b = { created_at: Date.now(), last_seen: Date.now(), samples: [], last_sample: null };
    buffers.set(key,b);
  }
  b.last_seen = Date.now();
  return { key, b };
}

// quality counters
async function incrMetric(name, delta=1) {
  try { 
    await redis.hincrby(METRICS_HASH, name, delta); 
  } catch(e) { 
    console.warn('[Preprocessor v2] metric set fail', e.message); 
  }
}

// function to produce per-sector aggregate object
function aggregateBuffer(buffer, track, chassis, lap) {
  // compute per-sector aggregates
  const perSector = {}; // { sectorIdx: {n, avg_speed, max_lat_g, tire_stress_sum, brake_energy } }
  const sector_order = [];
  
  for (let i=0;i<buffer.samples.length;i++){
    const s = buffer.samples[i];
    const sector = s._sector_index || 0;
    if (!perSector[sector]) {
      perSector[sector] = { n:0, speed_sum:0, max_lat_g:0, tire_stress_sum:0, brake_energy:0, samples:[] };
      sector_order.push(sector);
    }
    const ag = perSector[sector];
    ag.n += 1;
    ag.speed_sum += s.speed_kmh || 0;
    ag.max_lat_g = Math.max(ag.max_lat_g, Math.abs(s._derived.lateral_g || 0));
    ag.tire_stress_sum += s._derived.inst_tire_stress || 0;
    ag.brake_energy += s._derived.brake_power || 0;
    // store only small evidence sample snippet (min fields)
    if (ag.samples.length < 3) ag.samples.push({ meta_time: s.meta_time, lapdist_m: s.lapdist_m, speed_kmh: s.speed_kmh });
  }
  
  // build final perSector reduced
  const outPerSector = {};
  for (const idx of Object.keys(perSector)){
    const d = perSector[idx];
    outPerSector[idx] = {
      n: d.n,
      avg_speed: d.n ? +(d.speed_sum / d.n).toFixed(2) : 0,
      max_lat_g: +d.max_lat_g.toFixed(3),
      tire_stress_sum: +d.tire_stress_sum.toFixed(3),
      brake_energy: +d.brake_energy.toFixed(3),
      evidence: d.samples
    };
  }
  
  const lap_time_est = null; // require lap timing logic elsewhere
  return {
    track, chassis, lap,
    perSector: outPerSector,
    sectorOrder: sector_order,
    sample_count: buffer.samples.length,
    created_at: new Date().toISOString()
  };
}

// process incoming raw telemetry object (canonicalize, validate, derive, buffer)
async function processTelemetry(raw) {
  // canonicalize: ensure object shape & coercion happens via ajv
  const ok = validate(raw);
  if (!ok) {
    await incrMetric('invalid_frames');
    if (process.env.DEBUG) {
      console.warn('[Preprocessor v2] Validation failed:', validate.errors);
    }
    return;
  }

  // compute derived features
  const derived = computeDerived(raw);

  // sectorize
  const sectorIdx = getSectorIndex(raw.track, Number(raw.lapdist_m || 0));
  raw._derived = derived;
  raw._sector_index = sectorIdx;
  raw._sample_id = raw._sample_id || uuidv4();

  // buffer into per lap buffer
  const { key, b } = getOrCreateBuffer(raw.track, raw.chassis, raw.lap);
  
  // steering rate compute
  if (b.last_sample && b.last_sample.Steering_Angle != null) {
    const dt = (new Date(raw.meta_time).getTime() - new Date(b.last_sample.meta_time).getTime())/1000 || 0.1;
    raw._derived.steer_rate = (raw.Steering_Angle - b.last_sample.Steering_Angle)/dt;
  } else raw._derived.steer_rate = 0;
  
  b.samples.push(raw);
  b.last_sample = raw;

  await incrMetric('frames_processed');

  // flush logic: either when lap changes or buffer gets big
  if (b.samples.length >= 600 || (Date.now() - b.created_at) > 5000) {
    // emit aggregate task (rolling)
    const agg = aggregateBuffer(b, raw.track, raw.chassis, raw.lap);
    const task = {
      task_id: uuidv4(),
      task_type: 'aggregate_window',
      track: raw.track,
      chassis: raw.chassis,
      lap: raw.lap,
      payload: agg,
      created_at: new Date().toISOString()
    };
    
    // push to aggregates stream (for storage / lineage) and tasks stream (for predictor)
    await redis.xadd(AGG_STREAM, '*', 'agg', JSON.stringify(agg));
    await redis.xadd(TASK_STREAM, '*', 'task', JSON.stringify(task));
    
    // Keep only last small evidence in buffer (sliding)
    b.samples = b.samples.slice(-50);
    b.created_at = Date.now();
  }
}

// cleanup inactive buffers regularly
setInterval(() => {
  const now = Date.now();
  for (const [key,b] of buffers.entries()){
    if (now - b.last_seen > BUFFER_TTL_MS) {
      buffers.delete(key);
      console.log(`[Preprocessor v2] Cleaned up inactive buffer: ${key}`);
    }
  }
}, 10*1000);

// reader loop - using XREAD consumer-style (simplified)
async function readerLoop() {
  let lastId = '0-0';
  console.log(`[Preprocessor v2] Starting reader loop on stream: ${TELEMETRY_STREAM}`);
  
  while (true) {
    try {
      const res = await redis.xread('BLOCK', 2000, 'COUNT', 200, 'STREAMS', TELEMETRY_STREAM, lastId);
      if (!res) continue;

      const [stream, entries] = res[0];
      for (const [id, fields] of entries) {
        // fields likely like ['data','<json>'] or just one json string
        const rawJson = fields[1] || fields[0];
        let obj;
        try { 
          obj = JSON.parse(rawJson); 
        } catch(e) { 
          await incrMetric('parse_errors'); 
          console.warn('[Preprocessor v2] Parse error:', e.message);
          continue; 
        }
        
        // accept batched arrays too
        const points = Array.isArray(obj.data) ? obj.data : [obj];
        for (const p of points) {
          try { 
            await processTelemetry(p); 
          } catch(e) { 
            console.error('[Preprocessor v2] processTelemetry err', e); 
            await incrMetric('process_errors'); 
          }
        }
        lastId = id;
      }
    } catch (err) {
      console.error('[Preprocessor v2] readerLoop err', err);
      await new Promise(r=>setTimeout(r,1000));
    }
  }
}

console.log('[Preprocessor v2] Starting. Telemetry stream:', TELEMETRY_STREAM);
console.log('[Preprocessor v2] Redis URL:', REDIS_URL);
readerLoop().catch(e=>console.error('[Preprocessor v2] preproc main err', e));


