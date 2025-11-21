#!/usr/bin/env python3
# agents/predictor/predictor_agent.py
# Predictor Agent: Tire degradation prediction with SHAP explainability

import os
import sys
import json
import time
import redis
import requests
import numpy as np
import joblib
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path

try:
    import lightgbm as lgb
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("Warning: LightGBM/SHAP not installed. Install with: pip install lightgbm shap")
    try:
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.linear_model import Ridge
    except ImportError:
        print("Warning: scikit-learn not available. Install with: pip install scikit-learn")

class PredictorAgent:
    def __init__(self, config: Optional[Dict] = None):
        config = config or {}
        self.agent_id = config.get('agent_id') or f'predictor-{os.getpid()}'
        self.redis_url = config.get('redis_url') or os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.redis = redis.Redis.from_url(self.redis_url, decode_responses=True)
        self.orchestrator_url = config.get('orchestrator_url') or os.getenv('ORCHESTRATOR_URL', 'http://localhost:3000')
        self.track = config.get('track', '*')  # Specific track or '*' for all
        self.model_path = config.get('model_path') or os.getenv('MODEL_PATH', '/models/tire_model.pkl')
        self.model = None
        self.explainer = None
        self.feature_names = [
            'tire_stress_s1', 'brake_energy_s1', 'avg_speed_s1',
            'tire_stress_s2', 'brake_energy_s2', 'avg_speed_s2',
            'tire_stress_s3', 'brake_energy_s3', 'avg_speed_s3',
            'total_stress', 'total_brake_energy', 'avg_speed_overall',
            'lap_number'
        ]
        
    def register(self) -> bool:
        """Register with orchestrator"""
        try:
            tracks = [self.track] if self.track != '*' else ['*']
            response = requests.post(
                f'{self.orchestrator_url}/agents/register',
                json={
                    'agent_id': self.agent_id,
                    'types': ['predictor'],
                    'tracks': tracks,
                    'capacity': 8
                },
                timeout=5
            )
            result = response.json()
            print(f"[Predictor] Registered: {'OK' if result.get('success') else 'FAILED'}")
            return result.get('success', False)
        except Exception as e:
            print(f"[Predictor] Registration failed: {e}")
            return False
    
    def heartbeat(self):
        """Send heartbeat to orchestrator"""
        try:
            requests.post(
                f'{self.orchestrator_url}/agents/heartbeat/{self.agent_id}',
                timeout=2
            )
        except:
            pass
    
    def load_model(self):
        """Load pre-trained model"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                print(f"[Predictor] Loaded model from {self.model_path}")
                
                # Initialize SHAP explainer if available
                if SHAP_AVAILABLE and hasattr(self.model, 'predict'):
                    # Create a small sample for SHAP background
                    sample_data = np.zeros((10, len(self.feature_names)))
                    try:
                        self.explainer = shap.TreeExplainer(self.model)
                        print("[Predictor] SHAP explainer initialized")
                    except:
                        print("[Predictor] SHAP explainer failed, using simple feature importance")
                        self.explainer = None
            else:
                # Create a simple fallback model
                print(f"[Predictor] Model not found at {self.model_path}, creating fallback")
                self._create_fallback_model()
        except Exception as e:
            print(f"[Predictor] Model loading error: {e}")
            self._create_fallback_model()
    
    def _create_fallback_model(self):
        """Create a simple fallback regression model"""
        try:
            from sklearn.linear_model import Ridge
            self.model = Ridge(alpha=1.0)
            # Train on dummy data (in production, load from training data)
            X_dummy = np.random.rand(100, len(self.feature_names))
            y_dummy = np.random.rand(100) * 0.5  # 0-0.5s loss per lap
            self.model.fit(X_dummy, y_dummy)
            print("[Predictor] Created fallback Ridge model")
        except Exception as e:
            print(f"[Predictor] Fallback model creation failed: {e}")
            self.model = None
    
    def extract_features(self, aggregate: Dict) -> np.ndarray:
        """Extract features from aggregate window"""
        sectors = aggregate.get('sectors', {})
        lap_range = aggregate.get('lap_range', {})
        lap_number = lap_range.get('max', 1)
        
        features = []
        
        # Per-sector features
        for sector_name in ['S1', 'S2', 'S3']:
            sector = sectors.get(sector_name, {})
            features.extend([
                sector.get('tire_stress', 0) / 1000,  # Normalize
                sector.get('brake_energy', 0) / 1000,
                sector.get('avg_speed', 0) / 200
            ])
        
        # Overall features
        total_stress = sum(s.get('tire_stress', 0) for s in sectors.values())
        total_brake = sum(s.get('brake_energy', 0) for s in sectors.values())
        avg_speed = np.mean([s.get('avg_speed', 0) for s in sectors.values()]) if sectors else 0
        
        features.extend([
            total_stress / 3000,
            total_brake / 3000,
            avg_speed / 200,
            lap_number / 50  # Normalize lap number
        ])
        
        return np.array(features).reshape(1, -1)
    
    def predict(self, features: np.ndarray) -> Dict:
        """Predict tire degradation"""
        if self.model is None:
            return {
                'predicted_loss_per_lap_seconds': 0.3,
                'laps_until_0_5s_loss': 2.0,
                'confidence': 0.5
            }
        
        try:
            pred = self.model.predict(features)[0]
            # Ensure reasonable bounds
            pred = max(0.0, min(pred, 2.0))  # 0-2s loss per lap
            
            # Calculate laps until 0.5s cumulative loss
            if pred > 0:
                laps_until = 0.5 / pred
            else:
                laps_until = 999.0
            
            return {
                'predicted_loss_per_lap_seconds': float(pred),
                'laps_until_0_5s_loss': float(laps_until),
                'confidence': 0.8  # Placeholder
            }
        except Exception as e:
            print(f"[Predictor] Prediction error: {e}")
            return {
                'predicted_loss_per_lap_seconds': 0.3,
                'laps_until_0_5s_loss': 2.0,
                'confidence': 0.3
            }
    
    def explain(self, features: np.ndarray) -> Dict:
        """Generate SHAP explanations"""
        if self.explainer is None or self.model is None:
            # Fallback: simple feature importance
            feature_importance = np.abs(features[0])
            feature_importance = feature_importance / (feature_importance.sum() + 1e-10)
            
            top_features = []
            for i, (name, importance) in enumerate(zip(self.feature_names, feature_importance)):
                if importance > 0.05:  # Threshold
                    top_features.append({
                        'name': name,
                        'value': float(features[0][i]),
                        'importance': float(importance)
                    })
            
            top_features.sort(key=lambda x: x['importance'], reverse=True)
            return {
                'top_features': top_features[:5],
                'method': 'simple_importance'
            }
        
        try:
            shap_values = self.explainer.shap_values(features)
            
            if isinstance(shap_values, list):
                shap_values = shap_values[0]  # For multi-class, take first
            
            shap_values = np.array(shap_values).flatten()
            
            # Get top contributing features
            top_indices = np.argsort(np.abs(shap_values))[-5:][::-1]
            
            top_features = []
            for idx in top_indices:
                top_features.append({
                    'name': self.feature_names[idx] if idx < len(self.feature_names) else f'feature_{idx}',
                    'value': float(features[0][idx]),
                    'shap_value': float(shap_values[idx]),
                    'importance': float(np.abs(shap_values[idx]))
                })
            
            return {
                'top_features': top_features,
                'method': 'shap'
            }
        except Exception as e:
            print(f"[Predictor] SHAP explanation error: {e}")
            return self.explain(features)  # Fallback
    
    def process_window(self, task: Dict) -> Dict:
        """Process aggregate window and generate predictions"""
        payload = task.get('payload', {})
        aggregate_window_id = payload.get('aggregate_window_id')
        track = payload.get('track')
        chassis = payload.get('chassis')
        
        # Get aggregate data
        aggregate_key = f'aggregate:{aggregate_window_id}'
        aggregate_data = self.redis.get(aggregate_key)
        
        if not aggregate_data:
            return {'error': 'Aggregate window not found'}
        
        aggregate = json.loads(aggregate_data)
        
        # Extract features
        features = self.extract_features(aggregate)
        
        # Predict
        predictions = self.predict(features)
        
        # Explain
        explanation = self.explain(features)
        
        # Get evidence frames
        recent_points = aggregate.get('recent_points', [])
        evidence_frames = recent_points[-3:] if recent_points else []
        
        return {
            'success': True,
            'track': track,
            'chassis': chassis,
            'model_version': 'tire-v1.0',
            'predictions': predictions,
            'explanation': explanation,
            'evidence_frames': evidence_frames,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def start(self):
        """Start predictor agent loop"""
        self.load_model()
        self.register()
        
        # Send heartbeat every 10s
        import threading
        def heartbeat_loop():
            while True:
                time.sleep(10)
                self.heartbeat()
        
        threading.Thread(target=heartbeat_loop, daemon=True).start()
        
        # Process tasks from inbox
        inbox = f'agent:{self.agent_id}:inbox'
        
        while True:
            try:
                msg = self.redis.blpop(inbox, timeout=5)
                if not msg:
                    continue
                
                _, task_json = msg
                task = json.loads(task_json)
                print(f"[Predictor] Processing task {task.get('task_id')}")
                
                start_time = time.time()
                result = self.process_window(task)
                latency_ms = (time.time() - start_time) * 1000
                
                # Send result
                result_msg = {
                    'task_id': task.get('task_id'),
                    'agent_id': self.agent_id,
                    'task_type': 'predictor',
                    'success': result.get('success', False),
                    'result': result,
                    'latency_ms': latency_ms,
                    'completed_at': datetime.utcnow().isoformat()
                }
                
                self.redis.xadd('agent_results.stream', {
                    'result': json.dumps(result_msg)
                })
                
            except Exception as e:
                print(f"[Predictor] Processing error: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(1)

if __name__ == '__main__':
    agent = PredictorAgent()
    agent.start()

