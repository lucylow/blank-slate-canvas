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
const { DEMO_CONFIG, normalizeTrackId } = require("./demo-config");
const { loadAllDemoData, getDemoDataSummary } = require("./demo-loader");

// Load demo data using centralized loader
let telemetry = [];
let trackData = {};
let agentData = null;
const simulator = new TelemetrySimulator();

// Load AI agents demo data
function loadAgentData() {
  const agentDataPath = path.join(__dirname, "..", "public", "demo_data", "ai_agents_demo.json");
  
  // Also check if extracted from tar archive
  const extractedPath = path.join(__dirname, "..", "demo_data", "ai_agents_demo.json");
  
  let filePath = agentDataPath;
  if (!fs.existsSync(filePath) && fs.existsSync(extractedPath)) {
    filePath = extractedPath;
  }
  
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      agentData = JSON.parse(content);
      console.log(`✓ Loaded AI agents demo data: ${agentData.agents?.length || 0} agents, ${agentData.decisions?.length || 0} decisions`);
    } catch (error) {
      console.warn(`Failed to load AI agents demo data from ${filePath}:`, error.message);
    }
  } else {
    console.warn(`AI agents demo data not found at ${filePath}`);
  }
}

function loadDemoData() {
  console.log("Loading demo data...");
  const results = loadAllDemoData();
  
  telemetry = results.telemetry;
  trackData = results.trackData;
  
  // Log summary
  const summary = getDemoDataSummary(results);
  console.log("=".repeat(60));
  console.log("Demo Data Loading Summary:");
  console.log(`  Telemetry points: ${summary.telemetry_count}`);
  console.log(`  Tracks available: ${summary.tracks_available}`);
  if (summary.track_ids.length > 0) {
    console.log(`  Track IDs: ${summary.track_ids.join(", ")}`);
  }
  
  if (summary.sources.length > 0) {
    console.log("  Sources:");
    summary.sources.forEach(source => {
      if (source.type === 'primary' || source.type === 'fallback') {
        console.log(`    - ${source.type}: ${source.path} (${source.count} points, ${source.format})`);
      } else {
        console.log(`    - ${source.type}: ${source.track} (${source.count} points)`);
      }
    });
  }
  
  if (summary.warnings.length > 0) {
    console.log("  Warnings:");
    summary.warnings.forEach(w => console.log(`    ⚠ ${w}`));
  }
  
  if (summary.errors.length > 0) {
    console.log("  Errors:");
    summary.errors.forEach(e => console.log(`    ✗ ${e}`));
  }
  
  // Process default track data for WebSocket streaming
  const defaultTrack = normalizeTrackId(DEMO_CONFIG.DEFAULT_TRACK);
  if (trackData[defaultTrack]) {
    try {
      simulator.loadTrackData(trackData[defaultTrack]);
      // Also populate legacy telemetry array for backward compatibility
      telemetry = simulator.getAllPoints();
      console.log(`✓ Processed ${telemetry.length} telemetry points from ${defaultTrack} for WebSocket streaming`);
    } catch (error) {
      console.warn(`Failed to process ${defaultTrack} for simulator:`, error.message);
    }
  }
  
  console.log("=".repeat(60));
}

loadDemoData();
loadAgentData();



const app = express();

// CORS middleware
app.use(cors());
app.use(express.json());
app.use(express.static(require("path").join(__dirname, "..", "public")));

// REST endpoint: Get full demo dataset
app.get("/api/demo_data", (req, res) => {
  const summary = getDemoDataSummary({ telemetry, trackData, sources: [], errors: [], warnings: [] });
  res.json({
    meta: {
      source: DEMO_CONFIG.DEMO_DATA_PATH,
      count: telemetry.length,
      tracks_available: Object.keys(trackData).length,
      track_ids: Object.keys(trackData).sort(),
      loaded_at: new Date().toISOString(),
      config: {
        default_track: DEMO_CONFIG.DEFAULT_TRACK,
        max_response_points: DEMO_CONFIG.MAX_TELEMETRY_RESPONSE
      }
    },
    telemetry: telemetry.slice(0, DEMO_CONFIG.MAX_TELEMETRY_RESPONSE),
    tracks: trackData
  });
});

