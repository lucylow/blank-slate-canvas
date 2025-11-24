# Real-Time Telemetry Pipeline

This module implements a high-performance telemetry processing pipeline based on best practices for real-time motorsport data ingestion and ML inference.

## Overview

The telemetry pipeline provides:

1. **Redis Streams Integration**: Producer/consumer pattern with consumer groups for horizontal scaling
2. **Sector Windowing**: Rolling window aggregations per vehicle/sector for fast analytics
3. **Online Learning**: Incremental ML model updates using scikit-learn `partial_fit` and River streaming
4. **ONNX Inference**: Optimized model inference with GPU support via ONNX Runtime
5. **Batch Processing**: Efficient batch ACKing and stream trimming to control memory

## Key Features

### Redis Streams with Consumer Groups

- **Horizontal Scaling**: Multiple workers can process the same stream in parallel
- **Automatic Load Balancing**: Each consumer processes distinct messages
- **Fault Tolerance**: Messages are ACKed only after successful processing
- **Memory Management**: Automatic stream trimming to prevent unbounded growth

### Sector Windowing

- **In-Memory Buffers**: Fast rolling window aggregations per (vehicle, sector)
- **Configurable Window Size**: Adjust based on your data frequency
- **Statistics**: Mean, std, and custom aggregations per sector

### Online Model Training

- **Incremental Updates**: Update models without full retraining
- **Dual Support**: Both scikit-learn (`partial_fit`) and River (streaming)
- **Model Persistence**: Save/load checkpoints for recovery

### ONNX Inference

- **Optimized Runtime**: Faster inference than raw Python
- **GPU Support**: Automatic CUDA detection and fallback to CPU
- **Batch Processing**: Efficient batch inference

## Installation

Install required dependencies:

```bash
pip install -r requirements.txt
```

Optional dependencies:
- `river`: For streaming ML (install if you want River support)
- `onnxruntime`: For ONNX model inference (install `onnxruntime-gpu` for GPU support)

## Configuration

Set environment variables:

```bash
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_STREAM=telemetry
export REDIS_GROUP=telemetry-workers
export CONSUMER_NAME=consumer-1
export STREAM_MAXLEN=100000
export BATCH_SIZE=64
export ACK_BATCH=64
export MODEL_DIR=/path/to/models
```

## Usage

### Basic Producer/Consumer

```python
from app.pipelines import make_redis, RedisTelemetryProducer, RedisStreamWorker

# Create Redis connection
r = make_redis()

# Producer
producer = RedisTelemetryProducer(r)
producer.publish({
    "timestamp": time.time(),
    "vehicle_id": "GR86-001",
    "sector": "1",
    "speed": 120.5,
    "brake": 0.0,
    "throttle": 0.85
})

# Consumer
def handle_message(msg_id: str, data: dict):
    print(f"Processing: {data}")

worker = RedisStreamWorker(r, "telemetry", "workers", "consumer-1", handle_message)
worker.run_forever()  # Runs in current thread
```

### Sector Aggregation

```python
from app.pipelines import SectorWindowAggregator

aggregator = SectorWindowAggregator(window_size=200)

# Add telemetry points
aggregator.add_point("GR86-001", "1", {"speed": 120.5, "brake": 0.0})

# Get rolling statistics
stats = aggregator.get_rolling_stats("GR86-001", "1")
print(stats)  # {"count": 1, "speed_mean": 120.5, "speed_std": None}
```

### Online Model Training

```python
from app.pipelines import OnlineModelManager
import numpy as np

manager = OnlineModelManager()

# Batch update (scikit-learn)
X = np.array([[120.5, 0.0, 0.85, 120.0]])  # features
y = np.array([5.2])  # target: laps_until_cliff
manager.update_batch_sklearn(X, y)

# Streaming update (River)
manager.update_stream_river(
    {"speed": 120.5, "brake": 0.0, "throttle": 0.85},
    5.2
)

# Save model
manager.save_sklearn()
```

