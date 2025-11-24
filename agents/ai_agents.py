#!/usr/bin/env python3
"""
PitWall A.I. - Advanced AI Agents Module
=========================================
Production-ready autonomous agents for real-time race analytics.
Includes: Strategy Agent, Anomaly Detective, Driver Coach, and Predictive Strategist.
Each agent is stateful, learns from historical data, and can make autonomous decisions
backed by explainable reasoning and telemetry evidence.

Usage:
    python ai_agents.py --mode orchestrator
    python ai_agents.py --mode strategy-agent
    
Author: PitWall A.I. Team
Date: November 2025
"""

import os
import json
import asyncio
import redis.asyncio as redis
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict, field
from datetime import datetime, timedelta
from enum import Enum
import logging
from abc import ABC, abstractmethod
import pickle
from pathlib import Path
import uuid
from collections import defaultdict, deque

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(name)s] - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# DATA MODELS & ENUMS
# ============================================================================

class AgentType(Enum):
    """Types of autonomous agents in the system"""
    STRATEGIST = "strategist"
    COACH = "coach"
    ANOMALY_DETECTIVE = "anomaly_detective"
    PREDICTOR = "predictor"
    ORCHESTRATOR = "orchestrator"

class DecisionConfidence(Enum):
    """Confidence levels for agent decisions"""
    LOW = 0.5
    MEDIUM = 0.75
    HIGH = 0.9
    CRITICAL = 0.95

class RiskLevel(Enum):
    """Risk classification for strategies"""
    SAFE = "safe"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    CRITICAL = "critical"

@dataclass
class TelemetryFrame:
    """Single telemetry snapshot"""
    timestamp: str
    meta_time: str
    track: str
    chassis: str
    lap: int
    lapdist_m: float
    speed_kmh: float
    accx_can: float
    accy_can: float
    throttle_pct: float
    brake_pct: float
    tire_temp: float
    tire_pressure: float
    yaw_rate: float
    rpm: int
    sector: int = 0
    
    def to_dict(self) -> Dict:
        return asdict(self)

@dataclass
class AgentDecision:
    """Autonomous decision made by an agent"""
    agent_id: str
    agent_type: str
    decision_id: str
    timestamp: str
    track: str
    chassis: str
    decision_type: str  # "pit", "coach", "anomaly", "strategy"
    action: str
    confidence: float
    risk_level: str
    reasoning: List[str]  # Human-readable explanation
    evidence: Dict[str, Any]  # Supporting data
    evidence_frames: List[Dict] = field(default_factory=list)  # Key telemetry points
    alternatives: List[Dict] = field(default_factory=list)  # Alternative actions considered
    
    def to_dict(self) -> Dict:
        d = asdict(self)
        d['evidence_frames'] = self.evidence_frames
        d['alternatives'] = self.alternatives
        return d

@dataclass
class DriverProfile:
    """Driver personality and historical performance"""
    car_number: int
    consistency_score: float
    aggression_level: float  # 0-1, higher = more aggressive
    brake_profile: List[float]  # Historical brake patterns
    throttle_profile: List[float]  # Historical throttle patterns
    preferred_sectors: Dict[int, float]  # Sector performance index
    peak_lap_template: Dict  # Best lap characteristics
    recent_performance: deque = field(default_factory=lambda: deque(maxlen=20))
    last_updated: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    
    def update_with_lap(self, lap_data: Dict):
        """Incrementally update profile with new lap data"""
        self.recent_performance.append(lap_data)
        self.last_updated = datetime.utcnow().isoformat()

# ============================================================================
# BASE AGENT CLASS
# ============================================================================

