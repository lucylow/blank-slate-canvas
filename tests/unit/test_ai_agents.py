#!/usr/bin/env python3
"""
Test script for AI agents with demo_data.json
==============================================
Loads demo data, ingests it into Redis, runs agents, and collects results.
"""

import asyncio
import json
import logging
import os
import sys
import tarfile
import tempfile
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

import redis.asyncio as redis
import numpy as np

# Add ai_agents directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ai_agents'))

from agent_integration import AgentIntegration
from ai_agents import StrategyAgent, CoachAgent, AnomalyDetectiveAgent

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(name)s] - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DemoDataLoader:
    """Loads and transforms demo data from tar archive"""
    
    def __init__(self, demo_data_path: str):
        self.demo_data_path = demo_data_path
        self.extracted_path = None
    
    def extract(self):
        """Extract demo_data.json tar archive"""
        if self.demo_data_path.endswith('.tar'):
            # Already extracted or is tar
            pass
        elif os.path.isdir(self.demo_data_path):
            self.extracted_path = self.demo_data_path
        else:
            # Extract tar archive
            extract_dir = tempfile.mkdtemp(prefix='demo_data_')
            with tarfile.open(self.demo_data_path, 'r') as tar:
                tar.extractall(extract_dir)
            self.extracted_path = os.path.join(extract_dir, 'demo_data')
            logger.info(f"Extracted demo data to {self.extracted_path}")
        
        return self.extracted_path or self.demo_data_path
    
    def load_tracks(self) -> Dict:
        """Load all track data"""
        base_path = self.extracted_path or self.demo_data_path
        if not os.path.isdir(base_path):
            base_path = os.path.join(os.path.dirname(self.demo_data_path), 'extracted_demo_data', 'demo_data')
        
        tracks = {}
        
        # Load index
        index_path = os.path.join(base_path, 'tracks_index.json')
        if os.path.exists(index_path):
            with open(index_path) as f:
                index = json.load(f)
                for track_info in index.get('tracks', []):
                    track_id = track_info['track_id']
                    track_file = os.path.join(base_path, f"{track_id}_demo.json")
                    if os.path.exists(track_file):
                        with open(track_file) as tf:
                            tracks[track_id] = json.load(tf)
        
        return tracks
    
    def transform_telemetry(self, telemetry_samples: List[Dict], track_id: str) -> List[Dict]:
        """
        Transform telemetry samples into agent-compatible frames.
        
        Groups samples by timestamp and vehicle_id, then maps fields.
        """
        # Group by (timestamp, vehicle_id)
        frames_dict = defaultdict(dict)
        
        for sample in telemetry_samples:
            timestamp = sample.get('timestamp') or sample.get('meta_time')
            vehicle_id = sample.get('vehicle_id') or sample.get('original_vehicle_id', 'GR86-000')
            
            key = (timestamp, vehicle_id)
            frames_dict[key][sample.get('telemetry_name')] = sample.get('telemetry_value')
            
            # Store metadata
            if 'meta_time' in sample:
                frames_dict[key]['meta_time'] = sample['meta_time']
            frames_dict[key]['vehicle_id'] = vehicle_id
            if 'lap' in sample:
                frames_dict[key]['lap'] = sample.get('lap', 1)
        
        # Transform to agent format
        transformed = []
        for (timestamp, vehicle_id), frame_data in frames_dict.items():
            # Extract chassis from vehicle_id (e.g., "GR86-002-2" -> "GR86-002")
            chassis = vehicle_id.split('-')[:2]
            chassis = '-'.join(chassis) if len(chassis) >= 2 else vehicle_id
            
            # Map fields to expected format
            telemetry = {
                'timestamp': timestamp or frame_data.get('meta_time', datetime.utcnow().isoformat()),
                'meta_time': frame_data.get('meta_time', timestamp or datetime.utcnow().isoformat()),
                'track': track_id,
                'chassis': chassis,
                'lap': int(frame_data.get('lap', 1)),
                'lapdist_m': 0.0,  # Not in demo data
                'speed_kmh': float(frame_data.get('speed', 0)) * 3.6 if 'speed' in frame_data else 150.0,  # m/s to km/h
                'accx_can': float(frame_data.get('accx_can', 0.0)),
                'accy_can': float(frame_data.get('accy_can', 0.0)),
                'throttle_pct': float(frame_data.get('ath', 0.0)),  # Assumed throttle percentage
                'brake_pct': float((frame_data.get('pbrake_f', 0.0) + frame_data.get('pbrake_r', 0.0)) / 2),  # Average brake pressure
                'tire_temp': 90.0,  # Default
                'tire_pressure': 28.5,  # Default
                'yaw_rate': abs(float(frame_data.get('accy_can', 0.0))),  # Approximate from lateral accel
                'rpm': int(frame_data.get('nmot', 6000)) if 'nmot' in frame_data else 6000
            }
            
            transformed.append(telemetry)
        
        return transformed


