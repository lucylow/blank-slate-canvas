"""
telemetry_pipeline.py

Comprehensive example code for:

- Redis Streams producer / consumer with consumer groups
- Batch XACK, XTRIM, monitoring (XINFO)
- Sector windowing aggregator (in-memory with optional Redis backing)
- Online model manager (scikit-learn partial_fit + River streaming)
- ONNX inference wrapper for quantized/optimized models (onnxruntime)

This file is written as a reference implementation to integrate the ideas from
"Improving Real-Time Telemetry Pipelines and ML Efficiency in Motorsport".

It intentionally focuses on clarity and best-practice patterns (batch acking,
trimming, monitoring, incremental updates) rather than full production hardening.

Note: update REDIS_URL and model paths to suit your environment.
"""

import os
import time
import json
import threading
import logging
from collections import defaultdict, deque
from typing import Callable, Dict, Any, Iterable, Tuple, Optional, List
import redis
import numpy as np

# Optional ML libs
try:
    from sklearn.linear_model import SGDRegressor
    from sklearn.preprocessing import StandardScaler
    import joblib
except Exception:
    SGDRegressor = None

try:
    from river import linear_model as r_linear, preprocessing as r_pre
except Exception:
    r_linear = None

try:
    import onnxruntime as ort
except Exception:
    ort = None

# ---- Configuration ----
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_STREAM = os.getenv("REDIS_STREAM", "telemetry")
REDIS_GROUP = os.getenv("REDIS_GROUP", "telemetry-workers")
REDIS_CONSUMER_NAME = os.getenv("CONSUMER_NAME", "consumer-1")
STREAM_MAXLEN = int(os.getenv("STREAM_MAXLEN", 100_000))  # XTRIM MAXLEN
BATCH_SIZE = int(os.getenv("BATCH_SIZE", 64))
ACK_BATCH = int(os.getenv("ACK_BATCH", 64))
POLL_BLOCK_MS = int(os.getenv("POLL_BLOCK_MS", 500))
MODEL_DIR = os.getenv("MODEL_DIR", "/mnt/data/models")
SKLEARN_MODEL_PATH = os.path.join(MODEL_DIR, "tire_model_sgd.joblib")
ONNX_MODEL_PATH = os.path.join(MODEL_DIR, "model_quant.onnx")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("telemetry_pipeline")

# ---- Redis connection helper ----
def make_redis():
    return redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# ---- Producer utility ----
class RedisTelemetryProducer:
    def __init__(self, client: redis.Redis, stream_name: str = REDIS_STREAM):
        self.r = client
        self.stream = stream_name

    def publish(self, payload: Dict[str, Any]) -> str:
        """Add a telemetry event to the stream and trim if necessary."""
        # Convert values to strings -- Redis Streams is string-keyed
        flat = {k: json.dumps(v) if not isinstance(v, str) else v for k, v in payload.items()}
        msg_id = self.r.xadd(self.stream, flat)
        # Trim approximately to bound memory growth
        try:
            self.r.xtrim(self.stream, maxlen=STREAM_MAXLEN, approximate=True)
        except Exception as e:
            logger.debug("XTRIM failed: %s", e)
        return msg_id

