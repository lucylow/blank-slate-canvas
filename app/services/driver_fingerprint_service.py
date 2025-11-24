"""
Driver Fingerprint Service
Extracts driving style features and creates unique fingerprints for each driver
"""
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
import numpy as np
import pandas as pd
import redis
from uuid import uuid4

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")

try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    redis_client.ping()
except Exception as e:
    logger.warning(f"Redis not available for driver fingerprinting: {e}")
    redis_client = None


class DriverFingerprintService:
    """Service for extracting and managing driver fingerprints"""
    
    def __init__(self):
        self.feature_weights = {
            "braking_consistency": 0.25,
            "throttle_smoothness": 0.20,
            "cornering_style": 0.25,
            "lap_consistency": 0.15,
            "tire_management": 0.15
        }
    
    def extract_features(self, driver_id: str, telemetry_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract features from telemetry data to create driver fingerprint
        
        Args:
            driver_id: Unique driver identifier
            telemetry_data: Dictionary containing telemetry information
            
        Returns:
            Dictionary with extracted features and fingerprint vector
        """
        features = {
            "driver_id": driver_id,
            "session_id": telemetry_data.get("session_id", "unknown"),
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        # Braking characteristics
        features["braking_consistency"] = self._calculate_braking_consistency(telemetry_data)
        features["brake_point_consistency"] = self._calculate_brake_point_consistency(telemetry_data)
        features["brake_pressure_variance"] = self._calculate_brake_pressure_variance(telemetry_data)
        
        # Throttle characteristics
        features["throttle_smoothness"] = self._calculate_throttle_smoothness(telemetry_data)
        features["throttle_application_rate"] = self._calculate_throttle_application_rate(telemetry_data)
        features["coasting_time_ratio"] = self._calculate_coasting_time(telemetry_data)
        
        # Cornering characteristics
        features["cornering_style"] = self._calculate_cornering_style(telemetry_data)
        features["steering_smoothness"] = self._calculate_steering_smoothness(telemetry_data)
        features["apex_consistency"] = self._calculate_apex_consistency(telemetry_data)
        
        # Overall performance
        features["lap_consistency"] = self._calculate_lap_consistency(telemetry_data)
        features["sector_time_variance"] = self._calculate_sector_time_variance(telemetry_data)
        
        # Tire management
        features["tire_stress_index"] = self._calculate_tire_stress_index(telemetry_data)
        features["slip_angle_management"] = self._calculate_slip_angle_management(telemetry_data)
        
        # Calculate overall score
        features["overall_score"] = self._calculate_overall_score(features)
        features["fingerprint_vector"] = self._create_fingerprint_vector(features)
        
        return features
    
    def _calculate_braking_consistency(self, telemetry: Dict) -> float:
        """Calculate braking consistency (0-1, higher is better)"""
        brake_events = telemetry.get("brake_events", [])
        if len(brake_events) < 2:
            return 0.5
        
        # Extract brake distances or pressures
        if isinstance(brake_events[0], dict):
            if "distance_to_corner" in brake_events[0]:
                distances = [e.get("distance_to_corner", 0) for e in brake_events]
            elif "pressure" in brake_events[0]:
                distances = [e.get("pressure", 0) for e in brake_events]
            else:
                return 0.5
        else:
            return 0.5
        
        if not distances:
            return 0.5
        
        mean = np.mean(distances)
        if mean == 0:
            return 0.5
        
        variance = np.var(distances)
        # Convert to consistency score (lower variance = higher consistency)
        consistency = max(0, 1 - (variance / mean) * 10)
        return min(1.0, consistency)
    
    def _calculate_brake_point_consistency(self, telemetry: Dict) -> float:
        """Calculate consistency of brake points"""
        brake_events = telemetry.get("brake_events", [])
        if len(brake_events) < 2:
            return 0.5
        
        # Similar to braking consistency but focused on timing
        if isinstance(brake_events[0], dict) and "distance_to_corner" in brake_events[0]:
            distances = [e.get("distance_to_corner", 0) for e in brake_events]
            if distances:
                cv = np.std(distances) / (np.mean(distances) + 1e-6)  # Coefficient of variation
                return max(0, 1 - cv * 2)
        
        return 0.5
    
    def _calculate_brake_pressure_variance(self, telemetry: Dict) -> float:
        """Calculate brake pressure variance (lower is better)"""
        brake_events = telemetry.get("brake_events", [])
        if len(brake_events) < 2:
            return 0.5
        
        pressures = []
        for event in brake_events:
            if isinstance(event, dict):
                pressure = event.get("pressure", 0)
                if pressure > 0:
                    pressures.append(pressure)
        
        if not pressures:
            return 0.5
        
        variance = np.var(pressures)
        # Normalize: lower variance = better (higher score)
        max_variance = 0.5  # Assume max variance of 0.5
        return max(0, 1 - (variance / max_variance))
    
    def _calculate_throttle_smoothness(self, telemetry: Dict) -> float:
        """Calculate throttle smoothness (0-1, higher is better)"""
        throttle_data = telemetry.get("throttle_data", [])
        if len(throttle_data) < 10:
            return 0.5
        
        # Extract throttle values
        throttle_values = []
        for data in throttle_data:
            if isinstance(data, dict):
                throttle_values.append(data.get("throttle_pct", data.get("throttle", 0)))
            else:
                throttle_values.append(float(data) if isinstance(data, (int, float)) else 0)
        
        if len(throttle_values) < 2:
            return 0.5
        
        # Calculate rate of change
        deltas = [abs(throttle_values[i] - throttle_values[i-1]) 
                 for i in range(1, len(throttle_values))]
        
        if not deltas:
            return 0.5
        
        # Large changes indicate rough throttle
        large_changes = sum(1 for d in deltas if d > 0.3)
        smoothness = max(0, 1 - (large_changes / len(deltas)) * 0.5)
        return min(1.0, smoothness)
    
    def _calculate_throttle_application_rate(self, telemetry: Dict) -> float:
        """Calculate how quickly throttle is applied (0-1)"""
        throttle_data = telemetry.get("throttle_data", [])
        if len(throttle_data) < 5:
            return 0.5
        
        # Look for throttle application after braking
        # This is a simplified version - in practice would analyze corner exit
        throttle_values = []
        for data in throttle_data:
            if isinstance(data, dict):
                throttle_values.append(data.get("throttle_pct", data.get("throttle", 0)))
            else:
                throttle_values.append(float(data) if isinstance(data, (int, float)) else 0)
        
        if not throttle_values:
            return 0.5
        
        # Find rate of throttle increase
        increases = []
        for i in range(1, len(throttle_values)):
            if throttle_values[i] > throttle_values[i-1]:
                increases.append(throttle_values[i] - throttle_values[i-1])
        
        if not increases:
            return 0.5
        
        avg_increase = np.mean(increases)
        # Normalize: faster application = better (higher score)
        return min(1.0, avg_increase * 2)
    
    def _calculate_coasting_time(self, telemetry: Dict) -> float:
        """Calculate ratio of coasting time (lower is better)"""
        throttle_data = telemetry.get("throttle_data", [])
        brake_events = telemetry.get("brake_events", [])
        
        if not throttle_data:
            throttle_values = []
            for data in throttle_data:
                if isinstance(data, dict):
                    throttle_values.append(data.get("throttle_pct", data.get("throttle", 0)))
                else:
                    throttle_values.append(float(data) if isinstance(data, (int, float)) else 0)
            
            if throttle_values:
                # Count low throttle periods (coasting)
                coasting_samples = sum(1 for v in throttle_values if 0 < v < 0.2)
                total_samples = len(throttle_values)
                coasting_ratio = coasting_samples / total_samples if total_samples > 0 else 0
                # Lower coasting = better (higher score)
                return max(0, 1 - coasting_ratio * 2)
        
        return 0.5
    
    def _calculate_cornering_style(self, telemetry: Dict) -> float:
        """Calculate cornering style (0 = conservative, 1 = aggressive)"""
        cornering_events = telemetry.get("cornering_events", [])
        if not cornering_events:
            return 0.5
        
        lateral_g_values = []
        speeds = []
        
        for event in cornering_events:
            if isinstance(event, dict):
                if "max_lateral_g" in event:
                    lateral_g_values.append(event["max_lateral_g"])
                if "entry_speed" in event:
                    speeds.append(event["entry_speed"])
        
        if not lateral_g_values and not speeds:
            return 0.5
        
        score = 0.5
        
        if lateral_g_values:
            avg_lateral_g = np.mean(lateral_g_values)
            # Normalize: 2.5g is considered high
            lateral_score = min(avg_lateral_g / 2.5, 1.0)
            score = lateral_score
        
        if speeds:
            avg_speed = np.mean(speeds)
            # Normalize: 200 km/h is considered high
            speed_score = min(avg_speed / 200, 1.0)
            if score == 0.5:
                score = speed_score
            else:
                score = (score + speed_score) / 2
        
        return score
    
    def _calculate_steering_smoothness(self, telemetry: Dict) -> float:
        """Calculate steering input smoothness"""
        steering_data = telemetry.get("steering_data", [])
        if len(steering_data) < 10:
            return 0.5
        
        angles = []
        for data in steering_data:
            if isinstance(data, dict):
                angles.append(data.get("steering_angle", data.get("angle", 0)))
            else:
                angles.append(float(data) if isinstance(data, (int, float)) else 0)
        
        if len(angles) < 2:
            return 0.5
        
        # Calculate rate of change
        deltas = [abs(angles[i] - angles[i-1]) for i in range(1, len(angles))]
        if not deltas:
            return 0.5
        
        # High variance in steering changes = rough steering
        variance = np.var(deltas)
        smoothness = max(0, 1 - variance / 100)  # Normalize
        return min(1.0, smoothness)
    
    def _calculate_apex_consistency(self, telemetry: Dict) -> float:
        """Calculate consistency of apex points"""
        cornering_events = telemetry.get("cornering_events", [])
        if len(cornering_events) < 2:
            return 0.5
        
        # Extract apex distances or positions
        apex_positions = []
        for event in cornering_events:
            if isinstance(event, dict) and "apex_distance" in event:
                apex_positions.append(event["apex_distance"])
        
        if not apex_positions:
            return 0.5
        
        # Calculate consistency
        cv = np.std(apex_positions) / (np.mean(apex_positions) + 1e-6)
        return max(0, 1 - cv * 2)
    
    def _calculate_lap_consistency(self, telemetry: Dict) -> float:
        """Calculate lap time consistency"""
        lap_times = telemetry.get("lap_times", [])
        if len(lap_times) < 3:
            return 0.5
        
        # Ensure lap_times are numeric
        times = [float(t) for t in lap_times if isinstance(t, (int, float, str))]
        if not times:
            return 0.5
        
        mean = np.mean(times)
        if mean == 0:
            return 0.5
        
        std_dev = np.std(times)
        # Convert to consistency score
        cv = std_dev / mean  # Coefficient of variation
        consistency = max(0, 1 - cv * 5)  # Scale factor
        return min(1.0, consistency)
    
    def _calculate_sector_time_variance(self, telemetry: Dict) -> float:
        """Calculate variance in sector times"""
        sector_data = telemetry.get("sector_data", [])
        if not sector_data:
            return 0.5
        
        sector_times = []
        for sector in sector_data:
            if isinstance(sector, dict):
                time = sector.get("sector_time", sector.get("time", 0))
                if time > 0:
                    sector_times.append(time)
        
        if len(sector_times) < 2:
            return 0.5
        
        cv = np.std(sector_times) / (np.mean(sector_times) + 1e-6)
        return max(0, 1 - cv * 3)
    
    def _calculate_tire_stress_index(self, telemetry: Dict) -> float:
        """Calculate tire stress index (0-1, lower is better for tire life)"""
        sector_data = telemetry.get("sector_data", [])
        if not sector_data:
            return 0.5
        
        stress_values = []
        for sector in sector_data:
            if isinstance(sector, dict):
                stress = sector.get("tire_stress", sector.get("stress", 0))
                if stress > 0:
                    stress_values.append(stress)
        
        if not stress_values:
            return 0.5
        
        avg_stress = np.mean(stress_values)
        # Normalize (assuming 200000 is high stress)
        stress_index = min(avg_stress / 200000, 1.0)
        return stress_index
    
    def _calculate_slip_angle_management(self, telemetry: Dict) -> float:
        """Calculate slip angle management (lower slip = better)"""
        cornering_events = telemetry.get("cornering_events", [])
        if not cornering_events:
            return 0.5
        
        slip_angles = []
        for event in cornering_events:
            if isinstance(event, dict) and "slip_angle" in event:
                slip_angles.append(abs(event["slip_angle"]))
        
        if not slip_angles:
            return 0.5
        
        avg_slip = np.mean(slip_angles)
        # Lower slip = better (higher score)
        # Assuming 5 degrees is high slip
        return max(0, 1 - (avg_slip / 5))
    
    def _calculate_overall_score(self, features: Dict) -> float:
        """Calculate overall performance score"""
        score = 0.0
        total_weight = 0.0
        
        for feature_name, weight in self.feature_weights.items():
            if feature_name in features:
                value = features[feature_name]
                if isinstance(value, (int, float)):
                    score += value * weight
                    total_weight += weight
        
        # Normalize by total weight
        if total_weight > 0:
            score = score / total_weight
        
        return min(1.0, max(0.0, score))
    
    def _create_fingerprint_vector(self, features: Dict) -> List[float]:
        """Create normalized fingerprint vector"""
        return [
            features.get("braking_consistency", 0.5),
            features.get("throttle_smoothness", 0.5),
            features.get("cornering_style", 0.5),
            features.get("lap_consistency", 0.5),
            features.get("tire_stress_index", 0.5)
        ]
    
    async def store_fingerprint(self, driver_id: str, features: Dict) -> Dict:
        """Store fingerprint in Redis"""
        fingerprint_id = f"fingerprint:{driver_id}:{uuid4()}"
        fingerprint_data = {
            "id": fingerprint_id,
            "driver_id": driver_id,
            "features": json.dumps(features),
            "created_at": datetime.utcnow().isoformat(),
            "session_type": features.get("session_type", "practice")
        }
        
        if redis_client:
            try:
                # Store fingerprint hash
                redis_client.hset(fingerprint_id, mapping=fingerprint_data)
                # Add to sorted set for driver
                redis_client.zadd(f"driver:{driver_id}:fingerprints", {fingerprint_id: int(datetime.utcnow().timestamp() * 1000)})
                # Set expiration (7 days)
                redis_client.expire(fingerprint_id, 86400 * 7)
            except Exception as e:
                logger.error(f"Error storing fingerprint in Redis: {e}")
        
        return fingerprint_data
    
    async def get_current_fingerprint(self, driver_id: str) -> Optional[Dict]:
        """Get driver's most recent fingerprint"""
        if not redis_client:
            return None
        
        try:
            # Get latest fingerprint ID
            latest_ids = redis_client.zrevrange(f"driver:{driver_id}:fingerprints", 0, 0)
            if not latest_ids:
                return None
            
            fingerprint_id = latest_ids[0]
            data = redis_client.hgetall(fingerprint_id)
            
            if data and "features" in data:
                data["features"] = json.loads(data["features"])
            
            return data
        except Exception as e:
            logger.error(f"Error getting fingerprint: {e}")
            return None
    
    async def compare_with_baseline(self, driver_id: str, current_features: Dict) -> Dict:
        """Compare current features with baseline fingerprint"""
        baseline = await self.get_baseline_fingerprint(driver_id)
        if not baseline:
            return {"deviation": 0, "changes": []}
        
        baseline_features = baseline.get("features", {})
        if isinstance(baseline_features, str):
            baseline_features = json.loads(baseline_features)
        
        changes = []
        total_deviation = 0.0
        feature_count = 0
        
        for feature_name, current_value in current_features.items():
            if isinstance(current_value, (int, float)) and feature_name in baseline_features:
                baseline_value = baseline_features[feature_name]
                if isinstance(baseline_value, (int, float)):
                    deviation = abs(current_value - baseline_value)
                    total_deviation += deviation
                    feature_count += 1
                    
                    if deviation > 0.1:  # Significant change
                        changes.append({
                            "feature": feature_name,
                            "current": current_value,
                            "baseline": baseline_value,
                            "deviation": deviation,
                            "trend": "increased" if current_value > baseline_value else "decreased"
                        })
        
        avg_deviation = total_deviation / feature_count if feature_count > 0 else 0
        
        return {
            "deviation": avg_deviation,
            "changes": sorted(changes, key=lambda x: x["deviation"], reverse=True)
        }
    
    async def get_baseline_fingerprint(self, driver_id: str) -> Optional[Dict]:
        """Get baseline fingerprint (currently uses most recent as baseline)"""
        return await self.get_current_fingerprint(driver_id)


# Global instance
driver_fingerprint_service = DriverFingerprintService()