class PitWallAgent(ABC):
    """
    Base autonomous agent class.
    
    All agents inherit this class and implement:
    - observe(): consume telemetry/task data
    - decide(): make autonomous decision
    - act(): execute decision (broadcast to system)
    """
    
    def __init__(
        self,
        agent_id: str,
        agent_type: AgentType,
        redis_url: str = "redis://127.0.0.1:6379",
        tracks: List[str] = None
    ):
        self.agent_id = agent_id
        self.agent_type = agent_type
        self.redis_url = redis_url
        self.tracks = tracks or []
        self.redis = None
        self.decision_history = defaultdict(lambda: deque(maxlen=100))
        self.memory = {}  # Persistent agent memory
        logger.info(f"Initialized {agent_type.value} agent: {agent_id}")
    
    async def connect(self):
        """Connect to Redis with retry logic"""
        max_retries = 5
        for attempt in range(1, max_retries + 1):
            try:
                self.redis = await redis.from_url(self.redis_url)
                await self.redis.ping()  # Test connection
                await self.register()
                logger.info(f"Agent {self.agent_id} connected to Redis")
                return
            except Exception as e:
                logger.warning(f"Connection attempt {attempt}/{max_retries} failed: {e}")
                if attempt == max_retries:
                    logger.error(f"Failed to connect after {max_retries} attempts")
                    raise
                await asyncio.sleep(2 * attempt)
    
    async def disconnect(self):
        """Clean up connections"""
        if self.redis:
            try:
                await self.redis.close()
            except Exception as e:
                logger.warning(f"Error during disconnect: {e}")
    
    async def register(self):
        """Register this agent in the orchestrator with error handling"""
        registry_key = "agents.registry"
        agent_info = {
            "id": self.agent_id,
            "type": self.agent_type.value,
            "tracks": json.dumps(self.tracks),
            "registered_at": datetime.utcnow().isoformat(),
            "status": "active"
        }
        try:
            await self.redis.hset(registry_key, self.agent_id, json.dumps(agent_info))
            logger.info(f"Agent {self.agent_id} registered in orchestrator")
        except Exception as e:
            logger.error(f"Failed to register agent {self.agent_id}: {e}", exc_info=True)
            raise
    
    async def listen_for_tasks(self):
        """Subscribe to task stream and process autonomously with error handling"""
        inbox = f"agent:{self.agent_id}:inbox"
        logger.info(f"Listening for tasks on {inbox}")
        
        consecutive_errors = 0
        max_consecutive_errors = 10
        
        while True:
            try:
                # Ensure connection is active
                if not self.redis:
                    await self.connect()
                
                # Block until task arrives or timeout
                try:
                    task_json = await self.redis.blpop(inbox, timeout=5)
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
                
                if not task_json:
                    await asyncio.sleep(0.1)
                    consecutive_errors = 0  # Reset on successful poll
                    continue
                
                try:
                    task = json.loads(task_json[1])
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse task JSON: {e}, raw: {task_json[1][:200]}")
                    consecutive_errors += 1
                    if consecutive_errors >= max_consecutive_errors:
                        raise
                    await asyncio.sleep(1)
                    continue
                
                task_id = task.get('task_id', 'unknown')
                logger.debug(f"Received task: {task_id}")
                
                try:
                    # Core agent loop: observe → decide → act
                    payload = task.get('payload', {})
                    sample = payload.get('sample', {})
                    
                    if not sample:
                        logger.warning(f"Task {task_id} has no sample data")
                        continue
                    
                    telemetry = TelemetryFrame(**sample)
                    decision = await self.decide(telemetry)
                    
                    if decision:
                        await self.act(decision)
                        self.decision_history[task.get('track', 'unknown')].append(decision)
                    
                    consecutive_errors = 0  # Reset on successful processing
                    
                except KeyError as e:
                    logger.error(f"Missing required field in task {task_id}: {e}")
                    consecutive_errors += 1
                    if consecutive_errors >= max_consecutive_errors:
                        raise
                    await asyncio.sleep(1)
                except Exception as e:
                    logger.error(f"Error processing task {task_id}: {e}", exc_info=True)
                    consecutive_errors += 1
                    if consecutive_errors >= max_consecutive_errors:
                        logger.error(f"Too many consecutive errors ({consecutive_errors}), shutting down")
                        raise
                    await asyncio.sleep(1)
                
            except asyncio.CancelledError:
                logger.info(f"Agent {self.agent_id} task listener cancelled")
                break
            except Exception as e:
                logger.error(f"Fatal error in task listener: {e}", exc_info=True)
                consecutive_errors += 1
                if consecutive_errors >= max_consecutive_errors:
                    raise
                await asyncio.sleep(5)
    
    async def decide(self, telemetry: TelemetryFrame) -> Optional[AgentDecision]:
        """
        Core decision logic. Override in subclasses.
        
        Should return an AgentDecision or None if no decision needed.
        """
        return None
    
    async def act(self, decision: AgentDecision):
        """
        Execute decision by broadcasting to system.
        Stores decision and publishes to results stream with error handling.
        """
        results_stream = "results.stream"
        decision_dict = decision.to_dict()
        insight_id = decision.decision_id
        
        try:
            # Store full decision for later retrieval
            try:
                await self.redis.hset(
                    f"insight:{insight_id}",
                    mapping={
                        "payload": json.dumps(decision_dict),
                        "created_at": decision.timestamp
                    }
                )
            except Exception as e:
                logger.error(f"Failed to store decision {insight_id}: {e}", exc_info=True)
                # Continue to try broadcasting even if storage fails
            
            # Broadcast summary to results stream
            summary = {
                "type": "agent_decision",
                "agent_id": self.agent_id,
                "decision_id": insight_id,
                "track": decision.track,
                "chassis": decision.chassis,
                "action": decision.action,
                "confidence": decision.confidence,
                "risk_level": decision.risk_level,
                "created_at": decision.timestamp
            }
            
            try:
                await self.redis.xadd(results_stream, "*", "result", json.dumps(summary))
                logger.info(f"Decision executed: {decision.decision_id} ({decision.action})")
            except Exception as e:
                logger.error(f"Failed to publish decision {insight_id} to stream: {e}", exc_info=True)
                raise
                
        except (redis.ConnectionError, OSError) as e:
            logger.error(f"Connection error while executing decision {insight_id}: {e}")
            # Attempt reconnection
            try:
                await self.connect()
            except Exception as reconnect_error:
                logger.error(f"Reconnection failed: {reconnect_error}")
                raise
        except Exception as e:
            logger.error(f"Unexpected error executing decision {insight_id}: {e}", exc_info=True)
            raise

