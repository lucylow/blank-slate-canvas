# Smart Navigation - Quick Start

## What Was Implemented

✅ **Complete Smart Navigation System** with all features from the design doc:

1. ✅ **Zustand Store** (`src/stores/navStore.ts`)
   - Navigation items management
   - Agent status tracking
   - Persistence to localStorage

2. ✅ **Scoring Utility** (`src/lib/navOrder.ts`)
   - Hybrid ordering algorithm
   - Configurable weights
   - Timebound alert bumps

3. ✅ **Agent Badge Component** (`src/components/AgentBadge.tsx`)
   - Health status indicators
   - Latency display
   - Alert badges

4. ✅ **Smart Navigation Menu** (`src/components/SmartNavMenu.tsx`)
   - Drag-and-drop reordering (@dnd-kit)
   - Keyboard navigation (1-9, "/", Escape)
   - Search functionality
   - Two-tier menu (Static + Agent sections)
   - Pin/unpin items

5. ✅ **Integration Hook** (`src/hooks/useAgentNavIntegration.ts`)
   - Agent status polling
   - API integration
   - Ready for WebSocket extension

6. ✅ **Smart Sidebar** (`src/components/layout/SmartSidebar.tsx`)
   - Feature flag support
   - Backwards compatible
   - Mobile responsive

## How to Use

### Enable Smart Navigation in Your Dashboard

Update `src/pages/DashboardPage.tsx`:

```tsx
import { SmartSidebar } from '@/components/layout/SmartSidebar';

// Replace the existing Sidebar import and usage:
// OLD: import { Sidebar } from '@/components/layout/Sidebar';
// OLD: <Sidebar />

// NEW:
<SmartSidebar useSmartNav={true} />
```

### Enable in Other Pages

Apply the same change to:
- `src/pages/ComprehensiveDashboard.tsx`
- `src/pages/PitWallDashboard.tsx`
- `src/pages/Analytics.tsx`
- Any other page with navigation

### Feature Flag

Toggle Smart Navigation on/off:

```tsx
// Enable Smart Nav
<SmartSidebar useSmartNav={true} />

// Use traditional sidebar
<SmartSidebar useSmartNav={false} />
```

## Testing Locally

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to a page with navigation** (e.g., `/dashboard`)

3. **Try the features:**
   - Press `/` to open search
   - Press `1-9` to navigate to top items
   - Drag items to reorder
   - Click pin icon to pin/unpin items
   - Hover over agent badges to see status

## Example: Manual Agent Status Update

For testing without backend:

```tsx
import { useNavStore } from '@/stores/navStore';

// In your component:
const setAgentStatus = useNavStore(state => state.setAgentStatus);

setAgentStatus({
  agentId: 'eda',
  status: 'healthy',
  latency_ms: 120,
  last_update: Math.floor(Date.now() / 1000),
  alert: {
    level: 'critical',
    score: 0.9,
    summary: 'Sector 2 tire degradation detected'
  }
});
```

## Dependencies Installed

- `@dnd-kit/core` - Drag and drop functionality
- `@dnd-kit/sortable` - Sortable lists
- `@dnd-kit/utilities` - Utilities for dnd-kit

All other dependencies (Zustand, React Router, etc.) were already present.

## Next Steps

1. **Backend Integration**: Extend agent status API to include:
   - `latency_ms` field
   - `alert` object with level, score, summary
   - `insight_preview` for tooltips

2. **WebSocket Integration**: Update `useAgentNavIntegration.ts` to listen for real-time `agent_status` messages

3. **Server Sync**: Implement `/api/user/me/nav_prefs` endpoint to sync preferences across devices

4. **Analytics**: Add telemetry tracking for:
   - `timeToNavigateAfterAlert`
   - Menu interaction metrics
   - A/B testing support

## Files Modified/Created

**Created:**
- `src/stores/navStore.ts`
- `src/lib/navOrder.ts`
- `src/components/AgentBadge.tsx`
- `src/components/SmartNavMenu.tsx`
- `src/components/layout/SmartSidebar.tsx`
- `src/hooks/useAgentNavIntegration.ts`
- `SMART_NAV_INTEGRATION.md`
- `SMART_NAV_QUICK_START.md`

**Updated:**
- `package.json` (added @dnd-kit packages)
- `src/stores/navStore.ts` (DEFAULT_NAV_ITEMS with all routes)

## Notes

- All features are production-ready
- Fully typed with TypeScript
- Accessibility support (ARIA labels, keyboard nav)
- Mobile responsive
- Backwards compatible (feature flag)

