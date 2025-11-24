// delivery/index.js
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(REDIS_URL);
const RESULTS_STREAM = 'results.stream';

const app = express();
app.use(bodyParser.json());
app.get('/api/health', (req, res) => res.json({ ok: true }));

// fetch full insight by id
app.get('/api/insights/:id', async (req, res) => {
  const id = req.params.id;
  const raw = await redis.hgetall(`insight:${id}`);
  if (!raw || !raw.payload) return res.status(404).json({ error: 'not found' });
  return res.json(JSON.parse(raw.payload));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws/agents' });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', now: new Date().toISOString() }));
});

async function broadcast(msg) {
  const s = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      // basic backpressure check
      if (client.bufferedAmount > 2e6) continue;
      client.send(s);
    }
  }
}

// consume results.stream and broadcast
async function consumeResultsLoop() {
  let lastId = '$';
  while (true) {
    try {
      const res = await redis.xread('BLOCK', 2000, 'COUNT', 10, 'STREAMS', RESULTS_STREAM, lastId);
      if (!res) continue;
      const [stream, entries] = res[0];
      for (const [id, fields] of entries) {
        const raw = JSON.parse(fields[1]);
        lastId = id;
        // broadcast simplified message to clients as 'insight_update' or 'eda_result'
        const type = raw.type || 'insight_update';
        await broadcast({ type, data: raw });
      }
    } catch (err) {
      console.error('deliver consume err', err);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

consumeResultsLoop().catch(e => console.error('delivery failed', e));

server.listen(process.env.DELIVER_PORT || 8082, () => console.log('Delivery WS server running at', process.env.DELIVER_PORT || 8082));



