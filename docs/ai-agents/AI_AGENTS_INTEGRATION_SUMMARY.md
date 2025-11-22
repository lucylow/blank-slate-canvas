# AI Agents Integration - Complete Summary

This document summarizes the complete integration of AI agents across frontend, backend, and Lovable Cloud deployment.

## ✅ Integration Status

### Backend Integration
- ✅ **API Routes Created** (`app/routes/agents.py`)
  - `GET /api/agents/status` - Agent status and queue statistics
  - `GET /api/agents/decisions` - Get agent decisions (filterable by track/chassis/type)
  - `GET /api/agents/insights/{insight_id}` - Get detailed insight by ID
  - `POST /api/agents/telemetry` - Submit telemetry to agents
  - `WS /api/agents/decisions/ws` - WebSocket for real-time agent decisions

- ✅ **FastAPI Integration** (`app/main.py`)
  - Agent router registered and mounted
  - Graceful degradation if AI agents module unavailable

- ✅ **Redis Integration**
  - Connects to Redis for agent registry and decisions stream
  - Falls back to mock data if Redis unavailable (for demo/testing)
  - Supports both Redis Streams and Pub/Sub

### Frontend Integration
- ✅ **API Client** (`src/api/pitwall.ts`)
  - `getAgentStatus()` - Fetch agent status
  - `getAgentDecisions()` - Fetch agent decisions
  - `getInsightDetails()` - Get detailed insight
  - `submitTelemetryToAgents()` - Submit telemetry data

- ✅ **React Hooks** 
  - `useAgentSystem()` - Updated to use API client
  - `useAgentDecisions()` - Updated WebSocket URL path
  - All hooks properly typed with TypeScript

- ✅ **Vite Proxy Configuration** (`vite.config.ts`)
  - `/api/agents/*` routes to backend (port 8000)
  - WebSocket endpoints properly proxied
  - Supports both development and production

### JSON Data Flow

```
AI Agents (Python) 
  ↓ (JSON via Redis Streams)
Backend API (FastAPI)
  ↓ (JSON via REST/WebSocket)
Frontend (React/TypeScript)
  ↓ (JSON rendering)
Browser UI
```

**Data Formats:**
- **Telemetry Input**: JSON with track, chassis, lap, speed, accel, etc.
- **Agent Decisions**: JSON with decision_id, action, confidence, reasoning, evidence
- **Insights**: Full JSON with alternatives, evidence_frames, reasoning
- **Status**: JSON with agents array, queues, redis_available flag

### Lovable Cloud Configuration

**lovable.yaml Updates:**
- ✅ Added AI agents environment variables
- ✅ Redis configuration included
- ✅ Backend service configured on port 8000

**Dependencies (requirements.txt):**
- ✅ `redis==5.0.1` - Redis client
- ✅ `hiredis>=5.0.1` - Fast Redis protocol parser
- ✅ All other existing dependencies maintained

## 🔄 How It Works

### 1. Agent Registration
- Python AI agents connect to Redis and register themselves
- Backend polls Redis registry to get agent status
- Frontend fetches agent status via `/api/agents/status`

### 2. Telemetry Processing
- Telemetry submitted via `POST /api/agents/telemetry`
- Backend adds to Redis Stream (`telemetry.stream`)
- AI agents consume from stream and process
- Decisions published to Redis Stream (`results.stream`)

### 3. Decision Distribution
- Backend reads from `results.stream` or Redis Pub/Sub
- REST API: `GET /api/agents/decisions`
- WebSocket: `WS /api/agents/decisions/ws` for real-time updates
- Frontend hooks consume and display decisions

### 4. Insight Details
- Full insights stored in Redis Hash (`insight:{decision_id}`)
- Frontend fetches via `GET /api/agents/insights/{insight_id}`
- Includes reasoning, evidence, alternatives

## 📊 API Endpoints Reference

### REST Endpoints

#### Get Agent Status
```http
GET /api/agents/status
```

Response:
```json
{
  "success": true,
  "agents": [
    {
      "id": "strategy-01",
      "type": "strategist",
      "status": "active",
      "tracks": ["cota", "sebring", ...]
    }
  ],
  "queues": {
    "strategy-01": { "inbox_length": 5 },
    "results": { "length": 100 }
  },
  "redis_available": true
}
```

#### Get Agent Decisions
```http
GET /api/agents/decisions?track=sebring&chassis=GR86-01&limit=50
```

