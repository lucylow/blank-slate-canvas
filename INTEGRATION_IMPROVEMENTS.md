# Frontend↔Backend Integration Improvements

This document outlines the improvements made to create a robust, testable, and interactive frontend↔backend integration for PitWall AI.

## ✅ Completed Improvements

### 1. Robust WebSocket Hook (`src/hooks/useWebSocket.ts`)
- **Batching**: Reduces React re-renders by batching messages (default 80ms)
- **Deduplication**: Prevents duplicate messages from flooding the UI
- **Exponential Backoff**: Automatic reconnection with exponential backoff (up to 10s)
- **Ring Buffer**: Maintains a rolling buffer of messages (configurable max size)
- **Message Count**: Returns message count for UI indicators
- **Demo Mode Support**: Handles empty URLs gracefully for demo mode

### 2. Axios Client with Retry Logic (`src/api/client.ts`)
- **Base URL Configuration**: Uses `VITE_API_BASE` environment variable
- **Automatic Retries**: Retries failed GET requests up to 2 times with exponential backoff
- **Timeout Handling**: 8-second timeout for all requests
- **Request Logging**: Development-mode logging for debugging
- **Error Handling**: Proper error propagation with context

### 3. Updated API Functions (`src/api/pitwall.ts`)
- **TypeScript Types**: Full type definitions for all API responses
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **New Functions**:
  - `getModels()`: Fetch available model versions
  - `checkHealth()`: Health check endpoint
  - `simulateStrategy()`: POST endpoint for strategy simulation
- **Improved `predictMultiple()`**: Better error handling for parallel requests

### 4. React Query Integration (`src/hooks/usePrediction.ts`)
- **Automatic Caching**: React Query handles caching and stale data
- **Auto-refresh**: Configurable refetch intervals (default 5s)
- **Loading States**: Built-in loading, error, and success states
- **Retry Logic**: Automatic retries with exponential backoff
- **Optimistic Updates**: Ready for optimistic UI updates

### 5. MSW Mock Handlers (`src/mocks/`)
- **Offline Support**: Full mock API responses for offline/demo mode
- **Realistic Data**: Mock predictions with feature scores and explanations
- **Network Simulation**: Simulated network delays for realism
- **Multiple Tracks**: Mock data for all 7 GR Cup tracks
- **Health Endpoint**: Mock health check with model versions

### 6. Demo Mode Toggle (`src/components/DemoModeToggle.tsx`)
- **UI Toggle**: Switch component for enabling/disabling demo mode
- **LocalStorage Persistence**: Remembers user preference
- **Visual Indicators**: Clear badges showing "Mock API" vs "Live API"
- **Tooltips**: Helpful tooltips explaining demo mode

### 7. Enhanced Connection Indicators
- **Message Count**: Shows number of buffered telemetry points
- **Demo Mode Badge**: Clear indication when in demo mode
- **Connection States**: Visual feedback for connected/connecting/offline
- **Animated Indicators**: Pulse animations for live connections

## 🎯 API Contract

### REST Endpoints

#### `GET /health`
Returns server health and model versions.

**Response:**
```json
{
  "ok": true,
  "model_versions": {
    "cota": "v1.2.3",
    "road_america": "v1.2.3"
  },
  "timestamp": "2025-11-20T18:02:00Z"
}
```

#### `GET /models`
Returns available models per track.

**Response:**
```json
{
  "cota": "v1.2.3",
  "road_america": "v1.2.3"
}
```

#### `GET /predict_tire/{track}/{chassis}`
Returns tire wear prediction.

**Response:**
```json
{
  "chassis": "GR86-01",
  "track": "cota",
  "predicted_loss_per_lap_s": 0.34,
  "laps_until_0_5s_loss": 1.47,
  "recommended_pit_lap": 8,
  "feature_scores": [
    {"name": "tire_stress_S2", "score": 0.42},
    {"name": "brake_energy_S1", "score": 0.19}
  ],
  "explanation": [
    "Elevated lateral load in S2",
    "Repeated heavy braking in S1"
  ],
  "meta": {
    "model_version": "v1.2.3",
    "generated_at": "2025-11-20T18:02:00Z"
  }
}
```

#### `POST /simulate`
Simulates race strategy.

**Request:**
```json
{
  "track": "cota",
  "chassis": "GR86-01",
  "strategy": {}
}
```

### WebSocket Messages

#### Telemetry Point
```json
{
  "type": "telemetry_point",
  "meta_time": "2025-11-15T18:00:00.000Z",
  "track": "cota",
  "chassis": "GR86-01",
  "lap": 7,
  "lapdist_m": 1532.4,
  "speed_kmh": 181.3,
  "accx_can": -0.12,
  "accy_can": 0.86
}
```

## 🚀 Usage

### Environment Variables

Create a `.env` file:
```bash
VITE_API_BASE=http://localhost:8081
```

### Demo Mode

1. Toggle demo mode in the UI (header or dashboard)
2. MSW will automatically intercept API calls
3. Works completely offline with realistic mock data

### React Query Usage

```tsx
import { usePrediction } from '@/hooks/usePrediction';

function MyComponent() {
  const { data, isLoading, error } = usePrediction('cota', 'GR86-01', {
    refetchInterval: 5000,
    staleTime: 3000,
  });
  
  // data is automatically cached and refreshed
}
```

### WebSocket Usage

```tsx
import { useWebSocket } from '@/hooks/useWebSocket';

function MyComponent() {
  const { connected, messages, messageCount } = useWebSocket('ws://localhost:8081/ws', {
    batchMs: 80,
    maxBuffer: 2000,
    maxMessages: 500,
  });
  
  // messages are batched and deduplicated automatically
}
```

## 📝 Next Steps

### Recommended Enhancements

1. **WebWorker Aggregation**: Offload heavy telemetry processing to a Web Worker
2. **SSE for Streaming Explains**: Server-Sent Events for incremental feature importance
3. **Playwright E2E Tests**: Full end-to-end test suite
4. **Sentry Integration**: Error tracking and performance monitoring
5. **Prometheus Metrics**: Backend metrics for observability

### Testing Checklist

- [ ] Contract tests (Pact or Postman)
- [ ] Unit tests for WebSocket hook
- [ ] Unit tests for API client
- [ ] E2E tests with Playwright
- [ ] Load testing for WebSocket connection

## 🔧 Configuration

### WebSocket Options
- `batchMs`: Message batching interval (default: 80ms)
- `maxBuffer`: Maximum buffer size (default: 2000)
- `maxMessages`: Maximum messages in state (default: 500)

### React Query Options
- `refetchInterval`: Auto-refresh interval (default: 5000ms)
- `staleTime`: Time before data is considered stale (default: 3000ms)
- `retry`: Number of retry attempts (default: 2)

## 📚 References

- [MSW Documentation](https://mswjs.io/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Axios Documentation](https://axios-http.com/)


