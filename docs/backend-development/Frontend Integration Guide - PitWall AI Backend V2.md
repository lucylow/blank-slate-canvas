# Frontend Integration Guide - PitWall AI Backend V2

## Overview

This guide shows how to integrate your React frontend (`blank-slate-canvas`) with the enhanced PitWall AI backend.

---

## 🔗 Backend URL

**Local Development**: `http://localhost:8000`  
**Production** (if deployed): `https://your-backend-domain.com`

The backend is already configured to accept requests from:
- `http://localhost:3000` (React dev server)
- `http://localhost:5173` (Vite dev server)
- `https://void-form-forge.lovable.app` (Your production frontend)

---

## 📡 API Endpoints for Frontend

### 1. Get Complete Dashboard Data (REST)

**Endpoint**: `GET /api/dashboard/live`

**Use Case**: Initial load or polling updates

**Parameters**:
```typescript
{
  track: string;      // "sebring", "cota", etc.
  race: number;       // 1 or 2
  vehicle: number;    // Vehicle number (e.g., 7)
  lap: number;        // Current lap number
  enhanced?: boolean; // true = use V2 with explainability (default: true)
}
```

**React Hook Example**:
```typescript
// hooks/useDashboardData.ts
import { useState, useEffect } from 'react';

interface DashboardData {
  meta: {
    ok: boolean;
    track: string;
    lap: number;
    total_laps: number;
    enhanced_features: boolean;
  };
  tire_wear: {
    front_left: number;
    front_right: number;
    rear_left: number;
    rear_right: number;
    confidence: number;
    ci_lower: Record<string, number>;
    ci_upper: Record<string, number>;
    top_features: Record<string, number>;
    pit_window_optimal: number[];
  };
  performance: {
    current_lap: string;
    best_lap: string;
    gap_to_leader: string;
    predicted_finish: string;
    position: number;
  };
  gap_analysis: {
    position: number;
    gap_to_leader: string;
    gap_to_ahead: string | null;
    gap_to_behind: string | null;
    overtaking_opportunity: boolean;
    under_pressure: boolean;
  };
  strategy: {
    recommended_strategy: string;
    strategies: Array<{
      name: string;
      pit_lap: number;
      expected_finish: string;
      confidence: number;
      reasoning: string;
    }>;
  };
}

export function useDashboardData(
  track: string,
  race: number,
  vehicle: number,
  lap: number,
  pollingInterval: number = 2000
) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/dashboard/live?track=${track}&race=${race}&vehicle=${vehicle}&lap=${lap}&enhanced=true`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const json = await response.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, pollingInterval);

    return () => clearInterval(interval);
  }, [track, race, vehicle, lap, pollingInterval]);

  return { data, loading, error };
}
```

**Usage in Component**:
```typescript
// components/Dashboard.tsx
import { useDashboardData } from '@/hooks/useDashboardData';

export function Dashboard() {
  const { data, loading, error } = useDashboardData(
    'sebring',  // track
    1,          // race
    7,          // vehicle
    12,         // lap
    2000        // poll every 2 seconds
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      <h1>{data.meta.track} - Lap {data.meta.lap}</h1>
      
      {/* Tire Wear with Explainability */}
      <TireWearCard 
        wear={data.tire_wear}
        confidence={data.tire_wear.confidence}
        topFeatures={data.tire_wear.top_features}
      />
      
      {/* Performance Metrics */}
      <PerformanceCard performance={data.performance} />
      
      {/* Strategy Recommendations */}
      <StrategyCard strategy={data.strategy} />
    </div>
  );
}
```

---

### 2. Real-Time Streaming (SSE)

**Endpoint**: `GET /api/live/stream`

**Use Case**: Live race updates without polling

**Parameters**:
```typescript
{
  track: string;
  race: number;
  vehicle: number;
  start_lap?: number;  // default: 1
  interval?: number;   // seconds between updates, default: 1.0
}
```

**React Hook Example**:
```typescript
// hooks/useLiveStream.ts
import { useState, useEffect } from 'react';

