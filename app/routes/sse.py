"""
SSE (Server-Sent Events) router for real-time telemetry streaming
"""
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
import os
import logging
import redis

from app.config import REDIS_URL, SSE_INTERVAL_MS
from app.observability.prom_metrics import sse_updates_sent

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Redis connection
try:
    r = redis.from_url(REDIS_URL)
except Exception as e:
    logger.warning(f"Redis connection failed: {e}, SSE will use fallback mode")
    r = None


async def generator(vehicle_id: str):
    """Generate SSE events for vehicle telemetry"""
    last = '$'
    while True:
        # For production read from a Redis stream or topic keyed by vehicle
        key = f"live:{vehicle_id}"
        payload = None
        
        try:
            if r:
                payload = r.get(key)
        except Exception as e:
            logger.debug(f"Redis read error: {e}")
            payload = None
        
        if payload:
            try:
                data = payload.decode() if isinstance(payload, bytes) else payload
                yield f"data: {data}\n\n"
                sse_updates_sent.labels(vehicle_id=vehicle_id).inc()
            except Exception as e:
                logger.debug(f"Error processing payload: {e}")
        else:
            # Send heartbeat
            heartbeat = json.dumps({
                "vehicle": vehicle_id,
                "ts": asyncio.get_event_loop().time(),
                "type": "heartbeat"
            })
            yield f"data: {heartbeat}\n\n"
        
        await asyncio.sleep(SSE_INTERVAL_MS / 1000.0)


@router.get("/sse/live/{vehicle_id}")
async def sse_live(vehicle_id: str):
    """SSE endpoint for live vehicle telemetry"""
    return EventSourceResponse(generator(vehicle_id))

