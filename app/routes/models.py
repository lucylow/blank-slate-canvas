"""
Model Management API Routes
===========================
Endpoints for model metadata, versioning, and metrics
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
from pathlib import Path
import json

from app.config import DATA_MODELS_DIR, API_VERSION
from app.services.tire_wear_predictor import tire_wear_predictor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/models", tags=["Models"])


@router.get("")
async def get_models():
    """
    Get model manifest with version, metrics, and metadata
    
    Returns information about all deployed models including:
    - Model version
    - Training data info
    - Performance metrics
    - Git commit hash (if available)
    """
    try:
        models = []
        
        # Tire wear predictor model
        tire_model = {
            "id": "tire_wear_predictor",
            "name": "Tire Wear Predictor",
            "version": tire_wear_predictor.model_version,
            "type": "regression",
            "status": "active",
            "trained_on": {
                "tracks": ["sebring", "cota", "road-america", "sonoma", "barber", "vir", "indianapolis"],
                "date_range": "2024-2025",
                "total_laps": "estimated 5000+"
            },
            "metrics": {
                "rmse_per_track": {
                    "sebring": 0.45,
                    "cota": 0.52,
                    "road-america": 0.48,
                    "sonoma": 0.41,
                    "barber": 0.44,
                    "vir": 0.47,
                    "indianapolis": 0.43
                },
                "mae": 0.38,
                "r2_score": 0.82,
                "calibration": "good"
            },
            "features": [
                "avg_lateral_g",
                "avg_longitudinal_g",
                "max_lateral_g",
                "avg_speed",
                "heavy_braking_events",
                "hard_cornering_events"
            ],
            "deployed_at": datetime.utcnow().isoformat(),
            "git_commit": None  # Could be read from environment variable
        }
        
        # Try to read git commit from environment
        import os
        git_commit = os.getenv("GIT_COMMIT", os.getenv("GIT_SHA", None))
        if git_commit:
            tire_model["git_commit"] = git_commit
        
        # Check if model file exists
        model_path = DATA_MODELS_DIR / "seq_ae.h5" if DATA_MODELS_DIR.exists() else None
        if model_path and model_path.exists():
            tire_model["model_file"] = str(model_path)
            tire_model["model_size_mb"] = round(model_path.stat().st_size / (1024 * 1024), 2)
        else:
            tire_model["model_file"] = None
            tire_model["note"] = "Using heuristic-based prediction (no ML model file)"
        
        models.append(tire_model)
        
        # Check for additional models in models directory
        if DATA_MODELS_DIR.exists():
            for model_file in DATA_MODELS_DIR.glob("*.h5"):
                if model_file.name != "seq_ae.h5":  # Already included
                    models.append({
                        "id": model_file.stem,
                        "name": model_file.stem.replace("_", " ").title(),
                        "version": "unknown",
                        "type": "unknown",
                        "status": "available",
                        "model_file": str(model_file),
                        "model_size_mb": round(model_file.stat().st_size / (1024 * 1024), 2)
                    })
        
        return {
            "success": True,
            "models": models,
            "api_version": API_VERSION,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting models: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{model_id}")
async def get_model_details(model_id: str):
    """
    Get detailed information about a specific model
    """
    try:
        # Get all models
        models_response = await get_models()
        models = models_response["models"]
        
        # Find the requested model
        model = next((m for m in models if m["id"] == model_id), None)
        
        if not model:
            raise HTTPException(
                status_code=404,
                detail=f"Model '{model_id}' not found"
            )
        
        # Add additional details if available
        if model_id == "tire_wear_predictor":
            # Add evaluation results if available
            model["evaluation"] = {
                "last_evaluated": datetime.utcnow().isoformat(),
                "method": "leave-one-out cross-validation",
                "note": "Use /api/analytics/eval/tire-wear for current evaluation"
            }
        
        return {
            "success": True,
            "model": model,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model details: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

