// server/demo-server.js

// Demo server: WebSocket telemetry replay + demo endpoints
// Usage: DEMO_DATA_PATH=/path/to/demo_data.json node server/demo-server.js
// Or: node server/demo-server.js (uses default paths)

const path = require("path");
const fs = require("fs");
const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");

// Config
const PORT = process.env.DEMO_PORT || process.env.PORT || 8081;
const DEMO_DATA_PATH = process.env.DEMO_DATA_PATH || path.join(__dirname, "..", "demo_data.json");
const DEMO_DATA_DIR = path.join(__dirname, "..", "public", "demo_data");

// Load demo data
let telemetry = [];
let trackData = {};

function loadDemoData() {
  // Try to load from single demo_data.json file first
  if (fs.existsSync(DEMO_DATA_PATH)) {
    try {
      const raw = JSON.parse(fs.readFileSync(DEMO_DATA_PATH, "utf8"));
      // Normalize: ensure raw is an array of telemetry points
      telemetry = Array.isArray(raw) ? raw : (raw.points || []);
      console.log(`✓ Loaded ${telemetry.length} telemetry points from ${DEMO_DATA_PATH}`);
    } catch (e) {
      console.warn(`Failed to load ${DEMO_DATA_PATH}:`, e.message);
    }
  }

  // Also load track-specific demo files for /api/demo_data endpoint
  if (fs.existsSync(DEMO_DATA_DIR)) {
    try {
      const files = fs.readdirSync(DEMO_DATA_DIR).filter(f => f.endsWith("_demo.json"));
      for (const file of files) {
        const trackId = file.replace("_demo.json", "");
        const content = JSON.parse(fs.readFileSync(path.join(DEMO_DATA_DIR, file), "utf8"));
        trackData[trackId] = content;
      }
      console.log(`✓ Loaded ${Object.keys(trackData).length} track demo files`);
    } catch (e) {
      console.warn(`Failed to load track demo files:`, e.message);
    }
  }

  // Fallback: use sample_laps.json if no demo data found
  if (telemetry.length === 0) {
const SAMPLE_PATH = path.join(__dirname, "sample_data", "sample_laps.json");
    if (fs.existsSync(SAMPLE_PATH)) {
      telemetry = JSON.parse(fs.readFileSync(SAMPLE_PATH, "utf8"));
      console.log(`✓ Using fallback sample data: ${telemetry.length} points`);
    } else {
      console.warn("⚠ No demo data found. Server will run but endpoints may return empty data.");
    }
  }
}

loadDemoData();



const app = express();

// CORS middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

// REST endpoint: Get full demo dataset
app.get("/api/demo_data", (req, res) => {
  res.json({
    meta: {
      source: DEMO_DATA_PATH,
      count: telemetry.length,
      tracks_available: Object.keys(trackData).length,
      loaded_at: new Date().toISOString()
    },
    telemetry: telemetry.slice(0, 1000), // Limit to first 1000 points for response size
    tracks: trackData
  });
});

// REST endpoint: Get demo prediction per track/chassis
app.get("/api/predict_demo/:track/:chassis", (req, res) => {
  const { track, chassis } = req.params;

  // Get telemetry points for this track/chassis
  const trackId = track.toLowerCase().replace(/\s+/g, "_");
  const points = telemetry.filter(p => {
    const pTrack = (p.track || "").toLowerCase().replace(/\s+/g, "_");
    const pChassis = (p.chassis || p.vehicle_id || "").toLowerCase();
    return pTrack === trackId && (pChassis.includes(chassis.toLowerCase()) || !chassis);
  });

  // If no points found, try to get from track-specific demo files
  let trackTelemetry = [];
  if (points.length === 0 && trackData[trackId]) {
    const trackDemo = trackData[trackId];
    if (trackDemo.races && trackDemo.races.length > 0) {
      trackTelemetry = trackDemo.races[0].telemetry_sample || [];
    }
  } else {
    trackTelemetry = points;
  }

  // Compute simple demo features
  let stress = 0;
  let brakeEnergy = 0;
  let speedSum = 0;
  let brakeCount = 0;

  for (const p of trackTelemetry) {
    const ax = Number(p.accx_can || p.accx || 0);
    const ay = Number(p.accy_can || p.accy || 0);
    stress += ax * ax + ay * ay;
    
    const brake = Number(p.pbrake_f || p.pbrake || 0);
    const speed = Number(p.speed_kmh || p.Speed || 0);
    if (brake > 0) {
      brakeEnergy += brake * speed;
      brakeCount++;
    }
    speedSum += speed;
  }

  const avgStress = trackTelemetry.length ? stress / trackTelemetry.length : 0;
  const avgBrakeEnergy = brakeCount ? brakeEnergy / brakeCount : 0;
  const avgSpeed = trackTelemetry.length ? speedSum / trackTelemetry.length : 0;

  // Create demo feature scores
  const feature_scores = [
    { name: "tire_stress_global", score: avgStress },
    { name: "brake_energy_est", score: brakeCount / Math.max(1, trackTelemetry.length) },
    { name: "avg_speed_kmh", score: avgSpeed }
  ];

  // Calculate predicted loss (demo formula)
  const predictedLossPerLap = (avgStress * 0.05).toFixed(3);
  const lapsUntilLoss = Math.max(1, Math.floor(0.5 / Math.max(0.01, avgStress * 0.05)));

  const resp = {
    chassis,
    track,
    predicted_loss_per_lap_s: Number(predictedLossPerLap),
    laps_until_0_5s_loss: lapsUntilLoss,
    recommended_pit_lap: Math.max(3, lapsUntilLoss - 1),
    feature_scores,
    explanation: feature_scores.map(f => 
      `${f.name} contributed (score ${Number(f.score).toFixed(3)})`
    ),
    meta: {
      model_version: "demo-v0",
      generated_at: new Date().toISOString(),
      demo: true,
      points_analyzed: trackTelemetry.length
    }
  };

  res.json(resp);
});

