# PitWall Real-Time Telemetry Server

Production-ready real-time telemetry ingestion and processing server for PitWall AI.

## Features

- **Multi-protocol ingestion**: UDP, HTTP, S3 CSV polling
- **High-performance ring buffer**: In-memory circular buffer for telemetry points
- **Worker thread processing**: Offloads heavy computation (tire stress, sector aggregation)
- **WebSocket broadcasting**: Real-time telemetry and insights to connected clients
- **Backpressure handling**: Prevents memory issues with slow clients
- **TypeScript**: Full type safety and modern JavaScript features

## Quick Start

### Development

```bash
cd server/realtime
npm install
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

```bash
PORT=8081                    # HTTP server port
UDP_PORT=20777              # UDP listener port
WS_PATH=/ws/realtime        # WebSocket path
DEMO_DATA_PATH=./demo_data.json
TRACK_SECTORS_PATH=./public/tracks/track_sectors.json
BATCH_MS=600                # Aggregator batch window (ms)
RINGBUFFER_SIZE=20000       # Ring buffer capacity
MAX_WS_BUFFER=2000000       # Max WebSocket buffer (bytes)

# Optional: S3 polling
S3_BUCKET=your-bucket
S3_PREFIX=telemetry/
AWS_REGION=us-east-1
```

## Architecture

```
Ingest Layer (UDP/HTTP/S3)
    ↓
Ring Buffer (in-memory)
    ↓
Worker Thread (aggregation)
    ↓
WebSocket Broadcast
```

## API Endpoints

### REST

- `GET /api/health` - Health check
- `GET /api/recent/:n` - Get recent N telemetry points
- `POST /api/ingest` - Ingest telemetry (single or batch)

### WebSocket

- `ws://localhost:8081/ws/realtime`

**Message Types:**
- `telemetry_update` - Batched raw telemetry points
- `insight_update` - Aggregated insights (tire stress, predictions)

## Testing

### Send UDP Telemetry

```bash
echo '{"meta_time":"2025-11-20T00:00:00Z","track":"road_america","chassis":"GR86-001","lap":1,"lapdist_m":120,"speed_kmh":200,"accx_can":0.03,"accy_can":0.12,"Steering_Angle":2,"pbrake_f":0,"rpm":6500}' | nc -u -w0 127.0.0.1 20777
```

### Send HTTP Telemetry

```bash
curl -X POST http://localhost:8081/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"meta_time":"2025-11-20T00:00:00Z","track":"sebring","chassis":"GR86-001","lap":1,"lapdist_m":100,"speed_kmh":180,"accx_can":0.02,"accy_can":0.8,"rpm":6000}'
```

## Docker

```bash
docker build -t pitwall-realtime:latest .
docker run -p 8081:8081 -v /mnt/data:/data pitwall-realtime:latest
```

## Kubernetes

```bash
kubectl apply -f ../../k8s/deployment.yaml
kubectl apply -f ../../k8s/service.yaml
```

## Integration with Frontend

The frontend should connect to `ws://localhost:8081/ws/realtime` and listen for:

1. `telemetry_update` messages - Raw telemetry data
2. `insight_update` messages - Aggregated insights and predictions

The message format matches the existing frontend expectations, so no changes are needed to the React components.

## Performance Notes

- Ring buffer prevents memory growth
- Worker threads offload CPU-intensive work
- Batching reduces WebSocket overhead
- Backpressure checks prevent client overload

## Production Considerations

1. **Scale**: For high throughput, use Kafka/Redis streams instead of ring buffer
2. **Persistence**: Add async logging to S3/Kafka for replay
3. **Security**: Add API keys and TLS
4. **Monitoring**: Add Prometheus metrics
5. **Multiple Workers**: Partition by chassis hash for parallel processing

