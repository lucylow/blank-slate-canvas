# Car & Racing Data APIs Integration Guide

This document provides comprehensive information about all Car & Racing Data APIs integrated into the PitWall AI platform.

## Overview

The platform integrates several external APIs to enhance racing analytics:

1. **Ergast Formula 1 API** - Free historical F1 data for benchmarking
2. **F1API.dev** - Alternative F1 data source
3. **OpenF1 API** - Real-time and historical F1 telemetry
4. **Google Maps Platform APIs** - Elevation, geocoding, and location services
5. **Race Control API** - Placeholder for Toyota GR Cup official timing (when available)

## 1. Ergast Formula 1 API (Free)

**Status:** ✅ Fully Integrated

### Overview
- **Base URL:** `http://ergast.com/api/f1`
- **Authentication:** None required (completely free)
- **Rate Limit:** ~4 requests/second recommended (no official limit)
- **Documentation:** http://ergast.com/mrd/

### Service Implementation
- **File:** `app/services/ergast_service.py`
- **Routes:** `app/routes/f1_benchmarking.py`

### Available Features
- Race results and race calendar
- Lap times and sector times
- Qualifying results
- Pit stop data
- Driver and constructor standings
- Circuit information
- Fastest laps

### Example Usage

```python
from app.services.ergast_service import ergast_service

# Get current season races
races = await ergast_service.get_current_season_races()

# Get race results with pit stops
race_results = await ergast_service.get_race_results(2024, 1)
pit_stops = await ergast_service.get_pit_stops(2024, 1)

# Get lap times for strategy analysis
lap_times = await ergast_service.get_lap_times(2024, 1)

# Get circuit information
circuit = await ergast_service.get_circuit_info("circuit_of_the_americas")
```

### API Endpoints

All endpoints are prefixed with `/api/f1`:

- `GET /api/f1/seasons/current` - Current season race calendar
- `GET /api/f1/seasons/{year}` - All races for a season
- `GET /api/f1/races/{year}/{round}` - Comprehensive race data
- `GET /api/f1/strategies/comparison` - Strategy comparison data
- `GET /api/f1/standings/drivers` - Driver championship standings
- `GET /api/f1/standings/constructors` - Constructor standings
- `GET /api/f1/circuits` - All F1 circuits
- `GET /api/f1/circuits/{circuit_id}` - Circuit information

### Use Cases
- **Strategy Benchmarking:** Compare GR Cup pit stop strategies with F1 patterns
- **Historical Analysis:** Analyze tire degradation patterns across different eras
- **Track Comparisons:** Compare similar tracks between F1 and GR Cup
- **Performance Patterns:** Benchmark driver consistency against F1 data

---

## 2. F1API.dev (Alternative Source)

**Status:** ✅ Fully Integrated

### Overview
- **Base URL:** `https://api.f1api.dev/v1`
- **Authentication:** None required (free tier)
- **Documentation:** https://f1api.dev/docs

### Service Implementation
- **File:** `app/services/f1api_service.py`
- **Routes:** `app/routes/f1_benchmarking.py` (alternative endpoints)

### Available Features
- Drivers and teams
- Seasons and race results
- Championship standings
- Circuits

### Example Usage

```python
from app.services.f1api_service import f1api_service

# Get drivers
drivers = await f1api_service.get_drivers()

# Get season races
races = await f1api_service.get_season_races(2024)

# Get race results
results = await f1api_service.get_race_results(2024, 1)
```

### API Endpoints

- `GET /api/f1/alternative/drivers` - F1 drivers (alternative source)
- `GET /api/f1/alternative/races/{year}` - F1 races (alternative source)

---

## 3. OpenF1 API

**Status:** ✅ Fully Integrated

### Overview
- **Base URL:** `https://api.openf1.org/v1`
- **Authentication:** None required for historical data
- **Documentation:** https://github.com/br-g/openf1

### Service Implementation
- **File:** `app/services/openf1_service.py`
- **Routes:** `app/routes/f1_benchmarking.py`

### Available Features
- Real-time and historical telemetry (speed, throttle, brake, gear)
- Lap times and position data
- Stint data (tire compounds, pit stops)
- Weather data
- Race control messages

### Example Usage

```python
from app.services.openf1_service import openf1_service

# Get sessions by date
sessions = await openf1_service.get_sessions_by_date(date(2024, 5, 19))

# Get lap times
lap_times = await openf1_service.get_lap_times(session_key=12345)

# Get car telemetry
telemetry = await openf1_service.get_car_telemetry(session_key=12345, driver_number=44)
```

### API Endpoints

- `GET /api/f1/telemetry/sessions` - Get F1 sessions
- `GET /api/f1/telemetry/laps/{session_key}` - Lap time telemetry
- `GET /api/f1/telemetry/car_data/{session_key}` - Car telemetry data
- `GET /api/f1/telemetry/stints/{session_key}` - Stint data (tires, pit stops)

