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


# ============================================================================
# HUMAN-IN-THE-LOOP ENDPOINTS
# ============================================================================

@router.post("/decisions/{decision_id}/review")
async def review_agent_decision(
    decision_id: str,
    review: Dict[str, Any]
):
    """
    Human-in-the-loop: Review and approve/reject/modify an agent decision
    
    Request body:
    {
        "action": "approve" | "reject" | "modify",
        "modified_action": "string (if action is modify)",
        "feedback": "string (optional human feedback)",
        "reviewer": "string (optional reviewer name)"
    }
    """
    try:
        import redis.asyncio as redis
        redis_url = "redis://127.0.0.1:6379"
        
        action = review.get("action")
        if action not in ["approve", "reject", "modify"]:
            raise HTTPException(
                status_code=400,
                detail="action must be 'approve', 'reject', or 'modify'"
            )
        
        # Get the original decision
        try:
            redis_client = await redis.from_url(redis_url, socket_connect_timeout=1)
            await redis_client.ping()
            
            insight_key = f"insight:{decision_id}"
            insight_data = await redis_client.hgetall(insight_key)
            
            if not insight_data:
                # Try to find in results stream
                results = await redis_client.xread(
                    "BLOCK", 100, "COUNT", 100, "STREAMS", "results.stream", "0"
                )
                decision_found = False
                if results:
                    for stream_name, entries in results:
                        for msg_id, fields in entries:
                            result_json = fields.get(b"result")
                            if result_json:
                                decision = json.loads(result_json)
                                if decision.get("decision_id") == decision_id:
                                    decision_found = True
                                    break
                
                if not decision_found:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Decision '{decision_id}' not found"
                    )
            
            # Store human review
            review_data = {
                "decision_id": decision_id,
                "action": action,
                "modified_action": review.get("modified_action"),
                "feedback": review.get("feedback", ""),
                "reviewer": review.get("reviewer", "unknown"),
                "reviewed_at": datetime.utcnow().isoformat(),
                "timestamp": datetime.utcnow().isoformat()
            }
            
            review_key = f"review:{decision_id}"
            await redis_client.hset(
                review_key,
                mapping={
                    "payload": json.dumps(review_data),
                    "created_at": review_data["reviewed_at"]
                }
            )
            
            # Update decision status
            status_key = f"decision_status:{decision_id}"
            await redis_client.hset(
                status_key,
                mapping={
                    "status": action,
                    "reviewed_at": review_data["reviewed_at"],
                    "reviewer": review_data["reviewer"]
                }
            )
            
            # Publish review event for real-time updates
            await redis_client.publish(
                "agent_reviews",
                json.dumps({
                    "type": "human_review",
                    "decision_id": decision_id,
                    "action": action,
                    "timestamp": review_data["reviewed_at"]
                })
            )
            
            await redis_client.close()
            
            logger.info(f"Human review recorded: {decision_id} -> {action}")
            
            return {
                "success": True,
                "message": f"Decision {action}d successfully",
                "review": review_data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.warning(f"Redis not available, storing review in memory: {e}")
            # Fallback to in-memory storage
            if not hasattr(review_agent_decision, "_reviews"):
                review_agent_decision._reviews = {}
            
            review_data = {
                "decision_id": decision_id,
                "action": action,
                "modified_action": review.get("modified_action"),
                "feedback": review.get("feedback", ""),
                "reviewer": review.get("reviewer", "unknown"),
                "reviewed_at": datetime.utcnow().isoformat()
            }
            
            review_agent_decision._reviews[decision_id] = review_data
            
            return {
                "success": True,
                "message": f"Decision {action}d successfully (stored in memory)",
                "review": review_data,
                "timestamp": datetime.utcnow().isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reviewing decision: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/decisions/pending")
async def get_pending_decisions(
    track: Optional[str] = Query(None, description="Filter by track"),
    chassis: Optional[str] = Query(None, description="Filter by chassis"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    limit: int = Query(50, description="Maximum number of decisions to return")
):
    """
    Get pending agent decisions that require human review
    
    Returns decisions that:
    - Have not been reviewed yet
    - Have high risk levels
    - Have low confidence scores
    """
    try:
        import redis.asyncio as redis
        redis_url = "redis://127.0.0.1:6379"
        
        pending_decisions = []
        
        try:
            redis_client = await redis.from_url(redis_url, socket_connect_timeout=1)
            await redis_client.ping()
            
            # Read from results stream
            results = await redis_client.xread(
                "BLOCK", 100, "COUNT", limit * 2, "STREAMS", "results.stream", "0"
            )
            
            if results:
                for stream_name, entries in results:
                    for msg_id, fields in entries:
                        try:
                            result_json = fields.get(b"result")
                            if result_json:
                                decision = json.loads(result_json)
                                decision_id = decision.get("decision_id")
                                
                                # Check if decision has been reviewed
                                status_key = f"decision_status:{decision_id}"
                                status = await redis_client.hget(status_key, "status")
                                
                                if status:
                                    continue  # Already reviewed
                                
                                # Apply filters
                                if track and decision.get("track") != track:
                                    continue
                                if chassis and decision.get("chassis") != chassis:
                                    continue
                                if risk_level and decision.get("risk_level") != risk_level:
                                    continue
                                
                                # Check if decision needs review (high risk or low confidence)
                                needs_review = (
                                    decision.get("risk_level") in ["critical", "aggressive"] or
                                    decision.get("confidence", 1.0) < 0.7
                                )
                                
                                if needs_review:
                                    # Get full decision details
                                    insight_key = f"insight:{decision_id}"
                                    insight_data = await redis_client.hgetall(insight_key)
                                    
                                    full_decision = decision.copy()
                                    if insight_data:
                                        payload_json = insight_data.get(b"payload") or insight_data.get("payload")
                                        if isinstance(payload_json, bytes):
                                            payload_json = payload_json.decode()
                                        if payload_json:
                                            insight = json.loads(payload_json) if isinstance(payload_json, str) else payload_json
                                            full_decision.update({
                                                "reasoning": insight.get("reasoning", []),
                                                "evidence": insight.get("evidence", {}),
                                                "alternatives": insight.get("alternatives", [])
                                            })
                                    
                                    pending_decisions.append(full_decision)
                                    
                        except Exception as e:
                            logger.warning(f"Error parsing decision: {e}")
                            continue
            
            await redis_client.close()
            
        except Exception as e:
            logger.warning(f"Redis not available, returning mock pending decisions: {e}")
            # Return mock pending decisions for demo
            pending_decisions = [
                {
                    "decision_id": f"pending-{datetime.utcnow().timestamp()}",
                    "agent_id": "strategy-01",
                    "agent_type": "strategist",
                    "track": track or "sebring",
                    "chassis": chassis or "GR86-01",
                    "action": "Recommend pit lap 15",
                    "confidence": 0.65,
                    "risk_level": "aggressive",
                    "decision_type": "pit",
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
                    "created_at": datetime.utcnow().isoformat()
                }
            ]
        
        # Limit results
        pending_decisions = pending_decisions[:limit]
        
        return {
            "success": True,
            "decisions": pending_decisions,
            "count": len(pending_decisions),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting pending decisions: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/decisions/{decision_id}/review")
async def get_decision_review(decision_id: str):
    """
    Get human review for a specific decision
    """
    try:
        import redis.asyncio as redis
        redis_url = "redis://127.0.0.1:6379"
        
        try:
            redis_client = await redis.from_url(redis_url, socket_connect_timeout=1)
            await redis_client.ping()
            
            review_key = f"review:{decision_id}"
            review_data = await redis_client.hgetall(review_key)
            
            if not review_data:
                # Check in-memory fallback
                if hasattr(review_agent_decision, "_reviews") and decision_id in review_agent_decision._reviews:
                    return {
                        "success": True,
                        "review": review_agent_decision._reviews[decision_id],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                
                raise HTTPException(
                    status_code=404,
                    detail=f"Review for decision '{decision_id}' not found"
                )
            
            payload_json = review_data.get(b"payload") or review_data.get("payload")
            if isinstance(payload_json, bytes):
                payload_json = payload_json.decode()
            
            review = json.loads(payload_json) if isinstance(payload_json, str) else payload_json
            
            await redis_client.close()
            
            return {
                "success": True,
                "review": review,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Error fetching review from Redis: {e}")
            # Check in-memory fallback
            if hasattr(review_agent_decision, "_reviews") and decision_id in review_agent_decision._reviews:
                return {
                    "success": True,
                    "review": review_agent_decision._reviews[decision_id],
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            raise HTTPException(
                status_code=404,
                detail=f"Review for decision '{decision_id}' not found"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting decision review: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews/history")
async def get_review_history(
    limit: int = Query(50, description="Maximum number of reviews to return"),
    reviewer: Optional[str] = Query(None, description="Filter by reviewer")
):
    """
    Get history of human reviews
    """
    try:
        import redis.asyncio as redis
        redis_url = "redis://127.0.0.1:6379"
        
        reviews = []
        
        try:
            redis_client = await redis.from_url(redis_url, socket_connect_timeout=1)
            await redis_client.ping()
            
            # Scan for all review keys
            cursor = 0
            pattern = "review:*"
            
            while True:
                cursor, keys = await redis_client.scan(cursor, match=pattern, count=100)
                
                for key in keys:
                    try:
                        review_data = await redis_client.hgetall(key)
                        payload_json = review_data.get(b"payload") or review_data.get("payload")
                        if isinstance(payload_json, bytes):
                            payload_json = payload_json.decode()
                        
                        review = json.loads(payload_json) if isinstance(payload_json, str) else payload_json
                        
                        if reviewer and review.get("reviewer") != reviewer:
                            continue
                        
                        reviews.append(review)
                    except Exception as e:
                        logger.warning(f"Error parsing review: {e}")
                        continue
                
                if cursor == 0:
                    break
            
            await redis_client.close()
            
        except Exception as e:
            logger.warning(f"Redis not available, checking in-memory reviews: {e}")
            if hasattr(review_agent_decision, "_reviews"):
                reviews = list(review_agent_decision._reviews.values())
                if reviewer:
                    reviews = [r for r in reviews if r.get("reviewer") == reviewer]
        
        # Sort by reviewed_at (most recent first)
        reviews.sort(key=lambda x: x.get("reviewed_at", ""), reverse=True)
        
        # Limit results
        reviews = reviews[:limit]
        
        return {
            "success": True,
            "reviews": reviews,
            "count": len(reviews),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting review history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

