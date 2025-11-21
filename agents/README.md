# PitWall AI Multi-Agent System

A distributed multi-agent orchestration system for real-time race analytics, predictive modeling, and strategy optimization.

## Architecture

```
Ingesters (UDP/S3/API)
    └─> Redis Streams (Message Bus)
           ├─> Orchestrator (Router + Registry)
           ├─> Preprocessor Agent(s)
           ├─> EDA Agent(s)
           ├─> Predictor Agent(s)
           ├─> Simulator Agent(s)
           ├─> Explainer Agent(s)
           └─> Delivery Agent (WebSocket + REST)
```

## Components

### Orchestrator (`orchestrator/router.js`)
- Agent registry and health monitoring
- Task routing with priority and affinity
- Redis Streams consumer groups
- HTTP API for agent registration and task submission

### Preprocessor Agent (`preprocessor/preprocessor-agent.js`)
- Canonicalizes telemetry to standard schema
- Computes derived features (lateral_g, brake_energy, etc.)
- Sectorizes data using track_sectors.json
- Publishes aggregate windows to Redis

### Preprocessor v2 (`preprocessor/preprocessor_v2.js`) - **NEW**
- **Improved**: Redis Streams-based ingestion with schema validation (AJV)
- **Enhanced**: Strict canonicalization with type coercion
- **Better aggregation**: Per-sector aggregates with evidence samples
- **Data quality**: Metrics tracking in Redis
- **Low-latency**: Real-time derived features (lateral_g, tire_stress, brake_power, steer_rate)
- See [PREPROCESSOR_V2_INTEGRATION.md](./PREPROCESSOR_V2_INTEGRATION.md) for details

### EDA Agent (`eda/eda_cluster_agent.py`)
- Comprehensive exploratory data analysis with robust input validation
- Automated feature engineering (cyclical time features, aggregations)
- Scalable dimensionality reduction: PCA → UMAP pipeline
- Density-based clustering (HDBSCAN) with stability analysis
- Cluster profiling: per-cluster statistics, top features, representative examples
- Explainability: mean-difference feature importance per cluster
- Interactive visualizations (UMAP scatter plots)
- Persistence: saves models, embeddings, and profiles
- Seamless Redis integration with multi-agent orchestrator
- Falls back to KMeans if HDBSCAN unavailable

### EDA Agent V2 (`eda/eda_cluster_agent_v2.py`) - **NEW**
- **Enhanced**: Redis Streams consumer groups for horizontal scaling
- **Improved**: Distributed locking prevents duplicate task processing
- **NEW**: Cluster drift detection with historical centroid tracking
- **Enhanced**: Automated drift alerts trigger retrain tasks for Predictor agents
- **Improved**: Better stability scoring with hyperparameter sweep
- **Better**: Per-track artifact organization and metadata
- **Enhanced**: Orchestrator integration with automatic registration
- See [EDA README V2](./eda/README_V2.md) for detailed documentation

### Predictor Agent (`predictor/predictor_agent.py`)
- Loads per-track tire degradation models
- Predicts loss per lap and laps until threshold
- SHAP explainability for feature attribution
- Returns top contributing features
- **NEW**: Uses `fe_lib.py` for feature engineering and `predictor_wrapper.py` for integration

### Simulator Agent (`simulator/simulator_agent.py`)
- Discrete-event strategy simulation
- Compares pit_now vs pit_later scenarios
- Optimizes pit window timing
- Returns best strategy recommendation

### Explainer Agent (`explainer/explainer_agent.py`)
- Formats predictions into human-readable insights
- Generates voiceover scripts
- Attaches evidence frames
- Creates actionable recommendations

### Delivery Agent (`delivery/delivery-agent.js`)
- WebSocket server for real-time updates
- REST API for insight history
- Broadcasts insight_update, aggregate_update, eda_update
- Caches recent insights for on-demand retrieval

## Message Flow

1. **Telemetry Ingestion** → Preprocessor Agent
2. **Preprocessor** → Aggregate Window → Redis Stream
3. **Orchestrator** → Routes tasks to EDA, Predictor, Simulator
4. **EDA** → Clustering results → Explainer
5. **Predictor** → Tire predictions → Explainer
6. **Simulator** → Strategy scenarios → Explainer
7. **Explainer** → Formatted insight → Delivery Agent
8. **Delivery Agent** → WebSocket broadcast to frontend

## Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- Redis 6+
- Docker & Kubernetes (for deployment)

### Install Dependencies

**Node.js agents:**
```bash
cd agents/orchestrator
npm install ioredis express uuid

cd ../preprocessor
npm install ioredis uuid

cd ../delivery
npm install ioredis ws express
```

**Python agents:**
```bash
pip install -r requirements.txt
# Includes: redis, requests, numpy, pandas, scikit-learn
# EDA: umap-learn, hdbscan
# Predictor: lightgbm, shap, joblib
```

