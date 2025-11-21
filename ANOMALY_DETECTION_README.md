# Real-Time Telemetry Anomaly Detection

This system adds real-time anomaly detection capabilities to the PitWall stack, enabling detection of abnormal telemetry patterns during races.

## Overview

The anomaly detection system consists of:

1. **AnomalyEngine** - Multi-detector engine with:
   - Rule-based detection (thresholds, derivative spikes)
   - River streaming detectors (online statistical analysis)
   - PyOD IsolationForest (windowed feature detection)
   - LSTM Autoencoder (sequence reconstruction errors)

2. **WebSocket Endpoint** - `/ws/telemetry/{vehicle_id}` for real-time telemetry streaming and alert broadcasting

3. **Frontend Hook** - `useAnomalyWS` React hook for connecting to the WebSocket and receiving alerts

## Installation

### Required Dependencies

Add to your `requirements.txt`:

```txt
fastapi
uvicorn[standard]
numpy
pandas
scikit-learn
```

### Optional Dependencies (for advanced detectors)

```txt
pyod        # Windowed detector (IsolationForest)
river       # Streaming statistical detectors
tensorflow  # Sequence autoencoder (or keras)
```

Install with:
```bash
pip install -r requirements.txt
```

**Note**: The system works with just rule-based detection if you prefer to avoid heavy dependencies. The engine gracefully handles missing optional libraries.

## Configuration

Edit `config/anomaly_rules.json` to tune detection thresholds:

```json
{
  "rules": {
    "brake_pressure": {"max": 2000, "dmax": 1000},
    "tire_temp": {"d_rate_c_per_s": 3.0},
    "speed": {"max": 230}
  },
  "use_pyod_iforest": false,
  "pyod_threshold": 0.6,
  "ae_threshold": 0.0005
}
```

### Rule Configuration Options

- `max`: Maximum allowed value (threshold exceed)
- `dmax`: Maximum allowed derivative (rate of change per second)
- `d_rate_c_per_s`: Maximum temperature rise rate (for temperature channels)

## Usage

### Backend

The WebSocket endpoint is automatically registered when you include the router in `app/main.py` (already done).

**Endpoint**: `ws://localhost:8000/ws/telemetry/{vehicle_id}`

**Message Format** (send telemetry frames):
```json
{
  "type": "telemetry",
  "ts": 1234567890.123,
  "speed": 120,
  "brake_pressure": 400,
  "tire_temp": 78,
  "accx": 0.5,
  "accy": 0.2
}
```

**Alert Format** (received):
```json
{
  "vehicle": "GR86-004-78",
  "alert": {
    "category": "rule",
    "payload": {
      "detector": "rule",
      "alerts": [{
        "type": "threshold_exceed",
        "channel": "brake_pressure",
        "value": 2100,
        "threshold": 2000,
        "severity": "high",
        "explain": "brake_pressure 2100 > max 2000"
      }],
      "ts": 1234567890.123
    },
    "ts": 1234567890.123,
    "vehicle": "GR86-004-78"
  },
  "sample": { /* original telemetry sample */ },
  "ts": 1234567890.123
}
```

### Frontend

Use the `useAnomalyWS` hook in your React components:

```typescript
import useAnomalyWS from '@/hooks/useAnomalyWS';

function Dashboard() {
  const { alerts, sendTelemetry } = useAnomalyWS("GR86-004-78");

  // Send telemetry frames periodically
  useEffect(() => {
    const interval = setInterval(() => {
      sendTelemetry({
        type: "telemetry",
        ts: Date.now() / 1000,
        speed: 120,
        brake_pressure: 400,
        tire_temp: 78
      });
    }, 100); // Every 100ms

    return () => clearInterval(interval);
  }, [sendTelemetry]);

  // Display alerts
  return (
    <div>
      {alerts.map((alert, i) => (
        <Alert key={i} severity={alert.alert.payload.alerts[0]?.severity}>
          {alert.alert.payload.alerts[0]?.explain}
        </Alert>
      ))}
    </div>
  );
}
```

## Training the Autoencoder (Optional)

To train a sequence autoencoder for advanced anomaly detection:

1. Ensure you have your telemetry data (e.g., `sebring.zip`) available
2. Update `ZIP_PATH` in `scripts/train_ae.py` to point to your data
3. Run the training script:

```bash
python scripts/train_ae.py
```

This will:
- Extract telemetry samples from the zip file
- Build overlapping windows of sequences
- Train an LSTM autoencoder
- Save the model to `models/seq_ae.h5`

4. Update `app/routes/anomaly_ws.py` to load the model:
   ```python
   ENGINE = AnomalyEngine(config={
       # ... other config ...
       "ae_model_path": "models/seq_ae.h5"
   })
   ```

## Architecture

```
Frontend (React)
    ↓ WebSocket
Backend (FastAPI)
    ↓
ConnectionManager (broadcasts alerts)
    ↓
AnomalyEngine
    ├─ Rule Detector (immediate, low latency)
    ├─ Stream Detector (River, online stats)
    ├─ Window Detector (PyOD, optional)
    └─ Sequence AE (Keras, optional)
```

## Features

- **Low Latency**: Rule-based detection runs immediately with minimal overhead
- **Explainability**: Alerts include human-readable explanations
- **Scalable**: Ring buffers limit memory usage per vehicle
- **Fault Tolerant**: Gracefully handles missing optional dependencies
- **Real-time**: WebSocket-based for instant alert delivery

## Testing

You can test the system by:

1. Starting the backend server
2. Opening a WebSocket connection to `/ws/telemetry/{vehicle_id}`
3. Sending telemetry frames with intentionally anomalous values (e.g., `speed: 300`)
4. Observing alerts broadcast back through the WebSocket

## Troubleshooting

- **No alerts received**: Check that telemetry values exceed configured thresholds
- **WebSocket connection fails**: Verify backend is running and CORS is configured
- **Import errors**: Install missing optional dependencies or disable those detectors
- **Model loading fails**: Ensure model path is correct and TensorFlow is installed


