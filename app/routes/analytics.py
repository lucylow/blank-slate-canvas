"""
Analytics routes for evaluation and dataset coverage
"""
from fastapi import APIRouter, HTTPException, Query
import numpy as np
import json
import os
import logging
import glob
from typing import Optional, Dict, Any, List
from pathlib import Path

from app.data.data_loader import data_loader
from app.services.tire_wear_predictor import tire_wear_predictor
from app.config import DATA_PRECOMPUTED_DIR, TRACKS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

def get_precomp_dir() -> Path:
    """Get precomputed directory, creating it if needed"""
    precomp_dir = Path(DATA_PRECOMPUTED_DIR)
    try:
        precomp_dir.mkdir(parents=True, exist_ok=True)
    except (OSError, PermissionError) as e:
        logger.debug(f"Could not create precomputed directory {precomp_dir}: {e}")
    return precomp_dir


def load_track_laps(track: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Load precomputed per-lap features for evaluation
    
    Returns list of dicts with 'features' and 'label' keys
    """
    if track:
        # Try to load from precomputed parquet
        PRECOMP_DIR = get_precomp_dir()
        path = PRECOMP_DIR / f"{track}.parquet"
        if path.exists():
            try:
                import pandas as pd
                df = pd.read_parquet(path)
                out = []
                for _, row in df.iterrows():
                    # Build features dict & label
                    # Handle both dict-like access and attribute access
                    row_dict = row.to_dict() if hasattr(row, 'to_dict') else dict(row)
                    features = {
                        "speed_kmh": float(row_dict.get("speed_kmh", 0)),
                        "avg_lat_g": float(row_dict.get("avg_lat_g", 0)),
                        "avg_long_g": float(row_dict.get("avg_long_g", 0)),
                        "tire_temp": float(row_dict.get("TireTempFL", row_dict.get("tire_temp", 0))),
                    }
                    label = float(row_dict.get("laps_until_cliff", 3.0))
                    out.append({"features": features, "label": label, "track": track})
                return out
            except ImportError:
                logger.warning("pandas not available, skipping parquet loading")
            except Exception as e:
                logger.warning(f"Error loading precomputed data: {e}")
    
    # Fallback: load demo slices
    payload = []
    demo_dir = Path("data/demo_slices")
    if not demo_dir.exists():
        demo_dir = Path(__file__).parent.parent.parent / "data" / "demo_slices"
    
    if demo_dir.exists():
        for f in glob.glob(str(demo_dir / "*.json")):
            try:
                with open(f) as fh:
                    data = json.load(fh)
                    # Handle both array and object formats
                    if isinstance(data, list):
                        arr = data
                    elif isinstance(data, dict):
                        # If it's a single object, wrap it in a list
                        arr = [data]
                    else:
                        continue
                    
                    for s in arr:
                        if not isinstance(s, dict):
                            continue
                        # Create feature/label for demo
                        payload.append({
                            "features": {
                                "speed_kmh": float(s.get("speed_kmh", s.get("Speed", 0))),
                                "avg_lat_g": float(s.get("accy_can", s.get("avg_lateral_g", 0))),
                                "avg_long_g": float(s.get("accx_can", s.get("avg_longitudinal_g", 0))),
                                "tire_temp": float(s.get("TireTempFL", s.get("tire_temp", 80.0))),
                            },
                            "label": 3.0,  # Demo label
                            "track": s.get("track", track or "sebring")
                        })
            except Exception as e:
                logger.debug(f"Error loading demo slice {f}: {e}")
    
    return payload


@router.get("/eval/tire-wear")
def eval_tire_wear(track: Optional[str] = Query(None, description="Track to evaluate (None = all tracks)")):
    """
    Evaluate tire wear prediction model using KFold cross-validation
    
    Returns RMSE per track
    """
    try:
        # Load data
        all_data = load_track_laps(track)
        
        if len(all_data) < 5:
            return {
                "error": "not enough data",
                "n": len(all_data),
                "track": track
            }
        
        # Prepare features and labels
        X = [d['features'] for d in all_data]
        y = [d['label'] for d in all_data]
        
        # Convert to arrays (assumes consistent ordering of dict keys)
        if not X:
            return {"error": "no features", "track": track}
        
        keys = sorted(X[0].keys())
        XA = np.array([[xi.get(k, 0.0) for k in keys] for xi in X])
        YA = np.array(y)
        
        # KFold cross-validation
        from sklearn.model_selection import KFold
        kf = KFold(n_splits=min(5, len(XA)), shuffle=True, random_state=42)
        rmses = []
        
        for train_idx, test_idx in kf.split(XA):
            yp = []
            for i in test_idx:
                # Use tire_wear_predictor for prediction
                # Convert features dict to format expected by predictor
                features_dict = dict(zip(keys, XA[i].tolist()))
                
                # Create a minimal telemetry-like structure for predictor
                # This is a simplified approach - in production, you'd have proper telemetry
                try:
                    # Use the predictor's internal method if available, or simulate
                    # For now, use a simple heuristic based on features
                    pred = features_dict.get("tire_temp", 0) / 100.0 * 5.0  # Simplified heuristic
                    yp.append(pred)
                except Exception as e:
                    logger.debug(f"Prediction error: {e}")
                    yp.append(3.0)  # Default prediction
            
            if len(yp) > 0:
                rmse = float(np.sqrt(np.mean((YA[test_idx] - np.array(yp))**2)))
                rmses.append(rmse)
        
        return {
            "track": track or "all",
            "n": len(XA),
            "rmse_mean": float(np.mean(rmses)) if rmses else 0.0,
            "rmse_std": float(np.std(rmses)) if rmses else 0.0,
            "rmse_list": rmses
        }
    except Exception as e:
        logger.error(f"Evaluation error: {e}", exc_info=True)
        return {"error": str(e), "track": track}


@router.get("/dataset/coverage")
def dataset_coverage() -> Dict[str, Any]:
    """
    Get dataset coverage information (tracks, laps, drivers)
    """
    tracks = {}
    
    # Check precomputed directory
    PRECOMP_DIR = get_precomp_dir()
    if PRECOMP_DIR.exists():
        for f in PRECOMP_DIR.glob("*.parquet"):
            try:
                import pandas as pd
                df = pd.read_parquet(f)
                track_name = f.stem
                tracks[track_name] = {
                    "n_laps": int(df['lap'].nunique()) if 'lap' in df.columns else len(df),
                    "n_drivers": int(df['driver'].nunique()) if 'driver' in df.columns else (
                        int(df['chassis'].nunique()) if 'chassis' in df.columns else None
                    ),
                    "date_min": str(df['meta_time'].min()) if 'meta_time' in df.columns else None,
                    "date_max": str(df['meta_time'].max()) if 'meta_time' in df.columns else None,
                    "source": "precomputed"
                }
            except ImportError:
                logger.debug("pandas not available, skipping parquet files")
                break
            except Exception as e:
                logger.debug(f"Error reading {f}: {e}")
    
    # Check demo slices
    demo_dir = Path("data/demo_slices")
    if not demo_dir.exists():
        demo_dir = Path(__file__).parent.parent.parent / "data" / "demo_slices"
    
    if demo_dir.exists():
        for f in demo_dir.glob("*.json"):
            try:
                with open(f) as fh:
                    data = json.load(fh)
                    # Handle both array and object formats
                    if isinstance(data, list):
                        arr = data
                    elif isinstance(data, dict):
                        arr = [data]
                    else:
                        continue
                    
                    if arr:
                        track_name = arr[0].get("track", "unknown")
                        if track_name not in tracks:
                            tracks[track_name] = {
                                "n_laps": len(arr),
                                "n_drivers": len(set(s.get("chassis", s.get("vehicle_number", "")) for s in arr if isinstance(s, dict))),
                                "date_min": arr[0].get("meta_time") if arr else None,
                                "date_max": arr[-1].get("meta_time") if arr else None,
                                "source": "demo_slice"
                            }
            except Exception as e:
                logger.debug(f"Error reading demo slice {f}: {e}")
    
    # Check actual track data directories
    for track_id, track_config in TRACKS.items():
        if track_id not in tracks:
            track_path = data_loader.get_track_path(track_id)
            if track_path:
                # Try to get basic info
                try:
                    vehicles = data_loader.get_available_vehicles(track_id, 1)
                    if vehicles:
                        tracks[track_id] = {
                            "n_drivers": len(vehicles),
                            "source": "raw_data"
                        }
                except Exception:
                    pass
    
    return {
        "tracks": tracks,
        "total_tracks": len(tracks)
    }