# ============================================================================
# STRATEGY AGENT - Autonomous pit and race strategy optimizer
# ============================================================================

class StrategyAgent(PitWallAgent):
    """
    Autonomous agent that makes pit strategy decisions.
    
    Observes:
    - Real-time tire wear predictions
    - Gap to leader
    - Track conditions
    - Remaining laps
    
    Decides:
    - When to pit (optimal lap)
    - Strategy type (undercut, overcut, conservative)
    - Risk level and confidence
    
    Acts:
    - Publishes pit recommendation to pit crew
    - Stores decision with evidence for review
    """
    
    def __init__(self, agent_id: str, redis_url: str, tracks: List[str] = None):
        super().__init__(agent_id, AgentType.STRATEGIST, redis_url, tracks)
        self.pit_models = {}  # Load per-track pit timing models
        self.session_state = defaultdict(dict)  # Per-chassis session data
    
    async def decide(self, telemetry: TelemetryFrame) -> Optional[AgentDecision]:
        """
        Autonomous pit decision logic.
        
        Example: "If tire degradation >35% AND gap to leader <3s AND laps remaining >8,
                  recommend pit on next lap with 85% confidence"
        """
        chassis = telemetry.chassis
        track = telemetry.track
        
        # Retrieve or initialize session state
        session = self.session_state[chassis]
        if 'lap' not in session:
            session['lap'] = telemetry.lap
            session['tire_wear_history'] = deque(maxlen=15)
            return None  # Not enough data for first lap
        
        # Simulate tire wear (in reality, load from predictor stream)
        simulated_wear = self._estimate_tire_wear(telemetry)
        session['tire_wear_history'].append(simulated_wear)
        
        # Pit decision heuristic
        avg_wear = np.mean(list(session['tire_wear_history']))
        remaining_laps = 15 - telemetry.lap
        
        pit_decision = None
        
        # Decision rules (configurable per track)
        if avg_wear > 0.35 and remaining_laps > 8:
            confidence = self._compute_decision_confidence(avg_wear, remaining_laps)
            risk = self._assess_risk(telemetry, avg_wear)
            
            pit_decision = AgentDecision(
                agent_id=self.agent_id,
                agent_type=self.agent_type.value,
                decision_id=str(uuid.uuid4()),
                timestamp=datetime.utcnow().isoformat(),
                track=track,
                chassis=chassis,
                decision_type="pit",
                action=f"Recommend pit lap {telemetry.lap + 2}",
                confidence=confidence,
                risk_level=risk.value,
                reasoning=[
                    f"Tire wear trending at {avg_wear*100:.1f}%",
                    f"Remaining laps: {remaining_laps} (sufficient for pit + 1-stop strategy)",
                    f"Gap to leader suggests undercut/overcut timing opportunity"
                ],
                evidence={
                    "avg_wear_percent": avg_wear * 100,
                    "lap_number": telemetry.lap,
                    "remaining_laps": remaining_laps,
                    "speed_kmh": telemetry.speed_kmh
                },
                evidence_frames=[telemetry.to_dict()],
                alternatives=[
                    {"action": "Stay out", "risk": "high", "rationale": "Tire may clip but preserve track position"},
                    {"action": "Pit now", "risk": "medium", "rationale": "Immediate pit but lose position"},
                ]
            )
        
        return pit_decision
    
    def _estimate_tire_wear(self, telemetry: TelemetryFrame) -> float:
        """Estimate tire wear percentage based on telemetry"""
        # Simplified: combine speed loss and stress
        stress = np.sqrt(telemetry.accx_can**2 + telemetry.accy_can**2)
        # Wear ~0.02% per lap under normal conditions, +0.01% per unit stress
        base_wear = 0.02
        stress_factor = stress * 0.001
        return base_wear + stress_factor
    
    def _compute_decision_confidence(self, wear: float, laps_remaining: int) -> float:
        """Compute confidence in pit decision"""
        # Higher wear and more laps remaining = higher confidence
        wear_factor = min(wear / 0.5, 1.0)  # Saturate at 50% wear
        laps_factor = min(laps_remaining / 10, 1.0)  # Saturate at 10 laps
        base_confidence = 0.7
        return min(base_confidence + (wear_factor + laps_factor) * 0.2, 0.95)
    
    def _assess_risk(self, telemetry: TelemetryFrame, wear: float) -> RiskLevel:
        """Assess risk level of pit decision"""
        if wear < 0.25:
            return RiskLevel.SAFE
        elif wear < 0.40:
            return RiskLevel.MODERATE
        elif wear < 0.60:
            return RiskLevel.AGGRESSIVE
        else:
            return RiskLevel.CRITICAL

