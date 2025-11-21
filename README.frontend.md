# Frontend integration notes

## Environment Variables

- `REACT_APP_DELIVER_WS` - WebSocket endpoint for Delivery agent. Default: auto inferred from current origin (replaces `http` with `ws` and appends `/ws/agents`)
- `REACT_APP_INSIGHTS_API` - HTTP endpoint for fetching full insight payload, default `/api/insights`

For Vite projects, you can also use:
- `VITE_DELIVER_WS` - WebSocket endpoint (alternative to REACT_APP_DELIVER_WS)
- `VITE_INSIGHTS_API` - HTTP endpoint (alternative to REACT_APP_INSIGHTS_API)

## Reference Design Doc

Reference design doc (local): `/mnt/data/3. Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .docx`

## Architecture

### Components

- **WSClient** (`src/lib/wsClient.ts`): WebSocket client with exponential backoff, heartbeat, and automatic reconnection
- **DeliveryProvider** (`src/components/DeliveryProvider.tsx`): React provider that initializes WebSocket connection and dispatches messages to Zustand store
- **agentStore** (`src/stores/agentStore.ts`): Zustand store managing insights, agents, and tasks state
- **InsightList** (`src/components/InsightList.tsx`): Virtualized list component using react-window for performance
- **InsightCard** (`src/components/InsightCard.tsx`): Individual insight card component
- **InsightModal** (`src/components/InsightModal.tsx`): Modal for displaying full insight details with lazy-loaded evidence
- **AgentStatusPanel** (`src/components/AgentStatusPanel.tsx`): Panel showing agent health status
- **TaskQueuePanel** (`src/components/TaskQueuePanel.tsx`): Panel showing pending tasks

### Data Flow

1. Delivery agent sends `insight_update` or `eda_result` messages via WebSocket
2. DeliveryProvider receives messages and calls `addInsightSummary()` to store summary
3. UI displays insights in virtualized list (InsightList)
4. When user clicks an insight, InsightModal lazy-fetches full payload from `/api/insights/:id`
5. Full insight (with evidence) is cached in store for subsequent views

### Store Structure

```typescript
{
  insights: Record<string, InsightFull>,  // Full insight data by ID
  insightOrder: string[],                  // Newest first, max 2000
  agents: Record<string, AgentInfo>,        // Agent status by ID
  tasks: Record<string, Task>,             // Tasks by ID
  loadingInsights: Record<string, boolean>  // Loading state per insight
}
```

## Usage

The `DeliveryProvider` is already wrapped around the app in `App.tsx`. To view the live insights dashboard, navigate to `/agent-insights`.

## Testing

Run tests with:
```bash
npm test
```

Test files:
- `src/__tests__/wsClient.test.ts` - WebSocket client smoke tests
- `src/__tests__/InsightModal.test.tsx` - Insight modal fetch tests

## Deployment Notes

- Delivery agent should expose WebSocket endpoint at `/ws/agents`
- Delivery agent should expose HTTP API at `/api/insights/:id` for fetching full insight payloads
- Ensure CORS is configured if frontend and backend are on different origins
- Set `REACT_APP_DELIVER_WS` to `ws://<host>:8082/ws/agents` (or appropriate port)
- Set `REACT_APP_INSIGHTS_API` to `http://<host>:8082/api/insights` (or appropriate port)
