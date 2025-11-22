# PitWall AI Backend

**Real-Time Racing Analytics & AI-Powered Strategy Optimization for Toyota GR Cup**

This backend provides AI-powered analytics for the PitWall AI racing dashboard, built for the "Hack the Track" hackathon presented by Toyota GR.

## Features

### 🤖 AI-Powered Analytics

1. **Tire Wear Prediction Model**
   - Analyzes telemetry data (lateral/longitudinal G-forces, speed, braking events)
   - Predicts tire wear percentage for all 4 tires
   - Calculates optimal pit stop windows
   - 95% accuracy target

2. **Performance Analysis**
   - Real-time lap time tracking
   - Best lap identification
   - Gap to leader calculation
   - Finish position prediction

3. **Strategy Optimization**
   - Monte Carlo simulation of pit stop strategies
   - Recommends optimal pit windows
   - Accounts for tire degradation and race position

4. **Gap Analysis Engine**
   - Real-time competitor gap calculations
   - Overtaking opportunity detection
   - Closing rate analysis

### 📊 Data Processing

- Processes real Toyota GR Cup race telemetry data
- Supports all 7 GR Cup tracks
- Handles high-frequency telemetry (9 channels, ~50Hz)
- Efficient chunk-based loading for large datasets (1.8GB per race)

## Architecture

### Technology Stack
- **FastAPI** - Modern Python web framework
- **Pandas** - Data processing
- **NumPy** - Numerical computations
- **Scikit-learn** - Machine learning models
- **Uvicorn** - ASGI server

### Project Structure
```
pitwall-backend/
├── app/
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configuration
│   ├── models/                 # Pydantic data models
│   │   ├── telemetry.py
│   │   ├── analytics.py
│   │   └── track.py
│   ├── services/               # AI/ML services
│   │   ├── tire_wear_predictor.py
│   │   ├── performance_analyzer.py
│   │   └── strategy_optimizer.py
│   ├── data/                   # Data loading
│   │   └── data_loader.py
│   └── utils/                  # Utility functions
│       └── calculations.py
├── requirements.txt
└── README.md
```

## Setup

### Prerequisites
- Python 3.11+
- Race data extracted to `/home/ubuntu/race_data/`

### Installation

