// server/agent-api-server.js
// Express server for AI Agent System API endpoints
// Usage: REDIS_URL=redis://localhost:6379 node server/agent-api-server.js

const express = require('express');
const cors = require('cors');
const path = require('path');

// Import Redis client - adjust path based on where server is run from
let redisClient;
try {
  // Try relative path first (when run from project root)
  redisClient = require(path.join(__dirname, '../src/services/redisClient'));
} catch (e) {
  // Fallback: create a simple Redis client wrapper
  const Redis = require('ioredis');
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = new Redis(REDIS_URL);
  
  redisClient = {
    client: redis,
    streams: {
      TELEMETRY: 'telemetry.stream',
      TASKS: 'tasks.stream',
      RESULTS: 'results.stream',
      AGENT_REGISTRY: 'agents.registry'
    },
    async addTelemetry(data) {
      return await redis.xadd(
        this.streams.TELEMETRY,
        '*',
        'data',
        JSON.stringify({
          ...data,
          ingested_at: new Date().toISOString(),
          source: 'pitwall-frontend'
        })
      );
    },
    async getInsight(insightId) {
      const result = await redis.hgetall(`insight:${insightId}`);
      return result?.payload ? JSON.parse(result.payload) : null;
    },
    async getAgentStatus() {
      const agents = await redis.hgetall(this.streams.AGENT_REGISTRY);
      return Object.entries(agents).map(([id, data]) => ({
        id,
        ...JSON.parse(data)
      }));
    },
    async getQueueLengths() {
      const tasksLength = await redis.xlen(this.streams.TASKS);
      const resultsLength = await redis.xlen(this.streams.RESULTS);
      const agents = await this.getAgentStatus();
      const inboxLengths = await Promise.all(
        agents.map(async (agent) => ({
          agentId: agent.id,
          length: await redis.llen(`agent:${agent.id}:inbox`)
        }))
      );
      return { tasksLength, resultsLength, inboxLengths };
    },
    async disconnect() {
      await redis.quit();
    }
  };
}

const app = express();
const PORT = process.env.AGENT_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'agent-api' });
});

// Agent system API routes
app.get('/api/agents/status', async (req, res) => {
  try {
    const agents = await redisClient.getAgentStatus();
    const queues = await redisClient.getQueueLengths();
    
    res.json({
      agents,
      queues,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching agent status:', error);
    res.status(500).json({ error: 'Failed to fetch agent status' });
  }
});

app.get('/api/insights/:id', async (req, res) => {
  try {
    const insight = await redisClient.getInsight(req.params.id);
    
    if (!insight) {
      return res.status(404).json({ error: 'Insight not found' });
    }
    
    res.json(insight);
  } catch (error) {
    console.error('Error fetching insight:', error);
    res.status(500).json({ error: 'Failed to fetch insight' });
  }
});

app.post('/api/telemetry', async (req, res) => {
  try {
    const telemetryData = req.body;
    
    // Validate required fields
    if (!telemetryData.track || !telemetryData.chassis) {
      return res.status(400).json({ 
        error: 'Missing required fields: track and chassis' 
      });
    }

    // Add to Redis stream
    const messageId = await redisClient.addTelemetry(telemetryData);
    
    res.json({
      success: true,
      messageId,
      ingestedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error ingesting telemetry:', error);
    res.status(500).json({ error: 'Failed to ingest telemetry' });
  }
});

app.get('/api/system/health', async (req, res) => {
  try {
    const [agents, queues, redisStatus] = await Promise.all([
      redisClient.getAgentStatus(),
      redisClient.getQueueLengths(),
      redisClient.client.ping().then(() => 'healthy').catch(() => 'unhealthy')
    ]);

    res.json({
      status: 'healthy',
      components: {
        redis: redisStatus,
        agents: agents.length > 0 ? 'healthy' : 'degraded',
        queues: queues.tasksLength < 1000 ? 'healthy' : 'busy'
      },
      summary: {
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.status === 'active').length,
        pendingTasks: queues.tasksLength,
        recentInsights: queues.resultsLength
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Agent API Server running on port ${PORT}`);
  console.log(`📡 Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await redisClient.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await redisClient.disconnect();
  process.exit(0);
});

module.exports = app;

