# Redis Streams Multi-Agent Stack - Quick Start

This document describes the simpler Redis Streams-based multi-agent system.

## Architecture Overview

```
Telemetry Source → telemetry.stream → Preprocessor → tasks.stream → Orchestrator → agent:{id}:inbox → Agents → results.stream → Delivery → WebSocket → Frontend
```

## Components

1. **Orchestrator** (`orchestrator/index.js`) - Agent registry + task router
2. **Preprocessor** (`preprocessor/index.js`) - Consumes telemetry, sectorizes, creates tasks
3. **Predictor** (`predictor/predictor_agent.py`) - ML predictions
4. **EDA** (`eda/eda_agent.py`) - Exploratory data analysis
5. **Delivery** (`delivery/index.js`) - WebSocket delivery to frontend

## Quick Start

### 1. Start Redis

```bash
docker run -p 6379:6379 -d redis:7
```

### 2. Start Orchestrator

```bash
cd agents
npm install
REDIS_URL=redis://127.0.0.1:6379 ORCH_PORT=9090 node orchestrator/index.js
```

### 3. Start Delivery Agent

```bash
REDIS_URL=redis://127.0.0.1:6379 DELIVER_PORT=8082 node delivery/index.js
```

### 4. Start Preprocessor

```bash
REDIS_URL=redis://127.0.0.1:6379 node preprocessor/index.js
```

### 5. Start Predictor Agent

```bash
cd agents/predictor
pip install redis joblib scikit-learn numpy
REDIS_URL=redis://127.0.0.1:6379 AGENT_ID=predictor-01 MODEL_PATH=/models/demo_tire_model.pkl python predictor_agent.py
```

### 6. Start EDA Agent

```bash
cd agents/eda
pip install redis numpy scikit-learn umap-learn hdbscan
REDIS_URL=redis://127.0.0.1:6379 EDA_AGENT_ID=eda-01 python eda_agent.py
```

### 7. Register Agents (Optional)

Agents can auto-register, or you can manually register:

```bash
curl -X POST http://localhost:9090/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"types":["predictor"],"tracks":["cota"],"capacity":2}'
```

### 8. Send Test Telemetry

```bash
redis-cli XADD telemetry.stream * data '{"meta_time":"2025-11-20T00:00:00Z","track":"cota","chassis":"GR86-002","lap":12,"lapdist_m":280.5,"speed_kmh":210,"accx_can":0.03,"accy_can":0.2,"Steering_Angle":2}'
```

### 9. Connect Debug UI

The debug UI component is available at `src/components/AgentDebugUI.tsx`. You can add it to a route or use it standalone.

## API Endpoints

### Orchestrator (port 9090)
- `GET /api/health` - Health check
- `GET /api/agents` - List registered agents
- `GET /api/queues` - Queue lengths and status
- `POST /api/agents/register` - Register an agent

### Delivery Agent (port 8082)
- `GET /api/health` - Health check
- `GET /api/insights/:id` - Fetch full insight by ID
- `WS /ws/agents` - WebSocket endpoint for real-time updates

## Redis Streams

- `telemetry.stream` - Input telemetry data
- `tasks.stream` - Tasks for agents
- `results.stream` - Agent results
- `agent:{id}:inbox` - Per-agent task queues (Redis lists)
- `agents.registry` - Agent registry (Redis hash)
- `insight:{id}` - Stored insights (Redis hash)

## Configuration

Set environment variables:
- `REDIS_URL` - Redis connection string (default: `redis://127.0.0.1:6379`)
- `ORCH_PORT` - Orchestrator port (default: `9090`)
- `DELIVER_PORT` - Delivery agent port (default: `8082`)
- `AGENT_ID` - Agent identifier
- `MODEL_PATH` - Path to pickled ML model
- `TRACK_SECTORS_PATH` - Path to track_sectors.json

## Seed Document

The orchestrator references a seed document at:
`/mnt/data/2 Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .md`

This path is included in configs so agents can read demo notes.

## Example Insight Update

See `agents/example-insight-update.json` for the expected JSON structure.

## Kubernetes Deployment

See `k8s/orchestrator-deploy.yaml` and `k8s/predictor-deploy.yaml` for example Kubernetes manifests.

## Notes

- The preprocessor creates one task per sample for immediate prediction (good for demo)
- For production, preprocessor should buffer N samples per lap per chassis and emit aggregated tasks
- Model compatibility: ensure your training pipeline produces a pickled model with the same feature order the Predictor expects
- Replace `predict_feature_vector` in predictor with your real feature mapping

