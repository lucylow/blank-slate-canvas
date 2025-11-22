# AI Agent Integration Implementation

This document describes the three AI agent integration patterns implemented in the PitWall AI project.

## Overview

Three interactive frontend patterns have been implemented to integrate AI agents into the racing analytics dashboard:

1. **Real-Time Agent Dashboard** - Live agent status & insights with streaming
2. **Interactive Strategy Canvas** - Visual workflow designer with drag-and-drop
3. **Multi-Agent Collaboration Interface** - Pitwall team collaboration with specialized agents

## Implementation Details

### 1. Real-Time Agent Dashboard (`RealTimeAgentDashboard.tsx`)

**Pattern**: Mastra-style TypeScript-first agent integration

**Features**:
- Real-time agent status monitoring
- Streaming insights feed with confidence indicators
- Telemetry update handler
- Track and vehicle context display

**Components**:
- `useAgentStream` hook for polling agent decisions
- Status indicators (active/idle/error)
- Insights feed with priority badges
- Confidence bars for predictions

**Location**: `/src/components/RealTimeAgentDashboard.tsx`

**Usage**:
```tsx
<RealTimeAgentDashboard 
  agentId="tire-wear-predictor"
  track="cota"
  vehicle="gr86-002"
/>
```

### 2. Interactive Strategy Canvas (`StrategyCanvas.tsx`)

**Pattern**: OpenAI AgentKit-style workflow execution

**Features**:
- Drag-and-drop node palette
- Visual workflow builder
- Sequential workflow execution
- Node status tracking (pending/running/completed/error)

**Components**:
- Strategy node types: Telemetry Source, Tire Analysis, Fuel Calculator, Pit Optimizer, Competitor Watch
- Canvas area with drag-and-drop support
- Workflow execution with API integration
- Node positioning and removal

**Location**: `/src/components/StrategyCanvas.tsx`

**Usage**:
```tsx
<StrategyCanvas />
```

**API Integration**:
- Uses `executeAgentWorkflow` from `/src/api/pitwall.ts`
- Endpoint: `POST /api/agent-workflow`

### 3. Multi-Agent Collaboration Interface (`PitwallCollaboration.tsx`)

**Pattern**: Microsoft Agent Framework-style multi-agent coordination

**Features**:
- Specialized agent cards (Tire Specialist, Fuel Strategist, Competitor Analyst)
- Shared state management across agents
- Collaborative insights feed
- Agent-specific analysis requests

**Components**:
- `useAgentState` hook for shared state
- Agent grid with status indicators
- Collaborative insights display
- Telemetry context display

**Location**: `/src/components/PitwallCollaboration.tsx`

**Usage**:
```tsx
<PitwallCollaboration />
```

**API Integration**:
- Uses `requestAgentAnalysis` from `/src/api/pitwall.ts`
- Endpoint: `POST /api/agents/{agentId}/analyze`

## Custom Hooks

### `useAgentStream` (`/src/hooks/useAgentStream.ts`)

Provides real-time streaming of agent messages:
- Polls agent decisions at configurable intervals
- Converts agent decisions to message format
- Manages connection status
- Handles telemetry updates

**Options**:
- `agentId`: Optional agent identifier
- `track`: Track filter
- `vehicle`: Vehicle filter
- `enabled`: Enable/disable polling
- `pollInterval`: Polling interval in ms (default: 2000)

### `useAgentState` (`/src/hooks/useAgentState.ts`)

Manages shared state for multi-agent collaboration:
- Polls agent decisions
- Maintains race decisions, proverbs, and risk assessments
- Provides `requestAgentAnalysis` function
- Updates shared state atomically

**Options**:
- `pollInterval`: Polling interval in ms (default: 3000)
- `enabled`: Enable/disable polling

## API Functions

New API functions added to `/src/api/pitwall.ts`:

### `executeAgentWorkflow(request: WorkflowRequest): Promise<WorkflowResponse>`

Executes a workflow of agent nodes:
- Accepts workflow nodes with positions and types
- Returns execution results per node
- Endpoint: `POST /api/agent-workflow`

### `requestAgentAnalysis(agentId: string, request: AgentAnalysisRequest): Promise<AgentAnalysisResponse>`

Requests analysis from a specific agent:
- Accepts telemetry data and session state
- Returns agent recommendation with confidence
- Endpoint: `POST /api/agents/{agentId}/analyze`

## Showcase Page

A dedicated showcase page demonstrates all three patterns:

**Location**: `/src/pages/AIAgentIntegration.tsx`
**Route**: `/agent-integration`

Features:
- Tabbed interface for each pattern
- Pattern overview cards
- Implementation notes
- Getting started guide

## Integration with Existing Backend

All components are designed to work with the existing FastAPI backend:

1. **Agent Status**: Uses existing `/api/agents/status` endpoint
2. **Agent Decisions**: Uses existing `/api/agents/decisions` endpoint
3. **Telemetry Submission**: Uses existing `/api/agents/telemetry` endpoint
4. **Workflow Execution**: New endpoint `/api/agent-workflow` (needs backend implementation)
5. **Agent Analysis**: New endpoint `/api/agents/{agentId}/analyze` (needs backend implementation)

## Next Steps

### Backend Implementation

The following endpoints need to be implemented in the FastAPI backend:

1. **POST /api/agent-workflow**
   - Accepts workflow nodes and executes them sequentially
   - Returns results per node
   - Should integrate with existing agent system

2. **POST /api/agents/{agentId}/analyze**
   - Accepts telemetry and session state
   - Routes to appropriate agent based on agentId
   - Returns analysis with confidence and reasoning

### Enhancements

1. **WebSocket Streaming**: Replace polling with WebSocket connections for real-time updates
2. **Redis Caching**: Add Redis for improved performance and context management
3. **Framework Integration**: 
   - Integrate Mastra for TypeScript-first agent framework
   - Integrate OpenAI AgentKit for workflow execution
   - Integrate Microsoft Agent Framework for multi-agent coordination
4. **Authentication**: Add auth for production use
5. **Error Handling**: Enhanced error handling and retry logic

## File Structure

```
src/
├── components/
│   ├── RealTimeAgentDashboard.tsx    # Real-time dashboard component
│   ├── StrategyCanvas.tsx              # Strategy workflow canvas
│   └── PitwallCollaboration.tsx       # Multi-agent collaboration
├── hooks/
│   ├── useAgentStream.ts               # Agent streaming hook
│   └── useAgentState.ts                # Shared agent state hook
├── pages/
│   └── AIAgentIntegration.tsx         # Showcase page
└── api/
    └── pitwall.ts                      # API functions (updated)
```

## Usage Examples

### Accessing the Showcase

Navigate to `/agent-integration` in your browser to see all three patterns in action.

### Using Individual Components

You can also use the components individually in your own pages:

```tsx
import { RealTimeAgentDashboard } from '@/components/RealTimeAgentDashboard';
import { StrategyCanvas } from '@/components/StrategyCanvas';
import { PitwallCollaboration } from '@/components/PitwallCollaboration';

// In your component
<RealTimeAgentDashboard agentId="tire-wear-predictor" track="cota" />
<StrategyCanvas />
<PitwallCollaboration />
```

## Notes

- All components use polling by default but are designed to be easily upgraded to WebSocket streaming
- The components work with mock data when backend endpoints are not available
- Error handling is implemented to gracefully handle backend unavailability
- All components follow the existing design system and UI patterns

