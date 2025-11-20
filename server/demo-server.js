// server/demo-server.js

// Simple demo server: WebSocket telemetry replay + /predict_tire endpoint

// Usage: node server/demo-server.js



const path = require("path");

const fs = require("fs");

const http = require("http");

const express = require("express");

const WebSocket = require("ws");



// Config

const PORT = process.env.PORT || 8081;

const SAMPLE_PATH = path.join(__dirname, "sample_data", "sample_laps.json");



if (!fs.existsSync(SAMPLE_PATH)) {

  console.error("Missing sample data. Expected:", SAMPLE_PATH);

  process.exit(1);

}



const sample = JSON.parse(fs.readFileSync(SAMPLE_PATH, "utf8"));



const app = express();

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "public"))); // serve any demo assets (optional)



// /predict_tire/:track/:chassis -> deterministic demo response

app.get("/predict_tire/:track/:chassis", (req, res) => {

  const { track, chassis } = req.params;

  // simple deterministic but plausible payload for demo

  const resp = {

    chassis,

    track,

    predicted_loss_per_lap_s: 0.28,

    laps_until_0_5s_loss: 2,

    recommended_pit_lap: 3,

    explanation: [

      "High tire_stress in S2 (braking-dominant sector)",

      "Avg speed on long straight is increasing (thermal buildup)",

      "Driver brake bias shows repeated rear lockups in last lap"

    ],

    meta: { demo: true, generated_at: new Date().toISOString() }

  };

  res.json(resp);

});



// simple health endpoint

app.get("/health", (_, res) => res.json({ status: "ok", time: new Date().toISOString() }));



const server = http.createServer(app);



// WebSocket server for telemetry replay

const wss = new WebSocket.Server({ server, path: "/ws" });



wss.on("connection", (ws) => {

  console.log("WS client connected");

  // Replay the sample telemetry in a loop

  let idx = 0;

  const intervalMs = 80; // adjust for demo speed

  const timer = setInterval(() => {

    if (ws.readyState !== WebSocket.OPEN) return;

    const point = sample[idx % sample.length];

    ws.send(JSON.stringify(point));

    idx++;

  }, intervalMs);



  ws.on("message", (msg) => {

    // For demo, accept a simple "{ \"cmd\": \"ping\" }" or "subscribe" messages

    try {

      const data = JSON.parse(msg.toString());

      if (data && data.cmd === "ping") {

        ws.send(JSON.stringify({ type: "pong", time: new Date().toISOString() }));

      }

    } catch (e) {

      // ignore

    }

  });



  ws.on("close", () => {

    clearInterval(timer);

    console.log("WS client disconnected");

  });

});



server.listen(PORT, () => {

  console.log(`Demo server listening on http://localhost:${PORT}`);

  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);

});
