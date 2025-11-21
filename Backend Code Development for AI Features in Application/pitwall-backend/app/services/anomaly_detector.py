"""
Real-Time Telemetry Anomaly Detection Service
Uses PyOD's Isolation Forest for fast, unsupervised anomaly detection
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from collections import deque
import logging
from datetime import datetime

try:
    from pyod.models.iforest import IForest
    from pyod.models.lof import LOF
    PYOD_AVAILABLE = True
except ImportError:
    PYOD_AVAILABLE = False
    logging.warning("PyOD not available. Install with: pip install pyod")

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """
    Real-time anomaly detector for racing telemetry data.
    
    Uses Isolation Forest for fast, unsupervised detection of anomalies
    in multivariate telemetry streams (brake pressure, G-forces, tire temps, etc.)
    """
    
    def __init__(
        self,
        window_size: int = 100,
        contamination: float = 0.1,
        n_estimators: int = 100,
        random_state: int = 42
    ):
        """
        Initialize anomaly detector
        
        Args:
            window_size: Number of recent samples to keep in sliding window
            contamination: Expected proportion of anomalies (0.0 to 0.5)
            n_estimators: Number of trees in Isolation Forest
            random_state: Random seed for reproducibility
        """
        if not PYOD_AVAILABLE:
            raise ImportError("PyOD is required. Install with: pip install pyod")
        
        self.window_size = window_size
        self.contamination = contamination
        self.n_estimators = n_estimators
        self.random_state = random_state
        
        # Sliding window buffers per vehicle
        self.windows: Dict[str, deque] = {}
        
        # Trained models per vehicle
        self.models: Dict[str, IForest] = {}
        
        # Feature columns to monitor
        self.feature_columns = [
            'pbrake_f', 'pbrake_r',  # Brake pressure
            'accx_can', 'accy_can',  # G-forces
            'aps',  # Accelerator pedal position
            'Speed',  # Vehicle speed
            'nmot',  # Engine RPM
            'Steering_Angle',  # Steering angle
        ]
        
        # Threshold-based rules for critical alerts
        self.critical_thresholds = {
            'pbrake_f': {'max': 150.0, 'min': 0.0},  # Brake pressure (psi)
            'pbrake_r': {'max': 150.0, 'min': 0.0},
            'accx_can': {'max': 2.0, 'min': -2.0},  # G-forces
            'accy_can': {'max': 2.0, 'min': -2.0},
            'Speed': {'max': 200.0, 'min': 0.0},  # Speed (mph)
            'nmot': {'max': 8000.0, 'min': 0.0},  # RPM
        }
        
        logger.info(f"AnomalyDetector initialized with window_size={window_size}, contamination={contamination}")
    
    def _get_features(self, df: pd.DataFrame) -> Optional[pd.DataFrame]:
        """Extract feature columns from telemetry dataframe"""
        available_features = [col for col in self.feature_columns if col in df.columns]
        
        if not available_features:
            return None
        
        # Select only numeric features and drop NaN
        features = df[available_features].select_dtypes(include=[np.number])
        features = features.dropna()
        
        if features.empty:
            return None
        
        return features
    
    def _check_critical_thresholds(self, point: Dict) -> List[Dict]:
        """
        Check for critical threshold violations (rule-based alerts)
        Returns list of critical alerts
        """
        alerts = []
        
        for sensor, thresholds in self.critical_thresholds.items():
            if sensor not in point:
                continue
            
            value = point[sensor]
            if value is None or pd.isna(value):
                continue
            
            # Check max threshold
            if 'max' in thresholds and value > thresholds['max']:
                alerts.append({
                    'type': 'critical',
                    'sensor': sensor,
                    'value': float(value),
                    'threshold': thresholds['max'],
                    'message': f"{sensor} exceeded maximum threshold: {value:.2f} > {thresholds['max']:.2f}",
                    'severity': 'high'
                })
            
            # Check min threshold
            if 'min' in thresholds and value < thresholds['min']:
                alerts.append({
                    'type': 'critical',
                    'sensor': sensor,
                    'value': float(value),
                    'threshold': thresholds['min'],
                    'message': f"{sensor} below minimum threshold: {value:.2f} < {thresholds['min']:.2f}",
                    'severity': 'high'
                })
        
        return alerts
    
    def _calculate_rate_of_change(self, window: deque, sensor: str) -> Optional[float]:
        """Calculate rate of change for a sensor (detect sudden spikes)"""
        if len(window) < 2:
            return None
        
        values = [point.get(sensor) for point in window if sensor in point and point[sensor] is not None]
        if len(values) < 2:
            return None
        
        # Calculate rate of change (difference between last two values)
        rate = abs(values[-1] - values[-2])
        return rate
    
    def _check_rate_of_change_alerts(self, window: deque, point: Dict) -> List[Dict]:
        """
        Check for sudden rate-of-change anomalies (e.g., brake spike, temp drift)
        """
        alerts = []
        
        # Rate-of-change thresholds (per sample)
        roc_thresholds = {
            'pbrake_f': 50.0,  # Brake pressure spike (psi per sample)
            'pbrake_r': 50.0,
            'accx_can': 1.0,  # Sudden G-force change
            'accy_can': 1.0,
        }
        
        for sensor, threshold in roc_thresholds.items():
            if sensor not in point:
                continue
            
            rate = self._calculate_rate_of_change(window, sensor)
            if rate is not None and rate > threshold:
                alerts.append({
                    'type': 'rate_of_change',
                    'sensor': sensor,
                    'rate': float(rate),
                    'threshold': threshold,
                    'message': f"Sudden {sensor} change detected: {rate:.2f} > {threshold:.2f}",
                    'severity': 'medium'
                })
        
        return alerts
    
    def _update_window(self, vehicle_id: str, point: Dict):
        """Update sliding window for a vehicle"""
        if vehicle_id not in self.windows:
            self.windows[vehicle_id] = deque(maxlen=self.window_size)
        
        self.windows[vehicle_id].append(point)
    
    def _train_model(self, vehicle_id: str) -> bool:
        """Train Isolation Forest model on current window"""
        if vehicle_id not in self.windows:
            return False
        
        window = self.windows[vehicle_id]
        if len(window) < 50:  # Need minimum samples to train
            return False
        
        # Convert window to DataFrame
        df = pd.DataFrame(list(window))
        features = self._get_features(df)
        
        if features is None or len(features) < 50:
            return False
        
        try:
            # Train Isolation Forest
            model = IForest(
                contamination=self.contamination,
                n_estimators=self.n_estimators,
                random_state=self.random_state,
                n_jobs=-1  # Use all CPU cores
            )
            model.fit(features.values)
            
            self.models[vehicle_id] = model
            logger.debug(f"Trained anomaly model for vehicle {vehicle_id} on {len(features)} samples")
            return True
        except Exception as e:
            logger.error(f"Error training model for {vehicle_id}: {e}")
            return False
    
    def _detect_anomaly(self, vehicle_id: str, point: Dict) -> Tuple[bool, float, Optional[List[str]]]:
        """
        Detect if a point is anomalous using trained model
        
        Returns:
            (is_anomaly, anomaly_score, contributing_features)
        """
        if vehicle_id not in self.models:
            return False, 0.0, None
        
        # Extract features from point
        feature_values = []
        feature_names = []
        
        for col in self.feature_columns:
            if col in point and point[col] is not None:
                try:
                    val = float(point[col])
                    if not pd.isna(val):
                        feature_values.append(val)
                        feature_names.append(col)
                except (ValueError, TypeError):
                    pass
        
        if len(feature_values) < 3:  # Need minimum features
            return False, 0.0, None
        
        # Pad with zeros if needed (model expects fixed feature count)
        model = self.models[vehicle_id]
        expected_features = len(self.feature_columns)
        
        if len(feature_values) < expected_features:
            # Create full feature vector
            full_features = []
            for col in self.feature_columns:
                if col in point and point[col] is not None:
                    try:
                        full_features.append(float(point[col]))
                    except (ValueError, TypeError):
                        full_features.append(0.0)
                else:
                    full_features.append(0.0)
            feature_values = full_features
        
        try:
            # Get anomaly score (higher = more anomalous)
            X = np.array([feature_values[:expected_features]])
            anomaly_score = model.decision_function(X)[0]
            is_anomaly = model.predict(X)[0] == 1
            
            # Normalize score to 0-1 range (for display)
            # Isolation Forest scores are typically negative for normal, positive for anomalies
            normalized_score = max(0.0, min(1.0, (anomaly_score + 0.5) / 1.0))
            
            # Identify contributing features (features with highest deviation)
            if is_anomaly:
                # Get feature importance (simplified: use feature values that are far from median)
                window = self.windows.get(vehicle_id, deque())
                if len(window) > 10:
                    window_df = pd.DataFrame(list(window))
                    medians = window_df[self.feature_columns].median()
                    
                    deviations = []
                    for i, col in enumerate(self.feature_columns):
                        if i < len(feature_values):
                            val = feature_values[i]
                            median = medians.get(col, 0.0)
                            deviation = abs(val - median)
                            deviations.append((col, deviation))
                    
                    # Sort by deviation and get top 3
                    deviations.sort(key=lambda x: x[1], reverse=True)
                    contributing = [col for col, _ in deviations[:3]]
                else:
                    contributing = feature_names[:3] if len(feature_names) >= 3 else feature_names
            else:
                contributing = None
            
            return is_anomaly, normalized_score, contributing
            
        except Exception as e:
            logger.error(f"Error detecting anomaly for {vehicle_id}: {e}")
            return False, 0.0, None
    
    def detect(
        self,
        vehicle_id: str,
        telemetry_point: Dict,
        retrain_interval: int = 200
    ) -> Dict:
        """
        Detect anomalies in a single telemetry point
        
        Args:
            vehicle_id: Vehicle identifier
            telemetry_point: Dictionary with telemetry values
            retrain_interval: Retrain model every N samples
        
        Returns:
            Dictionary with anomaly detection results
        """
        # Update sliding window
        self._update_window(vehicle_id, telemetry_point)
        
        # Check critical thresholds first (fastest, most important)
        critical_alerts = self._check_critical_thresholds(telemetry_point)
        
        # Check rate of change
        window = self.windows.get(vehicle_id, deque())
        roc_alerts = self._check_rate_of_change_alerts(window, telemetry_point)
        
        # Train model if needed
        window_size = len(self.windows.get(vehicle_id, deque()))
        if window_size % retrain_interval == 0 and window_size >= 50:
            self._train_model(vehicle_id)
        
        # Detect using ML model
        is_anomaly, anomaly_score, contributing_features = self._detect_anomaly(vehicle_id, telemetry_point)
        
        # Combine all alerts
        all_alerts = critical_alerts + roc_alerts
        
        if is_anomaly:
            all_alerts.append({
                'type': 'ml_detected',
                'sensor': 'multivariate',
                'score': float(anomaly_score),
                'contributing_features': contributing_features or [],
                'message': f"Anomaly detected (score: {anomaly_score:.2f})" + 
                          (f" - Top features: {', '.join(contributing_features or [])}" if contributing_features else ""),
                'severity': 'medium' if anomaly_score < 0.7 else 'high'
            })
        
        result = {
            'is_anomaly': len(all_alerts) > 0 or is_anomaly,
            'anomaly_score': float(anomaly_score),
            'alerts': all_alerts,
            'timestamp': telemetry_point.get('timestamp', datetime.utcnow().isoformat()),
            'vehicle_id': vehicle_id,
            'vehicle_number': telemetry_point.get('vehicle_number'),
            'lap': telemetry_point.get('lap'),
        }
        
        return result
    
    def detect_batch(
        self,
        vehicle_id: str,
        telemetry_df: pd.DataFrame,
        retrain: bool = True
    ) -> pd.DataFrame:
        """
        Detect anomalies in a batch of telemetry data
        
        Args:
            vehicle_id: Vehicle identifier
            telemetry_df: DataFrame with telemetry data
            retrain: Whether to retrain model before detection
        
        Returns:
            DataFrame with anomaly detection results added
        """
        if telemetry_df.empty:
            return telemetry_df
        
        # Train model on full dataset if requested
        if retrain:
            # Convert to window format
            for _, row in telemetry_df.iterrows():
                point = row.to_dict()
                self._update_window(vehicle_id, point)
            
            self._train_model(vehicle_id)
        
        # Detect anomalies for each point
        results = []
        for _, row in telemetry_df.iterrows():
            point = row.to_dict()
            result = self.detect(vehicle_id, point, retrain_interval=999999)  # Don't retrain during batch
            results.append(result)
        
        # Add results to dataframe
        result_df = telemetry_df.copy()
        result_df['is_anomaly'] = [r['is_anomaly'] for r in results]
        result_df['anomaly_score'] = [r['anomaly_score'] for r in results]
        result_df['alert_count'] = [len(r['alerts']) for r in results]
        
        return result_df


# Global instance
anomaly_detector = AnomalyDetector()

