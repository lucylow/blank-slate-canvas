# app/routes/api_models.py

"""
Model management: manifest, versioning, metadata.

Why: Jonny & Marc want auditability; model version in every prediction.

"""



import json

import os

import logging

from fastapi import APIRouter, HTTPException



router = APIRouter()

logger = logging.getLogger(__name__)



MANIFEST_PATH = os.getenv("MODEL_MANIFEST", "models/manifest.json")



# Ensure manifest file exists

os.makedirs(os.path.dirname(MANIFEST_PATH) or ".", exist_ok=True)

if not os.path.exists(MANIFEST_PATH):

    default_manifest = {

        "tire-v1.0": {

            "model_version": "tire-v1.0",

            "trained_on": "2025-10-01",

            "train_data_sha": "sha256:abcdef123456789",

            "metrics": {

                "rmse_overall": 0.55,

                "r2_overall": 0.82,

                "rmse_by_track": {

                    "sebring": 0.48,

                    "road_america": 0.62,

                    "cota": 0.51

                }

            },

            "artifact_path": "/app/models/tire-v1.0.pkl",

            "git_commit": "abcde12345fghij",

            "status": "active"

        }

    }

    with open(MANIFEST_PATH, "w") as fh:

        json.dump(default_manifest, fh, indent=2)



@router.get("/")

async def list_models():

    """List all available models and their metadata."""

    try:

        if os.path.exists(MANIFEST_PATH):

            with open(MANIFEST_PATH, "r") as fh:

                manifest = json.load(fh)

        else:

            manifest = {}

        

        return {

            "models": manifest,

            "count": len(manifest),

            "active": [k for k, v in manifest.items() if v.get("status") == "active"]

        }

    except Exception as e:

        logger.error(f"Error listing models: {e}")

        raise HTTPException(status_code=500, detail=str(e))



@router.get("/{model_name}")

async def get_model(model_name: str):

    """Get details for a specific model."""

    try:

        with open(MANIFEST_PATH, "r") as fh:

            manifest = json.load(fh)

        

        if model_name not in manifest:

            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")

        

        model_data = manifest[model_name]

        model_data["loaded"] = os.path.exists(model_data.get("artifact_path", "/nonexistent"))

        

        return model_data

    except HTTPException:

        raise

    except Exception as e:

        logger.error(f"Error getting model: {e}")

        raise HTTPException(status_code=500, detail=str(e))



@router.post("/{model_name}/activate")

async def activate_model(model_name: str):

    """Activate a model version for inference."""

    try:

        with open(MANIFEST_PATH, "r") as fh:

            manifest = json.load(fh)

        

        if model_name not in manifest:

            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")

        

        # Deactivate all others

        for k in manifest:

            manifest[k]["status"] = "inactive"

        

        # Activate this one

        manifest[model_name]["status"] = "active"

        

        with open(MANIFEST_PATH, "w") as fh:

            json.dump(manifest, fh, indent=2)

        

        logger.info(f"✓ Model activated: {model_name}")

        return {"success": True, "active_model": model_name}

    

    except Exception as e:

        logger.error(f"Error activating model: {e}")

        raise HTTPException(status_code=500, detail=str(e))



@router.get("/{model_name}/metrics")

async def model_metrics(model_name: str):

    """Get model evaluation metrics."""

    try:

        with open(MANIFEST_PATH, "r") as fh:

            manifest = json.load(fh)

        

        if model_name not in manifest:

            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")

        

        return {

            "model": model_name,

            "metrics": manifest[model_name].get("metrics", {}),

            "trained_on": manifest[model_name].get("trained_on"),

            "git_commit": manifest[model_name].get("git_commit")

        }

    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))
