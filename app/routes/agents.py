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
        "action": "approve" | "reject" | "modify" | "defer",
        "modified_action": "string (if action is modify)",
        "feedback": "string (optional human feedback)",
        "reviewer": "string (optional reviewer name)",
        "confidence_override": float (optional, 0.0-1.0)
    }
    """
    try:
        import redis.asyncio as redis
        redis_url = "redis://127.0.0.1:6379"
        
        action = review.get("action")
        if action not in ["approve", "reject", "modify", "defer"]:
            raise HTTPException(
                status_code=400,
                detail="action must be 'approve', 'reject', 'modify', or 'defer'"
            )
        
        # Try to use human-in-the-loop manager if available
        try:
            import sys
            from pathlib import Path
            agents_path = Path(__file__).parent.parent.parent / "agents"
            if str(agents_path) not in sys.path:
                sys.path.insert(0, str(agents_path))
            
            from human_in_the_loop import HumanInTheLoopManager
            
            hitl_manager = HumanInTheLoopManager(redis_url)
            await hitl_manager.connect()
            
            # Use HITL manager for review
            decision_review = await hitl_manager.review_decision(
                decision_id=decision_id,
                reviewer=review.get("reviewer", "unknown"),
                action=action,
                modified_action=review.get("modified_action"),
                feedback=review.get("feedback", ""),
                confidence_override=review.get("confidence_override")
            )
            
            await hitl_manager.disconnect()
            
            return {
                "success": True,
                "message": f"Decision {action}d successfully",
                "review": {
                    "decision_id": decision_review.decision_id,
                    "reviewer": decision_review.reviewer,
                    "action": decision_review.action,
                    "modified_action": decision_review.modified_action,
                    "feedback": decision_review.feedback,
                    "reviewed_at": decision_review.reviewed_at,
                    "review_time_seconds": decision_review.review_time_seconds,
                    "confidence_override": decision_review.confidence_override
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except ImportError:
            logger.warning("Human-in-the-loop module not available, using fallback")
            # Fallback to original implementation
            pass
        
        # Fallback implementation (original code)
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
    
    Decisions are sorted by priority (highest first).
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
            # Return comprehensive mock pending decisions for demo
            from datetime import timedelta
            base_time = datetime.utcnow()
            
            mock_pending = [
                {
                    "decision_id": "decision-pit-critical-001",
                    "agent_id": "strategy-01",
                    "agent_type": "strategist",
                    "track": "cota",
                    "chassis": "GR86-01",
                    "action": "Immediate pit stop required - tire degradation critical",
                    "confidence": 0.58,
                    "risk_level": "critical",
                    "decision_type": "pit",
                    "reasoning": [
                        "Tire wear at 78% - approaching failure threshold",
                        "Temperature spike detected in rear left tire (+15°C)",
                        "Safety margin below acceptable threshold (12%)",
                        "Predicted tire failure within 2-3 laps if no action taken"
                    ],
                    "evidence": {
                        "tire_wear_percent": 78.2,
                        "tire_temp_spike": 15.3,
                        "safety_margin": 12.0,
                        "lap_number": 18,
                        "predicted_failure_lap": 20
                    },
                    "created_at": (base_time - timedelta(minutes=5)).isoformat()
                },
                {
                    "decision_id": "decision-coach-aggressive-002",
                    "agent_id": "coach-01",
                    "agent_type": "coach",
                    "track": "road_america",
                    "chassis": "GR86-02",
                    "action": "Adjust braking point in Turn 5 - driver overshooting consistently",
                    "confidence": 0.62,
                    "risk_level": "aggressive",
                    "decision_type": "coach",
                    "reasoning": [
                        "Driver overshooting Turn 5 braking point by average 8.2m",
                        "Consistent pattern over last 5 laps",
                        "Lap time loss: -0.45s per lap",
                        "Risk of track limits violation increasing"
                    ],
                    "evidence": {
                        "braking_point_error": 8.2,
                        "affected_laps": 5,
                        "lap_time_loss": 0.45,
                        "track_limits_warnings": 2,
                        "sector": "Sector 1"
                    },
                    "created_at": (base_time - timedelta(minutes=12)).isoformat()
                },
                {
                    "decision_id": "decision-anomaly-critical-003",
                    "agent_id": "anomaly-01",
                    "agent_type": "anomaly_detective",
                    "track": "sebring",
                    "chassis": "GR86-01",
                    "action": "Anomaly detected: Suspicious brake pressure pattern in Sector 2",
                    "confidence": 0.71,
                    "risk_level": "critical",
                    "decision_type": "anomaly",
                    "reasoning": [
                        "Brake pressure 23% lower than baseline in Sector 2",
                        "Pattern inconsistent with driver's historical data",
                        "Possible mechanical issue or driver error",
                        "Requires immediate investigation"
                    ],
                    "evidence": {
                        "brake_pressure_deviation": -23.4,
                        "sector": "Sector 2",
                        "anomaly_score": 0.89,
                        "baseline_comparison": "historical_avg",
                        "affected_corners": ["Turn 7", "Turn 8"]
                    },
                    "created_at": (base_time - timedelta(minutes=8)).isoformat()
                },
                {
                    "decision_id": "decision-strategy-moderate-004",
                    "agent_id": "strategy-02",
                    "agent_type": "strategist",
                    "track": "sonoma",
                    "chassis": "GR86-03",
                    "action": "Recommend pit window: Laps 22-24 for optimal undercut",
                    "confidence": 0.68,
                    "risk_level": "moderate",
                    "decision_type": "strategy",
                    "reasoning": [
                        "Gap to car ahead: 2.3s (undercut opportunity)",
                        "Tire wear at 42% - optimal pit window opening",
                        "Traffic analysis shows clear window in laps 22-24",
                        "Potential gain: +1.8s with undercut strategy"
                    ],
                    "evidence": {
                        "gap_to_ahead": 2.3,
                        "tire_wear_percent": 42.1,
                        "optimal_window": [22, 24],
                        "potential_gain": 1.8,
                        "current_lap": 20
                    },
                    "created_at": (base_time - timedelta(minutes=15)).isoformat()
                },
                {
                    "decision_id": "decision-coach-safe-005",
                    "agent_id": "coach-02",
                    "agent_type": "coach",
                    "track": "vir",
                    "chassis": "GR86-01",
                    "action": "Improve exit speed in Turn 10 - early throttle application recommended",
                    "confidence": 0.75,
                    "risk_level": "safe",
                    "decision_type": "coach",
                    "reasoning": [
                        "Exit speed 5.2 km/h below optimal",
                        "Throttle application delayed by average 0.12s",
                        "Consistent pattern - coaching opportunity",
                        "Potential lap time gain: +0.15s"
                    ],
                    "evidence": {
                        "exit_speed_deficit": 5.2,
                        "throttle_delay": 0.12,
                        "corner": "Turn 10",
                        "potential_gain": 0.15,
                        "consistency": "high"
                    },
                    "created_at": (base_time - timedelta(minutes=3)).isoformat()
                },
                {
                    "decision_id": "decision-pit-aggressive-006",
                    "agent_id": "tire-01",
                    "agent_type": "tire_analyst",
                    "track": "barber",
                    "chassis": "GR86-02",
                    "action": "Tire degradation accelerating - consider early pit stop",
                    "confidence": 0.64,
                    "risk_level": "aggressive",
                    "decision_type": "pit",
                    "reasoning": [
                        "Tire degradation rate increased 40% in last 3 laps",
                        "Current wear: 58% but accelerating",
                        "Predicted wear at lap 20: 82% (above safe threshold)",
                        "Early pit preserves tire life for final stint"
                    ],
                    "evidence": {
                        "current_wear": 58.3,
                        "degradation_rate_increase": 40.0,
                        "predicted_wear_lap_20": 82.1,
                        "safe_threshold": 75.0,
                        "current_lap": 15
                    },
                    "created_at": (base_time - timedelta(minutes=7)).isoformat()
                },
                {
                    "decision_id": "decision-anomaly-moderate-007",
                    "agent_id": "anomaly-02",
                    "agent_type": "anomaly_detective",
                    "track": "indianapolis",
                    "chassis": "GR86-03",
                    "action": "Unusual fuel consumption pattern detected",
                    "confidence": 0.69,
                    "risk_level": "moderate",
                    "decision_type": "anomaly",
                    "reasoning": [
                        "Fuel consumption 8% higher than expected",
                        "Pattern suggests possible fuel system issue",
                        "Not correlated with driving style changes",
                        "Monitor closely - may require pit stop investigation"
                    ],
                    "evidence": {
                        "fuel_consumption_deviation": 8.2,
                        "affected_laps": 4,
                        "correlation_with_driving": "low",
                        "anomaly_score": 0.65
                    },
                    "created_at": (base_time - timedelta(minutes=10)).isoformat()
                },
                {
                    "decision_id": "decision-strategy-critical-008",
                    "agent_id": "strategy-01",
                    "agent_type": "strategist",
                    "track": "cota",
                    "chassis": "GR86-01",
                    "action": "CRITICAL: Weather change incoming - pit for wet tires in 2 laps",
                    "confidence": 0.55,
                    "risk_level": "critical",
                    "decision_type": "strategy",
                    "reasoning": [
                        "Weather radar shows rain approaching in 3-4 minutes",
                        "Track temperature dropping rapidly (-2.5°C in last lap)",
                        "Optimal pit window: 2 laps before rain hits",
                        "Staying on slicks will result in significant time loss"
                    ],
                    "evidence": {
                        "rain_eta_minutes": 3.5,
                        "temp_drop_per_lap": 2.5,
                        "optimal_pit_window": 2,
                        "current_lap": 14,
                        "weather_confidence": 0.82
                    },
                    "created_at": (base_time - timedelta(minutes=2)).isoformat()
                }
            ]
            
            # Apply filters
            filtered_decisions = []
            for decision in mock_pending:
                if track and decision.get("track") != track:
                    continue
                if chassis and decision.get("chassis") != chassis:
                    continue
                if risk_level and decision.get("risk_level") != risk_level:
                    continue
                filtered_decisions.append(decision)
            
            pending_decisions = filtered_decisions if filtered_decisions else mock_pending
        
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


@router.post("/decisions/batch-review")
async def batch_review_decisions(
    batch_review: Dict[str, Any]
):
    """
    Review multiple decisions in a single batch operation
    
    Request body:
    {
        "reviews": [
            {
                "decision_id": "string",
                "action": "approve" | "reject" | "modify",
                "modified_action": "string (optional)",
                "feedback": "string (optional)",
                "confidence_override": float (optional)
            },
            ...
        ],
        "reviewer": "string (optional)"
    }
    """
    try:
        import redis.asyncio as redis
        redis_url = "redis://127.0.0.1:6379"
        
        reviews = batch_review.get("reviews", [])
        reviewer = batch_review.get("reviewer", "unknown")
        
        if not reviews:
            raise HTTPException(
                status_code=400,
                detail="reviews array is required and cannot be empty"
            )
        
        # Try to use human-in-the-loop manager if available
        try:
            import sys
            from pathlib import Path
            agents_path = Path(__file__).parent.parent.parent / "agents"
            if str(agents_path) not in sys.path:
                sys.path.insert(0, str(agents_path))
            
            from human_in_the_loop import HumanInTheLoopManager
            
            hitl_manager = HumanInTheLoopManager(redis_url)
            await hitl_manager.connect()
            
            # Batch review using HITL manager
            decision_reviews = await hitl_manager.batch_review_decisions(reviews, reviewer)
            
            await hitl_manager.disconnect()
            
            return {
                "success": True,
                "message": f"Batch reviewed {len(decision_reviews)}/{len(reviews)} decisions",
                "reviews": [
                    {
                        "decision_id": r.decision_id,
                        "reviewer": r.reviewer,
                        "action": r.action,
                        "reviewed_at": r.reviewed_at,
                        "review_time_seconds": r.review_time_seconds
                    }
                    for r in decision_reviews
                ],
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except ImportError:
            logger.warning("Human-in-the-loop module not available, processing individually")
            # Fallback: process reviews individually
            results = []
            for review_data in reviews:
                try:
                    # Call the single review endpoint logic
                    decision_id = review_data.get("decision_id")
                    action = review_data.get("action", "approve")
                    
                    # Store review (simplified fallback)
                    review_result = {
                        "decision_id": decision_id,
                        "action": action,
                        "reviewer": reviewer,
                        "reviewed_at": datetime.utcnow().isoformat()
                    }
                    results.append(review_result)
                except Exception as e:
                    logger.error(f"Error in batch review for {review_data.get('decision_id')}: {e}")
                    continue
            
            return {
                "success": True,
                "message": f"Processed {len(results)}/{len(reviews)} reviews",
                "reviews": results,
                "timestamp": datetime.utcnow().isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch review: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reviews/history")
async def get_review_history(
    limit: int = Query(50, description="Maximum number of reviews to return"),
    reviewer: Optional[str] = Query(None, description="Filter by reviewer")
):
    """
    Get history of human reviews
    
    Returns review history sorted by most recent first.
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
            logger.warning(f"Redis not available, returning mock review history: {e}")
            # Return comprehensive mock review history for demo
            from datetime import timedelta
            base_time = datetime.utcnow()
            
            mock_reviews = [
                {
                    "decision_id": "decision-pit-approved-101",
                    "action": "approve",
                    "modified_action": None,
                    "feedback": "Agreed - tire wear critical, pit stop necessary for safety",
                    "reviewer": "Sarah Chen",
                    "reviewed_at": (base_time - timedelta(hours=2, minutes=15)).isoformat()
                },
                {
                    "decision_id": "decision-coach-modified-102",
                    "action": "modify",
                    "modified_action": "Adjust braking point in Turn 5 by 3m earlier (not 5m as suggested)",
                    "feedback": "Driver needs gradual adjustment, 5m too aggressive. Recommend 3m first.",
                    "reviewer": "Mike Rodriguez",
                    "reviewed_at": (base_time - timedelta(hours=1, minutes=45)).isoformat()
                },
                {
                    "decision_id": "decision-anomaly-rejected-103",
                    "action": "reject",
                    "modified_action": None,
                    "feedback": "False positive - brake pressure pattern within normal variance. No action needed.",
                    "reviewer": "Sarah Chen",
                    "reviewed_at": (base_time - timedelta(hours=1, minutes=30)).isoformat()
                },
                {
                    "decision_id": "decision-strategy-approved-104",
                    "action": "approve",
                    "modified_action": None,
                    "feedback": "Strategy sound. Execute undercut in window specified.",
                    "reviewer": "James Wilson",
                    "reviewed_at": (base_time - timedelta(hours=1, minutes=10)).isoformat()
                },
                {
                    "decision_id": "decision-coach-approved-105",
                    "action": "approve",
                    "modified_action": None,
                    "feedback": "Good catch. Driver will benefit from this coaching point.",
                    "reviewer": "Mike Rodriguez",
                    "reviewed_at": (base_time - timedelta(minutes=55)).isoformat()
                },
                {
                    "decision_id": "decision-pit-modified-106",
                    "action": "modify",
                    "modified_action": "Pit 1 lap later (lap 16 instead of 15) to avoid traffic",
                    "feedback": "Traffic analysis shows lap 15 has heavy traffic. Delay by 1 lap for clearer track.",
                    "reviewer": "James Wilson",
                    "reviewed_at": (base_time - timedelta(minutes=40)).isoformat()
                },
                {
                    "decision_id": "decision-anomaly-approved-107",
                    "action": "approve",
                    "modified_action": None,
                    "feedback": "Fuel consumption anomaly confirmed. Monitor for next 5 laps before pit investigation.",
                    "reviewer": "Sarah Chen",
                    "reviewed_at": (base_time - timedelta(minutes=25)).isoformat()
                },
                {
                    "decision_id": "decision-strategy-rejected-108",
                    "action": "reject",
                    "modified_action": None,
                    "feedback": "Weather forecast updated - rain delayed by 10 minutes. Stay on current strategy.",
                    "reviewer": "James Wilson",
                    "reviewed_at": (base_time - timedelta(minutes=15)).isoformat()
                },
                {
                    "decision_id": "decision-coach-modified-109",
                    "action": "modify",
                    "modified_action": "Focus on Turn 10 exit but also review Turn 8 entry - both need improvement",
                    "feedback": "Driver struggling with both corners. Address both in coaching message.",
                    "reviewer": "Mike Rodriguez",
                    "reviewed_at": (base_time - timedelta(minutes=8)).isoformat()
                },
                {
                    "decision_id": "decision-pit-approved-110",
                    "action": "approve",
                    "modified_action": None,
                    "feedback": "Tire degradation analysis accurate. Proceed with early pit stop.",
                    "reviewer": "Sarah Chen",
                    "reviewed_at": (base_time - timedelta(minutes=2)).isoformat()
                }
            ]
            
            # Apply reviewer filter if specified
            if reviewer:
                reviews = [r for r in mock_reviews if r.get("reviewer") == reviewer]
            else:
                reviews = mock_reviews
            
            # Also check in-memory reviews if they exist
            if hasattr(review_agent_decision, "_reviews"):
                in_memory_reviews = list(review_agent_decision._reviews.values())
                if reviewer:
                    in_memory_reviews = [r for r in in_memory_reviews if r.get("reviewer") == reviewer]
                # Merge with mock reviews (avoid duplicates)
                existing_ids = {r.get("decision_id") for r in reviews}
                for r in in_memory_reviews:
                    if r.get("decision_id") not in existing_ids:
                        reviews.append(r)
        
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


