# PitWall AI Backend Architecture

## Technology Stack

### Core Framework
- **FastAPI** - Modern Python web framework with async support, automatic OpenAPI docs
- **Python 3.11** - Pre-installed in sandbox environment
- **Uvicorn** - ASGI server for FastAPI

### AI/ML Libraries
- **NumPy** - Numerical computations
- **Pandas** - Data processing and analysis
- **Scikit-learn** (to install) - Machine learning models for tire wear prediction

### Data Processing
- **Pandas** - CSV processing and time-series analysis
- **NumPy** - Fast numerical operations for telemetry calculations

### API Features
- **CORS** - Enable cross-origin requests from frontend
- **WebSocket** (optional) - Real-time data streaming
- **Pydantic** - Data validation and serialization

## Backend Architecture

### Directory Structure
```
pitwall-backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration settings
│   ├── models/                 # Pydantic models for request/response
│   │   ├── __init__.py
│   │   ├── telemetry.py
│   │   ├── analytics.py
│   │   └── track.py
│   ├── services/               # Business logic and AI services
│   │   ├── __init__.py
│   │   ├── telemetry_service.py
│   │   ├── tire_wear_predictor.py
│   │   ├── performance_analyzer.py
│   │   ├── strategy_optimizer.py
│   │   └── gap_analyzer.py
│   ├── api/                    # API route handlers
│   │   ├── __init__.py
│   │   ├── tracks.py
│   │   ├── telemetry.py
│   │   ├── analytics.py
│   │   └── predictions.py
│   ├── data/                   # Data loading and caching
│   │   ├── __init__.py
│   │   ├── data_loader.py
│   │   └── cache.py
│   └── utils/                  # Utility functions
│       ├── __init__.py
│       └── calculations.py
├── data/                       # Race data directory (symlink to /home/ubuntu/race_data)
├── requirements.txt            # Python dependencies
├── README.md                   # Documentation
└── run.sh                      # Startup script
```

## API Endpoints Design

### Track Management
- `GET /api/tracks` - List all tracks with metadata
- `GET /api/tracks/{track_name}` - Get specific track details
- `GET /api/tracks/{track_name}/races` - Get available races for a track

### Telemetry Data
- `GET /api/telemetry/live` - Simulate live telemetry stream (query params: track, race, vehicle, lap)
- `GET /api/telemetry/historical` - Get historical telemetry data
- `GET /api/telemetry/lap/{lap_number}` - Get telemetry for specific lap

### Analytics & AI Features
- `POST /api/analytics/tire-wear` - Calculate tire wear predictions
  - Input: telemetry data (accx, accy, speed, lap)
  - Output: tire wear percentages (FL, FR, RL, RR)
  
- `POST /api/analytics/performance` - Analyze driver performance
  - Input: telemetry data, lap times
  - Output: current lap, best lap, sector times, improvement suggestions
  
- `POST /api/analytics/strategy` - Optimize race strategy
  - Input: current race state, tire wear, fuel level
  - Output: optimal pit window, predicted lap times, strategy recommendations
  
- `GET /api/analytics/gap-analysis` - Calculate gaps to competitors
  - Input: current lap, vehicle positions
  - Output: gap to leader, gap to car ahead/behind, overtaking opportunities

### Predictions
- `POST /api/predictions/finish-position` - Predict race finish position
  - Input: current position, lap, tire wear, pace
  - Output: predicted finish position (e.g., "P3")
  
- `POST /api/predictions/lap-time` - Predict next lap time
  - Input: current telemetry, tire wear, fuel load
  - Output: predicted lap time

### Dashboard Data
- `GET /api/dashboard/live` - Get all live dashboard data in one call
  - Output: Combined tire wear, performance metrics, gap analysis

## AI/ML Models Specification

### 1. Tire Wear Prediction Model

**Algorithm**: Linear Regression or Random Forest Regressor

**Features**:
- Cumulative lateral G-forces (sum of abs(accy_can) per lap)
- Cumulative longitudinal G-forces (sum of abs(accx_can) per lap)
- Average speed per lap
- Number of heavy braking events (pbrake_f > threshold)
- Number of hard cornering events (accy_can > threshold)
- Lap number (tire age)
- Track-specific factor (different tracks wear tires differently)

**Target**: Tire wear percentage (0-100%) for each tire position

**Training Data**: Historical lap data with calculated wear indicators

**Output**: 
```json
{
  "front_left": 78,
  "front_right": 82,
  "rear_left": 71,
  "rear_right": 75,
  "predicted_laps_remaining": 8,
  "pit_window_optimal": [12, 15]
}
```

### 2. Lap Time Prediction Model

**Algorithm**: Gradient Boosting Regressor

**Features**:
- Current tire wear (all 4 tires)
- Fuel load estimate (decreases linearly with laps)
- Average sector times (S1, S2, S3)
- Track temperature (from weather data)
- Driver consistency (std dev of recent lap times)
- Traffic indicator (cars within 2 seconds)

**Target**: Lap time in seconds

**Output**: Predicted lap time with confidence interval

### 3. Performance Analyzer (Rule-Based + Statistical)

