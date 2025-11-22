"""
Demo mode router for demo slices and seed data
"""
from fastapi import APIRouter, HTTPException
import json
import os
import logging
from pathlib import Path

from app.config import DATA_DEMO_SLICES_DIR

logger = logging.getLogger(__name__)

router = APIRouter()

DEMO_DIR = Path(DATA_DEMO_SLICES_DIR)
DEMO_DIR.mkdir(parents=True, exist_ok=True)


@router.get("/seed")
def seed_list():
    """List available demo seed slices"""
    files = []
    if DEMO_DIR.exists():
        for f in DEMO_DIR.iterdir():
            if f.suffix == ".json":
                files.append(f.name)
    return {"slices": sorted(files)}


@router.get("/seed/{name}")
def seed_slice(name: str):
    """Get a specific demo seed slice"""
    # Sanitize filename to prevent path traversal
    if ".." in name or "/" in name or "\\" in name:
        raise HTTPException(status_code=400, detail="Invalid slice name")
    
    path = DEMO_DIR / name
    if not path.exists() or not path.suffix == ".json":
        raise HTTPException(status_code=404, detail=f"Slice '{name}' not found")
    
    try:
        with open(path, "r") as fh:
            return json.load(fh)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON in slice: {e}")