// REST endpoint: Get demo prediction per track/chassis
app.get("/api/predict_demo/:track/:chassis", (req, res) => {
  const { track, chassis } = req.params;

  // Normalize track ID
  const trackId = normalizeTrackId(track);
  if (!trackId) {
    return res.status(400).json({ error: "Invalid track identifier" });
  }

  // Get telemetry points for this track/chassis
  const normalizedChassis = chassis ? chassis.toLowerCase().trim() : null;
  const points = telemetry.filter(p => {
    const pTrack = normalizeTrackId(p.track);
    const pChassis = (p.chassis || p.vehicle_id || "").toLowerCase();
    return pTrack === trackId && (!normalizedChassis || pChassis.includes(normalizedChassis));
  });

  // If no points found, try to get from track-specific demo files
  let trackTelemetry = [];
  if (points.length === 0 && trackData[trackId]) {
    const trackDemo = trackData[trackId];
    if (trackDemo.races && trackDemo.races.length > 0) {
      // Try to find matching chassis in races
      for (const race of trackDemo.races) {
        if (race.telemetry_sample && Array.isArray(race.telemetry_sample)) {
          const racePoints = normalizedChassis
            ? race.telemetry_sample.filter(p => {
                const pChassis = (p.chassis || p.vehicle_id || "").toLowerCase();
                return !normalizedChassis || pChassis.includes(normalizedChassis);
              })
            : race.telemetry_sample;
          
          if (racePoints.length > 0) {
            trackTelemetry = racePoints;
            break;
          }
        }
      }
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
    active_track: simulator.currentTrack || DEMO_CONFIG.DEFAULT_TRACK,
    active_vehicles: simulator.getVehicles(),
    time: new Date().toISOString(),
    demo_mode: true
  });
});