---

## 4. Google Maps Platform APIs

**Status:** ✅ Fully Integrated

### Overview
- **Base URL:** `https://maps.googleapis.com/maps/api`
- **Authentication:** API key required
- **Pricing:** Pay-per-use with $200 free credit/month
- **Documentation:** https://developers.google.com/maps/documentation

### Service Implementation
- **File:** `app/services/google_maps_service.py`
- **Configuration:** `app/config.py`

### Available Features

#### a) Elevation API
- Track elevation profiles for performance analysis
- **Pricing:** $5 per 1,000 requests (free tier: $200 credit/month ≈ 40,000 requests)
- **Use Cases:**
  - Analyze how elevation affects lap times
  - Track temperature variations with elevation
  - Performance optimization based on elevation profile

#### b) Geocoding API
- Convert track addresses to coordinates
- Reverse geocode coordinates to addresses
- **Pricing:** $5 per 1,000 requests (free tier: $200 credit/month ≈ 40,000 requests)
- **Use Cases:**
  - Enhance track metadata with coordinates
  - Find track locations automatically

#### c) Places API
- Find nearby weather stations and facilities
- Search for points of interest near tracks
- **Pricing:** Varies by service (Places Details: $17 per 1,000 requests)
- **Use Cases:**
  - Find nearby weather stations for track conditions
  - Locate track amenities and facilities

#### d) Roads API
- Snap track coordinates to roads
- Get speed limits and road data
- **Pricing:** $10 per 1,000 requests
- **Use Cases:**
  - Validate track coordinates
  - Analyze road surface conditions

### Setup

#### 1. Get API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable required APIs:
   - **Elevation API**
   - **Geocoding API**
   - **Places API** (optional)
   - **Roads API** (optional)
4. Create credentials:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > API Key**
   - Restrict the key to the APIs you're using (recommended)
   - Copy your API key

#### 2. Configure API Key

**Option 1: Environment Variable (Development)**
```bash
export GOOGLE_MAPS_API_KEY="your-api-key-here"
```

**Option 2: Lovable Cloud Secrets (Production)**
1. Go to your Lovable Cloud project settings
2. Navigate to **Secrets**
3. Add secret:
   - Name: `GOOGLE_MAPS_API_KEY`
   - Value: Your API key

### Example Usage

```python
from app.services.google_maps_service import get_google_maps_service

google_maps = get_google_maps_service()

if google_maps and google_maps.is_configured():
    # Get elevation profile for track coordinates
    coordinates = [(27.4547, -80.3478), (27.4550, -80.3475), ...]
    elevation_profile = await google_maps.get_elevation_profile(coordinates)
    
    # Geocode track address
    location = await google_maps.geocode_address("Sebring International Raceway")
    
    # Find nearby weather stations
    weather_stations = await google_maps.find_nearby_weather_stations(
        lat=27.4547, 
        lon=-80.3478,
        radius=10000  # 10km
    )
    
    # Snap coordinates to roads
    snapped_points = await google_maps.snap_to_roads(coordinates)
```

### Integration with Map Service

The `MapService` can optionally use Google Maps for elevation data:

```python
from app.services.map_service import map_service

# Get track geometry with Google Maps elevation
geometry = await map_service.enhance_with_google_elevation("sebring")
```

### Cost Optimization

- **Caching:** Elevation data is cached for 24 hours (rarely changes)
- **Batch Requests:** Multiple points in single API call
- **Sampling:** Reduce API calls by sampling elevation points
- **Fallback:** Uses mock elevation data if API key not configured

### Cost Estimates

For typical usage:
- **Elevation API:** ~$0-50/month (within free tier for moderate use)
- **Geocoding API:** ~$0-20/month (one-time lookups)
- **Places API:** ~$0-30/month (optional, as needed)

**Total Estimated Cost:** $0-100/month (mostly within free tier)

---

## 5. Race Control API (Toyota GR Cup)

**Status:** ⚠️ Placeholder (Not Yet Available)

### Overview
- **Current Status:** No publicly documented official API found
- **Service:** `app/services/race_control_service.py`
- **Note:** Placeholder implementation ready for future integration

### Potential Features (When Available)

- Real-time race timing data
- Live sector times
- Position changes
- Lap-by-lap analysis
- Real-time gaps between drivers
- Safety car periods
- Flag status (green, yellow, red, etc.)

### Integration Approach

**When API becomes available:**

1. Contact Toyota Gazoo Racing North America directly
2. Check official GR Cup timing partners (Race Monitor, MyLaps, etc.)
3. Look for partner APIs that may provide GR Cup data

**Configuration:**

