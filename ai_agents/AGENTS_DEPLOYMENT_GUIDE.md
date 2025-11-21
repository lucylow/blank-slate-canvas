# PitWall A.I. - AI Agents Deployment & Integration Guide

## Quick Start (5 minutes)

### Prerequisites

```bash
pip install redis asyncio numpy

# Ensure Redis is running: redis-server (or docker run -p 6379:6379 redis:7)
```

### Run Agents Locally

**Terminal 1 - Strategy Agent:**
```bash
python ai_agents.py --mode strategy --redis-url redis://127.0.0.1:6379
```

**Terminal 2 - Coach Agent:**
```bash
python ai_agents.py --mode coach --redis-url redis://127.0.0.1:6379
```

**Terminal 3 - Anomaly Detective:**
```bash
python ai_agents.py --mode anomaly --redis-url redis://127.0.0.1:6379
```

**Terminal 4 - Integration & Ingestion:**
```bash
python agent_integration.py --redis-url redis://127.0.0.1:6379 --mode live
```

### Test with Sample Data

Push test telemetry to Redis:
```bash
redis-cli XADD telemetry.stream * data '{"meta_time":"2025-11-20T12:00:00Z","track":"cota","chassis":"GR86-01","lap":5,"lapdist_m":280.5,"speed_kmh":210,"accx_can":0.03,"accy_can":0.2,"throttle_pct":85,"brake_pct":0,"tire_temp":95,"tire_pressure":28.5,"yaw_rate":0.5,"rpm":6000}'
```

Watch results stream:
```bash
redis-cli XREAD BLOCK 0 STREAMS results.stream 0
```

## Architecture Overview

### Agent Types

#### 1. Strategy Agent
- **Decides:** When to pit, pit window timing, strategy type
- **Observes:** Tire wear, gap to leader, fuel, remaining laps
- **Confidence:** Computes based on data reliability
- **Output:** Pit recommendation with alternatives and risk assessment

**Decision Example:**
```json
{
  "decision_type": "pit",
  "action": "Recommend pit lap 14",
  "confidence": 0.87,
  "risk_level": "moderate",
  "reasoning": [
    "Tire wear trending at 38%",
    "Remaining laps: 7 (sufficient)",
    "Gap to leader suggests undercut opportunity"
  ]
}
```

#### 2. Coach Agent
- **Decides:** Driver technique improvements, sector feedback
- **Observes:** Braking patterns, throttle modulation, lateral load, consistency
- **Confidence:** High (always broadcasts suggestions)
- **Output:** Actionable coaching cards per sector

#### 3. Anomaly Detective Agent
- **Decides:** Safety alerts, sensor issues, unusual behavior
- **Observes:** Sensor glitches, speed drops, thermal anomalies, off-track events
- **Confidence:** Critical (immediate escalation)
- **Output:** Safety alerts with incident logging

#### 4. Orchestrator Agent
- **Decides:** Task routing, agent health, priority coordination
- **Routes:** Tasks to appropriate specialized agents
- **Coordinates:** Multi-agent workflows

## Component Details

### TelemetryIngestor

```python
ingestor = TelemetryIngestor(redis_url="redis://...")
await ingestor.connect()

# Live stream ingestion
await ingestor.ingest_from_stream("telemetry.stream")

# Or CSV batch replay
await ingestor.ingest_csv("data/race_data.csv", track="cota")
```

**Features:**
- Batches telemetry before dispatching (reduces overhead)
- Normalizes field names from different sources
- Validates data ranges
- Throttles ingestion to real-time speed

### DecisionAggregator

```python
aggregator = DecisionAggregator(redis_url="redis://...")
await aggregator.connect()

decisions = [pit_decision, coaching_decision, anomaly_alert]
aggregated = await aggregator.aggregate(decisions)
```

**Aggregation Rules:**
- Safety alerts (anomalies) → Immediate broadcast, no threshold
- Pit decisions → Require >85% confidence, conflict resolution via weighted voting
- Coaching → Always broadcast (informational)

### AgentWorkerPool

```python
pool = AgentWorkerPool(redis_url="redis://...")
await pool.connect()

# Spawn individual agents
await pool.spawn_worker("strategy", "strategy-01", config={
    "tracks": ["cota", "road_america", "sonoma"]
})

# Or spawn default fleet
await pool.spawn_default_fleet(redis_url)
```

## Integration with Node.js Frontend

### Express.js Backend Integration

```javascript
// backend/routes/agents.js
const express = require('express');
const Redis = require('ioredis');
const router = express.Router();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Fetch agent status
router.get('/api/agents/status', async (req, res) => {
  const agents = await redis.hgetall('agents.registry');
  const status = Object.keys(agents).map(id => JSON.parse(agents[id]));
  res.json(status);
});

// Fetch recent decisions
router.get('/api/decisions/:track', async (req, res) => {
  const track = req.params.track;
  const results = await redis.xrevrange('results.stream', '+', '-', 'COUNT', 20);
  
  const decisions = results.map(([id, fields]) => {
    try {
      return JSON.parse(fields);
    } catch {
      return null;
    }
  }).filter(d => d && d.track === track);
  
  res.json(decisions);
});

// Fetch full decision evidence
router.get('/api/insights/:id', async (req, res) => {
  const id = req.params.id;
  const payload = await redis.hget(`insight:${id}`, 'payload');
  
  if (!payload) return res.status(404).json({ error: 'not found' });
  res.json(JSON.parse(payload));
});

module.exports = router;
```

### React Frontend Hooks

