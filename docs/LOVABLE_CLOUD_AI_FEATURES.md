# Lovable Cloud - AI Features Configuration

## ✅ Current Status

All AI features are configured to work with Lovable Cloud. Here's what's been set up:

### 1. Main Backend API (Port 8000) ✅
- **Status**: Fully configured for Lovable Cloud
- **Location**: `src/api/client.ts` uses `getBackendUrl()` utility
- **Behavior**:
  - Uses `VITE_BACKEND_URL` env var if set
  - Falls back to relative paths (`/api/*`) in production
  - Lovable Cloud will proxy `/api/*` to the backend service
- **AI Features Using This**:
  - Tire wear prediction (`/api/analytics/tire-wear`)
  - Performance analysis (`/api/analytics/performance`)
  - Strategy optimization (`/api/analytics/strategy`)
  - Gap analysis (`/api/analytics/gap-analysis`)
  - AI agent status and decisions (`/api/agents/*`)
  - Live dashboard data (`/api/dashboard/live`)

### 2. AI Summary Reports (Port 8001) ✅
- **Status**: Fixed to work with Lovable Cloud
- **Location**: `src/pages/AISummaryReports.tsx`
- **Behavior**:
  - Uses `VITE_AI_SUMMARY_API` env var if set
  - Falls back to relative paths (`/api/reports/*`) in production
  - Vite proxy handles this in dev, Lovable Cloud proxy in production
- **Endpoints**:
  - `GET /api/reports` - List all reports
  - `GET /api/reports/:id/html` - Preview report
  - `GET /api/reports/:id/pdf` - Download PDF

### 3. WebSocket Connections ✅
- **Status**: Configured for Lovable Cloud
- **Location**: `src/utils/backendUrl.ts` - `getBackendWsUrl()`
- **Behavior**:
  - Uses `VITE_BACKEND_WS_URL` or `VITE_WS_BASE_URL` if set
  - Automatically converts HTTP to WebSocket (ws/wss)
  - Handles Lovable Cloud domain detection
- **Used For**:
  - Real-time telemetry streaming (`/ws`)
  - AI agent decision streaming (`/api/agents/decisions/ws`)

### 4. AI Agent Features ✅
- **Status**: All configured via main backend API
- **Endpoints**:
  - `GET /api/agents/status` - Agent status
  - `GET /api/agents/decisions` - Get decisions
  - `GET /api/agents/insights/:id` - Get insight details
  - `POST /api/agents/telemetry` - Submit telemetry
  - `POST /api/agents/decisions/:id/review` - Review decisions

## 🔧 Lovable Cloud Configuration

### Environment Variables (Optional)

You can set these in Lovable Cloud's environment settings:

```bash
# Main backend URL (if not using relative paths)
VITE_BACKEND_URL=https://pitwall-backend-xxx.lovable.app

# AI Summary Reports server (if deployed separately)
VITE_AI_SUMMARY_API=https://ai-summaries-xxx.lovable.app

# WebSocket URLs (auto-derived from HTTP URLs if not set)
VITE_BACKEND_WS_URL=wss://pitwall-backend-xxx.lovable.app
```

**Note**: If you don't set these, the app will use relative paths (`/api/*`) which Lovable Cloud will proxy to your backend services.

### Service Configuration

#### Main Backend Service
- **Service Name**: `pitwall-backend` (from `lovable.yaml`)
- **Port**: 8000
- **Health Check**: `/health`
- **Routes**: All `/api/*` routes should proxy to this service

#### AI Summary Reports Service (Optional)
If you want to deploy the AI Summary Reports server separately:
- **Port**: 8001
- **Routes**: `/api/reports/*` and `/api/ai-summaries/*` should proxy to this service
- **Alternative**: You can integrate these endpoints into the main backend

### Proxy Configuration

Lovable Cloud should proxy the following routes:

```
/api/* → pitwall-backend:8000/api/*
/api/reports/* → ai-summaries:8001/api/reports/* (if separate service)
/api/ai-summaries/* → ai-summaries:8001/api/ai-summaries/* (if separate service)
/ws → pitwall-backend:8000/ws (WebSocket upgrade)
/health → pitwall-backend:8000/health
```

## 🧪 Testing

### In Development
1. Start the backend: `cd pitwall-backend && python -m uvicorn app.main:app --reload`
2. Start AI summaries server: `npm run ai-summaries`
3. Start frontend: `npm run dev`
4. Vite proxy handles all routing automatically

### In Lovable Cloud
1. Deploy backend service (configured via `lovable.yaml`)
2. Deploy frontend (Lovable Cloud handles this automatically)
3. Configure proxy routes in Lovable Cloud dashboard
4. Set environment variables if needed

## 📝 Summary

**All AI features work with Lovable Cloud!** ✅

The codebase is configured to:
- ✅ Use relative paths in production (works with Lovable Cloud proxy)
- ✅ Support explicit environment variables for custom URLs
- ✅ Handle WebSocket connections properly
- ✅ Fall back gracefully when services are unavailable
- ✅ Work in both development and production environments

The only requirement is that Lovable Cloud is configured to proxy `/api/*` routes to your backend service(s).

