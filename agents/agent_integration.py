#!/usr/bin/env python3
"""
PitWall A.I. - Agent Integration Layer
=======================================
Bridges AI agents with your existing Node.js application.
Provides async worker pool, telemetry ingestion, and decision distribution.
This module:
1. Ingests telemetry from Redis/UDP/WebSocket
2. Dispatches to specialized agents
3. Aggregates and prioritizes decisions
4. Broadcasts results to frontend

Usage:
    python agent_integration.py --config config.json
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import redis.asyncio as redis
from dataclasses import dataclass, asdict
import numpy as np
from collections import defaultdict
import traceback

logger = logging.getLogger(__name__)

# ============================================================================
# DECISION AGGREGATOR - Prioritizes and aggregates agent decisions
# ============================================================================

class DecisionAggregator:
    """
    Aggregates decisions from multiple agents and enforces conflict resolution.
    
    Rules:
    1. Safety alerts (anomalies) override all other decisions
    2. Pit strategy decisions require >85% confidence
    3. Coaching suggestions are always broadcast (no threshold)
    4. Conflicting pit recommendations use vote + confidence weighting
    5. Human-in-the-loop: Decisions requiring approval are queued for review
    """
    
    def __init__(self, redis_url: str = "redis://127.0.0.1:6379", enable_hitl: bool = True):
        self.redis = None
        self.redis_url = redis_url
        self.decision_cache = defaultdict(list)  # Per-chassis decisions
        self.conflict_log = []
        self.enable_hitl = enable_hitl
        self.hitl_manager = None
        
        # Initialize human-in-the-loop manager if enabled
        if self.enable_hitl:
            try:
                from human_in_the_loop import HumanInTheLoopManager
                self.hitl_manager = HumanInTheLoopManager(redis_url)
            except ImportError:
                logger.warning("Human-in-the-loop module not available, continuing without HITL")
                self.enable_hitl = False
    
    async def connect(self):
        self.redis = await redis.from_url(self.redis_url)
        if self.hitl_manager:
            await self.hitl_manager.connect()
    
    async def aggregate(self, decisions: List[Dict]) -> List[Dict]:
        """
        Aggregate multiple agent decisions into prioritized output.
        
        Args:
            decisions: List of decisions from agents
            
        Returns:
            Prioritized, conflict-resolved decision list ready for broadcast
        """
        if not decisions:
            return []
        
        # Categorize by type
        safety_alerts = [d for d in decisions if d.get("decision_type") == "anomaly"]
        pit_decisions = [d for d in decisions if d.get("decision_type") == "pit"]
        coaching_decisions = [d for d in decisions if d.get("decision_type") == "coach"]
        
        aggregated = []
        pending_for_approval = []
        
        # 1) Process safety alerts (check approval requirements)
        for alert in safety_alerts:
            if self.enable_hitl and self.hitl_manager:
                requires_approval, rule = await self.hitl_manager.check_approval_required(alert)
                if requires_approval:
                    pending = await self.hitl_manager.submit_decision_for_review(alert, rule)
                    pending_for_approval.append(pending)
                    logger.info(f"Safety alert {alert.get('decision_id')} queued for approval")
                    continue  # Don't broadcast until approved
            
            aggregated.append(alert)
            logger.warning(f"Safety alert: {alert.get('action')} for {alert.get('chassis')}")
        
        # 2) Resolve pit decisions (enforce threshold + conflict resolution)
        if pit_decisions:
            pit_result = self._resolve_pit_conflict(pit_decisions)
            if pit_result:
                if self.enable_hitl and self.hitl_manager:
                    requires_approval, rule = await self.hitl_manager.check_approval_required(pit_result)
                    if requires_approval:
                        pending = await self.hitl_manager.submit_decision_for_review(pit_result, rule)
                        pending_for_approval.append(pending)
                        logger.info(f"Pit decision {pit_result.get('decision_id')} queued for approval")
                    else:
                        # High confidence, auto-approved
                        if pit_result.get("confidence", 0) > 0.85:
                            aggregated.append(pit_result)
                            logger.info(f"Pit decision: {pit_result.get('action')} (confidence: {pit_result.get('confidence'):.2%})")
                else:
                    # HITL disabled, use old threshold logic
                    if pit_result.get("confidence", 0) > 0.85:
                        aggregated.append(pit_result)
                        logger.info(f"Pit decision: {pit_result.get('action')} (confidence: {pit_result.get('confidence'):.2%})")
                    else:
                        logger.debug(f"Pit decision below threshold: {pit_result}")
        
        # 3) Process coaching decisions (usually don't need approval)
        for coach in coaching_decisions:
            if self.enable_hitl and self.hitl_manager:
                requires_approval, rule = await self.hitl_manager.check_approval_required(coach)
                if requires_approval:
                    pending = await self.hitl_manager.submit_decision_for_review(coach, rule)
                    pending_for_approval.append(pending)
                    logger.info(f"Coaching decision {coach.get('decision_id')} queued for approval")
                    continue
            
            aggregated.append(coach)
            logger.debug(f"Coaching: {coach.get('action')} for {coach.get('chassis')}")
        
        # Log pending decisions
        if pending_for_approval:
            logger.info(f"{len(pending_for_approval)} decision(s) pending human approval")
        
        return aggregated
    
    def _resolve_pit_conflict(self, pit_decisions: List[Dict]) -> Optional[Dict]:
        """
        Resolve conflicting pit recommendations.
        
        Simple strategy: weighted vote by confidence.
        """
        if not pit_decisions:
            return None
        
        if len(pit_decisions) == 1:
            return pit_decisions[0]
        
        # Weighted average of pit laps
        total_weight = sum(d.get("confidence", 0.5) for d in pit_decisions)
        if total_weight == 0:
            return pit_decisions[0]
        
        weighted_decisions = []
        for d in pit_decisions:
            conf = d.get("confidence", 0.5)
            weight = conf / total_weight
            weighted_decisions.append((d, weight))
        
        # Return highest-confidence decision
        best = max(weighted_decisions, key=lambda x: x[1])
        
        # Log conflict if >1 decision
        if len(pit_decisions) > 1:
            self.conflict_log.append({
                "timestamp": datetime.utcnow().isoformat(),
                "decisions_count": len(pit_decisions),
                "chosen": best[0].get("decision_id"),
                "alternatives": [d[0].get("decision_id") for d in weighted_decisions[1:]]
            })
        
        return best[0]
    
    async def broadcast_aggregated(self, decisions: List[Dict], ws_channel: str = "agent_decisions"):
        """Broadcast aggregated decisions to Redis pub/sub for frontend"""
        for decision in decisions:
            await self.redis.publish(ws_channel, json.dumps(decision))

# ============================================================================
# TELEMETRY INGESTION ENGINE
# ============================================================================

class TelemetryIngestor:
    """
    Ingests telemetry from multiple sources and canonicalizes to agent-ready format.
    
    Supported sources:
    - Redis Stream (real-time)
    - CSV files (batch/replay)
    - UDP packets
    - HTTP POST
    """
    
    def __init__(self, redis_url: str = "redis://127.0.0.1:6379"):
        self.redis = None
        self.redis_url = redis_url
        self.buffer = defaultdict(list)  # Per-chassis buffer
        self.buffer_size = 10  # Batch before dispatching
    
    async def connect(self):
        self.redis = await redis.from_url(self.redis_url)
    
    async def ingest_from_stream(self, stream_name: str = "telemetry.stream"):
        """
        Continuously read from Redis stream and dispatch to agents with error handling.
        """
        logger.info(f"Ingesting from {stream_name}")
        last_id = "$"
        consecutive_errors = 0
        max_consecutive_errors = 10
        
        while True:
            try:
                # Ensure connection is active
                if not self.redis:
                    await self.connect()
                
                # Read from stream (block for 2s)
                try:
                    messages = await self.redis.xread(
                        "BLOCK", 2000, "COUNT", 50, "STREAMS", stream_name, last_id
                    )
                except (redis.ConnectionError, OSError) as e:
                    logger.warning(f"Redis connection error, reconnecting: {e}")
                    await asyncio.sleep(2)
                    try:
                        await self.connect()
                    except Exception as reconnect_error:
                        logger.error(f"Reconnection failed: {reconnect_error}")
                        consecutive_errors += 1
                        if consecutive_errors >= max_consecutive_errors:
                            raise
                        await asyncio.sleep(5 * consecutive_errors)
                    continue
                
                consecutive_errors = 0  # Reset on success
                
                if not messages:
                    await asyncio.sleep(0.1)
                    continue
                
                for stream, entries in messages:
                    for msg_id, fields in entries:
                        try:
                            telemetry_json = fields.get(b"data") or fields.get(b"telemetry")
                            if not telemetry_json:
                                logger.debug(f"No telemetry data in message {msg_id}")
                                continue
                            
                            try:
                                if isinstance(telemetry_json, bytes):
                                    telemetry = json.loads(telemetry_json.decode('utf-8'))
                                else:
                                    telemetry = json.loads(telemetry_json)
                            except json.JSONDecodeError as e:
                                logger.error(f"Failed to parse telemetry JSON: {e}, preview: {str(telemetry_json)[:200]}")
                                continue
                            
                            last_id = msg_id.decode() if isinstance(msg_id, bytes) else str(msg_id)
                            
                            # Dispatch to agents
                            await self._dispatch_telemetry(telemetry)
                        
                        except Exception as e:
                            logger.error(f"Telemetry parsing error: {e}", exc_info=True)
                            continue
            
            except asyncio.CancelledError:
                logger.info("Telemetry ingestion cancelled")
                break
            except Exception as e:
                consecutive_errors += 1
                logger.error(f"Stream ingest error: {e}", exc_info=True)
                if consecutive_errors >= max_consecutive_errors:
                    logger.error(f"Too many consecutive errors ({consecutive_errors}), shutting down")
                    raise
                await asyncio.sleep(1 * consecutive_errors)
    
    async def ingest_csv(self, csv_path: str, track: str):
        """Batch ingest telemetry from CSV file (for replay/testing)"""
        import csv
        
        logger.info(f"Ingesting from CSV: {csv_path}")
        
        try:
            with open(csv_path, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Normalize field names
                    telemetry = {
                        "timestamp": row.get("meta_time", datetime.utcnow().isoformat()),
                        "meta_time": row.get("meta_time", datetime.utcnow().isoformat()),
                        "track": track,
                        "chassis": row.get("chassis", "GR86-000"),
                        "lap": int(row.get("lap", 1)),
                        "lapdist_m": float(row.get("lapdist_m", 0)),
                        "speed_kmh": float(row.get("speed_kmh", 0)),
                        "accx_can": float(row.get("accx_can", 0)),
                        "accy_can": float(row.get("accy_can", 0)),
                        "throttle_pct": float(row.get("throttle_pct", 0)),
                        "brake_pct": float(row.get("brake_pct", 0)),
                        "tire_temp": float(row.get("tire_temp", 85)),
                        "tire_pressure": float(row.get("tire_pressure", 28.5)),
                        "yaw_rate": float(row.get("yaw_rate", 0)),
                        "rpm": int(row.get("rpm", 6000))
                    }
                    
                    await self._dispatch_telemetry(telemetry)
                    await asyncio.sleep(0.01)  # Throttle to simulate real-time
        
        except Exception as e:
            logger.error(f"CSV ingest error: {e}")
    
    async def _dispatch_telemetry(self, telemetry: Dict):
        """Create task and dispatch to orchestrator with error handling"""
        try:
            chassis = telemetry.get("chassis")
            if not chassis:
                logger.warning("Telemetry missing chassis identifier")
                return
            
            # Buffer and batch
            self.buffer[chassis].append(telemetry)
            
            if len(self.buffer[chassis]) >= self.buffer_size:
                batch = self.buffer[chassis]
                self.buffer[chassis] = []
                
                task = {
                    "task_id": f"task-{datetime.utcnow().timestamp()}",
                    "task_type": "predictor",
                    "priority": "normal",
                    "track": telemetry.get("track", "unknown"),
                    "chassis": chassis,
                    "payload": {
                        "sample": telemetry,
                        "batch_size": len(batch)
                    },
                    "created_at": datetime.utcnow().isoformat()
                }
                
                # Push to tasks stream for orchestrator with retry
                try:
                    await self.redis.xadd("tasks.stream", "*", "task", json.dumps(task))
                except (redis.ConnectionError, OSError) as e:
                    logger.error(f"Failed to dispatch task: {e}")
                    # Re-add to buffer for retry
                    self.buffer[chassis].extend(batch)
                    raise
                except Exception as e:
                    logger.error(f"Unexpected error dispatching task: {e}", exc_info=True)
                    raise
        except Exception as e:
            logger.error(f"Error in _dispatch_telemetry: {e}", exc_info=True)
            # Don't re-raise to prevent breaking the ingestion loop

# ============================================================================
# AGENT WORKER POOL - Manages multiple agent instances
# ============================================================================

class AgentWorkerPool:
    """
    Manages a pool of agent workers.
    
    Spins up multiple instances of each agent type and coordinates
    their lifecycle and communication.
    """
    
    def __init__(self, redis_url: str = "redis://127.0.0.1:6379"):
        self.redis = None
        self.redis_url = redis_url
        self.workers = {}
        self.tasks = []
    
    async def connect(self):
        self.redis = await redis.from_url(self.redis_url)
    
    async def spawn_worker(self, agent_type: str, agent_id: str, config: Dict = None):
        """
        Spawn a new agent worker process.
        
        Args:
            agent_type: "strategy", "coach", "anomaly"
            agent_id: Unique ID for this worker
            config: Optional configuration overrides
        """
        logger.info(f"Spawning {agent_type} worker: {agent_id}")
        
        # Import appropriate agent class
        import sys
        import os
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        
        if agent_type == "strategy":
            from ai_agents import StrategyAgent
            agent = StrategyAgent(agent_id, self.redis_url, tracks=config.get("tracks", []) if config else [])
        elif agent_type == "coach":
            from ai_agents import CoachAgent
            agent = CoachAgent(agent_id, self.redis_url)
        elif agent_type == "anomaly":
            from ai_agents import AnomalyDetectiveAgent
            agent = AnomalyDetectiveAgent(agent_id, self.redis_url)
        else:
            raise ValueError(f"Unknown agent type: {agent_type}")
        
        # Connect and start listening
        await agent.connect()
        
        # Create async task for this agent
        task = asyncio.create_task(agent.listen_for_tasks())
        self.workers[agent_id] = {
            "agent": agent,
            "task": task,
            "type": agent_type,
            "started_at": datetime.utcnow().isoformat()
        }
        
        self.tasks.append(task)
    
    async def spawn_default_fleet(self, redis_url: str):
        """Spawn default set of agents for typical use"""
        configs = {
            "strategy": {"tracks": ["cota", "road_america", "sonoma", "vir", "sebring", "barber", "indianapolis"]},
            "coach": {},
            "anomaly": {}
        }
        
        for agent_type, config in configs.items():
            await self.spawn_worker(agent_type, f"{agent_type}-01", config)
    
    async def wait_all(self):
        """Wait for all worker tasks to complete"""
        if self.tasks:
            await asyncio.gather(*self.tasks, return_exceptions=True)
    
    async def shutdown(self):
        """Gracefully shutdown all workers"""
        logger.info("Shutting down agent fleet...")
        for agent_id, info in self.workers.items():
            await info["agent"].disconnect()
        
        for task in self.tasks:
            task.cancel()

# ============================================================================
# MAIN INTEGRATION COORDINATOR
# ============================================================================

class AgentIntegration:
    """
    Main coordinator that ties together telemetry ingestion,
    agent workers, and decision distribution.
    """
    
    def __init__(self, redis_url: str = "redis://127.0.0.1:6379"):
        self.redis_url = redis_url
        self.ingestor = TelemetryIngestor(redis_url)
        self.pool = AgentWorkerPool(redis_url)
        self.aggregator = DecisionAggregator(redis_url)
        self.redis = None
    
    async def connect(self):
        """Initialize all components"""
        self.redis = await redis.from_url(self.redis_url)
        await self.ingestor.connect()
        await self.pool.connect()
        await self.aggregator.connect()
        logger.info("Agent integration connected")
    
    async def run(self, mode: str = "live"):
        """
        Main run loop.
        
        Args:
            mode: "live" (stream ingestion) or "replay" (CSV batch)
        """
        logger.info(f"Starting agent integration in {mode} mode")
        
        # Spawn worker fleet
        await self.pool.spawn_default_fleet(self.redis_url)
        
        # Start telemetry ingestion
        if mode == "live":
            ingest_task = asyncio.create_task(self.ingestor.ingest_from_stream())
        else:
            # For testing: ingest from CSV
            ingest_task = asyncio.create_task(
                self.ingestor.ingest_csv("path/to/telemetry.csv", "cota")
            )
        
        # Start decision aggregation loop
        agg_task = asyncio.create_task(self._aggregation_loop())
        
        try:
            await asyncio.gather(ingest_task, agg_task, *self.pool.tasks)
        except KeyboardInterrupt:
            logger.info("Interrupt received")
        finally:
            await self.shutdown()
    
    async def _aggregation_loop(self):
        """
        Continuously consume decisions and aggregate them with error handling.
        """
        logger.info("Decision aggregation loop started")
        consecutive_errors = 0
        max_consecutive_errors = 10
        
        while True:
            try:
                # Ensure connection is active
                if not self.redis:
                    await self.connect()
                
                # Read from results stream
                try:
                    results = await self.redis.xread(
                        "BLOCK", 5000, "COUNT", 10, "STREAMS", "results.stream", "$"
                    )
                except (redis.ConnectionError, OSError) as e:
                    logger.warning(f"Redis connection error in aggregation loop: {e}")
                    await asyncio.sleep(2)
                    try:
                        await self.connect()
                    except Exception as reconnect_error:
                        logger.error(f"Reconnection failed: {reconnect_error}")
                        consecutive_errors += 1
                        if consecutive_errors >= max_consecutive_errors:
                            raise
                        await asyncio.sleep(5 * consecutive_errors)
                    continue
                
                consecutive_errors = 0  # Reset on success
                
                if not results:
                    await asyncio.sleep(0.1)
                    continue
                
                decisions = []
                for stream, entries in results:
                    for msg_id, fields in entries:
                        try:
                            result_json = fields.get(b"result")
                            if not result_json:
                                continue
                            
                            try:
                                if isinstance(result_json, bytes):
                                    decision = json.loads(result_json.decode('utf-8'))
                                else:
                                    decision = json.loads(result_json)
                                decisions.append(decision)
                            except json.JSONDecodeError as e:
                                logger.error(f"Failed to parse decision JSON: {e}, preview: {str(result_json)[:200]}")
                                continue
                        except Exception as e:
                            logger.error(f"Error processing result message: {e}", exc_info=True)
                            continue
                
                # Aggregate and broadcast
                if decisions:
                    try:
                        aggregated = await self.aggregator.aggregate(decisions)
                        await self.aggregator.broadcast_aggregated(aggregated)
                    except Exception as e:
                        logger.error(f"Error aggregating/broadcasting decisions: {e}", exc_info=True)
                        # Continue processing even if aggregation fails
            
            except asyncio.CancelledError:
                logger.info("Aggregation loop cancelled")
                break
            except Exception as e:
                consecutive_errors += 1
                logger.error(f"Aggregation loop error: {e}", exc_info=True)
                if consecutive_errors >= max_consecutive_errors:
                    logger.error(f"Too many consecutive errors ({consecutive_errors}), shutting down")
                    raise
                await asyncio.sleep(1 * consecutive_errors)
    
    async def shutdown(self):
        """Graceful shutdown"""
        await self.pool.shutdown()
        if self.redis:
            await self.redis.close()
        logger.info("Agent integration shut down")

# ============================================================================
# CLI AND TESTING
# ============================================================================

async def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="PitWall Agent Integration")
    parser.add_argument("--redis-url", default="redis://127.0.0.1:6379")
    parser.add_argument("--mode", default="live", choices=["live", "replay"])
    args = parser.parse_args()
    
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - [%(name)s] - %(levelname)s - %(message)s'
    )
    
    integration = AgentIntegration(args.redis_url)
    await integration.connect()
    await integration.run(mode=args.mode)

if __name__ == "__main__":
    asyncio.run(main())

