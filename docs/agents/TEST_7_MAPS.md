# Testing AI Agents on 7 Track Maps

This guide shows how to test the AI agents on all 7 track PDF maps.

## Quick Start

### 1. Start Redis

```bash
# Option A: Docker (Recommended)
docker run -d --name pitwall-redis -p 6379:6379 redis:7

# Option B: Direct
redis-server
```

### 2. Start AI Agents (4 terminals)

**Terminal 1: Strategy Agent**
```bash
cd ai_agents
python ai_agents.py --mode strategy
```

**Terminal 2: Coach Agent**
```bash
cd ai_agents
python ai_agents.py --mode coach
```

**Terminal 3: Anomaly Detective**
```bash
cd ai_agents
python ai_agents.py --mode anomaly
```

**Terminal 4: Integration Layer**
```bash
cd ai_agents
python agent_integration.py --mode live
```

### 3. Run Test Script

**Terminal 5: Run Tests**
```bash
cd ai_agents
python test_agents_on_maps.py
```

## Test Scenarios

The test script generates telemetry for each track with 4 scenarios:

1. **Normal Racing** - Regular conditions
2. **High Tire Wear** - Should trigger pit strategy recommendations
3. **Aggressive Driving** - Should trigger driver coaching
4. **Sensor Anomaly** - Should trigger anomaly detection alerts

## Tracks Tested

1. **Barber Motorsports Park** (`barber`)
2. **Circuit of the Americas** (`cota`)
3. **Indianapolis Motor Speedway** (`indianapolis`)
4. **Road America** (`road_america`)
5. **Sebring International Raceway** (`sebring`)
6. **Sonoma Raceway** (`sonoma`)
7. **Virginia International Raceway** (`vir`)

## Test Options

### Test All Tracks
```bash
python test_agents_on_maps.py
```

### Test Single Track
```bash
python test_agents_on_maps.py --track cota
```

### Monitor Real-Time Decisions
```bash
python test_agents_on_maps.py --mode monitor
```

## Expected Results

For each track, you should see:

- **Strategy Agent Decisions**: Pit recommendations when tire wear is high
- **Coach Agent Decisions**: Driving technique feedback for aggressive scenarios
- **Anomaly Detective Decisions**: Safety alerts for sensor glitches or incidents

## Troubleshooting

### No Decisions Appearing?

1. **Check Redis is running:**
   ```bash
   redis-cli PING
   ```

2. **Check agents are registered:**
   ```bash
   redis-cli HGETALL agents.registry
   ```

3. **Check telemetry stream:**
   ```bash
   redis-cli XLEN telemetry.stream
   ```

4. **Check results stream:**
   ```bash
   redis-cli XLEN results.stream
   ```

5. **Monitor Redis streams:**
   ```bash
   redis-cli XREAD BLOCK 0 STREAMS results.stream 0
   ```

### Agents Not Responding?

- Make sure all 4 agent processes are running
- Check for errors in agent terminal windows
- Verify Redis connection: `redis-cli PING` should return `PONG`

## Output Format

The test script will display:

```
============================================================
Testing: Circuit of the Americas (cota)
============================================================

  Scenario: Normal racing conditions
    ✓ Sent telemetry: Lap 10, Distance 0m
    ✓ Sent telemetry: Lap 11, Distance 200m
    ...

  Scenario: High tire wear (should trigger pit strategy)
    ✓ Sent telemetry: Lap 10, Distance 0m
    ...

  Waiting for agent decisions...
  ✓ Collected 3 decisions

============================================================
TEST SUMMARY
============================================================

Circuit of the Americas (cota):
  Total decisions: 3
    • Recommend pit lap 12
      Type: pit, Confidence: 87.5%
    • High cornering load detected in Sector 2
      Type: coach, Confidence: 80.0%
    • Alert: sensor_glitch
      Type: anomaly, Confidence: 95.0%

TOTAL DECISIONS: 21
  • Pit Strategy: 7
  • Coaching: 7
  • Anomalies: 7
============================================================
```

## Next Steps

After testing:

1. Review agent decisions for each track
2. Verify agents are making appropriate recommendations
3. Check confidence levels and reasoning
4. Integrate with frontend to display decisions in real-time

## Notes

- The test generates synthetic telemetry data
- Each track has different base speeds and characteristics
- Agents process telemetry asynchronously
- Decisions are stored in Redis for retrieval