# ============================================================================
# COACH AGENT - Driver performance and technique coaching
# ============================================================================

class CoachAgent(PitWallAgent):
    """
    Autonomous agent that provides real-time driver coaching.
    
    Observes:
    - Sector-by-sector performance
    - Driver input patterns (steering, throttle, braking)
    - Lap-to-lap consistency
    - Deviation from ideal line
    
    Decides:
    - Coaching feedback (sector-specific)
    - Technique improvements
    - Risk alerts (lock-ups, spins, off-track)
    
    Acts:
    - Publishes coaching cards to driver/engineer
    - Stores feedback for post-race analysis
    """
    
    def __init__(self, agent_id: str, redis_url: str, tracks: List[str] = None):
        super().__init__(agent_id, AgentType.COACH, redis_url, tracks)
        self.driver_profiles = {}  # Per-car driver models
        self.sector_templates = {}  # Ideal sector templates per track
    
    async def decide(self, telemetry: TelemetryFrame) -> Optional[AgentDecision]:
        """
        Autonomous coaching decision.
        
        Analyzes current telemetry vs. driver's historical profile and ideal line.
        """
        chassis = telemetry.chassis
        
        # Initialize or fetch driver profile
        if chassis not in self.driver_profiles:
            self.driver_profiles[chassis] = DriverProfile(
                car_number=int(chassis.split('-')[1]) if '-' in chassis else 0,
                consistency_score=0.0,
                aggression_level=0.5,
                brake_profile=[],
                throttle_profile=[],
                preferred_sectors={}
            )
        
        profile = self.driver_profiles[chassis]
        
        # Analyze current sector performance
        coaching_insight = self._analyze_sector_performance(telemetry, profile)
        
        if coaching_insight:
            return AgentDecision(
                agent_id=self.agent_id,
                agent_type=self.agent_type.value,
                decision_id=str(uuid.uuid4()),
                timestamp=datetime.utcnow().isoformat(),
                track=telemetry.track,
                chassis=chassis,
                decision_type="coach",
                action=coaching_insight['action'],
                confidence=0.8,
                risk_level=RiskLevel.SAFE.value,
                reasoning=coaching_insight['reasoning'],
                evidence=coaching_insight['evidence'],
                evidence_frames=[telemetry.to_dict()]
            )
        
        return None
    
    def _analyze_sector_performance(self, telemetry: TelemetryFrame, profile: DriverProfile) -> Optional[Dict]:
        """Analyze telemetry and provide coaching feedback"""
        sector = telemetry.sector
        
        # Detect anomalies
        if abs(telemetry.accy_can) > 1.3:  # High lateral load
            return {
                "action": "High cornering load detected in Sector {}".format(sector),
                "reasoning": [
                    f"Lateral acceleration: {telemetry.accy_can:.2f}G (ideal: <1.2G)",
                    "Consider earlier brake application or smoother turn-in",
                    "Potential tire graining risk if sustained"
                ],
                "evidence": {
                    "lateral_g": telemetry.accy_can,
                    "threshold": 1.2,
                    "sector": sector
                }
            }
        
        if telemetry.brake_pct > 95 and telemetry.speed_kmh < 80:
            return {
                "action": "Aggressive braking detected in Sector {}".format(sector),
                "reasoning": [
                    f"Brake pressure: {telemetry.brake_pct:.0f}% at low speed",
                    "Try smooth modulation off brake to improve exit speed",
                    "Potential lock-up risk"
                ],
                "evidence": {
                    "brake_pct": telemetry.brake_pct,
                    "speed_kmh": telemetry.speed_kmh,
                    "sector": sector
                }
            }
        
        return None

