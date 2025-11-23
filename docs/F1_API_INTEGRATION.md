# F1 API Integration - Free Public APIs

This document describes the integration of free public Formula 1 APIs that require **no API keys** for benchmarking and strategy comparison with GR Cup racing data.

## Overview

Three free F1 APIs have been integrated into the PitWall A.I. platform:

1. **Ergast F1 API** - Historical F1 data (1950-present)
2. **OpenF1 API** - Real-time and historical telemetry data
3. **F1API.dev** - Alternative F1 data source

All APIs are **completely free** and require **no authentication or API keys**.

## Services

### 1. Ergast F1 Service (`app/services/ergast_service.py`)

The primary source for historical F1 data.

**Base URL:** `http://ergast.com/api/f1/`

**Features:**
- Race results, drivers, constructors, circuits
- Lap times, qualifying results, pit stops
- Championship standings
- Fastest laps

**Example Usage:**
```python
from app.services.ergast_service import ergast_service

# Get current season races
races = await ergast_service.get_current_season_races()

# Get race results
results = await ergast_service.get_race_results(2024, 1)

# Get lap times
lap_times = await ergast_service.get_lap_times(2024, 1)

# Get pit stops
pit_stops = await ergast_service.get_pit_stops(2024, 1)
```

### 2. OpenF1 Service (`app/services/openf1_service.py`)

Open-source F1 API for telemetry and session data.

**Base URL:** `https://api.openf1.org/v1`

**Features:**
- Real-time and historical telemetry (speed, throttle, brake, gear)
- Lap times, position data
- Stint data (tire compounds, pit stops)
- Weather data
- Race control messages

**Note:** Historical data is free, real-time data may require authentication.

**Example Usage:**
```python
from app.services.openf1_service import openf1_service

# Get sessions by date
sessions = await openf1_service.get_sessions_by_date(date(2024, 5, 19))

# Get lap times
lap_times = await openf1_service.get_lap_times(session_key=12345)

# Get car telemetry
telemetry = await openf1_service.get_car_telemetry(session_key=12345, driver_number=44)
```

### 3. F1API.dev Service (`app/services/f1api_service.py`)

Alternative F1 data source.

**Base URL:** `https://api.f1api.dev/v1`

**Features:**
- Drivers, teams, seasons
- Race results, standings
- Circuits

**Example Usage:**
```python
from app.services.f1api_service import f1api_service

# Get drivers
drivers = await f1api_service.get_drivers()

# Get season races
races = await f1api_service.get_season_races(2024)

# Get race results
results = await f1api_service.get_race_results(2024, 1)
```

## API Endpoints

All endpoints are prefixed with `/api/f1`

### Ergast F1 Endpoints

- `GET /api/f1/seasons/current` - Current season race calendar
- `GET /api/f1/seasons/{year}` - All races for a season
- `GET /api/f1/races/{year}/{round}` - Comprehensive race data
- `GET /api/f1/strategies/comparison` - Strategy comparison data
- `GET /api/f1/standings/drivers` - Driver championship standings
- `GET /api/f1/standings/constructors` - Constructor standings
- `GET /api/f1/circuits` - All F1 circuits
- `GET /api/f1/circuits/{circuit_id}` - Circuit information

### OpenF1 Endpoints

- `GET /api/f1/telemetry/sessions` - Get F1 sessions
- `GET /api/f1/telemetry/laps/{session_key}` - Lap time telemetry
- `GET /api/f1/telemetry/car_data/{session_key}` - Car telemetry data
- `GET /api/f1/telemetry/stints/{session_key}` - Stint data (tires, pit stops)

### Alternative Endpoints (F1API.dev)

- `GET /api/f1/alternative/drivers` - F1 drivers (alternative source)
- `GET /api/f1/alternative/races/{year}` - F1 races (alternative source)

## Frontend Integration

A TypeScript API client is available at `src/api/f1Benchmarking.ts`

**Example Usage:**
```typescript
import { 
  getCurrentF1Season, 
  getF1Race, 
  getF1StrategyComparison 
} from '@/api/f1Benchmarking';

// Get current season
const season = await getCurrentF1Season();

// Get race data
const race = await getF1Race(2024, 1, {
  includeQualifying: true,
  includeLaps: true,
  includePitstops: true
});

// Get strategy comparison
const comparison = await getF1StrategyComparison(2024, 1, 'pit_stops');
```

## Use Cases

### 1. Strategy Benchmarking

Compare GR Cup pit stop strategies with F1 patterns:

```python
# Get F1 pit stop data for comparison
pit_stops = await ergast_service.get_pit_stops(2024, 1)

# Compare with GR Cup data
# Analyze pit stop timing, tire degradation patterns
```

### 2. Historical Analysis

Analyze tire degradation patterns across different eras:

```python
# Get lap times for tire degradation analysis
lap_times = await ergast_service.get_lap_times(2024, 1)

# Compare lap time drop-off with GR Cup data
```

### 3. Track Comparisons

Compare similar tracks between F1 and GR Cup:

```python
# Get circuit information
circuit = await ergast_service.get_circuit_info("circuit_of_the_americas")

# Compare with GR Cup COTA data
```

### 4. Driver Performance Analysis

Benchmark driver patterns against F1 drivers:

```python
# Get driver standings and performance data
standings = await ergast_service.get_driver_standings(2024)

# Compare consistency, pace patterns
```

## Dependencies

The implementation requires `httpx` for async HTTP requests:

```bash
pip install httpx>=0.24.0
```

This is already added to `requirements.txt`.

## Rate Limits

All APIs have generous rate limits for free usage:

- **Ergast F1**: ~200 requests per hour (no official limit, but be respectful)
- **OpenF1**: Free tier for historical data
- **F1API.dev**: No specific rate limit mentioned

Best practice: Cache responses when possible to minimize API calls.

## Error Handling

All services include comprehensive error handling:

- Network timeouts (10 seconds)
- HTTP error status codes
- Logging for debugging
- Graceful fallbacks

## Example: Strategy Comparison Endpoint

```python
# GET /api/f1/strategies/comparison?year=2024&round=1&comparison_type=pit_stops

{
  "success": true,
  "comparison_type": "pit_stops",
  "source": "Ergast F1 API",
  "race": { ... },
  "pit_stops": [ ... ],
  "use_case": "strategy_benchmarking"
}
```

## Testing

Test the endpoints locally:

```bash
# Start the backend
uvicorn app.main:app --reload

# Test current season endpoint
curl http://localhost:8000/api/f1/seasons/current

# Test race endpoint
curl http://localhost:8000/api/f1/races/2024/1

# Test strategy comparison
curl "http://localhost:8000/api/f1/strategies/comparison?year=2024&round=1&comparison_type=pit_stops"
```

## Future Enhancements

Potential improvements:

1. **Caching Layer**: Add Redis caching for frequently accessed data
2. **GR Cup Comparison**: Automatically compare F1 patterns with GR Cup data
3. **Visualization**: Create charts comparing F1 vs GR Cup strategies
4. **Predictive Models**: Use F1 patterns to inform GR Cup predictions
5. **Real-time Updates**: Integrate OpenF1 real-time data during F1 races

## References

- [Ergast F1 API Documentation](http://ergast.com/mrd/)
- [OpenF1 API Documentation](https://github.com/br-g/openf1)
- [F1API.dev Documentation](https://f1api.dev/docs)

## Notes

- All APIs are free and require no API keys
- Data is for benchmarking and analysis purposes
- Respect rate limits and API terms of service
- Toyota GR Cup data remains the primary data source

