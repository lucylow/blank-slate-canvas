# agents/predictor_agent_async.py

"""
Predictor agent:

- Consumes aggregates.stream (or receives tasks via orchestrator queue)

- Runs ONNX inference (fast path) in threadpool or GPU provider

- Optionally updates an online model via River.learn_one()

- Publishes predict_results.stream with artifact references

"""

import os
import sys
import asyncio
import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Dict, Any, Optional

import redis.asyncio as aioredis
import onnxruntime as ort
from river import linear_model, preprocessing  # example online model

# Add project root to path for importing gr_car_track_mapper
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# Try to import GR car-track matrix utilities (optional enhancement)
try:
    import pandas as pd
    from src.utils.gr_car_track_mapper import generate_car_track_matrix
    GR_MATRIX_AVAILABLE = True
except ImportError as e:
    GR_MATRIX_AVAILABLE = False
    pd = None
    generate_car_track_matrix = None
    # Logger not initialized yet, so we'll log later

logger = logging.getLogger("predictor_agent")
logging.basicConfig(level=logging.INFO)

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")
INPUT_STREAM = os.getenv("AGG_STREAM", "aggregates.stream")
GROUP = os.getenv("PRED_GROUP", "predictor-workers")
CONSUMER = os.getenv("PRED_CONSUMER", f"pred-{int(time.time())}")
MODEL_ONNX_PATH = os.getenv("PRED_ONNX", "models/predictor.onnx")
PRED_STREAM = os.getenv("PRED_STREAM", "predict_results.stream")

# load onnx session once (use GPU if available)
try:
    # Check available providers - prefer CUDA if available, fallback to CPU
    available_providers = ort.get_available_providers()
    providers = []
    if 'CUDAExecutionProvider' in available_providers:
        providers.append('CUDAExecutionProvider')
    providers.append('CPUExecutionProvider')  # Always add CPU as fallback
    
    sess = ort.InferenceSession(MODEL_ONNX_PATH, providers=providers) if os.path.exists(MODEL_ONNX_PATH) else None
    if sess:
        logger.info("ONNX session initialized with providers: %s", sess.get_providers())
except Exception as e:
    logger.warning("ONNX model not available: %s", e)
    sess = None

# river online model (fallback)
river_model = preprocessing.StandardScaler() | linear_model.LinearRegression()

executor = ThreadPoolExecutor(max_workers=2)

# Load GR car-track matrix (lazy load on first use)
_gr_matrix_df: Optional[pd.DataFrame] = None
_gr_matrix_loaded = False

def _ensure_gr_matrix_loaded():
    """Lazy-load the GR car-track matrix on first use."""
    global _gr_matrix_df, _gr_matrix_loaded
    
    if _gr_matrix_loaded:
        return _gr_matrix_df
    
    if not GR_MATRIX_AVAILABLE or pd is None:
        logger.info("GR matrix not available (pandas or mapper not installed), skipping car-track feature enrichment")
        _gr_matrix_loaded = True
        return None
    
    try:
        matrix_path = project_root / "artifacts" / "gr_track_matrix.csv"
        if not matrix_path.exists():
            logger.info("GR matrix not found, generating...")
            if generate_car_track_matrix:
                generate_car_track_matrix(out_dir=str(project_root / "artifacts"))
                matrix_path = project_root / "artifacts" / "gr_track_matrix.csv"
        
        if matrix_path.exists() and pd is not None:
            _gr_matrix_df = pd.read_csv(matrix_path)
            logger.info(f"Loaded GR car-track matrix with {len(_gr_matrix_df)} entries")
        else:
            logger.warning("Failed to generate/load GR matrix")
            _gr_matrix_df = None
    except Exception as e:
        logger.warning(f"Failed to load GR matrix: {e}", exc_info=True)
        _gr_matrix_df = None
    
    _gr_matrix_loaded = True
    return _gr_matrix_df

def _get_car_model_from_chassis(chassis: str) -> str:
    """Extract car model from chassis number (e.g., GR86-002-000 -> GR86)."""
    if not chassis:
        return ""
    parts = chassis.split("-")
    if len(parts) > 0:
        # Handle formats like "GR86-002-000" -> "GR86"
        model_part = parts[0].upper()
        if model_part.startswith("GR"):
            return model_part
    return ""

def _normalize_track_name(track: str) -> str:
    """Normalize track name to match matrix format (e.g., 'cota' -> 'COTA')."""
    if not track:
        return ""
    # Capitalize first letter of each word
    return track.replace("_", " ").title().replace(" ", "")

async def ensure_group(r):
    try:
        await r.xgroup_create(INPUT_STREAM, GROUP, id="$", mkstream=True)
    except Exception:
        pass

