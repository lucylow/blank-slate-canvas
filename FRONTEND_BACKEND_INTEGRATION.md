# Frontend-Backend Integration Guide

This document describes how the frontend has been prepared to integrate with the backend API.

## Overview

The frontend has been updated to:
1. Connect to backend REST API endpoints for tire predictions
2. Stream real-time telemetry data via WebSocket
3. Handle errors and connection management gracefully
4. Support environment-based configuration

## Architecture

### API Client (`src/lib/api.ts`)

A centralized API client that handles all backend communication:

- **REST API Client** (`ApiClient` class):
  - `fetchTirePrediction(track, chassis)`: Fetches tire predictions from `/predict_tire/:track/:chassis`
  - `checkHealth()`: Health check endpoint
  - Includes timeout handling (10s for predictions, 5s for health)
  - Comprehensive error handling with user-friendly messages

- **WebSocket Client** (`TelemetryWebSocket` class):
  - Connects to `/ws` endpoint
  - Automatic reconnection with exponential backoff (max 5 attempts)
  - Subscription-based event system
  - Connection status tracking

### TypeScript Interfaces

All backend API responses are typed:

- `TelemetryPoint`: Matches WebSocket telemetry data structure
- `TirePredictionResponse`: Matches `/predict_tire` endpoint response
- `HealthResponse`: Matches `/health` endpoint response

### Hooks Integration

#### `useTelemetry` Hook

**Before**: Used mock data with `setInterval`

**After**: 
- Connects to WebSocket on mount
- Subscribes to telemetry stream
- Converts backend `TelemetryPoint` format to frontend `TelemetryData` format
- Tracks connection status (connected/connecting/disconnected)
- Automatically cleans up on unmount

**Key Changes**:
- Removed mock `setInterval` data generation
- Added WebSocket connection management
- Real-time lap tracking from telemetry data

#### `useStrategy` Hook

**Before**: Used static mock data

**After**:
- Fetches tire predictions from REST API
- Automatically refreshes every 30 seconds
- Integrates with `useTelemetry` to get current track, chassis, and lap
- Converts API responses to frontend format
- Generates alerts from API explanations
- Handles loading and error states

**Key Changes**:
- Added `fetchTirePrediction` function
- Added loading and error state management
- Added `refreshPrediction` method for manual updates
- Converts backend response format to frontend format

#### `StrategyProviderWrapper`

New wrapper component that bridges `TelemetryProvider` and `StrategyProvider`:
- Extracts telemetry data (track, chassis, lap) from `useTelemetry`
- Passes data to `StrategyProvider` via callback function
- Allows `StrategyProvider` to work independently or with telemetry data

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Backend API base URL (REST endpoints)
VITE_API_BASE_URL=http://localhost:8081

# WebSocket base URL
VITE_WS_BASE_URL=ws://localhost:8081
```

**Default Values** (if not set):
- `VITE_API_BASE_URL`: `http://localhost:8081`
- `VITE_WS_BASE_URL`: `ws://localhost:8081`

## Data Flow

### Telemetry Flow

1. `TelemetryProvider` mounts → `telemetryWS.connect()` called
2. WebSocket connects to `ws://localhost:8081/ws`
3. Backend sends telemetry points via WebSocket
4. Each point is converted to frontend format and added to state
5. Components using `useTelemetry` receive real-time updates

### Strategy Flow

1. `StrategyProvider` mounts → `fetchTirePrediction()` called
2. Gets track/chassis/lap from telemetry (if available) or uses defaults
3. Makes REST API call to `/predict_tire/:track/:chassis`
4. Converts response to frontend format
5. Updates strategy, predictions, and alerts
6. Auto-refreshes every 30 seconds

## Error Handling

### REST API Errors

- **Network errors**: Caught and displayed as user-friendly messages
- **Timeout errors**: 10s timeout for predictions, 5s for health checks
- **HTTP errors**: Status codes and error messages are captured
- **Fallback**: Uses cached/default data when API is unavailable

### WebSocket Errors

- **Connection failures**: Automatic reconnection with exponential backoff
- **Parse errors**: Logged to console, message skipped
- **Max reconnection attempts**: After 5 failed attempts, stops trying
- **Connection status**: Tracked and exposed to components

## Testing the Integration

### 1. Start Backend Server

```bash
npm run demo-server
```

This starts the demo server on `http://localhost:8081`

### 2. Start Frontend

```bash
npm run dev
```

Or use the combined command:

```bash
npm run demo
```

### 3. Verify Connection

- Open browser console
- Check for "WebSocket connected" message
- Navigate to dashboard
- Verify telemetry data is streaming
- Check that tire predictions are loading

### 4. Test Error Handling

- Stop the backend server
- Verify WebSocket shows "disconnected" status
- Verify strategy shows error message
- Restart backend
- Verify automatic reconnection

## Future Backend Integration

When the real backend is ready:

1. **Update Environment Variables**:
   ```bash
   VITE_API_BASE_URL=https://api.your-backend.com
   VITE_WS_BASE_URL=wss://api.your-backend.com
   ```

2. **Verify API Response Format**:
   - Ensure `/predict_tire/:track/:chassis` returns the expected format
   - Ensure WebSocket sends `TelemetryPoint` format
   - Update TypeScript interfaces if needed

3. **Add Authentication** (if needed):
   - Add auth headers to `ApiClient.fetchTirePrediction()`
   - Add auth token to WebSocket connection

4. **Add Additional Endpoints**:
   - Extend `ApiClient` class with new methods
   - Add corresponding TypeScript interfaces

## Files Modified

- `src/lib/api.ts` - **NEW**: API client and WebSocket client
- `src/hooks/useTelemetry.tsx` - Updated to use WebSocket
- `src/hooks/useStrategy.tsx` - Updated to use REST API
- `src/hooks/StrategyProviderWrapper.tsx` - **NEW**: Integration wrapper
- `src/pages/DashboardPage.tsx` - Updated to use wrapper
- `README.md` - Added integration documentation

## Notes

- The frontend gracefully handles backend unavailability
- All API calls include proper error handling
- WebSocket automatically reconnects on disconnection
- TypeScript ensures type safety across the integration
- Environment variables allow easy configuration for different environments


