"""
Coaching Alert Service
Generates actionable coaching alerts based on driver fingerprint analysis
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)


class CoachingAlertService:
    """Service for generating coaching alerts and personalized coaching plans"""
    
    def __init__(self):
        self.alert_templates = {
            "braking": {
                "early_brake_release": {
                    "threshold": 0.7,
                    "message": "Consider releasing brakes 0.1s later for better corner entry speed",
                    "priority": "medium",
                    "improvement_area": "braking_technique"
                },
                "inconsistent_brake_points": {
                    "threshold": 0.6,
                    "message": "Braking points varying by ±5m - focus on consistent reference points",
                    "priority": "high",
                    "improvement_area": "consistency"
                },
                "excessive_brake_pressure": {
                    "threshold": 0.8,
                    "message": "High brake pressure variance - practice smoother brake modulation",
                    "priority": "medium",
                    "improvement_area": "brake_control"
                }
            },
            "throttle": {
                "rough_throttle_application": {
                    "threshold": 0.6,
                    "message": "Throttle application too abrupt - focus on smooth progressive input",
                    "priority": "medium",
                    "improvement_area": "throttle_control"
                },
                "late_throttle_pickup": {
                    "threshold": 0.7,
                    "message": "Delayed throttle application on corner exit - aim for earlier pickup",
                    "priority": "high",
                    "improvement_area": "corner_exit"
                },
                "excessive_coasting": {
                    "threshold": 0.5,
                    "message": "Too much coasting between brake and throttle - reduce transition time",
                    "priority": "low",
                    "improvement_area": "momentum"
                }
            },
            "cornering": {
                "aggressive_cornering": {
                    "threshold": 0.8,
                    "message": "High lateral loads affecting tire life - smooth cornering inputs",
                    "priority": "medium",
                    "improvement_area": "tire_management"
                },
                "inconsistent_apex": {
                    "threshold": 0.6,
                    "message": "Apex points varying - focus on consistent turn-in points",
                    "priority": "high",
                    "improvement_area": "racing_line"
                },
                "rough_steering": {
                    "threshold": 0.7,
                    "message": "Steering inputs too aggressive - practice smoother wheel control",
                    "priority": "medium",
                    "improvement_area": "steering_technique"
                }
            },
            "consistency": {
                "lap_time_variance": {
                    "threshold": 0.5,
                    "message": "Lap times varying by >1% - focus on consistent pace",
                    "priority": "high",
                    "improvement_area": "pace_consistency"
                },
                "sector_time_instability": {
                    "threshold": 0.6,
                    "message": "Sector times inconsistent - identify variable sectors",
                    "priority": "medium",
                    "improvement_area": "sector_consistency"
                }
            },
            "tires": {
                "high_tire_stress": {
                    "threshold": 0.75,
                    "message": "Tire stress 20% above optimal - adjust driving style for tire conservation",
                    "priority": "high",
                    "improvement_area": "tire_management"
                },
                "excessive_slip_angles": {
                    "threshold": 0.7,
                    "message": "High slip angles detected - reduce sliding for better tire life",
                    "priority": "medium",
                    "improvement_area": "car_control"
                }
            }
        }
    
    def generate_coaching_alerts(self, fingerprint: Dict, comparison: Dict) -> List[Dict]:
        """
        Generate coaching alerts based on fingerprint and comparison
        
        Args:
            fingerprint: Driver fingerprint with features
            comparison: Comparison result with baseline
            
        Returns:
            List of coaching alerts
        """
        alerts = []
        features = fingerprint.get("features", {})
        
        # Check each feature against thresholds
        for category, templates in self.alert_templates.items():
            for alert_type, config in templates.items():
                feature_name = self._get_feature_for_alert(alert_type)
                feature_value = features.get(feature_name)
                
                if feature_value is not None and isinstance(feature_value, (int, float)):
                    if feature_value < config["threshold"]:
                        alerts.append({
                            "id": f"alert_{int(datetime.utcnow().timestamp() * 1000)}_{alert_type}",
                            "type": alert_type,
                            "category": category,
                            "message": config["message"],
                            "priority": config["priority"],
                            "improvement_area": config["improvement_area"],
                            "feature_value": feature_value,
                            "threshold": config["threshold"],
                            "driver_id": fingerprint.get("driver_id"),
                            "timestamp": datetime.utcnow().isoformat(),
                            "confidence": self._calculate_alert_confidence(feature_value, config["threshold"])
                        })
        
        # Add deviation-based alerts
        deviation = comparison.get("deviation", 0)
        if deviation > 0.15:
            alerts.append({
                "id": f"alert_{int(datetime.utcnow().timestamp() * 1000)}_style_deviation",
                "type": "driving_style_change",
                "category": "consistency",
                "message": f"Significant driving style change detected ({deviation * 100:.1f}% deviation from baseline)",
                "priority": "medium",
                "improvement_area": "consistency",
                "deviation": deviation,
                "timestamp": datetime.utcnow().isoformat()
            })
        
        # Sort by priority
        priority_weights = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        alerts.sort(key=lambda a: priority_weights.get(a.get("priority", "low"), 1), reverse=True)
        
        return alerts
    
    def _get_feature_for_alert(self, alert_type: str) -> str:
        """Map alert type to feature name"""
        feature_map = {
            "early_brake_release": "braking_consistency",
            "inconsistent_brake_points": "brake_point_consistency",
            "excessive_brake_pressure": "brake_pressure_variance",
            "rough_throttle_application": "throttle_smoothness",
            "late_throttle_pickup": "throttle_application_rate",
            "excessive_coasting": "coasting_time_ratio",
            "aggressive_cornering": "cornering_style",
            "inconsistent_apex": "apex_consistency",
            "rough_steering": "steering_smoothness",
            "lap_time_variance": "lap_consistency",
            "sector_time_instability": "sector_time_variance",
            "high_tire_stress": "tire_stress_index",
            "excessive_slip_angles": "slip_angle_management"
        }
        return feature_map.get(alert_type, alert_type)
    
    def _calculate_alert_confidence(self, feature_value: float, threshold: float) -> float:
        """Calculate confidence score for alert"""
        distance_from_threshold = threshold - feature_value
        return min(1.0, max(0.0, distance_from_threshold * 2))
    
    def generate_coaching_plan(self, driver_id: str, alerts: List[Dict], fingerprint: Dict) -> Dict:
        """
        Generate personalized coaching plan
        
        Args:
            driver_id: Driver identifier
            alerts: List of coaching alerts
            fingerprint: Driver fingerprint
            
        Returns:
            Coaching plan dictionary
        """
        improvement_areas = list(set([alert.get("improvement_area") for alert in alerts if alert.get("improvement_area")]))
        
        features = fingerprint.get("features", {})
        overall_score = features.get("overall_score", 0.5)
        
        plan = {
            "driver_id": driver_id,
            "generated_at": datetime.utcnow().isoformat(),
            "overall_score": overall_score,
            "priority_areas": improvement_areas[:3],  # Top 3 areas
            "weekly_focus": self._get_weekly_focus(improvement_areas),
            "specific_drills": self._get_specific_drills(alerts),
            "progress_metrics": self._get_progress_metrics(features)
        }
        
        return plan
    
    def _get_weekly_focus(self, improvement_areas: List[str]) -> List[str]:
        """Get weekly focus areas"""
        focus_map = {
            "braking_technique": "Brake marker consistency and pressure control",
            "throttle_control": "Smooth application and progressive inputs",
            "corner_exit": "Early throttle pickup and traction management",
            "racing_line": "Apex consistency and turn-in points",
            "tire_management": "Smooth inputs and load management",
            "pace_consistency": "Lap time stability and sector management",
            "consistency": "Reference point consistency across all sectors",
            "brake_control": "Progressive brake pressure application",
            "momentum": "Minimize coasting and maintain speed",
            "steering_technique": "Smooth steering inputs and wheel control",
            "car_control": "Slip angle management and traction"
        }
        
        return [focus_map.get(area, area.replace("_", " ").title()) for area in improvement_areas[:2]]
    
    def _get_specific_drills(self, alerts: List[Dict]) -> List[str]:
        """Get specific practice drills"""
        drill_map = {
            "braking_technique": [
                "Practice brake release timing at 50m, 100m markers",
                "Focus on consistent pressure application"
            ],
            "throttle_control": [
                "Throttle application drills with progressive inputs",
                "Coast-to-throttle transition practice"
            ],
            "corner_exit": [
                "Early throttle application exercises",
                "Traction management on corner exit"
            ],
            "racing_line": [
                "Apex consistency drills",
                "Turn-in point practice"
            ],
            "tire_management": [
                "Smooth input exercises",
                "Load management practice"
            ],
            "pace_consistency": [
                "Lap time target practice",
                "Sector-by-sector consistency drills"
            ]
        }
        
        drills = []
        for alert in alerts:
            area = alert.get("improvement_area")
            if area and area in drill_map:
                drills.extend(drill_map[area])
        
        # Remove duplicates and limit
        unique_drills = list(dict.fromkeys(drills))
        return unique_drills[:4]
    
    def _get_progress_metrics(self, features: Dict) -> Dict:
        """Get target progress metrics"""
        return {
            "target_braking_consistency": min(0.95, features.get("braking_consistency", 0.5) + 0.1),
            "target_throttle_smoothness": min(0.95, features.get("throttle_smoothness", 0.5) + 0.1),
            "target_lap_consistency": min(0.98, features.get("lap_consistency", 0.5) + 0.05),
            "target_overall_score": min(0.95, features.get("overall_score", 0.5) + 0.1)
        }


# Global instance
coaching_alert_service = CoachingAlertService()


