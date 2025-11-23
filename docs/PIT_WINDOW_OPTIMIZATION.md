# Pit Window Optimization - Integration Guide

## Overview

The Pit Window Optimization feature provides Monte Carlo simulation of multiple pit stop strategies with traffic-aware recommendations. It includes:

1. **Backend API** (`src/backend/replay_api.py`) - FastAPI endpoints for CSV upload and pit simulation
2. **Frontend Component** (`src/components/PitConsole.tsx`) - React component for interactive pit window analysis
3. **Page Route** (`/pit-window`) - Full page integration

## Quick Start

### 1. Start the Backend API

The replay API can be run as a standalone server:

```bash
# From project root
uvicorn src.backend.replay_api:app --reload --port 8000
```

Or integrate it with the existing FastAPI app in `app/main.py` by mounting the router.

### 2. Access the Frontend

Navigate to: `http://localhost:5173/pit-window` (or your dev server URL)

### 3. Upload a CSV Replay

1. Click "Upload Replay CSV"
2. Select a race CSV file
3. The system will parse and display metadata (cars, laps)

### 4. Run Simulations

1. Select a car from the dropdown
2. Optionally select a lap number
3. Click "Simulate All Scenarios" to see:
   - **Box Now** - Pit stop at current lap
   - **+1 Lap** - Delay pit by 1 lap
   - **+2 Laps** - Delay pit by 2 laps

### 5. View Results

Results show:
- **Naive Simulation** - Deterministic calculation based on pit time costs
- **Model Prediction** - ML-based prediction (if model is loaded)

## CSV Format

The API accepts flexible CSV formats. It automatically detects:

- **Car identifier**: `number`, `car`, `car_number`, `vehicle`, `vehicle_number`
- **Lap number**: Any column with "lap" in the name
- **Total time**: `total_time`, `race_time`, or similar
- **Lap time**: `lap_time`, `lap_seconds`, or similar

### Example CSV Structure

```csv
vehicle_number,lap,total_time,lap_time,position
86,1,120.5,120.5,1
86,2,240.8,120.3,1
86,3,361.2,120.4,1
13,1,121.2,121.2,2
13,2,242.1,120.9,2
```

## Model Integration

### Place Your Model

1. Train a model that predicts final total race time
2. Save it as: `models/total_time_predictor.joblib`
3. Restart the API server

### Model Contract

**Input Features:**
- `baseline_time`: Current total race time (seconds)
- `avg_lap_time`: Average lap time (seconds)
- `laps_completed`: Number of laps completed
- `laps_remaining`: Number of laps remaining
- `pit_at_lap`: Lap number when pit occurs (0 if no pit)
- `pit_time_cost`: Time cost of pit stop (seconds)
- `outlap_penalty`: Penalty for outlap (seconds)

**Output:**
- Array of predicted final total times (one per car)

See `models/README.md` for detailed model contract.

## API Endpoints

### POST `/api/replay`
Upload a CSV file.

**Request:** `multipart/form-data` with `file` field

**Response:**
```json
{
  "replay_id": "abc123...",
  "meta": {
    "replay_id": "abc123...",
    "file_name": "race.csv",
    "cars": ["86", "13"],
    "laps": [1, 2, 3, ...]
  }
}
```

### POST `/api/replay/{replay_id}/simulate_pit`
Run pit stop simulation.

**Request Body:**
```json
{
  "car": "86",
  "lap": 12,
  "action": "simulate_all"
}
```

**Response:**
```json
{
  "sim_id": "sim123...",
  "naive": {
    "now": {
      "ordered": [{"car": "86", "pred_time": 1234.5}, ...],
      "target_car": "86",
      "baseline_pos": 3,
      "sim_pos": 2
    },
    "+1": { ... },
    "+2": { ... }
  },
  "model": {
    "now": { ... }  // Only if model loaded
  }
}
```

### GET `/api/replay/{replay_id}`
Get replay metadata.

### GET `/api/replay/{replay_id}/simulations/{sim_id}`
Retrieve saved simulation.

### POST `/api/replay/{replay_id}/predict_pit_window`
Get recommended pit lap.

**Request Body:**
```json
{
  "car": "86",
  "current_lap": 12,
  "window": 5
}
```

## Integration with Existing App

### Option 1: Standalone Server

Run the replay API on a separate port (e.g., 8000) and configure the frontend to use it:

```typescript
// In .env or vite.config.ts
VITE_BACKEND_URL=http://localhost:8000
```

### Option 2: Mount in Main App

Add to `app/main.py`:

```python
from src.backend.replay_api import app as replay_app

# Mount the replay API
app.mount("/replay-api", replay_app)
```

Then update frontend API base URL to use `/replay-api`.

### Option 3: Merge Routes

Copy endpoints from `src/backend/replay_api.py` into `app/routes/replay.py` to merge with existing replay functionality.

## Features

### Monte Carlo Simulation

The system compares multiple pit stop strategies:
- **Box Now**: Immediate pit stop
- **Delay 1 Lap**: Pit on next lap
- **Delay 2 Laps**: Pit in 2 laps

### Traffic-Aware Recommendations

When a model is loaded, predictions account for:
- Tire wear progression
- Lap time degradation
- Competitor positions
- Track conditions

### Safety Confirmations

Critical actions (Box Now) require confirmation to prevent accidental pit calls.

## Storage

Replay data is stored in:
- `replays/{replay_id}/original_upload.csv` - Original CSV
- `replays/{replay_id}/parsed.parquet` - Parsed data (or CSV fallback)
- `replays/{replay_id}/meta.json` - Metadata
- `replays/{replay_id}/simulations/{sim_id}.json` - Simulation results

## Development

### Dependencies

All required dependencies are in `requirements.txt`:
- `fastapi`, `uvicorn` - API framework
- `pandas`, `numpy` - Data processing
- `joblib` - Model loading (optional)
- `python-multipart` - File uploads

### Testing

1. Upload a sample CSV
2. Run simulations for different scenarios
3. Compare naive vs model predictions
4. Verify pit window recommendations

## Next Steps

1. **Train a Model**: Create `models/total_time_predictor.joblib` with your race data
2. **Add Agent Models**: Place ensemble models in `models/agents/`
3. **Enhance UI**: Add visualizations for scenario comparisons
4. **Add WebSocket**: Stream live replay updates
5. **Add Authentication**: Secure endpoints for production

## Troubleshooting

### Model Not Loading

- Check `models/total_time_predictor.joblib` exists
- Verify model contract matches expected format
- Check server logs for error messages

### CSV Parsing Errors

- Ensure CSV has car and lap columns
- Check file encoding (UTF-8 or Latin-1)
- Verify file size < 30 MB

### CORS Issues

- Backend allows all origins by default
- Restrict in production: update `allow_origins` in `replay_api.py`

## References

- Backend API: `src/backend/replay_api.py`
- Frontend Component: `src/components/PitConsole.tsx`
- Page Route: `src/pages/PitWindowOptimization.tsx`
- Model Documentation: `models/README.md`


