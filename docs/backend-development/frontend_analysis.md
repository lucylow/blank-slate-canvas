# PitWall AI Frontend Analysis

## Application Overview
- **URL**: https://void-form-forge.lovable.app/
- **GitHub**: https://github.com/lucylow/blank-slate-canvas
- **Purpose**: Real-time racing analytics for Toyota GR Cup series

## Key Features Identified

### 1. Real-Time Analytics
- Process live telemetry data
- Instant insights on car performance, tire wear, race strategy

### 2. Predictive Tire Models
- AI algorithms forecast tire degradation
- Recommend optimal pit stop windows with 95% accuracy
- Display tire wear percentages for all 4 tires (Front Left, Front Right, Rear Left, Rear Right)

### 3. Driver Performance Analysis
- Analyze driver inputs
- Provide actionable feedback to improve lap times and consistency

### 4. Strategy Optimization
- Simulate race scenarios
- Determine optimal strategy for qualifying and race conditions

### 5. Track-Specific Models
- Custom AI models for all 7 GR Cup tracks
- Circuit-specific insights

### 6. Live Gap Analysis
- Monitor real-time gaps to competitors
- Calculate overtaking opportunities

## Dashboard Components

### Live Race Analytics Display
- **Track**: Circuit of the Americas (example)
- **Lap Progress**: Lap 12/25
- **Live Data Indicator**: Red dot showing live status

### Tire Wear Analysis Panel
- Front Left: 78%
- Front Right: 82%
- Rear Left: 71% (highlighted in red - critical)
- Rear Right: 75%

### Performance Metrics Panel
- Current Lap: 2:04.56
- Best Lap: 2:03.12
- Gap to Leader: +1.24s
- Predicted Finish: P3

## Track Data (7 GR Cup Tracks)

1. **Circuit of the Americas** - Austin, Texas
   - Length: 3.427 miles, Turns: 20

2. **Road America** - Elkhart Lake, Wisconsin
   - Length: 4.048 miles, Turns: 14

3. **Sebring International** - Sebring, Florida
   - Length: 3.74 miles, Turns: 17

4. **Sonoma Raceway** - Sonoma, California
   - Length: 2.52 miles, Turns: 12

5. **Barber Motorsports Park** - Birmingham, Alabama
   - Length: 2.38 miles, Turns: 17

6. **Virginia International** - Alton, Virginia
   - Length: 3.27 miles, Turns: 17

7. **Mid-Ohio Sports Car Course** - Lexington, Ohio
   - Length: 2.4 miles, Turns: 15

## Backend Requirements (Inferred)

### API Endpoints Needed
1. **GET /api/tracks** - List all tracks with metadata
2. **GET /api/tracks/{track_id}** - Get specific track data
3. **GET /api/telemetry/live** - Real-time telemetry stream
4. **POST /api/analytics/tire-wear** - Calculate tire wear predictions
5. **POST /api/analytics/performance** - Analyze driver performance
6. **POST /api/analytics/strategy** - Optimize race strategy
7. **GET /api/analytics/gap-analysis** - Calculate gaps and overtaking opportunities
8. **POST /api/predictions/finish-position** - Predict race finish position

### AI Features to Implement
1. **Tire Degradation Model** - ML model to predict tire wear over laps
2. **Lap Time Prediction** - Predict lap times based on tire wear, fuel load, track conditions
3. **Pit Stop Optimizer** - Determine optimal pit stop windows
4. **Performance Analyzer** - Analyze telemetry for driver improvement suggestions
5. **Race Strategy Simulator** - Simulate different race scenarios
6. **Gap Analysis Engine** - Real-time competitor gap calculations
7. **Finish Position Predictor** - Predict final race position based on current data

### Data Models
- Track (name, location, length, turns, track-specific parameters)
- Telemetry (lap, speed, throttle, brake, tire temps, tire pressures)
- TireWear (lap, FL%, FR%, RL%, RR%)
- Performance (current_lap, best_lap, gap_to_leader, predicted_finish)
- Strategy (pit_window, fuel_strategy, tire_compound)
