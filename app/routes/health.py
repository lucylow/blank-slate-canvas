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
    checks = {
        "service": True,
        "model_loaded": _model_loaded,
        "db_available": _db_available,
        "cache_available": _cache_available,
    }
    
    # For demo mode, we don't require DB/cache
    from app.config import DEMO_MODE
    if DEMO_MODE:
        checks["demo_mode"] = True
        # In demo mode, we're ready if the service is running
        ready = checks["service"]
    else:
        # In production, require model and DB
        ready = checks["service"] and checks["model_loaded"] and checks["db_available"]
    
    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    
    readiness_data = {
        "ready": ready,
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    
    logger.debug(f"Readiness check: {readiness_data}")
    return readiness_data

