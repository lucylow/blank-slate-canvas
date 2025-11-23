# AI Hooks Documentation

This directory contains React hooks for accessing AI-powered analytics features from the PitWall AI backend.

## Quick Start

```typescript
import { useAIDashboard, useAITireWear, useAIStrategy } from "@/hooks/useAI";
```

## Available Hooks

### 1. `useAIDashboard` - Complete Dashboard Data

Fetches all dashboard data in one call: tire wear, performance, gap analysis, and strategy.

```typescript
const { data, isLoading, error, refetch } = useAIDashboard(
  "sebring",  // track
  1,          // race number
  7,          // vehicle number
  12,         // current lap
  {
    refetchInterval: 5000,  // Auto-refresh every 5 seconds
    enhanced: true          // Use enhanced predictor with explainability
  }
);

if (data) {
  console.log(data.tire_wear);      // Tire wear data
  console.log(data.performance);    // Performance metrics
  console.log(data.gap_analysis);   // Gap analysis
}
```

### 2. `useAITireWear` - Tire Wear Predictions

Get AI-powered tire wear predictions with confidence scores and explainability.

```typescript
const { data, isLoading, error } = useAITireWear(
  "sebring",  // track
  1,          // race
  7,          // vehicle
  12,         // lap
  {
    refetchInterval: 10000  // Refresh every 10 seconds
  }
);

if (data?.data) {
  const tireWear = data.data;
  console.log(tireWear.front_left);           // Front left tire wear %
  console.log(tireWear.confidence);           // Prediction confidence
  console.log(tireWear.top_features);         // Top contributing features
  console.log(tireWear.pit_window_optimal);   // Recommended pit window
}
```

**Manual Refresh:**
```typescript
const mutation = useAITireWearMutation();

mutation.mutate({
  track: "sebring",
  race: 1,
  vehicle_number: 7,
  lap: 12
});
```

### 3. `useAIPerformance` - Performance Analysis

Analyze driver performance metrics.

```typescript
const { data, isLoading } = useAIPerformance(
  "sebring",
  1,
  7,
  12
);

if (data?.data) {
  const perf = data.data;
  console.log(perf.current_lap);      // Current lap time
  console.log(perf.best_lap);          // Best lap time
  console.log(perf.gap_to_leader);     // Gap to leader
  console.log(perf.predicted_finish);  // Predicted finish position
  console.log(perf.position);          // Current position
}
```

### 4. `useAIStrategy` - Strategy Optimization

Get AI-optimized race strategy recommendations.

```typescript
const { data, isLoading } = useAIStrategy(
  "sebring",      // track
  1,              // race
  7,              // vehicle
  12,             // current lap
  25,             // total laps
  3,              // current position
  12,             // tire laps (age of current tires)
  {
    refetchInterval: 30000  // Refresh every 30 seconds
  }
);

if (data?.data) {
  const strategy = data.data;
  console.log(strategy.recommended_strategy);  // "Early pit", "Late pit", etc.
  console.log(strategy.strategies);            // Array of ranked strategies
  strategy.strategies.forEach(s => {
    console.log(s.name);           // Strategy name
    console.log(s.pit_lap);        // Recommended pit lap
    console.log(s.confidence);     // Confidence score
    console.log(s.reasoning);      // Explanation
  });
}
```

**What-If Scenarios:**
```typescript
const mutation = useAIStrategyMutation();

// Test different strategy parameters
mutation.mutate({
  track: "sebring",
  race: 1,
  vehicle_number: 7,
  current_lap: 12,
  total_laps: 25,
  current_position: 3,
  tire_laps: 15  // What if we push tires 3 more laps?
});
```

### 5. `useAIGapAnalysis` - Gap Analysis

Real-time gap calculations to competitors.

```typescript
const { data, isLoading } = useAIGapAnalysis(
  "sebring",
  1,
  7,
  12,
  {
    refetchInterval: 5000  // Refresh every 5 seconds for live gaps
  }
);

if (data?.data) {
  const gaps = data.data;
  console.log(gaps.gap_to_leader);         // Gap to race leader
  console.log(gaps.gap_to_ahead);           // Gap to car ahead
  console.log(gaps.gap_to_behind);          // Gap to car behind
  console.log(gaps.overtaking_opportunity);  // True if < 1.0s gap ahead
  console.log(gaps.under_pressure);         // True if < 1.0s gap behind
  console.log(gaps.closing_rate_ahead);      // Rate of closing on car ahead
}
```

### 6. `useAIModelEval` - Model Evaluation

Evaluate AI model performance (RMSE, MAE, calibration).

```typescript
// Evaluate specific track/race/vehicle
const { data, isLoading } = useAIModelEval(
  "sebring",  // track (optional - omit for all tracks)
  1,          // race (optional)
  7,          // vehicle (optional)
  {
    maxLaps: 20  // Maximum laps to evaluate
  }
);

if (data?.data) {
  // Single track evaluation
  if ('rmse' in data.data) {
    console.log(data.data.rmse);  // Root Mean Square Error
    console.log(data.data.mae);   // Mean Absolute Error
  }
  
  // All tracks evaluation
  if ('tracks' in data.data) {
    Object.entries(data.data.tracks).forEach(([trackId, stats]) => {
      console.log(`${trackId}: RMSE=${stats.rmse}, MAE=${stats.mae}`);
    });
    console.log(data.data.summary.overall_rmse);
  }
}
```

## Common Patterns

### Loading States

```typescript
const { data, isLoading, error } = useAIDashboard(track, race, vehicle, lap);

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;

// Use data...
```

### Conditional Fetching

```typescript
const { data } = useAIDashboard(
  track,
  race,
  vehicle,
  lap,
  {
    enabled: !!track && !!race && vehicle > 0 && lap > 0  // Only fetch when all params available
  }
);
```

### Manual Refresh

```typescript
const { data, refetch } = useAIDashboard(track, race, vehicle, lap);

// Manual refresh button
<Button onClick={() => refetch()}>Refresh</Button>
```

### Combining Multiple Hooks

```typescript
// Use dashboard for overview, individual hooks for detailed views
const dashboard = useAIDashboard(track, race, vehicle, lap);
const tireWear = useAITireWear(track, race, vehicle, lap, {
  enabled: showTireDetails  // Only fetch when needed
});
```

## Features

- ✅ **Automatic Caching** - React Query handles caching and stale data
- ✅ **Auto-refresh** - Configurable refetch intervals for live data
- ✅ **Error Handling** - Built-in error states and retry logic
- ✅ **TypeScript** - Full type safety with exported interfaces
- ✅ **Demo Mode** - Automatically handles demo mode detection
- ✅ **Optimistic Updates** - Ready for optimistic UI updates
- ✅ **Query Invalidation** - Mutations automatically invalidate related queries

## Type Exports

All types are exported from `@/hooks/useAI`:

```typescript
import type {
  DashboardData,
  TireWearData,
  PerformanceMetrics,
  GapAnalysis,
  StrategyOptimization,
  TireWearRequest,
  PerformanceRequest,
  StrategyRequest,
} from "@/hooks/useAI";
```


