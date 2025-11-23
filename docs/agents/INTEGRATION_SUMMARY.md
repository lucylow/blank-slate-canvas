# Redis Streams Multi-Agent Stack - Integration Summary

All components have been successfully integrated into your repository. Below is what was created and how to use it.

## Files Created

### Node.js Agents

1. **`agents/orchestrator/index.js`** - Simple orchestrator with HTTP API
   - Agent registry endpoint: `POST /api/agents/register`
   - Agent list: `GET /api/agents`
   - Queue status: `GET /api/queues`
   - Routes tasks from `tasks.stream` to agent inboxes

2. **`agents/preprocessor/index.js`** - Telemetry preprocessor
   - Consumes `telemetry.stream`
   - Sectorizes data using `track_sectors.json`
   - Publishes tasks to `tasks.stream`

3. **`agents/delivery/index.js`** - WebSocket delivery agent
   - WebSocket endpoint: `/ws/agents` (port 8082)
   - REST API: `GET /api/insights/:id`
   - Consumes `results.stream` and broadcasts to clients

### Python Agents

4. **`agents/predictor/predictor_agent.py`** - ML prediction agent
   - Loads pickled models via joblib
   - Processes tasks from inbox
   - Publishes insights to `results.stream`

5. **`agents/eda/eda_cluster_agent.py`** - Comprehensive EDA and clustering agent
   - Robust input validation and schema inference
   - Automated feature engineering (cyclical time features)
   - PCA → UMAP dimensionality reduction
   - HDBSCAN clustering with stability analysis
   - Cluster profiling and explainability
   - Interactive visualizations
   - Persistence of models and artifacts
   - Falls back to KMeans if HDBSCAN unavailable
   
   **`agents/eda/eda_agent.py`** - Simple EDA agent (legacy)
   - Basic UMAP + HDBSCAN clustering
   - Fallback to KMeans if UMAP/HDBSCAN not available

### Kubernetes Manifests

6. **`k8s/orchestrator-deploy.yaml`** - Orchestrator deployment
7. **`k8s/predictor-deploy.yaml`** - Predictor deployment

### Frontend

8. **`src/components/AgentDebugUI.tsx`** - React debug UI component
   - Displays registered agents
   - Shows queue lengths
   - Real-time WebSocket message viewer

### Documentation & Examples

9. **`agents/example-insight-update.json`** - Example insight JSON structure
10. **`agents/REDIS_STREAMS_QUICKSTART.md`** - Quick start guide

## Updated Files

- **`agents/package.json`** - Added scripts for simple agents:
  - `npm run orchestrator:simple`
  - `npm run preprocessor:simple`
  - `npm run delivery:simple`
  - `npm run start:simple` (runs all three)

- **`agents/requirements.txt`** - Already includes all needed dependencies

## Data Flow

```
Telemetry Source
    ↓
telemetry.stream (Redis Stream)
    ↓
Preprocessor Agent
    ↓
tasks.stream (Redis Stream)
    ↓
Orchestrator (routes to agent inboxes)
    ↓
agent:{id}:inbox (Redis List)
    ↓
Predictor/EDA Agents
    ↓
results.stream (Redis Stream)
    ↓
Delivery Agent
    ↓
WebSocket → Frontend
```

## Quick Start

1. **Start Redis:**
   ```bash
   docker run -p 6379:6379 -d redis:7
   ```

2. **Start Orchestrator:**
   ```bash
   cd agents
   npm install
   node orchestrator/index.js
   ```

3. **Start Delivery:**
   ```bash
   node delivery/index.js
   ```

4. **Start Preprocessor:**
   ```bash
   node preprocessor/index.js
   ```

5. **Start Predictor:**
   ```bash
   cd predictor
   pip install redis joblib scikit-learn numpy
   python predictor_agent.py
   ```

6. **Start EDA Cluster Agent (comprehensive):**
   ```bash
   cd eda
   pip install redis numpy pandas scikit-learn umap-learn hdbscan plotly joblib
   python eda_cluster_agent.py
   ```
   
   Or use the simpler version:
   ```bash
   python eda_agent.py
   ```

7. **Send test telemetry:**
   ```bash
   redis-cli XADD telemetry.stream * data '{"meta_time":"2025-11-20T00:00:00Z","track":"cota","chassis":"GR86-002","lap":12,"lapdist_m":280.5,"speed_kmh":210,"accx_can":0.03,"accy_can":0.2,"Steering_Angle":2}'
   ```

## Configuration

All agents use environment variables:
- `REDIS_URL` - Redis connection (default: `redis://127.0.0.1:6379`)
- `ORCH_PORT` - Orchestrator port (default: `9090`)
- `DELIVER_PORT` - Delivery agent port (default: `8082`)
- `AGENT_ID` - Agent identifier
- `MODEL_PATH` - Path to pickled ML model
- `TRACK_SECTORS_PATH` - Path to track_sectors.json

## Seed Document Reference

The orchestrator references the seed document at:
`/mnt/data/2 Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .md`

This path is included in configs so agents can read demo notes.

## Next Steps

1. **Model Integration:** Replace `predict_feature_vector` in `predictor_agent.py` with your actual feature extraction logic
2. **Batching:** Update preprocessor to buffer samples and create aggregated tasks per lap
3. **Production:** Add authentication, monitoring, and error handling
4. **Frontend Integration:** Add the `AgentDebugUI` component to a route in your React app

## Notes

- The existing agent implementations (`router.js`, `preprocessor-agent.js`, etc.) are preserved
- The new simpler versions are in `index.js` files alongside the existing ones
- You can use either the complex or simple versions depending on your needs
- All agents auto-register with the orchestrator on startup

