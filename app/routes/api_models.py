"""
Model manifest and metadata API
"""
from fastapi import APIRouter, HTTPException
import json
import os
import logging
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger(__name__)

router = APIRouter()

# Default manifest path
from app.config import DATA_MODELS_DIR

MANIFEST_PATH = Path(os.getenv("MODEL_MANIFEST", str(DATA_MODELS_DIR / "manifest.json")))
if not MANIFEST_PATH.is_absolute():
    # Make relative to project root
    MANIFEST_PATH = Path(__file__).parent.parent.parent / MANIFEST_PATH


@router.get("/")
def list_models() -> Dict[str, Any]:
    """List all available models from manifest"""
    if not MANIFEST_PATH.exists():
        logger.warning(f"Manifest not found at {MANIFEST_PATH}")
        return {}
    
    try:
        with open(MANIFEST_PATH, "r") as fh:
            return json.load(fh)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in manifest: {e}")
        return {}


@router.get("/{model}")
def get_model(model: str) -> Dict[str, Any]:
    """Get metadata for a specific model"""
    if not MANIFEST_PATH.exists():
        raise HTTPException(status_code=404, detail="Manifest not found")
    
    try:
        with open(MANIFEST_PATH, "r") as fh:
            data = json.load(fh)
        
        if model not in data:
            raise HTTPException(status_code=404, detail=f"Model '{model}' not found in manifest")
        
        return data[model]
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON in manifest: {e}")