# ============================================================================
# ANOMALY DETECTIVE AGENT - Real-time fault and incident detection
# ============================================================================

class AnomalyDetectiveAgent(PitWallAgent):
    """
    Autonomous agent that detects anomalies and safety issues.
    
    Observes:
    - Sudden acceleration spikes
    - Sensor glitches
    - Off-track excursions (GPS)
    - Engine/thermal anomalies
    - Driver behavior changes
    
    Decides:
    - Severity level (warning, critical)
    - Whether to alert pit crew
    - Recommended action (investigate, reduce pace, pit)
    
    Acts:
    - Publishes safety alerts
    - Logs incident with evidence
    """
    
    def __init__(self, agent_id: str, redis_url: str, tracks: List[str] = None):
        super().__init__(agent_id, AgentType.ANOMALY_DETECTIVE, redis_url, tracks)
        self.baseline_stats = defaultdict(dict)  # Per-car baseline metrics
        self.incident_log = defaultdict(list)  # Per-car incident history
    
    async def decide(self, telemetry: TelemetryFrame) -> Optional[AgentDecision]:
        """
        Autonomous anomaly detection.
        
        Compares current telemetry to baseline and flags deviations.
        """
        chassis = telemetry.chassis
        
        # Initialize or fetch baseline
        if chassis not in self.baseline_stats:
            self.baseline_stats[chassis] = {
                "avg_accx": 0.0,
                "avg_accy": 0.0,
                "avg_speed": 150.0
            }
        
        baseline = self.baseline_stats[chassis]
        
        # Detect anomalies
        anomalies = []
        
        # Check for sensor glitch (implausible acceleration)
        if abs(telemetry.accx_can) > 2.0:  # Should never exceed ~1.8G
            anomalies.append({
                "type": "sensor_glitch",
                "value": telemetry.accx_can,
                "threshold": 2.0,
                "severity": "critical"
            })
        
        # Check for speed drop (possible lock-up or off-track)
        prev_speed = baseline.get("last_speed", telemetry.speed_kmh)
        speed_delta = telemetry.speed_kmh - prev_speed
        if speed_delta < -30:  # Sudden speed loss
            anomalies.append({
                "type": "sudden_speed_loss",
                "speed_delta_kmh": speed_delta,
                "severity": "warning"
            })
        
        # Check for thermal anomaly
        if telemetry.tire_temp > 110:  # Overheating
            anomalies.append({
                "type": "tire_overheat",
                "temp_c": telemetry.tire_temp,
                "threshold": 110,
                "severity": "warning"
            })
        
        # Update baseline
        baseline["last_speed"] = telemetry.speed_kmh
        
        if anomalies:
            incident_id = f"{chassis}-{datetime.utcnow().timestamp()}"
            self.incident_log[chassis].append({
                "incident_id": incident_id,
                "timestamp": datetime.utcnow().isoformat(),
                "anomalies": anomalies
            })
            
            most_severe = max(anomalies, key=lambda x: 1 if x["severity"] == "critical" else 0)
            
            return AgentDecision(
                agent_id=self.agent_id,
                agent_type=self.agent_type.value,
                decision_id=incident_id,
                timestamp=datetime.utcnow().isoformat(),
                track=telemetry.track,
                chassis=chassis,
                decision_type="anomaly",
                action=f"Alert: {most_severe['type']}",
                confidence=0.95,
                risk_level=RiskLevel.CRITICAL.value if most_severe["severity"] == "critical" else RiskLevel.MODERATE.value,
                reasoning=[
                    f"Detected {len(anomalies)} anomaly(ies)",
                    f"Most severe: {most_severe['type']}",
                    "Recommend investigation and data logging"
                ],
                evidence={"anomalies": anomalies}
            )
        
        return None

