"""
AI Agents API Routes
====================
Endpoints for AI agent status, decisions, and insights.
Integrates with the Python AI agents module in ai_agents/
"""
from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict, Any
import json
import logging
import asyncio
from datetime import datetime
import sys
from pathlib import Path

# Add ai_agents directory to path
ai_agents_path = Path(__file__).parent.parent.parent / "ai_agents"
if str(ai_agents_path) not in sys.path:
    sys.path.insert(0, str(ai_agents_path))

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agents", tags=["AI Agents"])

# In-memory store for agent decisions (in production, use Redis)
agent_decisions_store: Dict[str, List[Dict[str, Any]]] = {}
active_websockets: List[WebSocket] = []

# Try to import AI agents module (optional - graceful degradation)
try:
    from ai_agents import AgentDecision, TelemetryFrame, AgentType
    from agent_integration import AgentIntegration, DecisionAggregator
    AI_AGENTS_AVAILABLE = True
    logger.info("AI agents module loaded successfully")
except ImportError as e:
    logger.warning(f"AI agents module not available: {e}")
    AI_AGENTS_AVAILABLE = False


@router.get("/status")
async def get_agent_status():
    """
    Get status of all AI agents
    
    Returns:
    - List of registered agents
    - Queue statistics
    - Agent health status
    """
    try:
        # Check if Redis is available
        import redis.asyncio as redis
        redis_url = "redis://127.0.0.1:6379"
        
        try:
            redis_client = await redis.from_url(redis_url, socket_connect_timeout=1)
            await redis_client.ping()
            redis_available = True
            await redis_client.close()
        except Exception:
            redis_available = False
        
        # Try to get agents from Redis registry
        agents = []
        if redis_available:
            try:
                redis_client = await redis.from_url(redis_url)
                registry_key = "agents.registry"
                agent_data = await redis_client.hgetall(registry_key)
                await redis_client.close()
                
                for agent_id, agent_info in agent_data.items():
                    try:
                        agent_dict = json.loads(agent_info) if isinstance(agent_info, bytes) else json.loads(agent_info)
                        agent_type = agent_dict.get("type", "unknown")
                        # Return both type (string) and types (array) for compatibility
                        agents.append({
                            "id": agent_dict.get("id", agent_id.decode() if isinstance(agent_id, bytes) else agent_id),
                            "type": agent_type,
                            "types": [agent_type] if agent_type != "unknown" else [],  # Array for frontend compatibility
                            "status": agent_dict.get("status", "active"),  # Default to active if not specified
                            "registered_at": agent_dict.get("registered_at"),
                            "tracks": json.loads(agent_dict.get("tracks", "[]")) if isinstance(agent_dict.get("tracks"), str) else agent_dict.get("tracks", [])
                        })
                    except Exception as e:
                        logger.warning(f"Error parsing agent info: {e}")
                        continue
            except Exception as e:
                logger.warning(f"Error fetching agents from Redis: {e}")
        
        # If no agents found in Redis, return mock agents for demo
        if not agents:
            agents = [
                {
                    "id": "strategy-01",
                    "type": "strategist",
                    "types": ["strategist"],  # Array for frontend compatibility
                    "status": "active",
                    "registered_at": datetime.utcnow().isoformat(),
                    "tracks": ["cota", "road_america", "sonoma", "vir", "sebring", "barber", "indianapolis"]
                },
                {
                    "id": "coach-01",
                    "type": "coach",
                    "types": ["coach"],  # Array for frontend compatibility
                    "status": "active",
                    "registered_at": datetime.utcnow().isoformat(),
                    "tracks": []
                },
                {
                    "id": "anomaly-01",
                    "type": "anomaly_detective",
                    "types": ["anomaly_detective"],  # Array for frontend compatibility
                    "status": "active",
                    "registered_at": datetime.utcnow().isoformat(),
                    "tracks": []
                }
            ]
        
        # Get queue statistics - format to match frontend expectations
        queues = {
            "tasksLength": 0,
            "resultsLength": 0,
            "inboxLengths": []
        }
        if redis_available:
            try:
                redis_client = await redis.from_url(redis_url)
                # Check queue lengths for each agent
                inbox_lengths = []
                for agent in agents:
                    inbox_key = f"agent:{agent['id']}:inbox"
                    length = await redis_client.llen(inbox_key)
                    inbox_lengths.append({
                        "agentId": agent['id'],
                        "length": length
                    })
                
                # Check results stream length
                results_length = await redis_client.xlen("results.stream")
                
                # Check tasks stream length
                tasks_length = await redis_client.xlen("tasks.stream")
                
                queues = {
                    "tasksLength": tasks_length,
                    "resultsLength": results_length,
                    "inboxLengths": inbox_lengths
                }
                
                await redis_client.close()
            except Exception as e:
                logger.warning(f"Error fetching queue stats: {e}")
        
        return {
            "success": True,
            "agents": agents,
            "queues": queues,
            "redis_available": redis_available,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting agent status: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/decisions")
async def get_agent_decisions(
    track: Optional[str] = Query(None, description="Filter by track"),
    chassis: Optional[str] = Query(None, description="Filter by chassis"),
    limit: int = Query(50, description="Maximum number of decisions to return"),
    decision_type: Optional[str] = Query(None, description="Filter by decision type (pit, coach, anomaly)")
):
    """
    Get agent decisions
    
    Returns recent decisions made by AI agents, optionally filtered by track/chassis/type
    """
    try:
        import redis.asyncio as redis
        redis_url = "redis://127.0.0.1:6379"
        
        decisions = []
        
        try:
            redis_client = await redis.from_url(redis_url, socket_connect_timeout=1)
            await redis_client.ping()
            
            # Read from results stream
            results = await redis_client.xread(
                "BLOCK", 100, "COUNT", limit, "STREAMS", "results.stream", "0"
            )
            
            await redis_client.close()
            
            if results:
                for stream_name, entries in results:
                    for msg_id, fields in entries:
                        try:
                            result_json = fields.get(b"result")
                            if result_json:
                                decision = json.loads(result_json)
                                # Apply filters
                                if track and decision.get("track") != track:
                                    continue
                                if chassis and decision.get("chassis") != chassis:
                                    continue
                                if decision_type and decision.get("type") != decision_type:
                                    continue
                                decisions.append(decision)
                        except Exception as e:
                            logger.warning(f"Error parsing decision: {e}")
                            continue
        except Exception as e:
            logger.warning(f"Redis not available, using mock data: {e}")
            # Return mock decisions for demo
            decisions = [
                {
                    "type": "agent_decision",
                    "agent_id": "strategy-01",
                    "decision_id": f"decision-{datetime.utcnow().timestamp()}",
                    "track": track or "sebring",
                    "chassis": chassis or "GR86-01",
                    "action": "Recommend pit lap 15",
                    "confidence": 0.87,
                    "risk_level": "moderate",
                    "decision_type": "pit",
                    "created_at": datetime.utcnow().isoformat()
                }
            ]
        
        # Limit results
        decisions = decisions[:limit]
        
        return {
            "success": True,
            "decisions": decisions,
            "count": len(decisions),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting agent decisions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/{insight_id}")
async def get_insight_details(insight_id: str):
    """
    Get detailed insight/decision by ID
    
    Returns full decision data including reasoning, evidence, and alternatives
    """
    try:
        import redis.asyncio as redis
        redis_url = "redis://127.0.0.1:6379"
        
        try:
            redis_client = await redis.from_url(redis_url, socket_connect_timeout=1)
            await redis_client.ping()
            
            # Get insight from Redis
            insight_key = f"insight:{insight_id}"
            insight_data = await redis_client.hgetall(insight_key)
            await redis_client.close()
            
            if not insight_data:
                raise HTTPException(status_code=404, detail=f"Insight '{insight_id}' not found")
            
            # Parse insight payload
            payload_json = insight_data.get(b"payload") or insight_data.get("payload")
            if isinstance(payload_json, bytes):
                payload_json = payload_json.decode()
            
            insight = json.loads(payload_json) if isinstance(payload_json, str) else payload_json
            
            return {
                "success": True,
                "insight": insight,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.warning(f"Error fetching insight from Redis: {e}")
            # Return mock insight for demo
            return {
                "success": True,
                "insight": {
                    "decision_id": insight_id,
                    "agent_id": "strategy-01",
                    "agent_type": "strategist",
                    "decision_type": "pit",
                    "action": "Recommend pit lap 15",
                    "confidence": 0.87,
                    "risk_level": "moderate",
                    "reasoning": [
                        "Tire wear trending at 35.2%",
                        "Remaining laps: 10 (sufficient for pit + 1-stop strategy)",
                        "Gap to leader suggests undercut/overcut timing opportunity"
                    ],
                    "evidence": {
                        "avg_wear_percent": 35.2,
                        "lap_number": 12,
                        "remaining_laps": 10
                    },
                    "alternatives": [
                        {"action": "Stay out", "risk": "high", "rationale": "Tire may clip but preserve track position"},
                        {"action": "Pit now", "risk": "medium", "rationale": "Immediate pit but lose position"}
                    ]
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting insight details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/decisions/ws")
async def websocket_agent_decisions(websocket: WebSocket):
    """
    WebSocket endpoint for real-time agent decisions
    
    Streams agent decisions as they are made, filtered by track/chassis if provided
    """
    await websocket.accept()
    active_websockets.append(websocket)
    
    try:
        track = None
        chassis = None
        
        # Wait for initial subscription message
        try:
            message = await asyncio.wait_for(websocket.receive_text(), timeout=5.0)
            try:
                data = json.loads(message)
                track = data.get("track")
                chassis = data.get("chassis")
            except json.JSONDecodeError:
                pass
        except asyncio.TimeoutError:
            pass
        
        # Subscribe to Redis pub/sub for agent decisions
        import redis.asyncio as redis
        redis_url = "redis://127.0.0.1:6379"
        
        try:
            redis_client = await redis.from_url(redis_url, socket_connect_timeout=1)
            await redis_client.ping()
            
            pubsub = redis_client.pubsub()
            await pubsub.subscribe("agent_decisions")
            
            # Also read from results stream
            last_id = "$"
            
            async def stream_decisions():
                nonlocal last_id
                while True:
                    try:
                        # Read from results stream
                        results = await redis_client.xread(
                            "BLOCK", 2000, "COUNT", 10, "STREAMS", "results.stream", last_id
                        )
                        
                        if results:
                            for stream_name, entries in results:
                                for msg_id, fields in entries:
                                    try:
                                        result_json = fields.get(b"result")
                                        if result_json:
                                            decision = json.loads(result_json)
                                            
                                            # Apply filters
                                            if track and decision.get("track") != track:
                                                continue
                                            if chassis and decision.get("chassis") != chassis:
                                                continue
                                            
                                            # Send to WebSocket - use 'insight_update' to match frontend expectations
                                            await websocket.send_json({
                                                "type": "insight_update",
                                                "data": {
                                                    **decision,
                                                    "insight_id": decision.get("decision_id", decision.get("id", f"insight-{datetime.utcnow().timestamp()}")),
                                                    "track": decision.get("track", ""),
                                                    "chassis": decision.get("chassis", ""),
                                                    "created_at": decision.get("created_at", datetime.utcnow().isoformat())
                                                }
                                            })
                                            
                                            last_id = msg_id.decode()
                                    except Exception as e:
                                        logger.warning(f"Error processing decision: {e}")
                                        continue
                        
                        # Also check pub/sub
                        try:
                            message = await pubsub.get_message(timeout=0.1)
                            if message and message["type"] == "message":
                                decision = json.loads(message["data"])
                                
                                # Apply filters
                                if track and decision.get("track") != track:
                                    continue
                                if chassis and decision.get("chassis") != chassis:
                                    continue
                                
                                await websocket.send_json({
                                    "type": "insight_update",
                                    "data": {
                                        **decision,
                                        "insight_id": decision.get("decision_id", decision.get("id", f"insight-{datetime.utcnow().timestamp()}")),
                                        "track": decision.get("track", ""),
                                        "chassis": decision.get("chassis", ""),
                                        "created_at": decision.get("created_at", datetime.utcnow().isoformat())
                                    }
                                })
                        except Exception:
                            pass
                            
                    except Exception as e:
                        logger.error(f"Error streaming decisions: {e}")
                        await asyncio.sleep(1)
            
            # Run streaming in background
            await stream_decisions()
            
        except Exception as e:
            logger.warning(f"Redis not available for WebSocket: {e}")
            # Send mock decision for demo - use 'insight_update' to match frontend expectations
            await websocket.send_json({
                "type": "insight_update",
                "data": {
                    "insight_id": f"decision-{datetime.utcnow().timestamp()}",
                    "decision_id": f"decision-{datetime.utcnow().timestamp()}",
                    "agent_id": "strategy-01",
                    "track": track or "sebring",
                    "chassis": chassis or "GR86-01",
                    "action": "Recommend pit lap 15",
                    "confidence": 0.87,
                    "risk_level": "moderate",
                    "decision_type": "pit",
                    "type": "pit",
                    "created_at": datetime.utcnow().isoformat()
                }
            })
            
            # Keep connection alive
            while True:
                await asyncio.sleep(30)
                try:
                    await websocket.send_json({"type": "ping"})
                except Exception:
                    break
                    
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
    finally:
        if websocket in active_websockets:
            active_websockets.remove(websocket)


@router.post("/telemetry")
async def submit_telemetry(telemetry: Dict[str, Any]):
    """
    Submit telemetry data to AI agents for processing
    
    This endpoint accepts telemetry data and dispatches it to the agent system
    """
    try:
        import redis.asyncio as redis
        redis_url = "redis://127.0.0.1:6379"
        
        # Validate telemetry data
        required_fields = ["track", "chassis", "lap"]
        missing_fields = [f for f in required_fields if f not in telemetry]
        if missing_fields:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required fields: {missing_fields}"
            )
        
        try:
            redis_client = await redis.from_url(redis_url, socket_connect_timeout=1)
            await redis_client.ping()
            
            # Add to telemetry stream
            await redis_client.xadd(
                "telemetry.stream",
                "*",
                "data", json.dumps(telemetry)
            )
            
            await redis_client.close()
            
            return {
                "success": True,
                "message": "Telemetry submitted successfully",
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.warning(f"Redis not available, telemetry not processed: {e}")
            return {
                "success": False,
                "message": "Redis not available, telemetry not processed",
                "timestamp": datetime.utcnow().isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting telemetry: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

