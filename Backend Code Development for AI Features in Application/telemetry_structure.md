# Telemetry Data Structure Analysis

## Dataset Overview
- **File Size**: ~1.8 GB per race
- **Format**: CSV with long-format telemetry (one row per telemetry reading)
- **Frequency**: High-frequency data (~20-50 Hz depending on sensor)

## Columns
1. `expire_at` - Expiration timestamp (nullable)
2. `lap` - Lap number (integer)
3. `meta_event` - Event identifier (e.g., "I_R03_2025-05-18")
4. `meta_session` - Session type (e.g., "R1" for Race 1)
5. `meta_source` - Data source (e.g., "kafka:gr-raw")
6. `meta_time` - Metadata timestamp
7. `original_vehicle_id` - Original vehicle chassis ID (e.g., "GR86-006-7")
8. `outing` - Outing number (usually 0)
9. `telemetry_name` - Name of telemetry channel
10. `telemetry_value` - Value of the telemetry reading (float)
11. `timestamp` - ISO timestamp of the reading
12. `vehicle_id` - Vehicle chassis ID
13. `vehicle_number` - Car number (integer, e.g., 7)

## Telemetry Channels Available

### Driver Inputs
- **`Steering_Angle`** - Steering wheel angle in degrees
- **`ath`** - Throttle position (0-100%)
- **`pbrake_f`** - Front brake pressure (bar)
- **`pbrake_r`** - Rear brake pressure (bar)

### Vehicle Dynamics
- **`speed`** - Vehicle speed (likely km/h or mph)
- **`gear`** - Current gear (integer 1-6)
- **`nmot`** - Engine RPM

### Acceleration Data (G-forces)
- **`accx_can`** - Longitudinal acceleration (G) - forward/braking
- **`accy_can`** - Lateral acceleration (G) - cornering

## Data Format
The data is in **long format** (narrow format), meaning:
- Each telemetry reading is a separate row
- Multiple telemetry types for the same timestamp create multiple rows
- This format is efficient for streaming but needs pivoting for analysis

### Example Rows
```
lap=1, timestamp=2025-05-15T20:25:55.003Z, vehicle_number=7, telemetry_name=accx_can, telemetry_value=0.147
lap=1, timestamp=2025-05-15T20:25:55.003Z, vehicle_number=7, telemetry_name=accy_can, telemetry_value=0.059
lap=1, timestamp=2025-05-15T20:25:55.003Z, vehicle_number=7, telemetry_name=ath, telemetry_value=99.99
lap=1, timestamp=2025-05-15T20:25:55.003Z, vehicle_number=7, telemetry_name=pbrake_r, telemetry_value=0
lap=1, timestamp=2025-05-15T20:25:55.003Z, vehicle_number=7, telemetry_name=pbrake_f, telemetry_value=0
lap=1, timestamp=2025-05-15T20:25:55.003Z, vehicle_number=7, telemetry_name=gear, telemetry_value=4
lap=1, timestamp=2025-05-15T20:25:55.003Z, vehicle_number=7, telemetry_name=Steering_Angle, telemetry_value=3.8
```

## Additional Files Available

### Lap Time Files
- `sebring_lap_start_time_R1.csv` - Lap start timestamps
- `sebring_lap_end_time_R1.csv` - Lap end timestamps
- `sebring_lap_time_R1.csv` - Lap time durations

### Race Results
- `00_Results GR Race 1 Official_Anonymized.CSV` - Official race results
- `03_Provisional Results_Race 1_Anonymized.CSV` - Provisional results
- `05_Provisional Results by Class_Race 1_Anonymized.CSV` - Class results

### Analysis Files
- `23_AnalysisEnduranceWithSections_Race 1_Anonymized.CSV` - Sector/section analysis (97KB)
- `26_Weather_Race 1_Anonymized.CSV` - Weather data (3.1KB)
- `99_Best 10 Laps By Driver_Race 1_Anonymized.CSV` - Best lap times (3.4KB)

## Backend Processing Strategy

### For Real-Time Simulation
1. **Stream Processing**: Process telemetry in time-ordered chunks
2. **Pivot on Timestamp**: Group by timestamp to get all telemetry values at once
3. **Calculate Derived Metrics**: Tire wear, fuel consumption estimates
4. **Update Dashboard**: Send aggregated data to frontend via WebSocket

### For AI Model Training
1. **Feature Engineering**: Create features from raw telemetry
   - Brake-to-throttle transition time
   - Cornering speed (speed + accy_can)
   - Gear shift patterns
   - Steering smoothness (rate of change)
2. **Lap Aggregation**: Summarize telemetry per lap for tire wear models
3. **Sector Analysis**: Break down performance by track sections