# ---- Consumer group worker ----
class RedisStreamWorker:
    """Consumes from a Redis stream using a consumer group; does batched ACKs.

    Usage:
        worker = RedisStreamWorker(r, 'telemetry', 'telemetry-workers', 'c1', handler)
        worker.run_forever()
    """

    def __init__(self, client: redis.Redis, stream: str, group: str, consumer_name: str,
                 handler: Callable[[str, Dict[str, Any]], None], batch_size: int = BATCH_SIZE):
        self.r = client
        self.stream = stream
        self.group = group
        self.consumer = consumer_name
        self.handler = handler
        self.batch_size = batch_size
        self._stopping = threading.Event()

        # ensure group exists
        try:
            self.r.xgroup_create(self.stream, self.group, id="$", mkstream=True)
            logger.info("Created group %s on stream %s", group, stream)
        except redis.ResponseError:
            # group already exists
            logger.debug("Group already exists")

    def _read_once(self, block=POLL_BLOCK_MS) -> List[Tuple[str, List[Tuple[str, Dict[str, str]]]]]:
        # XREADGROUP
        msgs = self.r.xreadgroup(self.group, self.consumer, {self.stream: ">"}, count=self.batch_size, block=block)
        return msgs or []

    def run_forever(self, idle_retry_seconds: float = 0.1):
        ack_batch: List[str] = []
        try:
            while not self._stopping.is_set():
                entries = self._read_once()
                if not entries:
                    # optionally inspect pending entries when idle
                    time.sleep(idle_retry_seconds)
                    continue

                for stream_name, items in entries:
                    for msg_id, raw in items:
                        # convert values back from strings
                        data = {k: json.loads(v) if self._looks_like_json(v) else v for k, v in raw.items()}
                        try:
                            self.handler(msg_id, data)
                            ack_batch.append(msg_id)
                        except Exception as e:
                            logger.exception("Handler error for %s: %s", msg_id, e)
                        # Bulk ACKing
                        if len(ack_batch) >= ACK_BATCH:
                            self._bulk_ack(ack_batch)
                            ack_batch = []

                # after processing batch, ack remaining
                if ack_batch:
                    self._bulk_ack(ack_batch)
                    ack_batch = []

        except KeyboardInterrupt:
            logger.info("Worker interrupted")
        finally:
            logger.info("Worker stopped")

    def _bulk_ack(self, ids: Iterable[str]):
        try:
            self.r.xack(self.stream, self.group, *list(ids))
        except Exception as e:
            logger.exception("Bulk ACK failed: %s", e)

    def stop(self):
        self._stopping.set()

    @staticmethod
    def _looks_like_json(s: str) -> bool:
        if not isinstance(s, str):
            return False
        return (s.startswith("{") and s.endswith("}")) or (s.startswith("[") and s.endswith("]"))

# ---- Sector window aggregation ----
class SectorWindowAggregator:
    """Maintains rolling windows per (car_id, sector_id) for fast aggregation.

    This is an in-memory approach for low-latency analytics. For larger scale or
    cross-process sharing, use Redis sorted sets or RedisTimeSeries.
    """

    def __init__(self, window_size: int = 200):
        self.window_size = window_size
        # Map: (car_id, sector) -> deque of numeric values or dicts
        self.buffers: Dict[Tuple[str, str], deque] = defaultdict(lambda: deque(maxlen=self.window_size))

    def add_point(self, car_id: str, sector: str, point: Dict[str, Any]):
        key = (car_id, sector)
        self.buffers[key].append(point)

    def get_rolling_stats(self, car_id: str, sector: str) -> Dict[str, Any]:
        key = (car_id, sector)
        buf = self.buffers.get(key)
        if not buf or len(buf) == 0:
            return {"count": 0}
        # Example stats (speed mean / std) — extend as needed
        speeds = [float(p["speed"]) for p in buf if "speed" in p]
        return {
            "count": len(buf),
            "speed_mean": float(np.mean(speeds)) if speeds else None,
            "speed_std": float(np.std(speeds)) if speeds else None,
        }

