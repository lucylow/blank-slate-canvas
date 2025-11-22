# Lovable Cloud Setup Guide

This document explains how the PitWall AI application is configured to work with Lovable Cloud.

## Overview

The application consists of:
- **Frontend**: React + Vite application (deployed on Lovable Cloud)
- **Backend**: Python FastAPI application (deployed separately on Lovable Cloud via `lovable.yaml`)

## Backend Configuration (`lovable.yaml`)

The backend is configured in `lovable.yaml`:
- **Name**: `pitwall-backend`
- **Type**: `backend`
- **Port**: `8000`
- **Health Check**: `/health`
- **Readiness Check**: `/ready`

### Environment Variables

Configure these in the Lovable UI for the backend service:

**Required:**
- `PORT=8000` (automatically set by Lovable)
- `DEMO_MODE=true` (enables demo mode with precomputed data)

**Optional:**
- `ALLOWED_ORIGINS=https://*.lovable.app,http://localhost:5173` (CORS origins)
- `SSE_INTERVAL_MS=1000` (SSE update interval)
- `LOG_LEVEL=INFO` (logging level)
- `USE_REDIS_PUBSUB=false` (Redis pub/sub for multi-instance)
- `REDIS_URL=redis://localhost:6379` (if using Redis)
- `DATA_ARCHIVE_URL=file:///mnt/data/pitwall-backend-v2.tar.gz` (optional data archive)

## Frontend Configuration

The frontend automatically detects when it's running on Lovable Cloud and configures the backend URL accordingly.

### Automatic Backend URL Detection

The frontend uses `src/utils/backendUrl.ts` to detect the environment:

1. **Explicit Environment Variables** (highest priority):
   - `VITE_BACKEND_URL` - Preferred variable
   - `VITE_API_BASE_URL` - Backward compatibility
   - `VITE_API_BASE` - Alternative name

2. **Lovable Cloud Detection**:
   - Detects `.lovable.app` hostname
   - Uses relative paths (Lovable Cloud proxies `/api` to backend)
   - Checks for meta tags: `<meta name="backend-url" content="...">`

3. **Development Mode**:
   - Uses Vite proxy (`/api` → `http://localhost:8000/api`)

4. **Fallback**:
   - Uses relative paths

### WebSocket Configuration

WebSocket URLs are automatically configured:
- HTTP URL → WebSocket URL conversion (http → ws, https → wss)
- Lovable Cloud detection for secure WebSocket (wss://)
- Development proxy support

### Setting Backend URL in Lovable Cloud

If the backend is deployed on a different subdomain, set the environment variable in Lovable UI:

**Frontend Environment Variables:**
```
VITE_BACKEND_URL=https://pitwall-backend-xxx.lovable.app
VITE_WS_BASE_URL=wss://pitwall-backend-xxx.lovable.app
```

Or use relative paths (recommended):
- Frontend uses `/api` which Lovable Cloud proxies to the backend service
- WebSocket uses `wss://current-host/ws` which Lovable Cloud routes to backend

## CORS Configuration

The backend (`app/config.py`) is configured to accept requests from:
- `http://localhost:3000` (React dev server)
- `http://localhost:5173` (Vite dev server)
- `https://*.lovable.app` (all Lovable Cloud domains)
- `https://void-form-forge.lovable.app` (specific frontend)

This is configured via the `ALLOWED_ORIGINS` environment variable in the backend.

## Deployment Checklist

### Backend Deployment
- [ ] Deploy backend using `lovable.yaml` configuration
- [ ] Set `DEMO_MODE=true` in backend environment variables
- [ ] Set `ALLOWED_ORIGINS=https://*.lovable.app,http://localhost:5173`
- [ ] Verify health check: `curl https://pitwall-backend-xxx.lovable.app/health`
- [ ] Verify demo seed: `curl https://pitwall-backend-xxx.lovable.app/demo/seed`

### Frontend Deployment
- [ ] Deploy frontend to Lovable Cloud
- [ ] (Optional) Set `VITE_BACKEND_URL` if backend is on different subdomain
- [ ] (Optional) Set `VITE_WS_BASE_URL` for WebSocket connections
- [ ] Verify frontend loads and connects to backend
- [ ] Test API calls from browser console
- [ ] Test WebSocket connections

## Testing

### Local Development
```bash
# Start backend
cd /path/to/backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Start frontend (uses Vite proxy)
npm run dev
```

Frontend will automatically use `http://localhost:8000` via Vite proxy.

### Lovable Cloud Testing

1. **Health Check**:
   ```bash
   curl https://pitwall-backend-xxx.lovable.app/health
   ```

2. **API Test**:
   ```bash
   curl https://pitwall-backend-xxx.lovable.app/api/dashboard/live?track=sebring&race=1&vehicle=7&lap=12
   ```

3. **Frontend Test**:
   - Open frontend URL in browser
   - Check browser console for API calls
   - Verify WebSocket connections

## Troubleshooting

### Frontend can't connect to backend

1. **Check CORS configuration**:
   - Verify `ALLOWED_ORIGINS` includes your frontend domain
   - Check browser console for CORS errors

2. **Check backend URL**:
   - Verify `VITE_BACKEND_URL` is set correctly (if using explicit URL)
   - Check that relative paths work (Lovable Cloud should proxy `/api`)

3. **Check backend health**:
   - Verify backend is running: `curl https://backend-url/health`
   - Check backend logs in Lovable Cloud

### WebSocket connections fail

1. **Check protocol**:
   - Use `wss://` for HTTPS (Lovable Cloud)
   - Use `ws://` for HTTP (local dev)

2. **Check backend WebSocket endpoint**:
   - Verify `/ws` endpoint is available
   - Check backend logs for WebSocket errors

3. **Check CORS for WebSocket**:
   - WebSocket connections may need additional CORS configuration

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│  Frontend       │         │  Backend        │
│  (Lovable)      │────────▶│  (Lovable)      │
│                 │  /api   │                 │
│  https://...    │         │  https://...    │
│  lovable.app    │         │  lovable.app    │
└─────────────────┘         └─────────────────┘
       │                            │
       │                            │
       └────────── WebSocket ────────┘
                  /ws
```

## Files Modified

- `src/utils/backendUrl.ts` - New utility for backend URL detection
- `src/api/client.ts` - Updated to use `getBackendUrl()`
- `src/utils/wsUrl.ts` - Updated to use `getBackendWsUrl()`
- `src/hooks/useBackendConfig.ts` - Updated to use `getBackendUrl()`
- `src/hooks/useLiveStream.ts` - Updated to use `getBackendUrl()`

## References

- [Lovable Cloud Documentation](https://docs.lovable.app)
- Backend deployment: See `lovable.yaml`
- Frontend integration: See `README.md`

