# Cursor Prompt: Fix Frontend-Backend Integration for Lovable

## QUICK SUMMARY

**Problem**: Frontend has backend integration code but it's not working properly with the PitWall backend.

**Solution**: 
1. Standardize environment variables (`VITE_BACKEND_URL`)
2. Add demo seed fallback function
3. Create unified hook with SSE → REST → Demo fallback chain
4. Update Dashboard to use new hook
5. Verify CORS configuration

**Expected Result**: Frontend successfully connects to backend, falls back gracefully, and works in Lovable preview.

---

## TASK OVERVIEW

The React frontend at `/Users/llow/Desktop/blank-slate-canvas` has backend integration code but it's not working properly. The backend is located at `/Users/llow/Desktop/blank-slate-canvas/Backend Code Development for AI Features in Application/pitwall-backend`. Fix all integration issues so the frontend can:
1. Connect to the backend via REST API (`/api/dashboard/live`)
2. Fall back to SSE streaming (`/api/live/stream`) when available
3. Fall back to demo seed (`/api/demo/seed`) when live data isn't available
4. Work correctly in Lovable preview environment (`https://void-form-forge.lovable.app`)

---

## CURRENT STATE ANALYSIS

### Frontend Structure
- **API Client**: `src/api/pitwall.ts` - Has `getLiveDashboard()` function
- **SSE Hook**: `src/hooks/useLiveStream.ts` - Uses EventSource but no fallback
- **Dashboard**: `src/pages/Dashboard.tsx` - Uses `useLiveStream` but doesn't handle failures
- **Environment Variables**: Mixed usage of `VITE_API_BASE_URL` and `VITE_BACKEND_URL`

### Backend Structure
- **Main App**: `Backend Code Development for AI Features in Application/pitwall-backend/app/main.py`
- **Frontend Routes**: `Backend Code Development for AI Features in Application/pitwall-backend/app/routes/frontend_integration.py`
- **Endpoints Available**:
  - `GET /api/dashboard/live?track=sebring&race=1&vehicle=7&lap=12` - Main dashboard endpoint
  - `GET /api/live/stream?track=sebring&race=1&vehicle=7&start_lap=1` - SSE streaming
  - `GET /api/demo/seed?name=best_overtake` - Demo data fallback
  - `GET /api/health` - Health check
  - `GET /api/config` - Backend configuration

### Issues Identified
1. **Environment Variable Inconsistency**: `vite.config.ts` uses `VITE_BACKEND_URL` but hooks use `VITE_API_BASE_URL`
2. **No Fallback Chain**: `useLiveStream` doesn't fallback to REST polling or demo seed
3. **Missing Demo Seed Function**: No API function to fetch demo data
4. **Dashboard Doesn't Handle Failures**: Dashboard shows loading forever if SSE fails
5. **CORS Configuration**: Need to verify backend allows Lovable origin

---

## STEP-BY-STEP FIXES

### STEP 1: Standardize Environment Variables

**File**: `vite.config.ts`
- Keep using `VITE_BACKEND_URL` for proxy configuration (already correct)
- Update all hooks to use `VITE_BACKEND_URL` instead of `VITE_API_BASE_URL`

**Files to Update**:
1. `src/hooks/useLiveStream.ts` - Change `VITE_API_BASE_URL` to `VITE_BACKEND_URL`
2. `src/hooks/useBackendConfig.ts` - Change `VITE_API_BASE_URL` to `VITE_BACKEND_URL`
3. `src/api/client.ts` - Update to check `VITE_BACKEND_URL` first, then fallback

**Action**: Replace all instances of `import.meta.env.VITE_API_BASE_URL` with `import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'` in hooks and API files.

---

### STEP 2: Add Demo Seed Function to API Client

**File**: `src/api/pitwall.ts`

Add this function after `getLiveDashboard()`:

```typescript
/**
 * Get demo seed data for testing/fallback
 */
export async function getDemoSeed(name: string = 'best_overtake'): Promise<DashboardData> {
  try {
    const res = await client.get<DashboardData>("/api/demo/seed", {
      params: { name }
    });
    return res.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Demo seed API error (${error.response.status}): ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error("Network error: Backend server may be unavailable");
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
}
```

---

### STEP 3: Create Unified Data Hook with Fallback Chain

**File**: `src/hooks/usePitwallData.ts` (CREATE NEW FILE)

Create a new hook that implements the fallback chain: SSE → REST Polling → Demo Seed

