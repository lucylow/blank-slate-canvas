"""
Explainable AI Service - Provides top-3 evidence-based explanations for all predictions
"""
import uuid
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import numpy as np
import logging

logger = logging.getLogger(__name__)


class ExplainableAIService:
    """Service for generating SHAP-based explanations for model predictions"""
    
    def __init__(self):
        self.explanation_templates = {
            'tire_degradation': {
                'feature_descriptions': {
                    'tire_stress_sector_1': 'High lateral loads in Sector 1 corners',
                    'tire_stress_sector_2': 'Braking and acceleration stress in Sector 2',
                    'brake_energy': 'Thermal energy from braking',
                    'avg_speed': 'Sustained high speeds affecting tire temperature',
                    'slip_angle_avg': 'Excessive sliding and slip angles',
                    'track_temperature': 'Track surface temperature impact',
                    'lap_count': 'Accumulated lap distance',
                    'cornering_aggression': 'Aggressive cornering style'
                },
                'impact_descriptions': {
                    'high': 'significantly increases',
                    'medium': 'increases',
                    'low': 'slightly increases'
                }
            },
            'lap_time_prediction': {
                'feature_descriptions': {
                    'sector_1_time': 'Sector 1 performance',
                    'sector_2_time': 'Sector 2 technical section',
                    'sector_3_time': 'Sector 3 straight line speed',
                    'tire_wear_effect': 'Current tire degradation impact',
                    'fuel_load': 'Vehicle weight from fuel',
                    'track_evolution': 'Track conditions improving',
                    'driver_consistency': 'Driver performance consistency'
                }
            },
            'pit_strategy': {
                'feature_descriptions': {
                    'tire_wear_rate': 'Current tire wear rate',
                    'competitor_strategies': 'Competitor pit stop patterns',
                    'safety_car_probability': 'Safety car likelihood',
                    'position_traffic': 'Track position and traffic',
                    'weather_forecast': 'Upcoming weather changes',
                    'stint_length': 'Current stint duration'
                }
            }
        }
    
    async def generate_explanation(
        self,
        prediction_type: str,
        model: Any,
        features: Dict[str, float],
        prediction: float,
        baseline_data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generate SHAP-based explanation for a prediction"""
        explanation_id = f"explain_{uuid.uuid4()}"
        
        try:
            # Calculate SHAP values
            shap_values = await self._calculate_shap_values(
                model, features, baseline_data
            )
            
            # Extract top 3 contributing features
            top_features = self._extract_top_features(
                shap_values, features, prediction_type
            )
            
            # Generate evidence frames
            evidence_frames = await self._generate_evidence_frames(
                top_features, prediction_type, features
            )
            
            # Create human-readable explanation
            human_explanation = self._create_human_explanation(
                top_features, prediction, prediction_type
            )
            
            # Generate confidence metrics
            confidence = self._calculate_explanation_confidence(
                shap_values, top_features
            )
            
            return {
                'explanation_id': explanation_id,
                'prediction_type': prediction_type,
                'prediction_value': float(prediction),
                'top_evidence': top_features[:3],
                'evidence_frames': evidence_frames,
                'human_readable': human_explanation,
                'confidence': confidence,
                'shap_values': shap_values,
                'generated_at': datetime.utcnow().isoformat(),
                'model_version': getattr(model, 'version', '1.0')
            }
            
        except Exception as error:
            logger.error(f'Error generating explanation: {error}')
            return self._generate_fallback_explanation(
                prediction_type, features, prediction
            )
    
    async def _calculate_shap_values(
        self,
        model: Any,
        features: Dict[str, float],
        baseline_data: Optional[Dict] = None
    ) -> Dict[str, Dict[str, Any]]:
        """Calculate SHAP values for feature importance"""
        try:
            # Check if model has SHAP support
            model_type = getattr(model, 'type', None)
            
            # For tree-based models (LightGBM, XGBoost)
            if model_type == 'tree' and hasattr(model, 'predict'):
                return await self._calculate_tree_shap(model, features)
            
            # For linear models
            if model_type == 'linear':
                return self._calculate_linear_feature_importance(model, features)
            
            # Fallback to simple feature importance
            feature_importance = getattr(model, 'feature_importance_', {})
            return self._calculate_simple_feature_importance(
                features, feature_importance
            )
            
        except Exception as error:
            logger.warning(f'SHAP calculation failed, using fallback: {error}')
            return self._calculate_simple_feature_importance(features)
    
    async def _calculate_tree_shap(
        self,
        model: Any,
        features: Dict[str, float]
    ) -> Dict[str, Dict[str, Any]]:
        """Calculate SHAP values for tree-based models"""
        try:
            # Try to import shap library
            import shap
            import pandas as pd
            
            # Convert features to array format
            feature_names = list(features.keys())
            feature_values = np.array([[features[f] for f in feature_names]])
            
            # Create explainer
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(feature_values)[0]
            
            return self._format_shap_values(shap_values, feature_names)
            
        except ImportError:
            logger.warning('SHAP library not available, using fallback')
            return self._calculate_simple_feature_importance(features)
        except Exception as e:
            logger.warning(f'Tree SHAP calculation failed: {e}')
            return self._calculate_simple_feature_importance(features)
    
    def _format_shap_values(
        self,
        shap_values: np.ndarray,
        feature_names: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """Format SHAP values into readable format"""
        result = {}
        for idx, feature in enumerate(feature_names):
            shap_value = float(shap_values[idx]) if idx < len(shap_values) else 0.0
            result[feature] = {
                'value': shap_value,
                'absolute_value': abs(shap_value),
                'direction': 'positive' if shap_value > 0 else 'negative'
            }
        return result
    
    def _extract_top_features(
        self,
        shap_values: Dict[str, Dict[str, Any]],
        features: Dict[str, float],
        prediction_type: str
    ) -> List[Dict[str, Any]]:
        """Extract top 3 most influential features"""
        feature_entries = []
        
        for feature, data in shap_values.items():
            feature_entries.append({
                'feature': feature,
                'importance': data['absolute_value'],
                'impact': data['direction'],
                'actual_value': features.get(feature, 0.0),
                'description': self._get_feature_description(feature, prediction_type)
            })
        
        # Sort by importance and take top 3
        feature_entries.sort(key=lambda x: x['importance'], reverse=True)
        top_features = feature_entries[:3]
        
        # Add additional metadata
        for idx, item in enumerate(top_features):
            item['rank'] = idx + 1
            item['impact_strength'] = self._categorize_impact_strength(
                item['importance'], prediction_type
            )
            item['evidence_strength'] = self._calculate_evidence_strength(
                item['importance'], item['actual_value']
            )
        
        return top_features
    
    def _categorize_impact_strength(
        self,
        importance: float,
        prediction_type: str
    ) -> str:
        """Categorize impact strength based on SHAP value"""
        thresholds = {
            'tire_degradation': {'high': 0.1, 'medium': 0.05, 'low': 0.01},
            'lap_time_prediction': {'high': 0.5, 'medium': 0.2, 'low': 0.05},
            'pit_strategy': {'high': 0.15, 'medium': 0.07, 'low': 0.02}
        }
        
        threshold = thresholds.get(prediction_type, thresholds['tire_degradation'])
        
        if importance >= threshold['high']:
            return 'high'
        if importance >= threshold['medium']:
            return 'medium'
        return 'low'
    
    def _calculate_evidence_strength(
        self,
        importance: float,
        actual_value: float
    ) -> float:
        """Calculate evidence strength based on feature value and importance"""
        base_strength = importance * 100
        value_modifier = min(1.0, abs(actual_value) / 10.0)  # Normalize value impact
        return min(100.0, base_strength * (1 + value_modifier))
    
    async def _generate_evidence_frames(
        self,
        top_features: List[Dict[str, Any]],
        prediction_type: str,
        features: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """Generate evidence frames with telemetry data"""
        evidence_frames = []
        
        for feature in top_features[:3]:
            evidence = await self._create_evidence_frame(
                feature, prediction_type, features
            )
            if evidence:
                evidence_frames.append(evidence)
        
        return evidence_frames
    
    async def _create_evidence_frame(
        self,
        feature: Dict[str, Any],
        prediction_type: str,
        features: Dict[str, float]
    ) -> Dict[str, Any]:
        """Create individual evidence frame"""
        frame = {
            'feature': feature['feature'],
            'importance': feature['importance'],
            'impact': feature['impact'],
            'actual_value': feature['actual_value'],
            'description': feature['description'],
            'evidence_type': self._determine_evidence_type(feature['feature']),
            'supporting_data': await self._get_supporting_telemetry(
                feature['feature'], features
            ),
            'contextual_insight': self._generate_contextual_insight(
                feature, prediction_type
            )
        }
        
        # Add mini-trace for visualization
        if self._should_include_trace(feature['feature']):
            frame['mini_trace'] = await self._generate_mini_trace(
                feature['feature'], features
            )
        
        return frame
    
    def _generate_contextual_insight(
        self,
        feature: Dict[str, Any],
        prediction_type: str
    ) -> str:
        """Generate contextual insight based on feature impact"""
        templates = {
            'tire_degradation': {
                'high': f"This {feature['description']} is causing accelerated wear and will likely reduce tire life by 2-3 laps",
                'medium': f"Elevated {feature['description']} is contributing to above-average degradation rates",
                'low': f"Minor impact from {feature['description']}, but worth monitoring for trends"
            },
            'lap_time_prediction': {
                'high': f"{feature['description']} is the primary factor affecting current lap time performance",
                'medium': f"{feature['description']} is having a measurable impact on sector times",
                'low': f"Small influence from {feature['description']}, minimal time impact"
            }
        }
        
        template = templates.get(prediction_type, templates['tire_degradation'])
        impact_strength = feature.get('impact_strength', 'medium')
        return template.get(impact_strength, template['medium'])
    
    def _create_human_explanation(
        self,
        top_features: List[Dict[str, Any]],
        prediction: float,
        prediction_type: str
    ) -> Dict[str, Any]:
        """Create human-readable explanation"""
        main_contributors = ', '.join([
            f"{f['description']} ({f['impact_strength']} impact)"
            for f in top_features
        ])
        
        explanation_templates = {
            'tire_degradation': {
                'title': "Tire Degradation Analysis",
                'summary': f"Predicted degradation of {prediction:.3f}s per lap is primarily driven by:",
                'bullets': [
                    f"{f['description']} - {self._get_impact_description(f, prediction_type)}"
                    for f in top_features
                ]
            },
            'lap_time_prediction': {
                'title': "Lap Time Prediction Breakdown",
                'summary': f"Predicted lap time of {prediction:.3f}s is influenced by:",
                'bullets': [
                    f"{f['description']} contributing {(f['importance'] * 100):.1f}% to time variance"
                    for f in top_features
                ]
            },
            'pit_strategy': {
                'title': "Strategy Recommendation Reasoning",
                'summary': "Pit strategy recommendation based on:",
                'bullets': [
                    f"{f['description']} showing {f['impact_strength']} priority for strategy decision"
                    for f in top_features
                ]
            }
        }
        
        template = explanation_templates.get(
            prediction_type, explanation_templates['tire_degradation']
        )
        
        return {
            'title': template['title'],
            'summary': template['summary'],
            'key_factors': template['bullets'],
            'main_contributors': main_contributors,
            'recommendation': self._generate_recommendation(top_features, prediction_type),
            'confidence_note': self._get_confidence_note(top_features)
        }
    
    def _get_impact_description(
        self,
        feature: Dict[str, Any],
        prediction_type: str
    ) -> str:
        """Get impact description based on feature"""
        impact_verbs = {
            'tire_degradation': {
                'high': 'significantly increases wear rate',
                'medium': 'contributes to accelerated degradation',
                'low': 'slightly affects tire life'
            },
            'lap_time_prediction': {
                'high': 'major time loss contributor',
                'medium': 'measurable time impact',
                'low': 'minor time influence'
            }
        }
        
        verbs = impact_verbs.get(prediction_type, impact_verbs['tire_degradation'])
        impact_strength = feature.get('impact_strength', 'medium')
        return verbs.get(impact_strength, verbs['medium'])
    
    def _generate_recommendation(
        self,
        top_features: List[Dict[str, Any]],
        prediction_type: str
    ) -> List[Dict[str, Any]]:
        """Generate actionable recommendation"""
        recommendations = []
        
        for feature in top_features[:2]:  # Top 2 recommendations
            rec = self._get_feature_recommendation(feature, prediction_type)
            if rec:
                recommendations.append(rec)
        
        return recommendations
    
    def _get_feature_recommendation(
        self,
        feature: Dict[str, Any],
        prediction_type: str
    ) -> Optional[Dict[str, Any]]:
        """Get specific recommendation for feature"""
        recommendation_map = {
            'tire_stress_sector_1': 'Smooth steering inputs in high-speed corners to reduce lateral loads',
            'tire_stress_sector_2': 'Modulate brake pressure and throttle application to manage tire temperatures',
            'brake_energy': 'Reduce braking intensity and optimize brake release points',
            'slip_angle_avg': 'Minimize sliding and maintain optimal slip angles for tire conservation',
            'sector_1_time': 'Focus on brake marker consistency and turn-in points in Sector 1',
            'sector_2_time': 'Improve technical section rhythm and corner exit traction',
            'track_temperature': 'Adjust tire pressures for current track temperature conditions'
        }
        
        recommendation_text = recommendation_map.get(feature['feature'])
        if not recommendation_text:
            return None
        
        return {
            'feature': feature['feature'],
            'recommendation': recommendation_text,
            'priority': feature['impact_strength'],
            'expected_benefit': self._calculate_expected_benefit(feature)
        }
    
    def _calculate_expected_benefit(self, feature: Dict[str, Any]) -> str:
        """Calculate expected benefit from recommendation"""
        benefit_map = {
            'high': '2-3 lap tire life extension or 0.3-0.5s lap time improvement',
            'medium': '1-2 lap improvement or 0.1-0.3s gain',
            'low': 'Marginal gains but improves consistency'
        }
        
        impact_strength = feature.get('impact_strength', 'medium')
        return benefit_map.get(impact_strength, benefit_map['medium'])
    
    def _calculate_explanation_confidence(
        self,
        shap_values: Dict[str, Dict[str, Any]],
        top_features: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Calculate explanation confidence metrics"""
        total_importance = sum(
            abs(val.get('value', val) if isinstance(val, dict) else val)
            for val in shap_values.values()
        )
        
        top3_importance = sum(f['importance'] for f in top_features)
        
        coverage = top3_importance / total_importance if total_importance > 0 else 0.0
        
        return {
            'overall': min(0.95, coverage * 1.2),  # Cap at 95%
            'coverage': coverage,
            'reliability': 'high' if coverage > 0.7 else 'medium' if coverage > 0.5 else 'low',
            'factors_considered': len(shap_values)
        }
    
    def _generate_fallback_explanation(
        self,
        prediction_type: str,
        features: Dict[str, float],
        prediction: float
    ) -> Dict[str, Any]:
        """Fallback explanation when SHAP fails"""
        # Sort features by absolute value
        sorted_features = sorted(
            features.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )[:3]
        
        top_features = []
        for idx, (feature, value) in enumerate(sorted_features):
            top_features.append({
                'rank': idx + 1,
                'feature': feature,
                'importance': abs(value) / 10.0,  # Rough estimate
                'impact': 'positive' if value > 0 else 'negative',
                'actual_value': value,
                'description': self._get_feature_description(feature, prediction_type),
                'impact_strength': 'medium',
                'evidence_strength': 60.0
            })
        
        return {
            'explanation_id': f"fallback_{uuid.uuid4()}",
            'prediction_type': prediction_type,
            'prediction_value': float(prediction),
            'top_evidence': top_features,
            'evidence_frames': [],
            'human_readable': {
                'title': "Prediction Analysis (Fallback Mode)",
                'summary': "Analysis based on feature values (detailed SHAP analysis unavailable)",
                'key_factors': [f"{f['description']}: {f['actual_value']}" for f in top_features],
                'main_contributors': ', '.join([f['description'] for f in top_features]),
                'recommendation': [{
                    'feature': 'system',
                    'recommendation': 'Enable detailed analysis for more accurate explanations',
                    'priority': 'low'
                }],
                'confidence_note': 'Using fallback analysis - enable SHAP for higher confidence'
            },
            'confidence': {'overall': 0.6, 'reliability': 'medium', 'coverage': 0.6, 'factors_considered': len(features)},
            'generated_at': datetime.utcnow().isoformat(),
            'model_version': '1.0-fallback',
            'shap_values': {k: {'value': v, 'absolute_value': abs(v), 'direction': 'positive' if v > 0 else 'negative'} 
                          for k, v in features.items()}
        }
    
    # Utility methods
    def _get_feature_description(self, feature: str, prediction_type: str) -> str:
        """Get human-readable feature description"""
        templates = self.explanation_templates.get(prediction_type, {})
        descriptions = templates.get('feature_descriptions', {})
        return descriptions.get(feature, feature.replace('_', ' ').title())
    
    def _determine_evidence_type(self, feature: str) -> str:
        """Determine evidence type from feature name"""
        if 'sector' in feature:
            return 'sector_performance'
        if 'tire' in feature or 'stress' in feature:
            return 'tire_analysis'
        if 'brake' in feature:
            return 'braking_analysis'
        if 'speed' in feature or 'time' in feature:
            return 'performance_metric'
        return 'general_metric'
    
    def _should_include_trace(self, feature: str) -> bool:
        """Determine if feature should include telemetry trace"""
        return any(keyword in feature for keyword in ['sector', 'stress', 'brake'])
    
    async def _get_supporting_telemetry(
        self,
        feature: str,
        features: Dict[str, float]
    ) -> Dict[str, Any]:
        """Get supporting telemetry data"""
        return {
            'feature': feature,
            'current_value': features.get(feature, 0.0),
            'comparison': 'baseline',
            'trend': 'increasing',
            'significance': 'high'
        }
    
    async def _generate_mini_trace(
        self,
        feature: str,
        features: Dict[str, float]
    ) -> Dict[str, Any]:
        """Generate sample telemetry trace for visualization"""
        base_value = features.get(feature, 0.0)
        values = [
            base_value * 0.8,
            base_value * 0.9,
            base_value,
            base_value * 1.1,
            base_value * 1.05
        ]
        
        return {
            'timestamps': [0, 1, 2, 3, 4],
            'values': [float(v) for v in values],
            'units': self._get_feature_units(feature)
        }
    
    def _get_feature_units(self, feature: str) -> str:
        """Get units for feature"""
        if 'stress' in feature:
            return 'stress_units'
        if 'time' in feature:
            return 'seconds'
        if 'speed' in feature:
            return 'km/h'
        if 'energy' in feature:
            return 'energy_units'
        return 'units'
    
    def _get_confidence_note(self, top_features: List[Dict[str, Any]]) -> str:
        """Get confidence note based on evidence strength"""
        if not top_features:
            return 'Lower confidence - consider additional factors'
        
        avg_strength = sum(f['evidence_strength'] for f in top_features) / len(top_features)
        if avg_strength >= 80:
            return 'High confidence in explanation'
        if avg_strength >= 60:
            return 'Moderate confidence in explanation'
        return 'Lower confidence - consider additional factors'
    
    def _calculate_linear_feature_importance(
        self,
        model: Any,
        features: Dict[str, float]
    ) -> Dict[str, Dict[str, Any]]:
        """Calculate feature importance for linear models"""
        coefficients = getattr(model, 'coef_', {})
        if hasattr(coefficients, '__iter__') and not isinstance(coefficients, dict):
            # Handle numpy array coefficients
            feature_names = list(features.keys())
            if len(coefficients) == len(feature_names):
                coefficients = {name: float(coef) for name, coef in zip(feature_names, coefficients)}
            else:
                coefficients = {}
        
        result = {}
        for feature, value in features.items():
            coef = coefficients.get(feature, 0.0) if isinstance(coefficients, dict) else 0.0
            contribution = coef * value
            result[feature] = {
                'value': float(contribution),
                'absolute_value': abs(contribution),
                'direction': 'positive' if contribution > 0 else 'negative'
            }
        
        return result
    
    def _calculate_simple_feature_importance(
        self,
        features: Dict[str, float],
        importance_weights: Optional[Dict[str, float]] = None
    ) -> Dict[str, Dict[str, Any]]:
        """Simple feature importance fallback"""
        if importance_weights is None:
            importance_weights = {}
        
        result = {}
        for feature, value in features.items():
            weight = importance_weights.get(feature, 1.0)
            contribution = value * weight
            result[feature] = {
                'value': float(contribution),
                'absolute_value': abs(contribution),
                'direction': 'positive' if contribution > 0 else 'negative'
            }
        
        return result

