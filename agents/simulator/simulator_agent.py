#!/usr/bin/env python3
# agents/simulator/simulator_agent.py
# Simulator Agent: Strategy optimization with pit window simulation

import os
import sys
import json
import time
import redis
import requests
from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path

class SimulatorAgent:
    def __init__(self, config: Optional[Dict] = None):
        config = config or {}
        self.agent_id = config.get('agent_id') or f'simulator-{os.getpid()}'
        self.redis_url = config.get('redis_url') or os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.redis = redis.Redis.from_url(self.redis_url, decode_responses=True)
        self.orchestrator_url = config.get('orchestrator_url') or os.getenv('ORCHESTRATOR_URL', 'http://localhost:3000')
        self.track_config_path = config.get('track_config_path') or os.path.join(
            os.path.dirname(__file__), '../config/track-config.json'
        )
        self.track_config = self._load_track_config()
    
    def _load_track_config(self) -> Dict:
        """Load track-specific configuration"""
        try:
            with open(self.track_config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"[Simulator] Failed to load track config: {e}")
            return {}
    
    def normalize_track(self, track: str) -> str:
        """Normalize track name"""
        normalized = track.lower().replace(' ', '_').replace('-', '_')
        track_map = {
            'virginia': 'vir',
            'road-america': 'road_america',
            'road america': 'road_america'
        }
        return track_map.get(normalized, normalized)
    
    def get_pit_cost(self, track: str) -> float:
        """Get track-specific pit cost"""
        normalized = self.normalize_track(track)
        config = self.track_config.get(normalized, {})
        return config.get('characteristics', {}).get('pit_cost_seconds', 30.0)
        
    def register(self) -> bool:
        """Register with orchestrator"""
        try:
            response = requests.post(
                f'{self.orchestrator_url}/agents/register',
                json={
                    'agent_id': self.agent_id,
                    'types': ['simulator'],
                    'tracks': ['*'],
                    'capacity': 2
                },
                timeout=5
            )
            result = response.json()
            print(f"[Simulator] Registered: {'OK' if result.get('success') else 'FAILED'}")
            return result.get('success', False)
        except Exception as e:
            print(f"[Simulator] Registration failed: {e}")
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
    
    def simulate_strategy(self, predictions: Dict, track: str, current_lap: int, total_laps: int = 30) -> Dict:
        """Simulate race strategy scenarios with track-specific logic"""
        normalized_track = self.normalize_track(track)
        track_cfg = self.track_config.get(normalized_track, {})
        pit_cost = self.get_pit_cost(track)
        
        loss_per_lap = predictions.get('predicted_loss_per_lap_seconds', 0.3)
        laps_until_05s = predictions.get('laps_until_0_5s_loss', 2.0)
        
        # Track-specific adjustments
        track_type = track_cfg.get('characteristics', {}).get('type', 'standard')
        
        # COTA: long back straight makes tire cliff more costly
        if normalized_track == 'cota':
            # Penalize staying out if degradation is high on final sector
            if loss_per_lap > 0.4:
                loss_per_lap *= 1.1  # 10% penalty for high degradation
        
        # Road America: long lap cost for pitting is higher
        if normalized_track == 'road_america':
            # Already accounted in pit_cost (35s vs 30s standard)
            # But also factor in that stretching is more valuable
            if laps_until_05s > (total_laps - current_lap) * 0.8:
                # Favor staying out if viable
                pass
        
        # Sebring: abrasive surface increases wear rate
        if normalized_track == 'sebring':
            # Earlier pit windows due to abrasion
            loss_per_lap *= 1.15  # 15% increase due to abrasion
            laps_until_05s = 0.5 / loss_per_lap  # Recalculate
        
        # Sonoma/VIR: elevation creates thermal recovery
        if normalized_track in ['sonoma', 'vir']:
            # Some sectors allow thermal recovery (reduce loss)
            # Simplified: reduce loss by 5% if in recovery zones
            loss_per_lap *= 0.95
        
        scenarios = []
        
        # Scenario 1: Pit now
        pit_now_laps = list(range(current_lap, total_laps + 1))
        pit_now_time = pit_cost
        for lap in pit_now_laps:
            if lap > current_lap:
                pit_now_time += loss_per_lap * (lap - current_lap)
        scenarios.append({
            'name': 'pit_now',
            'pit_lap': current_lap,
            'total_time': pit_now_time,
            'description': f'Pit on lap {current_lap}',
            'probability': 0.3
        })
        
        # Scenario 2: Pit later (when loss reaches 0.5s)
        optimal_pit_lap = min(current_lap + int(laps_until_05s), total_laps)
        if optimal_pit_lap <= current_lap:
            optimal_pit_lap = current_lap + 1
        
        pit_later_laps = list(range(current_lap, total_laps + 1))
        pit_later_time = 0
        for lap in pit_later_laps:
            if lap < optimal_pit_lap:
                pit_later_time += loss_per_lap * (lap - current_lap)
            elif lap == optimal_pit_lap:
                pit_later_time += pit_cost
            else:
                # After pit, degradation resets (simplified)
                pit_later_time += loss_per_lap * (lap - optimal_pit_lap) * 0.3  # Fresh tires
        
        scenarios.append({
            'name': 'pit_later',
            'pit_lap': optimal_pit_lap,
            'total_time': pit_later_time,
            'description': f'Pit on lap {optimal_pit_lap} (optimal window)',
            'probability': 0.6
        })
        
        # Scenario 3: Stay out (if viable)
        if laps_until_05s > (total_laps - current_lap) * 0.9:
            stay_out_time = loss_per_lap * (total_laps - current_lap)
            scenarios.append({
                'name': 'stay_out',
                'pit_lap': None,
                'total_time': stay_out_time,
                'description': 'Stay out (tires viable to end)',
                'probability': 0.1
            })
        
        # Find best strategy
        best_scenario = min(scenarios, key=lambda s: s['total_time'])
        
        # Compute expected gain
        time_saved = scenarios[0]['total_time'] - best_scenario['total_time']
        
        return {
            'scenarios': scenarios,
            'best_strategy': best_scenario,
            'recommendation': best_scenario['name'],
            'expected_gain_seconds': time_saved,
            'time_saved_vs_pit_now': time_saved,
            'confidence': 0.7,
            'track': normalized_track,
            'pit_cost_used': pit_cost
        }
    
    def process_window(self, task: Dict) -> Dict:
        """Process prediction result and simulate strategies"""
        payload = task.get('payload', {})
        predictions = payload.get('predictions', {})
        track = payload.get('track')
        chassis = payload.get('chassis')
        current_lap = payload.get('current_lap', 12)
        total_laps = payload.get('total_laps', 30)
        
        # Run simulation with track-specific logic
        strategy_result = self.simulate_strategy(predictions, track, current_lap, total_laps)
        
        return {
            'success': True,
            'track': track,
            'chassis': chassis,
            'strategy': strategy_result,
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def start(self):
        """Start simulator agent loop"""
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
                print(f"[Simulator] Processing task {task.get('task_id')}")
                
                start_time = time.time()
                result = self.process_window(task)
                latency_ms = (time.time() - start_time) * 1000
                
                # Send result
                result_msg = {
                    'task_id': task.get('task_id'),
                    'agent_id': self.agent_id,
                    'task_type': 'simulator',
                    'success': result.get('success', False),
                    'result': result,
                    'latency_ms': latency_ms,
                    'completed_at': datetime.utcnow().isoformat()
                }
                
                self.redis.xadd('agent_results.stream', {
                    'result': json.dumps(result_msg)
                })
                
            except Exception as e:
                print(f"[Simulator] Processing error: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(1)

if __name__ == '__main__':
    agent = SimulatorAgent()
    agent.start()

