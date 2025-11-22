# GR Telemetry Integration Documentation

## Overview

This integration provides comprehensive telemetry, lap times, and sensor data differences among Toyota GR Supra, GR Yaris, GR86, and GR Corolla performance models. The system enables AI agents and dashboards to incorporate car-specific performance tradeoffs for accurate real-time analysis and coaching outputs.

## Files Created

### 1. `/src/lib/grTelemetryData.ts`
**Comprehensive telemetry characteristics data structure**

Contains detailed telemetry characteristics for all four GR models:
- **GR Supra**: 382 hp RWD, dominant in high-speed sectors
- **GR Yaris**: 257-300 hp AWD, dominant in technical sectors
- **GR86**: 228 hp RWD, dominant in flowing sections
- **GR Corolla**: 300 hp AWD, balanced performance

Each model includes:
- Power and drivetrain specifications
- Telemetry patterns (throttle, brake, acceleration, cornering)
- Sector performance characteristics
- Tire wear patterns
- Brake balance patterns
- Driver input requirements
- Track-specific performance expectations

### 2. `/src/lib/grTelemetryAnalysis.ts`
**Analysis utilities for car-specific performance patterns**

Provides functions to analyze telemetry data based on car characteristics:
- `analyzeThrottlePattern()` - Checks if throttle application matches car characteristics
- `analyzeBrakePattern()` - Analyzes brake pressure patterns
- `analyzeGForcePattern()` - Analyzes G-force patterns and oversteer risk
- `analyzeSectorPerformance()` - Evaluates sector performance relative to car characteristics
- `analyzeTireWear()` - Predicts tire wear based on car and track type
- `analyzeTelemetry()` - Comprehensive telemetry analysis
- `getExpectedTelemetryRanges()` - Returns expected telemetry ranges for a car

### 3. `/src/lib/grTelemetryAgentIntegration.ts`
**AI agent integration utilities**

Provides high-level functions for AI agents to use car-specific telemetry data:
- `getCarSpecificRecommendations()` - Get recommendations for a car on a track
- `getTireWearPrediction()` - Predict tire wear based on car and track
- `getBrakeStrategy()` - Get brake strategy recommendations
- `getSequencingRecommendations()` - Get throttle/brake sequencing recommendations
- `validateTelemetryRanges()` - Compare telemetry against expected ranges
- `getAIAgentInsights()` - Comprehensive insights for AI agents

### 4. `/src/components/GRTelemetryComparison.tsx`
**React component for visualizing telemetry differences**

Interactive component with tabs for:
- **Overview**: Quick comparison of all models
- **Telemetry**: Detailed telemetry characteristics for each model
- **Sectors**: Sector-specific performance analysis
- **Tires & Brakes**: Tire wear and brake balance patterns

## Usage Examples

### For AI Agents

```typescript
import { getAIAgentInsights } from '@/lib/grTelemetryAgentIntegration';

// Get comprehensive insights for a car on a track
const insights = getAIAgentInsights(
  'GR Supra',
  'Circuit of the Americas',
  telemetryData, // optional telemetry points
  'highSpeed' // optional sector type
);

// Access specific recommendations
console.log(insights.carRecommendations.recommendations);
console.log(insights.tireWear.predictedWear);
console.log(insights.telemetryAnalysis);
```

### For Telemetry Analysis

```typescript
import { analyzeTelemetry } from '@/lib/grTelemetryAnalysis';

// Analyze telemetry data
const insights = analyzeTelemetry(
  telemetryPoints,
  'GR Yaris',
  'technical', // sector type
  'tightTwisty' // track type
);

// Insights include warnings and opportunities
insights.forEach(insight => {
  if (insight.type === 'warning') {
    // Handle warning
  }
});
```

### For Dashboard Components

```tsx
import { GRTelemetryComparison } from '@/components/GRTelemetryComparison';

function Dashboard() {
  return (
    <GRTelemetryComparison 
      selectedTrack="Sonoma Raceway"
      selectedModel="GR Yaris"
    />
  );
}
```

## Key Telemetry Characteristics

### GR Supra (382 hp RWD)
- **Throttle**: Aggressive, requires precise modulation
- **Brake**: Abrupt, higher pressures needed
- **Longitudinal Gs**: Higher due to raw power
- **Lateral Gs**: Carefully managed due to oversteer risk
- **Best For**: High-speed sectors (Road America, COTA)
- **Tire Wear**: More stress on long, high-speed tracks

### GR Yaris (257-300 hp AWD)
- **Throttle**: Smooth, consistent application
- **Brake**: Smooth, consistent pressure
- **Longitudinal Gs**: Moderate but consistent
- **Lateral Gs**: More consistent due to AWD
- **Best For**: Technical sectors (Sonoma, VIR)
- **Tire Wear**: Better management on tight, twisty courses

### GR86 (228 hp RWD)
- **Throttle**: Smooth, predictable
- **Brake**: Smooth, moderate pressures
- **Longitudinal Gs**: Lower but very smooth
- **Lateral Gs**: Very stable
- **Best For**: Flowing sections
- **Tire Wear**: Excellent temperature management

### GR Corolla (300 hp AWD)
- **Throttle**: Moderate, balanced
- **Brake**: Moderate, higher pressures in heavy zones
- **Longitudinal Gs**: Balanced between power and grip
- **Lateral Gs**: Moderated but consistent
- **Best For**: Mid-length tracks requiring stability and power
- **Tire Wear**: More stress on long, high-speed tracks

## Track-Specific Performance

The system includes track-specific performance data:
- **Road America**: Supra optimal (long straights)
- **Circuit of the Americas**: Supra optimal (high-speed sections)
- **Sonoma Raceway**: Yaris optimal (twisty, technical)
- **Virginia International**: Yaris optimal (technical)
- **Barber Motorsports Park**: Yaris optimal (technical)
- **Sebring International**: Supra optimal (long straights)
- **Indianapolis Motor Speedway**: Supra optimal (high-speed oval)

## Integration Points

### 1. Real-Time Analytics
Use `getAIAgentInsights()` in real-time telemetry processing to provide car-specific recommendations.

### 2. Tire Prediction Models
Use `getTireWearPrediction()` to incorporate car characteristics into tire wear predictions.

### 3. Strategy Agent
Use `getCarSpecificRecommendations()` to adjust race strategy based on car and track combination.

### 4. Coach Agent
Use `getSequencingRecommendations()` to provide driving technique recommendations specific to each car model.

### 5. Dashboard Visualization
Use the `GRTelemetryComparison` component to display telemetry characteristics and differences.

## References

Based on:
- Toyota GR specifications
- YouTube in-depth track tests
- GR Cup telemetry data
- Track performance analysis

## Next Steps

1. **AI Agent Integration**: Integrate `grTelemetryAgentIntegration.ts` into existing AI agents
2. **Real-Time Analysis**: Use telemetry analysis functions in live telemetry processing
3. **Dashboard Enhancement**: Add telemetry comparison to race dashboards
4. **Strategy Optimization**: Use car-specific recommendations in strategy calculations
5. **Coach Feedback**: Incorporate sequencing recommendations into driver coaching

