# app/routes/ws.py

"""
WebSocket endpoint for bidirectional telemetry and strategy updates.

Why: Real-time communication for frontend dashboard and inference feedback.
"""

import asyncio
import json
import logging
import os
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.main import WS_CONNECTIONS
import redis



router = APIRouter()
logger = logging.getLogger(__name__)



# Connection managers per vehicle

connections = {}  # vehicle_id -> list of active WebSocket connections



REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")

try:

    redis_client = redis.from_url(REDIS_URL, decode_responses=True)

except Exception:

    redis_client = None



@router.websocket("/ws/telemetry/{vehicle_id}")

async def ws_telemetry(websocket: WebSocket, vehicle_id: str):

    """

    WebSocket for live telemetry bidirectional communication.

    Frontend sends: telemetry frames

    Backend sends: predictions, alerts, strategy updates

    """

    await websocket.accept()

    

    if vehicle_id not in connections:

        connections[vehicle_id] = []

    connections[vehicle_id].append(websocket)

    WS_CONNECTIONS.set(sum(len(v) for v in connections.values()))

    

    logger.info(f"✓ WebSocket connected: {vehicle_id}")

    

    try:

        while True:

            # Receive telemetry from client

            data = await websocket.receive_text()

            

            try:

                telemetry_frame = json.loads(data)

                

                # Store in Redis for processing pipeline

                if redis_client:

                    redis_client.xadd(

                        "telemetry.stream",

                        {

                            "vehicle_id": vehicle_id,

                            "data": json.dumps(telemetry_frame),

                            "timestamp": telemetry_frame.get("meta_time", "")

                        }

                    )

                    # Also store latest as a key for SSE to read

                    redis_client.set(f"live:{vehicle_id}", json.dumps(telemetry_frame))

                

                # Send acknowledgment

                await websocket.send_json({

                    "type": "ack",

                    "vehicle": vehicle_id,

                    "frame_received": True

                })

                

            except json.JSONDecodeError as e:

                await websocket.send_json({

                    "type": "error",

                    "message": f"Invalid JSON: {str(e)}"

                })

    

    except WebSocketDisconnect:

        connections[vehicle_id].remove(websocket)

        WS_CONNECTIONS.set(sum(len(v) for v in connections.values()))

        logger.info(f"✓ WebSocket disconnected: {vehicle_id}")

    

    except Exception as e:

        logger.error(f"WebSocket error: {e}")

        if websocket in connections.get(vehicle_id, []):

            connections[vehicle_id].remove(websocket)

        WS_CONNECTIONS.set(sum(len(v) for v in connections.values()))



@router.websocket("/ws/insights")

async def ws_insights(websocket: WebSocket):

    """

    WebSocket for broadcasting strategy insights and alerts.

    Useful for pit wall dashboards that subscribe to all insights.

    """

    await websocket.accept()

    logger.info("✓ Insights WebSocket connected")

    

    try:

        while True:

            # In production, read from Redis Pub/Sub

            # For demo, send periodic insights

            await websocket.send_json({

                "type": "insight",

                "recommendation": "Pit window opening",

                "confidence": 0.85

            })

            

            await asyncio.sleep(5)

    

    except WebSocketDisconnect:

        logger.info("✓ Insights WebSocket disconnected")

    except Exception as e:

        logger.error(f"Insights WebSocket error: {e}")



async def broadcast_to_vehicle(vehicle_id: str, message: dict):

    """Broadcast a message to all WebSocket clients for a vehicle."""

    if vehicle_id in connections:

        disconnected = []

        for ws in connections[vehicle_id]:

            try:

                await ws.send_json(message)

            except Exception as e:

                logger.warning(f"Failed to send to {vehicle_id}: {e}")

                disconnected.append(ws)

        

        # Clean up disconnected clients

        for ws in disconnected:

            connections[vehicle_id].remove(ws)

