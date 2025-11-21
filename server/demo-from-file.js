// server/demo-from-file.js
// Alternative demo server implementation (legacy/compatibility)
// Note: Consider using demo-server.js instead, which uses centralized utilities

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { DEMO_CONFIG } = require('./demo-config');
const { loadAllDemoData, getDemoDataSummary } = require('./demo-loader');

// Try to load demo data from multiple possible locations
let telemetry = [];
let trackData = {};

function loadDemoData() {
  console.log("Loading demo data (demo-from-file.js)...");
  const results = loadAllDemoData();
  
  telemetry = results.telemetry;
  trackData = results.trackData;
  
  const summary = getDemoDataSummary(results);
  console.log(`✓ Loaded ${summary.telemetry_count} telemetry points`);
  console.log(`✓ Loaded ${summary.tracks_available} track demo files`);
  
  if (summary.errors.length > 0) {
    console.warn('Errors during loading:', summary.errors);
  }
}

loadDemoData();

// load track sectors (fallback to default later)
let trackSectors = {};
if (fs.existsSync(DEMO_CONFIG.TRACK_SECTORS_PATH)) {
  try {
    trackSectors = JSON.parse(fs.readFileSync(DEMO_CONFIG.TRACK_SECTORS_PATH, 'utf8'));
    console.log(`✓ Loaded track sectors from ${DEMO_CONFIG.TRACK_SECTORS_PATH}`);
  } catch (e) {
    console.warn('Failed to load track_sectors.json:', e.message);
  }
} else {
  console.warn('track_sectors.json not found at', DEMO_CONFIG.TRACK_SECTORS_PATH);
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/demo_data', (req, res) => {
  const summary = getDemoDataSummary({ telemetry, trackData, sources: [], errors: [], warnings: [] });
  res.json({ 
    meta: { 
      source: DEMO_CONFIG.DEMO_DATA_PATH, 
      count: telemetry.length,
      tracks_available: summary.tracks_available
    }, 
    telemetry: telemetry.slice(0, DEMO_CONFIG.MAX_TELEMETRY_RESPONSE),
    tracks: trackData
  });
});

app.get('/api/predict_demo/:track/:chassis', (req, res) => {
  const { track, chassis } = req.params;
  // simple demo predictor: compute avg sample stress for the chassis and map to seconds
  const points = telemetry.filter(p => {
    const pTrack = (p.track || '').toLowerCase().replace(/\s+/g, '_');
    const pChassis = (p.chassis || p.vehicle_id || p.chassis_number || '').toLowerCase();
    return pTrack === track.toLowerCase() && (pChassis.includes(chassis.toLowerCase()) || !chassis);
  });

  const sampleTireStress = (p) => {
    const ax = Number(p.accx_can || p.accx || 0);
    const ay = Number(p.accy_can || p.accy || 0);
    const steer = Number(p.Steering_Angle || p.steering_angle || 0);
    return ax*ax + ay*ay + Math.pow(Math.abs(steer)/360.0, 2);
  };

  const total = points.reduce((s,p) => s + sampleTireStress(p), 0);
  const avgStress = points.length ? total / points.length : 0;
  const predicted_loss_per_lap_s = +(avgStress * 0.05).toFixed(3);
  const laps_until_0_5s_loss = +(Math.max(1, 0.5 / (predicted_loss_per_lap_s || 0.01))).toFixed(2);

  const resp = {
    chassis, track,
    predicted_loss_per_lap_s,
    laps_until_0_5s_loss,
    recommended_pit_lap: 3,
    feature_scores: [
      { name: 'tire_stress_global', score: +(avgStress.toFixed(4)) },
      { name: 'brake_event_ratio', score: +(points.filter(p=>Number(p.pbrake_f || p.pbrake || 0)>0).length / (points.length||1)).toFixed(3) }
    ],
    evidence: [
      { note: 'Demo: aggregated stress from telemetry', telemetry_rows: points.slice(0,3) }
    ],
    meta: { model_version: 'demo-v0', generated_at: new Date().toISOString() }
  };
  res.json(resp);
});

