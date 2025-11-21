"""
WebSocket and SSE endpoints for real-time telemetry and anomaly detection
"""
import json
import asyncio
import logging
from typing import Dict, Set, Optional
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from fastapi.responses import EventSourceResponse
from sse_starlette.sse import EventSourceResponse as SSEEventSourceResponse

from app.services.anomaly_engine import get_anomaly_engine
from app.config import SSE_INTERVAL_MS, USE_REDIS_PUBSUB, REDIS_URL, DEMO_MODE
from app.observability.prom_metrics import ws_connections, sse_updates_sent
import time

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Realtime"])

class ConnectionManager:
    """Manages WebSocket connections and broadcasts"""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.redis_pub = None
        self.redis_sub = None
        self.redis_client = None
        
        if USE_REDIS_PUBSUB:
            self._init_redis()
    
    async def _init_redis(self):
        """Initialize Redis pub/sub for multi-instance support"""
        try:
            import aioredis
            self.redis_client = await aioredis.from_url(REDIS_URL)
            self.redis_pub = self.redis_client
            self.redis_sub = self.redis_client.pubsub()
            logger.info("Redis pub/sub initialized")
        except Exception as e:
            logger.warning(f"Failed to initialize Redis: {e}, falling back to in-process manager")
            USE_REDIS_PUBSUB = False

    async def connect(self, vehicle_id: str, websocket: WebSocket):
        """Connect a WebSocket for a vehicle"""
        await websocket.accept()
        
        if vehicle_id not in self.active_connections:
            self.active_connections[vehicle_id] = set()
        
        self.active_connections[vehicle_id].add(websocket)
        ws_connections.labels(vehicle_id=vehicle_id).inc()
        
        # Subscribe to Redis channel if using pub/sub
        if USE_REDIS_PUBSUB and self.redis_sub:
            try:
                await self.redis_sub.subscribe(f"anomalies:{vehicle_id}")
                # Start listener task
                asyncio.create_task(self._redis_listener(vehicle_id))
            except Exception as e:
                logger.error(f"Failed to subscribe to Redis channel: {e}")
        
        logger.info(f"WebSocket connected for vehicle {vehicle_id} (total: {len(self.active_connections[vehicle_id])})")

    def disconnect(self, vehicle_id: str, websocket: WebSocket):
        """Disconnect a WebSocket"""
        if vehicle_id in self.active_connections:
            self.active_connections[vehicle_id].discard(websocket)
            ws_connections.labels(vehicle_id=vehicle_id).dec()
            
            if not self.active_connections[vehicle_id]:
                del self.active_connections[vehicle_id]
        
        logger.info(f"WebSocket disconnected for vehicle {vehicle_id}")
    
    async def broadcast_to_vehicle(self, vehicle_id: str, message: dict):
        """Broadcast message to all connections for a vehicle"""
        if vehicle_id not in self.active_connections:
            return

        message_str = json.dumps(message)
        disconnected = set()
        
        for connection in self.active_connections[vehicle_id]:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.warning(f"Error sending to WebSocket: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected connections
        for conn in disconnected:
            self.disconnect(vehicle_id, conn)
        
        # Publish to Redis if using pub/sub
        if USE_REDIS_PUBSUB and self.redis_pub:
            try:
                await self.redis_pub.publish(
                    f"anomalies:{vehicle_id}",
                    message_str
                )
            except Exception as e:
                logger.warning(f"Failed to publish to Redis: {e}")
    
    async def _redis_listener(self, vehicle_id: str):
        """Listen for Redis pub/sub messages and broadcast locally"""
        if not self.redis_sub:
            return
        
        try:
            while True:
                message = await self.redis_sub.get_message(ignore_subscribe_messages=True)
                if message and message["type"] == "message":
                    data = json.loads(message["data"])
                    # Broadcast to local connections (excluding the sender instance)
                    if vehicle_id in self.active_connections:
                        message_str = json.dumps(data)
                        for connection in self.active_connections[vehicle_id]:
                            try:
                                await connection.send_text(message_str)
                            except Exception:
                                pass
        except Exception as e:
            logger.error(f"Redis listener error: {e}")

# Global connection manager
_manager: Optional[ConnectionManager] = None

def get_connection_manager() -> ConnectionManager:
    """Get global connection manager instance"""
    global _manager
    if _manager is None:
        _manager = ConnectionManager()
    return _manager

async def build_dashboard_payload(vehicle_id: str) -> dict:
    """Build dashboard payload for SSE/WebSocket"""
    # In demo mode, use precomputed data
    if DEMO_MODE:
        try:
            from pathlib import Path
            from app.config import DATA_DEMO_SLICES_DIR
            demo_dir = Path(DATA_DEMO_SLICES_DIR)
            
            # Try to load a demo slice
            demo_files = list(demo_dir.glob("*.json")) if demo_dir.exists() else []
            if demo_files:
                import random
                demo_file = random.choice(demo_files)
                with open(demo_file) as f:
                    demo_data = json.load(f)
                    # Return first item or sample
                    if isinstance(demo_data, list) and len(demo_data) > 0:
                        sample = random.choice(demo_data) if len(demo_data) > 0 else demo_data[0]
                        return {
                            "vehicle_id": vehicle_id,
                            "timestamp": datetime.utcnow().isoformat() + "Z",
                            "telemetry": sample,
                            "demo_mode": True
                        }
        except Exception as e:
            logger.warning(f"Could not load demo data: {e}")
    
    # Default payload
    return {
        "vehicle_id": vehicle_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "telemetry": {},
        "model_version": "1.0.0",
        "demo_mode": DEMO_MODE
    }

def get_sse_interval() -> int:
    """Get SSE interval from config"""
    from app.config import SSE_INTERVAL_MS
    return SSE_INTERVAL_MS

@router.get("/sse/live/{vehicle_id}")
async def sse_live(vehicle_id: str, interval_ms: int = Depends(get_sse_interval)):
    """
    Server-Sent Events endpoint for live telemetry streaming
    
    Usage:
        curl -N http://localhost:8000/sse/live/GR86-001
    """
    async def event_generator():
        """Generate SSE events"""
        try:
            while True:
                # Build dashboard payload
                payload = await build_dashboard_payload(vehicle_id)
                
                # Send event
                event_data = json.dumps(payload)
                yield {
                    "event": "update",
                    "data": event_data
                }
                
                # Increment metric
                sse_updates_sent.labels(vehicle_id=vehicle_id).inc()
                
                # Wait for next interval
                await asyncio.sleep(interval_ms / 1000.0)
                
        except asyncio.CancelledError:
            logger.info(f"SSE stream cancelled for {vehicle_id}")
        except Exception as e:
            logger.error(f"SSE stream error for {vehicle_id}: {e}")
    
    return EventSourceResponse(event_generator())

@router.websocket("/ws/telemetry/{vehicle_id}")
async def ws_telemetry(websocket: WebSocket, vehicle_id: str):
    """
    WebSocket endpoint for bidirectional telemetry and anomaly alerts
    
    Usage:
        wscat -c ws://localhost:8000/ws/telemetry/GR86-001
        Send: {"telemetry_name": "speed", "telemetry_value": 120, "timestamp": "2025-05-15T20:25:55.003Z"}
    """
    manager = get_connection_manager()
    anomaly_engine = get_anomaly_engine()
    
    await manager.connect(vehicle_id, websocket)

    try:
        while True:
            # Receive telemetry frame
            raw = await websocket.receive_text()
            
            try:
                frame = json.loads(raw)
                
                # Add vehicle_id and timestamp if missing
                frame["vehicle_id"] = vehicle_id
                if "timestamp" not in frame:
                    frame["timestamp"] = datetime.utcnow().isoformat() + "Z"
                
                # Process frame through anomaly engine
                anomaly = anomaly_engine.process_frame(vehicle_id, frame)
                
                # Send acknowledgment
                await websocket.send_text(json.dumps({
                    "status": "ok",
                    "timestamp": frame["timestamp"],
                    "vehicle_id": vehicle_id
                }))
                
                # Broadcast anomaly alert if detected
                if anomaly:
                    alert = {
                        "type": "anomaly_alert",
                        "alert": anomaly
                    }
                    await manager.broadcast_to_vehicle(vehicle_id, alert)
                    
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "status": "error",
                    "message": "Invalid JSON"
                }))
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}", exc_info=True)
                await websocket.send_text(json.dumps({
                    "status": "error",
                    "message": str(e)
                }))

    except WebSocketDisconnect:
        manager.disconnect(vehicle_id, websocket)
        logger.info(f"WebSocket disconnected for {vehicle_id}")
    except Exception as e:
        logger.error(f"WebSocket error for {vehicle_id}: {e}", exc_info=True)
        manager.disconnect(vehicle_id, websocket)