// Legacy endpoint for backward compatibility
app.get("/predict_tire/:track/:chassis", (req, res) => {
  // Redirect to new endpoint
  const { track, chassis } = req.params;
  req.url = `/api/predict_demo/${track}/${chassis}`;
  app._router.handle(req, res);
});



// Health endpoint
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "healthy",
    demo_count: telemetry.length,
    tracks_available: Object.keys(trackData).length,
    time: new Date().toISOString(),
    demo_mode: true
  });
});

// API health endpoint (for frontend compatibility)
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    status: "healthy",
    demo_count: telemetry.length,
    tracks_available: Object.keys(trackData).length,
    time: new Date().toISOString(),
    demo_mode: true
  });
});



const server = http.createServer(app);



// WebSocket server for telemetry replay
const wss = new WebSocket.Server({ server, path: "/ws" });
const wssDemo = new WebSocket.Server({ server, path: "/ws/demo" });

// Helper function to handle WebSocket connections
function setupWebSocketReplay(wssInstance, pathName) {
  wssInstance.on("connection", (ws) => {
    console.log(`WS client connected to ${pathName}`);

  let idx = 0;
    let intervalMs = 80; // Default: 12.5 points/sec
    let timer = null;
    let isPaused = false;

    const startReplay = () => {
      if (timer) return; // Already started
      
      timer = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN || isPaused) return;
        
        if (telemetry.length === 0) {
          ws.send(JSON.stringify({ 
            type: "error", 
            message: "No telemetry data available" 
          }));
          return;
        }

        const point = telemetry[idx % telemetry.length];
        // Wrap in type for consistency
        ws.send(JSON.stringify({ 
          type: "telemetry_point", 
          data: point 
        }));
    idx++;
  }, intervalMs);
    };

    startReplay();

  ws.on("message", (msg) => {
      try {
        const cmd = JSON.parse(msg.toString());
        
        if (cmd.type === "set_speed" && cmd.intervalMs) {
          clearInterval(timer);
          intervalMs = Math.max(40, Math.min(500, cmd.intervalMs)); // Clamp between 40-500ms
          timer = null;
          startReplay();
        } else if (cmd.type === "pause") {
          isPaused = true;
        } else if (cmd.type === "resume") {
          isPaused = false;
        } else if (cmd.cmd === "ping") {
        ws.send(JSON.stringify({ type: "pong", time: new Date().toISOString() }));
        }
      } catch (e) {
        // Ignore invalid messages
      }
    });

  ws.on("close", () => {
      if (timer) clearInterval(timer);
      console.log(`WS client disconnected from ${pathName}`);
    });
  });
}

setupWebSocketReplay(wss, "/ws");
setupWebSocketReplay(wssDemo, "/ws/demo");



server.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log(`Demo server listening on http://localhost:${PORT}`);
  console.log(`WebSocket endpoints:`);
  console.log(`  - ws://localhost:${PORT}/ws`);
  console.log(`  - ws://localhost:${PORT}/ws/demo`);
  console.log(`REST endpoints:`);
  console.log(`  - GET /api/demo_data`);
  console.log(`  - GET /api/predict_demo/:track/:chassis`);
  console.log(`  - GET /api/health`);
  console.log(`  - GET /health`);
  console.log(`Loaded ${telemetry.length} telemetry points`);
  console.log(`Loaded ${Object.keys(trackData).length} track demo files`);
  console.log("=".repeat(60));
});
