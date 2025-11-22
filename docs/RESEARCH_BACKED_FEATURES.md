# Research-Backed AI Features

This document describes the research-backed AI features implemented in PitWall A.I., based on academic research and industry best practices in motorsports AI.

## Overview

PitWall A.I. now includes four key research-backed components that enhance trust, explainability, and strategic decision-making:

1. **Confidence Indicators** - Model uncertainty and trust metrics
2. **Explainability Cards** - Feature attribution and transparency
3. **Driver Coaching Insights** - Anomaly detection and performance analysis
4. **Competitor Modeling** - Strategic advantage through competitor prediction

## Components

### 1. ConfidenceIndicator

**Research Basis:** "The Algorithms on the Pit Wall" (BoxThisLap) - Trust in telemetry-based strategy depends heavily on explainability and confidence metrics.

**Features:**
- Confidence levels (High/Medium/Low) with visual indicators
- 95% confidence intervals for uncertainty quantification
- Model version tracking for reproducibility
- Progress bars showing confidence percentage

**Usage:**
```tsx
import { ConfidenceIndicator } from "@/components/dashboard/ConfidenceIndicator";

<ConfidenceIndicator
  confidence={0.85}  // 0-1 or 0-100
  ciLower={{ front_left: 72, front_right: 78 }}
  ciUpper={{ front_left: 82, front_right: 88 }}
  modelVersion="v2.1.0"
  showDetails={true}
/>
```

### 2. ExplainabilityCard

**Research Basis:** "Explainable Time Series Prediction of Tyre Energy in Formula One Race Strategy" (arXiv) - Providing 'why' alongside 'what' is essential for engineer trust.

**Features:**
- Top N features influencing predictions
- Feature importance scores with visual indicators
- Positive/negative impact indicators
- Actionable insights for engineers

**Usage:**
```tsx
import { ExplainabilityCard } from "@/components/dashboard/ExplainabilityCard";

<ExplainabilityCard
  topFeatures={{
    "tire_temperature": 0.85,
    "lateral_g_force": -0.62,
    "brake_pressure": 0.48
  }}
  maxFeatures={3}
  showImpact={true}
/>
```

### 3. DriverCoachingCard

**Research Basis:** "AI Auto Insights" (Coach Dave Academy) and anomaly detection research (STREAM-VAE, arXiv) - Corner-by-corner performance analysis with actionable feedback.

**Features:**
- Sector-by-sector time loss analysis
- Anomaly detection (lockups, early lifts, understeer)
- Consistency scoring
- Actionable coaching feedback

**Usage:**
```tsx
import { DriverCoachingCard } from "@/components/dashboard/DriverCoachingCard";

<DriverCoachingCard
  sectors={[
    { sector: 1, timeLost: 0.12, issue: "Early braking in Turn 3" },
    { sector: 2, timeLost: 0.31, issue: "Understeer in high-speed section" }
  ]}
  consistency={95.2}
  anomalies={[
    {
      type: "lockup",
      sector: 1,
      severity: "high",
      timeImpact: 0.22,
      description: "Front brake lockup in Sector 1, Turn 2"
    }
  ]}
  showDetails={true}
/>
```

### 4. CompetitorModelingCard

**Research Basis:** Industry practice (Mercia AI, F1 strategy) - Top teams model competitor behavior for strategic advantage.

**Features:**
- Predicted competitor pit timing
- Undercut/overcut window identification
- Confidence levels for predictions
- Strategic insights

**Usage:**
```tsx
import { CompetitorModelingCard } from "@/components/dashboard/CompetitorModelingCard";

<CompetitorModelingCard
  competitors={[
    {
      vehicleNumber: 13,
      predictedPitLap: 15,
      confidence: 0.75,
      typicalStintLength: 14,
      tireHardness: "medium"
    }
  ]}
  currentLap={12}
  showUndercutWindow={true}
/>
```

## Integration Example

Use the `ResearchBackedFeatures` container component to display all features together:

```tsx
import { ResearchBackedFeatures } from "@/components/dashboard/ResearchBackedFeatures";
import type { TireWearData } from "@/api/pitwall";

<ResearchBackedFeatures
  tireWear={tireWearData}  // Includes confidence, ci_lower, ci_upper, top_features
  currentLap={12}
  vehicleNumber={7}
/>
```

## API Integration

The components are designed to work with the existing `TireWearData` interface from `@/api/pitwall`:

```typescript
interface TireWearData {
  front_left: number;
  front_right: number;
  rear_left: number;
  rear_right: number;
  predicted_laps_remaining?: number;
  pit_window_optimal?: number[];
  // Research-backed fields
  confidence?: number;
  ci_lower?: Record<string, number>;
  ci_upper?: Record<string, number>;
  top_features?: Record<string, number>;
  model_version?: string;
}
```

## Research References

1. **"The Algorithms on the Pit Wall"** - BoxThisLap
   - Trust in telemetry-based strategy depends on explainability and confidence metrics

2. **"Explainable Time Series Prediction of Tyre Energy in Formula One Race Strategy"** - arXiv
   - Deep learning + XGBoost for tire energy prediction with explainability

3. **"AI Auto Insights"** - Coach Dave Academy
   - Corner-by-corner performance analysis and coaching insights

4. **"STREAM-VAE"** - arXiv
   - Variational autoencoder for anomaly detection in vehicle telemetry

5. **Industry Practice** - Mercia AI, F1 Strategy
   - Competitor modeling for strategic advantage

## Future Enhancements

### Medium-Term (1-7 days)
- Sequence models (TCN/LSTM) for tire degradation prediction
- Enhanced competitor modeling with ML models
- Expanded driver anomaly detection with autoencoders

### Long-Term (weeks)
- Full simulation environment for strategy (RL-based)
- Feature store and model registry (MLflow)
- Real-world competitor telemetry integration

## Benefits

1. **Trust**: Engineers can see confidence levels and uncertainty bands
2. **Transparency**: Feature attribution shows why models make predictions
3. **Actionability**: Driver coaching provides specific, actionable feedback
4. **Strategic Advantage**: Competitor modeling enables undercut/overcut opportunities

These features elevate PitWall A.I. from a hackathon demo to a credible motorsport intelligence tool aligned with academic research and industry best practices.