```typescript
import { useEffect, useState, useRef } from 'react';
import { DashboardData } from '@/lib/types';
import { getLiveDashboard, getDemoSeed } from '@/api/pitwall';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export function usePitwallData(
  track: string = 'sebring',
  race: number = 1,
  vehicle: number = 7,
  startLap: number = 1,
  pollInterval: number = 1500
) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<'sse' | 'polling' | 'demo' | null>(null);
  
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<number | null>(null);
  const currentLapRef = useRef<number>(startLap);

  useEffect(() => {
    let mounted = true;
    let sseFailed = false;

    // Try SSE first
    const trySSE = () => {
      try {
        const url = `${BACKEND_URL}/api/live/stream?track=${encodeURIComponent(track)}&race=${race}&vehicle=${vehicle}&start_lap=${startLap}&interval=1.0`;
        const eventSource = new EventSource(url);
        esRef.current = eventSource;

        eventSource.onopen = () => {
          if (!mounted) return;
          setConnectionMode('sse');
          setError(null);
          setLoading(false);
        };

        eventSource.addEventListener('update', (e: MessageEvent) => {
          if (!mounted) return;
          try {
            const payload = JSON.parse(e.data);
            setData(payload);
            if (payload.meta?.lap) {
              currentLapRef.current = payload.meta.lap;
            }
          } catch (err) {
            console.error('SSE parse error:', err);
          }
        });

        eventSource.addEventListener('error', (e: MessageEvent) => {
          if (!mounted) return;
          try {
            if (e.data) {
              const errorData = JSON.parse(e.data);
              console.warn('SSE error event:', errorData);
              sseFailed = true;
              eventSource.close();
              fallbackToPolling();
            }
          } catch {
            // Ignore parse errors
          }
        });

        eventSource.onerror = () => {
          if (!mounted) return;
          if (eventSource.readyState === EventSource.CLOSED) {
            if (!sseFailed) {
              sseFailed = true;
              eventSource.close();
              fallbackToPolling();
            }
          }
        };

        eventSource.addEventListener('complete', () => {
          if (!mounted) return;
          eventSource.close();
          setConnectionMode(null);
        });

      } catch (e) {
        console.warn('SSE not supported or failed to create:', e);
        fallbackToPolling();
      }
    };

    // Fallback to REST polling
    const fallbackToPolling = async () => {
      if (!mounted) return;
      
      setConnectionMode('polling');
      
      // Try to fetch initial data
      try {
        const payload = await getLiveDashboard(track, race, vehicle, currentLapRef.current);
        if (mounted) {
          setData(payload);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.warn('REST polling failed, trying demo seed:', err);
        fallbackToDemo();
        return;
      }

      // Start polling interval
      pollRef.current = window.setInterval(async () => {
        if (!mounted) return;
        try {
          const payload = await getLiveDashboard(track, race, vehicle, currentLapRef.current);
          if (mounted) {
            setData(payload);
            if (payload.meta?.lap) {
              currentLapRef.current = payload.meta.lap;
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
          // Don't fallback to demo on every error, just log it
        }
      }, pollInterval);
    };

    // Final fallback to demo seed
    const fallbackToDemo = async () => {
      if (!mounted) return;
      
      setConnectionMode('demo');
      setLoading(true);
      
      try {
        const payload = await getDemoSeed('best_overtake');
        if (mounted) {
          setData(payload);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load demo data');
          setLoading(false);
        }
      }
    };

    // Start with SSE
    trySSE();

    // Cleanup
    return () => {
      mounted = false;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [track, race, vehicle, startLap, pollInterval]);

  return { data, loading, error, connectionMode };
}
```

---

### STEP 4: Update Dashboard to Use New Hook

**File**: `src/pages/Dashboard.tsx`

Replace the `useLiveStream` import and usage with the new `usePitwallData` hook:

```typescript
import { usePitwallData } from '@/hooks/usePitwallData';

// Inside component:
const { data, loading, error, connectionMode } = usePitwallData(
  selectedTrack,
  selectedRace,
  selectedVehicle,
  1, // startLap
  1500 // pollInterval in ms
);
```

Update the connection status indicator to show the mode:

```typescript
<div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
  connectionMode 
    ? connectionMode === 'sse'
      ? 'bg-green-500/10 text-green-500 border border-green-500/20'
      : connectionMode === 'polling'
      ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
      : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
    : 'bg-red-500/10 text-red-500 border border-red-500/20'
}`}>
  {connectionMode === 'sse' ? <Wifi className="w-4 h-4" /> : 
   connectionMode === 'polling' ? <Loader2 className="w-4 h-4 animate-spin" /> :
   connectionMode === 'demo' ? <FileText className="w-4 h-4" /> :
   <WifiOff className="w-4 h-4" />}
  <span className="text-sm font-medium">
    {connectionMode === 'sse' ? 'Live (SSE)' :
     connectionMode === 'polling' ? 'Polling' :
     connectionMode === 'demo' ? 'Demo Data' :
     'Disconnected'}
  </span>
