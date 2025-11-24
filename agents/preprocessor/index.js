// preprocessor/index.js
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(REDIS_URL);

const TELEMETRY_STREAM = 'telemetry.stream';
const TASK_STREAM = 'tasks.stream';
const TRACK_SECTORS_PATH = process.env.TRACK_SECTORS_PATH || path.join(__dirname, '..', '..', 'public', 'tracks', 'track_sectors.json');

// load sectors
let trackSectors = {};
try { trackSectors = JSON.parse(fs.readFileSync(TRACK_SECTORS_PATH, 'utf8')); }
catch (e) { console.warn('no track sectors found, will use thirds fallback'); }

function sampleTireStress(p) {
  const ax = Number(p.accx_can || 0);
  const ay = Number(p.accy_can || 0);
  const steer = Math.abs(Number(p.Steering_Angle || 0)) / 360.0;
  return ax*ax + ay*ay + steer*steer;
}

function computeSectorIndex(sectors, lapdist) {
  if (!sectors || sectors.length === 0) {
    return Math.floor((lapdist % 1) * 3); // fallback nonsense (shouldn't happen)
  }
  for (let i=0;i<sectors.length;i++){
    if (lapdist >= sectors[i].start_m && lapdist < sectors[i].end_m) return i;
  }
  return sectors.length - 1;
}

// read loop: use XREAD to consume telemetry in batches
async function consumeLoop() {
  let lastId = '0-0';
  while (true) {
    try {
      const res = await redis.xread('BLOCK', 2000, 'COUNT', 100, 'STREAMS', TELEMETRY_STREAM, lastId);
      if (!res) continue;
      const [stream, entries] = res[0];
      for (const [id, fields] of entries) {
        const msg = JSON.parse(fields[1]);
        lastId = id;
        // handle single telemetry object or batched 'data'
        const points = Array.isArray(msg.data) ? msg.data : [msg];
        // For simplicity create per-chassis window tasks of small size (one sample per task demo)
        for (const p of points) {
          const stress = sampleTireStress(p);
          const track = (p.track || 'unknown').toLowerCase().replace(/\s+/g, '_');
          const sectorsMeta = trackSectors[track] || null;
          const sectorIndex = sectorsMeta ? computeSectorIndex(sectorsMeta.sectors, Number(p.lapdist_m || 0)) : 0;
          const task = {
            task_id: uuidv4(),
            task_type: 'predictor',
            priority: 'normal',
            track: track,
            chassis: p.chassis || 'unknown',
            created_at: new Date().toISOString(),
            payload: {
              sample: p,
              derived: {
                tire_stress_inst: stress,
                sector: sectorIndex
              }
            }
          };
          await redis.xadd(TASK_STREAM, '*', 'task', JSON.stringify(task));
        }
      }
    } catch (err) {
      console.error('preprocessor loop err', err);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// register agent in orchestrator (optional)
async function register() {
  const ORCH = process.env.ORCH_URL || 'http://localhost:9090';
  // agent info: types handled (preprocessor)
  // skipping remote call here; orchestrator has /api/agents/register endpoint if desired
}

consumeLoop().catch(e => console.error('preprocessor died', e));