Response:
```json
{
  "success": true,
  "decisions": [
    {
      "type": "agent_decision",
      "agent_id": "strategy-01",
      "decision_id": "decision-123",
      "track": "sebring",
      "chassis": "GR86-01",
      "action": "Recommend pit lap 15",
      "confidence": 0.87,
      "risk_level": "moderate",
      "decision_type": "pit",
      "created_at": "2025-11-21T12:00:00Z"
    }
  ],
  "count": 1
}
```

#### Get Insight Details
```http
GET /api/agents/insights/{insight_id}
```

Response:
```json
{
  "success": true,
  "insight": {
    "decision_id": "decision-123",
    "agent_id": "strategy-01",
    "action": "Recommend pit lap 15",
    "confidence": 0.87,
    "reasoning": [
      "Tire wear trending at 35.2%",
      "Remaining laps: 10"
    ],
    "evidence": {
      "avg_wear_percent": 35.2,
      "lap_number": 12
    },
    "alternatives": [
      {"action": "Stay out", "risk": "high"}
    ]
  }
}
```

#### Submit Telemetry
```http
POST /api/agents/telemetry
Content-Type: application/json

{
  "track": "sebring",
  "chassis": "GR86-01",
  "lap": 12,
  "speed_kmh": 150,
  "accx_can": 0.5,
  "accy_can": 0.8,
  ...
}
```

### WebSocket Endpoints

#### Agent Decisions Stream
```
WS /api/agents/decisions/ws
```

Subscribe message (optional):
```json
{
  "track": "sebring",
  "chassis": "GR86-01"
}
```

Messages received:
```json
{
  "type": "agent_decision",
  "data": {
    "agent_id": "strategy-01",
    "decision_id": "decision-123",
    "action": "Recommend pit lap 15",
    "confidence": 0.87,
    ...
  }
}
```

## 🔧 Configuration

### Environment Variables

**Backend:**
- `REDIS_URL` - Redis connection URL (default: `redis://127.0.0.1:6379`)
- `AI_AGENTS_ENABLED` - Enable AI agents (default: `true`)
- `AI_AGENTS_REDIS_URL` - Redis URL for agents (default: same as `REDIS_URL`)

**Frontend:**
- `VITE_BACKEND_URL` - Backend API URL (default: relative path for dev)
- `VITE_BACKEND_WS_URL` - WebSocket URL (default: derived from HTTP URL)

### Development Setup

1. **Start Redis:**
   ```bash
   docker run -p 6379:6379 redis:7
   ```

2. **Start Backend:**
   ```bash
   cd app
   python -m uvicorn main:app --reload --port 8000
   ```

3. **Start AI Agents** (optional, in separate terminals):
   ```bash
   python ai_agents/ai_agents.py --mode strategy
   python ai_agents/ai_agents.py --mode coach
   python ai_agents/ai_agents.py --mode anomaly
   python ai_agents/agent_integration.py --mode live
   ```

4. **Start Frontend:**
   ```bash
   npm run dev
   ```

### Production Deployment

The integration works with or without Redis/AI agents running:
- **With Redis**: Full agent functionality, real-time decisions
- **Without Redis**: Mock data returned, graceful degradation

## ✅ Testing Checklist

- [x] Backend agent routes respond correctly
- [x] Frontend API client functions work
- [x] React hooks connect to backend
- [x] WebSocket connection established
- [x] JSON data flows correctly
- [x] Mock data works when Redis unavailable
- [x] Lovable configuration updated
- [x] Dependencies included in requirements.txt
- [x] Vite proxy configured correctly

## 🐛 Known Issues / Notes

1. **Redis Optional**: System degrades gracefully if Redis unavailable
2. **Mock Data**: Returns demo data when agents not running
3. **WebSocket Path**: Uses `/api/agents/decisions/ws` endpoint
4. **Type Safety**: All TypeScript types defined in `src/api/pitwall.ts`

## 📝 Next Steps

1. **Start AI Agents** if you want full functionality:
   - Run agent workers as separate processes
   - Or integrate into main backend process

2. **Monitor Agent Activity**:
   - Check `/api/agents/status` for agent health
   - Watch WebSocket stream for real-time decisions

3. **Customize Agents**:
   - Modify `ai_agents/ai_agents.py` for custom logic
   - Adjust confidence thresholds, decision rules

---

**Status**: ✅ Complete - AI agents fully integrated across frontend, backend, and Lovable Cloud

**Last Updated**: November 21, 2025

