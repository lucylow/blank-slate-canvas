# AI Agents Testing on 7 Track Maps - Summary

## What Was Created

I've created a comprehensive testing system to test the AI agents on all 7 track PDF maps:

### Files Created

1. **`test_agents_on_maps.py`** - Main test script
   - Tests all 7 tracks with 4 different scenarios each
   - Generates realistic telemetry data
   - Collects and displays agent decisions
   - Supports single track testing and real-time monitoring

2. **`quick_test.py`** - Prerequisite checker
   - Verifies Redis is running
   - Checks if agents are running
   - Sends test telemetry to verify connectivity

3. **`TEST_7_MAPS.md`** - Complete testing guide
   - Step-by-step instructions
   - Troubleshooting tips
   - Expected results

## The 7 Tracks

All 7 track PDF maps are tested:

1. **Barber Motorsports Park** (`barber`) - `Barber_Circuit_Map.pdf`
2. **Circuit of the Americas** (`cota`) - `COTA_Circuit_Map.pdf`
3. **Indianapolis Motor Speedway** (`indianapolis`) - `Indy_Circuit_Map.pdf`
4. **Road America** (`road_america`) - `Road_America_Map.pdf`
5. **Sebring International Raceway** (`sebring`) - `Sebring_Track_Sector_Map.pdf`
6. **Sonoma Raceway** (`sonoma`) - `Sonoma_Map.pdf`
7. **Virginia International Raceway** (`vir`) - `VIR_mapk.pdf`

## Test Scenarios

For each track, the test generates telemetry with 4 scenarios:

1. **Normal Racing** - Regular conditions, baseline performance
2. **High Tire Wear** - Should trigger Strategy Agent pit recommendations
3. **Aggressive Driving** - Should trigger Coach Agent feedback
4. **Sensor Anomaly** - Should trigger Anomaly Detective alerts

## Quick Start

### 1. Check Prerequisites
```bash
cd ai_agents
python quick_test.py
```

### 2. Start Agents (4 terminals)
```bash
# Terminal 1
python ai_agents.py --mode strategy

# Terminal 2
python ai_agents.py --mode coach

# Terminal 3
python ai_agents.py --mode anomaly

# Terminal 4
python agent_integration.py --mode live
```

### 3. Run Tests
```bash
python test_agents_on_maps.py
```

## What Gets Tested

### Strategy Agent
- **Input**: Telemetry with high tire wear
- **Expected Output**: Pit strategy recommendations
- **Confidence**: Should be >85% for actionable decisions

### Coach Agent
- **Input**: Telemetry with aggressive driving patterns
- **Expected Output**: Driver coaching feedback
- **Focus**: Sector-specific technique improvements

### Anomaly Detective
- **Input**: Telemetry with sensor glitches or incidents
- **Expected Output**: Safety alerts
- **Severity**: Critical warnings for sensor issues

## Expected Results

For each track, you should see:
- **5-10 decisions per track** (depending on scenarios)
- **Mix of decision types**: pit, coach, anomaly
- **Track-specific insights**: Each track has different characteristics
- **Confidence scores**: All decisions include confidence levels
- **Reasoning**: Human-readable explanations for each decision

## Output Example

```
============================================================
Testing: Circuit of the Americas (cota)
============================================================

  Scenario: High tire wear (should trigger pit strategy)
    ✓ Sent telemetry: Lap 10, Distance 0m
    ✓ Sent telemetry: Lap 11, Distance 200m
    ...

  Waiting for agent decisions...
  ✓ Collected 3 decisions

Circuit of the Americas (cota):
  Total decisions: 3
    • Recommend pit lap 12
      Type: pit, Confidence: 87.5%
    • High cornering load detected in Sector 2
      Type: coach, Confidence: 80.0%
    • Alert: sensor_glitch
      Type: anomaly, Confidence: 95.0%
```

## Advanced Usage

### Test Single Track
```bash
python test_agents_on_maps.py --track cota
```

### Monitor Real-Time
```bash
python test_agents_on_maps.py --mode monitor
```

### Custom Redis URL
```bash
python test_agents_on_maps.py --redis-url redis://localhost:6380
```

## Integration with PDF Maps

The test script generates telemetry data that references the track names corresponding to the 7 PDF maps:

- The telemetry includes `track` field matching the track IDs
- Agents process this telemetry and make decisions
- Decisions are track-specific and can be displayed alongside the PDF maps in the frontend

## Next Steps

After running tests:

1. **Review Results**: Check that agents are making appropriate decisions
2. **Verify Confidence**: Ensure confidence levels are reasonable
3. **Check Reasoning**: Review agent explanations
4. **Frontend Integration**: Connect decisions to track map displays
5. **Production Testing**: Run with real telemetry data

## Troubleshooting

See `TEST_7_MAPS.md` for detailed troubleshooting steps.

Common issues:
- Redis not running → Start with Docker or `redis-server`
- Agents not responding → Check all 4 processes are running
- No decisions → Verify telemetry is flowing through streams

## Files Reference

- **PDF Maps**: Located in `public/track-maps/` and root directory
- **Test Script**: `ai_agents/test_agents_on_maps.py`
- **Quick Test**: `ai_agents/quick_test.py`
- **Documentation**: `ai_agents/TEST_7_MAPS.md`

---

**Status**: ✅ Ready to test

All scripts are created, tested, and ready to use. Follow the quick start guide to begin testing the AI agents on all 7 track maps!