</div>
```

---

### STEP 5: Verify Backend CORS Configuration

**File**: `Backend Code Development for AI Features in Application/pitwall-backend/app/config.py`

The CORS configuration already includes the Lovable origin. However, verify it has:
- `http://localhost:3000`
- `http://localhost:5173`
- `http://localhost:8080` (Vite default port)
- `https://void-form-forge.lovable.app`

**Current config** (line 17-22):
```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://void-form-forge.lovable.app",
    "*"  # Allow all for hackathon demo
]
```

**Note**: The wildcard `"*"` with `allow_credentials=True` in FastAPI may cause issues. If you encounter CORS errors, remove the `"*"` entry and explicitly list all origins. The current config should work, but if issues arise, update to:

```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "https://void-form-forge.lovable.app",
]
```

---

### STEP 6: Create Environment File Template

**File**: `.env.local.example` (CREATE NEW)

```bash
# Backend API URL
# For local development: http://localhost:8000
# For Lovable preview: https://your-backend-domain.com
VITE_BACKEND_URL=http://localhost:8000
```

**File**: `.env.local` (CREATE IF NOT EXISTS)

Add the same content as above, but this file should be in `.gitignore`.

---

### STEP 7: Update API Client Base URL Logic

**File**: `src/api/client.ts`

Update to use `VITE_BACKEND_URL` consistently:

```typescript
// Use VITE_BACKEND_URL for explicit backend URL, or /api for dev proxy
const BASE = import.meta.env.VITE_BACKEND_URL 
  ? `${import.meta.env.VITE_BACKEND_URL}` 
  : (import.meta.env.DEV ? '/api' : '');
```

---

### STEP 8: Update useLiveStream Hook (Keep for Backward Compatibility)

**File**: `src/hooks/useLiveStream.ts`

Update to use `VITE_BACKEND_URL`:

```typescript
const API_URL = import.meta.env.VITE_BACKEND_URL || '';
```

---

### STEP 9: Update useBackendConfig Hook

**File**: `src/hooks/useBackendConfig.ts`

Update to use `VITE_BACKEND_URL`:

```typescript
const API_URL = import.meta.env.VITE_BACKEND_URL || '';
```

---

## TESTING CHECKLIST

After applying all fixes, test the following:

1. **Local Development**:
   - Start backend: `cd "Backend Code Development for AI Features in Application/pitwall-backend" && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`
   - Start frontend: `npm run dev`
   - Open `http://localhost:8080` (or whatever port Vite uses)
   - Verify dashboard loads data
   - Check browser console for errors
   - Verify connection mode indicator shows "Live (SSE)" or "Polling"

2. **SSE Fallback Test**:
   - Stop the backend
   - Refresh frontend
   - Should see connection mode change to "Polling" then "Demo Data"

3. **CORS Test**:
   - Check browser Network tab
   - Verify no CORS errors in console
   - All requests should return 200 OK

4. **Lovable Preview**:
   - Set `VITE_BACKEND_URL` to your deployed backend URL
   - Build: `npm run build`
   - Deploy to Lovable
   - Verify dashboard works in preview

---

## FILES TO CREATE/MODIFY

### Create:
1. `src/hooks/usePitwallData.ts` - New unified hook with fallback chain
2. `.env.local.example` - Environment variable template
3. `.env.local` - Local environment variables (add to .gitignore)

### Modify:
1. `src/api/pitwall.ts` - Add `getDemoSeed()` function
2. `src/pages/Dashboard.tsx` - Use `usePitwallData` instead of `useLiveStream`
3. `src/api/client.ts` - Update BASE URL logic
4. `src/hooks/useLiveStream.ts` - Update to use `VITE_BACKEND_URL`
5. `src/hooks/useBackendConfig.ts` - Update to use `VITE_BACKEND_URL`
6. `Backend Code Development for AI Features in Application/pitwall-backend/app/main.py` - Update CORS origins

---

## EXPECTED OUTCOME

After completing all steps:
- Frontend successfully connects to backend via SSE
- Falls back to REST polling if SSE fails
- Falls back to demo seed if REST fails
- Works in Lovable preview environment
- No CORS errors
- Dashboard displays live analytics data
- Connection mode indicator shows current connection type

---

## NOTES

- The backend should be running on port 8000 by default
- For Lovable, you'll need to deploy the backend separately and update `VITE_BACKEND_URL`
- The demo seed endpoint provides realistic data when live telemetry isn't available
- All API calls use the axios client from `src/api/client.ts` which handles retries

---

## PRIORITY ORDER

1. **HIGH**: Steps 1, 2, 3, 4 (Environment vars, demo seed, unified hook, dashboard update)
2. **MEDIUM**: Steps 5, 6, 7 (CORS, env files, client updates)
3. **LOW**: Steps 8, 9 (Backward compatibility updates)

Complete HIGH priority items first, then test. If working, proceed with MEDIUM and LOW priority items.

