#!/usr/bin/env python3
# agents/explainer/explainer_agent.py
# Explainer Agent: Formats insights with evidence and recommendations

import os
import sys
import json
import time
import redis
import requests
from typing import Dict, List, Optional
from datetime import datetime

class ExplainerAgent:
    def __init__(self, config: Optional[Dict] = None):
        config = config or {}
        self.agent_id = config.get('agent_id') or f'explainer-{os.getpid()}'
        self.redis_url = config.get('redis_url') or os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.redis = redis.Redis.from_url(self.redis_url, decode_responses=True)
        self.orchestrator_url = config.get('orchestrator_url') or os.getenv('ORCHESTRATOR_URL', 'http://localhost:3000')
        
    def register(self) -> bool:
        """Register with orchestrator"""
        try:
            response = requests.post(
                f'{self.orchestrator_url}/agents/register',
                json={
                    'agent_id': self.agent_id,
                    'types': ['explainer'],
                    'tracks': ['*'],
                    'capacity': 6
                },
                timeout=5
            )
            result = response.json()
            print(f"[Explainer] Registered: {'OK' if result.get('success') else 'FAILED'}")
            return result.get('success', False)
        except Exception as e:
            print(f"[Explainer] Registration failed: {e}")
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
    
    def format_insight(self, prediction_result: Dict, strategy_result: Optional[Dict] = None) -> Dict:
        """Format prediction and strategy into human-readable insight"""
        predictions = prediction_result.get('predictions', {})
        explanation = prediction_result.get('explanation', {})
        evidence_frames = prediction_result.get('evidence_frames', [])
        
        loss_per_lap = predictions.get('predicted_loss_per_lap_seconds', 0.3)
        laps_until = predictions.get('laps_until_0_5s_loss', 2.0)
        
        # Generate title
        if loss_per_lap > 0.4:
            title = f"High Tire Degradation Detected"
            severity = "high"
        elif loss_per_lap > 0.2:
            title = f"Moderate Tire Wear"
            severity = "medium"
        else:
            title = f"Tire Condition Stable"
            severity = "low"
        
        # Generate explanation text
        explanation_text = f"Predicted tire loss: {loss_per_lap:.2f}s per lap. "
        explanation_text += f"Estimated {laps_until:.1f} laps until 0.5s cumulative loss."
        
        # Top features
        top_features = explanation.get('top_features', [])[:3]
        feature_text = ", ".join([f"{f['name']} ({f['importance']:.2f})" for f in top_features])
        
        # Generate recommendation
        recommendation = self.generate_recommendation(predictions, strategy_result)
        
        # Format evidence
        evidence = []
        for frame in evidence_frames[:3]:
            evidence.append({
                'meta_time': frame.get('meta_time', frame.get('timestamp', '')),
                'lap': frame.get('lap', 0),
                'sector': frame.get('sector', ''),
                'sample_idx': frame.get('sample_idx', 0),
                'trace': {
                    'speed_kmh': frame.get('speed_kmh', 0),
                    'lateral_g': frame.get('lateral_g', 0),
                    'tire_stress': frame.get('accx_can', 0)**2 + frame.get('accy_can', 0)**2
                }
            })
        
        return {
            'id': f"insight-{datetime.utcnow().timestamp()}",
            'title': title,
            'severity': severity,
            'score': float(loss_per_lap),
            'explanation': explanation_text,
            'top_features': top_features,
            'recommendation': recommendation,
            'evidence': evidence,
            'model_version': prediction_result.get('model_version', 'tire-v1.0'),
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def generate_recommendation(self, predictions: Dict, strategy: Optional[Dict] = None) -> Dict:
        """Generate actionable recommendation"""
        loss_per_lap = predictions.get('predicted_loss_per_lap_seconds', 0.3)
        laps_until = predictions.get('laps_until_0_5s_loss', 2.0)
        
        if strategy and strategy.get('best_strategy'):
            best = strategy['best_strategy']
            one_liner = f"Recommendation: {best['description']}"
            bullets = [
                f"Optimal pit window: Lap {best['pit_lap']}",
                f"Estimated time saved: {strategy.get('time_saved_vs_pit_now', 0):.2f}s",
                f"Monitor tire stress in sectors 2 and 3"
            ]
        else:
            if loss_per_lap > 0.4:
                one_liner = "High degradation detected. Consider pitting within 2-3 laps."
                bullets = [
                    f"Tire loss: {loss_per_lap:.2f}s per lap",
                    f"Monitor for lockups or handling issues",
                    "Prepare pit crew for potential stop"
                ]
            elif laps_until < 5:
                one_liner = f"Tire degradation accelerating. Plan pit stop around lap {int(laps_until) + 1}."
                bullets = [
                    f"Laps until 0.5s loss: {laps_until:.1f}",
                    "Review sector-by-sector performance",
                    "Compare with competitor pit windows"
                ]
            else:
                one_liner = "Tire condition stable. Continue current strategy."
                bullets = [
                    f"Low degradation rate: {loss_per_lap:.2f}s per lap",
                    "Monitor for sudden changes",
                    "Maintain current pace"
                ]
        
        return {
            'one_liner': one_liner,
            'bullets': bullets,
            'voiceover_script': f"{one_liner}. {' '.join(bullets)}"
        }
    
    def process_window(self, task: Dict) -> Dict:
        """Process prediction and strategy results into insight"""
        payload = task.get('payload', {})
        prediction_result = payload.get('prediction_result', {})
        strategy_result = payload.get('strategy_result')
        
        # Format insight
        insight = self.format_insight(prediction_result, strategy_result)
        
        return {
            'success': True,
            'insight': insight,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def start(self):
        """Start explainer agent loop"""
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
                print(f"[Explainer] Processing task {task.get('task_id')}")
                
                start_time = time.time()
                result = self.process_window(task)
                latency_ms = (time.time() - start_time) * 1000
                
                # Send result
                result_msg = {
                    'task_id': task.get('task_id'),
                    'agent_id': self.agent_id,
                    'task_type': 'explainer',
                    'success': result.get('success', False),
                    'result': result,
                    'latency_ms': latency_ms,
                    'completed_at': datetime.utcnow().isoformat()
                }
                
                self.redis.xadd('agent_results.stream', {
                    'result': json.dumps(result_msg)
                })
                
            except Exception as e:
                print(f"[Explainer] Processing error: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(1)

if __name__ == '__main__':
    agent = ExplainerAgent()
    agent.start()


