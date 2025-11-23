# Edge Functions Implementation Guide

This document describes the production-ready Edge Functions system for real-time race analytics.

## Overview

Three edge functions provide real-time analytics for race strategy and driver coaching:

1. **coaching** - Micro coaching messages for drivers during sessions
2. **pit-window** - Optimal pit timing calculations with traffic awareness
3. **predict-tire-wear** - Per-lap tire wear predictions with confidence bands

## Architecture

### Edge Functions Location
- `supabase/functions/coaching/index.ts`
- `supabase/functions/pit-window/index.ts`
- `supabase/functions/predict-tire-wear/index.ts`

### Frontend Components
- Dashboard: `src/components/EdgeFunctionsDashboard.tsx`
- API Client: `src/api/edgeFunctions.ts`
- Metrics Hook: `src/hooks/useEdgeFunctionMetrics.ts`
- Page: `src/pages/EdgeFunctionsPage.tsx`

## Function Specifications

### coaching

**Purpose**: Produce micro coaching messages (one-liners or PSAs) for driver or engineer during and after sessions.

**Input**:
```typescript
{
  chassisId: string;
  lap: number;
  sector?: number;
  telemetryWindow: Array<{
    t: number;
    speed: number;
    accx: number;
    accy: number;
    brake: number;
    throttle: number;
    steering: number;
  }>;
  modelVersion?: string;
}
```

**Output**:
```typescript
{
  requestId: string;
  adviceId: string;
  priority: 'low' | 'medium' | 'high';
  message: string;
  evidence: Array<{ time: string; metric: string; value: number }>;
  confidence: number;
  cached_until?: string | null;
}
```

**SLA**: <200ms for live mode, <1s for batch  
**Retries**: 2, backoff 200ms → 1s

### pit-window

**Purpose**: Compute optimal lap window(s) to pit, accounting for pit-loss, tire cliff, traffic distribution.

**Input**:
```typescript
{
  sessionMeta?: Record<string, any>;
  chassisId: string;
  lapNumber: number;
  remainingLaps: number;
  pitLossSeconds?: number;
  currentTireState?: Record<string, any>;
  competitorPositions?: Array<any>;
}
```

**Output**:
```typescript
{
  requestId: string;
  recommendedWindow: [number, number] | null;
  expectedGainSeconds: number;
  confidence: number;
  scenarios: Array<{ label: string; totalTime: number }>;
  cached_until?: string | null;
  reason?: string;
  safeFallback?: string;
}
```

**SLA**: <300ms interactive; <2s batch simulation  
**Retries**: 2, backoff 200ms → 1s

### predict-tire-wear

**Purpose**: Per-lap wear prediction for each compound and per-corner heatmap.

**Input**:
```typescript
{
  chassisId: string;
  lapHistory: Array<any>;
  ambientTemp?: number;
  compound?: string;
}
```

**Output**:
```typescript
{
  requestId: string;
  pred_loss_per_lap_seconds: number;
  laps_until_0_5s: number;
  temp_map: number[][];
  confidence: number;
  cached_until?: string | null;
  stale?: boolean;
}
```

**SLA**: <150ms  
**Retries**: 2, backoff 200ms → 1s  
**Caching**: 30s TTL for repeated queries

## Deployment

### Supabase Configuration

Add to `supabase/config.toml`:

```toml
[functions.coaching]
verify_jwt = false
memory = 128
timeout = 1

[functions.pit-window]
verify_jwt = false
memory = 256
timeout = 2

[functions.predict-tire-wear]
verify_jwt = false
memory = 192
timeout = 1.5
```

### Environment Variables

Required environment variables:
- `MODEL_ENDPOINT` - Your model inference endpoint
- `MODEL_KEY` - API key for model endpoint
- `LOVABLE_API_KEY` - Fallback AI gateway key
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for DB access

### Deployment Commands

```bash
# Deploy all functions
supabase functions deploy coaching
supabase functions deploy pit-window
supabase functions deploy predict-tire-wear

# Or deploy all at once
supabase functions deploy
```

## Observability

### Metrics Tracked

- `invocations` - Number of function calls
- `success_rate` - Percentage of successful calls
- `p95_latency_ms` - 95th percentile latency
- `avg_confidence` - Average prediction confidence
- `model_version` - Model version used

### Structured Logging

All functions emit structured JSON logs:
```json
{
  "service": "coaching",
  "requestId": "uuid",
  "chassisId": "chassis-1",
  "latencyMs": 120,
  "modelVersion": "v1.0",
  "confidence": 0.87,
  "outcome": "success"
}
```

### Dashboard

Access the dashboard at `/edge-functions` route. Features:
- Real-time status badges (active/idle/degraded/failed)
- Metrics table with invocations, success rate, latency, confidence
- Test buttons for each function
- Trace viewer for request debugging
- Friendly microcopy and tooltips

## Safety & Fallbacks

### Graceful Degradation

- **pit-window**: Returns `{ recommendedWindow: null, reason: 'timeout', safeFallback: 'defer to manual' }` on timeout
- **predict-tire-wear**: Returns last-known prediction with `confidence: 0.5` and `stale: true` on error
- **coaching**: Returns error response with request ID for tracking

### Retry Logic

All functions implement exponential backoff:
- Initial delay: 200ms
- Max retries: 2
- Backoff: 200ms → 1s

## Testing

### Unit Tests

Test input validation and error handling:
```typescript
// Example test
const result = await callCoaching({
  chassisId: 'test-1',
  lap: 5,
  telemetryWindow: [...]
});
expect(result.confidence).toBeGreaterThan(0);
```

### Integration Tests

Test with mock model endpoint:
```typescript
// Mock MODEL_ENDPOINT to return test data
const result = await testEdgeFunction('coaching');
expect(result).toHaveProperty('adviceId');
```

### Load Tests

Simulate 100 req/s for 1 minute and observe p95 latency:
```bash
# Use k6 or similar
k6 run load-test.js
```

## UX Features

### Friendly Microcopy

- Status badges: "listening", "waiting", "needs love", "needs attention"
- Success toasts: "Nice! predict-tire-wear returned a confident forecast (0.72)."
- Warning messages: "Low invocation volume detected — is this function wired into the live stream?"

### Animations

- Pulsing green dot for active functions
- Smooth table row animations
- Loading states with spinners

### Tooltips

- Function descriptions on hover
- Action button tooltips
- Success rate indicators with emoji (✅ / ⚠️ / ❌)

## Reference Document

The functions are designed to work with the seed document:
`/mnt/data/3. Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. (1).docx`

This document contains the full specification and requirements for the edge functions system.

## Next Steps

1. **Connect to Live Stream**: Wire functions into your real-time telemetry pipeline
2. **Model Integration**: Replace AI gateway fallback with your trained models
3. **Observability Backend**: Set up metrics aggregation (e.g., Datadog, New Relic)
4. **Alerting**: Configure alerts for degraded/failed status
5. **A/B Testing**: Test different model versions in production

## Support

For issues or questions:
- Check function logs in Supabase dashboard
- Review trace data in the Edge Functions dashboard
- Test functions using the "Run test" button
- Check environment variables are configured correctly

