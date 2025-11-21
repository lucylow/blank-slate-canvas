// orchestrator/index.js

// Node Orchestrator: Agent registry + Router using Redis (Streams + lists)

// Run: NODE_ENV=production node orchestrator/index.js

const express = require('express');
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(REDIS_URL);

const app = express();
app.use(bodyParser.json());

const TASK_STREAM = 'tasks.stream';
const TELEMETRY_STREAM = 'telemetry.stream';
const RESULTS_STREAM = 'results.stream';
const AGENT_REGISTRY_HASH = 'agents.registry';
const TASK_META_HASH = 'task.meta';

// seed doc available to agents
const SEED_DOC_PATH = '/mnt/data/2 Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .md';

app.get('/api/health', (req, res) => res.json({ ok: true, now: new Date().toISOString() }));

// Agent registration: POST /api/agents/register { agentId?, types:["predictor"], tracks:["cota"], capacity:2, addr }

// returns agentId
app.post('/api/agents/register', async (req, res) => {
  const { agentId, types = [], tracks = [], capacity = 1, addr = null } = req.body;
  const id = agentId || `agent-${uuidv4()}`;
  const obj = { id, types: JSON.stringify(types), tracks: JSON.stringify(tracks), capacity, addr, registered_at: new Date().toISOString() };
  await redis.hset(AGENT_REGISTRY_HASH, id, JSON.stringify(obj));
  res.json({ ok: true, agentId: id });
});

// get agents
app.get('/api/agents', async (req, res) => {
  const raw = await redis.hgetall(AGENT_REGISTRY_HASH);
  const out = Object.keys(raw).map(k => ({ id: k, ...JSON.parse(raw[k]) }));
  res.json(out);
});

// simple queue lengths: GET /api/queues
app.get('/api/queues', async (req, res) => {
  // list agent inbox lengths (for all agents)
  const agents = await redis.hkeys(AGENT_REGISTRY_HASH);
  const out = [];
  for (const id of agents) {
    const inboxKey = `agent:${id}:inbox`;
    const len = await redis.llen(inboxKey);
    out.push({ agentId: id, inbox: inboxKey, length: len });
  }
  // streams backlog lengths
  const pendingTasks = await redis.xlen(TASK_STREAM);
  const pendingResults = await redis.xlen(RESULTS_STREAM);
  res.json({ agents: out, streamBacklog: { tasks: pendingTasks, results: pendingResults }, seed_doc: SEED_DOC_PATH });
});

// Utility: pick agent matching type & track (simple affinity)
async function pickAgentForTask(taskType, track) {
  const raw = await redis.hgetall(AGENT_REGISTRY_HASH);
  for (const [id, val] of Object.entries(raw)) {
    try {
      const info = JSON.parse(val);
      const types = JSON.parse(info.types);
      const tracks = JSON.parse(info.tracks);
      if (types.includes(taskType) && (tracks.length === 0 || tracks.includes(track))) {
        // naive: don't check capacity here, keep simple
        return info.id || id;
      }
    } catch (e) { continue; }
  }
  return null;
}

// requeue with slight delay (push to stream)
async function requeueTask(task, delayMs = 500) {
  setTimeout(async () => {
    await redis.xadd(TASK_STREAM, '*', 'task', JSON.stringify(task));
  }, delayMs);
}

// Router loop: read new tasks and push to agent inbox
async function routeLoop() {
  let lastId = '$';
  while (true) {
    try {
      // block read for new tasks for up to 2s
      const res = await redis.xread('BLOCK', 2000, 'COUNT', 1, 'STREAMS', TASK_STREAM, lastId);
      if (!res) continue;
      const [stream, entries] = res[0];
      for (const [id, fields] of entries) {
        // fields format: ['task', '<json>']
        const taskJson = fields[1];
        const task = JSON.parse(taskJson);
        task._stream_id = id;
        // simple routing
        const agentId = await pickAgentForTask(task.task_type, task.track);
        if (!agentId) {
          // put back with delay
          await requeueTask(task, 1000);
          await redis.hset(TASK_META_HASH, task.task_id || uuidv4(), JSON.stringify({ status: 'pending_no_agent', created_at: new Date().toISOString() }));
        } else {
          const inboxKey = `agent:${agentId}:inbox`;
          await redis.rpush(inboxKey, JSON.stringify(task));
          await redis.hset(TASK_META_HASH, task.task_id, JSON.stringify({ status: 'assigned', assigned_to: agentId, assigned_at: new Date().toISOString() }));
        }
        lastId = id;
      }
    } catch (err) {
      console.error('Route loop error', err);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

routeLoop().catch(e => console.error('router failure', e));

// small UI pages for debug

app.listen(process.env.ORCH_PORT || 9090, () => console.log('Orchestrator API listening on', process.env.ORCH_PORT || 9090));

