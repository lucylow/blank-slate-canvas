# AI Agent System Integration

This document describes the AI Agent System integration for the PitWall A.I. application.

## Overview

The AI Agent System provides real-time insights, agent monitoring, and telemetry processing through a multi-agent architecture powered by Redis Streams.

## Architecture

```
Frontend (React/TypeScript)
    ↓
Agent API Server (Express/Node.js)
    ↓
Redis Streams
    ↓
AI Agents (Preprocessor, Predictor, EDA, Simulator, Explainer, Delivery)
```

## Components

### Frontend Components

1. **AgentDashboard** (`src/components/AgentDashboard/AgentDashboard.tsx`)
   - Main dashboard displaying agent status, insights, and queue metrics
   - Real-time updates via WebSocket

2. **InsightModal** (`src/components/InsightModal/InsightModal.tsx`)
   - Detailed view of individual insights
   - Shows predictions, explanations, and recommendations

3. **RealTimeMetrics** (`src/components/RealTimeMetrics/RealTimeMetrics.tsx`)
   - Visual metrics dashboard
   - Canvas-based gauges for system performance

### Hooks

1. **useAgentSystem** (`src/hooks/useAgentSystem.ts`)
   - Main hook for managing agent system state
   - Handles WebSocket connections and API calls

2. **useTelemetryWebSocket** (`src/hooks/useTelemetryWebSocket.ts`)
   - WebSocket connection management
   - Auto-reconnection with exponential backoff

### Backend Services

1. **Agent API Server** (`server/agent-api-server.js`)
   - Express server providing REST API for agent system
   - Endpoints for agent status, insights, and telemetry ingestion

2. **Redis Client** (`src/services/redisClient.js`)
   - Redis connection and stream management
   - Methods for telemetry ingestion and insight retrieval

## Setup

### Prerequisites

1. **Redis Server**
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:7-alpine
   
   # Or install locally
   brew install redis  # macOS
   sudo apt-get install redis-server  # Ubuntu
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

### Running the System

1. **Start Redis** (if not using Docker)
   ```bash
   redis-server
   ```

2. **Start Agent API Server**
   ```bash
   npm run agent-api
   # Or with auto-reload (requires nodemon)
   npm run agent-api:dev
   ```

3. **Start Frontend**
   ```bash
   npm run dev
   ```

4. **Start AI Agents** (in separate terminals)
   ```bash
   # Orchestrator
   REDIS_URL=redis://localhost:6379 ORCH_PORT=9090 node agents/orchestrator/index.js
   
   # Preprocessor
   REDIS_URL=redis://localhost:6379 node agents/preprocessor/index.js
   
   # Predictor (Python)
   REDIS_URL=redis://localhost:6379 AGENT_ID=predictor-01 python agents/predictor/predictor_agent.py
   
   # Delivery Agent
   REDIS_URL=redis://localhost:6379 DELIVER_PORT=8082 node agents/delivery/index.js
   ```

## API Endpoints

### Agent Status
```
GET /api/agents/status
```
Returns current agent status and queue lengths.

**Response:**
```json
{
  "agents": [
    {
      "id": "preprocessor-1",
      "status": "active",
      "types": ["preprocess"],
      "tracks": ["cota", "sebring"]
    }
  ],
  "queues": {
    "tasksLength": 5,
    "resultsLength": 12,
    "inboxLengths": [
      { "agentId": "preprocessor-1", "length": 2 }
    ]
  }
}
```

### Get Insight
```
GET /api/insights/:id
```
Retrieves detailed insight by ID.

### Submit Telemetry
```
POST /api/telemetry
Content-Type: application/json

{
  "track": "cota",
  "chassis": "GR86-002",
  "lap": 12,
  "lapdist_m": 280.5,
  "speed_kmh": 210,
  "accx_can": 0.03,
  "accy_can": 0.2
}
```

### System Health
```
GET /api/system/health
```
Returns overall system health status.

## Environment Variables

- `REDIS_URL` - Redis connection string (default: `redis://localhost:6379`)
- `AGENT_API_PORT` - Port for agent API server (default: `3001`)
- `VITE_WS_URL` - WebSocket URL for frontend (default: `ws://localhost:8080`)

## Usage in Frontend

### Using the Agent Dashboard

```tsx
import AgentDashboard from '@/components/AgentDashboard/AgentDashboard';

function App() {
  return <AgentDashboard />;
}
```

### Using the Hook Directly

```tsx
import { useAgentSystem } from '@/hooks/useAgentSystem';

function MyComponent() {
  const {
    agents,
    insights,
    queueStats,
    fetchInsightDetails,
    submitTelemetry
  } = useAgentSystem();

  // Use the data...
}
```

## WebSocket Messages

The system uses WebSocket for real-time updates:

- `insight_update` - New insight generated
- `eda_result` - EDA analysis result
- `agent_status_update` - Agent status change

## Redis Streams

The system uses the following Redis streams:

- `telemetry.stream` - Incoming telemetry data
- `tasks.stream` - Task queue for agents
- `results.stream` - Agent results
- `agents.registry` - Agent registration hash
- `agent:{id}:inbox` - Per-agent task queues

## Troubleshooting

### Redis Connection Issues
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` environment variable
- Ensure Redis is accessible from all services

### Agent Not Appearing
- Check agent logs for registration errors
- Verify agent is connecting to correct Redis instance
- Check `agents.registry` in Redis: `redis-cli HGETALL agents.registry`

### No Insights
- Verify telemetry is being ingested
- Check task queue: `redis-cli XLEN tasks.stream`
- Verify agents are processing tasks
- Check results stream: `redis-cli XLEN results.stream`

## Development

### Adding New Agent Types

1. Create agent implementation in `agents/` directory
2. Register agent with orchestrator
3. Update frontend types if needed

### Extending the Dashboard

Components are modular and can be extended:
- Add new metrics to `RealTimeMetrics`
- Extend insight display in `InsightModal`
- Add new agent status indicators in `AgentDashboard`

## Production Deployment

1. Set up Redis cluster for high availability
2. Configure environment variables
3. Deploy agents as separate services (Kubernetes recommended)
4. Set up monitoring and alerting
5. Configure WebSocket proxy/load balancer

See `k8s/agents/` for Kubernetes deployment examples.

