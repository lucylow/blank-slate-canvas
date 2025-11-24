# Circuit of the Americas - 22 Drivers Telemetry Dashboard

## Overview

A comprehensive telemetry dashboard for 22 drivers racing at Circuit of the Americas (COTA) with unique, realistic mock data for each driver.

## Files Created

### 1. Data Generation Script
**Location:** `scripts/generate_cota_telemetry.py`

Python script that generates unique telemetry data for 22 drivers (GR86-001 through GR86-022). Each driver has distinct characteristics:

- **Speed profiles**: Varying max speeds (300-328 km/h) and cornering speeds (82-95 km/h)
- **Throttle styles**: Aggressive, smooth, or progressive application patterns
- **Brake styles**: Early, late, or smooth braking patterns
- **Shift styles**: Early, late, or balanced gear shifting
- **RPM ranges**: Unique engine RPM profiles per driver

**Features:**
- 250 samples per driver (4Hz sampling rate, ~62.5 seconds of data)
- Realistic track simulation with straights and corners
- Logical constraints (throttle/brake don't conflict)
- Sensor noise and jitter for realism

### 2. Mock Telemetry Data
**Location:** `data/cota_22_drivers_telemetry.json`

JSON file containing telemetry data for all 22 drivers with the following structure:

```json
{
  "track": "Circuit of the Americas",
  "track_id": "cota",
  "location": "Austin, Texas",
  "track_length_m": 5513,
  "sample_rate_hz": 4,
  "samples_per_driver": 250,
  "drivers": {
    "GR86-001": {
      "driver_name": "Aggressive Racer",
      "telemetry": [
        {
          "timestamp_ms": 0,
          "speed_kmh": 297.94,
          "throttle_pct": 7.36,
          "brake_pct": 15.46,
          "gear": 7,
          "engine_rpm": 5532
        },
        ...
      ]
    },
    ...
  }
}
```

### 3. Dashboard Component
**Location:** `src/pages/COTA22DriversDashboard.tsx`

React dashboard component with the following features:

#### Features:
- **Overview Tab**: Grid view of all 22 drivers with real-time telemetry
- **Drivers Tab**: Detailed telemetry charts for selected driver
- **Analytics Tab**: Performance statistics for all drivers

#### Capabilities:
- Real-time playback simulation (play/pause, speed control)
- Driver selection and detailed view
- Interactive charts for speed, throttle, brake, gear, and RPM
- Color-coded driver cards with unique identifiers
- Performance statistics (average speed, max speed, etc.)
- Driver ranking by average speed

#### Telemetry Metrics Displayed:
- **Speed** (km/h): Current and average speeds
- **Throttle** (%): Throttle application percentage
- **Brake** (%): Brake pressure percentage
- **Gear** (1-7): Current gear selection
- **Engine RPM**: Engine revolutions per minute

### 4. Route Configuration
**Location:** `src/App.tsx`

Added route: `/cota-22-drivers`

## Usage

### Generate Mock Data
```bash
python3 scripts/generate_cota_telemetry.py
```

This will generate/update the `data/cota_22_drivers_telemetry.json` file.

### Access Dashboard
Navigate to: `http://localhost:8080/cota-22-drivers`

## Driver Profiles

Each of the 22 drivers has unique characteristics:

1. **GR86-001** - Aggressive Racer: High speed, aggressive throttle, late braking
2. **GR86-002** - Smooth Operator: Smooth driving style, early shifts
3. **GR86-003** - Late Braker: Late braking, progressive throttle
4. **GR86-004** - Consistent Performer: Balanced approach
5. **GR86-005** - Speed Demon: Highest max speed
6. **GR86-006** - Technical Driver: Early braking, progressive throttle
7. **GR86-007** - Risky Racer: Aggressive style
8. **GR86-008** - Precision Pilot: Smooth, balanced
9. **GR86-009** - Power User: Aggressive throttle, smooth braking
10. **GR86-010** - Steady Eddie: Conservative, fuel-efficient
11. **GR86-011** - Corner Specialist: High corner speeds
12. **GR86-012** - Straight Line King: Highest top speed
13. **GR86-013** - Balanced Driver: Well-rounded performance
14. **GR86-014** - RPM Maximizer: High RPM usage
15. **GR86-015** - Fuel Saver: Conservative driving
16. **GR86-016** - Race Leader: Top performer
17. **GR86-017** - Tire Preserver: Smooth, tire-friendly
18. **GR86-018** - Overtake Master: Aggressive overtaking
19. **GR86-019** - Consistency King: Very consistent
20. **GR86-020** - Young Gun: Aggressive, high speed
21. **GR86-021** - Veteran Racer: Experienced, smooth
22. **GR86-022** - Comeback Kid: Progressive improvement

## Data Characteristics

- **Total Samples**: 5,500 (250 per driver × 22 drivers)
- **Sampling Rate**: 4 Hz (250ms intervals)
- **Speed Range**: 50-330 km/h
- **Throttle Range**: 0-100%
- **Brake Range**: 0-100%
- **Gear Range**: 1-7
- **RPM Range**: 1,000-12,000

## Technical Details

### Track Simulation
The script simulates COTA's track layout:
- **Sector 1**: Start straight → Turn 1 → Straight
- **Sector 2**: Technical section → Straight
- **Sector 3**: Final corners → Finish straight

### Realistic Constraints
- Throttle and brake are mutually exclusive (can't both be high)
- Gear selection is logical based on speed
- RPM correlates with gear and throttle
- Speed varies realistically between straights and corners

### Sensor Noise
Small random variations added to simulate real sensor imperfections:
- Speed: ±5 km/h
- Throttle/Brake: ±5%
- RPM: ±200 RPM

## Future Enhancements

Potential improvements:
- Add position tracking and gap analysis
- Include tire wear data
- Add sector times
- Implement lap-by-lap comparison
- Add driver comparison mode
- Export telemetry data
- Real-time WebSocket integration

## Notes

- The dashboard uses mock data for demonstration purposes
- Data is generated deterministically (seed=42) for reproducibility
- All telemetry values respect realistic racing constraints
- Each driver's data reflects their unique driving style

