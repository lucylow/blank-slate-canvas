# Driver Fingerprinting System

## Overview

The Driver Fingerprinting system automatically learns unique driver behavior profiles from telemetry streams. It creates continuous behavior profiles for each driver or mission, capturing signature driving patterns including throttle usage, braking style, cornering approach, and G-force profiles.

## Features

- **Automatic Learning**: Continuously learns driver behavior from telemetry data
- **Behavioral Classification**: Classifies driving styles (aggressive/balanced/conservative)
- **Similarity Comparison**: Compare drivers using cosine similarity on fingerprint vectors
- **Real-time Updates**: Fingerprints update as new telemetry arrives
- **Comprehensive Metrics**: Tracks consistency, smoothness, aggression, and more

## Architecture

### Core Module: `driverFingerprinting.ts`

The main module provides:

- **`DriverFingerprintGenerator`**: Processes telemetry and computes fingerprints
- **`ContinuousFingerprintManager`**: Manages continuous learning and updates
- **`DriverFingerprint`**: Interface for driver behavior profiles

### React Hook: `useDriverFingerprinting.ts`

A React hook that integrates fingerprinting with your telemetry infrastructure:

```typescript
const {
  fingerprints,
  getFingerprint,
  compareDrivers,
  addTelemetry,
  recompute,
  stats,
} = useDriverFingerprinting({
  minSamples: 50,
  updateInterval: 5000,
  trackContext: 'circuit_of_the_americas',
});
```

### Component: `AutomatedDriverFingerprint.tsx`

A ready-to-use React component that displays real-time driver fingerprints:

```tsx
<AutomatedDriverFingerprint
  trackContext="circuit_of_the_americas"
  missionId="race_2024_01"
  minSamples={100}
  updateInterval={5000}
/>
```

## Usage Examples

### Basic Usage

```typescript
import { useDriverFingerprinting } from '@/hooks/useDriverFingerprinting';
import { telemetryWS } from '@/lib/api';

function MyComponent() {
  const { fingerprints, addTelemetry } = useDriverFingerprinting();

  useEffect(() => {
    const unsubscribe = telemetryWS.subscribe((point) => {
      addTelemetry([point]);
    });
    return unsubscribe;
  }, [addTelemetry]);

  // Access fingerprints
  const driverFingerprint = fingerprints.get('driver_123');
  
  return (
    <div>
      {driverFingerprint && (
        <p>Cornering Style: {driverFingerprint.corneringStyle}</p>
      )}
    </div>
  );
}
```

### Standalone Fingerprint Generation

```typescript
import { DriverFingerprintGenerator } from '@/lib/driverFingerprinting';

const telemetryData: FingerprintTelemetryPoint[] = [
  {
    timestamp: Date.now(),
    throttle: 0.8,
    brake: 0.05,
    steeringAngle: -12,
    speedKmh: 150,
    gear: 4,
    rpm: 7000,
    longitudinalG: 0.6,
    lateralG: 0.4,
    brakePressure: 0.1,
    sector: 1,
    lap: 10,
    driverId: 'Driver_A',
  },
  // ... more points
];

const generator = new DriverFingerprintGenerator(telemetryData);
const fingerprints = generator.computeDriverFingerprints();

fingerprints.forEach((fp) => {
  console.log(`Driver: ${fp.driverId}`);
  console.log('Cornering Style:', fp.corneringStyle);
  console.log('Braking Style:', fp.brakingStyle);
  console.log('Consistency:', fp.consistency);
});
```

### Comparing Drivers

```typescript
import { DriverFingerprintGenerator } from '@/lib/driverFingerprinting';

const comparison = DriverFingerprintGenerator.compareFingerprints(
  fingerprintA,
  fingerprintB
);

console.log('Similarity:', comparison.similarity); // 0-1
console.log('Differences:', comparison.differences);
console.log('Style Comparison:', comparison.styleComparison);
```

## Fingerprint Structure

Each `DriverFingerprint` contains:

### Basic Statistics
- `averageThrottle`: Average throttle usage (0-1)
- `averageBrake`: Average brake usage (0-1)
- `averageSteeringAngle`: Average steering angle magnitude
- `avgSpeed`: Average speed in km/h

### Distribution Profiles
- `rpmDistribution`: Histogram of RPM usage across buckets
- `longitudinalGProfile`: Profile of longitudinal G-forces
- `lateralGProfile`: Profile of lateral G-forces

### Behavioral Classifications
- `corneringStyle`: 'aggressive' | 'balanced' | 'conservative'
- `brakingStyle`: 'late' | 'early' | 'balanced'
- `throttleStyle`: 'smooth' | 'aggressive' | 'erratic'

### Advanced Metrics
- `consistency`: Lap time consistency (0-1)
- `smoothness`: Control input smoothness (0-1)
- `aggression`: Overall driving aggression (0-1)

### Embedding Vector
- `fingerprintVector`: Numeric vector for similarity comparison

## Configuration Options

### `FingerprintConfig`

```typescript
interface FingerprintConfig {
  rpmBucketCount?: number;           // Default: 10
  gProfileSampleSize?: number;        // Default: 100
  smoothingWindow?: number;          // Default: 5
  minSamplesForFingerprint?: number; // Default: 50
}
```

### `UseDriverFingerprintingOptions`

```typescript
interface UseDriverFingerprintingOptions {
  minSamples?: number;        // Default: 50
  updateInterval?: number;    // Default: 5000ms
  continuousLearning?: boolean; // Default: true
  trackContext?: string;
  missionId?: string;
}
```

## Research Background

This implementation is based on research in:

- **IEEE**: Driver Behavior Profiling in Simulated Racing
- **AI-enabled prediction**: Sim racing performance using telemetry data
- **Formula RL**: Deep reinforcement learning for autonomous racing
- **Behavioral Analysis**: Driving behavior in simulated racing environments

## Integration with Existing Systems

The fingerprinting system integrates with:

- `TelemetryPoint` from `@/lib/api`
- `telemetryWS` WebSocket client
- `useTelemetry` hook for telemetry context
- Existing driver profile system

## Performance Considerations

- Fingerprints are computed incrementally for efficiency
- G-force profiles are sampled to fixed sizes
- Updates are batched and throttled by `updateInterval`
- Minimum sample threshold prevents premature fingerprinting

## Future Enhancements

Potential improvements:

- Machine learning models for more sophisticated pattern recognition
- Anomaly detection based on fingerprint deviations
- Predictive models for performance forecasting
- Integration with coaching and feedback systems
- Multi-track fingerprinting with track-specific profiles