export function useLiveStream(
  track: string,
  race: number,
  vehicle: number,
  startLap: number = 1
) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `http://localhost:8000/api/live/stream?track=${track}&race=${race}&vehicle=${vehicle}&start_lap=${startLap}&interval=1.0`;
    
    const eventSource = new EventSource(url);

    eventSource.addEventListener('update', (e) => {
      const json = JSON.parse(e.data);
      setData(json);
      setConnected(true);
      setError(null);
    });

    eventSource.addEventListener('error', (e: any) => {
      const errorData = JSON.parse(e.data);
      setError(errorData.error);
    });

    eventSource.addEventListener('complete', () => {
      console.log('Race completed');
      eventSource.close();
    });

    eventSource.onerror = () => {
      setConnected(false);
      setError('Connection lost');
    };

    return () => {
      eventSource.close();
    };
  }, [track, race, vehicle, startLap]);

  return { data, connected, error };
}
```

**Usage**:
```typescript
// components/LiveDashboard.tsx
import { useLiveStream } from '@/hooks/useLiveStream';

export function LiveDashboard() {
  const { data, connected, error } = useLiveStream('sebring', 1, 7, 1);

  return (
    <div>
      <div className="status">
        {connected ? '🟢 Live' : '🔴 Disconnected'}
      </div>
      
      {error && <div className="error">{error}</div>}
      
      {data && (
        <div>
          <h2>Lap {data.meta.lap} / {data.meta.total_laps}</h2>
          {/* Dashboard components */}
        </div>
      )}
    </div>
  );
}
```

---

### 3. Demo Data (for Development)

**Endpoint**: `GET /api/demo/seed`

**Use Case**: Frontend development without real data

**Parameters**:
```typescript
{
  name?: string;  // "best_overtake" (default) or other scenarios
}
```

**Usage**:
```typescript
// hooks/useDemoData.ts
export async function fetchDemoData(scenario: string = 'best_overtake') {
  const response = await fetch(
    `http://localhost:8000/api/demo/seed?name=${scenario}`
  );
  return response.json();
}
```

---

### 4. Backend Configuration

**Endpoint**: `GET /api/config`

**Use Case**: Get available tracks and backend features

**Usage**:
```typescript
// hooks/useBackendConfig.ts
import { useState, useEffect } from 'react';

interface BackendConfig {
  version: string;
  tracks: Array<{
    id: string;
    name: string;
    location: string;
    length_miles: number;
    turns: number;
  }>;
  features: {
    enhanced_predictor: boolean;
    uncertainty_quantification: boolean;
    explainability: boolean;
    sse_streaming: boolean;
    model_evaluation: boolean;
  };
}

export function useBackendConfig() {
  const [config, setConfig] = useState<BackendConfig | null>(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/config')
      .then(res => res.json())
      .then(setConfig);
  }, []);

  return config;
}
```

---

## 🎨 UI Components for New Features

### 1. Tire Wear with Confidence Intervals

```typescript
// components/TireWearCard.tsx
interface TireWearCardProps {
  wear: {
    front_left: number;
    front_right: number;
    rear_left: number;
    rear_right: number;
    confidence: number;
    ci_lower: Record<string, number>;
    ci_upper: Record<string, number>;
  };
}

