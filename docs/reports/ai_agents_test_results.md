# AI Agents Test Report

**Test Date:** 2025-11-21  
**Test Status:** Setup Required (Redis Not Available)  
**Demo Data:** demo_data.json (extracted to extracted_demo_data/)

## Prerequisites

To run the AI agents test, you need:

1. **Redis Server** running on port 6379
   - Install via Docker: `docker run -d -p 6379:6379 redis:7`
   - Or install via Homebrew: `brew install redis && brew services start redis`
   - Or install system package: `sudo apt-get install redis-server` (Linux)

2. **Python Dependencies** installed
   ```bash
   cd ai_agents
   pip install -r requirements.txt
   ```

## Test Setup

The test script (`test_ai_agents.py`) performs the following:

1. **Loads Demo Data** from `demo_data.json` (tar archive containing telemetry for multiple tracks)
2. **Transforms Telemetry** from demo format to agent-compatible format
3. **Starts AI Agents** (Strategy, Coach, Anomaly Detection)
4. **Ingests Telemetry** into Redis streams
5. **Collects Decisions** from agents
6. **Generates Report** with test results

## Demo Data Structure

The `demo_data.json` file is a tar archive containing:

```
demo_data/
├── tracks_index.json          # Index of available tracks
├── barber_demo.json          # Barber Motorsports Park data
├── cota_demo.json            # Circuit of the Americas data
├── indianapolis_demo.json    # Indianapolis Motor Speedway data
├── road_america_demo.json    # Road America data (2 races)
├── sebring_demo.json         # Sebring International Raceway data (2 races)
├── sonoma_demo.json          # Sonoma Raceway data (2 races)
└── vir_demo.json             # Virginia International Raceway data (2 races)
```

### Tracks with Race Data

- **Road America**: 2 races, 100+ telemetry samples per race
- **Sebring**: 2 races  
- **Sonoma**: 2 races
- **Virginia International Raceway**: 2 races

### Telemetry Format

Each race contains:
- `race_number`: Race identifier
- `telemetry_sample`: Array of telemetry records
- `lap_times_sample`: Lap time data
- `weather_sample`: Weather conditions

Telemetry records contain:
- `timestamp`: Timestamp of measurement
- `meta_time`: Metadata timestamp
- `vehicle_id`: Vehicle identifier (e.g., "GR86-002-2")
- `lap`: Lap number
- `telemetry_name`: Parameter name (e.g., "accx_can", "speed", "accy_can")
- `telemetry_value`: Parameter value

## Agents Tested

### 1. Strategy Agent (`strategy-01`)
- **Purpose**: Makes autonomous pit strategy decisions
- **Tracks Supported**: COTA, Road America, Sonoma, VIR, Sebring, Barber, Indianapolis
- **Decision Types**: Pit recommendations based on tire wear, gap analysis, remaining laps
- **Output**: Pit recommendations with confidence scores and reasoning

### 2. Coach Agent (`coach-01`)
- **Purpose**: Provides real-time driver coaching
- **Decision Types**: Technique feedback, sector performance analysis
- **Output**: Coaching suggestions for driver improvement

### 3. Anomaly Detective Agent (`anomaly-01`)
- **Purpose**: Detects safety issues and sensor anomalies
- **Decision Types**: Safety alerts, sensor glitches, thermal anomalies
- **Output**: Critical alerts with evidence and recommendations

## How to Run the Test

### Step 1: Start Redis

**Option A: Docker**
```bash
docker run -d --name pitwall-redis-test -p 6379:6379 redis:7
```

**Option B: Homebrew (macOS)**
```bash
brew install redis
brew services start redis
```

**Option C: System Package (Linux)**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Step 2: Verify Redis is Running

```bash
redis-cli ping
# Should return: PONG
```

### Step 3: Run Test Script

```bash
cd /Users/llow/Desktop/blank-slate-canvas
python3 test_ai_agents.py
```

### Step 4: View Results

The test generates `ai_agents_test_results.md` with:
- Agent registry status
- Decisions summary by type and agent
- Detailed decision log
- Test statistics

## Expected Test Output

