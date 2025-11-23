"""
WebSocket endpoints for Maps and HUD/XR feeds
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import logging
import json
import asyncio
import time

from app.routes.api_models_maps import HUDInsightUpdate, PitWindowRecommendation

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws/maps", tags=["Maps WebSocket"])

# Track active connections
active_connections: Dict[str, Set[WebSocket]] = {}


@router.websocket("/hud/{vehicle}")
async def hud_websocket(websocket: WebSocket, vehicle: str):
    """
    WebSocket feed for HUD/XR overlays (bi-directional)
    
    Supports low-latency insight updates and client control messages.
    """
    await websocket.accept()
    logger.info(f"HUD WebSocket connection opened for vehicle: {vehicle}")
    
    # Track connection
    if vehicle not in active_connections:
        active_connections[vehicle] = set()
    active_connections[vehicle].add(websocket)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "vehicle": vehicle,
            "ts": time.time()
        })
        
        # Start sending updates
        update_task = asyncio.create_task(send_hud_updates(websocket, vehicle))
        
        # Listen for client messages (ack, overlay toggles, etc.)
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle client messages
                msg_type = message.get("type")
                if msg_type == "ack":
                    logger.debug(f"Received ack from {vehicle}: {message.get('message_id')}")
                elif msg_type == "toggle_overlay":
                    overlay_type = message.get("overlay_type")
                    enabled = message.get("enabled", True)
                    logger.info(f"Overlay {overlay_type} {'enabled' if enabled else 'disabled'} for {vehicle}")
                elif msg_type == "ping":
                    await websocket.send_json({"type": "pong", "ts": time.time()})
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"Error handling client message: {e}", exc_info=True)
        
        update_task.cancel()
        
    except WebSocketDisconnect:
        logger.info(f"HUD WebSocket disconnected for vehicle: {vehicle}")
    except Exception as e:
        logger.error(f"HUD WebSocket error: {e}", exc_info=True)
    finally:
        # Remove connection
        if vehicle in active_connections:
            active_connections[vehicle].discard(websocket)
            if not active_connections[vehicle]:
                del active_connections[vehicle]
        logger.info(f"HUD WebSocket connection closed for vehicle: {vehicle}")


async def send_hud_updates(websocket: WebSocket, vehicle: str):
    """Send periodic HUD updates"""
    try:
        while True:
            # Generate mock insight update
            update = HUDInsightUpdate(
                vehicle=vehicle,
                ts=time.time(),
                pit_window=PitWindowRecommendation(
                    recommendation="Pit Now",
                    delta_s=-3.8,
                    risk=22
                ),
                highlight_path=[
                    {"lat": 27.4547, "lon": -80.3478},
                    {"lat": 27.4550, "lon": -80.3475}
                ],
                evidence={
                    "s": 1234.1,
                    "sector": "s2",
                    "trace_url": f"/api/telemetry/replay/{vehicle}/1234"
                },
                message="Tire wear approaching threshold"
            )
            
            # Send update
            await websocket.send_json({
                "type": "insight_update",
                "data": update.dict()
            })
            
            # Wait before next update
            await asyncio.sleep(1.0)  # 1 second interval
            
    except asyncio.CancelledError:
        logger.debug(f"HUD update task cancelled for {vehicle}")
    except Exception as e:
        logger.error(f"Error sending HUD updates: {e}", exc_info=True)


def broadcast_to_vehicle(vehicle: str, message: dict):
    """Broadcast message to all connections for a vehicle"""
    if vehicle in active_connections:
        disconnected = set()
        for ws in active_connections[vehicle]:
            try:
                asyncio.create_task(ws.send_json(message))
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket: {e}")
                disconnected.add(ws)
        
        # Clean up disconnected sockets
        for ws in disconnected:
            active_connections[vehicle].discard(ws)