**Metrics Calculated**:
- **Current Lap Time**: Real-time calculation from sector times
- **Best Lap**: Minimum lap time from historical data
- **Gap to Leader**: Time difference calculation
- **Sector Performance**: Compare each sector against personal best and field best
- **Consistency Score**: Standard deviation of lap times
- **Improvement Areas**: Identify sectors with most time loss

**Output**:
```json
{
  "current_lap": "2:04.56",
  "best_lap": "2:03.12",
  "gap_to_leader": "+1.24s",
  "predicted_finish": "P3",
  "sector_analysis": {
    "S1": {"time": "45.2", "delta_to_best": "+0.3", "improvement_potential": "medium"},
    "S2": {"time": "42.8", "delta_to_best": "+0.1", "improvement_potential": "low"},
    "S3": {"time": "36.5", "delta_to_best": "+0.8", "improvement_potential": "high"}
  }
}
```

### 4. Strategy Optimizer (Simulation-Based)

**Approach**: Monte Carlo simulation of race scenarios

**Inputs**:
- Current race state (lap, position, tire wear)
- Competitor positions and estimated pace
- Pit stop time loss (fixed, e.g., 25 seconds)
- Tire degradation curve

**Simulation**:
1. Project lap times for remaining laps with current tires
2. Simulate pit stop at different lap windows
3. Project lap times with fresh tires
4. Calculate final race time for each strategy
5. Rank strategies by expected finish position

**Output**:
```json
{
  "recommended_strategy": "pit_lap_15",
  "strategies": [
    {
      "name": "pit_lap_15",
      "expected_finish": "P3",
      "expected_time": "45:32.1",
      "confidence": 0.85
    },
    {
      "name": "pit_lap_12",
      "expected_finish": "P4",
      "expected_time": "45:35.8",
      "confidence": 0.78
    }
  ]
}
```

### 5. Gap Analysis Engine (Real-Time Calculation)

**Calculations**:
- **Gap to Leader**: Cumulative time difference
- **Gap to Car Ahead**: Time difference to next position
- **Gap to Car Behind**: Time difference from previous position
- **Overtaking Opportunity**: Detect when gap < 1.0s and closing rate > 0.1s/lap

**Output**:
```json
{
  "position": 3,
  "gap_to_leader": "+1.24s",
  "gap_to_ahead": "+0.45s",
  "gap_to_behind": "-0.82s",
  "overtaking_opportunity": false,
  "under_pressure": true,
  "closing_rate_ahead": "+0.12s/lap"
}
```

## Data Flow

### Real-Time Simulation Mode
1. Frontend requests live data via `/api/dashboard/live?track=sebring&race=1&vehicle=7&lap=12`
2. Backend loads telemetry data for specified lap from CSV
3. Backend processes telemetry through AI models
4. Backend calculates tire wear, performance metrics, gaps
5. Backend returns aggregated dashboard data
6. Frontend updates UI components

### Historical Analysis Mode
1. Frontend requests historical analysis
2. Backend loads full race data
3. Backend runs batch predictions for all laps
4. Backend returns time-series data for visualization

## Performance Optimization

### Caching Strategy
- Cache processed telemetry data per lap
- Cache track metadata (static data)
- Cache model predictions for identical inputs
- Use in-memory cache (Python dict) for simplicity

### Data Loading
- Load only required laps on demand (not entire 1.8GB file)
- Use Pandas chunking for large files
- Pre-process and save aggregated lap summaries

### Model Optimization
- Pre-train models on startup
- Use lightweight models (avoid deep learning for speed)
- Batch predictions when possible

## Configuration

### Environment Variables
- `DATA_DIR` - Path to race data directory
- `PORT` - API server port (default: 8000)
- `CORS_ORIGINS` - Allowed CORS origins (frontend URL)
- `DEBUG` - Enable debug mode

### Model Parameters
- Tire wear degradation rate: 1.2% per lap (baseline)
- Pit stop time loss: 25 seconds
- Fuel weight effect: 0.03s per kg per lap
- Track temperature effect: 0.01s per degree C

## Deployment

### Local Development
```bash
cd pitwall-backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### API Documentation
- Automatic OpenAPI docs at `/docs`
- ReDoc documentation at `/redoc`

## Integration with Frontend

### Frontend Hooks Expected
Based on the frontend analysis:
- `useTelemetry` hook expects: tire wear data, performance metrics
- `useStrategy` hook expects: strategy recommendations, pit windows

### API Response Format
All responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-11-19T22:00:00Z",
  "meta": {
    "track": "sebring",
    "race": 1,
    "vehicle": 7,
    "lap": 12
  }
}
```

### Error Handling
```json
{
  "success": false,
  "error": {
    "code": "INVALID_LAP",
    "message": "Lap number out of range",
    "details": "Requested lap 30, but race only has 25 laps"
  }
}
```

## Budget Considerations

To stay under 300 Manus credits:
- Use simple, efficient algorithms (avoid complex deep learning)
- Minimize file I/O operations
- Focus on core features that meet judging criteria
- Use pre-installed libraries when possible
- Efficient code structure to minimize iterations
