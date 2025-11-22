# Smart Navigation Integration Guide

This document explains how to use and integrate the new Smart Navigation system into your application.

## Overview

The Smart Navigation system provides:
- **Two-tier menu**: Static app-level sections + dynamic agent cards
- **Hybrid ordering**: User-pinned first, then agent-priority, then recently used
- **Agent badges & health**: Real-time status indicators
- **Drag-and-drop reordering**: With persistence
- **Keyboard navigation**: Numeric shortcuts (1-9), search ("/"), arrow keys
- **Context-aware ordering**: Auto-bumps items with critical alerts

## Files Created

1. **`src/stores/navStore.ts`** - Zustand store for navigation state and agent status
2. **`src/lib/navOrder.ts`** - Scoring and ordering utilities
3. **`src/components/AgentBadge.tsx`** - Agent health badge component
4. **`src/components/SmartNavMenu.tsx`** - Main smart navigation menu component
5. **`src/components/layout/SmartSidebar.tsx`** - Enhanced sidebar with Smart Nav integration
6. **`src/hooks/useAgentNavIntegration.ts`** - Hook to integrate agent status updates

## Quick Start

### 1. Enable Smart Navigation

Replace your existing Sidebar with SmartSidebar in your layout:

```tsx
import { SmartSidebar } from '@/components/layout/SmartSidebar';

// In your page/layout component:
<SmartSidebar useSmartNav={true} />
```

### 2. Initialize Agent Status Integration

The `SmartSidebar` automatically calls `useAgentNavIntegration`, which:
- Polls `/api/agents/status` every 30 seconds
- Updates the navigation store with agent health status
- Handles agent alerts and previews (when available from backend)

### 3. Feature Flag Control

Enable Smart Navigation via the `useSmartNav` prop:

```tsx
// Enable Smart Nav
<SmartSidebar useSmartNav={true} />

// Use traditional sidebar (backwards compatible)
<SmartSidebar useSmartNav={false} />
```

## Navigation Items

Default navigation items are defined in `navStore.ts`:

**Static App Sections:**
- Home (`/`)
- Dashboard (`/dashboard`)
- Live (`/comprehensive`)
- Analytics (`/analytics`)
- Tracks (`/tracks`)
- Strategy (`/pitwall`)
- About (`/about`)
- Settings (`/settings`)

**Dynamic Agent Cards:**
- EDA Agent
- Predictor Agent
- Coach Agent
- Strategy Agent
- Simulator Agent
- Explainer Agent
- Anomaly Detective

## Customization

### Adding Custom Navigation Items

Update the `DEFAULT_NAV_ITEMS` in `src/stores/navStore.ts`:

```tsx
{ 
  id: 'custom-page', 
  title: 'Custom Page', 
  section: 'static', // or 'agent'
  route: '/custom', 
  freq: 0 
}
```

### Adjusting Scoring Weights

Edit weights in `src/lib/navOrder.ts`:

```tsx
const w = { 
  pin: 100,      // Pinned items priority
  alert: 40,     // Active alerts boost
  health: 20,    // Agent health
  freq: 8,       // Visit frequency
  recency: 4,    // Recent visits
  bump: 30       // Alert bump bonus
};
```

## Keyboard Shortcuts

- **`/`** - Open search
- **`1-9`** - Navigate to top 9 items
- **`Escape`** - Close search
- **`Enter`** - Activate selected item
- **`P`** - Pin/unpin item (when focused)

## Agent Status Integration

### Backend Requirements

For full functionality, your backend should emit `agent_status` messages:

```json
{
  "type": "agent_status",
  "agentId": "eda-01",
  "status": "healthy|degraded|offline",
  "latency_ms": 124,
  "last_update": 1699990000,
  "alert": {
    "level": "warning|critical",
    "score": 0.8,
    "summary": "Sector 2 instability"
  }
}
```

### WebSocket Integration (Future)

To enable real-time updates, extend `useAgentNavIntegration.ts`:

```tsx
useEffect(() => {
  const ws = new WebSocket(wsUrl);
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'agent_status') {
      setAgentStatus(msg);
    }
  };
  return () => ws.close();
}, [wsUrl]);
```

## Persistence

Navigation preferences are automatically persisted to `localStorage`:
- Item order (manualOrder)
- Pinned state
- Visit frequency
- Last visited timestamp

## Testing

### Mock Agent Status

Use `createMockAgentStatus` helper:

```tsx
import { createMockAgentStatus } from '@/hooks/useAgentNavIntegration';

const mockStatus = createMockAgentStatus('eda', {
  status: 'healthy',
  latency_ms: 150,
  alert: {
    level: 'critical',
    score: 0.9,
    summary: 'Test alert'
  }
});
```

### Unit Tests

Test ordering logic in `navOrder.ts`:

```tsx
import { computeNavOrder } from '@/lib/navOrder';

const items = [...];
const agents = { 'eda': { status: 'healthy', ... } };
const ordered = computeNavOrder(items, agents);
expect(ordered[0].id).toBe('pinned-item');
```

## Performance

- Scoring is memoized per render cycle
- Drag-and-drop uses optimized @dnd-kit library
- LocalStorage persistence is debounced
- Agent status polling is configurable (default: 30s)

## Accessibility

- Full keyboard navigation support
- ARIA labels and roles
- Focus management
- Screen reader friendly

## Future Enhancements

1. **Server-side sync** - POST to `/api/user/me/nav_prefs`
2. **A/B testing** - Measure `timeToNavigateAfterAlert`
3. **Mini preview tooltips** - Show insights on hover
4. **Compact mode** - Icons-only for tablets
5. **Analytics** - Track menu interaction metrics

