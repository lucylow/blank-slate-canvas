# Comprehensive Mock Data Documentation

This file provides detailed mock data for all 7 tracks with complete API integrations for frontend development and testing.

## Features Included

### 1. **Weather Data (OpenWeatherMap Style)**
- Current conditions (temperature, humidity, wind, pressure)
- Track-specific conditions (track temp, grip level, surface condition)
- 6-hour forecast
- Historical averages

### 2. **AI Analytics (OpenAI/Gemini)**
- Natural language insights and recommendations
- Tire wear, lap time, pit window, and performance predictions
- Pattern identification (trends, anomalies)
- Confidence scores and model attribution

### 3. **Google Maps Integration**
- Elevation profiles with gradient calculations
- Location data (coordinates, timezone, formatted address)
- Air quality index and health recommendations
- Nearby weather station locations

### 4. **Hugging Face ML Predictions**
- Tire wear predictions (all 4 corners)
- Lap time predictions with confidence intervals
- Anomaly detection scores
- Feature importance analysis

### 5. **Twilio Alerts**
- SMS, Voice, and WhatsApp alerts
- Critical tire wear notifications
- Strategy recommendations
- Anomaly alerts

### 6. **Slack Notifications**
- Race updates with formatted blocks
- Tire wear alerts
- Strategy notifications
- Rich message formatting

### 7. **F1 Benchmarking**
- Comparison with F1 lap records
- Sector-by-sector analysis
- Performance insights
- Delta calculations

### 8. **Computer Vision (Track Condition)**
- Track surface analysis
- Tire condition assessment
- Debris and hazard detection
- Temperature hotspot identification

### 9. **Driver Fingerprinting**
- Braking consistency scores
- Throttle smoothness metrics
- Cornering style analysis
- Coaching alerts and improvement plans

### 10. **Anomaly Detection**
- Real-time anomaly scoring
- Critical sensor alerts
- Rate of change detection
- ML-based anomaly identification

## Tracks Supported

1. **Barber Motorsports Park** (`barber`)
2. **Circuit of the Americas** (`cota`)
3. **Indianapolis Motor Speedway** (`indianapolis`)
4. **Road America** (`road_america`)
5. **Sebring International Raceway** (`sebring`)
6. **Sonoma Raceway** (`sonoma`)
7. **Virginia International Raceway** (`vir`)

## Usage

### Basic Usage

```typescript
import { getTrackData } from "@/lib/comprehensiveMockData";

// Get data for a specific track, vehicle, and lap
const data = getTrackData("cota", 13, 10);

// Access weather data
console.log(data.weather.current.temperature);

// Access AI analytics
console.log(data.ai_analytics.insights);

// Access tire wear predictions
console.log(data.hugging_face.predictions.tire_wear.front_left);
```

### Using React Hook

```typescript
import { useTrackMockData } from "@/hooks/useComprehensiveMockData";

function MyComponent() {
  const { currentTrackData, summary } = useTrackMockData("cota", 13, 10);
  
  if (!currentTrackData) return null;
  
  return (
    <div>
      <p>Temperature: {currentTrackData.weather.current.temperature}°C</p>
      <p>AI Summary: {currentTrackData.ai_analytics.summary}</p>
    </div>
  );
}
```

### Get All Tracks Data

```typescript
import { generateAllTracksData } from "@/lib/comprehensiveMockData";

const allData = generateAllTracksData([7, 13, 21], [5, 10, 15, 20, 25]);

// Access specific track
const cotaData = allData.cota;
const barberData = allData.barber;
```

### Track Summary

```typescript
import { getAllTracksSummary } from "@/lib/comprehensiveMockData";

const summary = getAllTracksSummary();
// Returns metadata for all tracks
```

## Data Structure

Each track data point includes:

```typescript
interface ComprehensiveTrackData {
  track: TrackId;
  weather: WeatherData;
  ai_analytics: AIAnalyticsResponse;
  google_maps: GoogleMapsData;
  hugging_face: HuggingFacePrediction;
  twilio_alerts: TwilioAlert[];
  slack_messages: SlackMessage[];
  f1_benchmark: F1BenchmarkData;
  computer_vision: ComputerVisionData;
  driver_fingerprint: {
    fingerprint: DriverFingerprint;
    alerts: CoachingAlert[];
    coachingPlan: CoachingPlan;
  };
  anomaly_detection: {
    detection: AnomalyDetectionResult;
    stats: AnomalyStats;
  };
  timestamp: string;
}
```

## Integration Examples

### Weather Widget

```typescript
const weather = data.weather;
return (
  <div>
    <p>Current: {weather.current.temperature}°C</p>
    <p>Track: {weather.track_conditions.track_temp}°C</p>
    <p>Grip: {(weather.track_conditions.grip_level * 100).toFixed(0)}%</p>
  </div>
);
```

### AI Analytics Display

```typescript
const analytics = data.ai_analytics;
return (
  <div>
    <h3>Insights</h3>
    <ul>
      {analytics.insights.map((insight, i) => (
        <li key={i}>{insight}</li>
      ))}
    </ul>
    <h3>Recommendations</h3>
    <ul>
      {analytics.recommendations.map((rec, i) => (
        <li key={i}>{rec}</li>
      ))}
    </ul>
  </div>
);
```

### Tire Wear Visualization

```typescript
const tireWear = data.hugging_face.predictions.tire_wear;
return (
  <div>
    <TireWearChart
      frontLeft={tireWear.front_left}
      frontRight={tireWear.front_right}
      rearLeft={tireWear.rear_left}
      rearRight={tireWear.rear_right}
    />
  </div>
);
```

### Elevation Profile

```typescript
const elevation = data.google_maps.elevation;
return (
  <ElevationChart
    profile={elevation.profile}
    stats={elevation.stats}
  />
);
```

### Alerts Display

```typescript
const alerts = data.twilio_alerts;
return (
  <div>
    {alerts.map(alert => (
      <AlertCard
        key={alert.id}
        type={alert.type}
        priority={alert.priority}
        message={alert.message}
      />
    ))}
  </div>
);
```

## Track-Specific Characteristics

Each track has unique characteristics that affect the mock data:

- **Barber**: Twisty, technical, lateral metrics focus
- **COTA**: Long straights, top speed focus, elevation changes
- **Indianapolis**: Mixed oval/infield, high speed
- **Road America**: Long lap, multi-sector, elevation
- **Sebring**: Concrete/bumpy, high abrasion, vibration
- **Sonoma**: Elevation changes, technical sections
- **VIR**: Roller coaster layout, elevation changes

## Notes

- All data is generated with realistic variations
- Timestamps are current when generated
- Tire wear increases with lap number
- Weather conditions vary by track location
- F1 benchmarks are track-specific
- Anomaly detection has ~15% chance of triggering

## Integration with Existing Code

This comprehensive mock data can be used alongside existing mock data:

```typescript
import { generateMockDashboardData } from "@/lib/mockDemoData";
import { getTrackData } from "@/lib/comprehensiveMockData";

// Use existing dashboard data
const dashboard = generateMockDashboardData("cota", 1, 13, 10);

// Enhance with comprehensive data
const comprehensive = getTrackData("cota", 13, 10);

// Combine as needed
const combined = {
  ...dashboard,
  weather: comprehensive.weather,
  ai_analytics: comprehensive.ai_analytics,
};
```

