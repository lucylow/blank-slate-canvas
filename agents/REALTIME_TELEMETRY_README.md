# Real-Time Telemetry Analysis System

This directory contains an improved multi-agent system designed for real-time telemetry data analysis with low latency ingestion, safe parallel agent execution, streaming ML updates, model serving, and observability.

## Architecture Overview

The system consists of four main components:

1. **Telemetry Ingestor** (`telemetry_ingestor_async.py`) - Async Redis Streams ingestion with sectorization and aggregation
2. **Agent Orchestrator** (`agent_orchestrator_async.py`) - Routes windows to agents via asyncio queues with distributed locks
3. **Predictor Agent** (`predictor_agent_async.py`) - ONNX inference + River online updates with bulk acknowledgment
4. **Metrics & Utils** (`metrics_and_utils.py`) - Prometheus metrics and helper utilities

## Key Features

- **Low-latency ingestion**: Uses `redis.asyncio` XADD/XREADGROUP for consumer groups and bulk XACKs with XTRIM housekeeping
- **Windowing & sectorization**: Buffers by (track, chassis, lap, sector) and emits compact aggregate windows
- **Backpressure & fairness**: Orchestrator uses asyncio.Queue with maxsize; applies priority policy when queues are full
- **Concurrent agent processing**: Agents run in separate asyncio tasks; heavy inference uses ThreadPoolExecutor or GPU
- **Online model updates**: Predictor supports River streaming updates (`learn_one`) with periodic checkpointing
- **Observability**: Prometheus metrics for ingestion rate, queue lengths, agent latencies, XREADGROUP lag
- **Safety & ops**: Distributed task locks (Redis SETNX + TTL) to avoid duplicate processing across replicas

## Prerequisites

Install dependencies:

```bash
pip install redis asyncio uvicorn onnxruntime prometheus_client river joblib numpy pandas
```

Or install from requirements.txt:

```bash
pip install -r agents/requirements.txt
```

## Setup

### 1. Start Redis

```bash
docker run -d --name pitwall-redis -p 6379:6379 redis:7
```

### 2. Environment Variables

Set these environment variables (or use defaults):

```bash
export REDIS_URL=redis://127.0.0.1:6379
export TELEMETRY_STREAM=telemetry.stream
export AGG_STREAM=aggregates.stream
export INGEST_GROUP=ingestors
export INGEST_NAME=ingestor-$(date +%s)
export INGEST_BATCH=200
export INGEST_BLOCK_MS=1000
export STREAM_MAXLEN=200000
```

### 3. Start Services

Run each service in a separate terminal or via a process manager:

**Terminal 1 - Telemetry Ingestor:**
```bash
python agents/telemetry_ingestor_async.py
```

**Terminal 2 - Agent Orchestrator:**
```bash
python agents/agent_orchestrator_async.py
```

**Terminal 3 - Predictor Agent:**
```bash
python agents/predictor_agent_async.py
```

**Terminal 4 - Metrics Server:**
```bash
python -c "from agents.metrics_and_utils import start_metrics_server; start_metrics_server(9000); import asyncio; asyncio.get_event_loop().run_forever()"
```

## Usage

### Injecting Telemetry Data

Example telemetry injection (adapted from Toyota GR research doc):

```bash
redis-cli XADD telemetry.stream * data '{"meta_time":"2025-11-20T12:00:00Z","track":"cota","chassis":"GR86-01","lap":5,"lapdist_m":280.5,"speed_kmh":210,"accx_can":0.03,"accy_can":0.2,"throttle_pct":85,"brake_pct":0,"tire_temp":95,"tire_pressure":28.5,"yaw_rate":0.5,"rpm":6000,"sector":1}'
```

### Data Flow

1. Raw telemetry → `telemetry.stream`
2. Ingestor aggregates and sectorizes → `aggregates.stream`
3. Orchestrator routes to agents → agent queues
4. Agents process and publish results → `predict_results.stream` / `results.stream`

### Viewing Metrics

Access Prometheus metrics at:

```
http://localhost:9000/metrics
```

Key metrics:
- `telemetry_ingested_total` - Total telemetry points ingested
- `agg_windows_emitted_total` - Aggregate windows emitted
- `agent_queue_length` - Agent queue length per agent

## Configuration & Tuning

### Latency vs Throughput Trade-offs

- **BATCH_COUNT**: Increase (50-200) for throughput, decrease for lower latency
- **BLOCK_MS**: Smaller values (100-500ms) for lower latency; larger for better batching

### Windowing Policy

Current implementation uses per-(track,chassis,lap,sector) buckets with a flush threshold of 5. For extreme throughput:
- Use fixed-time tumbling windows (e.g., 250ms windows)
- Consider RedisTimeSeries for time-series aggregation

### Exactly-Once Semantics

Redis Streams provides at-least-once delivery. For stronger guarantees:
- Use idempotent handlers (include `input_digest` in task)
- Keep locks until agent acknowledges completion

### Model Warmup

Keep per-track predictor pods warmed (load model into memory). Use affinity routing in orchestrator so warmed predictors receive tasks.

### GPU Support

For ONNX Runtime with GPU:
- Install `onnxruntime-gpu`
- Set providers: `['CUDAExecutionProvider', 'CPUExecutionProvider']`
- For Jetson, build TensorRT or use TensorRT ONNX

### Online Learning

Use River to adapt models incrementally:
- Persist checkpoints periodically
- Validate in a holdout stream before swapping models

## Agent Registry

The orchestrator uses an `AGENT_REGISTRY` to route tasks. Example configuration:

```python
AGENT_REGISTRY = {
    "predictor-01": {
        "types": ["predictor"],
        "tracks": ["cota","road_america","sebring","sonoma","vir","barber","indianapolis"]
    },
    "eda-01": {"types": ["eda"], "tracks": ["*"]},
    "strategy-01": {"types": ["strategy"], "tracks": ["*"]},
    "coach-01": {"types": ["coach"], "tracks": ["*"]},
}
```

## Troubleshooting

### Queue Full Errors

If you see "queue full" warnings:
- Increase `MAX_QUEUE_SIZE` environment variable
- Check agent processing speed
- Consider scaling out agents horizontally

### ONNX Model Not Found

If the predictor can't find the ONNX model:
- Set `PRED_ONNX` environment variable to model path
- The predictor will fall back to a trivial predictor if model is unavailable
- Create model at `models/predictor.onnx` or specify custom path

### Redis Connection Issues

- Verify Redis is running: `docker ps | grep redis`
- Check `REDIS_URL` environment variable
- Ensure consumer groups are created (first run will auto-create)

## Next Steps

Recommended additions:
1. Docker Compose file for Redis + all services
2. ONNX model conversion script from your trained models
3. Postgres artifact registry + REST endpoints for artifact delivery
4. Unit/integration tests for 1k telemetry point pipeline
5. Grafana dashboards for observability metrics

## Research Document Integration

The system can use sector geometry and priors from the uploaded research document:
- Set `RESEARCH_DOC_PATH` environment variable
- Sector mappings can be loaded from the doc for enhanced processing

## License

See main project LICENSE file.

