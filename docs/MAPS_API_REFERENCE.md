# Maps & Location API Reference

This document describes the mapping and location APIs implemented for the PitWall hack.

## Overview

The Maps & Location APIs provide:
- **Map Matching**: Snap GPS telemetry to track centerlines
- **Spatial Enrichment**: Add track-relative coordinates (s, sector, elevation, curvature) to telemetry
- **Track Geometry**: Get track centerlines, sectors, and elevation profiles
- **HUD/XR Feeds**: Low-latency feeds for heads-up displays and XR overlays
- **Edge Export**: Export map assets and models for edge devices

## Endpoints

### Track Geometry

#### `GET /api/maps/track/{track_id}`
Get track geometry, sectors, and metadata.

**Response:**
```json
{
  "track_id": "sebring",
  "name": "Sebring International Raceway",
  "centerline_geojson": { "type": "LineString", "coordinates": [...] },
  "sectors": [
    { "id": "s1", "start_s": 0.0, "end_s": 2006.0, "name": "Sector 1" }
  ],
  "length_m": 6019.0,
  "elevation_profile": [ {"s": 0.0, "elev": 12.3}, ... ]
}
```

#### `GET /api/maps/track/{track_id}/tilespec`
Get tile specification for track (zoom levels, bounds, URL template).

### Map Matching

#### `POST /api/maps/match`
Snap raw GPS telemetry points to nearest track centerline.

**Request:**
```json
{
  "track_id": "sebring",
  "points": [
    {"ts": 1699999200, "lat": 27.3, "lon": -80.3}
  ]
}
```

**Response:**
```json
{
  "matches": [
    {
      "ts": 1699999200,
      "lat": 27.3,
      "lon": -80.3,
      "s": 1234.12,
      "offset_m": 0.4,
      "sector": "s2",
      "arc_kappa": 0.004,
      "elevation": 12.4
    }
  ]
}
```

### Telemetry Enrichment

#### `POST /api/maps/telemetry/enrich`
Enrich telemetry samples with spatial data.

**Request:**
```json
{
  "chassis": "GR86-002",
  "track_id": "sebring",
  "samples": [
    {
      "ts": 1699999200,
      "lat": 27.3,
      "lon": -80.3,
      "speed_kmh": 210,
      "rpm": 8000
    }
  ]
}
```

**Response:**
```json
{
  "chassis": "GR86-002",
  "enriched_samples": [
    {
      "ts": 1699999200,
      "lat": 27.3,
      "lon": -80.3,
      "speed_kmh": 210,
      "rpm": 8000,
      "s": 1234.12,
      "sector": "s2",
      "elevation": 12.4,
      "curvature": 0.0032,
      "offset_m": 0.4,
      "on_racing_line": true
    }
  ]
}
```

### Sector Metrics

#### `GET /api/maps/track/{track_id}/sector_metrics?lap=12&chassis=GR86-002`
Get per-sector metrics computed from telemetry for a lap.

**Response:**
```json
{
  "lap": 12,
  "chassis": "GR86-002",
  "track_id": "sebring",
  "sectors": [
    {
      "sector_id": "s1",
      "avg_speed_kmh": 185.0,
      "peak_brake_g": 1.45,
      "tire_temp_avg": 82.3
    }
  ]
}
```

### Pit Route Optimization

#### `POST /api/maps/optimization/pit-route`
Compute safe pit entry routing.

**Request:**
```json
{
  "vehicle": "GR86-002",
  "s_current": 5000.0,
  "track_id": "sebring"
}
```

**Response:**
```json
{
  "entry_s": 5116.0,
  "exit_s": 300.0,
  "expected_time_loss": 25.0,
  "route_geojson": { "type": "LineString", "coordinates": [...] },
  "recommendation": "Pit entry recommended at sector 3, exit at sector 1"
}
```

### HUD/XR Feeds

#### `GET /api/maps/sse/hud/{vehicle}` (SSE)
Server-Sent Events feed for HUD/XR overlays.

**Message Format:**
```json
{
  "vehicle": "GR86-002",
  "ts": 1699999200,
  "pit_window": {
    "recommendation": "Pit Now",
    "delta_s": -3.8,
    "risk": 22
  },
  "highlight_path": [
    {"lat": 27.4547, "lon": -80.3478}
  ],
  "evidence": {
    "s": 1234.1,
    "sector": "s2",
    "trace_url": "/api/telemetry/replay/GR86-002/1234"
  }
}
```

