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

  // Register with orchestrator with retry logic
  async register() {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const http = require('http');
        const url = require('url');
        const parsedUrl = url.parse(this.orchestratorUrl);
        
        return new Promise((resolve, reject) => {
          const postData = JSON.stringify({
            agent_id: this.agentId,
            types: ['delivery'],
            tracks: ['*'],
            capacity: 20
          });
          
          const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 3000,
            path: '/agents/register',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData)
            },
            timeout: 5000
          };
          
          const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              try {
                if (res.statusCode !== 200) {
                  console.error(`[Delivery] Registration failed with status ${res.statusCode}`);
                  resolve(false);
                  return;
                }
                const result = JSON.parse(data);
                const success = result.ok || result.success || false;
                console.log(`[Delivery] Registered: ${success ? 'OK' : 'FAILED'}`);
                resolve(success);
              } catch (e) {
                console.error(`[Delivery] Failed to parse registration response: ${e.message}`);
                resolve(false);
              }
            });
          });
          
          req.on('error', (err) => {
            console.error(`[Delivery] Registration request error (attempt ${attempt}/${maxRetries}):`, err.message);
            if (attempt === maxRetries) {
              resolve(false);
            } else {
              reject(err);
            }
          });
          
          req.on('timeout', () => {
            req.destroy();
            console.error(`[Delivery] Registration timeout (attempt ${attempt}/${maxRetries})`);
            if (attempt === maxRetries) {
              resolve(false);
            } else {
              reject(new Error('Request timeout'));
            }
          });
          
          req.write(postData);
          req.end();
        });
      } catch (err) {
        console.error(`[Delivery] Registration attempt ${attempt}/${maxRetries} failed:`, err.message);
        if (attempt === maxRetries) {
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
    return false;
  }

  // Send heartbeat
  async heartbeat() {
    try {
      const http = require('http');
      const url = require('url');
      const parsedUrl = url.parse(this.orchestratorUrl);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 3000,
        path: `/agents/heartbeat/${this.agentId}`,
        method: 'POST'
      };
      
      const req = http.request(options);
      req.on('error', () => {});
      req.end();
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

  // Process results from stream with comprehensive error handling
  async processResults() {
    const consumerGroup = 'delivery';
    const consumerName = `delivery-${process.pid}`;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 10;

    try {
      await this.redis.xgroup('CREATE', 'agent_results.stream', consumerGroup, '0', 'MKSTREAM').catch(() => {});
    } catch (err) {
      console.warn('[Delivery] Consumer group creation warning:', err.message);
    }

    while (true) {
      try {
        // Test connection periodically
        if (consecutiveErrors > 0 && consecutiveErrors % 5 === 0) {
          try {
            await this.redis.ping();
            consecutiveErrors = 0;
          } catch (pingErr) {
            console.error('[Delivery] Redis connection lost, attempting reconnect:', pingErr.message);
            try {
              await this.redis.connect();
              console.log('[Delivery] Redis reconnected');
            } catch (reconnectErr) {
              console.error('[Delivery] Reconnection failed:', reconnectErr.message);
              consecutiveErrors++;
              if (consecutiveErrors >= maxConsecutiveErrors) {
                throw new Error('Too many consecutive connection errors');
              }
              await new Promise(resolve => setTimeout(resolve, 5000 * consecutiveErrors));
              continue;
            }
          }
        }

        const res = await this.redis.xreadgroup(
          'GROUP', consumerGroup, consumerName,
          'COUNT', 10,
          'BLOCK', 2000,
          'STREAMS', 'agent_results.stream', '>'
        );

        consecutiveErrors = 0; // Reset on success

        if (!res || res.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        const [stream, entries] = res[0];
        const idsToAck = [];
        const idsFailed = [];

        for (const [id, fields] of entries) {
          try {
            const resultJson = fields.find(f => f[0] === 'result')?.[1];
            if (!resultJson) {
              idsToAck.push(id); // Ack messages without result field
              continue;
            }

            let result;
            try {
              result = JSON.parse(resultJson);
            } catch (parseErr) {
              console.error(`[Delivery] Failed to parse result JSON for message ${id}:`, parseErr.message);
              idsFailed.push(id);
              continue;
            }
            
            // Route based on task type
            try {
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
              idsToAck.push(id);
            } catch (processErr) {
              console.error(`[Delivery] Error processing result ${id}:`, processErr.message);
              idsFailed.push(id);
            }
          } catch (err) {
            console.error(`[Delivery] Error processing message ${id}:`, err.message);
            idsFailed.push(id);
          }
        }

        // Ack successful messages
        if (idsToAck.length > 0) {
          try {
            await this.redis.xack('agent_results.stream', consumerGroup, ...idsToAck);
          } catch (ackErr) {
            console.error('[Delivery] Failed to ack messages:', ackErr.message);
            consecutiveErrors++;
            if (consecutiveErrors >= maxConsecutiveErrors) {
              throw ackErr;
            }
          }
        }

        // Log failed messages for monitoring
        if (idsFailed.length > 0) {
          console.warn(`[Delivery] Failed to process ${idsFailed.length} messages, will be retried`);
        }

      } catch (err) {
        consecutiveErrors++;
        console.error(`[Delivery] Result processing error (${consecutiveErrors}/${maxConsecutiveErrors}):`, err.message);
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error('[Delivery] Too many consecutive errors, shutting down');
          throw err;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * consecutiveErrors));
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

