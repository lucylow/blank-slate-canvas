# Anomaly Detection Setup Guide

## Quick Start

### 1. Install Backend Dependencies

```bash
cd "Backend Code Development for AI Features in Application/pitwall-backend"
pip install -r requirements.txt
```

This will install `pyod==1.1.2` along with other dependencies.

### 2. Start the Backend

```bash
python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The anomaly detection endpoints will be available at:
- REST API: `http://localhost:8000/api/anomaly/*`
- WebSocket: `ws://localhost:8000/api/anomaly/ws/{vehicle_id}`
- Health Check: `http://localhost:8000/api/anomaly/health`

### 3. Frontend Integration

The frontend components are already integrated into the dashboard. The `AnomalyAlerts` component will automatically appear in the dashboard when telemetry data is available.

## Testing

### Test Anomaly Detection API

```bash
# Health check
curl http://localhost:8000/api/anomaly/health

# Detect anomaly in a single point
curl -X POST http://localhost:8000/api/anomaly/detect \
  -H "Content-Type: application/json" \
  -d '{
    "vehicle_id": "vehicle_7",
    "telemetry_point": {
      "pbrake_f": 120.5,
      "pbrake_r": 115.2,
      "accx_can": 0.8,
      "accy_can": 0.3,
      "Speed": 145.6,
      "nmot": 6500,
      "timestamp": "2025-05-15T20:25:55.003Z",
      "vehicle_number": 7,
      "lap": 12
    }
  }'

# Get statistics
curl "http://localhost:8000/api/anomaly/stats?track=sebring&race=1&vehicle=7"
```

### Test WebSocket Connection

```javascript
// In browser console or Node.js
const ws = new WebSocket('ws://localhost:8000/api/anomaly/ws/vehicle_7');

ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
ws.onerror = (error) => console.error('Error:', error);
```

## Integration Points

### 1. Dashboard Integration

The `PitWallDashboard` component now includes the `AnomalyAlerts` component in the right sidebar. It automatically connects to the WebSocket when telemetry data is available.

### 2. Custom Integration

To add anomaly detection to other components:

```tsx
import { AnomalyAlerts } from '@/components/anomaly/AnomalyAlerts';
import { AnomalyStats } from '@/components/anomaly/AnomalyStats';

// In your component
<AnomalyAlerts
  vehicleId="vehicle_7"
  vehicleNumber={7}
  maxAlerts={10}
/>

<AnomalyStats
  track="sebring"
  race={1}
  vehicle={7}
  autoRefresh={true}
/>
```

### 3. Backend Integration

To integrate anomaly detection into your telemetry processing pipeline:

```python
from app.services.anomaly_detector import anomaly_detector
from app.routes.anomaly_detection import connection_manager

# In your telemetry processing loop
for telemetry_point in telemetry_stream:
    vehicle_id = f"vehicle_{telemetry_point['vehicle_number']}"
    
    # Detect anomalies
    result = anomaly_detector.detect(vehicle_id, telemetry_point)
    
    # Broadcast if anomaly detected
    if result['is_anomaly']:
        await connection_manager.broadcast(vehicle_id, {
            'type': 'anomaly_alert',
            'data': result
        })
```

## File Structure

### Backend Files Created

- `app/services/anomaly_detector.py` - Core anomaly detection logic
- `app/models/anomaly.py` - Pydantic models
- `app/routes/anomaly_detection.py` - REST and WebSocket endpoints

### Frontend Files Created

- `src/api/anomaly.ts` - API client
- `src/components/anomaly/AnomalyAlerts.tsx` - Real-time alerts component
- `src/components/anomaly/AnomalyStats.tsx` - Statistics component

### Documentation

- `ANOMALY_DETECTION.md` - Complete documentation
- `ANOMALY_DETECTION_SETUP.md` - This file

## Configuration

### Adjust Detection Sensitivity

Edit `app/services/anomaly_detector.py`:

```python
anomaly_detector = AnomalyDetector(
    window_size=100,        # Increase for more stable baseline
    contamination=0.1,       # Lower = fewer alerts (0.05 = 5%)
    n_estimators=100,       # More trees = better accuracy, slower
)
```

### Adjust Critical Thresholds

Edit thresholds in `AnomalyDetector.__init__`:

```python
self.critical_thresholds = {
    'pbrake_f': {'max': 150.0, 'min': 0.0},  # Adjust based on your data
    # ... add more sensors
}
```

## Troubleshooting

### Issue: PyOD Import Error

**Solution**: Install PyOD
```bash
pip install pyod==1.1.2
```

### Issue: WebSocket Not Connecting

**Check**:
1. Backend is running on port 8000
2. CORS settings in `app/config.py`
3. WebSocket URL in frontend matches backend

### Issue: Too Many False Positives

**Solutions**:
1. Lower `contamination` parameter (e.g., 0.05)
2. Increase `window_size` for better baseline
3. Adjust critical thresholds
4. Retrain model more frequently

### Issue: Performance Issues

**Solutions**:
1. Reduce `window_size`
2. Decrease `n_estimators`
3. Process in batches instead of point-by-point
4. Use CPU-optimized PyOD (already enabled with `n_jobs=-1`)

## Next Steps

1. **Train on Historical Data**: Use batch detection to analyze historical races and tune parameters
2. **Customize Thresholds**: Adjust critical thresholds based on your specific vehicle/track data
3. **Add More Sensors**: Extend `feature_columns` to include additional telemetry channels
4. **Integrate with Alerts**: Connect anomaly alerts to your notification system
5. **Dashboard Enhancements**: Add anomaly visualization to charts and maps

## Support

For detailed documentation, see `ANOMALY_DETECTION.md`.

For issues or questions, check:
- Backend logs: Console output from uvicorn
- Frontend console: Browser developer tools
- WebSocket status: `/api/anomaly/health` endpoint