```bash
cd /home/ubuntu/pitwall-backend

# Install dependencies
pip3 install -r requirements.txt

# Run the server
python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Main Dashboard Endpoint

#### `GET /api/dashboard/live`
Get complete live dashboard data with all AI analytics.

**Query Parameters:**
- `track` (string): Track identifier (e.g., "sebring")
- `race` (int): Race number (1 or 2)
- `vehicle` (int): Vehicle number
- `lap` (int): Current lap number

**Example:**
```bash
curl "http://localhost:8000/api/dashboard/live?track=sebring&race=1&vehicle=7&lap=12"
```

**Response:**
```json
{
  "track": "Sebring International Raceway",
  "race": 1,
  "vehicle_number": 7,
  "lap": 12,
  "total_laps": 25,
  "tire_wear": {
    "front_left": 78.0,
    "front_right": 82.0,
    "rear_left": 71.0,
    "rear_right": 75.0,
    "predicted_laps_remaining": 8,
    "pit_window_optimal": [15, 17]
  },
  "performance": {
    "current_lap": "2:04.560",
    "best_lap": "2:03.120",
    "gap_to_leader": "+1.240s",
    "predicted_finish": "P3",
    "position": 3,
    "lap_number": 12,
    "total_laps": 25
  },
  "gap_analysis": {
    "position": 3,
    "gap_to_leader": "+1.240s",
    "gap_to_ahead": "+0.450s",
    "gap_to_behind": "-0.820s",
    "overtaking_opportunity": false,
    "under_pressure": true,
    "closing_rate_ahead": "+0.054s/lap"
  },
  "timestamp": "2025-11-19T22:00:00Z",
  "live_data": true
}
```

### Track Endpoints

#### `GET /api/tracks`
Get list of all available tracks.

#### `GET /api/tracks/{track_id}`
Get specific track details.

#### `GET /api/tracks/{track_id}/races/{race_number}`
Get race information including available vehicles and total laps.

### Individual Analytics Endpoints

#### `POST /api/analytics/tire-wear`
Predict tire wear for a specific lap.

#### `POST /api/analytics/performance`
Analyze driver performance metrics.

#### `POST /api/analytics/strategy`
Optimize pit stop strategy.

#### `GET /api/analytics/gap-analysis`
Calculate gaps to competitors.

## Supported Tracks

1. **Sebring International Raceway** - Sebring, Florida (3.74 miles, 17 turns)
2. **Circuit of the Americas** - Austin, Texas (3.427 miles, 20 turns)
3. **Road America** - Elkhart Lake, Wisconsin (4.048 miles, 14 turns)
4. **Sonoma Raceway** - Sonoma, California (2.52 miles, 12 turns)
5. **Barber Motorsports Park** - Birmingham, Alabama (2.38 miles, 17 turns)
6. **Virginia International Raceway** - Alton, Virginia (3.27 miles, 17 turns)
7. **Indianapolis Motor Speedway** - Indianapolis, Indiana (2.439 miles, 14 turns)

## AI Model Details

### Tire Wear Prediction

**Input Features:**
- Cumulative lateral G-forces (cornering stress)
- Cumulative longitudinal G-forces (braking/acceleration stress)
- Average speed per lap
- Heavy braking events count
- Hard cornering events count
- Lap number (tire age)

**Algorithm:** Feature-based regression with physics-informed rules

**Output:** Tire wear percentage (0-100%) for each tire position

### Performance Analysis

**Metrics Calculated:**
- Current lap time vs. best lap
- Gap to race leader (cumulative time difference)
- Current race position
- Predicted finish position

**Algorithm:** Statistical analysis with position tracking

### Strategy Optimization

**Approach:** Monte Carlo simulation

**Simulations:**
1. No pit stop (if tires can last)
2. Early pit (laps 2-3)
3. Optimal pit (based on tire wear model)
4. Late pit (push tires longer)

**Factors Considered:**
- Tire degradation curve
- Pit stop time loss (25 seconds)
- Fuel weight effect
- Competitor positions

## Configuration

Edit `app/config.py` to customize:

- **Track configurations** - Add/modify track data paths
- **Model parameters** - Tune tire wear factors, pit stop times
- **CORS origins** - Configure allowed frontend origins
- **Data directory** - Set path to race data

## Integration with Frontend

This backend is designed to work with the PitWall AI frontend at:
- **Production**: https://void-form-forge.lovable.app/
- **GitHub**: https://github.com/lucylow/blank-slate-canvas

### Frontend Integration Points

The frontend expects these data structures:

**TelemetryProvider** context:
- Tire wear data (FL, FR, RL, RR percentages)
- Performance metrics (current lap, best lap, gaps)

**StrategyProvider** context:
- Strategy recommendations
- Pit window calculations

### CORS Configuration

The backend allows requests from:
- `http://localhost:3000` (local development)
- `http://localhost:5173` (Vite dev server)
- `https://void-form-forge.lovable.app` (production)

## Hackathon Submission

### Category
**Real-Time Analytics** - Design a tool that simulates real-time decision-making for a race engineer.

### Judging Criteria Alignment

1. **Application of TRD Datasets** ✅
   - Uses all 9 telemetry channels (speed, gear, RPM, throttle, brake, steering, accel_x, accel_y)
   - Processes real race data from Toyota GR Cup
   - Unique combination of telemetry for tire wear prediction

2. **Design** ✅
   - Well-structured FastAPI backend
   - Clean separation of concerns (models, services, API)
   - Balanced with frontend dashboard

3. **Potential Impact** ✅
   - Directly addresses sponsor goal: "real-time analytics and strategy tool for GR Cup"
   - Helps teams make data-driven pit stop decisions
   - Improves driver performance through actionable insights

4. **Quality of Idea** ✅
   - Novel tire wear prediction using G-force telemetry
   - Real-time strategy optimization
   - Production-ready architecture

## Development

### Running Tests

```bash
# Test tire wear prediction
curl -X POST "http://localhost:8000/api/analytics/tire-wear" \
  -H "Content-Type: application/json" \
  -d '{"track": "sebring", "race": 1, "vehicle_number": 7, "lap": 12}'

# Test dashboard endpoint
curl "http://localhost:8000/api/dashboard/live?track=sebring&race=1&vehicle=7&lap=12"
```

### Viewing API Documentation

Open http://localhost:8000/docs in your browser for interactive API documentation.

## License

Built for the "Hack the Track" hackathon presented by Toyota GR.

## Contact

For questions about this backend implementation, please refer to the hackathon submission.
