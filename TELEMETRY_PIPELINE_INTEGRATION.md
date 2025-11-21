# Telemetry Pipeline Integration Guide

## Overview

This document describes the integration of the real-time telemetry pipeline into the PitWall AI backend. The pipeline implements best practices for high-throughput telemetry ingestion, processing, and ML inference as described in the research document.

## Architecture

```
┌─────────────────┐
│  Telemetry       │
│  Source          │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  Redis Streams  │  ← Producer publishes here
│  (telemetry)    │
└────────┬─────────┘
         │
         ├──► Consumer Group: telemetry-workers
         │
         ▼
┌─────────────────┐
│  Stream Worker  │  ← Multiple workers for scaling
│  (per consumer) │
└────────┬─────────┘
         │
         ▼
┌─────────────────┐
│  Telemetry      │
│  Processor      │
└────────┬─────────┘
         │
         ├──► Sector Aggregator (rolling windows)
         ├──► Online Model Manager (incremental learning)
         └──► ONNX Inference Engine (fast predictions)
         │
         ▼
┌─────────────────┐
│  Insights       │
│  Stream         │  ← Results published here
│  (live-insights)│
└─────────────────┘
```

## Components

### 1. Redis Streams Producer (`RedisTelemetryProducer`)

Publishes telemetry data to a Redis stream with automatic trimming.

**Use Case**: Ingest telemetry from race cars, sensors, or simulation.

### 2. Stream Worker (`RedisStreamWorker`)

Consumes messages from Redis streams using consumer groups. Supports:
- Horizontal scaling (multiple workers)
- Batch ACKing for performance
- Automatic error handling

**Use Case**: Background worker that processes telemetry in real-time.

### 3. Sector Aggregator (`SectorWindowAggregator`)

Maintains rolling windows per (vehicle, sector) for fast analytics.

**Use Case**: Compute rolling statistics (mean speed, std, etc.) per sector.

### 4. Online Model Manager (`OnlineModelManager`)

Manages incremental ML model training:
- scikit-learn `partial_fit` for batch updates
- River for streaming updates
- Model persistence (save/load)

**Use Case**: Continuously improve tire wear predictions as new data arrives.

### 5. ONNX Inference Engine (`ONNXInferenceEngine`)

Fast model inference using ONNX Runtime with GPU support.

**Use Case**: Real-time predictions for pit-wall dashboards.

## Integration Steps

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

Optional (for full functionality):
```bash
pip install river onnxruntime  # or onnxruntime-gpu for GPU
```

### Step 2: Configure Environment

Add to your `.env` or environment:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_STREAM=telemetry
REDIS_GROUP=telemetry-workers
STREAM_MAXLEN=100000
BATCH_SIZE=64
ACK_BATCH=64
MODEL_DIR=./data/models
```

### Step 3: Add Background Worker

Modify `app/main.py` to start the telemetry processor:

```python
from app.pipelines import TelemetryProcessor, RedisStreamWorker, make_redis
import threading

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting telemetry pipeline worker...")
    
    try:
        r = make_redis()
        processor = TelemetryProcessor(r)
        worker = RedisStreamWorker(
            r, 
            os.getenv("REDIS_STREAM", "telemetry"),
            os.getenv("REDIS_GROUP", "telemetry-workers"),
            f"api-consumer-{os.getpid()}",  # Unique consumer name
            processor.process_message
        )
        
        # Start worker in background thread
        worker_thread = threading.Thread(target=worker.run_forever, daemon=True)
        worker_thread.start()
        logger.info("Telemetry pipeline worker started")
    except Exception as e:
        logger.error(f"Failed to start telemetry pipeline: {e}")
    
    yield
    
    # Shutdown
    if 'worker' in locals():
        worker.stop()
        logger.info("Telemetry pipeline worker stopped")
```

### Step 4: Add Telemetry Publishing Endpoint

Create `app/routes/telemetry.py`:

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.pipelines import RedisTelemetryProducer, make_redis
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])

class TelemetryPayload(BaseModel):
    timestamp: float
    vehicle_id: str
    sector: str
    speed: float
    brake: float
    throttle: float
    # Add other fields as needed

@router.post("/publish")
async def publish_telemetry(payload: TelemetryPayload):
    """Publish telemetry data to Redis stream"""
    try:
        r = make_redis()
        producer = RedisTelemetryProducer(r)
        msg_id = producer.publish(payload.dict())
        return {"message_id": msg_id, "status": "published"}
    except Exception as e:
        logger.exception("Failed to publish telemetry")
        raise HTTPException(status_code=500, detail=str(e))
```

