#!/usr/bin/env python3
"""
Test AI Agents on All 7 Track Maps
====================================
Generates telemetry data for each of the 7 tracks and tests all agent types:
- Strategy Agent (pit decisions)
- Coach Agent (driver coaching)
- Anomaly Detective (safety alerts)

Tracks tested:
1. Barber Motorsports Park (barber)
2. Circuit of the Americas (cota)
3. Indianapolis Motor Speedway (indianapolis)
4. Road America (road_america)
5. Sebring International Raceway (sebring)
6. Sonoma Raceway (sonoma)
7. Virginia International Raceway (vir)
"""

import asyncio
import json
import redis.asyncio as redis
from datetime import datetime
import numpy as np
from typing import Dict, List
import time

# Track configurations
TRACKS = {
    "barber": "Barber Motorsports Park",
    "cota": "Circuit of the Americas",
    "indianapolis": "Indianapolis Motor Speedway",
    "road_america": "Road America",
    "sebring": "Sebring International Raceway",
    "sonoma": "Sonoma Raceway",
    "vir": "Virginia International Raceway"
}

class TrackTester:
    """Test AI agents on all 7 tracks"""
    
    def __init__(self, redis_url: str = "redis://127.0.0.1:6379"):
        self.redis_url = redis_url
        self.redis = None
        self.results = {track: [] for track in TRACKS.keys()}
    
    async def connect(self):
        """Connect to Redis"""
        self.redis = await redis.from_url(self.redis_url)
        print("✓ Connected to Redis")
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis:
            await self.redis.close()
    
    def generate_telemetry(self, track: str, lap: int, lapdist_m: float, 
                          scenario: str = "normal") -> Dict:
        """
        Generate realistic telemetry data for a track.
        
        Scenarios:
        - normal: Regular racing conditions
        - high_wear: High tire wear (triggers pit strategy)
        - aggressive: Aggressive driving (triggers coaching)
        - anomaly: Sensor glitch or incident (triggers anomaly detection)
        """
        base_speed = {
            "barber": 180,
            "cota": 210,
            "indianapolis": 250,
            "road_america": 200,
            "sebring": 190,
            "sonoma": 175,
            "vir": 185
        }
        
        # Initialize defaults
        accx_can = np.random.uniform(-0.5, 0.5)
        accy_can = np.random.uniform(-1.2, 1.2)
        brake_pct = np.random.uniform(0, 80)
        
        if scenario == "high_wear":
            tire_wear_factor = 0.4  # High wear
            speed = base_speed.get(track, 190) - 15  # Slower due to wear
            tire_temp = 105  # Overheated
        elif scenario == "aggressive":
            tire_wear_factor = 0.15
            speed = base_speed.get(track, 190) + 10
            accy_can = 1.5  # High lateral G
            brake_pct = 98  # Aggressive braking
            tire_temp = 100
        elif scenario == "anomaly":
            tire_wear_factor = 0.2
            speed = base_speed.get(track, 190)
            accx_can = 2.5  # Implausible acceleration (sensor glitch)
            tire_temp = 115  # Overheating
        else:  # normal
            tire_wear_factor = 0.25
            speed = base_speed.get(track, 190)
            tire_temp = 90
        
        telemetry = {
            "timestamp": datetime.utcnow().isoformat(),
            "meta_time": datetime.utcnow().isoformat(),
            "track": track,
            "chassis": f"GR86-{lap%10:02d}",
            "lap": lap,
            "lapdist_m": lapdist_m,
            "speed_kmh": speed + np.random.uniform(-5, 5),
            "accx_can": accx_can,
            "accy_can": accy_can,
            "throttle_pct": 70 + np.random.uniform(0, 30),
            "brake_pct": brake_pct,
            "tire_temp": tire_temp + np.random.uniform(-3, 3),
            "tire_pressure": 28.0 + np.random.uniform(-0.5, 0.5),
            "yaw_rate": np.random.uniform(-0.5, 0.5),
            "rpm": 5500 + np.random.randint(0, 2000),
            "sector": int((lapdist_m % 1000) / 333) + 1
        }
        
        return telemetry
    
    async def send_telemetry(self, telemetry: Dict):
        """Send telemetry to Redis stream"""
        await self.redis.xadd(
            "telemetry.stream",
            "*",
            "data",
            json.dumps(telemetry)
        )
    
    async def test_track(self, track: str, track_name: str):
        """Test all agent types on a specific track"""
        print(f"\n{'='*60}")
        print(f"Testing: {track_name} ({track})")
        print(f"{'='*60}")
        
        scenarios = [
            ("normal", "Normal racing conditions"),
            ("high_wear", "High tire wear (should trigger pit strategy)"),
            ("aggressive", "Aggressive driving (should trigger coaching)"),
            ("anomaly", "Sensor anomaly (should trigger anomaly detection)")
        ]
        
        for scenario, description in scenarios:
            print(f"\n  Scenario: {description}")
            
            # Generate 5 telemetry samples for this scenario
            for i in range(5):
                lap = 10 + i
                lapdist_m = i * 200
                
                telemetry = self.generate_telemetry(
                    track=track,
                    lap=lap,
                    lapdist_m=lapdist_m,
                    scenario=scenario
                )
                
                await self.send_telemetry(telemetry)
                print(f"    ✓ Sent telemetry: Lap {lap}, Distance {lapdist_m:.0f}m")
                
                # Small delay to simulate real-time
                await asyncio.sleep(0.1)
        
        # Wait for agents to process
        print(f"\n  Waiting for agent decisions...")
        await asyncio.sleep(2)
        
        # Collect decisions for this track
        decisions = await self.collect_decisions(track)
        self.results[track] = decisions
        
        print(f"  ✓ Collected {len(decisions)} decisions")
    
    async def collect_decisions(self, track: str) -> List[Dict]:
        """Collect agent decisions for a specific track"""
        decisions = []
        
        # Read from results stream
        try:
            messages = await self.redis.xread(
                "BLOCK", 1000, "COUNT", 50, "STREAMS", "results.stream", "0"
            )
            
            if messages:
                for stream, entries in messages:
                    for msg_id, fields in entries:
                        result_json = fields.get(b"result")
                        if result_json:
                            decision = json.loads(result_json)
                            if decision.get("track") == track:
                                decisions.append(decision)
        except Exception as e:
            print(f"    Warning: Error collecting decisions: {e}")
        
        return decisions
    
    async def run_all_tests(self):
        """Run tests on all 7 tracks"""
        print("\n" + "="*60)
        print("AI AGENTS TEST - 7 TRACK MAPS")
        print("="*60)
        print("\nThis will test:")
        print("  • Strategy Agent (pit decisions)")
        print("  • Coach Agent (driver coaching)")
        print("  • Anomaly Detective (safety alerts)")
        print("\nTracks:")
        for track, name in TRACKS.items():
            print(f"  • {name} ({track})")
        
        print("\n⚠️  Make sure agents are running:")
        print("   Terminal 1: python ai_agents.py --mode strategy")
        print("   Terminal 2: python ai_agents.py --mode coach")
        print("   Terminal 3: python ai_agents.py --mode anomaly")
        print("   Terminal 4: python agent_integration.py --mode live")
        
        input("\nPress Enter to start testing...")
        
        # Test each track
        for track, track_name in TRACKS.items():
            await self.test_track(track, track_name)
            await asyncio.sleep(1)  # Brief pause between tracks
    
    def print_summary(self):
        """Print summary of all test results"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        total_decisions = 0
        by_type = {"pit": 0, "coach": 0, "anomaly": 0}
        
        for track, track_name in TRACKS.items():
            decisions = self.results[track]
            total_decisions += len(decisions)
            
            print(f"\n{track_name} ({track}):")
            print(f"  Total decisions: {len(decisions)}")
            
            for decision in decisions:
                decision_type = decision.get("decision_type", "unknown")
                if decision_type in by_type:
                    by_type[decision_type] += 1
                
                print(f"    • {decision.get('action', 'N/A')}")
                print(f"      Type: {decision_type}, Confidence: {decision.get('confidence', 0):.1%}")
        
        print(f"\n{'='*60}")
        print(f"TOTAL DECISIONS: {total_decisions}")
        print(f"  • Pit Strategy: {by_type['pit']}")
        print(f"  • Coaching: {by_type['coach']}")
        print(f"  • Anomalies: {by_type['anomaly']}")
        print(f"{'='*60}\n")
    
    async def monitor_agents(self, duration: int = 30):
        """Monitor agent decisions in real-time"""
        print(f"\nMonitoring agent decisions for {duration} seconds...")
        print("Press Ctrl+C to stop early\n")
        
        start_time = time.time()
        decision_count = 0
        
        try:
            while time.time() - start_time < duration:
                messages = await self.redis.xread(
                    "BLOCK", 2000, "COUNT", 10, "STREAMS", "results.stream", "$"
                )
                
                if messages:
                    for stream, entries in messages:
                        for msg_id, fields in entries:
                            result_json = fields.get(b"result")
                            if result_json:
                                decision = json.loads(result_json)
                                decision_count += 1
                                
                                print(f"[{decision.get('track', 'unknown')}] "
                                      f"{decision.get('action', 'N/A')} "
                                      f"(Confidence: {decision.get('confidence', 0):.1%})")
                
                await asyncio.sleep(0.5)
        
        except KeyboardInterrupt:
            print("\n\nMonitoring stopped by user")
        
        print(f"\n✓ Collected {decision_count} decisions during monitoring\n")

async def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Test AI Agents on 7 Track Maps")
    parser.add_argument("--redis-url", default="redis://127.0.0.1:6379")
    parser.add_argument("--mode", default="test", choices=["test", "monitor"])
    parser.add_argument("--track", help="Test single track only")
    args = parser.parse_args()
    
    tester = TrackTester(args.redis_url)
    
    try:
        await tester.connect()
        
        if args.mode == "monitor":
            await tester.monitor_agents()
        elif args.track:
            # Test single track
            if args.track in TRACKS:
                await tester.test_track(args.track, TRACKS[args.track])
                tester.print_summary()
            else:
                print(f"Error: Unknown track '{args.track}'")
                print(f"Available tracks: {', '.join(TRACKS.keys())}")
        else:
            # Test all tracks
            await tester.run_all_tests()
            tester.print_summary()
    
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await tester.disconnect()

if __name__ == "__main__":
    asyncio.run(main())

