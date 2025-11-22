# app/routes/demo.py

"""
Demo mode endpoints for judges to quickly try the system.

Why: Mike needs instant demo with no file uploads; judges want reproducible seeds.
"""

import json
import os
import logging
from fastapi import APIRouter, HTTPException



router = APIRouter()
logger = logging.getLogger(__name__)



DEMO_DIR = os.getenv("DEMO_DIR", "data/demo_slices")



# Ensure demo directory exists

os.makedirs(DEMO_DIR, exist_ok=True)



@router.get("/seed")

async def list_demo_seeds():

    """List all available demo slices."""

    try:

        seeds = {}

        if os.path.exists(DEMO_DIR):

            for filename in os.listdir(DEMO_DIR):

                if filename.endswith(".json"):

                    filepath = os.path.join(DEMO_DIR, filename)

                    with open(filepath, "r") as fh:

                        data = json.load(fh)

                    seeds[filename.replace(".json", "")] = {

                        "file": filename,

                        "size": len(data) if isinstance(data, list) else 1,

                        "description": f"Demo scenario: {filename}"

                    }

        return {"seeds": seeds}

    except Exception as e:

        logger.error(f"Error listing seeds: {e}")

        return {"seeds": {}, "error": str(e)}



@router.get("/seed/{name}")

async def get_demo_seed(name: str):

    """Load a specific demo seed by name."""

    # Sanitize filename

    safe_name = name.replace("..", "").replace("/", "")

    filepath = os.path.join(DEMO_DIR, f"{safe_name}.json")

    

    if not os.path.exists(filepath):

        raise HTTPException(status_code=404, detail=f"Demo seed '{name}' not found")

    

    try:

        with open(filepath, "r") as fh:

            data = json.load(fh)

        return {

            "seed": safe_name,

            "data": data,

            "count": len(data) if isinstance(data, list) else 1

        }

    except Exception as e:

        logger.error(f"Error loading seed: {e}")

        raise HTTPException(status_code=500, detail=f"Error loading seed: {str(e)}")



@router.post("/seed/upload")

async def upload_demo_seed(name: str, data: list):

    """Upload a new demo seed (for testing)."""

    safe_name = name.replace("..", "").replace("/", "")

    filepath = os.path.join(DEMO_DIR, f"{safe_name}.json")

    

    try:

        with open(filepath, "w") as fh:

            json.dump(data, fh, indent=2)

        return {"success": True, "saved_as": safe_name}

    except Exception as e:

        logger.error(f"Error uploading seed: {e}")

        raise HTTPException(status_code=500, detail=str(e))



@router.get("/info")

async def demo_info():

    """Info about the current demo setup."""

    return {

        "demo_mode": os.getenv("DEMO_MODE", "true") == "true",

        "demo_dir": DEMO_DIR,

        "seeds_available": len([f for f in os.listdir(DEMO_DIR) if f.endswith(".json")])

        if os.path.exists(DEMO_DIR) else 0,

        "instructions": {

            "1_list_seeds": "GET /demo/seed",

            "2_load_seed": "GET /demo/seed/{name}",

            "3_simulate": "POST /api/replay with seed data"

        }

    }

