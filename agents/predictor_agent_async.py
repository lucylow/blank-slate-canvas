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
import traceback

import redis.asyncio as aioredis
import onnxruntime as ort
from river import linear_model, preprocessing  # example online model

# Import error handling utilities
sys.path.insert(0, str(Path(__file__).parent))
try:
    from utils.error_handling import (
        retry_with_backoff,
        handle_redis_error,
        log_error_with_context,
        ErrorSeverity,
        safe_redis_operation
    )
except ImportError:
    # Fallback if utils not available
    def retry_with_backoff(*args, **kwargs):
        def decorator(func):
            return func
        return decorator
    def handle_redis_error(*args, **kwargs):
        pass
    def log_error_with_context(*args, **kwargs):
        pass
    ErrorSeverity = None
    safe_redis_operation = None

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
    """Ensure consumer group exists with proper error handling."""
    try:
        await r.xgroup_create(INPUT_STREAM, GROUP, id="$", mkstream=True)
        logger.debug(f"Created consumer group {GROUP} for stream {INPUT_STREAM}")
    except aioredis.exceptions.ResponseError as e:
        # Group already exists - this is expected
        if "BUSYGROUP" in str(e) or "already exists" in str(e).lower():
            logger.debug(f"Consumer group {GROUP} already exists")
        else:
            log_error_with_context(
                e,
                "predictor_agent",
                "ensure_group",
                ErrorSeverity.MEDIUM if ErrorSeverity else None,
                {"stream": INPUT_STREAM, "group": GROUP}
            )
    except Exception as e:
        log_error_with_context(
            e,
            "predictor_agent",
            "ensure_group",
            ErrorSeverity.HIGH if ErrorSeverity else None,
            {"stream": INPUT_STREAM, "group": GROUP}
        )
        raise

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
    """Run ONNX inference with error handling."""
    if sess is None:
        # fallback to trivial predictor
        return {"pred": sum(vec)/len(vec) if vec else 0.0}
    
    try:
        inp_name = sess.get_inputs()[0].name
        out_name = sess.get_outputs()[0].name
        # onnx expects numpy arrays
        import numpy as np
        arr = np.array([vec], dtype=np.float32)
        res = sess.run([out_name], {inp_name: arr})
        return {"pred": float(res[0][0][0])}
    except Exception as e:
        log_error_with_context(
            e,
            "predictor_agent",
            "onnx_inference",
            ErrorSeverity.HIGH if ErrorSeverity else None,
            {"vector_length": len(vec) if vec else 0}
        )
        # Fallback to trivial predictor on error
        return {"pred": sum(vec)/len(vec) if vec else 0.0, "error": str(e)}

async def process_message(r, msg_id, agg_msg):
    """Process a single message with comprehensive error handling."""
    try:
        # prepare vec (now includes car-track features if available)
        try:
            vec, order = _prepare_input_vector(agg_msg)
        except Exception as e:
            log_error_with_context(
                e,
                "predictor_agent",
                "prepare_input_vector",
                ErrorSeverity.MEDIUM if ErrorSeverity else None,
                {"msg_id": msg_id, "agg_keys": list(agg_msg.keys()) if isinstance(agg_msg, dict) else "unknown"}
            )
            raise
        
        # inference in threadpool to avoid blocking event loop
        try:
            loop = asyncio.get_running_loop()
            pred = await loop.run_in_executor(executor, run_onnx_inference, vec)
        except Exception as e:
            log_error_with_context(
                e,
                "predictor_agent",
                "inference",
                ErrorSeverity.HIGH if ErrorSeverity else None,
                {"msg_id": msg_id, "vector_length": len(vec) if vec else 0}
            )
            raise
        
        # publish result (include feature order for debugging)
        out = {
            "task": agg_msg,
            "prediction": pred,
            "model_version": "onnx-v1",
            "feature_count": len(vec),
            "features_enriched": len(order) > 6,  # More than base 6 features
            "timestamp": time.time()
        }
        
        try:
            await r.xadd(PRED_STREAM, {"payload": json.dumps(out)})
        except Exception as e:
            handle_redis_error("xadd_prediction", "predictor_agent", e, {"msg_id": msg_id})
            raise
        
        # optional: online update using river if label arrives later
        # river_model.learn_one({order[i]: vec[i] for i in range(len(order))}, y_true)
        
    except Exception as e:
        # Re-raise to be handled by caller
        raise

