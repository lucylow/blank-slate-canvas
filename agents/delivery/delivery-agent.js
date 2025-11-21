// agents/delivery/delivery-agent.js
// Delivery Agent: Broadcasts insights via WebSocket and REST API

const Redis = require('ioredis');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');

class DeliveryAgent {
  constructor(config = {}) {
    this.agentId = config.agentId || `delivery-${process.pid}`;
    this.redis = new Redis(config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    this.orchestratorUrl = config.orchestratorUrl || process.env.ORCHESTRATOR_URL || 'http://localhost:3000';
    this.wsPort = config.wsPort || process.env.WS_PORT || 8082;
    this.httpPort = config.httpPort || process.env.HTTP_PORT || 3001;
    
    this.wss = null;
    this.clients = new Set();
    this.insightHistory = new Map(); // insight_id -> insight
    this.maxHistory = 1000;
  }

  // Register with orchestrator
  async register() {
    try {
      const response = await fetch(`${this.orchestratorUrl}/agents/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: this.agentId,
          types: ['delivery'],
          tracks: ['*'],
          capacity: 20
        })
      });
      const result = await response.json();
      console.log(`[Delivery] Registered: ${result.success ? 'OK' : 'FAILED'}`);
      return result.success;
    } catch (err) {
      console.error('[Delivery] Registration failed:', err);
      return false;
    }
  }

  // Send heartbeat
  async heartbeat() {
    try {
      await fetch(`${this.orchestratorUrl}/agents/heartbeat/${this.agentId}`, {
        method: 'POST'
      });
    } catch (err) {
      // Silent fail
    }
  }

  // Setup WebSocket server
  setupWebSocket() {
    const server = http.createServer();
    this.wss = new WebSocket.Server({ server });

    this.wss.on('connection', (ws, req) => {
      console.log(`[Delivery] WebSocket client connected from ${req.socket.remoteAddress}`);
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('[Delivery] WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('[Delivery] WebSocket error:', err);
        this.clients.delete(ws);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        agent: 'delivery',
        timestamp: new Date().toISOString()
      }));
    });

    server.listen(this.wsPort, () => {
      console.log(`[Delivery] WebSocket server listening on port ${this.wsPort}`);
    });
  }

  // Broadcast message to all WebSocket clients
  broadcast(message) {
    const messageStr = JSON.stringify(message);
    let sent = 0;
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          sent++;
        } catch (err) {
          console.error('[Delivery] Broadcast error:', err);
          this.clients.delete(client);
        }
      }
    });
    if (sent > 0) {
      console.log(`[Delivery] Broadcast to ${sent} clients: ${message.type}`);
    }
  }

  // Handle insight result
  async handleInsight(result) {
    const insight = result.insight;
    if (!insight) return;

    // Store in history
    this.insightHistory.set(insight.id, insight);
    
    // Trim history
    if (this.insightHistory.size > this.maxHistory) {
      const firstKey = this.insightHistory.keys().next().value;
      this.insightHistory.delete(firstKey);
    }

    // Broadcast via WebSocket
    this.broadcast({
      type: 'insight_update',
      data: insight,
      timestamp: new Date().toISOString()
    });

    // Also broadcast aggregate update if available
    if (result.aggregate) {
      this.broadcast({
        type: 'aggregate_update',
        data: result.aggregate,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Setup REST API
  setupRestAPI() {
    const app = express();
    app.use(express.json());

    // Get insight by ID
    app.get('/insights/:id', (req, res) => {
      const { id } = req.params;
      const insight = this.insightHistory.get(id);
      if (insight) {
        res.json(insight);
      } else {
        res.status(404).json({ error: 'Insight not found' });
      }
    });

    // Get recent insights
    app.get('/insights', (req, res) => {
      const limit = parseInt(req.query.limit) || 10;
      const insights = Array.from(this.insightHistory.values())
        .slice(-limit)
        .reverse();
      res.json({ insights, count: insights.length });
    });

    // Predict tire (proxy to orchestrator)
    app.get('/predict_tire/:track/:chassis', async (req, res) => {
      const { track, chassis } = req.params;
      
      // This would trigger a task in the orchestrator
      // For now, return a placeholder
      res.json({
        track,
        chassis,
        predicted_loss_per_lap_seconds: 0.32,
        laps_until_0_5s_loss: 6.2,
        model_version: 'tire-v1.0'
      });
    });

    // Simulate strategy
    app.post('/simulate_strategy', async (req, res) => {
      const { predictions, current_lap, total_laps } = req.body;
      
      // This would trigger a simulator task
      res.json({
        scenarios: [
          {
            name: 'pit_now',
            pit_lap: current_lap,
            total_time: 120.5
          },
          {
            name: 'pit_later',
            pit_lap: current_lap + 5,
            total_time: 118.2
          }
        ],
        best_strategy: 'pit_later'
      });
    });

    // Health endpoint
    app.get('/health', (req, res) => {
      res.json({
        ok: true,
        service: 'delivery',
        clients: this.clients.size,
        insights_cached: this.insightHistory.size,
        timestamp: new Date().toISOString()
      });
    });

    app.listen(this.httpPort, () => {
      console.log(`[Delivery] REST API listening on port ${this.httpPort}`);
    });
  }

  // Process results from stream
  async processResults() {
    const consumerGroup = 'delivery';
    const consumerName = `delivery-${process.pid}`;

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

        if (!res || res.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        const [stream, entries] = res[0];

        for (const [id, fields] of entries) {
          const resultJson = fields.find(f => f[0] === 'result')?.[1];
          if (!resultJson) {
            await this.redis.xack('agent_results.stream', consumerGroup, id);
            continue;
          }

          const result = JSON.parse(resultJson);
          
          // Route based on task type
          if (result.task_type === 'explainer' && result.result?.insight) {
            await this.handleInsight(result.result);
          } else if (result.task_type === 'preprocessor' && result.result?.aggregate_window_id) {
            // Broadcast aggregate update
            this.broadcast({
              type: 'aggregate_update',
              data: result.result,
              timestamp: new Date().toISOString()
            });
          } else if (result.task_type === 'eda' && result.result?.clustering) {
            // Broadcast EDA results
            this.broadcast({
              type: 'eda_update',
              data: result.result,
              timestamp: new Date().toISOString()
            });
          }

          await this.redis.xack('agent_results.stream', consumerGroup, id);
        }
      } catch (err) {
        console.error('[Delivery] Result processing error:', err);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Start delivery agent
  async start() {
    await this.register();
    this.setupWebSocket();
    this.setupRestAPI();

    // Send heartbeat every 10s
    setInterval(() => this.heartbeat(), 10000);

    // Start processing results
    this.processResults().catch(err => {
      console.error('[Delivery] Fatal error in result processing:', err);
      process.exit(1);
    });
  }
}

// Start agent if run directly
if (require.main === module) {
  const agent = new DeliveryAgent();
  agent.start().catch(err => {
    console.error('[Delivery] Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { DeliveryAgent };

