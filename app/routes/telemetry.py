"""
Telemetry publishing and insights streaming endpoints.

Integrates with the real-time telemetry pipeline for publishing
telemetry data and streaming insights.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from sse_starlette.sse import EventSourceResponse
import json
import asyncio
import logging
import os

from app.pipelines import RedisTelemetryProducer, make_redis

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


class TelemetryPayload(BaseModel):
    """Telemetry data payload"""
    timestamp: float
    vehicle_id: str
    sector: str
    speed: float
    brake: float
    throttle: float
    # Optional fields
    gear: Optional[int] = None
    nmot: Optional[float] = None  # Engine RPM
    accx_can: Optional[float] = None  # Longitudinal acceleration
    accy_can: Optional[float] = None  # Lateral acceleration
    steering_angle: Optional[float] = None
    # For online learning
    ground_truth_laps_until_cliff: Optional[float] = None


@router.post("/publish")
async def publish_telemetry(payload: TelemetryPayload):
    """
    Publish telemetry data to Redis stream for processing.
    
    The telemetry will be processed by background workers and
    insights will be published to the 'live-insights' stream.
    """
    try:
        r = make_redis()
        producer = RedisTelemetryProducer(r)
        msg_id = producer.publish(payload.dict())
        logger.debug(f"Published telemetry: {msg_id}")
        return {
            "message_id": msg_id,
            "status": "published",
            "vehicle_id": payload.vehicle_id
        }
    except Exception as e:
        logger.exception("Failed to publish telemetry")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/insights/stream")
async def stream_insights():
    """
    Stream live insights via Server-Sent Events (SSE).
    
    Subscribes to the 'live-insights' Redis stream and emits
    real-time predictions and analytics.
    
    Usage in frontend:
    ```typescript
    const eventSource = new EventSource('/api/telemetry/insights/stream');
    eventSource.addEventListener('insight', (e) => {
      const data = JSON.parse(e.data);
      console.log(data);
    });
    ```
    """
    r = make_redis()
    stream_name = os.getenv("REDIS_INSIGHTS_STREAM", "live-insights")
    
    async def generate():
        last_id = "0"
        error_count = 0
        max_errors = 10
        
        while error_count < max_errors:
            try:
                # Read from stream (block for 1 second)
                messages = r.xread({stream_name: last_id}, count=10, block=1000)
                
                for stream, msgs in messages:
                    for msg_id, data in msgs:
                        try:
                            payload = json.loads(data["payload"])
                            yield {
                                "event": "insight",
                                "data": json.dumps(payload)
                            }
                            last_id = msg_id
                            error_count = 0  # Reset on success
                        except json.JSONDecodeError as e:
                            logger.warning(f"Failed to parse insight payload: {e}")
                            continue
                
                # If no messages, send heartbeat
                if not messages:
                    yield {
                        "event": "heartbeat",
                        "data": json.dumps({"timestamp": asyncio.get_event_loop().time()})
                    }
                    
            except Exception as e:
                error_count += 1
                logger.exception(f"Error in insights stream (attempt {error_count}/{max_errors})")
                yield {
                    "event": "error",
                    "data": json.dumps({"error": str(e), "retry": error_count < max_errors})
                }
                await asyncio.sleep(1)
        
        # Close stream after max errors
        logger.error("Max errors reached, closing insights stream")
        yield {
            "event": "close",
            "data": json.dumps({"reason": "max_errors_reached"})
        }
    
    return EventSourceResponse(generate())


@router.get("/health")
async def telemetry_health():
    """Check telemetry pipeline health"""
    try:
        r = make_redis()
        # Check Redis connection
        r.ping()
        
        # Check stream exists
        stream_name = os.getenv("REDIS_STREAM", "telemetry")
        try:
            info = r.xinfo_stream(stream_name)
            stream_length = info.get("length", 0)
        except Exception:
            stream_length = 0
        
        return {
            "status": "healthy",
            "redis_connected": True,
            "stream_length": stream_length
        }
    except Exception as e:
        logger.exception("Telemetry health check failed")
        return {
            "status": "unhealthy",
            "redis_connected": False,
            "error": str(e)
        }