### Agent Registry

| Agent ID | Type | Status | Tracks |
|----------|------|--------|--------|
| strategy-01 | strategist | active | 7 tracks |
| coach-01 | coach | active | - |
| anomaly-01 | anomaly_detective | active | - |

### Decision Types Expected

1. **Pit Decisions** (Strategy Agent)
   - Recommendations for pit stops
   - Based on tire wear (>35%), remaining laps (>8)
   - Confidence threshold: >85%

2. **Coaching Decisions** (Coach Agent)
   - Driver technique feedback
   - Sector-specific performance analysis
   - High lateral load warnings
   - Braking technique suggestions

3. **Anomaly Decisions** (Anomaly Detective)
   - Sensor glitch detection (>2.0G acceleration)
   - Sudden speed loss alerts (>30 km/h drop)
   - Tire overheating warnings (>110°C)

### Sample Decisions

#### Strategy Decision Example
```json
{
  "agent_id": "strategy-01",
  "decision_type": "pit",
  "action": "Recommend pit lap 12",
  "confidence": 0.87,
  "reasoning": [
    "Tire wear trending at 38.5%",
    "Remaining laps: 10 (sufficient for pit + 1-stop strategy)",
    "Gap to leader suggests undercut/overcut timing opportunity"
  ]
}
```

#### Coach Decision Example
```json
{
  "agent_id": "coach-01",
  "decision_type": "coach",
  "action": "High cornering load detected in Sector 1",
  "confidence": 0.80,
  "reasoning": [
    "Lateral acceleration: 1.45G (ideal: <1.2G)",
    "Consider earlier brake application or smoother turn-in",
    "Potential tire graining risk if sustained"
  ]
}
```

#### Anomaly Decision Example
```json
{
  "agent_id": "anomaly-01",
  "decision_type": "anomaly",
  "action": "Alert: sensor_glitch",
  "confidence": 0.95,
  "reasoning": [
    "Detected 1 anomaly(ies)",
    "Most severe: sensor_glitch",
    "Recommend investigation and data logging"
  ]
}
```

## Test Statistics

After running the test, you should see:

- **Agents Started**: ✓
- **Decisions Collected**: ~10-50 (depends on demo data size)
- **Agents Registered**: 3
- **Total Frames Processed**: ~200-500+ (depending on available race data)

## Troubleshooting

### Redis Connection Error

**Error**: `ConnectionRefusedError: [Errno 61] Connect call failed ('127.0.0.1', 6379)`

**Solution**: Start Redis server (see Step 1 above)

### No Decisions Collected

**Possible Causes**:
1. Telemetry data format mismatch
2. Agents not receiving tasks
3. Decision confidence below thresholds

**Check**:
```bash
# Check if tasks are in queue
redis-cli XRANGE tasks.stream - +

# Check if results are being generated
redis-cli XRANGE results.stream - +

# Check agent registry
redis-cli HGETALL agents.registry
```

### Import Errors

**Error**: `ModuleNotFoundError: No module named 'ai_agents'`

**Solution**: Ensure you're running from the project root directory and `ai_agents/` directory exists

## Test Results Summary

### Current Status

❌ **Test Not Run** - Redis server required but not available

### Next Steps

1. Install and start Redis server
2. Run `python3 test_ai_agents.py`
3. Review generated `ai_agents_test_results.md` report
4. Verify agents are making decisions as expected

## Test Script Features

The test script (`test_ai_agents.py`) includes:

- ✅ Automatic demo data extraction from tar archive
- ✅ Telemetry transformation to agent-compatible format
- ✅ Agent lifecycle management (start/stop)
- ✅ Decision collection and aggregation
- ✅ Markdown report generation
- ✅ Error handling and graceful cleanup

## Notes

- The test processes all available race data from demo_data.json
- Agents run asynchronously and process tasks concurrently
- Decision collection has a 30-second timeout
- Test data is cleared from Redis before each run
- Agents remain registered in Redis for subsequent tests

---

**Generated by**: AI Agents Test Script  
**For**: PitWall A.I. Autonomous Agents System  
**Last Updated**: 2025-11-21

