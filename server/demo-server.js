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
const TelemetrySimulator = require("./telemetry-simulator");

// Config
const PORT = process.env.DEMO_PORT || process.env.PORT || 8081;
const DEMO_DATA_PATH = process.env.DEMO_DATA_PATH || path.join(__dirname, "..", "demo_data.json");
const DEMO_DATA_DIR = path.join(__dirname, "..", "public", "demo_data");
const DEFAULT_TRACK = process.env.DEFAULT_TRACK || "sebring"; // Default track for demo

// Load demo data
let telemetry = [];
let trackData = {};
const simulator = new TelemetrySimulator();

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
      
      // Process default track data for WebSocket streaming
      if (trackData[DEFAULT_TRACK]) {
        simulator.loadTrackData(trackData[DEFAULT_TRACK]);
        // Also populate legacy telemetry array for backward compatibility
        telemetry = simulator.getAllPoints();
        console.log(`✓ Loaded ${telemetry.length} processed telemetry points from ${DEFAULT_TRACK}`);
      }
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
    active_track: simulator.currentTrack || DEFAULT_TRACK,
    active_vehicles: simulator.getVehicles(),
    time: new Date().toISOString(),
    demo_mode: true
  });
});

// API endpoint to switch active track for WebSocket streaming
app.post("/api/set_track/:trackId", (req, res) => {
  const { trackId } = req.params;
  const normalizedTrackId = trackId.toLowerCase();
  
  if (!trackData[normalizedTrackId]) {
    return res.status(404).json({
      error: "Track not found",
      available_tracks: Object.keys(trackData)
    });
  }
  
  try {
    simulator.loadTrackData(trackData[normalizedTrackId]);
    telemetry = simulator.getAllPoints(); // Update legacy array
    
    res.json({
      success: true,
      track: normalizedTrackId,
      track_name: trackData[normalizedTrackId].track_name,
      vehicles: simulator.getVehicles(),
      telemetry_points: telemetry.length
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to load track",
      message: error.message
    });
  }
});

// API endpoint to get available tracks
app.get("/api/tracks", (req, res) => {
  const tracks = Object.keys(trackData).map(trackId => ({
    track_id: trackId,
    track_name: trackData[trackId].track_name,
    location: trackData[trackId].location,
    races_available: trackData[trackId].races?.length || 0
  }));
  
  res.json({
    tracks,
    total: tracks.length,
    active_track: simulator.currentTrack || DEFAULT_TRACK
  });
});



const server = http.createServer(app);



// WebSocket server for telemetry replay
const wss = new WebSocket.Server({ server, path: "/ws" });
const wssDemo = new WebSocket.Server({ server, path: "/ws/demo" });