@router.get("/demo/seed")
async def demo_seed():
    """
    Demo seed endpoint - returns curated demo telemetry data
    """
    try:
        from pathlib import Path
        from app.config import DATA_DEMO_SLICES_DIR
        
        demo_dir = Path(DATA_DEMO_SLICES_DIR)
        
        if not demo_dir.exists():
            # Return synthetic demo data
            return {
                "vehicle_id": "GR86-001",
                "track": "sebring",
                "telemetry_sample": [
                    {
                        "telemetry_name": "speed",
                        "telemetry_value": 120.5,
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "vehicle_id": "GR86-001"
                    },
                    {
                        "telemetry_name": "brake_pressure",
                        "telemetry_value": 85.2,
                        "timestamp": datetime.utcnow().isoformat() + "Z",
                        "vehicle_id": "GR86-001"
                    }
                ],
                "precomputed": {
                    "best_lap_time": 135.234,
                    "avg_speed": 98.5
                },
                "demo_mode": True
            }
        
        # Load demo slice
        demo_files = list(demo_dir.glob("*.json"))
        if demo_files:
            import random
            demo_file = random.choice(demo_files)
            with open(demo_file) as f:
                demo_data = json.load(f)
                return {
                    "vehicle_id": "GR86-001",
                    "source_file": demo_file.name,
                    "telemetry_sample": demo_data[:50] if isinstance(demo_data, list) else demo_data,
                    "demo_mode": True
                }
        
        # Fallback
        return {"message": "No demo data available", "demo_mode": True}
        
    except Exception as e:
        logger.error(f"Error loading demo seed: {e}", exc_info=True)
        return {
            "error": str(e),
            "demo_mode": True
        }