# ---- Online model manager ----
class OnlineModelManager:
    """Manages online/incremental learning models. Supports scikit-learn partial_fit
    and River streaming models. Saves and loads checkpoints.
    """

    def __init__(self, sklearn_path: str = SKLEARN_MODEL_PATH, river_enabled: bool = True):
        self.sklearn_path = sklearn_path
        self.scaler = StandardScaler() if SGDRegressor else None
        self.model = None
        self.river_model = None
        self.river_enabled = river_enabled and (r_linear is not None)
        if SGDRegressor is not None:
            # initialize a simple SGDRegressor for demonstration
            self.model = SGDRegressor(max_iter=1000, tol=1e-3)
            # For scikit-learn partial_fit we need an initial call with classes/shape
            # We'll lazy-initialize on the first real batch
            self._sklearn_initialized = False
        else:
            self._sklearn_initialized = False

        if self.river_enabled:
            # Simple River pipeline
            self.river_model = r_pre.StandardScaler() | r_linear.LinearRegression()

    def update_batch_sklearn(self, X: np.ndarray, y: np.ndarray):
        if self.model is None:
            raise RuntimeError("Sklearn not available in this environment")
        if not self._sklearn_initialized:
            # partial_fit requires appropriate shape; for regression no 'classes' needed
            self.scaler.partial_fit(X)
            Xs = self.scaler.transform(X)
            self.model.partial_fit(Xs, y)
            self._sklearn_initialized = True
            logger.debug("Initialized sklearn incremental model")
        else:
            Xs = self.scaler.transform(X)
            self.model.partial_fit(Xs, y)

    def predict_sklearn(self, X: np.ndarray) -> np.ndarray:
        if not self._sklearn_initialized:
            raise RuntimeError("Model not initialized")
        Xs = self.scaler.transform(X)
        return self.model.predict(Xs)

    def save_sklearn(self):
        if self.model is None:
            return
        os.makedirs(os.path.dirname(self.sklearn_path), exist_ok=True)
        joblib.dump({"scaler": self.scaler, "model": self.model}, self.sklearn_path)
        logger.info("Saved sklearn model to %s", self.sklearn_path)

    def load_sklearn(self):
        if not os.path.exists(self.sklearn_path):
            logger.warning("Sklearn model path does not exist: %s", self.sklearn_path)
            return
        data = joblib.load(self.sklearn_path)
        self.scaler = data["scaler"]
        self.model = data["model"]
        self._sklearn_initialized = True
        logger.info("Loaded sklearn model from %s", self.sklearn_path)

    def update_stream_river(self, x: Dict[str, float], y: float):
        if not self.river_enabled:
            return
        # river learns one-by-one
        self.river_model = self.river_model.learn_one(x, y)

    def predict_river(self, x: Dict[str, float]) -> float:
        if not self.river_enabled:
            raise RuntimeError("River not enabled")
        return self.river_model.predict_one(x)

# ---- ONNX inference wrapper ----
class ONNXInferenceEngine:
    def __init__(self, model_path: str = ONNX_MODEL_PATH):
        if ort is None:
            raise RuntimeError("onnxruntime not installed")
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"ONNX model not found: {model_path}")

        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'] if 'CUDA_VISIBLE_DEVICES' in os.environ else ['CPUExecutionProvider']
        self.sess = ort.InferenceSession(model_path, providers=providers)
        self.input_name = self.sess.get_inputs()[0].name
        self.output_name = self.sess.get_outputs()[0].name

    def run_batch(self, features: np.ndarray) -> np.ndarray:
        # features: (N, D) ; ONNX expects specific shapes
        # build feed dict
        return self.sess.run([self.output_name], {self.input_name: features.astype(np.float32)})[0]

