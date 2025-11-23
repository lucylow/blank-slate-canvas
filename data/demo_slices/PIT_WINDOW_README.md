# Pit Window Optimization - Demo Data Explanation

## Overview

The pit-window system helps racing teams determine the **optimal lap range** for pit stops by comparing two strategies:
1. **Pit Now** - Stop immediately
2. **Stay Out** - Continue racing

## How It Works

### Key Metrics

#### `pit_now_delta` (Time Delta for Pitting Now)
- **Negative value** = Pitting now is **FASTER** (saves time)
- **Positive value** = Pitting now is **SLOWER** (loses time)
- Example: `-3.8` means pitting now saves 3.8 seconds vs staying out

#### `stay_out_delta` (Time Delta for Staying Out)
- **Positive value** = Staying out is **SLOWER** (loses time)
- **Negative value** = Staying out is **FASTER** (saves time)
- Example: `1.2` means staying out loses 1.2 seconds vs pitting now

#### Risk Percentages
- `pit_now_risk`: Risk of pitting now (traffic, timing, etc.)
- `stay_out_risk`: Risk of staying out (tire failure, performance loss)
- Lower risk = better strategy

### Optimal Pit Window

The `pit_window_optimal` field provides the recommended lap range:
```json
"pit_window_optimal": [15, 17]
```

This means:
- **Lap 15** = Window opens (earliest recommended pit)
- **Lap 17** = Window closes (latest recommended pit)
- Pitting within this range maximizes race performance

### Decision Logic

**Pit Now if:**
- `pit_now_delta` is negative (saves time)
- `pit_now_risk` is low (< 30%)
- Current lap is within or approaching optimal window
- Tire wear is accelerating (> 70%)

**Stay Out if:**
- `stay_out_delta` is negative (staying out saves time)
- `stay_out_risk` is low
- Current lap is before optimal window
- Tire wear is still manageable (< 60%)

## Example Scenario (from pit_window_demo.json)

```json
{
  "current_lap": 14,
  "tire_wear": 72%,
  "pit_now_delta": -3.8,    // Pitting now saves 3.8s
  "stay_out_delta": 1.2,    // Staying out loses 1.2s
  "pit_window_optimal": [15, 17]
}
```

**Analysis:**
- ✅ Pitting now saves 3.8 seconds
- ✅ Staying out loses 1.2 seconds
- ✅ Optimal window starts next lap (15)
- ✅ Tire wear at 72% (approaching critical)

**Recommendation:** **Pit Now** (lap 14-15)

## Top Features Explained

The system identifies the most important factors affecting pit window timing:

1. **TireTempFL** (45% weight) - Front-left tire temperature
   - High temp = accelerated wear = pit soon

2. **sector2_stress** (30% weight) - High-stress sector impact
   - Stressful sectors cause faster degradation

3. **lap_speed_variance** (25% weight) - Lap time consistency
   - Increasing variance = tire degradation = pit window approaching

## Using the Demo Data

The `pit_window_demo.json` file contains:
- Mock predictions showing optimal pit timing
- Explanatory comments for each field
- Scenario context (lap, position, tire wear)
- Strategy recommendation with reasoning

### Loading Demo Data

```typescript
// Frontend component loads from:
fetch(`${backendUrl}/demo/seed/pit_window_demo.json`)
  .then(r => r.json())
  .then(data => {
    // data.predictions.pit_now_delta
    // data.pit_window_optimal
    // data.strategy_recommendation
  });
```

### Backend Endpoint

```bash
# List all demo seeds
GET /demo/seed

# Load pit window demo
GET /demo/seed/pit_window_demo
```

## Real-World Application

In a live race:
1. System continuously monitors tire wear, temperature, and track position
2. Monte Carlo simulation runs 10,000+ strategy scenarios
3. Compares pit-now vs stay-out outcomes
4. Recommends optimal window based on:
   - Tire degradation curves
   - Traffic conditions
   - Track position
   - Fuel strategy
   - Weather conditions

## Model Information

- **Model Version:** `tire-v1.0`
- **Type:** Physics-informed ML model
- **Training Data:** Historical GR Cup race data
- **Confidence Interval:** 90% (ci_5 to ci_95)
- **Update Frequency:** Real-time (every lap)

## Demo Data Files

### `pit_window_demo.json`
Standalone pit window demo data with predictions, explanations, and scenario context. Used by the PitWindowCard component.

**Structure:**
- `predictions` - Pit now vs stay out deltas and risks
- `explanation` - Top features and confidence intervals
- `pit_window_optimal` - Recommended lap range [start, end]
- `scenario_context` - Current race situation
- `strategy_recommendation` - Action recommendation with reasoning

### `pit_window_dashboard_example.json`
Example dashboard API response showing how pit window data appears in the main dashboard endpoint. This matches the format used by StrategyProvider and other frontend components.

**Key Fields:**
- `tire_wear.pit_window_optimal` - Array [15, 17] indicating optimal lap range
- `tire_wear.predicted_laps_remaining` - Laps until critical tire wear
- `strategy.strategies` - Multiple strategy options with expected outcomes

## Related Files

- `src/components/PitWindowCard.tsx` - UI component displaying pit window insights
- `src/components/PitWindowDemo.tsx` - Demo component with mode toggle
- `src/hooks/useStrategy.tsx` - Strategy hook using pit_window_optimal
- `app/routes/demo.py` - Backend endpoint serving demo data
- `src/api/pitwall.ts` - TypeScript interfaces for pit window data

