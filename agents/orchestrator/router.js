// orchestrator/router.js
// Multi-agent orchestrator with Redis Streams routing

const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class AgentOrchestrator {
  constructor(config = {}) {
    this.redis = new Redis(config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    this.agentRegistry = new Map(); // agent_id -> { types, tracks, capacity, lastHeartbeat }
    this.taskQueue = [];
    this.routingRules = {
      priority: ['high', 'medium', 'low'],
      timeout: {
        eda: 3000,
        predictor: 200,
        simulator: 5000,
        explainer: 1000,
        preprocessor: 100
      }
    };
    this.metrics = {
      tasksProcessed: 0,
      tasksFailed: 0,
      avgLatency: 0,
      agentCount: 0
    };
  }

  // Agent registration endpoint
  async registerAgent(agentId, agentInfo) {
    const { types, tracks, capacity = 4 } = agentInfo;
    const typesArray = Array.isArray(types) ? types : [types];
    const tracksArray = Array.isArray(tracks) ? tracks : [tracks];
    this.agentRegistry.set(agentId, {
      types: typesArray,
      tracks: tracksArray,
      capacity,
      lastHeartbeat: Date.now(),
      currentLoad: 0
    });
    this.metrics.agentCount = this.agentRegistry.size;
    console.log(`[Orchestrator] Agent registered: ${agentId} (types: ${typesArray.join(', ')}, tracks: ${tracksArray.join(', ')})`);
    return { success: true, agentId };
  }

  // Heartbeat from agents
  async heartbeat(agentId) {
    const agent = this.agentRegistry.get(agentId);
    if (agent) {
      agent.lastHeartbeat = Date.now();
      return { success: true };
    }
    return { success: false, error: 'Agent not found' };
  }

  // Publish task to Redis stream
  async publishTask(task) {
    const taskId = task.task_id || uuidv4();
    const taskWithId = {
      ...task,
      task_id: taskId,
      created_at: new Date().toISOString(),
      attempts: 0,
      max_attempts: 3
    };
    
    // Create routing key: track.agent_type.priority
    const routingKey = `${task.track || 'default'}.${task.task_type}.${task.priority || 'medium'}`;
    
    await this.redis.xadd('tasks.stream', '*', 
      'task', JSON.stringify(taskWithId),
      'routing_key', routingKey
    );
    
    console.log(`[Orchestrator] Task published: ${taskId} (${routingKey})`);
    return taskId;
  }

  // Pick best agent for task
  async pickAgent(taskType, track, priority = 'medium') {
    const candidates = Array.from(this.agentRegistry.entries())
      .filter(([id, agent]) => {
        // Check if agent supports this task type
        if (!agent.types.includes(taskType)) return false;
        
        // Check if agent supports this track (or supports all tracks)
        if (agent.tracks.length > 0 && !agent.tracks.includes('*') && !agent.tracks.includes(track)) {
          return false;
        }
        
        // Check capacity
        if (agent.currentLoad >= agent.capacity) return false;
        
        // Check if agent is alive (heartbeat within last 30s)
        if (Date.now() - agent.lastHeartbeat > 30000) return false;
        
        return true;
      })
      .map(([id, agent]) => ({
        id,
        ...agent,
        // Prefer agents with track affinity
        affinity: agent.tracks.includes(track) ? 1 : 0,
        // Prefer agents with lower load
        loadScore: agent.currentLoad / agent.capacity
      }))
      .sort((a, b) => {
        // Sort by affinity first, then load
        if (a.affinity !== b.affinity) return b.affinity - a.affinity;
        return a.loadScore - b.loadScore;
      });

    return candidates.length > 0 ? candidates[0] : null;
  }

  // Route tasks from stream to agents
  async routeLoop() {
    const consumerGroup = 'orchestrator';
    const consumerName = `orchestrator-${process.pid}`;
    
    try {
      // Create consumer group if it doesn't exist
      await this.redis.xgroup('CREATE', 'tasks.stream', consumerGroup, '0', 'MKSTREAM').catch(() => {});
    } catch (err) {
      // Group might already exist
    }

    while (true) {
      try {
        // Read tasks from stream
        const res = await this.redis.xreadgroup(
          'GROUP', consumerGroup, consumerName,
          'COUNT', 10,
          'BLOCK', 2000,
          'STREAMS', 'tasks.stream', '>'
        );

        if (!res || res.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        const [stream, entries] = res[0];
        
        for (const [id, fields] of entries) {
          const taskJson = fields.find(f => f[0] === 'task')?.[1];
          if (!taskJson) continue;

          const task = JSON.parse(taskJson);
          
          // Pick agent
          const agent = await this.pickAgent(task.task_type, task.track, task.priority);
          
          if (!agent) {
            // Re-enqueue with delay if no agent available
            if (task.attempts < task.max_attempts) {
              task.attempts++;
              await new Promise(resolve => setTimeout(resolve, 1000 * task.attempts));
              await this.publishTask(task);
            } else {
              // Task failed - emit to failed stream
              await this.redis.xadd('tasks.failed', '*', 'task', JSON.stringify(task));
              this.metrics.tasksFailed++;
              console.error(`[Orchestrator] Task failed after ${task.max_attempts} attempts: ${task.task_id}`);
            }
            // Acknowledge message
            await this.redis.xack('tasks.stream', consumerGroup, id);
            continue;
          }

          // Update agent load
          const agentInfo = this.agentRegistry.get(agent.id);
          if (agentInfo) {
            agentInfo.currentLoad++;
          }

          // Push to agent inbox
          await this.redis.rpush(`agent:${agent.id}:inbox`, JSON.stringify(task));
          
          // Store task metadata
          await this.redis.hset('task_meta', task.task_id, JSON.stringify({
            assigned_to: agent.id,
            status: 'assigned',
            assigned_at: new Date().toISOString()
          }));

          console.log(`[Orchestrator] Task ${task.task_id} assigned to agent ${agent.id}`);
          
          // Acknowledge message
          await this.redis.xack('tasks.stream', consumerGroup, id);
        }
      } catch (err) {
        console.error('[Orchestrator] Routing error:', err);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Handle task results
  async handleResult(result) {
    const { task_id, agent_id } = result;
    
    // Update agent load
    const agent = this.agentRegistry.get(agent_id);
    if (agent) {
      agent.currentLoad = Math.max(0, agent.currentLoad - 1);
    }

    // Update task metadata
    await this.redis.hset('task_meta', task_id, JSON.stringify({
      status: 'completed',
      completed_at: new Date().toISOString(),
      result: result
    }));

    // Forward to results stream for delivery agent
    await this.redis.xadd('results.stream', '*', 'result', JSON.stringify(result));
    
    this.metrics.tasksProcessed++;
    console.log(`[Orchestrator] Task ${task_id} completed by agent ${agent_id}`);
  }

  // Start orchestrator
  async start() {
    console.log('[Orchestrator] Starting orchestrator...');
    
    // Start routing loop
    this.routeLoop().catch(err => {
      console.error('[Orchestrator] Fatal error in routing loop:', err);
      process.exit(1);
    });

    // Start result handler
    this.startResultHandler();

    // Cleanup dead agents periodically
    setInterval(() => {
      const now = Date.now();
      for (const [id, agent] of this.agentRegistry.entries()) {
        if (now - agent.lastHeartbeat > 60000) { // 60s timeout
          console.log(`[Orchestrator] Removing dead agent: ${id}`);
          this.agentRegistry.delete(id);
        }
      }
      this.metrics.agentCount = this.agentRegistry.size;
    }, 30000);
  }

  async startResultHandler() {
    const consumerGroup = 'orchestrator-results';
    const consumerName = `orchestrator-results-${process.pid}`;
    
    try {
      await this.redis.xgroup('CREATE', 'agent_results.stream', consumerGroup, '0', 'MKSTREAM').catch(() => {});
    } catch (err) {}

    while (true) {
      try {
        const res = await this.redis.xreadgroup(
          'GROUP', consumerGroup, consumerName,
          'COUNT', 10,
          'BLOCK', 2000,
          'STREAMS', 'agent_results.stream', '>'
        );

        if (res && res.length > 0) {
          const [stream, entries] = res[0];
          for (const [id, fields] of entries) {
            const resultJson = fields.find(f => f[0] === 'result')?.[1];
            if (resultJson) {
              const result = JSON.parse(resultJson);
              await this.handleResult(result);
            }
            await this.redis.xack('agent_results.stream', consumerGroup, id);
          }
        }
      } catch (err) {
        console.error('[Orchestrator] Result handler error:', err);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Get orchestrator status
  async getStatus() {
    return {
      agents: Array.from(this.agentRegistry.entries()).map(([id, agent]) => ({
        id,
        types: agent.types,
        tracks: agent.tracks,
        capacity: agent.capacity,
        currentLoad: agent.currentLoad,
        lastHeartbeat: new Date(agent.lastHeartbeat).toISOString()
      })),
      metrics: this.metrics,
      timestamp: new Date().toISOString()
    };
  }
}

// HTTP server for orchestrator API
const express = require('express');
const http = require('http');
const app = express();
app.use(express.json());

const orchestrator = new AgentOrchestrator();

// Agent registration endpoint
app.post('/agents/register', async (req, res) => {
  const { agent_id, types, tracks, capacity } = req.body;
  const result = await orchestrator.registerAgent(agent_id, { types, tracks, capacity });
  res.json(result);
});

// Agent heartbeat endpoint
app.post('/agents/heartbeat/:agentId', async (req, res) => {
  const { agentId } = req.params;
  const result = await orchestrator.heartbeat(agentId);
  res.json(result);
});

// Task submission endpoint
app.post('/tasks', async (req, res) => {
  const taskId = await orchestrator.publishTask(req.body);
  res.json({ task_id: taskId, status: 'queued' });
});

// Status endpoint
app.get('/agent/status', async (req, res) => {
  const status = await orchestrator.getStatus();
  res.json(status);
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'orchestrator', timestamp: new Date().toISOString() });
});

const PORT = process.env.ORCHESTRATOR_PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Orchestrator] HTTP server listening on port ${PORT}`);
  orchestrator.start();
});

module.exports = { AgentOrchestrator };

