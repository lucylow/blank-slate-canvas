# Frontend-Backend Integration - Complete ✅

This document provides a comprehensive overview of the frontend-backend integration for PitWall AI.

## Overview

The frontend (React + TypeScript + Vite) is fully integrated with the backend (FastAPI) running on port 8000. The integration includes:

- ✅ REST API client with retry logic and error handling
- ✅ WebSocket support for real-time telemetry streaming
- ✅ Type-safe API functions matching backend endpoints
- ✅ Automatic reconnection and error recovery
- ✅ Environment-based configuration
- ✅ Vite proxy configuration for development

## Backend Endpoints

The backend (pitwall-backend) runs on **port 8000** and provides:

### Core Endpoints

- `GET /health` - Health check
- `GET /api/tracks` - List all available tracks
- `GET /api/tracks/{track_id}` - Get specific track details
- `GET /api/tracks/{track_id}/races/{race_number}` - Get race information

### Main Dashboard Endpoint

- `GET /api/dashboard/live` - **Primary endpoint** for complete dashboard data
  - Query params: `track`, `race`, `vehicle`, `lap`
  - Returns: Complete dashboard with tire wear, performance, gap analysis

### Analytics Endpoints

- `POST /api/analytics/tire-wear` - Predict tire wear
- `POST /api/analytics/performance` - Analyze performance
- `POST /api/analytics/strategy` - Optimize strategy
- `GET /api/analytics/gap-analysis` - Calculate gaps to competitors

### Streaming

- `GET /api/live/stream` - Server-Sent Events (SSE) for live dashboard updates
- `WS /ws` - WebSocket for real-time telemetry streaming

## Frontend API Client

### Location: `src/api/pitwall.ts`

The frontend uses a centralized API client with the following functions:

#### Main Functions

- `getLiveDashboard(track, race, vehicle, lap)` - Get complete dashboard data
- `getTracks()` - Get list of all tracks
- `getTrack(trackId)` - Get specific track details
- `getRaceInfo(trackId, raceNumber)` - Get race information

#### Analytics Functions

- `analyzeTireWear(request)` - Tire wear prediction
- `analyzePerformance(request)` - Performance analysis
- `optimizeStrategy(request)` - Strategy optimization
- `getGapAnalysis(track, race, vehicle, lap)` - Gap analysis

#### Legacy Functions (Backward Compatible)

- `checkHealth()` - Health check
- `predictTire(track, chassis)` - Legacy tire prediction (maps to new endpoint)
- `simulateStrategy(data)` - Legacy strategy simulation
- `predictMultiple(tracks, chassis)` - Multi-track predictions

### HTTP Client: `src/api/client.ts`

- Axios-based client with automatic retries
- 8-second timeout for all requests
- Retries failed GET requests up to 2 times
- Development-mode request logging

## React Hooks

### `useStrategy` Hook

**Location**: `src/hooks/useStrategy.tsx`

- Fetches dashboard data from `/api/dashboard/live`
- Automatically refreshes every 30 seconds
- Converts backend response to frontend format
- Generates alerts from tire wear and gap analysis
- Integrates with `useTelemetry` for track/chassis/lap data

**Usage**:
```tsx
const { strategy, predictions, alerts, isLoading, error } = useStrategy();
```

### `useTelemetry` Hook

**Location**: `src/hooks/useTelemetry.tsx`

- Connects to WebSocket at `/ws`
- Streams real-time telemetry data
- Automatic reconnection with exponential backoff
- Tracks connection status
- Converts backend `TelemetryPoint` format to frontend format

**Usage**:
```tsx
const { telemetryData, currentLap, connectionStatus } = useTelemetry();
```

### `useLiveStream` Hook

**Location**: `src/hooks/useLiveStream.ts`

- Connects to SSE endpoint `/api/live/stream`
- Streams live dashboard updates
- Handles connection errors gracefully

**Usage**:
```tsx
const { data, connected, error } = useLiveStream('sebring', 1, 7, 12);
```

### `usePrediction` Hook

**Location**: `src/hooks/usePrediction.ts`

- React Query-based hook for tire predictions
- Automatic caching and refetching
- Configurable refresh intervals

**Usage**:
```tsx
const { data, isLoading, error } = usePrediction('cota', 'GR86-01', {
  refetchInterval: 5000
});
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Backend API base URL (REST endpoints)
# In development, leave empty to use Vite proxy (/api)
# In production, set to your backend URL
VITE_API_BASE_URL=http://localhost:8000

# WebSocket base URL (optional, defaults to derived from API URL)
VITE_WS_BASE_URL=ws://localhost:8000

# Alternative: Use VITE_BACKEND_URL (for consistency)
VITE_BACKEND_URL=http://localhost:8000
VITE_BACKEND_WS_URL=ws://localhost:8000
```