app.get('/api/health', (req, res) => {
  const summary = getDemoDataSummary({ telemetry, trackData, sources: [], errors: [], warnings: [] });
  res.json({ 
    ok: true, 
    demo_count: telemetry.length,
    tracks_available: summary.tracks_available,
    time: new Date().toISOString(),
    demo_mode: true
  });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws/demo' });

function computeSampleTireStress(p) {
  const ax = Number(p.accx_can || p.accx || 0);
  const ay = Number(p.accy_can || p.accy || 0);
  const steer = Number(p.Steering_Angle || p.steering_angle || 0);
  return ax*ax + ay*ay + Math.pow(Math.abs(steer)/360.0, 2);
}

function computeSectorIndex(trackKey, lapdist) {
  const meta = trackSectors[trackKey];
  if (!meta || !meta.sectors) {
    // fallback: equal 3 sectors from meta.total_m or 5000m default
    const total = (meta && meta.total_m) ? meta.total_m : 5000;
    const sLen = total / 3;
    if (lapdist < sLen) return 0;
    if (lapdist < sLen*2) return 1;
    return 2;
  }
  const sectors = meta.sectors;
  for (let i=0;i<sectors.length;i++) {
    if (lapdist >= sectors[i].start_m && lapdist < sectors[i].end_m) return i;
  }
  return sectors.length - 1;
}

wss.on('connection', (ws) => {
  console.log('demo ws connected');
  // cycle through telemetry in order; we will loop the array
  let i = 0;
  const pointIntervalMs = 800; // adjust for demo speed
  let sectorAcc = {}; // per-sector accum per chassis
  let lastAggregateAt = Date.now();

  const timer = setInterval(() => {
    if (ws.readyState !== WebSocket.OPEN) return;
    
    if (telemetry.length === 0) {
      ws.send(JSON.stringify({ type: 'error', message: 'No telemetry data available' }));
      return;
    }

    const point = telemetry[i % telemetry.length];
    // compute sample stress
    const stress = computeSampleTireStress(point);
    point._sample_tire_stress = stress; // attach for demo debug

    // update sector accumulators
    const trackKey = (point.track || 'road_america').toLowerCase().replace(/\s+/g, '_');
    const chassisKey = point.chassis || point.vehicle_id || point.chassis_number || 'GR86-DEMO-01';
    const key = `${chassisKey}|${trackKey}`;
    if (!sectorAcc[key]) sectorAcc[key] = { perSector: {}, totalStress: 0, lap: point.lap || 1 };
    const lapdist = Number(point.lapdist_m || point.lap_distance || 0);
    const sidx = computeSectorIndex(trackKey, lapdist);
    sectorAcc[key].perSector[sidx] = (sectorAcc[key].perSector[sidx] || 0) + stress;
    sectorAcc[key].totalStress += stress;

    // send telemetry_update
    ws.send(JSON.stringify({ type: 'telemetry_update', data: point }));

    // periodic aggregate_update (every ~4s)
    if (Date.now() - lastAggregateAt > 4000) {
      lastAggregateAt = Date.now();
      const keys = Object.keys(sectorAcc);
      keys.forEach(k => {
        const [ch, tr] = k.split('|');
        const s = sectorAcc[k];
        const agg = {
          type: 'aggregate_update',
          data: {
            chassis: ch,
            track: tr,
            perSectorStress: s.perSector,
            lap_tire_stress: s.totalStress,
            window_s: 4,
            timestamp: new Date().toISOString()
          }
        };
        ws.send(JSON.stringify(agg));
      });
    }

    // send insight_update every ~8000ms (approx every 10 points)
    if (i % 10 === 0) {
      const insight = {
        type: 'insight_update',
        data: {
          chassis: chassisKey,
          track: trackKey,
          lap: sectorAcc[key].lap || 1,
          lap_tire_stress: sectorAcc[key].totalStress || 0,
          predicted_loss_per_lap_seconds: +( (sectorAcc[key].totalStress || 0) * 0.05 ).toFixed(3),
          laps_until_0_5s_loss: +( Math.max(1, 0.5 / (((sectorAcc[key].totalStress||0)*0.05) || 0.01))).toFixed(2),
          pit_recommendation: { best_pit_lap: 18, expected_net_gain_seconds: -1.2 },
          feature_scores: [
            { name: 'tire_stress_S2', score: +( (sectorAcc[key].perSector[1] || 0).toFixed(4) ) },
            { name: 'brake_energy_S1', score: 0.12 }
          ],
          evidence: [
            { note: 'Rolling stress high in S2 (demo)', telemetry_rows: [ 
              telemetry[(i+1) % telemetry.length], 
              telemetry[(i+3) % telemetry.length] 
            ] }
          ],
          meta: { model_version: 'demo-v0', generated_at: new Date().toISOString() }
        }
      };
      ws.send(JSON.stringify(insight));
    }

    i++;
  }, pointIntervalMs);

  ws.on('message', (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      if (parsed && parsed.cmd === 'set_speed') {
        // if caller sends {cmd:'set_speed', intervalMs:400} we adjust speed
        // Not implemented fully here: just log
        console.log('demo set_speed request', parsed);
      }
    } catch(e) {}
  });

  ws.on('close', () => {
    clearInterval(timer);
    console.log('demo ws disconnected');
  });
});

server.listen(DEMO_CONFIG.PORT, () => {
  const summary = getDemoDataSummary({ telemetry, trackData, sources: [], errors: [], warnings: [] });
  console.log(`Demo server running on http://localhost:${DEMO_CONFIG.PORT}`);
  console.log(`  Telemetry points: ${summary.telemetry_count}`);
  console.log(`  Tracks available: ${summary.tracks_available}`);
  console.log(`  Demo file: ${DEMO_CONFIG.DEMO_DATA_PATH}`);
});


