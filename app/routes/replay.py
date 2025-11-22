"""
Replay API Routes
=================
Endpoints for CSV replay functionality and pit simulation
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
import json
import logging
import pandas as pd
from datetime import datetime
from pathlib import Path
import uuid
import asyncio

from app.config import DATA_DEMO_SLICES_DIR, DEMO_MODE
from app.services.tire_wear_predictor import tire_wear_predictor
from app.services.performance_analyzer import performance_analyzer
from app.services.strategy_optimizer import strategy_optimizer
from app.data.data_loader import data_loader

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/replay", tags=["Replay"])

# In-memory store for replays (in production, use Redis or database)
replay_store: Dict[str, Dict[str, Any]] = {}

# Demo slices available
DEMO_SLICES = {
    "tire_cliff": {
        "name": "Tire Cliff Scenario",
        "description": "Vehicle experiences rapid tire degradation requiring immediate pit",
        "file": "tire_cliff.json"
    },
    "overtake_seed": {
        "name": "Overtake Opportunity",
        "description": "Strategic pit window opens for undercut/overcut",
        "file": "best_overtake.json"
    },
    "driver_lockup": {
        "name": "Driver Lockup",
        "description": "Driver error causes tire damage requiring early pit",
        "file": "last_lap_push.json"
    }
}


@router.get("/demo-slices")
async def get_demo_slices():
    """
    Get list of available demo slices for judges
    """
    slices = []
    for slice_id, slice_info in DEMO_SLICES.items():
        slice_path = DATA_DEMO_SLICES_DIR / slice_info["file"]
        available = slice_path.exists()
        slices.append({
            "id": slice_id,
            "name": slice_info["name"],
            "description": slice_info["description"],
            "available": available
        })
    
    return {
        "success": True,
        "slices": slices,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/upload")
async def upload_replay(
    file: UploadFile = File(...),
    track: Optional[str] = Query(None, description="Track identifier"),
    race: Optional[int] = Query(None, description="Race number")
):
    """
    Upload a CSV file for replay analysis
    
    Returns replay_id for subsequent operations
    """
    try:
        # Read CSV file
        contents = await file.read()
        
        # Try to parse as CSV
        try:
            df = pd.read_csv(pd.io.common.BytesIO(contents))
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid CSV file: {str(e)}"
            )
        
        # Validate required columns
        required_columns = ["lap", "vehicle_number"]
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {missing_columns}"
            )
        
        # Generate replay ID
        replay_id = str(uuid.uuid4())
        
        # Store replay data
        replay_store[replay_id] = {
            "id": replay_id,
            "filename": file.filename,
            "track": track or "unknown",
            "race": race or 1,
            "data": df.to_dict(orient="records"),
            "columns": list(df.columns),
            "total_rows": len(df),
            "laps": sorted(df["lap"].unique().tolist()) if "lap" in df.columns else [],
            "vehicles": sorted(df["vehicle_number"].unique().tolist()) if "vehicle_number" in df.columns else [],
            "created_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Replay uploaded: {replay_id}, rows={len(df)}, laps={len(replay_store[replay_id]['laps'])}")
        
        return {
            "success": True,
            "replay_id": replay_id,
            "metadata": {
                "filename": file.filename,
                "total_rows": len(df),
                "laps": len(replay_store[replay_id]["laps"]),
                "vehicles": len(replay_store[replay_id]["vehicles"]),
                "columns": list(df.columns)
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading replay: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/demo/{slice_id}")
async def load_demo_slice(slice_id: str):
    """
    Load a demo slice for replay
    
    Returns replay_id for subsequent operations
    """
    if slice_id not in DEMO_SLICES:
        raise HTTPException(
            status_code=404,
            detail=f"Demo slice '{slice_id}' not found"
        )
    
    slice_info = DEMO_SLICES[slice_id]
    slice_path = DATA_DEMO_SLICES_DIR / slice_info["file"]
    
    if not slice_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Demo slice file not found: {slice_path}"
        )
    
    try:
        # Load JSON demo slice
        with open(slice_path, 'r') as f:
            slice_data = json.load(f)
        
        # Convert to DataFrame for consistency
        df = pd.DataFrame(slice_data)
        
        # Generate replay ID
        replay_id = str(uuid.uuid4())
        
        # Store replay data
        replay_store[replay_id] = {
            "id": replay_id,
            "filename": f"demo_{slice_id}.json",
            "track": "demo",
            "race": 1,
            "data": slice_data,
            "columns": list(df.columns) if not df.empty else [],
            "total_rows": len(df),
            "laps": sorted(df["lap"].unique().tolist()) if not df.empty and "lap" in df.columns else [],
            "vehicles": sorted(df["vehicle_number"].unique().tolist()) if not df.empty and "vehicle_number" in df.columns else [],
            "created_at": datetime.utcnow().isoformat(),
            "demo_slice": slice_id
        }
        
        logger.info(f"Demo slice loaded: {slice_id} -> {replay_id}")
        
        return {
            "success": True,
            "replay_id": replay_id,
            "metadata": {
                "slice_id": slice_id,
                "slice_name": slice_info["name"],
                "description": slice_info["description"],
                "total_rows": len(df),
                "laps": len(replay_store[replay_id]["laps"]),
                "vehicles": len(replay_store[replay_id]["vehicles"])
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error loading demo slice: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{replay_id}")
async def get_replay_info(replay_id: str):
    """
    Get information about a replay
    """
    if replay_id not in replay_store:
        raise HTTPException(
            status_code=404,
            detail=f"Replay '{replay_id}' not found"
        )
    
    replay = replay_store[replay_id]
    
    return {
        "success": True,
        "replay": {
            "id": replay["id"],
            "filename": replay["filename"],
            "track": replay["track"],
            "race": replay["race"],
            "total_rows": replay["total_rows"],
            "laps": replay["laps"],
            "vehicles": replay["vehicles"],
            "columns": replay["columns"],
            "created_at": replay["created_at"]
        },
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/{replay_id}/simulate_pit")
async def simulate_pit(
    replay_id: str,
    lap: int = Query(..., description="Lap number to simulate pit"),
    action: str = Query("box_now", description="Action: 'box_now', 'stay_out', 'box_later'"),
    vehicle_number: Optional[int] = Query(None, description="Vehicle number (required if multiple vehicles)")
):
    """
    Simulate a pit stop and return predicted impact on finishing position/time
    
    This endpoint:
    1. Takes the current race state at lap N
    2. Applies the pit action
    3. Re-runs predictions for remaining laps
    4. Returns delta in finishing time/position
    """
    if replay_id not in replay_store:
        raise HTTPException(
            status_code=404,
            detail=f"Replay '{replay_id}' not found"
        )
    
    replay = replay_store[replay_id]
    
    try:
        # Convert replay data to DataFrame
        if isinstance(replay["data"], list):
            df = pd.DataFrame(replay["data"])
        else:
            df = pd.DataFrame([replay["data"]])
        
        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="Replay data is empty"
            )
        
        # Filter by vehicle if specified
        if vehicle_number is not None:
            if "vehicle_number" in df.columns:
                df = df[df["vehicle_number"] == vehicle_number]
            else:
                raise HTTPException(
                    status_code=400,
                    detail="vehicle_number specified but not in replay data"
                )
        
        # Filter by lap range (up to simulation lap)
        if "lap" in df.columns:
            df_before_pit = df[df["lap"] <= lap].copy()
        else:
            df_before_pit = df.copy()
        
        if df_before_pit.empty:
            raise HTTPException(
                status_code=400,
                detail=f"No data found for lap {lap} or earlier"
            )
        
        # Get current state
        current_lap = lap
        total_laps = replay.get("laps", [])
        if total_laps:
            total_laps = max(total_laps)
        else:
            total_laps = current_lap + 10  # Default estimate
        
        remaining_laps = total_laps - current_lap
        
        # Predict tire wear at current lap
        tire_wear = tire_wear_predictor.predict_tire_wear(
            df_before_pit, current_lap, 
            vehicle_number or (df_before_pit["vehicle_number"].iloc[0] if "vehicle_number" in df_before_pit.columns else 1),
            include_ci=True,
            include_explainability=True
        )
        
        # Simulate two scenarios:
        # 1. Stay out (current trajectory)
        # 2. Pit now (reset tire wear, add pit time)
        
        base_lap_time = 123.5  # Default (could be calculated from data)
        pit_time_loss = 25.0  # Seconds lost in pit
        
        # Scenario 1: Stay out
        if tire_wear.max_wear >= 95:
            stay_out_laps_remaining = 0
        else:
            stay_out_laps_remaining = remaining_laps
        
        # Calculate predicted time for staying out
        # Simplified: assume lap time degrades with tire wear
        wear_penalty_per_lap = (tire_wear.max_wear / 100.0) * 2.0  # 2s penalty at 100% wear
        stay_out_total_time = sum([
            base_lap_time + (wear_penalty_per_lap * (i + 1))
            for i in range(stay_out_laps_remaining)
        ])
        
        # Scenario 2: Pit now
        pit_total_time = pit_time_loss  # Pit stop time
        # After pit, fresh tires (0% wear), assume optimal lap times
        pit_total_time += sum([
            base_lap_time  # Fresh tires = optimal lap time
            for i in range(remaining_laps)
        ])
        
        # Calculate delta
        time_delta = stay_out_total_time - pit_total_time
        position_delta = None  # Would need competitor data to calculate
        
        # Determine recommendation
        if action == "box_now":
            recommended = time_delta > 0  # Pit if it saves time
        elif action == "stay_out":
            recommended = time_delta < 0  # Stay out if it saves time
        else:
            recommended = None
        
        return {
            "success": True,
            "simulation": {
                "replay_id": replay_id,
                "simulation_lap": lap,
                "action": action,
                "scenarios": {
                    "stay_out": {
                        "predicted_finish_time": stay_out_total_time,
                        "laps_remaining": stay_out_laps_remaining,
                        "final_tire_wear": min(100.0, tire_wear.max_wear + (wear_penalty_per_lap * stay_out_laps_remaining))
                    },
                    "pit_now": {
                        "predicted_finish_time": pit_total_time,
                        "laps_remaining": remaining_laps,
                        "final_tire_wear": 0.0,  # Fresh tires
                        "pit_time_loss": pit_time_loss
                    }
                },
                "delta": {
                    "time_seconds": time_delta,
                    "time_formatted": f"{'+' if time_delta > 0 else ''}{time_delta:.2f}s",
                    "position_delta": position_delta
                },
                "recommendation": {
                    "action": "box_now" if time_delta > 0 else "stay_out",
                    "confidence": abs(time_delta) / max(stay_out_total_time, pit_total_time) if max(stay_out_total_time, pit_total_time) > 0 else 0.0,
                    "rationale": f"Pit now saves {abs(time_delta):.2f}s" if time_delta > 0 else f"Stay out saves {abs(time_delta):.2f}s"
                },
                "current_state": {
                    "tire_wear": {
                        "max_wear": tire_wear.max_wear,
                        "front_left": tire_wear.front_left,
                        "front_right": tire_wear.front_right,
                        "rear_left": tire_wear.rear_left,
                        "rear_right": tire_wear.rear_right
                    },
                    "predicted_laps_remaining": tire_wear.predicted_laps_remaining,
                    "pit_window": tire_wear.pit_window
                }
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error simulating pit: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{replay_id}/preview")
async def get_replay_preview(
    replay_id: str,
    limit: int = Query(100, description="Number of rows to preview")
):
    """
    Get a preview of replay data
    """
    if replay_id not in replay_store:
        raise HTTPException(
            status_code=404,
            detail=f"Replay '{replay_id}' not found"
        )
    
    replay = replay_store[replay_id]
    
    # Convert to DataFrame for preview
    if isinstance(replay["data"], list):
        df = pd.DataFrame(replay["data"])
    else:
        df = pd.DataFrame([replay["data"]])
    
    preview_df = df.head(limit)
    
    return {
        "success": True,
        "preview": preview_df.to_dict(orient="records"),
        "total_rows": len(df),
        "columns": list(df.columns),
        "timestamp": datetime.utcnow().isoformat()
    }