Once API access is obtained, configure via environment variables:

```bash
export RACE_CONTROL_API_URL="https://api.example.com/gr-cup"
export RACE_CONTROL_API_KEY="your-api-key"
```

Or in Lovable Cloud secrets:
- `RACE_CONTROL_API_URL`
- `RACE_CONTROL_API_KEY`

### Example Usage (Future)

```python
from app.services.race_control_service import race_control_service

if race_control_service.is_configured():
    # Get live timing data
    live_timing = await race_control_service.get_live_timing(session_id="race_123")
    
    # Get sector times
    sector_times = await race_control_service.get_sector_times(
        session_id="race_123",
        driver_number=7
    )
    
    # Get position changes
    position_changes = await race_control_service.get_position_changes(session_id="race_123")
```

### Alternative Options (If Available)

- **OpenF1 API:** Real-time F1 data (paid for real-time, free for historical)
- **Motorsportsinfo API:** Multi-series data (F1, F2, F3, Formula E)
- **Sportbex Motorsport API:** Live race data for multiple series (custom pricing)

---

## Configuration Summary

All API configurations are in `app/config.py`:

```python
# External API Configuration

# Ergast F1 API (Free, no API key needed)
ERGAST_API_URL = "http://ergast.com/api/f1"

# Google Maps API Configuration
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
GOOGLE_MAPS_CACHE_TTL = 86400  # 24 hours for elevation data
GOOGLE_MAPS_ENABLED = bool(GOOGLE_MAPS_API_KEY)

# Race Control API (Toyota GR Cup - when available)
RACE_CONTROL_API_URL = os.getenv("RACE_CONTROL_API_URL", "")
RACE_CONTROL_API_KEY = os.getenv("RACE_CONTROL_API_KEY", "")
RACE_CONTROL_ENABLED = bool(RACE_CONTROL_API_URL and RACE_CONTROL_API_KEY)
```

## Service Architecture

All services follow a consistent pattern:

1. **Service Class:** Implements API-specific methods
2. **Global Instance:** Singleton pattern for service access
3. **Error Handling:** Comprehensive error handling with logging
4. **Graceful Degradation:** Fallbacks when APIs unavailable
5. **Caching:** Appropriate caching for expensive operations

## Cost Summary

| API | Cost | Free Tier |
|-----|------|-----------|
| Ergast F1 | Free | Unlimited |
| F1API.dev | Free | Unlimited |
| OpenF1 | Free (historical) | Unlimited |
| Google Maps | Pay-per-use | $200 credit/month |
| Race Control | TBD | TBD |

**Total Estimated Monthly Cost:** $0-100 (mostly within free tiers)

## Best Practices

1. **Rate Limiting:** Respect API rate limits
2. **Caching:** Cache expensive API calls (elevation, geocoding)
3. **Error Handling:** Always handle API failures gracefully
4. **Fallbacks:** Provide fallback data when APIs unavailable
5. **Monitoring:** Monitor API usage and costs
6. **API Keys:** Store API keys securely in environment variables or secrets

## Testing

Test API integrations:

```bash
# Start the backend
uvicorn app.main:app --reload

# Test Ergast F1 API
curl http://localhost:8000/api/f1/seasons/current

# Test Google Maps (if configured)
curl http://localhost:8000/api/maps/track/sebring
```

## Troubleshooting

### Google Maps API Not Working

1. Verify API key is set correctly
2. Check that required APIs are enabled in Google Cloud Console
3. Verify API key restrictions allow your domain/IP
4. Check API quota limits

### F1 APIs Not Responding

1. Check network connectivity
2. Verify API endpoints are still available
3. Check rate limits (respect 4 req/sec for Ergast)

### Race Control API Not Available

- This is expected - API is not yet publicly available
- Contact Toyota GR Cup organizers for access
- Service is prepared for future integration

## References

- [Ergast F1 API Documentation](http://ergast.com/mrd/)
- [F1API.dev Documentation](https://f1api.dev/docs)
- [OpenF1 API Documentation](https://github.com/br-g/openf1)
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [F1 API Integration Guide](./F1_API_INTEGRATION.md)
- [Google Maps Integration Guide](./GOOGLE_MAPS_INTEGRATION.md)

## Future Enhancements

Potential improvements:

1. **Redis Caching Layer:** Add Redis caching for frequently accessed data
2. **GR Cup Comparison:** Automatically compare F1 patterns with GR Cup data
3. **Visualization:** Create charts comparing F1 vs GR Cup strategies
4. **Predictive Models:** Use F1 patterns to inform GR Cup predictions
5. **Real-time Updates:** Integrate OpenF1 real-time data during F1 races
6. **Batch Processing:** Batch API requests to reduce costs
7. **Monitoring Dashboard:** Track API usage and costs