// Helper function to handle WebSocket connections with enhanced telemetry
function setupWebSocketReplay(wssInstance, pathName) {
  wssInstance.on("connection", (ws) => {
    console.log(`WS client connected to ${pathName}`);

    // Multi-vehicle streaming support
    const vehicleIndices = new Map();
    const vehicles = simulator.getVehicles();
    
    // Initialize indices for all vehicles
    if (vehicles.length > 0) {
      vehicles.forEach(vehicleId => {
        vehicleIndices.set(vehicleId, 0);
      });
    } else {
      // Fallback to single vehicle mode
      vehicleIndices.set('default', 0);
    }

    let intervalMs = 80; // Default: 12.5 points/sec (10Hz with variation)
    let timer = null;
    let isPaused = false;
    let lastSendTime = Date.now();

    const startReplay = () => {
      if (timer) return; // Already started
      
      const sendNextBatch = () => {
        if (ws.readyState !== WebSocket.OPEN || isPaused) return;
        
        const now = Date.now();
        const actualInterval = now - lastSendTime;
        lastSendTime = now;

        // Get current vehicles (may have changed if track was switched)
        const currentVehicles = simulator.getVehicles();
        
        // Use simulator if available, otherwise fallback to legacy telemetry
        if (currentVehicles.length > 0 && simulator.getAllPoints().length > 0) {
          // Multi-vehicle mode: send one point per vehicle per interval
          let sentAny = false;
          
          // Ensure all current vehicles have indices
          currentVehicles.forEach(vehicleId => {
            if (!vehicleIndices.has(vehicleId)) {
              vehicleIndices.set(vehicleId, 0);
            }
          });
          
          for (const vehicleId of currentVehicles) {
            const idx = vehicleIndices.get(vehicleId) || 0;
            const point = simulator.getNextPoint(vehicleId, idx);
            
            if (point) {
              const adjustedPoint = {
                ...point,
                timestamp: now, // Use current time for real-time feel
                _simulated: true,
                _interval_ms: actualInterval
              };
              
              ws.send(JSON.stringify({ 
                type: "telemetry_point", 
                data: adjustedPoint 
              }));
              
              vehicleIndices.set(vehicleId, idx + 1);
              sentAny = true;
            }
          }
          
          if (!sentAny) {
            // Reset all indices if we've cycled through all data
            currentVehicles.forEach(vehicleId => {
              const stream = simulator.getVehicleStream(vehicleId);
              const currentIdx = vehicleIndices.get(vehicleId) || 0;
              if (stream.length > 0 && currentIdx >= stream.length) {
                vehicleIndices.set(vehicleId, 0);
              }
            });
          }
        } else if (telemetry.length > 0) {
          // Legacy single-vehicle mode
          const idx = vehicleIndices.get('default') || 0;
          const point = telemetry[idx % telemetry.length];
          
          const adjustedPoint = {
            ...point,
            timestamp: now,
            _simulated: true
          };
          
          ws.send(JSON.stringify({ 
            type: "telemetry_point", 
            data: adjustedPoint 
          }));
          
          vehicleIndices.set('default', idx + 1);
        } else {
          ws.send(JSON.stringify({ 
            type: "error", 
            message: "No telemetry data available" 
          }));
          return;
        }
      };
      
      // Use dynamic interval with slight variation for realism
      const scheduleNext = () => {
        if (ws.readyState !== WebSocket.OPEN || isPaused) return;
        
        // Add small random variation to interval (10-20Hz range)
        const variation = intervalMs * 0.1 * (Math.random() - 0.5); // ±10% variation
        const nextInterval = Math.max(50, Math.min(100, intervalMs + variation));
        
        timer = setTimeout(() => {
          sendNextBatch();
          scheduleNext();
        }, nextInterval);
      };
      
      scheduleNext();
    };

    startReplay();

  ws.on("message", (msg) => {
      try {
        const cmd = JSON.parse(msg.toString());
        
        if (cmd.type === "set_speed" && cmd.intervalMs) {
          if (timer) clearTimeout(timer);
          intervalMs = Math.max(40, Math.min(500, cmd.intervalMs)); // Clamp between 40-500ms
          timer = null;
          startReplay();
        } else if (cmd.type === "set_track" && cmd.trackId) {
          // Switch to different track
          const normalizedTrackId = cmd.trackId.toLowerCase();
          if (trackData[normalizedTrackId]) {
            simulator.loadTrackData(trackData[normalizedTrackId]);
            // Reset all vehicle indices
            const newVehicles = simulator.getVehicles();
            vehicleIndices.clear();
            newVehicles.forEach(vehicleId => {
              vehicleIndices.set(vehicleId, 0);
            });
            ws.send(JSON.stringify({ 
              type: "track_changed", 
              track: normalizedTrackId,
              vehicles: newVehicles 
            }));
          } else {
            ws.send(JSON.stringify({ 
              type: "error", 
              message: `Track not found: ${normalizedTrackId}`,
              available_tracks: Object.keys(trackData)
            }));
          }
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
      if (timer) clearTimeout(timer);
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
  if (simulator.getVehicles().length > 0) {
    console.log(`Active track: ${DEFAULT_TRACK}`);
    console.log(`Vehicles streaming: ${simulator.getVehicles().join(', ')}`);
  }
  console.log("=".repeat(60));
});
