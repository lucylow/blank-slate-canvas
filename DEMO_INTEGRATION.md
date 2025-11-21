# Demo Data Integration Guide

This document describes how the demo data integration works and how to use it.

## Overview

The demo integration allows the frontend to work offline using pre-recorded telemetry data from `demo_data.json` and track-specific demo files. When demo mode is enabled, the frontend connects to a local demo server that replays telemetry data and provides mock predictions.

## Quick Start

### 1. Start the Demo Server

```bash
# Using npm script (recommended)
npm run demo-server

# Or manually
node server/demo-server.js

# With custom demo data path
DEMO_DATA_PATH=/path/to/demo_data.json node server/demo-server.js
```

The demo server will:
- Load telemetry data from `demo_data.json` (or track-specific files in `public/demo_data/`)
- Start on port 8081 (or `DEMO_PORT` env var)
- Expose REST endpoints and WebSocket streams

### 2. Enable Demo Mode in Frontend

1. Open the application
2. Toggle "Demo Mode" in the UI (using the `DemoModeToggle` component)
3. The frontend will automatically:
   - Connect to `ws://localhost:8081/ws/demo` for telemetry replay
   - Use `/api/predict_demo/:track/:chassis` for predictions
   - Use `/api/health` for health checks

### 3. Run Both Together

```bash
# Start demo server and frontend together
npm run demo
```

## Architecture

### Backend (Demo Server)

**File**: `server/demo-server.js`

**Endpoints**:
- `GET /api/demo_data` - Returns full demo dataset metadata
- `GET /api/predict_demo/:track/:chassis` - Returns demo prediction for track/chassis
- `GET /api/health` - Health check endpoint
- `GET /health` - Legacy health endpoint
- `WS /ws` - WebSocket telemetry replay (legacy)
- `WS /ws/demo` - WebSocket telemetry replay (demo mode)

**Data Sources**:
1. Primary: `demo_data.json` at project root (or `DEMO_DATA_PATH` env var)
2. Fallback: Track-specific files in `public/demo_data/*_demo.json`
3. Final fallback: `server/sample_data/sample_laps.json`

### Frontend Integration

**Demo API Client**: `src/api/demo.ts`
- `getDemoData()` - Fetch demo dataset
- `predictDemo(track, chassis)` - Get demo prediction
- `checkDemoHealth()` - Check demo server health

**WebSocket Hook**: `src/hooks/useDemoWs.ts`
- `useDemoWs()` - Hook for demo WebSocket connection
- Supports play/pause/speed control
- Automatic reconnection

**Prediction Hook**: `src/hooks/usePrediction.ts`
- Automatically switches between demo and real backend based on `useDemoMode()`
- Uses `predictDemo()` when in demo mode
- Uses `predictTire()` when in live mode

**Demo Mode Hook**: `src/hooks/useDemoMode.ts`
- Manages demo mode state with localStorage persistence
- `isDemoMode` - Current state
- `toggleDemoMode()` - Toggle function

## Data Format

### Demo Telemetry Points

Each telemetry point should have:
```json
{
  "timestamp": "ISO string",
  "vehicle_id": "string",
  "vehicle_number": number,
  "lap": number,
  "track": "string (optional)",
  "chassis": "string (optional)",
  "accx_can": number,
  "accy_can": number,
  "pbrake_f": number,
  "speed_kmh": number,
  // ... other telemetry fields
}
```

### Track Sectors

Sector definitions are in `public/tracks/track_sectors.json`:
```json
{
  "track_id": {
    "total_m": number,
    "sectors": [
      {"name": "S1", "start_m": 0, "end_m": 2171},
      {"name": "S2", "start_m": 2171, "end_m": 4343},
      {"name": "S3", "start_m": 4343, "end_m": 6515}
    ]
  }
}
```

## WebSocket Protocol

### Client → Server

```json
// Set replay speed (40-500ms interval)
{"type": "set_speed", "intervalMs": 80}

// Pause replay
{"type": "pause"}

// Resume replay
{"type": "resume"}

// Ping
{"cmd": "ping"}
```

### Server → Client

```json
// Telemetry point
{"type": "telemetry_point", "data": {...}}

// Error
{"type": "error", "message": "..."}

// Pong
{"type": "pong", "time": "ISO string"}
```

## Testing

### Test REST Endpoints

```bash
# Health check
curl http://localhost:8081/api/health | jq

# Demo data
curl http://localhost:8081/api/demo_data | jq '.meta'

# Prediction
curl http://localhost:8081/api/predict_demo/road_america/GR86-DEMO-01 | jq
```

### Test WebSocket

```javascript
// In browser console
const ws = new WebSocket('ws://localhost:8081/ws/demo');
ws.onmessage = m => console.log(JSON.parse(m.data));
```

## Environment Variables

- `DEMO_DATA_PATH` - Path to demo_data.json file
- `DEMO_PORT` - Port for demo server (default: 8081)
- `VITE_DEMO_API_URL` - Frontend demo API base URL (default: http://localhost:8081)

## Troubleshooting

### Demo server won't start
- Check if port 8081 is available
- Verify demo data files exist
- Check console for error messages

### Frontend can't connect
- Ensure demo server is running
- Check browser console for WebSocket errors
- Verify demo mode is enabled in UI

### No telemetry data
- Check if `demo_data.json` exists and is valid JSON
- Verify track-specific demo files in `public/demo_data/`
- Check server console for data loading messages

## Integration with Real Backend

When demo mode is **disabled**, the frontend automatically:
- Uses real backend API endpoints (via `src/api/pitwall.ts`)
- Connects to real WebSocket (via `src/utils/wsUrl.ts`)
- Uses real health check endpoint

The demo mode toggle in the UI switches between these modes seamlessly.