def _prepare_input_vector(agg: Dict[str, Any]):
    """
    Enhanced feature preparation using fe_lib for pre-event predictions.
    Map aggregate dict -> ordered numeric vector with advanced features.
    Enriches with GR car-track features if available.
    """
    # Try to use enhanced features from fe_lib (preprocessor_v2 output)
    try:
        # Add predictor directory to path
        predictor_dir = Path(__file__).parent / "predictor"
        if str(predictor_dir) not in sys.path:
            sys.path.insert(0, str(predictor_dir))
        
        from predictor_wrapper import features_from_aggregate, get_feature_names
        
        # Check if we have per_sector data (from preprocessor_v2)
        if agg.get("perSector") or agg.get("per_sector"):
            vec = features_from_aggregate(agg, include_advanced=True)
            track = agg.get("track", "cota")
            base_order = get_feature_names(track=track, include_advanced=True)
            
            # Enrich with GR car-track features if available
            gr_features = {}
            if GR_MATRIX_AVAILABLE:
                try:
                    matrix_df = _ensure_gr_matrix_loaded()
                    if matrix_df is not None and len(matrix_df) > 0:
                        track_name = _normalize_track_name(track)
                        car_model = _get_car_model_from_chassis(agg.get("chassis", ""))
                        
                        if track_name and car_model:
                            match = matrix_df[(matrix_df["track"].str.upper() == track_name.upper()) & 
                                           (matrix_df["car"].str.contains(car_model, case=False, na=False))]
                            
                            if not match.empty:
                                row = match.iloc[0]
                                gr_features = {
                                    "power_to_weight": float(row.get("power_to_weight", 0.0)),
                                    "normalized_track_score": float(row.get("normalized_track_score", 0.0)),
                                }
                                logger.debug(f"Enriched with car-track features: track={track_name}, car={car_model}, features={gr_features}")
                except Exception as e:
                    logger.warning(f"Failed to enrich with GR features: {e}", exc_info=True)
            
            # Append GR features to vector if available
            if gr_features:
                import numpy as np
                vec = np.append(vec, [
                    gr_features.get("power_to_weight", 0.0),
                    gr_features.get("normalized_track_score", 0.0),
                ])
                base_order.extend(["power_to_weight", "normalized_track_score"])
            
            return vec.tolist() if hasattr(vec, 'tolist') else list(vec), base_order
    except Exception as e:
        logger.warning(f"Enhanced feature extraction failed, using fallback: {e}", exc_info=True)
    
    # Fallback: Base telemetry features (backward compatibility)
    base_order = ["avg_speed_kmh","avg_accx_can","avg_accy_can","avg_tire_temp","avg_throttle_pct","avg_brake_pct"]
    vec = [float(agg.get(k, 0.0)) for k in base_order]
    
    # Enrich with car-track features if matrix is available
    gr_features = {}
    if GR_MATRIX_AVAILABLE:
        try:
            matrix_df = _ensure_gr_matrix_loaded()
            if matrix_df is not None and len(matrix_df) > 0:
                track = _normalize_track_name(agg.get("track", ""))
                car_model = _get_car_model_from_chassis(agg.get("chassis", ""))
                
                if track and car_model:
                    match = matrix_df[(matrix_df["track"].str.upper() == track.upper()) & 
                                     (matrix_df["car"].str.contains(car_model, case=False, na=False))]
                    
                    if not match.empty:
                        row = match.iloc[0]
                        gr_features = {
                            "power_to_weight": float(row.get("power_to_weight", 0.0)),
                            "normalized_track_score": float(row.get("normalized_track_score", 0.0)),
                        }
                        logger.debug(f"Enriched with car-track features: track={track}, car={car_model}, features={gr_features}")
        except Exception as e:
            logger.warning(f"Failed to enrich with GR features: {e}", exc_info=True)
    
    # Append GR features to vector if available
    if gr_features:
        vec.extend([
            gr_features.get("power_to_weight", 0.0),
            gr_features.get("normalized_track_score", 0.0),
        ])
        base_order.extend(["power_to_weight", "normalized_track_score"])
    
    return vec, base_order

def run_onnx_inference(vec):
    if sess is None:
        # fallback to trivial predictor
        return {"pred": sum(vec)/len(vec) if vec else 0.0}
    inp_name = sess.get_inputs()[0].name
    out_name = sess.get_outputs()[0].name
    # onnx expects numpy arrays
    import numpy as np
    arr = np.array([vec], dtype=np.float32)
    res = sess.run([out_name], {inp_name: arr})
    return {"pred": float(res[0][0][0])}

async def process_message(r, msg_id, agg_msg):
    # prepare vec (now includes car-track features if available)
    vec, order = _prepare_input_vector(agg_msg)
    # inference in threadpool to avoid blocking event loop
    loop = asyncio.get_running_loop()
    pred = await loop.run_in_executor(executor, run_onnx_inference, vec)
    # publish result (include feature order for debugging)
    out = {
        "task": agg_msg,
        "prediction": pred,
        "model_version": "onnx-v1",
        "feature_count": len(vec),
        "features_enriched": len(order) > 6,  # More than base 6 features
        "timestamp": time.time()
    }
    await r.xadd(PRED_STREAM, {"payload": json.dumps(out)})
    # optional: online update using river if label arrives later
    # river_model.learn_one({order[i]: vec[i] for i in range(len(order))}, y_true)

async def run_predictor():
    r = aioredis.from_url(REDIS_URL, decode_responses=True)
    await ensure_group(r)
    while True:
        try:
            res = await r.xreadgroup(GROUP, CONSUMER, {INPUT_STREAM: ">"}, count=20, block=500)
            if not res:
                await asyncio.sleep(0.01)
                continue
            for stream, entries in res:
                ids_to_ack = []
                for msg_id, fields in entries:
                    payload = fields.get("payload")
                    try:
                        agg_msg = json.loads(payload)
                    except Exception:
                        agg_msg = fields
                    await process_message(r, msg_id, agg_msg)
                    ids_to_ack.append(msg_id)
                if ids_to_ack:
                    await r.xack(INPUT_STREAM, GROUP, *ids_to_ack)
        except Exception:
            logger.exception("predictor loop error")
            await asyncio.sleep(0.5)

if __name__ == "__main__":
    asyncio.run(run_predictor())

