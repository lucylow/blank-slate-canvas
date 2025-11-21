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

class SimulatorAgent:
    def __init__(self, config: Optional[Dict] = None):
        config = config or {}
        self.agent_id = config.get('agent_id') or f'simulator-{os.getpid()}'
        self.redis_url = config.get('redis_url') or os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.redis = redis.Redis.from_url(self.redis_url, decode_responses=True)
        self.orchestrator_url = config.get('orchestrator_url') or os.getenv('ORCHESTRATOR_URL', 'http://localhost:3000')
        self.pit_cost_seconds = config.get('pit_cost_seconds', 30.0)  # Fixed pit stop cost
        
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
    
    def simulate_strategy(self, predictions: Dict, current_lap: int, total_laps: int = 30) -> Dict:
        """Simulate race strategy scenarios"""
        loss_per_lap = predictions.get('predicted_loss_per_lap_seconds', 0.3)
        laps_until_05s = predictions.get('laps_until_0_5s_loss', 2.0)
        
        scenarios = []
        
        # Scenario 1: Pit now
        pit_now_laps = list(range(current_lap, total_laps + 1))
        pit_now_time = self.pit_cost_seconds
        for lap in pit_now_laps:
            if lap > current_lap:
                pit_now_time += loss_per_lap * (lap - current_lap)
        scenarios.append({
            'name': 'pit_now',
            'pit_lap': current_lap,
            'total_time': pit_now_time,
            'description': f'Pit on lap {current_lap}'
        })
        
        # Scenario 2: Pit later (when loss reaches 0.5s)
        optimal_pit_lap = min(current_lap + int(laps_until_05s), total_laps)
        pit_later_laps = list(range(current_lap, total_laps + 1))
        pit_later_time = 0
        for lap in pit_later_laps:
            if lap < optimal_pit_lap:
                pit_later_time += loss_per_lap * (lap - current_lap)
            elif lap == optimal_pit_lap:
                pit_later_time += self.pit_cost_seconds
            else:
                pit_later_time += loss_per_lap * (lap - optimal_pit_lap)
        scenarios.append({
            'name': 'pit_later',
            'pit_lap': optimal_pit_lap,
            'total_time': pit_later_time,
            'description': f'Pit on lap {optimal_pit_lap} (optimal window)'
        })
        
        # Scenario 3: Stay out (if viable)
        if laps_until_05s > (total_laps - current_lap):
            stay_out_time = loss_per_lap * (total_laps - current_lap)
            scenarios.append({
                'name': 'stay_out',
                'pit_lap': None,
                'total_time': stay_out_time,
                'description': 'Stay out (tires viable to end)'
            })
        
        # Find best strategy
        best_scenario = min(scenarios, key=lambda s: s['total_time'])
        
        return {
            'scenarios': scenarios,
            'best_strategy': best_scenario,
            'recommendation': best_scenario['name'],
            'time_saved_vs_pit_now': scenarios[0]['total_time'] - best_scenario['total_time']
        }
    
    def process_window(self, task: Dict) -> Dict:
        """Process prediction result and simulate strategies"""
        payload = task.get('payload', {})
        predictions = payload.get('predictions', {})
        track = payload.get('track')
        chassis = payload.get('chassis')
        current_lap = payload.get('current_lap', 12)
        total_laps = payload.get('total_laps', 30)
        
        # Run simulation
        strategy_result = self.simulate_strategy(predictions, current_lap, total_laps)
        
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