# ---- Example message handler tying pieces together ----
class TelemetryProcessor:
    def __init__(self, redis_client: redis.Redis):
        self.r = redis_client
        self.aggregator = SectorWindowAggregator(window_size=200)
        self.model_manager = OnlineModelManager()
        self.onnx_engine: Optional[ONNXInferenceEngine] = None
        try:
            self.onnx_engine = ONNXInferenceEngine()
        except Exception as e:
            logger.info("ONNX engine not available: %s", e)

    def process_message(self, msg_id: str, data: Dict[str, Any]):
        # expected fields: timestamp, vehicle_id, sector, speed, brake, throttle, temps...
        vehicle_id = str(data.get("vehicle_id") or data.get("vehicle") or "unknown")
        sector = str(data.get("sector", "0"))

        # add to sector aggregator
        self.aggregator.add_point(vehicle_id, sector, data)

        # compute simple features
        stats = self.aggregator.get_rolling_stats(vehicle_id, sector)
        features = self._build_feature_vector(data, stats)

        # Fast onnx inference if available
        insight = None
        try:
            if self.onnx_engine:
                arr = np.array([features['feature_array']])
                pred = self.onnx_engine.run_batch(arr)[0]
                # example: predict "laps_until_cliff"
                insight = {"laps_until_cliff": float(pred)}
            else:
                # fallback: light heuristic
                insight = {"laps_until_cliff": self._heuristic_laps_until_cliff(data, stats)}
        except Exception:
            logger.exception("Inference failed; using heuristic")
            insight = {"laps_until_cliff": self._heuristic_laps_until_cliff(data, stats)}

        # publish insight to a live-insights stream
        payload = {
            "timestamp": data.get("timestamp", time.time()),
            "vehicle_id": vehicle_id,
            "sector": sector,
            "insight": insight,
        }

        # keep values small: serialize insight as JSON string
        self.r.xadd('live-insights', {"payload": json.dumps(payload)})

        # Online learning: if a label is available in the incoming payload (e.g., ground_truth_laps_until_cliff)
        if "ground_truth_laps_until_cliff" in data and SGDRegressor is not None:
            try:
                X = np.array([features['feature_array']])
                y = np.array([float(data['ground_truth_laps_until_cliff'])])
                self.model_manager.update_batch_sklearn(X, y)
            except Exception:
                logger.exception("Online SKLearn update failed")

        # River example: if we want one-by-one training
        if self.model_manager.river_enabled and "ground_truth_laps_until_cliff" in data:
            x_map = features['feature_map']
            y_val = float(data['ground_truth_laps_until_cliff'])
            self.model_manager.update_stream_river(x_map, y_val)

    def _build_feature_vector(self, data: Dict[str, Any], stats: Dict[str, Any]) -> Dict[str, Any]:
        # Create both a numeric array and a dict map for River; adapt to your model schema
        # Example features: speed, brake, throttle, speed_mean
        speed = float(data.get('speed') or 0.0)
        brake = float(data.get('brake') or 0.0)
        throttle = float(data.get('throttle') or 0.0)
        speed_mean = float(stats.get('speed_mean') or speed)
        feature_array = np.array([speed, brake, throttle, speed_mean], dtype=np.float32)
        feature_map = {"speed": speed, "brake": brake, "throttle": throttle, "speed_mean": speed_mean}
        return {"feature_array": feature_array, "feature_map": feature_map}

    def _heuristic_laps_until_cliff(self, data: Dict[str, Any], stats: Dict[str, Any]) -> float:
        # A simple heuristic example — replace with model outputs
        # If speed variance high and brake-high recent -> near cliff
        speed_std = float(stats.get('speed_std') or 0.1)
        brake = float(data.get('brake') or 0.0)
        base = 5.0
        modifier = - (speed_std * 10.0) - (brake * 2.0)
        return max(0.5, base + modifier)

# ---- Utilities: monitoring / admin -----
def inspect_stream(client: redis.Redis, stream_name: str = REDIS_STREAM):
    try:
        info = client.xinfo_stream(stream_name)
        groups = client.xinfo_groups(stream_name)
        consumers = client.xinfo_consumers(stream_name, REDIS_GROUP)
        logger.info("Stream length: %s", info.get('length'))
        logger.info("Groups: %s", groups)
        logger.info("Consumers: %s", consumers)
    except Exception as e:
        logger.exception("xinfo failed: %s", e)

# ---- Example wiring and run loop ----
def main():
    r = make_redis()
    producer = RedisTelemetryProducer(r)
    processor = TelemetryProcessor(r)

    # Start a consumer worker in a separate thread
    worker = RedisStreamWorker(r, REDIS_STREAM, REDIS_GROUP, REDIS_CONSUMER_NAME, processor.process_message)
    t = threading.Thread(target=worker.run_forever, daemon=True)
    t.start()

    logger.info("Worker started. Publishing example messages to %s", REDIS_STREAM)

    # Example: simulate producing telemetry messages
    import random
    for i in range(200):
        payload = {
            "timestamp": time.time(),
            "vehicle_id": f"GR86-{random.randint(1,40):03d}",
            "sector": str(random.randint(1,3)),
            "speed": round(random.uniform(60, 180), 2),
            "brake": round(random.uniform(0, 1), 3),
            "throttle": round(random.uniform(0, 1), 3),
        }
        producer.publish(payload)
        time.sleep(0.01)  # simulate 100Hz incoming

    logger.info("Published messages; sleeping to let processor consume")
    time.sleep(5)
    worker.stop()

if __name__ == '__main__':
    main()