### ONNX Inference

```python
from app.pipelines import ONNXInferenceEngine
import numpy as np

# Load ONNX model
engine = ONNXInferenceEngine("/path/to/model_quant.onnx")

# Batch inference
features = np.array([[120.5, 0.0, 0.85, 120.0]], dtype=np.float32)
predictions = engine.run_batch(features)
```

### Complete Pipeline

```python
from app.pipelines import TelemetryProcessor, make_redis, RedisStreamWorker

r = make_redis()
processor = TelemetryProcessor(r)

# Start worker
worker = RedisStreamWorker(r, "telemetry", "workers", "consumer-1", processor.process_message)

# Run in background thread
import threading
thread = threading.Thread(target=worker.run_forever, daemon=True)
thread.start()
```

## Integration with Existing Backend

To integrate with the existing FastAPI backend:

1. **Add a background task** in `app/main.py`:

```python
from app.pipelines import TelemetryProcessor, RedisStreamWorker, make_redis
import threading

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    r = make_redis()
    processor = TelemetryProcessor(r)
    worker = RedisStreamWorker(r, "telemetry", "workers", "api-consumer", processor.process_message)
    
    # Start worker in background
    worker_thread = threading.Thread(target=worker.run_forever, daemon=True)
    worker_thread.start()
    
    yield
    
    # Shutdown
    worker.stop()
```

2. **Add an endpoint** to publish telemetry:

```python
from app.pipelines import RedisTelemetryProducer, make_redis

@app.post("/api/telemetry/publish")
async def publish_telemetry(data: dict):
    r = make_redis()
    producer = RedisTelemetryProducer(r)
    msg_id = producer.publish(data)
    return {"message_id": msg_id, "status": "published"}
```

3. **Subscribe to insights** stream:

```python
from app.pipelines import RedisStreamWorker, make_redis

@app.get("/api/telemetry/insights/stream")
async def stream_insights():
    r = make_redis()
    
    async def generate():
        last_id = "0"
        while True:
            messages = r.xread({"live-insights": last_id}, count=10, block=1000)
            for stream, msgs in messages:
                for msg_id, data in msgs:
                    yield {"data": json.loads(data["payload"])}
                    last_id = msg_id
    
    return EventSourceResponse(generate())
```

## Monitoring

Monitor stream health:

```python
from app.pipelines import inspect_stream, make_redis

r = make_redis()
inspect_stream(r, "telemetry")
```

This prints:
- Stream length
- Consumer groups
- Consumer lag

## Performance Tuning

### Redis Streams

- **STREAM_MAXLEN**: Set based on memory constraints (e.g., 100k messages)
- **BATCH_SIZE**: Larger batches = fewer round-trips but more memory (64-256)
- **ACK_BATCH**: Batch ACKs to reduce Redis calls (64-128)

### Model Inference

- **ONNX Runtime**: Use GPU provider for NVIDIA hardware
- **Batch Size**: Process multiple predictions at once
- **Model Quantization**: Use INT8 quantized models for 4x speedup

### Parallelism

- **Multiple Consumers**: Run multiple workers in separate processes/containers
- **Sharding**: Partition by vehicle_id or sector for better parallelism
- **Kubernetes**: Use HPA to scale workers based on lag

## Best Practices

1. **Always ACK in batches** to reduce Redis round-trips
2. **Trim streams regularly** to prevent memory growth
3. **Monitor consumer lag** and scale workers if lag grows
4. **Use ONNX for production inference** (faster than raw Python)
5. **Save model checkpoints** periodically for recovery
6. **Handle errors gracefully** - log and continue processing

## References

Based on research document: "Improving Real-Time Telemetry Pipelines and ML Efficiency in Motorsport"

Key techniques:
- Redis Streams consumer groups for horizontal scaling
- Batch XACK and XTRIM for performance
- Online learning with partial_fit/River
- Model compression (quantization, pruning, distillation)
- ONNX Runtime for optimized inference



