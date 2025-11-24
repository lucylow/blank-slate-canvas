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

// Router loop: read new tasks and push to agent inbox with error handling
async function routeLoop() {
  let lastId = '$';
  let consecutiveErrors = 0;
  const maxConsecutiveErrors = 10;

  while (true) {
    try {
      // Test connection periodically
      if (consecutiveErrors > 0 && consecutiveErrors % 5 === 0) {
        try {
          await redis.ping();
          consecutiveErrors = 0;
        } catch (pingErr) {
          console.error('[Orchestrator] Redis connection lost, attempting reconnect:', pingErr.message);
          try {
            await redis.connect();
            console.log('[Orchestrator] Redis reconnected');
          } catch (reconnectErr) {
            console.error('[Orchestrator] Reconnection failed:', reconnectErr.message);
            consecutiveErrors++;
            if (consecutiveErrors >= maxConsecutiveErrors) {
              throw new Error('Too many consecutive connection errors');
            }
            await new Promise(r => setTimeout(r, 5000 * consecutiveErrors));
            continue;
          }
        }
      }

      // block read for new tasks for up to 2s
      const res = await redis.xread('BLOCK', 2000, 'COUNT', 1, 'STREAMS', TASK_STREAM, lastId);
      consecutiveErrors = 0; // Reset on success

      if (!res) continue;
      
      const [stream, entries] = res[0];
      for (const [id, fields] of entries) {
        try {
          // fields format: ['task', '<json>']
          const taskJson = fields[1];
          if (!taskJson) {
            console.warn(`[Orchestrator] No task data in message ${id}`);
            continue;
          }

          let task;
          try {
            task = JSON.parse(taskJson);
          } catch (parseErr) {
            console.error(`[Orchestrator] Failed to parse task JSON for message ${id}:`, parseErr.message);
            continue;
          }

          task._stream_id = id;
          
          // simple routing
          const agentId = await pickAgentForTask(task.task_type, task.track);
          if (!agentId) {
            // put back with delay
            await requeueTask(task, 1000);
            await redis.hset(TASK_META_HASH, task.task_id || uuidv4(), JSON.stringify({ 
              status: 'pending_no_agent', 
              created_at: new Date().toISOString() 
            })).catch(err => {
              console.error('[Orchestrator] Failed to update task meta:', err.message);
            });
          } else {
            try {
              const inboxKey = `agent:${agentId}:inbox`;
              await redis.rpush(inboxKey, JSON.stringify(task));
              await redis.hset(TASK_META_HASH, task.task_id, JSON.stringify({ 
                status: 'assigned', 
                assigned_to: agentId, 
                assigned_at: new Date().toISOString() 
              })).catch(err => {
                console.warn('[Orchestrator] Failed to update task meta:', err.message);
              });
            } catch (routingErr) {
              console.error(`[Orchestrator] Failed to route task to ${agentId}:`, routingErr.message);
              // Try to requeue the task
              await requeueTask(task, 2000).catch(err => {
                console.error('[Orchestrator] Failed to requeue task:', err.message);
              });
            }
          }
          lastId = id;
        } catch (err) {
          console.error(`[Orchestrator] Error processing task message ${id}:`, err.message);
          // Continue processing other messages
        }
      }
    } catch (err) {
      consecutiveErrors++;
      console.error(`[Orchestrator] Route loop error (${consecutiveErrors}/${maxConsecutiveErrors}):`, err.message);
      
      if (consecutiveErrors >= maxConsecutiveErrors) {
        console.error('[Orchestrator] Too many consecutive errors, shutting down');
        throw err;
      }
      
      await new Promise(r => setTimeout(r, 1000 * consecutiveErrors));
    }
  }
}

routeLoop().catch(e => console.error('router failure', e));

// small UI pages for debug

app.listen(process.env.ORCH_PORT || 9090, () => console.log('Orchestrator API listening on', process.env.ORCH_PORT || 9090));



