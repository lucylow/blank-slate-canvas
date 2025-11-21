"""
Anomaly detection engine for real-time telemetry analysis
"""
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from collections import deque
import numpy as np

from app.utils.ring_buffer import RingBuffer
from app.config import AE_THRESHOLD, DEMO_MODE, DATA_DEMO_SLICES_DIR
from app.observability.prom_metrics import anomaly_counter, inference_latency
import time

logger = logging.getLogger(__name__)

class AnomalyEngine:
    """Real-time anomaly detection engine"""
    
    def __init__(self, buffer_size: int = 100, window_size: int = 20):
        """
        Initialize anomaly engine
        
        Args:
            buffer_size: Size of ring buffer for telemetry history
            window_size: Window size for sliding window analysis
        """
        self.buffer_size = buffer_size
        self.window_size = window_size
        self.buffers: Dict[str, RingBuffer] = {}
        self.rules = self._load_anomaly_rules()
        
    def _load_anomaly_rules(self) -> Dict[str, Any]:
        """Load anomaly detection rules from config"""
        try:
            from pathlib import Path
            rules_path = Path(__file__).parent.parent.parent / "config" / "anomaly_rules.json"
            if rules_path.exists():
                with open(rules_path) as f:
                    return json.load(f)
            except Exception as e:
            logger.warning(f"Could not load anomaly rules: {e}")
        
        # Default rules
        return {
            "speed_anomaly": {
                "threshold": 180,  # mph
                "severity": "high"
            },
            "brake_pressure_anomaly": {
                "threshold": 150,  # psi
                "severity": "medium"
            },
            "acceleration_anomaly": {
                "threshold": 3.0,  # G
                "severity": "high"
            },
            "tire_temp_anomaly": {
                "min": 50,  # C
                "max": 180,  # C
                "severity": "medium"
            }
        }
    
    def get_buffer(self, vehicle_id: str) -> RingBuffer:
        """Get or create ring buffer for vehicle"""
        if vehicle_id not in self.buffers:
            self.buffers[vehicle_id] = RingBuffer(self.buffer_size)
        return self.buffers[vehicle_id]
    
    def process_frame(self, vehicle_id: str, frame: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Process a telemetry frame and detect anomalies
        
        Args:
            vehicle_id: Vehicle identifier
            frame: Telemetry frame data
            
        Returns:
            Anomaly alert dict if anomaly detected, None otherwise
        """
        start_time = time.time()
        
        try:
            # Add frame to buffer
            buffer = self.get_buffer(vehicle_id)
            buffer.append(frame)
            
            # Extract features for detection
            features = self._extract_features(frame, buffer)
            
            # Run anomaly detection
            anomaly = self._detect_anomaly(vehicle_id, features, frame)
            
            # Measure latency
            latency_ms = (time.time() - start_time) * 1000
            inference_latency.observe(latency_ms)
            
            if anomaly:
                # Increment counter
                severity = anomaly.get("severity", "medium")
                anomaly_counter.labels(
                    detector=anomaly.get("type", "unknown"),
                    vehicle_id=vehicle_id,
                    severity=severity
                ).inc()
                
                logger.info(
                    f"Anomaly detected for {vehicle_id}",
                    extra={
                        "vehicle_id": vehicle_id,
                        "anomaly_type": anomaly.get("type"),
                        "severity": severity
                    }
                )
                
                return anomaly
            
            return None

        except Exception as e:
            logger.error(f"Error processing frame for {vehicle_id}: {e}", exc_info=True)
            return None

    def _extract_features(self, frame: Dict[str, Any], buffer: RingBuffer) -> Dict[str, float]:
        """Extract features from telemetry frame"""
        features = {}
        
        # Extract common telemetry values
        telemetry_map = {
            "speed": ["speed", "velocity", "v"],
            "brake_pressure": ["brake_pressure", "brake", "brake_pedal"],
            "accx": ["accx", "acceleration_x", "acc_x"],
            "accy": ["accy", "acceleration_y", "acc_y"],
            "tire_temp": ["tire_temp", "tire_temperature", "temp"],
        }
        
        # Get value from frame (check telemetry_name if present)
        if "telemetry_name" in frame and "telemetry_value" in frame:
            name = frame["telemetry_name"]
            value = frame["telemetry_value"]
            # Map common names
            if "speed" in name.lower():
                features["speed"] = value
            elif "brake" in name.lower():
                features["brake_pressure"] = value
            elif "accx" in name.lower() or "acc_x" in name.lower():
                features["accx"] = value
            elif "accy" in name.lower() or "acc_y" in name.lower():
                features["accy"] = value
            elif "temp" in name.lower() or "tire" in name.lower():
                features["tire_temp"] = value
        else:
            # Direct field access
            for key, aliases in telemetry_map.items():
                for alias in aliases:
                    if alias in frame:
                        features[key] = float(frame[alias])
                        break
        
            # Calculate derived features from buffer
            recent = buffer.tail(self.window_size) if hasattr(buffer, 'tail') else list(buffer.get_recent(self.window_size) if hasattr(buffer, 'get_recent') else [])
        if len(recent) > 5:
            speeds = [f.get("speed", f.get("telemetry_value", 0)) for f in recent 
                     if "speed" in str(f.get("telemetry_name", "")).lower() or "speed" in f]
            if speeds:
                features["avg_speed"] = np.mean([s for s in speeds if isinstance(s, (int, float))])
                features["speed_variance"] = np.var([s for s in speeds if isinstance(s, (int, float))])
        
        return features
    
    def _detect_anomaly(
        self, 
        vehicle_id: str, 
        features: Dict[str, float], 
        frame: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Detect anomalies using rules-based approach"""
        
        anomalies = []
        
        # Speed anomaly
        if "speed" in features:
            speed = features["speed"]
            threshold = self.rules.get("speed_anomaly", {}).get("threshold", 180)
            if speed > threshold:
                anomalies.append({
                    "type": "speed_anomaly",
                    "severity": self.rules.get("speed_anomaly", {}).get("severity", "high"),
                    "value": speed,
                    "threshold": threshold,
                    "explain": f"Speed {speed:.1f} exceeds threshold {threshold}",
                    "confidence": 0.9
                })
        
        # Brake pressure anomaly
        if "brake_pressure" in features:
            brake = features["brake_pressure"]
            threshold = self.rules.get("brake_pressure_anomaly", {}).get("threshold", 150)
            if brake > threshold:
                anomalies.append({
                    "type": "brake_pressure_anomaly",
                    "severity": self.rules.get("brake_pressure_anomaly", {}).get("severity", "medium"),
                    "value": brake,
                    "threshold": threshold,
                    "explain": f"Brake pressure {brake:.1f} exceeds threshold {threshold}",
                    "confidence": 0.85
                })
        
        # Acceleration anomaly
        if "accx" in features and "accy" in features:
            acc_mag = np.sqrt(features["accx"]**2 + features["accy"]**2)
            threshold = self.rules.get("acceleration_anomaly", {}).get("threshold", 3.0)
            if acc_mag > threshold:
                anomalies.append({
                    "type": "acceleration_anomaly",
                    "severity": self.rules.get("acceleration_anomaly", {}).get("severity", "high"),
                    "value": acc_mag,
                    "threshold": threshold,
                    "explain": f"Acceleration magnitude {acc_mag:.2f}G exceeds threshold {threshold}G",
                    "confidence": 0.88
                })
        
        # Tire temperature anomaly
        if "tire_temp" in features:
            temp = features["tire_temp"]
            min_temp = self.rules.get("tire_temp_anomaly", {}).get("min", 50)
            max_temp = self.rules.get("tire_temp_anomaly", {}).get("max", 180)
            if temp < min_temp or temp > max_temp:
                anomalies.append({
                    "type": "tire_temp_anomaly",
                    "severity": self.rules.get("tire_temp_anomaly", {}).get("severity", "medium"),
                    "value": temp,
                    "threshold": f"{min_temp}-{max_temp}",
                    "explain": f"Tire temperature {temp:.1f}°C outside normal range",
                    "confidence": 0.75
                })
        
        # Return most severe anomaly
        if anomalies:
            # Sort by severity (high > medium > low)
            severity_order = {"high": 3, "medium": 2, "low": 1}
            anomalies.sort(key=lambda x: severity_order.get(x["severity"], 0), reverse=True)
            top_anomaly = anomalies[0]
            
            # Build alert
            alert = {
                "type": top_anomaly["type"],
                "vehicle": vehicle_id,
                "timestamp": frame.get("timestamp", datetime.utcnow().isoformat() + "Z"),
                "severity": top_anomaly["severity"],
                "top_features": list(features.keys())[:5],
                "explain": top_anomaly["explain"],
                "confidence": top_anomaly["confidence"]
            }
            
            return alert

        return None

# Global instance
_anomaly_engine: Optional[AnomalyEngine] = None

def get_anomaly_engine() -> AnomalyEngine:
    """Get global anomaly engine instance"""
    global _anomaly_engine
    if _anomaly_engine is None:
        _anomaly_engine = AnomalyEngine()
    return _anomaly_engine