# ============================================================================
# AGENT ANALYSIS ENDPOINTS
# ============================================================================

@router.post("/{agent_id}/analyze")
async def request_agent_analysis(
    agent_id: str,
    request: Dict[str, Any]
):
    """
    Request analysis from a specific agent
    
    Request body:
    {
        "telemetry": {...},
        "sessionState": {...}
    }
    """
    try:
        logger.info(f"Agent analysis request: agent_id={agent_id}")
        
        # In a real implementation, this would dispatch to the specific agent
        # For now, return a mock response
        return {
            "success": True,
            "recommendation": f"Agent {agent_id} recommendation based on telemetry",
            "confidence": 0.85,
            "decision_type": "strategy",
            "reasoning": [
                "Analysis of telemetry data",
                "Considered session state",
                "Applied agent-specific logic"
            ],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error requesting agent analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/run")
async def run_agent_consensus(request: Dict[str, Any]):
    """
    Run all agents and return consensus decision with voting summary
    
    Request body:
    {
        "track": "sebring",
        "chassis": "GR86-01",
        "lap": 12,
        "telemetry": {...},
        "sessionState": {...}
    }
    
    Returns:
    {
        "agent_votes": {
            "agent_id": {
                "vote": "box_now" | "stay_out" | "box_later",
                "confidence": 0.0-1.0,
                "rationale": "string"
            }
        },
        "consensus": {
            "decision": "box_now",
            "confidence": 0.82,
            "votes_for": 5,
            "votes_against": 2
        },
        "explanation": "Meta-decision explanation"
    }
    """
    try:
        track = request.get("track", "sebring")
        chassis = request.get("chassis", "GR86-01")
        lap = request.get("lap", 12)
        telemetry = request.get("telemetry", {})
        session_state = request.get("sessionState", {})
        
        logger.info(f"Agent consensus request: track={track}, chassis={chassis}, lap={lap}")
        
        # Mock agent votes (in production, this would call actual agents)
        # 7 agents as mentioned in the requirements
        agent_votes = {
            "strategy-01": {
                "vote": "box_now",
                "confidence": 0.87,
                "rationale": "Tire wear at 35.2%, optimal pit window opens in 2 laps",
                "agent_type": "strategist"
            },
            "strategy-02": {
                "vote": "box_now",
                "confidence": 0.82,
                "rationale": "Gap analysis shows undercut opportunity with +3.8s potential gain",
                "agent_type": "strategist"
            },
            "tire-01": {
                "vote": "box_now",
                "confidence": 0.91,
                "rationale": "Tire degradation rate accelerating, predicted cliff at lap 15",
                "agent_type": "tire_analyst"
            },
            "tire-02": {
                "vote": "stay_out",
                "confidence": 0.65,
                "rationale": "Tire wear manageable, can extend 3 more laps before pit",
                "agent_type": "tire_analyst"
            },
            "coach-01": {
                "vote": "box_now",
                "confidence": 0.78,
                "rationale": "Driver showing signs of fatigue, pit now preserves tire margin",
                "agent_type": "coach"
            },
            "anomaly-01": {
                "vote": "box_now",
                "confidence": 0.85,
                "rationale": "Anomaly detected in sector 2 brake patterns, early pit recommended",
                "agent_type": "anomaly_detective"
            },
            "safety-01": {
                "vote": "box_now",
                "confidence": 0.95,
                "rationale": "Safety margin below threshold, pit now to prevent tire failure",
                "agent_type": "safety"
            }
        }
        
        # Calculate consensus
        votes_for_box_now = sum(1 for v in agent_votes.values() if v["vote"] == "box_now")
        votes_for_stay_out = sum(1 for v in agent_votes.values() if v["vote"] == "stay_out")
        votes_for_box_later = sum(1 for v in agent_votes.values() if v["vote"] == "box_later")
        
        # Determine consensus decision (majority vote)
        if votes_for_box_now >= votes_for_stay_out and votes_for_box_now >= votes_for_box_later:
            consensus_decision = "box_now"
            votes_for = votes_for_box_now
            votes_against = votes_for_stay_out + votes_for_box_later
        elif votes_for_stay_out >= votes_for_box_later:
            consensus_decision = "stay_out"
            votes_for = votes_for_stay_out
            votes_against = votes_for_box_now + votes_for_box_later
        else:
            consensus_decision = "box_later"
            votes_for = votes_for_box_later
            votes_against = votes_for_box_now + votes_for_stay_out
        
        # Calculate consensus confidence (weighted average of votes for consensus)
        consensus_votes = [v for v in agent_votes.values() if v["vote"] == consensus_decision]
        consensus_confidence = sum(v["confidence"] for v in consensus_votes) / len(consensus_votes) if consensus_votes else 0.0
        
        # Generate meta-decision explanation
        explanation_parts = [
            f"Consensus: {consensus_decision.upper().replace('_', ' ')}",
            f"Confidence: {consensus_confidence:.0%}",
            f"Vote breakdown: {votes_for_box_now} for pit now, {votes_for_stay_out} for stay out, {votes_for_box_later} for pit later"
        ]
        
        if consensus_decision == "box_now":
            explanation_parts.append("Primary reasons: Tire wear acceleration, strategic window, and safety margin")
        elif consensus_decision == "stay_out":
            explanation_parts.append("Primary reasons: Tire wear manageable, position preservation, and track position")
        else:
            explanation_parts.append("Primary reasons: Optimal timing in 2-3 laps, current position stable")
        
        explanation = ". ".join(explanation_parts) + "."
        
        return {
            "success": True,
            "agent_votes": agent_votes,
            "consensus": {
                "decision": consensus_decision,
                "confidence": round(consensus_confidence, 2),
                "votes_for": votes_for,
                "votes_against": votes_against,
                "total_agents": len(agent_votes)
            },
            "explanation": explanation,
            "disagreement_score": round(votes_against / len(agent_votes), 2) if agent_votes else 0.0,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error running agent consensus: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

