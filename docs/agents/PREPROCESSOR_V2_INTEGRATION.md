# Preprocessor v2 & Feature Engineering Integration Guide

This document describes the improved Data Preprocessing & Feature Engineering system integrated into the PitWall AI multi-agent architecture.

## Overview

The improved preprocessing system provides:
- **Strict schema validation** with AJV
- **Canonicalization** of telemetry data
- **Sectorization** using track_sectors.json
- **Per-sector aggregation** with derived features
- **Low-latency derived signals** (lateral_g, tire_stress, brake_power)
- **Data quality metrics** tracked in Redis
- **Compact message format** with evidence references

## Architecture

```
Telemetry Ingestion (UDP/S3/API)
    └─> telemetry.stream (Redis Streams)
           └─> Preprocessor v2
                 ├─> Schema Validation (AJV)
                 ├─> Canonicalization
                 ├─> Derived Features (lateral_g, tire_stress, etc.)
                 ├─> Sectorization
                 └─> Aggregation Buffer (per track/chassis/lap)
                       └─> aggregates.stream
                       └─> tasks.stream (aggregate_window tasks)
```

## Files

### 1. `preprocessor/preprocessor_v2.js`
Improved Node.js preprocessor agent that:
- Reads from `telemetry.stream` (Redis Streams)
- Validates incoming data with AJV schema
- Computes derived features in real-time
- Buffers samples by (track, chassis, lap)
- Emits aggregate windows to `aggregates.stream` and `tasks.stream`
- Tracks metrics in `preproc.metrics` Redis hash

### 2. `predictor/fe_lib.py`
Python feature engineering library with:
- `canonicalize_point()` - Normalize telemetry points
- `compute_derived()` - Calculate derived features
- `sectorize_point()` - Map lapdist_m to sector index
- `aggregate_per_sector()` - Aggregate samples by sector
- `prepare_features_for_model()` - Flatten aggregates to feature vector

### 3. `predictor/predictor_wrapper.py`
Wrapper functions to integrate fe_lib with predictor agents:
- `features_from_task()` - Extract features from aggregate_window task
- `get_feature_names()` - Get feature names for explainability

## Setup

### Install Dependencies

**Node.js:**
```bash
cd agents
npm install ajv lodash
```

**Python:**
```bash
pip install pandas numpy scipy
# (other deps already in requirements.txt)
```

### Configuration

Set environment variables:
```bash
export REDIS_URL=redis://127.0.0.1:6379
export TELEMETRY_STREAM=telemetry.stream
export AGG_STREAM=aggregates.stream
export TASK_STREAM=tasks.stream
export TRACK_SECTORS_PATH=public/tracks/track_sectors.json
```

## Running Preprocessor v2

```bash
# Option 1: Direct execution
cd agents/preprocessor
REDIS_URL=redis://localhost:6379 node preprocessor_v2.js

# Option 2: Via npm script
cd agents
npm run preprocessor:v2
```

## Message Format

### Input: Telemetry Stream
```json
{
  "meta_time": "2025-01-20T12:00:00.000Z",
  "track": "cota",
  "chassis": "GR86-002",
  "lap": 12,
  "lapdist_m": 1500.5,
  "speed_kmh": 180.2,
  "accx_can": 0.5,
  "accy_can": -1.2,
  "Steering_Angle": 15.3,
  "throttle_pct": 85.0,
  "brake_pct": 0.0,
  "rpm": 6500
}
```

### Output: Aggregate Window Task
```json
{
  "task_id": "task-agg-0001",
  "task_type": "aggregate_window",
  "track": "cota",
  "chassis": "GR86-002",
  "lap": 12,
  "payload": {
    "track": "cota",
    "chassis": "GR86-002",
    "lap": 12,
    "perSector": {
      "0": {
        "n": 120,
        "avg_speed": 148.2,
        "max_lat_g": 1.23,
        "tire_stress_sum": 124000,
        "brake_energy": 0.92,
        "evidence": [
          {"meta_time": "...", "lapdist_m": 500, "speed_kmh": 150}
        ]
      },
      "1": { ... },
      "2": { ... }
    },
    "sample_count": 420,
    "created_at": "2025-01-20T12:00:05.000Z"
  }
}
```

## Integration with Predictor Agent

Update `predictor/predictor_agent.py` to use the wrapper:

