# QUICK START - COPY & PASTE COMMANDS

## 1. INSTALL DEPENDENCIES (Run Once)

```bash
pip install redis asyncio numpy pandas scikit-learn
```

## 2. START REDIS

**Option A: Docker (Recommended)**
```bash
docker run -d --name pitwall-redis -p 6379:6379 redis:7
```

**Option B: Direct**
```bash
redis-server
```

## 3. RUN AGENTS (Start in Separate Terminals)

**Terminal 1: Strategy Agent**
```bash
python ai_agents.py --mode strategy --redis-url redis://127.0.0.1:6379
```

**Terminal 2: Coach Agent**
```bash
python ai_agents.py --mode coach --redis-url redis://127.0.0.1:6379
```

**Terminal 3: Anomaly Detective**
```bash
python ai_agents.py --mode anomaly --redis-url redis://127.0.0.1:6379
```

**Terminal 4: Integration Layer**
```bash
python agent_integration.py --redis-url redis://127.0.0.1:6379 --mode live
```

## 4. TEST TELEMETRY DATA (Terminal 5)

**Send Single Sample**
```bash
redis-cli XADD telemetry.stream * data '{
  "meta_time":"2025-11-20T12:00:00Z",
  "track":"cota",
  "chassis":"GR86-01",
  "lap":12,
  "lapdist_m":280.5,
  "speed_kmh":210,
  "accx_can":0.03,
  "accy_can":0.2,
  "throttle_pct":85,
  "brake_pct":0,
  "tire_temp":95,
  "tire_pressure":28.5,
  "yaw_rate":0.5,
  "rpm":6000
}'
```

**Monitor Results Stream**
```bash
redis-cli XREAD BLOCK 0 STREAMS results.stream 0
```

**Check Agent Registry**
```bash
redis-cli HGETALL agents.registry
```

**View Decision History**
```bash
redis-cli XRANGE results.stream - +
```

## 5. LOAD CSV REPLAY DATA

Create a Python script `replay_csv.py`:

```python
import asyncio
from agent_integration import AgentIntegration

async def replay():
    integration = AgentIntegration("redis://127.0.0.1:6379")
    await integration.connect()
    
    # Replay CSV file (Race 1 results CSV from Hack-the-Track)
    await integration.ingestor.ingest_csv(
        "03_Results-GR-Cup-Race-1-Official1_Anonymized.CSV",
        track="road_america"
    )

asyncio.run(replay())
```

Run it:
```bash
python replay_csv.py
```

## 6. CONNECT FRONTEND (React/TypeScript)

**Install WebSocket dependency**
```bash
npm install ws
```

**Add Hook to React App**

```typescript
// hooks/useAgentDecisions.ts
import { useEffect, useState } from 'react';

export function useAgentDecisions(track: string) {
  const [decisions, setDecisions] = useState<any[]>([]);
  
  useEffect(() => {
    const ws = new WebSocket(
      `ws://localhost:8082/ws/agents`
    );
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'agent_decision' && data.track === track) {
        setDecisions(prev => [data, ...prev].slice(0, 50));
      }
    };
    
    return () => ws.close();
  }, [track]);
  
  return decisions;
}
```

**Use in Component**

```tsx
import { useAgentDecisions } from './hooks/useAgentDecisions';

