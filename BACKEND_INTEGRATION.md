# Frontend-Backend Integration Complete

This document describes the integration between the frontend and the pitwall-backend.

## Overview

The frontend has been updated to work with the **pitwall-backend** FastAPI application. All API endpoints have been aligned with the backend's actual endpoints.

## Backend Endpoints

The backend runs on **port 8000** by default and provides the following endpoints:

### Health Check
- `GET /health` - Health check endpoint

### Track Management
- `GET /api/tracks` - List all available tracks
- `GET /api/tracks/{track_id}` - Get specific track details
- `GET /api/tracks/{track_id}/races/{race_number}` - Get race information

### Main Dashboard (Primary Endpoint)
- `GET /api/dashboard/live` - Get complete live dashboard data
  - Query params: `track`, `race`, `vehicle`, `lap`
  - Returns: Complete dashboard with tire wear, performance, gap analysis

### Analytics Endpoints
- `POST /api/analytics/tire-wear` - Predict tire wear
- `POST /api/analytics/performance` - Analyze performance
- `POST /api/analytics/strategy` - Optimize strategy
- `GET /api/analytics/gap-analysis` - Calculate gaps to competitors

## Frontend API Client

The frontend API client (`src/api/pitwall.ts`) has been updated with:

### New Functions
- `getTracks()` - Get list of all tracks
- `getTrack(trackId)` - Get specific track details
- `getRaceInfo(trackId, raceNumber)` - Get race information
- `getLiveDashboard(track, race, vehicle, lap)` - **Main endpoint** for dashboard data
- `analyzeTireWear(request)` - Tire wear prediction
- `analyzePerformance(request)` - Performance analysis
- `optimizeStrategy(request)` - Strategy optimization
- `getGapAnalysis(track, race, vehicle, lap)` - Gap analysis

### Legacy Functions (Backward Compatible)
- `checkHealth()` - Health check
- `predictTire(track, chassis)` - Legacy tire prediction (maps to new endpoint)
- `simulateStrategy(data)` - Legacy strategy simulation (maps to new endpoint)
- `predictMultiple(tracks, chassis)` - Multi-track predictions

## Configuration

### Development
The Vite dev server proxies API requests to the backend:
- `/api/*` → `http://localhost:8000/api/*`
- `/health` → `http://localhost:8000/health`

### Environment Variables
You can configure the backend URL using:
- `VITE_BACKEND_URL` - Backend API base URL (default: `http://localhost:8000`)
- `VITE_BACKEND_WS_URL` - WebSocket URL (default: `ws://localhost:8000`)

### Production
Set the environment variable in your deployment:
```bash
VITE_API_BASE_URL=http://your-backend-url:8000
```

## Usage Examples

### Get Live Dashboard Data
```typescript
import { getLiveDashboard } from '@/api/pitwall';

const dashboard = await getLiveDashboard('sebring', 1, 7, 12);
// Returns: { tire_wear, performance, gap_analysis, ... }
```

### Get Available Tracks
```typescript
import { getTracks } from '@/api/pitwall';

const { tracks } = await getTracks();
// Returns: Array of track objects with metadata
```

### Analyze Tire Wear
```typescript
import { analyzeTireWear } from '@/api/pitwall';

const result = await analyzeTireWear({
  track: 'sebring',
  race: 1,
  vehicle_number: 7,
  lap: 12
});
// Returns: { success: true, data: TireWearData, timestamp: string }
```

## TypeScript Types

All backend response types are defined in `src/api/pitwall.ts`:
- `DashboardData` - Complete dashboard response
- `TireWearData` - Tire wear percentages
- `PerformanceMetrics` - Performance data
- `GapAnalysis` - Gap analysis data
- `StrategyOptimization` - Strategy recommendations
- `Track`, `TrackList`, `RaceInfo` - Track metadata

## Backend Setup

To run the backend:

```bash
cd "Backend Code Development for AI Features in Application/pitwall-backend"
pip3 install -r requirements.txt
python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:3000` - React dev server
- `http://localhost:5173` - Vite dev server
- `http://localhost:8080` - Current frontend port
- `https://void-form-forge.lovable.app` - Production frontend

To add more origins, edit `pitwall-backend/app/config.py`.

## Testing

Test the integration:

1. Start the backend:
   ```bash
   cd "Backend Code Development for AI Features in Application/pitwall-backend"
   python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Check health:
   ```bash
   curl http://localhost:8000/health
   ```

4. Test dashboard endpoint:
   ```bash
   curl "http://localhost:8000/api/dashboard/live?track=sebring&race=1&vehicle=7&lap=12"
   ```

## Notes

- The frontend maintains backward compatibility with legacy functions
- All API calls include proper error handling
- The health check in `Index.tsx` has been updated to handle the backend response format
- The Vite proxy configuration has been updated to point to port 8000 (backend default)

## Troubleshooting

### Backend not responding
- Check if backend is running: `curl http://localhost:8000/health`
- Verify port 8000 is not in use: `lsof -i :8000`
- Check backend logs for errors

### CORS errors
- Verify frontend origin is in backend's `CORS_ORIGINS` list
- Check browser console for specific CORS error messages

### API endpoint not found
- Verify backend is running and accessible
- Check that the endpoint path matches exactly (case-sensitive)
- Review backend logs for routing errors