```python
from predictor_wrapper import features_from_task, get_feature_names

def predict_feature_vector(task):
    # Extract features from aggregate_window task
    features = features_from_task(task)
    
    # Get feature names for explainability
    track = task.get('track', 'cota')
    feature_names = get_feature_names(track=track)
    
    # Make prediction
    pred = model.predict([features])[0]
    
    # For SHAP explainability
    if hasattr(model, 'predict_proba'):
        import shap
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values([features])
        top_features = sorted(
            zip(feature_names, shap_values[0]),
            key=lambda x: abs(x[1]),
            reverse=True
        )[:5]
    else:
        top_features = []
    
    return {
        'prediction': pred,
        'top_features': [{'name': n, 'value': float(v)} for n, v in top_features]
    }
```

## Metrics

Preprocessor v2 tracks metrics in Redis hash `preproc.metrics`:
- `frames_processed` - Total valid frames processed
- `invalid_frames` - Frames that failed validation
- `parse_errors` - JSON parse errors
- `process_errors` - Processing errors

Query metrics:
```bash
redis-cli HGETALL preproc.metrics
```

## Data Quality

The preprocessor validates:
1. **Required fields**: meta_time, track, chassis, lap, lapdist_m
2. **Type coercion**: Numbers are coerced to correct types
3. **Schema validation**: AJV validates structure

Invalid frames are:
- Rejected (not buffered)
- Counted in `invalid_frames` metric
- Logged (if DEBUG=true)

## Sectorization

Sectorization uses `track_sectors.json`:
- Maps `lapdist_m` to sector index (0, 1, 2, ...)
- Falls back to equal-thirds if track not found
- Supports variable number of sectors per track

## Derived Features

Computed for each sample:
- `lateral_g` - Lateral acceleration (accy_can)
- `long_g` - Longitudinal acceleration (accx_can)
- `inst_tire_stress` - Instantaneous tire stress (accx² + accy²)
- `brake_power` - Brake power (brake_pct × speed_kmh)
- `steer_rate` - Steering rate (computed from previous sample)

## Buffering Strategy

- Buffers samples by (track, chassis, lap)
- Flushes when:
  - Buffer size >= 600 samples
  - Buffer age >= 5 seconds
- Keeps last 50 samples in buffer after flush (sliding window)
- Cleans up inactive buffers after 60 seconds

## Testing

### Test Preprocessor v2 Locally

1. Start Redis:
```bash
redis-server
```

2. Publish test telemetry:
```bash
redis-cli XADD telemetry.stream '*' data '{"meta_time":"2025-01-20T12:00:00Z","track":"cota","chassis":"GR86-002","lap":12,"lapdist_m":1500,"speed_kmh":180,"accx_can":0.5,"accy_can":-1.2,"Steering_Angle":15,"throttle_pct":85,"brake_pct":0,"rpm":6500}'
```

3. Check aggregates stream:
```bash
redis-cli XREAD COUNT 1 STREAMS aggregates.stream 0
```

4. Check metrics:
```bash
redis-cli HGETALL preproc.metrics
```

### Test fe_lib.py

```bash
cd agents/predictor
python fe_lib.py
```

## Migration from v1

The original `preprocessor-agent.js` remains available. To migrate:

1. Update orchestrator to route to preprocessor v2
2. Update predictor agents to use `predictor_wrapper.py`
3. Test with sample data
4. Monitor metrics for data quality

## Troubleshooting

**No aggregates appearing:**
- Check Redis connection: `redis-cli PING`
- Check telemetry stream: `redis-cli XINFO STREAM telemetry.stream`
- Check metrics: `redis-cli HGETALL preproc.metrics`

**Validation errors:**
- Enable DEBUG: `DEBUG=true node preprocessor_v2.js`
- Check required fields in input data
- Verify track_sectors.json path

**High invalid_frames count:**
- Review input data format
- Check schema requirements
- Verify field names match expected format

## Next Steps

1. **Unit Tests**: Add tests for `computeDerived`, `sectorize_point`, `aggregate_per_sector`
2. **Training Notebook**: Use `fe_lib.prepare_features_for_model` to train per-track models
3. **Docker Compose**: Create local testing environment with Redis + agents
4. **Prometheus Export**: Export metrics to Prometheus for monitoring

## References

- Seed doc: `/mnt/data/2 Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .md`
- Track sectors: `public/tracks/track_sectors.json`
- Original preprocessor: `preprocessor/preprocessor-agent.js`
- Predictor agent: `predictor/predictor_agent.py`

