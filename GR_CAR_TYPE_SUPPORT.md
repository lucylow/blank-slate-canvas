# GR Car Type Support - Implementation Summary

This document summarizes the implementation of multi-car type support for the Toyota GR Cup telemetry dashboard, allowing users to view and compare telemetry data from different GR car models (GR Supra, GR Yaris, GR86, GR Corolla).

## Files Created

### 1. `/src/constants/cars.ts`
- **Purpose**: Centralized car type constants with colors and metadata
- **Exports**:
  - `GR_CARS`: Array of car configurations (id, name, color, shortName)
  - `GR_CAR_MAP`: Quick lookup map by car ID
  - `DEFAULT_VISIBLE_CARS`: Default visibility state (all visible)
  - `getCarConfig()`: Helper to get car config by ID

### 2. `/src/components/CarTypeToggle.tsx`
- **Purpose**: Reusable UI components for car type filtering and display
- **Components**:
  - `CarTypeToggle`: Toggle buttons/checkboxes to show/hide cars (3 variants: buttons, checkboxes, compact)
  - `CarTypeLegend`: Color-coded legend showing all car types
  - `CarTypeBadge`: Badge component to display car type (default or compact variant)

## Files Modified

### 1. `/src/lib/driverProfiles.ts`
- Added `carType?: GRCarId` field to `DriverProfile` interface
- Updated driver profiles to include car type assignments
- Updated `toDriverFormat()` to include car type

### 2. `/src/components/telemetry/DriverList.tsx`
- Added `CarTypeBadge` import
- Display car type badges next to driver names
- Shows compact car type indicator for each driver

### 3. `/src/components/telemetry/TelemetryCharts.tsx`
- **Major Enhancement**: Added multi-car comparison mode
- **Features**:
  - Toggle between single-car and multi-car comparison modes
  - Filter telemetry by visible car types
  - Display multiple car lines on same chart with distinct colors
  - Color-coded lines matching car type colors
  - Car type toggle controls and legend
  - Supports all telemetry metrics (speed, throttle, brake, gear, rpm)

### 4. `/src/hooks/useTelemetry.tsx`
- Added car type filtering capabilities
- **New State**:
  - `visibleCars`: Record tracking which car types are visible
  - `filteredTelemetryData`: Memoized filtered telemetry based on visible cars
  - `filteredDrivers`: Memoized filtered drivers based on visible cars
- **New Functions**:
  - `toggleCarVisibility()`: Toggle visibility of specific car type
  - `setVisibleCars()`: Set visibility state for all cars

## Features Implemented

### 1. Car Type Filtering
- Toggle visibility of each car type (GR Supra, GR Yaris, GR86, GR Corolla)
- Multiple UI variants: buttons, checkboxes, compact badges
- Persistent filtering across telemetry charts and driver lists

### 2. Multi-Car Telemetry Comparison
- Switch between single-car and multi-car view modes
- Overlay multiple car telemetry lines on same chart
- Color-coded visualization matching car type colors:
  - GR Supra: Red (#EF4444)
  - GR Yaris: Green (#10B981)
  - GR86: Blue (#3B82F6)
  - GR Corolla: Orange/Amber (#F59E0B)

### 3. Driver List Enhancements
- Car type badges displayed next to driver names
- Visual indicators for quick car type identification
- Filtered driver list based on visible car types

### 4. Telemetry Data Structure
- Extended telemetry data to include `carType` field
- Support for car type in driver profiles
- Backward compatible with existing data (carType is optional)

## Usage Examples

### Basic Car Type Toggle
```tsx
import { CarTypeToggle } from '@/components/CarTypeToggle';
import { useTelemetry } from '@/hooks/useTelemetry';

function MyComponent() {
  const { visibleCars, toggleCarVisibility } = useTelemetry();
  
  return (
    <CarTypeToggle
      visibleCars={visibleCars}
      onToggle={toggleCarVisibility}
      variant="buttons" // or "checkboxes" or "compact"
    />
  );
}
```

### Car Type Badge
```tsx
import { CarTypeBadge } from '@/components/CarTypeToggle';

function DriverCard({ carType }) {
  return (
    <div>
      <span>Driver Name</span>
      <CarTypeBadge carId={carType} variant="compact" />
    </div>
  );
}
```

### Filtered Telemetry Data
```tsx
import { useTelemetry } from '@/hooks/useTelemetry';

function MyChart() {
  const { filteredTelemetryData, visibleCars } = useTelemetry();
  
  // Use filteredTelemetryData which only includes visible car types
  return <LineChart data={filteredTelemetryData} />;
}
```

## Integration Points

### Backend API
To fully support car types, the backend should:
1. Include `car_type` or `carType` field in telemetry data
2. Map vehicle IDs/chassis numbers to car types
3. Provide car type metadata via `/api/car-types` endpoint (optional)

### Data Format
Expected telemetry data format:
```typescript
{
  timestamp: number;
  speed: number;
  throttle: number;
  brake: number;
  gear: number;
  rpm: number;
  carType?: 'supra' | 'yaris' | 'gr86' | 'corolla';
  carNumber?: string;
  // ... other fields
}
```

## Future Enhancements

1. **Car-Specific Analytics**: Tire wear patterns, performance characteristics per car type
2. **Strategy Console**: Car-specific strategy recommendations based on model strengths
3. **Track-Specific Insights**: Leverage car comparison data to show track-specific advantages
4. **Export/Filter**: Export telemetry data filtered by car type
5. **Car Type Distribution**: Statistics showing car type distribution in the field

## Notes

- All car type support is backward compatible - existing code works without car types
- Car type is optional in all data structures
- Default visibility shows all car types
- Filtering is applied consistently across all telemetry visualizations