### Configuration

Edit `agents/config/config.json` or set environment variables:
- `REDIS_URL`: Redis connection string
- `ORCHESTRATOR_URL`: Orchestrator HTTP endpoint
- `MODEL_PATH`: Path to trained tire model (for Predictor)

### Running Locally

**1. Start Redis:**
```bash
redis-server
```

**2. Start Orchestrator:**
```bash
cd agents/orchestrator
node router.js
```

**3. Start Agents:**

```bash
# Preprocessor (v1 - original)
cd agents/preprocessor
node preprocessor-agent.js

# Preprocessor v2 (improved - recommended)
cd agents/preprocessor
node preprocessor_v2.js
# Or: npm run preprocessor:v2

# EDA Cluster Agent (V1 - original)
cd agents/eda
python eda_cluster_agent.py

# EDA Cluster Agent V2 (improved - recommended for horizontal scaling)
cd agents/eda
python eda_cluster_agent_v2.py

# Or use the simpler version
python eda_agent.py

# Predictor
cd agents/predictor
python predictor_agent.py

# Simulator
cd agents/simulator
python simulator_agent.py

# Explainer
cd agents/explainer
python explainer_agent.py

# Delivery
cd agents/delivery
node delivery-agent.js
```

### Docker Deployment

Build images:
```bash
docker build -t pitwall/orchestrator -f Dockerfile.orchestrator .
docker build -t pitwall/preprocessor-agent -f Dockerfile.preprocessor .
# ... etc
```

### Kubernetes Deployment

```bash
# Apply all manifests
kubectl apply -f k8s/agents/

# Check status
kubectl get pods -l component=agent
kubectl get svc -l app=orchestrator
```

## API Endpoints

### Orchestrator
- `POST /agents/register` - Register agent
- `POST /agents/heartbeat/:agentId` - Agent heartbeat
- `POST /tasks` - Submit task
- `GET /agent/status` - Get orchestrator status
- `GET /health` - Health check

### Delivery Agent
- `GET /insights/:id` - Get insight by ID
- `GET /insights?limit=10` - Get recent insights
- `GET /predict_tire/:track/:chassis` - Predict tire degradation
- `POST /simulate_strategy` - Simulate race strategy
- `GET /health` - Health check

## WebSocket Messages

### Client → Server
```json
// Connect to ws://localhost:8082
```

### Server → Client

**insight_update:**
```json
{
  "type": "insight_update",
  "data": {
    "id": "insight-123",
    "title": "High Tire Degradation Detected",
    "severity": "high",
    "score": 0.42,
    "explanation": "Predicted tire loss: 0.42s per lap...",
    "recommendation": {
      "one_liner": "Recommendation: Pit on lap 15",
      "bullets": ["Optimal pit window: Lap 15", ...],
      "voiceover_script": "..."
    },
    "evidence": [...]
  },
  "timestamp": "2025-01-20T..."
}
```

**aggregate_update:**
```json
{
  "type": "aggregate_update",
  "data": {
    "window_id": "...",
    "track": "cota",
    "chassis": "GR86-01",
    "sectors": {
      "S1": {"avg_speed": 180, "tire_stress": 1234, ...},
      ...
    }
  }
}
```

## Task Submission Example

```javascript
// Submit preprocessing task
const response = await fetch('http://localhost:3000/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    task_type: 'preprocessor',
    track: 'cota',
    chassis: 'GR86-01',
    priority: 'high',
    payload: {
      points: telemetryPoints,
      track: 'cota',
      chassis: 'GR86-01'
    }
  })
});
```

## Monitoring

- Prometheus metrics: `/metrics` endpoint (to be added)
- Agent health: Check orchestrator status endpoint
- Task queue length: Redis `LLEN agent:{id}:inbox`
- Stream lag: Redis `XINFO GROUPS tasks.stream`

## Development

### Adding a New Agent

1. Create agent file in `agents/{agent-name}/`
2. Implement registration, heartbeat, and processing loop
3. Add deployment manifest in `k8s/agents/`
4. Update orchestrator routing rules if needed

### Testing

```bash
# Test orchestrator
curl http://localhost:3000/health

# Test agent registration
curl -X POST http://localhost:3000/agents/register \
  -H "Content-Type: application/json" \
  -d '{"agent_id":"test-1","types":["test"],"tracks":["*"],"capacity":1}'

# Submit test task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d @test-task.json
```

## Troubleshooting

**Agent not receiving tasks:**
- Check agent registration: `GET /agent/status`
- Verify Redis connection
- Check agent inbox: `LLEN agent:{id}:inbox`

**Tasks failing:**
- Check `tasks.failed` stream in Redis
- Review agent logs
- Verify task payload format

**WebSocket not connecting:**
- Check delivery agent health: `GET http://localhost:3001/health`
- Verify WebSocket port (8082)
- Check firewall rules

## License

MIT

