"""
WebSocket router for bidirectional telemetry streaming
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import asyncio
import logging
import redis

from app.config import REDIS_URL
from app.observability.prom_metrics import ws_connections

logger = logging.getLogger(__name__)

router = APIRouter()

# Track active connections per vehicle
clients: Dict[str, List[WebSocket]] = {}

# Initialize Redis connection
try:
    r = redis.from_url(REDIS_URL)
except Exception as e:
    logger.warning(f"Redis connection failed: {e}, WS will use fallback mode")
    r = None


@router.websocket("/ws/telemetry/{vehicle_id}")
async def ws_telemetry(websocket: WebSocket, vehicle_id: str):
    """WebSocket endpoint for bidirectional telemetry streaming"""
    await websocket.accept()
    
    # Track connection
    if vehicle_id not in clients:
        clients[vehicle_id] = []
    clients[vehicle_id].append(websocket)
    ws_connections.labels(vehicle_id=vehicle_id).inc()
    
    logger.info(f"WebSocket connected for vehicle {vehicle_id}")
    
    try:
        while True:
            data = await websocket.receive_text()
            
            # Accept incoming telemetry, write into redis stream for processing
            try:
                obj = json.loads(data)
            except json.JSONDecodeError:
                obj = {"raw": data}
            
            # Write to Redis stream if available
            if r:
                try:
                    r.xadd("telemetry.stream", {"data": json.dumps(obj), "vehicle_id": vehicle_id})
                except Exception as e:
                    logger.debug(f"Redis write error: {e}")
            
            # Optional ack back
            await websocket.send_json({
                "ack": True,
                "vehicle": vehicle_id,
                "timestamp": asyncio.get_event_loop().time()
            })
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for vehicle {vehicle_id}")
    except Exception as e:
        logger.error(f"WebSocket error for vehicle {vehicle_id}: {e}", exc_info=True)
    finally:
        # Clean up connection
        if vehicle_id in clients and websocket in clients[vehicle_id]:
            clients[vehicle_id].remove(websocket)
            if not clients[vehicle_id]:
                del clients[vehicle_id]
        ws_connections.labels(vehicle_id=vehicle_id).dec()