#### `WS /ws/maps/hud/{vehicle}` (WebSocket)
WebSocket feed for bi-directional HUD/XR communication.

**Client Messages:**
- `{"type": "ack", "message_id": "123"}` - Acknowledge message
- `{"type": "toggle_overlay", "overlay_type": "pit_path", "enabled": true}` - Toggle overlay
- `{"type": "ping"}` - Keepalive

**Server Messages:**
- `{"type": "connected", "vehicle": "GR86-002", "ts": 1699999200}`
- `{"type": "insight_update", "data": {...}}` - Insight update
- `{"type": "pong", "ts": 1699999200}` - Pong response

### Edge Export

#### `POST /api/maps/edge/export`
Export map assets and models for edge devices.

**Request:**
```json
{
  "track_id": "sebring",
  "bbox": [-80.4, 27.4, -80.3, 27.5],
  "model_version": "1.0.0"
}
```

**Response:**
```json
{
  "mbtiles_url": "/api/maps/edge/download/sebring/tiles.mbtiles",
  "geojson_url": "/api/maps/edge/download/sebring/geometry.geojson",
  "onnx_model_url": "/api/maps/edge/download/sebring/model.onnx",
  "checksum": "abc123def456",
  "manifest": {
    "track_id": "sebring",
    "model_version": "1.0.0",
    "exported_at": "2024-01-01T00:00:00",
    "bbox": [-80.4, 27.4, -80.3, 27.5]
  },
  "expires_at": "2024-01-01T23:59:59"
}
```

## Mock Data

The service includes mock data for fallback scenarios:

- **Track Geometry**: Mock centerlines, sectors, and elevation profiles for all tracks
- **Telemetry Samples**: Sample GPS points and telemetry data in `data/mock_telemetry_samples.json`
- **Sector Metrics**: Default metrics when actual telemetry is unavailable

Mock data is automatically used when:
- Track geometry files are not found
- Telemetry data is missing
- Database connections fail

## Implementation Notes

### Map Matching Algorithm

The service uses a simplified map matching algorithm:
1. Find closest point on track centerline using Haversine distance
2. Calculate distance along track (s) using cumulative segment lengths
3. Determine sector from s bounds
4. Interpolate elevation from elevation profile
5. Calculate curvature (simplified)

**Production Enhancement**: Use PostGIS `ST_ClosestPoint` and `ST_LineLocatePoint` for accurate matching.

### Performance

- Map matching: ~10ms per point (mock implementation)
- Enrichment: ~50ms per batch of 100 samples
- SSE/WebSocket: <20ms latency for updates

### Caching

- Track geometry cached in memory after first load
- Recent matching results can be cached in Redis (future enhancement)

## Example Usage

### Python Client

```python
import requests

# Get track geometry
response = requests.get("http://localhost:8000/api/maps/track/sebring")
track = response.json()

# Match GPS points
match_request = {
    "track_id": "sebring",
    "points": [
        {"ts": 1699999200, "lat": 27.4547, "lon": -80.3478}
    ]
}
response = requests.post("http://localhost:8000/api/maps/match", json=match_request)
matches = response.json()

# Enrich telemetry
enrich_request = {
    "chassis": "GR86-002",
    "track_id": "sebring",
    "samples": [
        {"ts": 1699999200, "lat": 27.4547, "lon": -80.3478, "speed_kmh": 210}
    ]
}
response = requests.post("http://localhost:8000/api/maps/telemetry/enrich", json=enrich_request)
enriched = response.json()
```

### JavaScript/TypeScript Client

```typescript
// SSE Feed
const eventSource = new EventSource('/api/maps/sse/hud/GR86-002');
eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('HUD update:', update);
};

// WebSocket Feed
const ws = new WebSocket('ws://localhost:8000/ws/maps/hud/GR86-002');
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'insight_update') {
    console.log('Insight:', message.data);
  }
};
```

## Future Enhancements

- [ ] PostGIS integration for accurate map matching
- [ ] MBTiles generation and serving
- [ ] Real-time traffic simulation
- [ ] Advanced routing algorithms
- [ ] ONNX model quantization and export
- [ ] Prometheus metrics for map operations
- [ ] Redis caching for matching results

