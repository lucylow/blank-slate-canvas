# app/services/anomaly_engine.py

import time
import logging
import numpy as np
from typing import Dict, Any, List, Optional
from collections import defaultdict

# Optional libs - install if you want the advanced detectors
# pip install pyod river tensorflow keras

try:
    from pyod.models.iforest import IForest
    _HAS_PYOD = True
except Exception:
    _HAS_PYOD = False

try:
    # River is good for streaming statistics
    from river import anomaly
    _HAS_RIVER = True
except Exception:
    _HAS_RIVER = False

try:
    from tensorflow.keras.models import load_model
    _HAS_KERAS = True
except Exception:
    _HAS_KERAS = False

logger = logging.getLogger(__name__)


class AnomalyEngine:
    """
    Multi-detector anomaly engine:
      - rule_detector: simple thresholds & derivative checks
      - stream_detector: River/online statistical detectors (z-score / rolling std)
      - window_detector: PyOD on sliding window features (if installed)
      - seq_autoencoder: keras sequence AE for reconstruction (optional)
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.rule_cfg = self.config.get('rules', {})
        self.buffers = defaultdict(dict)  # per vehicle metadata, e.g., last feature arrays

        # instantiate stream detectors if available
        self.stream_models = {}
        if _HAS_RIVER:
            # example: per-channel STD detector using river
            self.stream_models = defaultdict(lambda: anomaly.HalfSpaceTrees(seed=42))

        # window PyOD detector placeholder
        self.window_detector = None
        if _HAS_PYOD and self.config.get('use_pyod_iforest', True):
            try:
                self.window_detector = IForest(contamination=0.01)
                # Note: must fit with historical normal feature windows offline before using real-time
            except Exception as e:
                logger.exception("PyOD IForest init failed: %s", e)
                self.window_detector = None

        # sequence autoencoder (keras) - optional
        self.seq_ae = None
        if _HAS_KERAS and self.config.get('ae_model_path'):
            try:
                self.seq_ae = load_model(self.config['ae_model_path'])
                logger.info("Loaded AE model from %s", self.config['ae_model_path'])
            except Exception as e:
                logger.exception("Failed to load AE model: %s", e)
                self.seq_ae = None

    # ---------- RULE-BASED DETECTION ----------

    def rule_check(self, sample: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Run lightweight deterministic checks:
         - hard thresholds
         - derivative spikes (delta / dt)
         - rising rate (slope) for temps
        """
        # rules config format:
        # rules = { "brake_pressure": {"max": 1200, "dmax": 400}, "tire_temp": {"d_rate_c_per_s": 2.5} }
        alerts = []
        ts = sample.get('ts', time.time())

        for channel, rconf in self.rule_cfg.items():
            if channel not in sample:
                continue

            val = sample[channel]
            if val is None:
                continue

            if 'max' in rconf and val > rconf['max']:
                alerts.append({
                    "type": "threshold_exceed",
                    "channel": channel,
                    "value": val,
                    "threshold": rconf['max'],
                    "severity": "high",
                    "explain": f"{channel} {val} > max {rconf['max']}"
                })

            # derivative check: needs last value stored in buffers
            if 'dmax' in rconf:
                last = self.buffers.get('_last_' + channel)
                if last is not None:
                    # need sample timestamps too
                    dt = max(1e-6, ts - last.get('ts', ts - 1))
                    d = (val - last.get('value', val)) / dt
                    if abs(d) > rconf['dmax']:
                        alerts.append({
                            "type": "derivative_spike",
                            "channel": channel,
                            "value": val,
                            "delta_per_s": d,
                            "threshold": rconf['dmax'],
                            "severity": "high",
                            "explain": f"{channel} delta {d:.2f} > dmax {rconf['dmax']}"
                        })
                # update last
                self.buffers['_last_' + channel] = {'value': val, 'ts': ts}

            # slope-based rate of change for temp
            if 'd_rate_c_per_s' in rconf:
                last = self.buffers.get('_last_' + channel)
                if last is not None:
                    dt = max(1e-6, ts - last.get('ts', ts - 1))
                    rate = (val - last.get('value', val)) / dt
                    if rate > rconf['d_rate_c_per_s']:
                        alerts.append({
                            "type": "temp_rise",
                            "channel": channel,
                            "value": val,
                            "rate": rate,
                            "severity": "medium",
                            "explain": f"{channel} rising {rate:.2f}°/s > {rconf['d_rate_c_per_s']}"
                        })
                self.buffers['_last_' + channel] = {'value': val, 'ts': ts}

        if alerts:
            # choose highest severity alert to return
            return {"detector": "rule", "alerts": alerts, "ts": ts}
        return None

    # ---------- STREAM / ONLINE DETECTION (river) ----------

    def stream_check(self, vehicle_id: str, sample: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not _HAS_RIVER:
            return None

        alerts = []
        ts = sample.get('ts', time.time())

        # River's HalfSpaceTrees etc. expect dict of floats
        for k, v in sample.items():
            if k == 'ts' or k == 'vehicle':
                continue
            try:
                model = self.stream_models[k]
                score = model.score_one({k: float(v)})
                # a threshold can be chosen per feature; here we use a heuristic
                if score > 0.6:
                    alerts.append({"channel": k, "score": score, "explain": f"stream score {score:.3f}"})
                # update model
                model.learn_one({k: float(v)})
            except Exception:
                continue

        if alerts:
            return {"detector": "stream", "alerts": alerts, "ts": ts}
        return None

    # ---------- WINDOWED FEATURE DETECTION (PyOD) ----------

    def window_iforest_check(self, feature_vector: List[float]) -> Optional[Dict[str, Any]]:
        """
        feature_vector should be a 1D array describing a sliding window (e.g. flattened features).
        The PyOD detector must be pre-fit offline on normal data for best results.
        """
        if not self.window_detector:
            return None

        try:
            score = self.window_detector.decision_function(np.array(feature_vector).reshape(1, -1))[0]
            # lower score means more anomalous for some models; PyOD decision_function returns outlier score higher=more abnormal
            if score > self.config.get('pyod_threshold', 0.5):
                return {"detector": "iforest", "score": float(score)}
        except Exception as e:
            logger.exception("PyOD window check failed: %s", e)
        return None

    # ---------- SEQUENCE AUTOENCODER (keras) ----------

    def seq_ae_check(self, window_array: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        window_array shape: (timesteps, features) or (1, timesteps, features) depending on model.
        Returns anomaly if reconstruction error > threshold
        """
        if self.seq_ae is None:
            return None

        try:
            # expand dims to batch
            arr = np.array(window_array)
            if arr.ndim == 2:
                arr = np.expand_dims(arr, 0)

            recon = self.seq_ae.predict(arr, verbose=0)

            # compute mean squared error per sample
            mse = np.mean((arr - recon)**2, axis=(1, 2)) if recon.ndim == 3 else np.mean((arr - recon)**2, axis=(1,))
            score = float(mse[0])

            if score > self.config.get('ae_threshold', 1e-3):
                return {"detector": "seq_ae", "score": score}
        except Exception as e:
            logger.exception("seq AE check failed: %s", e)
        return None

    # ---------- COMPOSITE CALL ----------

    def detect(self, vehicle_id: str, sample: Dict[str, Any], window_features: List[float] = None, seq_window: np.ndarray = None) -> Optional[Dict[str, Any]]:
        """
        Run all detectors. Return a consolidated alert dict or None.

        window_features: flattened features for PyOD
        seq_window: raw (timesteps,features) numpy array for AE
        """
        ts = sample.get('ts', time.time())

        # 1. rules
        rule = self.rule_check(sample)
        if rule:
            # rule alerts are immediate and high priority
            return {"category": "rule", "payload": rule, "ts": ts, "vehicle": vehicle_id}

        # 2. stream detectors
        stream = self.stream_check(vehicle_id, sample)
        if stream:
            return {"category": "stream", "payload": stream, "ts": ts, "vehicle": vehicle_id}

        # 3. windowed PyOD
        if window_features is not None:
            w = self.window_iforest_check(window_features)
            if w:
                return {"category": "iforest", "payload": w, "ts": ts, "vehicle": vehicle_id}

        # 4. sequence ae
        if seq_window is not None:
            s = self.seq_ae_check(seq_window)
            if s:
                return {"category": "seq_ae", "payload": s, "ts": ts, "vehicle": vehicle_id}

        return None