### Vite Proxy Configuration

The Vite dev server automatically proxies requests:

- `/api/*` → `http://localhost:8000/api/*`
- `/health` → `http://localhost:8000/health`
- `/ws` → `ws://localhost:8000/ws`

**Location**: `vite.config.ts`

## Data Flow

### Dashboard Data Flow

1. Component calls `getLiveDashboard(track, race, vehicle, lap)`
2. API client makes GET request to `/api/dashboard/live`
3. Backend loads telemetry data and runs AI predictions
4. Backend returns complete dashboard data
5. Frontend converts response to component format
6. Component displays data

### Telemetry Streaming Flow

1. `useTelemetry` hook connects to WebSocket at `/ws`
2. Backend streams telemetry points
3. Each point is converted to frontend format
4. Components receive real-time updates
5. Automatic reconnection on disconnect

### Strategy Flow

1. `useStrategy` hook fetches dashboard data
2. Gets track/chassis/lap from telemetry (if available)
3. Makes API call to `/api/dashboard/live`
4. Converts response to strategy format
5. Generates alerts from tire wear and gap analysis
6. Auto-refreshes every 30 seconds

## TypeScript Types

All backend response types are defined in `src/api/pitwall.ts`:

- `DashboardData` - Complete dashboard response
- `TireWearData` - Tire wear percentages
- `PerformanceMetrics` - Performance data
- `GapAnalysis` - Gap analysis data
- `StrategyOptimization` - Strategy recommendations
- `Track`, `TrackList`, `RaceInfo` - Track metadata

## Error Handling

### REST API Errors

- Network errors: Caught and displayed as user-friendly messages
- Timeout errors: 8-second timeout with retry logic
- HTTP errors: Status codes and error messages captured
- Fallback: Uses cached/default data when API unavailable

### WebSocket Errors

- Connection failures: Automatic reconnection with exponential backoff
- Parse errors: Logged to console, message skipped
- Max reconnection attempts: After 5 failed attempts, stops trying
- Connection status: Tracked and exposed to components

## Testing the Integration

### 1. Start Backend Server

```bash
cd "Backend Code Development for AI Features in Application/pitwall-backend"
pip3 install -r requirements.txt
python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

### 2. Start Frontend

```bash
npm run dev
```

The frontend will be available at:
- http://localhost:8080 (or configured port)

### 3. Verify Connection

1. Open browser console
2. Check for API request logs
3. Navigate to dashboard
4. Verify data is loading
5. Check WebSocket connection status

### 4. Test Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Dashboard data
curl "http://localhost:8000/api/dashboard/live?track=sebring&race=1&vehicle=7&lap=12"

# List tracks
curl http://localhost:8000/api/tracks
```

## Recent Updates

### ✅ Completed

1. **Updated `useStrategy` hook** to use new API client (`@/api/pitwall`)
   - Now uses `getLiveDashboard()` instead of legacy endpoint
   - Properly converts backend response format
   - Generates alerts from tire wear and gap analysis

2. **Updated WebSocket configuration** to use port 8000
   - Fixed `wsUrl.ts` to default to port 8000
   - Updated Vite proxy configuration

3. **Updated DemoLauncher** to use new dashboard endpoint

4. **Maintained backward compatibility** with legacy functions

## Files Modified

- ✅ `src/hooks/useStrategy.tsx` - Updated to use new API client
- ✅ `src/utils/wsUrl.ts` - Updated to use port 8000
- ✅ `src/components/DemoLauncher.tsx` - Updated endpoint URL
- ✅ `src/api/pitwall.ts` - Complete API client (already existed)
- ✅ `src/api/client.ts` - Axios client with retry logic (already existed)

## Notes

- The frontend gracefully handles backend unavailability
- All API calls include proper error handling
- WebSocket automatically reconnects on disconnection
- TypeScript ensures type safety across the integration
- Environment variables allow easy configuration for different environments
- Vite proxy handles CORS in development mode

## Troubleshooting

### Backend not responding

- Check if backend is running: `curl http://localhost:8000/health`
- Verify port 8000 is not in use: `lsof -i :8000`
- Check backend logs for errors

### CORS errors

- Verify frontend origin is in backend's `CORS_ORIGINS` list
- Check browser console for specific CORS error messages
- In development, use Vite proxy (no CORS issues)

### API endpoint not found

- Verify backend is running and accessible
- Check that the endpoint path matches exactly (case-sensitive)
- Review backend logs for routing errors

### WebSocket connection fails

- Verify backend WebSocket endpoint is available
- Check `VITE_WS_BASE_URL` environment variable
- In development, WebSocket should use Vite proxy (`/ws`)

## Next Steps

1. Add authentication (if needed)
2. Add request rate limiting
3. Add request/response logging
4. Add performance monitoring
5. Add E2E tests for integration


