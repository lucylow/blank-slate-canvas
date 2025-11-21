# Demo Mode Guide

This guide explains how to run PitWall AI Backend in demo mode for Lovable previews and hackathon demos.

## Quick Start (Demo Mode)

```bash
# Build Docker image
docker build -t pitwall-backend .

# Run with demo mode enabled
docker run -e DEMO_MODE=true -p 8000:8000 pitwall-backend
```

Then test the endpoints:
```bash
# Health check
curl http://localhost:8000/health

# Demo seed data
curl http://localhost:8000/demo/seed

# SSE stream (use curl -N to see streaming)
curl -N http://localhost:8000/sse/live/GR86-001

# WebSocket (use wscat or test client)
wscat -c ws://localhost:8000/ws/telemetry/GR86-001
```

## Demo Mode Features

When `DEMO_MODE=true`:
- Uses precomputed demo slices from `data/demo_slices/`
- Generates synthetic telemetry if no demo data is available
- Relaxed readiness checks (no DB required)
- All endpoints available with sample data

## Demo Data Structure

Demo data is stored in `data/demo_slices/` as JSON files:
- `best_overtake.json` - High-speed overtake scenario
- `tire_cliff.json` - Tire degradation scenario
- `last_lap_push.json` - Aggressive last lap push

Each file contains timestamped telemetry frames with:
- `timestamp` - ISO 8601 timestamp
- `telemetry_name` - Sensor name (speed, brake_pressure, accx_can, etc.)
- `telemetry_value` - Sensor reading
- `vehicle_id` - Vehicle identifier
- `vehicle_number` - Vehicle number

## Generating Demo Slices

```bash
# Generate synthetic demo slices
python3 scripts/generate_demo_slices.py --out data/demo_slices

# Or extract from archive (if available)
python3 scripts/precompute_from_archive.py --input /path/to/archive --out data
```

## Testing WebSocket with Python Client

```bash
# Install dependencies
pip install websockets

# Run test client
python3 test/test_ws_client.py --ws ws://localhost:8000/ws/telemetry/GR86-001 --messages 10
```

The test client will:
1. Connect to WebSocket endpoint
2. Send sample telemetry frames
3. Display acknowledgment responses
4. Show any anomaly alerts received

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEMO_MODE` | `false` | Enable demo mode (uses precomputed data) |
| `DATA_ARCHIVE_URL` | - | Optional file:// URL to backend archive |
| `SSE_INTERVAL_MS` | `1000` | SSE update interval in milliseconds |
| `PORT` | `8000` | Server port |
| `LOG_LEVEL` | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |

## Data Archive Extraction

If `DATA_ARCHIVE_URL` is set and points to a local file URL (e.g., `file:///mnt/data/pitwall-backend-v2.tar.gz`), the startup script will:
1. Extract the archive to `/app/data/raw`
2. Run `scripts/precompute_from_archive.py` to create demo slices and precomputed aggregations
3. Generate `data/precomputed/coverage.json` with dataset information

**Note:** Do not commit large telemetry files to Git. Use environment-mounted archives or cloud storage.

## Troubleshooting

### Demo mode not loading data
- Check that `data/demo_slices/` exists and contains JSON files
- Run `python3 scripts/generate_demo_slices.py` to create demo slices
- Check container logs: `docker logs <container_id>`

### WebSocket connection fails
- Ensure WebSocket endpoint is accessible: `ws://localhost:8000/ws/telemetry/GR86-001`
- Check CORS settings if connecting from browser
- Verify port is correctly mapped: `-p 8000:8000`

### SSE stream not updating
- Verify interval is set correctly: `SSE_INTERVAL_MS=1000`
- Use `curl -N` to see streaming output without buffering
- Check that vehicle ID matches demo data vehicle IDs

## Next Steps

- See [README.md](README.md) for full deployment guide
- See [lovable.yaml](lovable.yaml) for Lovable Cloud configuration
- See [.github/workflows/lovable-deploy.yml](.github/workflows/lovable-deploy.yml) for CI/CD setup