class AgentTester:
    """Test runner for AI agents"""
    
    def __init__(self, redis_url: str = "redis://127.0.0.1:6379"):
        self.redis_url = redis_url
        self.redis = None
        self.results = []
        self.decisions = []
        self.agents_started = False
        
    async def connect(self):
        """Connect to Redis"""
        try:
            self.redis = await redis.from_url(self.redis_url)
            await self.redis.ping()
            logger.info("Connected to Redis")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            logger.info("Make sure Redis is running: docker run -p 6379:6379 redis:7")
            raise
    
    async def clear_redis(self):
        """Clear test data from Redis"""
        streams = ['telemetry.stream', 'tasks.stream', 'results.stream']
        for stream in streams:
            try:
                await self.redis.delete(stream)
            except:
                pass
        
        # Clear agent registry
        await self.redis.delete('agents.registry')
        logger.info("Cleared Redis test data")
    
    async def start_agents(self):
        """Start agent workers"""
        if self.agents_started:
            return
        
        logger.info("Starting agent workers...")
        
        # Create agents
        strategy_agent = StrategyAgent(
            "strategy-01", 
            self.redis_url,
            tracks=["cota", "road_america", "sonoma", "vir", "sebring", "barber", "indianapolis"]
        )
        coach_agent = CoachAgent("coach-01", self.redis_url)
        anomaly_agent = AnomalyDetectiveAgent("anomaly-01", self.redis_url)
        
        # Connect agents
        await strategy_agent.connect()
        await coach_agent.connect()
        await anomaly_agent.connect()
        
        # Start listening in background
        strategy_task = asyncio.create_task(strategy_agent.listen_for_tasks())
        coach_task = asyncio.create_task(coach_agent.listen_for_tasks())
        anomaly_task = asyncio.create_task(anomaly_agent.listen_for_tasks())
        
        self.agent_tasks = [strategy_task, coach_task, anomaly_task]
        self.agents_started = True
        
        # Give agents time to register
        await asyncio.sleep(2)
        logger.info("Agents started")
    
    async def ingest_telemetry(self, telemetry_frames: List[Dict], track_id: str):
        """Ingest telemetry into Redis stream"""
        logger.info(f"Ingesting {len(telemetry_frames)} telemetry frames for track {track_id}")
        
        for frame in telemetry_frames:
            # Add to telemetry stream
            await self.redis.xadd(
                "telemetry.stream",
                "*",
                "data",
                json.dumps(frame)
            )
        
        # Wait a bit for processing
        await asyncio.sleep(1)
        
        # Create tasks for orchestrator
        # Group frames by chassis
        chassis_frames = defaultdict(list)
        for frame in telemetry_frames:
            chassis_frames[frame['chassis']].append(frame)
        
        # Create tasks
        for chassis, frames in chassis_frames.items():
            if frames:
                task = {
                    "task_id": f"task-{datetime.utcnow().timestamp()}-{chassis}",
                    "task_type": "predictor",
                    "priority": "normal",
                    "track": track_id,
                    "chassis": chassis,
                    "payload": {
                        "sample": frames[0],  # Use first frame as sample
                        "batch_size": len(frames)
                    },
                    "created_at": datetime.utcnow().isoformat()
                }
                
                # Push to tasks stream
                await self.redis.xadd("tasks.stream", "*", "task", json.dumps(task))
                
                # Also push directly to agent inboxes (simpler for testing)
                task_json = json.dumps(task)
                await self.redis.rpush("agent:strategy-01:inbox", task_json)
                await self.redis.rpush("agent:coach-01:inbox", task_json)
                await self.redis.rpush("agent:anomaly-01:inbox", task_json)
        
        logger.info(f"Created tasks for {len(chassis_frames)} chassis")
    
    async def collect_results(self, timeout: int = 30):
        """Collect decisions from results stream"""
        logger.info(f"Collecting results (timeout: {timeout}s)...")
        
        start_time = datetime.utcnow()
        collected = []
        
        last_id = "0"
        
        while (datetime.utcnow() - start_time).total_seconds() < timeout:
            try:
                # Read from results stream
                results = await self.redis.xread(
                    {"results.stream": last_id},
                    count=10,
                    block=2000
                )
                
                if results:
                    for stream, entries in results:
                        for msg_id, fields in entries:
                            result_json = fields.get(b'result')
                            if result_json:
                                decision = json.loads(result_json)
                                collected.append(decision)
                                last_id = msg_id.decode()
                
                # Give agents time to process
                await asyncio.sleep(0.5)
            
            except Exception as e:
                logger.error(f"Error collecting results: {e}")
                break
        
        self.decisions = collected
        logger.info(f"Collected {len(collected)} decisions")
        return collected
    
    async def get_agent_registry(self):
        """Get agent registry status"""
        try:
            registry = await self.redis.hgetall("agents.registry")
            return {k.decode(): json.loads(v.decode()) for k, v in registry.items()}
        except:
            return {}
    
    async def generate_report(self) -> str:
        """Generate markdown test report"""
        report = []
        report.append("# AI Agents Test Report")
        report.append("")
        report.append(f"**Test Date:** {datetime.utcnow().isoformat()}")
        report.append(f"**Redis URL:** {self.redis_url}")
        report.append("")
        
        # Agent Registry
        registry = await self.get_agent_registry()
        report.append("## Agent Registry")
        report.append("")
        if registry:
            report.append("| Agent ID | Type | Status | Tracks |")
            report.append("|----------|------|--------|--------|")
            for agent_id, info in registry.items():
                tracks_str = info.get('tracks', '[]')
                tracks = json.loads(tracks_str) if isinstance(tracks_str, str) else tracks_str
                report.append(f"| {agent_id} | {info.get('type', 'N/A')} | {info.get('status', 'N/A')} | {len(tracks)} tracks |")
        else:
            report.append("No agents registered.")
        report.append("")
        
        # Decisions Summary
        report.append("## Decisions Summary")
        report.append("")
        report.append(f"**Total Decisions:** {len(self.decisions)}")
        report.append("")
        
        if self.decisions:
            # Group by decision type
            by_type = defaultdict(list)
            for decision in self.decisions:
                decision_type = decision.get('type', 'unknown')
                by_type[decision_type].append(decision)
            
            report.append("### By Decision Type")
            report.append("")
            for decision_type, decisions in by_type.items():
                report.append(f"- **{decision_type}**: {len(decisions)} decisions")
            report.append("")
            
            # Group by agent
            by_agent = defaultdict(list)
            for decision in self.decisions:
                agent_id = decision.get('agent_id', 'unknown')
                by_agent[agent_id].append(decision)
            
            report.append("### By Agent")
            report.append("")
            for agent_id, decisions in by_agent.items():
                report.append(f"- **{agent_id}**: {len(decisions)} decisions")
            report.append("")
            
            # Decision Details
            report.append("## Decision Details")
            report.append("")
            report.append("| Decision ID | Agent | Type | Action | Confidence | Track | Chassis | Timestamp |")
            report.append("|-------------|-------|------|--------|------------|-------|---------|-----------|")
            
            for decision in sorted(self.decisions, key=lambda x: x.get('created_at', ''), reverse=True):
                decision_id = decision.get('decision_id', 'N/A')[:8]
                agent_id = decision.get('agent_id', 'N/A')
                decision_type = decision.get('type', 'N/A')
                action = decision.get('action', 'N/A')[:50]
                confidence = decision.get('confidence', 0.0)
                track = decision.get('track', 'N/A')
                chassis = decision.get('chassis', 'N/A')
                timestamp = decision.get('created_at', 'N/A')[:19]
                
                report.append(f"| {decision_id} | {agent_id} | {decision_type} | {action} | {confidence:.2%} | {track} | {chassis} | {timestamp} |")
            
            report.append("")
            
            # Sample Decisions (first 10)
            report.append("## Sample Decisions (First 10)")
            report.append("")
            for i, decision in enumerate(self.decisions[:10], 1):
                report.append(f"### Decision {i}: {decision.get('agent_id')} - {decision.get('action')}")
                report.append("")
                report.append(f"- **Type**: {decision.get('type', 'N/A')}")
                report.append(f"- **Confidence**: {decision.get('confidence', 0.0):.2%}")
                report.append(f"- **Track**: {decision.get('track', 'N/A')}")
                report.append(f"- **Chassis**: {decision.get('chassis', 'N/A')}")
                report.append(f"- **Timestamp**: {decision.get('created_at', 'N/A')}")
                report.append("")
        else:
            report.append("No decisions collected during test.")
            report.append("")
        
        # Test Statistics
        report.append("## Test Statistics")
        report.append("")
        report.append("- Agents Started: ✓" if self.agents_started else "- Agents Started: ✗")
        report.append(f"- Decisions Collected: {len(self.decisions)}")
        report.append(f"- Agents Registered: {len(registry)}")
        report.append("")
        
        return "\n".join(report)
    
    async def shutdown(self):
        """Cleanup"""
        if self.agents_started and hasattr(self, 'agent_tasks'):
            for task in self.agent_tasks:
                task.cancel()
        if self.redis:
            await self.redis.close()


