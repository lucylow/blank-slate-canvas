# agents/predictor_agent_async.py

"""
Predictor agent:

- Consumes aggregates.stream (or receives tasks via orchestrator queue)

- Runs ONNX inference (fast path) in threadpool or GPU provider

- Optionally updates an online model via River.learn_one()

- Publishes predict_results.stream with artifact references

"""

import os
import asyncio
import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any

import redis.asyncio as aioredis
import onnxruntime as ort
from river import linear_model, preprocessing  # example online model

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

async def ensure_group(r):
    try:
        await r.xgroup_create(INPUT_STREAM, GROUP, id="$", mkstream=True)
    except Exception:
        pass

def _prepare_input_vector(agg: Dict[str, Any]):
    # map aggregate dict -> ordered numeric vector, must match training
    # example: [avg_speed_kmh, avg_accx_can, avg_accy_can, avg_tire_temp]
    order = ["avg_speed_kmh","avg_accx_can","avg_accy_can","avg_tire_temp","avg_throttle_pct","avg_brake_pct"]
    vec = [float(agg.get(k, 0.0)) for k in order]
    return vec, order

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
    # prepare vec
    vec, order = _prepare_input_vector(agg_msg)
    # inference in threadpool to avoid blocking event loop
    loop = asyncio.get_running_loop()
    pred = await loop.run_in_executor(executor, run_onnx_inference, vec)
    # publish result
    out = {
        "task": agg_msg,
        "prediction": pred,
        "model_version": "onnx-v1",
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