// API endpoint to switch active track for WebSocket streaming
app.post("/api/set_track/:trackId", (req, res) => {
  const { trackId } = req.params;
  const normalized = normalizeTrackId(trackId);
  
  if (!normalized) {
    return res.status(400).json({
      error: "Invalid track identifier",
      provided: trackId
    });
  }
  
  if (!trackData[normalized]) {
    return res.status(404).json({
      error: "Track not found",
      track_id: normalized,
      available_tracks: Object.keys(trackData).sort()
    });
  }
  
  try {
    simulator.loadTrackData(trackData[normalized]);
    telemetry = simulator.getAllPoints(); // Update legacy array
    
    res.json({
      success: true,
      track: normalized,
      track_name: trackData[normalized].track_name || normalized,
      location: trackData[normalized].location,
      vehicles: simulator.getVehicles(),
      telemetry_points: telemetry.length,
      races_available: trackData[normalized].races?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to load track",
      message: error.message,
      track_id: normalized
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
    active_track: simulator.currentTrack || DEMO_CONFIG.DEFAULT_TRACK
  });
});

// AI Agents API endpoints for demo mode
app.get("/api/agents/status", (req, res) => {
  if (!agentData) {
    return res.status(503).json({
      success: false,
      error: "AI agents demo data not available",
      agents: [],
      queues: { tasksLength: 0, resultsLength: 0, inboxLengths: [] },
      redis_available: false,
      timestamp: new Date().toISOString()
    });
  }

  const agents = agentData.agents || [];
  const queues = {
    tasksLength: 0,
    resultsLength: agentData.decisions?.length || 0,
    inboxLengths: agents.map(agent => ({
      agentId: agent.id,
      length: 0
    }))
  };

  res.json({
    success: true,
    agents: agents.map(agent => ({
      id: agent.id,
      type: agent.type,
      status: agent.status,
      registered_at: agent.registered_at,
      tracks: agent.tracks || []
    })),
    queues,
    redis_available: false,
    demo_mode: true,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/agents/decisions", (req, res) => {
  const { track, chassis, limit = 50, decision_type } = req.query;

  if (!agentData || !agentData.decisions) {
    return res.json({
      success: true,
      decisions: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }

  let decisions = [...(agentData.decisions || [])];

  // Apply filters
  if (track) {
    const normalizedTrack = normalizeTrackId(track);
    decisions = decisions.filter(d => normalizeTrackId(d.track) === normalizedTrack);
  }

  if (chassis) {
    const normalizedChassis = chassis.toLowerCase().trim();
    decisions = decisions.filter(d => {
      const dChassis = (d.chassis || "").toLowerCase();
      return dChassis.includes(normalizedChassis);
    });
  }

  if (decision_type) {
    decisions = decisions.filter(d => d.decision_type === decision_type);
  }

  // Limit results
  const limitNum = parseInt(limit, 10) || 50;
  decisions = decisions.slice(0, limitNum);

  res.json({
    success: true,
    decisions,
    count: decisions.length,
    timestamp: new Date().toISOString()
  });
});

app.get("/api/agents/insights/:insight_id", (req, res) => {
  const { insight_id } = req.params;

  if (!agentData) {
    return res.status(404).json({
      success: false,
      error: "AI agents demo data not available"
    });
  }

  // Check insights array
  if (agentData.insights) {
    const insight = agentData.insights.find(i => i.insight_id === insight_id);
    if (insight) {
      return res.json({
        success: true,
        insight,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Check decisions array as fallback
  if (agentData.decisions) {
    const decision = agentData.decisions.find(d => d.decision_id === insight_id);
    if (decision) {
      return res.json({
        success: true,
        insight: {
          decision_id: decision.decision_id,
          agent_id: decision.agent_id,
          agent_type: decision.agent_type,
          decision_type: decision.decision_type,
          action: decision.action,
          confidence: decision.confidence,
          risk_level: decision.risk_level,
          reasoning: decision.reasoning || [],
          evidence: decision.evidence || {},
          alternatives: decision.alternatives || []
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  res.status(404).json({
    success: false,
    error: `Insight '${insight_id}' not found`
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

    let intervalMs = DEMO_CONFIG.DEFAULT_INTERVAL_MS;
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
        const nextInterval = Math.max(
          DEMO_CONFIG.MIN_INTERVAL_MS, 
          Math.min(DEMO_CONFIG.MAX_INTERVAL_MS, intervalMs + variation)
        );
        
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
          intervalMs = Math.max(DEMO_CONFIG.MIN_INTERVAL_MS, Math.min(DEMO_CONFIG.MAX_INTERVAL_MS, cmd.intervalMs));
          timer = null;
          startReplay();
        } else if (cmd.type === "set_track" && cmd.trackId) {
          // Switch to different track
          const normalized = normalizeTrackId(cmd.trackId);
          if (normalized && trackData[normalized]) {
            simulator.loadTrackData(trackData[normalized]);
            // Reset all vehicle indices
            const newVehicles = simulator.getVehicles();
            vehicleIndices.clear();
            newVehicles.forEach(vehicleId => {
              vehicleIndices.set(vehicleId, 0);
            });
            ws.send(JSON.stringify({ 
              type: "track_changed", 
              track: normalized,
              track_name: trackData[normalized].track_name || normalized,
              vehicles: newVehicles 
            }));
          } else {
            ws.send(JSON.stringify({ 
              type: "error", 
              message: `Track not found: ${cmd.trackId}`,
              track_id: normalized || cmd.trackId,
              available_tracks: Object.keys(trackData).sort()
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



server.listen(DEMO_CONFIG.PORT, () => {
  const summary = getDemoDataSummary({ telemetry, trackData, sources: [], errors: [], warnings: [] });
  console.log("=".repeat(60));
  console.log(`Demo server listening on http://localhost:${DEMO_CONFIG.PORT}`);
  console.log(`WebSocket endpoints:`);
  console.log(`  - ws://localhost:${DEMO_CONFIG.PORT}/ws`);
  console.log(`  - ws://localhost:${DEMO_CONFIG.PORT}/ws/demo`);
  console.log(`REST endpoints:`);
  console.log(`  - GET /api/demo_data`);
  console.log(`  - GET /api/predict_demo/:track/:chassis`);
  console.log(`  - GET /api/tracks`);
  console.log(`  - POST /api/set_track/:trackId`);
  console.log(`  - GET /api/agents/status`);
  console.log(`  - GET /api/agents/decisions`);
  console.log(`  - GET /api/agents/insights/:insight_id`);
  console.log(`  - GET /api/health`);
  console.log(`  - GET /health`);
  console.log(`Data loaded:`);
  console.log(`  - Telemetry points: ${summary.telemetry_count}`);
  console.log(`  - Tracks available: ${summary.tracks_available}`);
  if (summary.track_ids.length > 0) {
    console.log(`  - Track IDs: ${summary.track_ids.join(", ")}`);
  }
  if (simulator.getVehicles().length > 0) {
    console.log(`Active track: ${DEMO_CONFIG.DEFAULT_TRACK}`);
    console.log(`Vehicles streaming: ${simulator.getVehicles().join(', ')}`);
  }
  console.log("=".repeat(60));
});
