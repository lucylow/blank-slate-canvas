const Redis = require('ioredis');

class RedisClient {
  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    });

    this.streams = {
      TELEMETRY: 'telemetry.stream',
      TASKS: 'tasks.stream',
      RESULTS: 'results.stream',
      AGENT_REGISTRY: 'agents.registry'
    };

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('🟢 Redis connected');
    });

    this.client.on('error', (err) => {
      console.error('🔴 Redis error:', err);
    });

    this.client.on('ready', () => {
      console.log('✅ Redis ready');
    });
  }

  async addTelemetry(data) {
    return await this.client.xadd(
      this.streams.TELEMETRY,
      '*',
      'data',
      JSON.stringify({
        ...data,
        ingested_at: new Date().toISOString(),
        source: 'pitwall-frontend'
      })
    );
  }

  async getInsight(insightId) {
    const result = await this.client.hgetall(`insight:${insightId}`);
    return result?.payload ? JSON.parse(result.payload) : null;
  }

  async getAgentStatus() {
    const agents = await this.client.hgetall(this.streams.AGENT_REGISTRY);
    return Object.entries(agents).map(([id, data]) => ({
      id,
      ...JSON.parse(data)
    }));
  }

  async getQueueLengths() {
    const tasksLength = await this.client.xlen(this.streams.TASKS);
    const resultsLength = await this.client.xlen(this.streams.RESULTS);
    
    const agents = await this.getAgentStatus();
    const inboxLengths = await Promise.all(
      agents.map(async (agent) => ({
        agentId: agent.id,
        length: await this.client.llen(`agent:${agent.id}:inbox`)
      }))
    );

    return { tasksLength, resultsLength, inboxLengths };
  }

  async disconnect() {
    await this.client.quit();
  }
}

module.exports = new RedisClient();