async def main():
    """Main test function"""
    # Paths
    demo_data_path = os.path.join(os.path.dirname(__file__), 'demo_data.json')
    if not os.path.exists(demo_data_path):
        # Check if already extracted
        extracted_path = os.path.join(os.path.dirname(__file__), 'extracted_demo_data', 'demo_data')
        if os.path.exists(extracted_path):
            demo_data_path = extracted_path
    
    redis_url = "redis://127.0.0.1:6379"
    
    # Initialize
    loader = DemoDataLoader(demo_data_path)
    tester = AgentTester(redis_url)
    
    try:
        # Connect to Redis
        await tester.connect()
        await tester.clear_redis()
        
        # Load demo data
        logger.info("Loading demo data...")
        extract_path = loader.extract()
        tracks = loader.load_tracks()
        logger.info(f"Loaded {len(tracks)} tracks")
        
        # Start agents
        await tester.start_agents()
        
        # Process each track with race data
        total_frames = 0
        for track_id, track_data in tracks.items():
            races = track_data.get('races', [])
            if not races:
                logger.info(f"Skipping {track_id}: no race data")
                continue
            
            logger.info(f"Processing {track_id}: {len(races)} races")
            
            for race in races:
                telemetry_samples = race.get('telemetry_sample', [])
                if not telemetry_samples:
                    continue
                
                # Transform telemetry
                telemetry_frames = loader.transform_telemetry(telemetry_samples, track_id)
                logger.info(f"  Race {race.get('race_number')}: {len(telemetry_frames)} frames")
                
                # Ingest telemetry
                await tester.ingest_telemetry(telemetry_frames, track_id)
                total_frames += len(telemetry_frames)
        
        logger.info(f"Total frames ingested: {total_frames}")
        
        # Wait for agents to process
        logger.info("Waiting for agents to process...")
        await asyncio.sleep(5)
        
        # Collect results
        decisions = await tester.collect_results(timeout=30)
        
        # Generate report
        report = await tester.generate_report()
        
        # Write report
        report_path = os.path.join(os.path.dirname(__file__), 'ai_agents_test_results.md')
        with open(report_path, 'w') as f:
            f.write(report)
        
        logger.info(f"Test report written to {report_path}")
        print(f"\n{'='*60}")
        print("TEST COMPLETE")
        print(f"{'='*60}")
        print(f"Total Frames Processed: {total_frames}")
        print(f"Decisions Collected: {len(decisions)}")
        print(f"Report: {report_path}")
        print(f"{'='*60}\n")
        
    except Exception as e:
        logger.error(f"Test failed: {e}", exc_info=True)
        raise
    finally:
        await tester.shutdown()


if __name__ == "__main__":
    asyncio.run(main())