export function PitConsole() {
  const decisions = useAgentDecisions('cota');
  
  return (
    <div className="pit-console">
      {decisions
        .filter(d => d.decision_type === 'pit')
        .map(d => (
          <div key={d.decision_id} className="decision-card">
            <h4>{d.action}</h4>
            <p>Confidence: {(d.confidence * 100).toFixed(0)}%</p>
            <ul>
              {d.reasoning.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}
```

## 7. DEPLOY TO DOCKER

**Build Image**
```bash
docker build -t pitwall-agents:latest .
```

**Run Container**
```bash
docker run -e REDIS_URL=redis://host.docker.internal:6379 \
  pitwall-agents:latest \
  python agent_integration.py --mode live
```

## 8. DEPLOY TO KUBERNETES

**Create ConfigMap**
```bash
kubectl create configmap pitwall-config \
  --from-literal=redis-url=redis://redis:6379
```

**Apply Deployment**
```bash
kubectl apply -f k8s/agent-deployment.yaml
```

**Monitor**
```bash
kubectl logs -f deployment/pitwall-agents
kubectl top pods
```

## 9. MONITORING COMMANDS

**Check Agent Status**
```bash
redis-cli HGETALL agents.registry | grep -E "agent-|registered"
```

**Monitor Queue Depth**
```bash
while true; do
  echo "Queue depths:";
  redis-cli LLEN "agent:strategy-01:inbox";
  redis-cli LLEN "agent:coach-01:inbox";
  redis-cli LLEN "agent:anomaly-01:inbox";
  sleep 2;
done
```

**Watch Decision Flow**
```bash
redis-cli XREAD BLOCK 0 COUNT 1 STREAMS results.stream 0 | jq .
```

**Memory Usage**
```bash
redis-cli INFO memory
redis-cli MEMORY STATS
```

## 10. TROUBLESHOOTING COMMANDS

**No Decisions Appearing?**
```bash
# Check if telemetry is coming in
redis-cli XLEN telemetry.stream

# Check if tasks are being created
redis-cli XLEN tasks.stream

# Check if agents are registered
redis-cli HGETALL agents.registry

# Check agent inbox
redis-cli LLEN agent:strategy-01:inbox

# Check results
redis-cli XLEN results.stream
```

**High Latency?**
```bash
# Profile agent CPU
python -m cProfile -s cumtime ai_agents.py --mode strategy

# Check queue depth
redis-cli INFO stats | grep client_output_buffer

# Monitor Redis commands
redis-cli --latency
```

**Memory Issue?**
```bash
# Trim old data
redis-cli XTRIM telemetry.stream MAXLEN ~ 100000
redis-cli XTRIM results.stream MAXLEN ~ 100000
redis-cli XTRIM tasks.stream MAXLEN ~ 100000

# Check largest keys
redis-cli --bigkeys

# Clean insights
redis-cli KEYS "insight:*" | wc -l
redis-cli KEYS "insight:*" | head -100 | xargs redis-cli DEL
```

## 11. DEVELOPMENT WORKFLOW

**Format Code**
```bash
pip install black
black ai_agents.py agent_integration.py
```

**Run Tests**
```bash
pip install pytest pytest-asyncio
pytest tests/ -v
```

**Debug Specific Agent**
```bash
python -m pdb ai_agents.py --mode strategy
# (b) to set breakpoint
# (c) to continue
# (n) to step
# (l) to list
```

## 12. PERFORMANCE TUNING

**Increase Agent Throughput**
```bash
# In config, increase these:
TELEMETRY_BUFFER_SIZE=50      # Batch more samples (was 10)
DECISION_TIMEOUT_MS=300        # Allow more time (was 200)
```

**Add More Agents**
```bash
# Run multiple instances in parallel
for i in {1..5}; do
  python ai_agents.py --mode strategy &
done
```

**Scale Redis**
```bash
# Use Redis Cluster for high throughput
docker run -e cluster-enabled yes redis:7
```

## 13. SAMPLE DATA FOR TESTING

**Generate Synthetic Data**

```python
import redis
import json
from datetime import datetime

r = redis.Redis()

# Generate 100 test samples
for i in range(100):
    sample = {
        "meta_time": datetime.utcnow().isoformat(),
        "track": "cota",
        "chassis": f"GR86-{i%10:02d}",
        "lap": 1 + (i // 10),
        "lapdist_m": (i % 100) * 50,
        "speed_kmh": 180 + (i % 50),
        "accx_can": (i % 20) * 0.01,
        "accy_can": (i % 30) * 0.01,
        "throttle_pct": 50 + (i % 50),
        "brake_pct": i % 100,
        "tire_temp": 85 + (i % 20),
        "tire_pressure": 28 + (i % 2),
        "yaw_rate": (i % 20) * 0.1,
        "rpm": 5000 + (i % 2000)
    }
    r.xadd("telemetry.stream", "*", "data", json.dumps(sample))
    print(f"Added sample {i}")
```

## 14. BATCH OPERATIONS

**Process All CSV Files**
```bash
for csv in data/*.csv; do
  track=$(basename $csv .csv)
  echo "Processing $track..."
  python -c "
import asyncio
from agent_integration import AgentIntegration

async def process():
    integration = AgentIntegration('redis://127.0.0.1:6379')
    await integration.connect()
    await integration.ingestor.ingest_csv('$csv', '$track')

asyncio.run(process())
  "
done
```

**Export Results**
```bash
redis-cli XRANGE results.stream - + > results.txt
redis-cli XRANGE insights:* - + > insights.txt
```

## 15. PRODUCTION CHECKLIST

```bash
# Pre-deployment checks
[ ] Redis is running and accessible
[ ] All 4 agent types are registered: redis-cli HGETALL agents.registry
[ ] Telemetry is flowing: redis-cli XLEN telemetry.stream
[ ] Decisions are being made: redis-cli XLEN results.stream
[ ] Frontend WebSocket connects: Check browser console
[ ] Monitoring is active: Prometheus scraping /metrics

# Deploy
kubectl apply -f k8s/agent-deployment.yaml
kubectl rollout status deployment/pitwall-agents

# Verify
kubectl get pods
kubectl logs -f deployment/pitwall-agents
kubectl port-forward service/pitwall-agents 9090:9090
```

---

## WHAT TO DO NEXT

1. Copy-paste commands above to get agents running in 5 minutes
2. Watch telemetry & decisions flow through Redis
3. Connect frontend using React hook provided
4. Deploy to production using k8s manifests
5. Monitor and tune using commands in section 9-10

## NEED HELP?

- Check logs: `tail -f logs/agent-*.log` (or use k8s: `kubectl logs`)
- Monitor Redis: `redis-cli MONITOR`
- Debug agent: `python -m pdb ai_agents.py`
- Check deployment guide: `AGENTS_DEPLOYMENT_GUIDE.md`

You now have everything needed to run production-grade AI agents for PitWall A.I. 🚀

Copy commands above into your terminal and you'll have autonomous agents making pit strategy decisions in seconds!

