# Demo Server

FastAPI demo server for interactive integration with 7-track mock data.

## Setup

1. Install dependencies:
```bash
pip install fastapi uvicorn websockets aiofiles
```

2. Ensure demo data files are in one of these locations:
   - `public/demo_data/*_demo.json` (e.g., `sebring_demo.json`, `road_america_demo.json`)
   - `demo_data/*_demo.json`
   - `demo_data.json` (single bundle file)

## Running

### Option 1: Direct Python
```bash
python dev/demo_server.py
```

### Option 2: Using uvicorn directly
```bash
uvicorn dev.demo_server:app --host 0.0.0.0 --port 8000 --reload
```

The server will start on `http://localhost:8000`

## Endpoints

- `GET /demo/tracks` - List available demo tracks
- `GET /demo/track/{track_id}` - Get demo data for a specific track
- `GET /api/insights/{insight_id}` - Stub endpoint for insight details
- `WS /ws/agents` - WebSocket endpoint for streaming agent messages

## WebSocket Protocol

To start demo playback, connect to `/ws/agents` and send:
```json
{
  "cmd": "start_demo",
  "track_id": "sebring"
}
```

The server will stream:
- `insight_update` - Simulated insight messages derived from demo telemetry
- `eda_result` - EDA cluster summaries
- `agent_status` - Agent health status updates

## Integration with Frontend

The frontend `DemoSandbox` component (`/demo` route) automatically:
1. Fetches available tracks from `/demo/tracks`
2. Connects to WebSocket at `/ws/agents`
3. Displays incoming insights in real-time
4. Allows starting/stopping demo playback



