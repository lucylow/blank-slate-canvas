// backend/index.js
// Simple Express REST for flags + WebSocket agent streamer (mock events)

import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = join(__dirname, "data");
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR);

// flags store (simple JSON file)
const FLAGS_FILE = join(DATA_DIR, "flags.json");
// mock agents file
const AGENTS_FILE = join(DATA_DIR, "mock_agents.json");

// safe init defaults
if (!existsSync(FLAGS_FILE)) {
  writeFileSync(
    FLAGS_FILE,
    JSON.stringify(
      {
        impact_democratize_analytics: false,
        impact_driver_coaching: true,
        impact_anomaly_strategy: true,
        impact_scaling_otherseries: false,
      },
      null,
      2
    )
  );
}
if (!existsSync(AGENTS_FILE)) {
  // a few sample agent events
  const sample = [
    {
      agent: "predictor",
      ts: new Date().toISOString(),
      insight: "tire_cliff_estimated",
      car_id: 13,
      laps_until_cliff: 6,
      confidence: 0.78,
    },
    {
      agent: "simulator",
      ts: new Date().toISOString(),
      insight: "pit_recommendation",
      car_id: 13,
      recommended_pit_lap: 20,
      expected_gain_s: 3.3,
      confidence: 0.82,
    },
    {
      agent: "explainer",
      ts: new Date().toISOString(),
      insight: "shap_top_features",
      car_id: 13,
      features: [
        { name: "tire_stress_sector_1", impact: 0.21 },
        { name: "brake_energy_sector_2", impact: 0.18 },
      ],
    },
    {
      agent: "anomaly",
      ts: new Date().toISOString(),
      insight: "smoke_detected",
      car_id: 46,
      sector: 12,
      confidence: 0.92,
    },
  ];
  writeFileSync(AGENTS_FILE, JSON.stringify(sample, null, 2));
}

function readFlags() {
  try {
    return JSON.parse(readFileSync(FLAGS_FILE, "utf8"));
  } catch (e) {
    return {};
  }
}

function writeFlags(flags) {
  writeFileSync(FLAGS_FILE, JSON.stringify(flags, null, 2));
}

app.get("/api/flags", (req, res) => {
  res.json(readFlags());
});

app.post("/api/flags", (req, res) => {
  const incoming = req.body || {};
  const flags = { ...readFlags(), ...incoming };
  writeFlags(flags);
  res.json({ success: true, flags });
});

// endpoint to get mock agents
app.get("/api/mock_agents", (req, res) => {
  try {
    const data = JSON.parse(readFileSync(AGENTS_FILE, "utf8"));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "unable to read agents" });
  }
});

// Save arbitrary insight (used by frontend for demo)
app.post("/api/insights", (req, res) => {
  const insight = req.body || {};
  insight.id = insight.id || uuidv4();
  insight.ts = new Date().toISOString();
  // append to agents file (rotate small)
  try {
    const arr = JSON.parse(readFileSync(AGENTS_FILE, "utf8"));
    arr.unshift(insight);
    while (arr.length > 200) arr.pop();
    writeFileSync(AGENTS_FILE, JSON.stringify(arr, null, 2));
  } catch (e) {
    // ignore
  }
  // in a real system we'd publish to WS or broker
  res.json({ success: true, insight });
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws/agents" });

wss.on("connection", (ws, req) => {
  console.log("ws: client connected");
  // send flags on connect
  ws.send(JSON.stringify({ type: "flags", payload: readFlags() }));

  // start a small emitter for that client
  const emitInterval = setInterval(() => {
    // load mock agents file and pick a random event, slightly mutate TS
    let pool = [];
    try {
      pool = JSON.parse(readFileSync(AGENTS_FILE, "utf8"));
    } catch (e) {
      pool = [];
    }
    if (pool.length === 0) return;
    const sample = { ...pool[Math.floor(Math.random() * pool.length)] };
    sample.ts = new Date().toISOString();
    // small stochastic variation
    if (sample.laps_until_cliff) {
      sample.laps_until_cliff = Math.max(
        1,
        sample.laps_until_cliff + (Math.random() > 0.6 ? -1 : 0)
      );
    }
    ws.send(JSON.stringify({ type: "agent_event", payload: sample }));
  }, 2000 + Math.floor(Math.random() * 2500));

  ws.on("message", (msg) => {
    // accept simple ping or commands like 'get_flags'
    try {
      const parsed = JSON.parse(msg.toString());
      if (parsed?.cmd === "get_flags") {
        ws.send(JSON.stringify({ type: "flags", payload: readFlags() }));
      }
    } catch (e) {
      // ignore
    }
  });

  ws.on("close", () => {
    clearInterval(emitInterval);
    console.log("ws: client disconnected");
  });
});

// start server
const PORT = process.env.PORT || 4001;
server.listen(PORT, () => {
  console.log(`Backend mock server running on http://localhost:${PORT}`);
  console.log(`REST: /api/flags, /api/mock_agents, /api/insights`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws/agents`);
});


