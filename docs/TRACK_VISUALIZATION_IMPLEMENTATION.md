# Track Visualization Implementation Guide

This document describes the track visualization system implemented for the GR PitWall frontend. The system provides real-time visualization of race cars on track maps with smooth animations, telemetry overlays, and explainability features.

## Overview

The implementation includes:
- **SVG-based track map** with car markers and interactive tooltips
- **Real-time car position interpolation** for smooth animations
- **Car detail cards** with explainability (top-3 evidence features)
- **Track centerline mapping** utilities
- **Theme system** with GR brand colors
- **Demo data** for testing and development

## Files Created

### Core Components
- `src/components/TrackMapSVG.tsx` - Main SVG track map component
- `src/components/CarDetailCard.tsx` - Car detail panel with telemetry and evidence
- `src/components/TrackDashboard.tsx` - Full dashboard integration (pit wall view)

### Utilities
- `src/utils/trackUtils.ts` - Track mapping functions (lap distance → XY coordinates)
- `src/styles/theme.ts` - Design tokens and GR brand colors

### Hooks
- `src/hooks/useInterpolatedCars.ts` - Car position interpolation for smooth animation
- `src/hooks/useTrackCenterline.ts` - Load track centerline data from JSON

### Data Files
- `public/tracks/cota_centerline.json` - Sample track centerline for Circuit of the Americas
- `data/demo_slices/track-demo-positions.json` - Demo telemetry data for testing

## Quick Start

### 1. Basic Usage

```tsx
import TrackDashboard from './components/TrackDashboard';

function MyPage() {
  return (
    <TrackDashboard
      trackId="cota"
      width={1000}
      height={600}
      telemetrySource="demo" // or 'websocket' or 'api'
    />
  );
}
```

### 2. Using Components Individually

```tsx
import TrackMapSVG from './components/TrackMapSVG';
import { useTrackCenterline } from './hooks/useTrackCenterline';
import { useInterpolatedCars, useInterpolationLoop } from './hooks/useInterpolatedCars';

function CustomTrackView() {
  const { centerline } = useTrackCenterline('cota');
  const { updateFromTelemetry, interpolate, getCarsData } = useInterpolatedCars(centerline);
  useInterpolationLoop(interpolate, centerline.length > 0);
  
  const cars = getCarsData(1000, 600);
  
  // Update from telemetry source
  useEffect(() => {
    // Your telemetry update logic
    updateFromTelemetry({
      chassis: 'GR86-01',
      lap: 1,
      lapdist_m: 150.0,
      yaw: 15,
      speed_kmh: 180,
      tire_wear: 0.12,
    });
  }, []);
  
  return (
    <TrackMapSVG
      centerline={centerline}
      cars={cars}
      width={1000}
      height={600}
      onCarClick={(car) => console.log('Selected:', car)}
    />
  );
}
```

## Track Centerline Format

Track centerline JSON files should follow this structure:

```json
{
  "track": "Circuit of the Americas",
  "trackId": "cota",
  "totalLength": 5513.0,
  "centerline": [
    {"m": 0.0, "x": 0.1, "y": 0.5},
    {"m": 50.0, "x": 0.12, "y": 0.48},
    ...
  ]
}
```

- `m`: Cumulative distance in meters from start
- `x`, `y`: Normalized coordinates (0..1) or pixel coordinates
- Points should be sorted by `m` ascending

## Telemetry Data Format

Telemetry samples should match this interface:

```typescript
interface TelemetrySample {
  chassis: string;           // Car identifier
  lap?: number;              // Current lap number
  lapdist_m: number;         // Distance into current lap (meters)
  yaw?: number;              // Heading in degrees
  speed_kmh?: number;        // Speed in km/h
  tire_wear?: number;        // Tire wear (0-1)
  tire_temp_fl?: number;     // Front left tire temp (°C)
  tire_temp_fr?: number;     // Front right tire temp (°C)
  tire_temp_rl?: number;     // Rear left tire temp (°C)
  tire_temp_rr?: number;     // Rear right tire temp (°C)
  predicted_laps_to_cliff?: number; // Predicted laps until tire cliff
}
```

## WebSocket Integration

To connect to a real-time WebSocket feed:

```tsx
<TrackDashboard
  trackId="cota"
  telemetrySource="websocket"
  wsUrl="ws://localhost:8080/ws/telemetry"
/>
```

The WebSocket should send messages in this format:

```json
{
  "type": "telemetry_update",
  "data": [
    {
      "chassis": "GR86-01",
      "lap": 1,
      "lapdist_m": 150.0,
      "yaw": 15,
      "speed_kmh": 180,
      "tire_wear": 0.12
    }
  ]
}
```

## Explainability Integration

The `CarDetailCard` component displays top-3 evidence features. Provide them like this:

```tsx
const topFeatures = [
  {
    name: 'High lateral G in S4',
    contribution: 0.34,  // 0-1, normalized contribution
    description: 'Lateral acceleration exceeded 2.5g in sector 4',
    timestamp: 12345,    // Optional: for replay scrubbing
  },
  // ... more features
];

<CarDetailCard
  car={selectedCar}
  topFeatures={topFeatures}
  onFeatureClick={(feature) => {
    // Scrub replay to feature.timestamp
  }}
/>
```

## Styling & Theming

The theme system is defined in `src/styles/theme.ts`. Key colors:

- **GR Red**: `#7B1E2D` (primary brand color)
- **Critical**: `#FF3B30` (high tire wear)
- **Warning**: `#FFB74D` (moderate wear)
- **Healthy**: `#37D67A` (good condition)

Use the theme in your components:

```tsx
import { theme, getTireWearColor } from '../styles/theme';

const color = getTireWearColor(0.65); // Returns critical color
```

## Performance Considerations

### SVG vs Canvas

- **SVG** (current implementation): Best for <30 cars, interactive UI, easy styling
- **Canvas** (future): Better for >50 cars, high update rates (50-200Hz)

### Optimization Tips

1. **Throttle updates**: Update React state at 2-5Hz, use refs for high-rate visual updates
2. **Interpolation**: The `useInterpolatedCars` hook smooths sparse updates automatically
3. **Memoization**: Track path is memoized in `TrackMapSVG`
4. **RequestAnimationFrame**: Interpolation runs on RAF for smooth 60fps

## Next Steps (Future Enhancements)

1. **Canvas Implementation**: Create `TrackCanvas.tsx` for high-performance rendering
2. **Replay Mode**: Add timeline scrubber and frame-by-frame playback
3. **Mini-map**: Small overview map with viewport indicator
4. **Sector Heatmaps**: Visualize tire stress by sector
5. **Predicted Paths**: Show dashed lines for predicted car positions
6. **Keyboard Navigation**: Arrow keys to select cars, Space to pause
7. **Accessibility**: ARIA labels, keyboard navigation, colorblind-friendly palette

## Testing

### Demo Mode

The dashboard includes a demo mode that loads sample data:

```tsx
<TrackDashboard trackId="cota" telemetrySource="demo" />
```

### Unit Tests

Test track utilities:

```typescript
import { pointAtDistance } from './utils/trackUtils';

const centerline = [
  { m: 0, x: 0, y: 0 },
  { m: 100, x: 1, y: 0 },
];

const point = pointAtDistance(centerline, 50);
// Should return { x: 0.5, y: 0, segmentIndex: 0, segmentT: 0.5 }
```

## Troubleshooting

### Cars not appearing
- Check that `centerline` has data
- Verify `lapdist_m` is within track bounds
- Check browser console for errors

### Jittery animation
- Ensure `useInterpolationLoop` is enabled
- Check that telemetry updates are frequent enough (10-20Hz recommended)
- Verify interpolation is running (check RAF in DevTools)

### Track not loading
- Verify JSON file exists at `/tracks/{trackId}_centerline.json`
- Check JSON format matches expected structure
- Check browser network tab for 404 errors

## API Integration

To integrate with your backend API:

```tsx
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch('/api/telemetry/live');
    const data = await response.json();
    data.forEach((sample: TelemetrySample) => {
      updateFromTelemetry(sample);
    });
  }, 100); // 10Hz updates
  
  return () => clearInterval(interval);
}, [updateFromTelemetry]);
```

## References

- Design reference: `/mnt/data/2 Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .md`
- Track geometry: Precomputed centerlines in `public/tracks/`
- Demo data: `data/demo_slices/track-demo-positions.json`

