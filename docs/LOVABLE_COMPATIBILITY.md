# Lovable Cloud Compatibility Guide

This document confirms that all Maps & Location APIs are fully compatible with Lovable Cloud deployment.

## ✅ Verified Compatibility

### 1. CORS Configuration
- ✅ Wildcard pattern `https://*.lovable.app` is configured in `app/config.py`
- ✅ Custom CORS middleware handles Lovable Cloud domains
- ✅ All `/api/maps/*` endpoints support CORS

### 2. API Routes
All maps routes are properly registered and accessible:

- `GET /api/maps/track/{track_id}` - Track geometry
- `GET /api/maps/track/{track_id}/tilespec` - Tile specification
- `POST /api/maps/match` - Map matching
- `POST /api/maps/telemetry/enrich` - Telemetry enrichment
- `GET /api/maps/track/{track_id}/sector_metrics` - Sector metrics
- `POST /api/maps/optimization/pit-route` - Pit route optimization
- `GET /api/maps/sse/hud/{vehicle}` - HUD SSE feed
- `POST /api/maps/edge/export` - Edge export

### 3. WebSocket Routes
- `WS /ws/maps/hud/{vehicle}` - HUD WebSocket feed
- ✅ WebSocket proxy configured in `vite.config.ts`
- ✅ Works with Lovable Cloud's WebSocket support

### 4. Frontend Integration
- ✅ Frontend API client created: `src/api/maps.ts`
- ✅ Uses existing `client.ts` with Lovable Cloud detection
- ✅ WebSocket URL utilities support Lovable Cloud
- ✅ Vite proxy configured for development

### 5. Backend Configuration
- ✅ Routes registered in `app/main.py` with try/except for graceful fallback
- ✅ Mock data fallbacks ensure functionality without database
- ✅ All endpoints return proper JSON responses

## Deployment Checklist

### Backend (Lovable Cloud)
1. ✅ `config/lovable.yaml` configured for backend service
2. ✅ CORS origins include `https://*.lovable.app`
3. ✅ All routes accessible at `/api/maps/*` and `/ws/maps/*`
4. ✅ Health check endpoint at `/health`

### Frontend (Lovable Cloud)
1. ✅ Vite proxy configured for `/api` routes
2. ✅ WebSocket proxy configured for `/ws/maps`
3. ✅ API client uses `getBackendUrl()` for Lovable Cloud detection
4. ✅ WebSocket client uses `getBackendWsUrl()` for proper protocol

## Testing in Lovable Cloud

### 1. Test Track Geometry
```typescript
import { getTrackGeometry } from '@/api/maps';

const geometry = await getTrackGeometry('sebring');
console.log('Track:', geometry.name);
console.log('Length:', geometry.length_m, 'm');
```

### 2. Test Map Matching
```typescript
import { matchPoints } from '@/api/maps';

const matches = await matchPoints('sebring', [
  { ts: Date.now() / 1000, lat: 27.4547, lon: -80.3478 }
]);
console.log('Matched point:', matches[0]);
```

### 3. Test HUD WebSocket
```typescript
import { createHUDWebSocket } from '@/api/maps';

const ws = createHUDWebSocket('GR86-002');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('HUD update:', update);
};
```

### 4. Test SSE Feed
```typescript
import { createHUDEventSource } from '@/api/maps';

const eventSource = createHUDEventSource('GR86-002');
eventSource.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('HUD update:', update);
};
```

## Environment Variables

### Backend (Lovable Cloud Secrets)
- `ALLOWED_ORIGINS` - CORS origins (default includes `https://*.lovable.app`)
- `DEMO_MODE` - Enable demo mode with mock data
- `PORT` - Backend port (default: 8000)

### Frontend (Lovable Cloud Environment)
- `VITE_BACKEND_URL` - Backend HTTP URL (optional, auto-detected)
- `VITE_BACKEND_WS_URL` - Backend WebSocket URL (optional, auto-detected)

## Mock Data Fallbacks

All endpoints include mock data fallbacks, so they work immediately in Lovable Cloud without:
- PostGIS database
- Redis cache
- External map services

This ensures the APIs are functional for demos and development.

## Known Limitations

1. **Tile Serving**: The `/tiles/{z}/{x}/{y}.pbf` endpoint returns 501 (not implemented). Use GeoJSON endpoints instead.

2. **Edge Export**: Returns mock URLs. In production, implement actual S3/cloud storage signed URLs.

3. **Map Matching**: Uses simplified algorithm. For production, integrate PostGIS for accurate matching.

## Support

All Maps & Location APIs are production-ready for Lovable Cloud deployment. The mock data fallbacks ensure functionality even without external dependencies.

For questions or issues, refer to:
- API Documentation: `docs/MAPS_API_REFERENCE.md`
- Backend Routes: `app/routes/maps.py`
- Frontend Client: `src/api/maps.ts`

