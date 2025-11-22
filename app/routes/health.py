"""
Health and readiness endpoints for monitoring and deployment
"""
from fastapi import APIRouter, Response, status
from datetime import datetime
from typing import Dict, Any
import time
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Health"])

# Track startup time for uptime calculation
START_TIME = time.time()

# Global state tracking
_model_loaded = False
_db_available = False
_cache_available = False

def set_model_loaded(value: bool):
    """Set model loaded status"""
    global _model_loaded
    _model_loaded = value

def set_db_available(value: bool):
    """Set database availability status"""
    global _db_available
    _db_available = value

def set_cache_available(value: bool):
    """Set cache availability status"""
    global _cache_available
    _cache_available = value

def get_uptime_seconds() -> float:
    """Get uptime in seconds"""
    return time.time() - START_TIME

@router.get("/health")
async def health() -> Dict[str, Any]:
    """
    Health check endpoint - returns 200 if service is running
    """
    uptime = get_uptime_seconds()
    
    health_data = {
        "status": "ok",
        "uptime_seconds": round(uptime, 2),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    
    # Add model version if model is loaded
    if _model_loaded:
        health_data["model_version"] = "1.0.0"  # Could be read from config or model metadata
        health_data["model_loaded"] = True
    
    logger.debug(f"Health check: {health_data}")
    return health_data

@router.get("/ready")
async def readiness(response: Response) -> Dict[str, Any]:
    """
    Readiness probe - returns 200 only if all required services are available
    """
    import os
    from app.config import DEMO_MODE, DATA_MODELS_DIR
    
    # Check model file exists
    model_ok = False
    model_path = os.getenv("MODEL_PATH", str(DATA_MODELS_DIR / "demo_tire_model.pkl"))
    if os.path.exists(model_path):
        model_ok = True
    elif DATA_MODELS_DIR.exists():
        # Check for any model file
        for ext in [".pkl", ".h5", ".onnx"]:
            if list(DATA_MODELS_DIR.glob(f"*{ext}")):
                model_ok = True
                break
    
    # Check Redis connectivity
    redis_ok = False
    try:
        import redis
        from app.config import REDIS_URL
        r = redis.from_url(REDIS_URL, socket_connect_timeout=1)
        r.ping()
        redis_ok = True
    except Exception:
        redis_ok = False
    
    checks = {
        "service": True,
        "model_loaded": _model_loaded,
        "model_ok": model_ok,
        "db_available": _db_available,
        "cache_available": _cache_available,
        "redis_ok": redis_ok,
    }
    
    # For demo mode, we don't require DB/cache/redis
    if DEMO_MODE:
        checks["demo_mode"] = True
        # In demo mode, we're ready if the service is running
        ready = checks["service"]
    else:
        # In production, require model and DB
        ready = checks["service"] and (checks["model_loaded"] or checks["model_ok"]) and checks["db_available"]
    
    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    
    readiness_data = {
        "ready": ready,
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    
    logger.debug(f"Readiness check: {readiness_data}")
    return readiness_data


