"""
Insights storage and retrieval API
"""
from fastapi import APIRouter, HTTPException
import redis
import json
import os
import logging
from typing import Dict, Any

from app.config import REDIS_URL

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Redis connection
try:
    r = redis.from_url(REDIS_URL)
except Exception as e:
    logger.warning(f"Redis connection failed: {e}, insights will not be available")
    r = None


@router.get("/insights/{insight_id}")
def fetch_insight(insight_id: str) -> Dict[str, Any]:
    """Fetch a stored insight by ID"""
    if not r:
        raise HTTPException(status_code=503, detail="Redis not available")
    
    key = f"insight:{insight_id}"
    
    try:
        data = r.hgetall(key)
        if not data:
            raise HTTPException(status_code=404, detail=f"Insight '{insight_id}' not found")
        
        # Decode bytes to strings
        decoded_data = {}
        for k, v in data.items():
            key_str = k.decode() if isinstance(k, bytes) else k
            val_str = v.decode() if isinstance(v, bytes) else v
            decoded_data[key_str] = val_str
        
        # Parse payload JSON
        payload_str = decoded_data.get("payload", "{}")
        try:
            payload = json.loads(payload_str)
        except json.JSONDecodeError:
            payload = {"raw": payload_str}
        
        return {
            "insight_id": insight_id,
            "payload": payload,
            **{k: v for k, v in decoded_data.items() if k != "payload"}
        }
    except redis.RedisError as e:
        logger.error(f"Redis error fetching insight: {e}")
        raise HTTPException(status_code=500, detail="Error fetching insight")


@router.post("/insights/{insight_id}")
def store_insight(insight_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Store an insight (for internal use by agents)"""
    if not r:
        raise HTTPException(status_code=503, detail="Redis not available")
    
    key = f"insight:{insight_id}"
    
    try:
        r.hset(key, mapping={
            "payload": json.dumps(payload),
            "created_at": json.dumps(os.getenv("TIMESTAMP", "unknown"))
        })
        
        # Set TTL (24 hours)
        r.expire(key, 86400)
        
        return {"success": True, "insight_id": insight_id}
    except redis.RedisError as e:
        logger.error(f"Redis error storing insight: {e}")
        raise HTTPException(status_code=500, detail="Error storing insight")