export function TireWearCard({ wear }: TireWearCardProps) {
  return (
    <div className="tire-wear-card">
      <h3>Tire Wear</h3>
      
      <div className="confidence-badge">
        Confidence: {(wear.confidence * 100).toFixed(0)}%
      </div>
      
      <div className="tires-grid">
        {['front_left', 'front_right', 'rear_left', 'rear_right'].map(tire => (
          <div key={tire} className="tire">
            <div className="tire-label">{tire.replace('_', ' ').toUpperCase()}</div>
            <div className="tire-value">{wear[tire]}%</div>
            <div className="tire-ci">
              [{wear.ci_lower[tire]}% - {wear.ci_upper[tire]}%]
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Feature Importance (Explainability)

```typescript
// components/FeatureImportance.tsx
interface FeatureImportanceProps {
  features: Record<string, number>;
}

export function FeatureImportance({ features }: FeatureImportanceProps) {
  const sortedFeatures = Object.entries(features)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);  // Top 3

  return (
    <div className="feature-importance">
      <h4>Top Contributors to Tire Wear</h4>
      
      {sortedFeatures.map(([feature, importance]) => (
        <div key={feature} className="feature-bar">
          <div className="feature-label">
            {feature.replace(/_/g, ' ')}
          </div>
          <div className="feature-bar-container">
            <div 
              className="feature-bar-fill"
              style={{ width: `${importance * 100}%` }}
            />
          </div>
          <div className="feature-value">
            {(importance * 100).toFixed(1)}%
          </div>
        </div>
      ))}
      
      <div className="explanation">
        💡 {sortedFeatures[0][0].replace(/_/g, ' ')} is the main factor affecting tire wear
      </div>
    </div>
  );
}
```

### 3. Strategy Recommendations

```typescript
// components/StrategyCard.tsx
interface StrategyCardProps {
  strategy: {
    recommended_strategy: string;
    strategies: Array<{
      name: string;
      pit_lap: number;
      expected_finish: string;
      confidence: number;
      reasoning: string;
    }>;
  };
}

export function StrategyCard({ strategy }: StrategyCardProps) {
  const recommended = strategy.strategies.find(
    s => s.name === strategy.recommended_strategy
  );

  return (
    <div className="strategy-card">
      <h3>Strategy Recommendation</h3>
      
      {recommended && (
        <div className="recommended-strategy">
          <div className="strategy-header">
            <span className="badge">RECOMMENDED</span>
            <span className="confidence">
              {(recommended.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
          
          <div className="strategy-details">
            <div>Pit on Lap: <strong>{recommended.pit_lap}</strong></div>
            <div>Expected Finish: <strong>{recommended.expected_finish}</strong></div>
          </div>
          
          <div className="strategy-reasoning">
            {recommended.reasoning}
          </div>
        </div>
      )}
      
      <div className="alternative-strategies">
        <h4>Alternative Strategies</h4>
        {strategy.strategies
          .filter(s => s.name !== strategy.recommended_strategy)
          .map(s => (
            <div key={s.name} className="strategy-option">
              <div>Pit Lap {s.pit_lap} → {s.expected_finish}</div>
              <div className="confidence-small">
                {(s.confidence * 100).toFixed(0)}%
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
```

---

## 🔧 Environment Configuration

### `.env.local` (Frontend)

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_VERSION=2.0.0
VITE_USE_ENHANCED_PREDICTOR=true
VITE_ENABLE_SSE=true
```

### API Client Setup

```typescript
// lib/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = {
  dashboard: {
    live: (params: {
      track: string;
      race: number;
      vehicle: number;
      lap: number;
      enhanced?: boolean;
    }) => {
      const query = new URLSearchParams({
        track: params.track,
        race: params.race.toString(),
        vehicle: params.vehicle.toString(),
        lap: params.lap.toString(),
        enhanced: (params.enhanced ?? true).toString(),
      });
      return fetch(`${API_BASE_URL}/api/dashboard/live?${query}`);
    },
    
    stream: (params: {
      track: string;
      race: number;
      vehicle: number;
      start_lap?: number;
      interval?: number;
    }) => {
      const query = new URLSearchParams({
        track: params.track,
        race: params.race.toString(),
        vehicle: params.vehicle.toString(),
        start_lap: (params.start_lap ?? 1).toString(),
        interval: (params.interval ?? 1.0).toString(),
      });
      return new EventSource(`${API_BASE_URL}/api/live/stream?${query}`);
    },
  },
  
  demo: {
    seed: (scenario: string = 'best_overtake') => 
      fetch(`${API_BASE_URL}/api/demo/seed?name=${scenario}`),
  },
  
  config: () => 
    fetch(`${API_BASE_URL}/api/config`),
  
  health: () => 
    fetch(`${API_BASE_URL}/api/health`),
};
```

---

## 🎯 Recommended Integration Approach

### Phase 1: Basic Integration (1-2 hours)
1. Add `useDashboardData` hook
2. Update existing components to use new data structure
3. Test with demo endpoint first

### Phase 2: Enhanced Features (2-3 hours)
1. Add confidence intervals to tire wear display
2. Add feature importance visualization
3. Add strategy recommendations with reasoning

### Phase 3: Real-Time Streaming (1-2 hours)
1. Add `useLiveStream` hook
2. Create live dashboard view
3. Add connection status indicator

### Phase 4: Polish (1 hour)
1. Add loading states
2. Add error handling
3. Add fallback to demo data

---

## 🐛 Troubleshooting

### CORS Errors
**Problem**: `Access-Control-Allow-Origin` error

**Solution**: Backend is already configured for your frontend. If you're using a different URL, update `app/config.py`:
```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://your-new-frontend-url.com",
]
```

### SSE Connection Fails
**Problem**: EventSource connection closes immediately

**Solution**: 
1. Check backend is running: `curl http://localhost:8000/api/health`
2. Check browser console for errors
3. Try REST endpoint first to verify data is available

### Slow Response Times
**Problem**: Dashboard endpoint takes > 5 seconds

**Solution**:
1. Backend has 30-second cache - subsequent requests should be fast
2. Reduce `max_laps` in telemetry loading
3. Use SSE streaming instead of polling

---

## 📚 Complete Example App

```typescript
// App.tsx
import { useState } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { TireWearCard } from '@/components/TireWearCard';
import { FeatureImportance } from '@/components/FeatureImportance';
import { StrategyCard } from '@/components/StrategyCard';
import { PerformanceCard } from '@/components/PerformanceCard';

export function App() {
  const [track] = useState('sebring');
  const [race] = useState(1);
  const [vehicle] = useState(7);
  const [lap, setLap] = useState(12);

  const { data, loading, error } = useDashboardData(track, race, vehicle, lap);

  if (loading) return <div>Loading PitWall AI...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="app">
      <header>
        <h1>PitWall AI - {data.meta.track}</h1>
        <div className="lap-controls">
          <button onClick={() => setLap(l => Math.max(1, l - 1))}>← Prev Lap</button>
          <span>Lap {lap} / {data.meta.total_laps}</span>
          <button onClick={() => setLap(l => Math.min(data.meta.total_laps, l + 1))}>Next Lap →</button>
        </div>
      </header>

      <main className="dashboard-grid">
        <div className="col-1">
          <TireWearCard wear={data.tire_wear} />
          <FeatureImportance features={data.tire_wear.top_features} />
        </div>

        <div className="col-2">
          <PerformanceCard performance={data.performance} />
          <StrategyCard strategy={data.strategy} />
        </div>
      </main>

      {data.meta.enhanced_features && (
        <footer>
          ✨ Enhanced AI features enabled (explainability + uncertainty)
        </footer>
      )}
    </div>
  );
}
```

---

## 🚀 Deployment Notes

### Backend Deployment
1. Deploy backend to cloud service (Railway, Render, Fly.io)
2. Set environment variable: `PITWALL_FRONTEND_ORIGINS=https://void-form-forge.lovable.app`
3. Update frontend `VITE_API_BASE_URL` to backend URL

### Frontend Deployment
1. Build frontend: `npm run build`
2. Deploy to Lovable or Vercel
3. Ensure CORS is configured on backend

---

**Version**: 2.0.0  
**Last Updated**: November 20, 2025  
**Status**: ✅ Ready for Integration