Then add to `app/main.py`:

```python
from app.routes.telemetry import router as telemetry_router
app.include_router(telemetry_router)
```

### Step 5: Add Insights Streaming Endpoint

Add to `app/routes/telemetry.py`:

```python
from sse_starlette.sse import EventSourceResponse
import json

@router.get("/insights/stream")
async def stream_insights():
    """Stream live insights via Server-Sent Events"""
    r = make_redis()
    
    async def generate():
        last_id = "0"
        while True:
            try:
                messages = r.xread({"live-insights": last_id}, count=10, block=1000)
                for stream, msgs in messages:
                    for msg_id, data in msgs:
                        payload = json.loads(data["payload"])
                        yield {"event": "insight", "data": json.dumps(payload)}
                        last_id = msg_id
            except Exception as e:
                logger.exception("Error in insights stream")
                yield {"event": "error", "data": json.dumps({"error": str(e)})}
                await asyncio.sleep(1)
    
    return EventSourceResponse(generate())
```

### Step 6: Frontend Integration

In your React frontend, subscribe to insights:

```typescript
// src/hooks/useTelemetryInsights.ts
import { useEffect, useState } from 'react';

export function useTelemetryInsights() {
  const [insights, setInsights] = useState<any[]>([]);
  
  useEffect(() => {
    const eventSource = new EventSource('/api/telemetry/insights/stream');
    
    eventSource.addEventListener('insight', (e) => {
      const data = JSON.parse(e.data);
      setInsights(prev => [...prev.slice(-99), data]); // Keep last 100
    });
    
    return () => eventSource.close();
  }, []);
  
  return insights;
}
```

## Scaling

### Horizontal Scaling

Run multiple worker processes/containers:

```bash
# Worker 1
CONSUMER_NAME=worker-1 python -m app.pipelines.telemetry_pipeline

# Worker 2
CONSUMER_NAME=worker-2 python -m app.pipelines.telemetry_pipeline

# Worker 3
CONSUMER_NAME=worker-3 python -m app.pipelines.telemetry_pipeline
```

Each worker will automatically balance load via Redis consumer groups.

### Kubernetes Deployment

Create a deployment with multiple replicas:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: telemetry-worker
spec:
  replicas: 3  # Scale horizontally
  template:
    spec:
      containers:
      - name: worker
        image: pitwall-ai:latest
        command: ["python", "-m", "app.pipelines.telemetry_pipeline"]
        env:
        - name: REDIS_HOST
          value: "redis-service"
        - name: CONSUMER_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
```

## Monitoring

### Stream Health

```python
from app.pipelines import inspect_stream, make_redis

r = make_redis()
inspect_stream(r, "telemetry")
```

### Metrics

Add Prometheus metrics:

```python
from prometheus_client import Counter, Histogram

telemetry_processed = Counter('telemetry_messages_processed_total', 'Total processed')
telemetry_lag = Histogram('telemetry_consumer_lag_seconds', 'Consumer lag')

# In processor
telemetry_processed.inc()
telemetry_lag.observe(lag_seconds)
```

## Performance Optimization

### Redis Configuration

- Use Redis Cluster for high availability
- Enable persistence if needed (AOF or RDB)
- Set `maxmemory` and eviction policy

### Model Optimization

1. **Quantization**: Convert FP32 → INT8 (4x smaller, faster)
2. **Pruning**: Remove redundant weights
3. **Distillation**: Train smaller student model

### Batch Sizing

- **BATCH_SIZE**: 64-256 (balance latency vs throughput)
- **ACK_BATCH**: 64-128 (reduce Redis calls)
- **STREAM_MAXLEN**: Based on memory (100k-1M)

## Troubleshooting

### High Consumer Lag

- Add more workers
- Increase BATCH_SIZE
- Check Redis performance
- Verify handler isn't blocking

### Memory Growth

- Reduce STREAM_MAXLEN
- Increase XTRIM frequency
- Check for memory leaks in aggregators

### Model Not Updating

- Verify ground truth labels in payload
- Check model save/load paths
- Monitor for exceptions in logs

## Next Steps

1. **Integrate with existing tire wear predictor**: Use ONNX export
2. **Add more features**: Extend feature engineering
3. **A/B testing**: Compare online vs batch models
4. **Alerting**: Set up alerts for high lag or errors
5. **Dashboard**: Build monitoring dashboard for pipeline health

## References

- Redis Streams: https://redis.io/docs/data-types/streams/
- ONNX Runtime: https://onnxruntime.ai/
- River ML: https://riverml.xyz/
- Research Document: See `app/pipelines/README.md`