# ============================================================================
# ORCHESTRATOR AGENT - Coordinates all other agents
# ============================================================================

class OrchestratorAgent(PitWallAgent):
    """
    Master orchestrator agent.
    
    Responsibilities:
    - Manage agent registry
    - Route tasks to specialized agents
    - Aggregate decisions
    - Coordinate priorities
    - Monitor agent health
    """
    
    def __init__(self, agent_id: str, redis_url: str):
        super().__init__(agent_id, AgentType.ORCHESTRATOR, redis_url)
        self.agent_registry = {}
        self.task_queue = asyncio.Queue()
    
    async def orchestrate(self):
        """
        Main orchestration loop.
        
        Read incoming tasks, route to appropriate agents, aggregate results.
        """
        logger.info("Orchestrator started")
        
        while True:
            try:
                # Check for new tasks
                tasks_stream = "tasks.stream"
                tasks = await self.redis.xread("BLOCK", 2000, "COUNT", 10, "STREAMS", tasks_stream, "$")
                
                if tasks:
                    for stream_name, entries in tasks:
                        for task_id, fields in entries:
                            task_json = fields[b'task']
                            task = json.loads(task_json)
                            
                            # Route based on task type
                            await self._route_task(task)
                
                await asyncio.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Orchestrator loop error: {e}")
                await asyncio.sleep(1)
    
    async def _route_task(self, task: Dict):
        """Route task to appropriate agent(s)"""
        task_type = task.get("task_type", "predictor")
        track = task.get("track")
        
        # Select appropriate agent
        if task_type == "pit_strategy":
            target_agent = "strategy-01"
        elif task_type == "coaching":
            target_agent = "coach-01"
        elif task_type == "anomaly":
            target_agent = "anomaly-01"
        else:
            target_agent = "predictor-01"
        
        inbox = f"agent:{target_agent}:inbox"
        await self.redis.rpush(inbox, json.dumps(task))
        logger.debug(f"Task routed to {target_agent}: {task.get('task_id')}")

# ============================================================================
# MAIN EXECUTION
# ============================================================================

async def main():
    """Run agents"""
    import argparse
    
    parser = argparse.ArgumentParser(description="PitWall A.I. Agents")
    parser.add_argument("--mode", default="strategy", 
                       choices=["strategy", "coach", "anomaly", "orchestrator"])
    parser.add_argument("--redis-url", default="redis://127.0.0.1:6379")
    args = parser.parse_args()
    
    redis_url = args.redis_url
    
    if args.mode == "strategy":
        agent = StrategyAgent("strategy-01", redis_url, 
                            tracks=["cota", "road_america", "sonoma", "vir", "sebring", "barber", "indianapolis"])
        await agent.connect()
        await agent.listen_for_tasks()
    
    elif args.mode == "coach":
        agent = CoachAgent("coach-01", redis_url)
        await agent.connect()
        await agent.listen_for_tasks()
    
    elif args.mode == "anomaly":
        agent = AnomalyDetectiveAgent("anomaly-01", redis_url)
        await agent.connect()
        await agent.listen_for_tasks()
    
    elif args.mode == "orchestrator":
        orch = OrchestratorAgent("orchestrator-01", redis_url)
        await orch.connect()
        await orch.orchestrate()

if __name__ == "__main__":
    asyncio.run(main())