async def run_predictor():
    """Main predictor loop with comprehensive error handling."""
    r = None
    connection_retries = 0
    max_connection_retries = 5
    
    # Initialize Redis connection with retry
    while r is None:
        try:
            r = aioredis.from_url(REDIS_URL, decode_responses=True)
            await r.ping()
            await ensure_group(r)
            connection_retries = 0
            logger.info("Predictor agent connected to Redis")
        except Exception as e:
            connection_retries += 1
            handle_redis_error("initial_connect", "predictor_agent", e)
            if connection_retries >= max_connection_retries:
                logger.error(f"Failed to connect to Redis after {max_connection_retries} attempts")
                raise
            await asyncio.sleep(2 * connection_retries)
    
    consecutive_errors = 0
    max_consecutive_errors = 10
    
    while True:
        try:
            # Test connection periodically
            if consecutive_errors > 0 and consecutive_errors % 5 == 0:
                try:
                    await r.ping()
                    connection_retries = 0
                except Exception as e:
                    handle_redis_error("ping", "predictor_agent", e)
                    r = None
                    # Attempt reconnection
                    for retry in range(max_connection_retries):
                        try:
                            r = aioredis.from_url(REDIS_URL, decode_responses=True)
                            await r.ping()
                            await ensure_group(r)
                            logger.info("Predictor agent reconnected to Redis")
                            break
                        except Exception as reconnect_error:
                            if retry == max_connection_retries - 1:
                                logger.error("Failed to reconnect to Redis")
                                raise
                            await asyncio.sleep(2 * (retry + 1))
            
            res = await r.xreadgroup(GROUP, CONSUMER, {INPUT_STREAM: ">"}, count=20, block=500)
            consecutive_errors = 0  # Reset on success
            
            if not res:
                await asyncio.sleep(0.01)
                continue
            
            for stream, entries in res:
                ids_to_ack = []
                ids_failed = []
                
                for msg_id, fields in entries:
                    try:
                        payload = fields.get("payload")
                        if not payload:
                            logger.warning(f"No payload in message {msg_id}")
                            ids_failed.append(msg_id)
                            continue
                        
                        try:
                            agg_msg = json.loads(payload)
                        except json.JSONDecodeError as e:
                            log_error_with_context(
                                e,
                                "predictor_agent",
                                "parse_payload",
                                ErrorSeverity.MEDIUM if ErrorSeverity else None,
                                {"msg_id": msg_id, "payload_preview": str(payload)[:200]}
                            )
                            # Try to use fields directly as fallback
                            agg_msg = fields
                        except Exception as e:
                            log_error_with_context(
                                e,
                                "predictor_agent",
                                "parse_payload",
                                ErrorSeverity.MEDIUM if ErrorSeverity else None,
                                {"msg_id": msg_id}
                            )
                            agg_msg = fields
                        
                        await process_message(r, msg_id, agg_msg)
                        ids_to_ack.append(msg_id)
                        
                    except Exception as e:
                        log_error_with_context(
                            e,
                            "predictor_agent",
                            "process_message",
                            ErrorSeverity.MEDIUM if ErrorSeverity else None,
                            {"msg_id": msg_id}
                        )
                        ids_failed.append(msg_id)
                
                # Ack successful messages
                if ids_to_ack:
                    try:
                        await r.xack(INPUT_STREAM, GROUP, *ids_to_ack)
                    except Exception as e:
                        handle_redis_error("xack", "predictor_agent", e, {"msg_count": len(ids_to_ack)})
                        r = None  # Mark connection as potentially broken
                        raise
                
                # Log failed messages for monitoring
                if ids_failed:
                    logger.warning(f"Failed to process {len(ids_failed)} messages, will be retried")
                    
        except asyncio.CancelledError:
            logger.info("Predictor agent cancelled")
            break
        except (aioredis.exceptions.ConnectionError, OSError, ConnectionError) as e:
            consecutive_errors += 1
            handle_redis_error("xreadgroup", "predictor_agent", e)
            r = None  # Mark connection as broken
            if consecutive_errors >= max_consecutive_errors:
                logger.error(f"Too many consecutive connection errors ({consecutive_errors}), shutting down")
                raise
            await asyncio.sleep(1 * consecutive_errors)
        except Exception as e:
            consecutive_errors += 1
            log_error_with_context(
                e,
                "predictor_agent",
                "main_loop",
                ErrorSeverity.HIGH if ErrorSeverity else None,
                {"consecutive_errors": consecutive_errors}
            )
            if consecutive_errors >= max_consecutive_errors:
                logger.error(f"Too many consecutive errors ({consecutive_errors}), shutting down")
                raise
            await asyncio.sleep(0.5 * consecutive_errors)

if __name__ == "__main__":
    asyncio.run(run_predictor())

