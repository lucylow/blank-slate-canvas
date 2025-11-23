# Impact Features Implementation

This document describes the feature flag system and impact features that have been added to the PitWall AI project.

## Files Created

### Feature Flag System
1. **`src/featureFlags/featureRegistry.ts`** - Central registry for all feature flags
2. **`src/featureFlags/FeatureProvider.tsx`** - React context provider for feature flags
3. **`src/main.tsx`** - Updated to wrap app with FeatureProvider

### Backend Service
1. **`backend/package.json`** - Backend dependencies
2. **`backend/index.js`** - Express + WebSocket server for feature flags and agent events
3. **`backend/data/flags.json`** - Default feature flag values
4. **`backend/data/mock_agents.json`** - Sample agent event data

### Frontend Clients
1. **`src/lib/backendClient.ts`** - REST API client for feature flags
2. **`src/lib/agentWSClient.ts`** - WebSocket client for agent events

### Components
1. **`src/components/DriverCoachPanel.tsx`** - Driver coaching AI panel
2. **`src/components/AnomalyStrategyPanel.tsx`** - Anomaly-driven strategy panel
3. **`src/components/MultiSeriesPanel.tsx`** - Multi-series expansion panel
4. **`src/components/ImpactTabs.tsx`** - Tabbed interface with live WebSocket events

### Settings Integration
1. **`src/pages/Settings.tsx`** - Updated with feature flag toggles tab

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Start Backend Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:4001` by default.

### 3. Configure Frontend Environment

Add to your `.env.local` file (if using Vite/CRA):

```
VITE_BACKEND_URL=http://localhost:4001
VITE_BACKEND_WS_URL=ws://localhost:4001
```

### 4. Manual Integration into Index.tsx

Since the Index.tsx file is very large, you may need to manually add:

**At the top with other imports:**
```typescript
import ImpactTabs from "@/components/ImpactTabs";
import DriverCoachPanel from "@/components/DriverCoachPanel";
import AnomalyStrategyPanel from "@/components/AnomalyStrategyPanel";
import MultiSeriesPanel from "@/components/MultiSeriesPanel";
```

**Add a new section after the Data & Analytics APIs section (around line 2606):**
```typescript
{/* Impact Features Section */}
<section id="impact-features" className="py-24 px-6 bg-gradient-to-b from-background via-primary/5 to-background relative overflow-hidden scroll-mt-20">
  <div className="container mx-auto max-w-7xl">
    <div className="text-center mb-12">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mb-6 shadow-xl shadow-primary/20">
        <Sparkles className="w-8 h-8 text-primary-foreground" />
      </div>
      <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Impact Features
      </h2>
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
        Advanced AI features designed to democratize professional-grade analytics and enhance racing strategy.
        Enable features via Settings → Feature Flags.
      </p>
    </div>

    {/* Impact Tabs - Live Agent Events */}
    <div className="mb-12">
      <ImpactTabs />
    </div>

    {/* Individual Feature Panels Grid */}
    <div className="grid md:grid-cols-3 gap-6">
      <DriverCoachPanel />
      <AnomalyStrategyPanel />
      <MultiSeriesPanel />
    </div>
  </div>
</section>
```

## Feature Flags

The following feature flags are available:

1. **`impact_democratize_analytics`** - Enables analytics dashboards for smaller GR Cup teams
2. **`impact_driver_coaching`** - Activates real-time coaching alerts and corner feedback
3. **`impact_anomaly_strategy`** - Allows anomaly events to trigger strategy recalculations
4. **`impact_scaling_otherseries`** - Shows GT4/Endurance/Grassroots modes

## Usage

1. **Enable Features**: Go to Settings → Feature Flags tab and toggle features on/off
2. **View Live Events**: The ImpactTabs component shows real-time agent events via WebSocket
3. **Individual Panels**: Each feature has its own panel component that only renders when enabled

## Backend API Endpoints

- `GET /api/flags` - Get current feature flags
- `POST /api/flags` - Update feature flags
- `GET /api/mock_agents` - Get mock agent events
- `POST /api/insights` - Save a new insight
- `WS /ws/agents` - WebSocket for live agent events

## Next Steps

- Wire backend flags to FeatureProvider for unified state
- Add authentication to backend endpoints
- Replace mock events with real agent outputs
- Add replay service for historical telemetry