```typescript
// frontend/hooks/useAgentDecisions.ts
import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';

export function useAgentDecisions(track: string) {
  const [decisions, setDecisions] = useState<any[]>([]);
  const ws = useWebSocket('ws://localhost:8082/ws/agents');
  
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'agent_decision' && data.track === track) {
        setDecisions(prev => [data, ...prev].slice(0, 50));
      }
    };
    
    ws?.addEventListener('message', handleMessage);
    return () => ws?.removeEventListener('message', handleMessage);
  }, [ws, track]);
  
  return decisions;
}

// Usage in component
export function RaceStrategyConsole() {
  const decisions = useAgentDecisions('cota');
  
  return (
    <div className="strategy-console">
      <div className="pit-alert">
        {decisions
          .filter(d => d.decision_type === 'pit')
          .map(d => (
            <Alert key={d.decision_id} severity={d.risk_level}>
              <h4>{d.action}</h4>
              <p>Confidence: {(d.confidence * 100).toFixed(0)}%</p>
              <ul>
                {d.reasoning.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
              <button onClick={() => fetchEvidence(d.decision_id)}>
                View Evidence
              </button>
            </Alert>
          ))}
      </div>
    </div>
  );
}
```

## Performance & Scaling

### Latency Targets
- Telemetry → Decision: <200ms (real-time pit decisions)
- Decision → WebSocket: <50ms
- Agent response time: <100ms (strategy), <50ms (coach), <200ms (anomaly)

### Monitoring

```python
# Track agent performance
async def monitor_agents(redis_url):
    redis = await redis.from_url(redis_url)
    
    while True:
        # Check queue depths
        agents = await redis.hkeys("agents.registry")
        
        for agent_id in agents:
            inbox_len = await redis.llen(f"agent:{agent_id}:inbox")
            
            # Alert if backlog growing
            if inbox_len > 100:
                logger.warning(f"{agent_id} inbox backlog: {inbox_len}")
        
        # Check stream lag
        info = await redis.xinfo_stream("telemetry.stream")
        logger.info(f"Telemetry stream length: {info['length']}")
        
        await asyncio.sleep(10)
```

### Scaling Agents

**Horizontal Scaling:**
```bash
# Run multiple instances of same agent type
for i in {1..5}; do
  python ai_agents.py --mode strategy &
done
```

## Testing & Validation

### Unit Tests

```python
# tests/test_agents.py
import pytest
import asyncio
from ai_agents import StrategyAgent, TelemetryFrame

@pytest.mark.asyncio
async def test_pit_decision():
    agent = StrategyAgent("test-strategy", "redis://localhost:6379")
    await agent.connect()
    
    telemetry = TelemetryFrame(
        timestamp="2025-11-20T12:00:00Z",
        meta_time="2025-11-20T12:00:00Z",
        track="cota",
        chassis="GR86-01",
        lap=12,
        lapdist_m=280.5,
        speed_kmh=210,
        accx_can=0.03,
        accy_can=0.2,
        throttle_pct=85,
        brake_pct=0,
        tire_temp=95,
        tire_pressure=28.5,
        yaw_rate=0.5,
        rpm=6000
    )
    
    decision = await agent.decide(telemetry)
    
    if decision:
        assert decision.decision_type == "pit"
        assert 0 <= decision.confidence <= 1
        assert len(decision.reasoning) > 0
    
    await agent.disconnect()
```

## Configuration

### Environment Variables

```bash
# Redis connection
REDIS_URL=redis://127.0.0.1:6379

# Agent settings
AGENT_ID=strategy-01
AGENT_TYPE=strategist
AGENT_TRACKS=cota,road_america,sonoma

# Performance tuning
TELEMETRY_BUFFER_SIZE=10  # Batch size before dispatching
DECISION_TIMEOUT_MS=200
MAX_QUEUE_LENGTH=1000

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json  # or text
```

## Production Deployment

### Kubernetes

```yaml
# k8s/agent-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pitwall-agents
spec:
  replicas: 1
  selector:
    matchLabels:
      app: pitwall-agents
  template:
    metadata:
      labels:
        app: pitwall-agents
    spec:
      containers:
      - name: strategy-agent
        image: pitwall:latest
        command: ["python", "ai_agents.py", "--mode", "strategy"]
        env:
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: pitwall-config
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## Troubleshooting

### Agents Not Processing Tasks

```bash
# 1. Check agent is registered
redis-cli HGETALL agents.registry

# 2. Check inbox queue
redis-cli LLEN agent:strategy-01:inbox

# 3. Check for errors in logs
tail -f agent-logs/strategy-01.log

# 4. Monitor Redis memory
redis-cli INFO memory
```

### High Latency

```bash
# 1. Check stream lag
redis-cli XINFO STREAM telemetry.stream

# 2. Check agent queue depth
redis-cli LLEN agent:strategy-01:inbox

# 3. Profile agent execution
python -m cProfile ai_agents.py --mode strategy

# 4. Increase buffer sizes (if too many small dispatches)
```

### Memory Issues

```bash
# 1. Trim streams
redis-cli XTRIM telemetry.stream MAXLEN ~ 100000
redis-cli XTRIM results.stream MAXLEN ~ 100000

# 2. Clean old insights
redis-cli KEYS insight:* | xargs redis-cli DEL

# 3. Monitor memory usage
redis-cli INFO memory
```

## Next Steps

1. **Production Deployment:** Use provided k8s manifests + Redis Sentinel for HA
2. **Advanced Agents:** Implement Simulator + Explainer agents with SHAP integration
3. **Learning:** Add online learning to agents for drift adaptation
4. **Monitoring:** Deploy Prometheus + Grafana for metrics
5. **Incident Response:** Build incident automation (auto-pit, driver notifications)

**Status:** ✅ Production Ready

**Last Updated:** November 21, 2025

**Maintainer:** PitWall A.I. Team

