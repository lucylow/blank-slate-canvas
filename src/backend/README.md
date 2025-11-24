# Replay API Backend

FastAPI backend for CSV replay upload and pit window simulation with Monte Carlo analysis.

## Features

- **CSV Upload**: Upload race replay data in CSV format
- **Pit Simulation**: Simulate pit stop scenarios (Now, +1 lap, +2 laps)
- **Model Integration**: Optional ML model integration for predictive simulations
- **Monte Carlo**: Compare multiple strategies with traffic-aware recommendations

## Quick Start

### Installation

Dependencies are already in `requirements.txt`. Install with:

```bash
pip install -r requirements.txt
```

### Running the Server

```bash
# From project root
uvicorn src.backend.replay_api:app --reload --port 8000
```

Or use the existing FastAPI app in `app/main.py` which can include this router.

### API Endpoints

#### POST `/api/replay`
Upload a CSV file for replay analysis.

**Request:**
- `multipart/form-data` with `file` field containing CSV

**Response:**
```json
{
  "replay_id": "abc123...",
  "meta": {
    "replay_id": "abc123...",
    "file_name": "race_data.csv",
    "cars": ["86", "13", "22"],
    "laps": [1, 2, 3, ...],
    "car_count": 3,
    "lap_count": 50
  }
}
```

#### GET `/api/replay/{replay_id}`
Get replay metadata.

#### POST `/api/replay/{replay_id}/simulate_pit`
Run pit stop simulation.

**Request Body:**
```json
{
  "car": "86",
  "lap": 12,
  "action": "simulate_all"  // or "box_now", "delay_1", "delay_2"
}
```

**Response:**
```json
{
  "sim_id": "sim123...",
  "naive": {
    "now": { "ordered": [...], "target_car": "86", "baseline_pos": 3, "sim_pos": 2 },
    "+1": { ... },
    "+2": { ... }
  },
  "model": {
    "now": { ... },  // Only present if model is loaded
    ...
  }
}
```

#### GET `/api/replay/{replay_id}/simulations/{sim_id}`
Retrieve a saved simulation result.

#### POST `/api/replay/{replay_id}/predict_pit_window`
Get recommended pit lap within a window.

**Request Body:**
```json
{
  "car": "86",
  "current_lap": 12,
  "window": 5
}
```

## Model Integration

Place your trained model at:
- `models/total_time_predictor.joblib` (main model)
- `models/agents/*.joblib` (optional agent ensemble)

See `models/README.md` for model contract details.

## CSV Format

The API accepts CSV files with flexible column naming. It automatically detects:
- Car identifier: `number`, `car`, `car_number`, `vehicle`, `vehicle_number`
- Lap number: any column with "lap" in the name
- Total time: `total_time`, `race_time`, or similar
- Lap time: `lap_time`, `lap_seconds`, or similar

## Storage

Replay data is stored in:
- `replays/{replay_id}/original_upload.csv` - Original CSV
- `replays/{replay_id}/parsed.parquet` or `parsed.csv` - Parsed data
- `replays/{replay_id}/meta.json` - Metadata
- `replays/{replay_id}/simulations/{sim_id}.json` - Simulation results

## Integration with Main App

To integrate with the existing FastAPI app (`app/main.py`), you can:

1. Import the router:
```python
from src.backend.replay_api import app as replay_app
```

2. Mount it:
```python
app.mount("/replay-api", replay_app)
```

Or copy the endpoints into `app/routes/replay.py` to merge with existing replay functionality.

## CORS

The API is configured with CORS middleware allowing all origins. **Restrict this in production.**

## Error Handling

- File size limit: 30 MB
- CSV parsing errors return 400 with details
- Missing replay returns 404
- Model errors are logged but don't fail the request (falls back to naive)

## Development

The API uses:
- FastAPI for HTTP endpoints
- Pandas for CSV parsing
- Joblib for model loading (optional)
- NumPy for calculations

See `src/backend/replay_api.py` for full implementation.



