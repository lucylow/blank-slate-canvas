# OpenWeatherMap API Integration

## Overview

The PitWall A.I. platform now integrates with OpenWeatherMap API to provide real-time weather data for track conditions. This integration enables:

- **Real-time weather monitoring** during races
- **Weather forecasts** for strategy planning
- **Historical weather data** for model training
- **Enhanced weather features** (UV index, pressure, visibility)

## API Key Configuration

**IMPORTANT:** The OpenWeatherMap API key must be configured as a secret in Lovable Cloud.

### Setting Up the API Key

1. **Get your API key** from [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account at https://openweathermap.org/api
   - Free tier provides 60 calls/minute, 1,000 calls/day
   - Paid plans available for higher limits

2. **Configure in Lovable Cloud:**
   - Go to your Lovable project settings
   - Navigate to "Secrets" or "Environment Variables"
   - Add a new secret with the name: `OpenWeatherMap_API_Key`
   - Set the value to your OpenWeatherMap API key

3. **Verify configuration:**
   ```bash
   # The service will automatically detect the API key from environment
   # Check logs on startup - should see "OpenWeatherMap service initialized"
   ```

## Architecture

### Service Layer

**Location:** `app/services/openweathermap_service.py`

The `OpenWeatherMapService` class provides:
- Current weather data fetching
- Hourly forecasts (up to 48 hours)
- Daily forecasts (up to 8 days)
- Historical weather data (requires paid plan)
- Track temperature estimation

**Key Features:**
- Automatic API key detection from environment (`OpenWeatherMap_API_Key`)
- Graceful error handling
- Track temperature estimation based on air temp, UV index, and cloud cover
- Comprehensive weather data formatting

### API Endpoints

**Location:** `app/routes/weather.py`

The weather API provides the following endpoints:

#### 1. Get Current Weather for Track
```
GET /api/weather/current/{track_id}
```

**Parameters:**
- `track_id`: Track identifier (e.g., "cota", "sebring", "sonoma", "barber", "vir", "road-america", "indianapolis")

**Response:**
```json
{
  "air_temp": 25.5,
  "track_temp": 40.2,
  "humidity": 65,
  "pressure": 1013.25,
  "wind_speed": 15.3,
  "wind_direction": 270,
  "wind_gust": 22.0,
  "cloud_cover": 30,
  "visibility": 10.0,
  "rain": 0,
  "rain_1h": 0,
  "condition": "clear sky",
  "icon": "01d",
  "timestamp": "2025-01-15T14:30:00Z",
  "track_id": "cota",
  "track_name": "Circuit of the Americas",
  "track_location": "Austin, Texas"
}
```

#### 2. Get Current Weather by Coordinates
```
GET /api/weather/current?lat={latitude}&lon={longitude}
```

**Parameters:**
- `lat`: Latitude (-90 to 90)
- `lon`: Longitude (-180 to 180)

#### 3. Get Weather Forecast for Track
```
GET /api/weather/forecast/{track_id}?hours=48
```

**Parameters:**
- `track_id`: Track identifier
- `hours`: Number of hours to forecast (1-48, default: 48)

**Response:**
```json
{
  "current": { /* current weather data */ },
  "forecast": [
    {
      "timestamp": "2025-01-15T15:00:00Z",
      "air_temp": 26.0,
      "track_temp": 41.0,
      "humidity": 63,
      "wind_speed": 16.2,
      "precipitation_prob": 10,
      "condition": "clear sky"
    },
    /* ... more hourly forecasts ... */
  ],
  "track_id": "cota",
  "track_name": "Circuit of the Americas",
  "forecast_hours": 48
}
```

#### 4. List Tracks with Coordinates
```
GET /api/weather/tracks
```

Returns all available tracks with their coordinates for weather API usage.

### Track Configuration

**Location:** `app/config.py`

All tracks now include latitude and longitude coordinates:

```python
TRACKS = {
    "cota": {
        "name": "Circuit of the Americas",
        "location": "Austin, Texas",
        "latitude": 30.1327,
        "longitude": -97.6344,
        # ... other track data
    },
    # ... other tracks
}
```

**Available Tracks:**
- `cota` - Circuit of the Americas (Austin, Texas)
- `sebring` - Sebring International Raceway (Sebring, Florida)
- `sonoma` - Sonoma Raceway (Sonoma, California)
- `barber` - Barber Motorsports Park (Birmingham, Alabama)
- `vir` - Virginia International Raceway (Alton, Virginia)
- `road-america` - Road America (Elkhart Lake, Wisconsin)
- `indianapolis` - Indianapolis Motor Speedway (Indianapolis, Indiana)

## Data Integration

### Enhanced Data Loader

**Location:** `tools/data_integration.py`

The `RaceDataLoader.load_weather()` method now supports optional API integration:

```python
# Load from CSV (existing behavior)
weather_df = loader.load_weather(race_num=1)

# Load from OpenWeatherMap API
track_coords = {"latitude": 30.1327, "longitude": -97.6344}
weather_df = loader.load_weather(
    race_num=1,
    use_api=True,
    track_coords=track_coords
)
```

**Features:**
- Falls back to CSV if API is unavailable
- Automatic API key detection from environment
- Error handling with graceful fallback
- Matches CSV data structure for compatibility

## Usage Examples

### Python Service Usage

```python
from app.services.openweathermap_service import get_openweathermap_service

# Get service instance (automatically configured with API key from Lovable)
service = get_openweathermap_service()

if service:
    # Get current weather for COTA
    weather = await service.get_current_weather(
        lat=30.1327,
        lon=-97.6344
    )
    print(f"Air Temp: {weather['air_temp']}°C")
    print(f"Track Temp: {weather['track_temp']}°C")
    print(f"Humidity: {weather['humidity']}%")
```

### API Usage (Frontend/HTTP)

```typescript
// Get current weather for a track
const response = await fetch('/api/weather/current/cota');
const weather = await response.json();
console.log(`Track temperature: ${weather.track_temp}°C`);

// Get forecast
const forecastResponse = await fetch('/api/weather/forecast/cota?hours=24');
const forecast = await forecastResponse.json();
console.log(`Forecast hours: ${forecast.forecast.length}`);
```

### cURL Examples

```bash
# Get current weather for COTA
curl http://localhost:8000/api/weather/current/cota

# Get weather forecast
curl http://localhost:8000/api/weather/forecast/sebring?hours=48

# Get weather by coordinates
curl "http://localhost:8000/api/weather/current?lat=30.1327&lon=-97.6344"

# List all tracks
curl http://localhost:8000/api/weather/tracks
```

## Track Temperature Estimation

The service automatically estimates track temperature based on:

1. **Air temperature** - Base temperature
2. **UV index** - Solar radiation heating (0-11 scale)
3. **Cloud cover** - Reduces heating (0-100%)

**Formula:**
```
track_temp = air_temp + 15°C + (uv_index × 1.5) - (cloud_cover/100 × 8°C)
```

Track temperature is typically 10-30°C higher than air temperature, depending on conditions.

## Weather Data Fields

The integration provides comprehensive weather data:

| Field | Description | Unit |
|-------|-------------|------|
| `air_temp` | Air temperature | Celsius |
| `track_temp` | Estimated track temperature | Celsius |
| `humidity` | Relative humidity | Percentage (0-100) |
| `pressure` | Atmospheric pressure | hPa |
| `wind_speed` | Wind speed | km/h |
| `wind_direction` | Wind direction | Degrees (0-360) |
| `wind_gust` | Wind gust speed | km/h |
| `cloud_cover` | Cloud coverage | Percentage (0-100) |
| `visibility` | Visibility distance | km |
| `rain` | Rain flag | 0 or 1 |
| `rain_1h` | Rain volume (last hour) | mm |
| `uv_index` | UV index | 0-11 |
| `condition` | Weather description | String |
| `icon` | Weather icon code | String |

## Error Handling

The integration includes comprehensive error handling:

1. **API Key Missing:**
   - Returns 503 Service Unavailable
   - Message: "OpenWeatherMap API is not configured"

2. **Invalid Track ID:**
   - Returns 404 Not Found
   - Lists available tracks

3. **API Request Failures:**
   - Returns 500 Internal Server Error
   - Logs detailed error information
   - Falls back to CSV in data loader

4. **Rate Limiting:**
   - OpenWeatherMap free tier: 60 calls/minute
   - Service logs warnings on rate limit errors
   - Consider implementing caching for production

## Pricing & Limits

### Free Tier
- 60 API calls/minute
- 1,000 calls/day
- 1,000,000 calls/month
- Current weather only
- 5-day/3-hour forecast

### Paid Plans
- **Startup** ($40/month): 600 calls/minute, historical data
- **Developer** ($180/month): 3,000 calls/minute, 40+ years historical
- **Professional** ($470/month): 30,000 calls/minute, real-time updates

**Recommendation:** Start with free tier for development and testing. Upgrade if you need:
- Higher rate limits
- Historical weather data
- One Call API features (hourly forecasts, UV index)

## Integration Points

### With Existing Weather Data

The system currently loads weather data from CSV files (`*Weather*.CSV`). The OpenWeatherMap integration:

- **Complements** existing CSV data with real-time updates
- **Provides fallback** when CSV files are unavailable
- **Enables live racing** scenarios with current weather
- **Maintains compatibility** with existing data structures

### With Telemetry Pipeline

Weather data can be merged with telemetry:

```python
# Weather data includes timestamp for merging
weather_df = loader.load_weather(race_num=1, use_api=True, track_coords=track_coords)
telemetry_df = loader.load_telemetry(race_num=1)

# Merge weather with telemetry (as in existing integrate_all_data method)
merged = pd.merge_asof(
    telemetry_df.sort_values('timestamp'),
    weather_df.sort_values('timestamp'),
    on='timestamp',
    direction='backward'
)
```

## Testing

### Local Testing

1. **Set API key in environment:**
   ```bash
   export OpenWeatherMap_API_Key="your_api_key_here"
   ```

2. **Start the backend:**
   ```bash
   uvicorn app.main:app --reload
   ```

3. **Test endpoints:**
   ```bash
   curl http://localhost:8000/api/weather/current/cota
   ```

### Lovable Cloud Testing

1. **Add secret in Lovable:**
   - Project Settings → Secrets
   - Add `OpenWeatherMap_API_Key` with your API key

2. **Deploy and test:**
   - The service automatically detects the secret
   - Check logs for "OpenWeatherMap service initialized"
   - Test endpoints via deployed URL

## Troubleshooting

### Service Not Available

**Symptom:** API returns 503 "OpenWeatherMap API is not configured"

**Solutions:**
1. Verify secret is set in Lovable Cloud as `OpenWeatherMap_API_Key`
2. Check environment variables: `echo $OpenWeatherMap_API_Key`
3. Restart the backend service
4. Check logs for initialization messages

### Invalid API Key

**Symptom:** API returns 401 Unauthorized

**Solutions:**
1. Verify API key is correct in Lovable Cloud
2. Check API key is active on OpenWeatherMap dashboard
3. Ensure no extra spaces in secret value

### Rate Limiting

**Symptom:** API returns 429 Too Many Requests

**Solutions:**
1. Implement caching for weather data
2. Reduce API call frequency
3. Upgrade to paid plan for higher limits
4. Use forecast data instead of repeated current weather calls

## Future Enhancements

Potential improvements:

1. **Caching Layer:**
   - Cache weather data for 10-15 minutes
   - Reduce API calls during races
   - Redis-based caching

2. **Historical Data Integration:**
   - Download historical weather for model training
   - Bulk historical data processing
   - Integration with ML training pipeline

3. **Weather Alerts:**
   - Real-time severe weather alerts
   - Precipitation warnings
   - Wind gust alerts

4. **Advanced Features:**
   - Multi-track weather monitoring
   - Weather pattern analysis
   - Track-specific weather models
   - Integration with strategy optimizer

## References

- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [OpenWeatherMap Pricing](https://openweathermap.org/price)
- [Service Code](../app/services/openweathermap_service.py)
- [Route Code](../app/routes/weather.py)
- [Configuration](../app/config.py)

---

**Last Updated:** January 2025
**Maintained by:** PitWall A.I. Team

