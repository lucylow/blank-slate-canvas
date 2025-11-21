# Enhanced Telemetry Simulation

## Overview

The telemetry simulation system has been significantly improved to provide a more realistic real-time telemetry experience. The simulator converts TRD (Toyota Racing Development) format telemetry data into the frontend format and streams it through WebSocket connections with realistic timing and multi-vehicle support.

## Key Improvements

### 1. **TRD Format Conversion**
- Converts TRD telemetry samples (key-value pairs) into aggregated telemetry points
- Groups samples by vehicle ID and timestamp to create complete data points
- Maps TRD field names to frontend format (e.g., `accx_can` → `g_force_long`, `ath` → `throttle`)

### 2. **Multi-Vehicle Support**
- Streams telemetry from multiple vehicles simultaneously
- Each vehicle maintains its own independent stream index
- Realistic timing variations between vehicles

### 3. **Realistic Timing**
- 10-20Hz update rate (50-100ms intervals) with natural variation
- Adds ±10% random variation to intervals for realism
- Uses actual timestamps for real-time feel

### 4. **Proper Field Mapping**
The simulator maps TRD telemetry names to frontend format:

| TRD Name | Frontend Field | Description |
|----------|---------------|-------------|
| `speed_kmh`, `Speed` | `speed` | Vehicle speed in km/h |
| `ath` | `throttle` | Throttle position (0-100%) |
| `pbrake_f`, `pbrake_r` | `brake` | Brake pressure (0-100%) |
| `accx_can`, `accx` | `g_force_long` | Longitudinal acceleration (G) |
| `accy_can`, `accy` | `g_force_lat` | Lateral acceleration (G) |
| `gear` | `gear` | Current gear |
| `rpm` | `rpm` | Engine RPM |
| `tire_pressure_fl/fr/rl/rr` | `tire_pressure_*` | Tire pressures |
| `tire_temp_fl/fr/rl/rr` | `tire_temp_*` | Tire temperatures |
| `brake_temp` | `brake_temp` | Brake temperature |

### 5. **Lap and Sector Calculations**
- Properly tracks lap numbers from TRD data
- Calculates sectors (1-3) based on lap distance when available
- Handles lap transitions smoothly

## Usage

### Starting the Demo Server

```bash
# Default configuration
node server/demo-server.js

# Custom port
DEMO_PORT=3000 node server/demo-server.js

# Custom default track
DEFAULT_TRACK=vir node server/demo-server.js
```

### WebSocket Connection

Connect to either endpoint:
- `ws://localhost:8081/ws`
- `ws://localhost:8081/ws/demo`

### WebSocket Commands

**Set playback speed:**
```json
{
  "type": "set_speed",
  "intervalMs": 80  // 50-500ms range
}
```

**Switch track:**
```json
{
  "type": "set_track",
  "trackId": "sebring"
}
```

**Pause/Resume:**
```json
{
  "type": "pause"
}
// or
{
  "type": "resume"
}
```

### REST API Endpoints

**Get available tracks:**
```
GET /api/tracks
```

**Switch active track:**
```
POST /api/set_track/:trackId
```

**Health check:**
```
GET /api/health
```

## Data Flow

1. **Load TRD Data**: Track demo files (`*_demo.json`) are loaded from `public/demo_data/`
2. **Process**: `TelemetrySimulator` converts TRD samples to frontend format
3. **Group**: Telemetry is grouped by vehicle and timestamp
4. **Stream**: WebSocket streams telemetry points with realistic timing
5. **Frontend**: React components receive and display the telemetry

## Architecture

```
TRD Demo Files (*_demo.json)
    ↓
TelemetrySimulator.processTRDTelemetry()
    ↓
Grouped by vehicle + timestamp
    ↓
convertToFrontendFormat()
    ↓
WebSocket Stream (10-20Hz)
    ↓
Frontend Components
```

## Features

- ✅ Real-time streaming at 10-20Hz
- ✅ Multi-vehicle support
- ✅ TRD format conversion
- ✅ Realistic timing variations
- ✅ Proper field mapping
- ✅ Lap and sector tracking
- ✅ Track switching support
- ✅ Backward compatible with legacy format

## Demo Mode

The simulator is designed for hackathon demos and development. It provides:

- Realistic telemetry behavior
- Multiple vehicle streams
- Proper timing characteristics
- TRD-compatible data format

**For Production**: Replace with actual TRD data ingestion pipeline.

## Notes

- The simulator uses the first race from each track by default
- Telemetry streams loop when reaching the end
- All timestamps are normalized to current time for real-time feel
- Original TRD data is preserved in `_raw` field for reference

