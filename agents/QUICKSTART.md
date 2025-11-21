# Quick Start Guide - Multi-Agent System

## Prerequisites

1. **Redis** - Install and start Redis:
```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

2. **Node.js 18+** and **Python 3.9+**

3. **Dependencies**:
```bash
# Node.js agents
cd agents
npm install

# Python agents
pip install -r requirements.txt
```

## Start the System

### 1. Start Orchestrator

```bash
cd agents/orchestrator
node router.js
```

You should see:
```
[Orchestrator] HTTP server listening on port 3000
[Orchestrator] Starting orchestrator...
```

### 2. Start Agents (in separate terminals)

**Preprocessor:**
```bash
cd agents/preprocessor
node preprocessor-agent.js
```

**EDA Agent:**
```bash
cd agents/eda
python eda_agent.py
```

**Predictor Agent:**
```bash
cd agents/predictor
python predictor_agent.py
```

**Simulator Agent:**
```bash
cd agents/simulator
python simulator_agent.py
```

**Explainer Agent:**
```bash
cd agents/explainer
python explainer_agent.py
```

**Delivery Agent:**
```bash
cd agents/delivery
node delivery-agent.js
```

### 3. Verify System Health

```bash
# Check orchestrator
curl http://localhost:3000/health

# Check orchestrator status (should show registered agents)
curl http://localhost:3000/agent/status | jq

# Check delivery agent
curl http://localhost:3001/health
```

## Submit a Test Task

```bash
# Submit preprocessing task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "task_type": "preprocessor",
    "track": "cota",
    "chassis": "GR86-01",
    "priority": "high",
    "payload": {
      "points": [
        {
          "meta_time": "2025-01-20T15:30:00Z",
          "track": "cota",
          "chassis": "GR86-01",
          "lap": 12,
          "lapdist_m": 1000,
          "speed_kmh": 180,
          "accx_can": 0.1,
          "accy_can": 0.8,
          "rpm": 6000,
          "throttle_pct": 85,
          "brake_pct": 0
        }
      ],
      "track": "cota",
      "chassis": "GR86-01"
    }
  }'
```

## Connect to WebSocket

```javascript
// In browser console or Node.js script
const ws = new WebSocket('ws://localhost:8082');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log('Received:', msg.type, msg.data);
};

ws.onopen = () => {
  console.log('Connected to delivery agent');
};
```

## Monitor Tasks

```bash
# Check Redis streams
redis-cli XINFO STREAM tasks.stream
redis-cli XINFO STREAM agent_results.stream

# Check agent inbox length
redis-cli LLEN agent:preprocessor-1:inbox
```

## Troubleshooting

**Agent not registering:**
- Check Redis is running: `redis-cli ping`
- Check orchestrator is running: `curl http://localhost:3000/health`
- Check agent logs for connection errors

**Tasks not processing:**
- Check agent is registered: `curl http://localhost:3000/agent/status`
- Check agent inbox: `redis-cli LLEN agent:{agent-id}:inbox`
- Check agent logs for errors

**WebSocket not connecting:**
- Check delivery agent is running: `curl http://localhost:3001/health`
- Check port 8082 is not blocked
- Check delivery agent logs

## Next Steps

1. Integrate with your telemetry ingestion pipeline
2. Train and deploy tire degradation models
3. Connect frontend to delivery agent WebSocket
4. Set up Kubernetes deployment (see `k8s/agents/`)
5. Add monitoring and alerting

## Production Deployment

See `k8s/agents/` for Kubernetes manifests. Deploy with:

```bash
kubectl apply -f k8s/agents/
```

Make sure to:
- Create Redis secret: `kubectl create secret generic redis-secret --from-literal=url=redis://redis:6379`
- Create ConfigMaps for track sectors
- Set up PersistentVolumeClaims for models
- Configure resource limits and autoscaling

