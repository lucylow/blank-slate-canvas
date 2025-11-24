#!/usr/bin/env python3
"""
Human-in-the-Loop System for AI Agents
=======================================
Manages approval workflows, decision status, timeouts, and human review processes
for AI agent decisions.

Features:
- Configurable approval requirements based on risk, confidence, and decision type
- Decision status management (pending, approved, rejected, expired)
- Timeout handling with auto-approve/reject policies
- Priority queue for pending decisions
- Audit trail and review history
- Batch review operations
"""

import asyncio
import json
import logging
import os
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path

try:
    import redis.asyncio as redis
except ImportError:
    redis = None
    logging.warning("redis.asyncio not available, some features may not work")

logger = logging.getLogger(__name__)

# ============================================================================
# ENUMS AND DATA MODELS
# ============================================================================

class DecisionStatus(Enum):
    """Status of an agent decision in the approval workflow"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    MODIFIED = "modified"
    EXPIRED = "expired"
    AUTO_APPROVED = "auto_approved"
    AUTO_REJECTED = "auto_rejected"

class ApprovalAction(Enum):
    """Actions a human reviewer can take"""
    APPROVE = "approve"
    REJECT = "reject"
    MODIFY = "modify"
    DEFER = "defer"

class TimeoutPolicy(Enum):
    """What to do when a decision times out"""
    AUTO_APPROVE = "auto_approve"
    AUTO_REJECT = "auto_reject"
    ESCALATE = "escalate"
    NOTIFY = "notify"

@dataclass
class ApprovalRule:
    """Rule that determines if a decision requires human approval"""
    decision_types: List[str]  # ["pit", "coach", "anomaly"]
    min_confidence_threshold: float = 0.0  # Decisions below this require approval
    max_confidence_threshold: float = 1.0  # Decisions above this auto-approve
    risk_levels: List[str] = field(default_factory=lambda: [])  # ["critical", "aggressive"]
    require_approval: bool = True
    timeout_seconds: int = 300  # 5 minutes default
    timeout_policy: str = "auto_approve"  # What to do on timeout
    priority: int = 0  # Higher priority = reviewed first

@dataclass
class DecisionReview:
    """Human review of an agent decision"""
    decision_id: str
    reviewer: str
    action: str  # approve, reject, modify
    modified_action: Optional[str] = None
    feedback: str = ""
    reviewed_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    review_time_seconds: Optional[float] = None  # Time from decision to review
    confidence_override: Optional[float] = None  # Human-adjusted confidence

@dataclass
class PendingDecision:
    """Decision awaiting human review"""
    decision_id: str
    agent_id: str
    agent_type: str
    decision_type: str
    action: str
    confidence: float
    risk_level: str
    track: str
    chassis: str
    reasoning: List[str]
    evidence: Dict[str, Any]
    alternatives: List[Dict[str, Any]]
    created_at: str
    expires_at: str
    priority: int
    status: str = "pending"
    metadata: Dict[str, Any] = field(default_factory=dict)

# ============================================================================
# CONFIGURATION
# ============================================================================

class HumanInTheLoopConfig:
    """Configuration for human-in-the-loop system"""
    
    DEFAULT_RULES = [
        ApprovalRule(
            decision_types=["pit"],
            min_confidence_threshold=0.0,
            max_confidence_threshold=0.85,
            risk_levels=["critical", "aggressive"],
            require_approval=True,
            timeout_seconds=300,
            timeout_policy="auto_approve",
            priority=10
        ),
        ApprovalRule(
            decision_types=["anomaly"],
            min_confidence_threshold=0.0,
            max_confidence_threshold=0.90,
            risk_levels=["critical"],
            require_approval=True,
            timeout_seconds=60,  # Faster timeout for safety issues
            timeout_policy="auto_approve",
            priority=20  # Highest priority
        ),
        ApprovalRule(
            decision_types=["coach"],
            min_confidence_threshold=0.0,
            max_confidence_threshold=0.70,
            risk_levels=[],
            require_approval=False,  # Coaching usually doesn't need approval
            timeout_seconds=600,
            timeout_policy="auto_approve",
            priority=5
        ),
    ]
    
    def __init__(self, config_path: Optional[str] = None):
        self.rules = self.DEFAULT_RULES.copy()
        if config_path and Path(config_path).exists():
            self.load_from_file(config_path)
    
    def load_from_file(self, config_path: str):
        """Load approval rules from JSON config file"""
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                rules_config = config.get("approval_rules", [])
                self.rules = [ApprovalRule(**rule) for rule in rules_config]
                logger.info(f"Loaded {len(self.rules)} approval rules from {config_path}")
        except Exception as e:
            logger.warning(f"Error loading config from {config_path}: {e}, using defaults")
    
    def requires_approval(
        self,
        decision_type: str,
        confidence: float,
        risk_level: str
    ) -> Tuple[bool, Optional[ApprovalRule]]:
        """
        Check if a decision requires human approval based on rules.
        
        Returns:
            (requires_approval, matching_rule)
        """
        for rule in self.rules:
            # Check if decision type matches
            if decision_type not in rule.decision_types:
                continue
            
            # Check if risk level requires approval
            if rule.risk_levels and risk_level not in rule.risk_levels:
                continue
            
            # Check confidence thresholds
            if confidence < rule.min_confidence_threshold:
                return (rule.require_approval, rule)
            if confidence >= rule.max_confidence_threshold:
                # High confidence - check if rule says to auto-approve
                if not rule.require_approval:
                    return (False, None)
                continue
            
            # Decision falls within threshold range
            return (rule.require_approval, rule)
        
        # No matching rule - default to no approval required
        return (False, None)

# ============================================================================
# HUMAN-IN-THE-LOOP MANAGER
# ============================================================================

class HumanInTheLoopManager:
    """Manages the human-in-the-loop workflow for agent decisions"""
    
    def __init__(
        self,
        redis_url: str = "redis://127.0.0.1:6379",
        config: Optional[HumanInTheLoopConfig] = None
    ):
        self.redis_url = redis_url
        self.redis = None
        self.config = config or HumanInTheLoopConfig()
        self.pending_decisions: Dict[str, PendingDecision] = {}
        self.review_history: List[DecisionReview] = []
    
    async def connect(self):
        """Connect to Redis"""
        self.redis = await redis.from_url(self.redis_url, decode_responses=True)
        logger.info("Human-in-the-loop manager connected to Redis")
    
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis:
            await self.redis.close()
    
    async def check_approval_required(
        self,
        decision: Dict[str, Any]
    ) -> Tuple[bool, Optional[ApprovalRule]]:
        """
        Check if a decision requires human approval.
        
        Args:
            decision: Agent decision dictionary
            
        Returns:
            (requires_approval, matching_rule)
        """
        decision_type = decision.get("decision_type", "")
        confidence = decision.get("confidence", 1.0)
        risk_level = decision.get("risk_level", "safe")
        
        return self.config.requires_approval(decision_type, confidence, risk_level)
    
    async def submit_decision_for_review(
        self,
        decision: Dict[str, Any],
        rule: ApprovalRule
    ) -> PendingDecision:
        """
        Submit a decision to the approval queue.
        
        Args:
            decision: Agent decision dictionary
            rule: Approval rule that triggered the requirement
            
        Returns:
            PendingDecision object
        """
        decision_id = decision.get("decision_id") or decision.get("decision_id", f"decision-{datetime.utcnow().timestamp()}")
        created_at = decision.get("timestamp") or decision.get("created_at", datetime.utcnow().isoformat())
        expires_at = (datetime.fromisoformat(created_at.replace('Z', '+00:00').split('+')[0]) + 
                     timedelta(seconds=rule.timeout_seconds)).isoformat()
        
        pending = PendingDecision(
            decision_id=decision_id,
            agent_id=decision.get("agent_id", "unknown"),
            agent_type=decision.get("agent_type", "unknown"),
            decision_type=decision.get("decision_type", ""),
            action=decision.get("action", ""),
            confidence=decision.get("confidence", 0.0),
            risk_level=decision.get("risk_level", "safe"),
            track=decision.get("track", ""),
            chassis=decision.get("chassis", ""),
            reasoning=decision.get("reasoning", []),
            evidence=decision.get("evidence", {}),
            alternatives=decision.get("alternatives", []),
            created_at=created_at,
            expires_at=expires_at,
            priority=rule.priority,
            status=DecisionStatus.PENDING.value,
            metadata={
                "rule_id": f"{rule.decision_types}-{rule.risk_levels}",
                "timeout_policy": rule.timeout_policy
            }
        )
        
        # Store in Redis
        await self._store_pending_decision(pending)
        
        # Store in memory for quick access
        self.pending_decisions[decision_id] = pending
        
        # Publish notification
        await self._notify_pending_decision(pending)
        
        logger.info(f"Decision {decision_id} submitted for review (priority: {rule.priority})")
        
        return pending
    
    async def _store_pending_decision(self, pending: PendingDecision):
        """Store pending decision in Redis"""
        pending_key = f"pending_decision:{pending.decision_id}"
        await self.redis.hset(
            pending_key,
            mapping={
                "payload": json.dumps(asdict(pending)),
                "created_at": pending.created_at,
                "expires_at": pending.expires_at,
                "priority": str(pending.priority)
            }
        )
        
        # Add to priority queue (sorted set by priority and expiry)
        priority_score = pending.priority * 1000 + (datetime.fromisoformat(pending.expires_at.replace('Z', '+00:00').split('+')[0]).timestamp())
        await self.redis.zadd("pending_decisions_queue", {pending.decision_id: priority_score})
        
        # Set expiry on the key
        await self.redis.expire(pending_key, pending.metadata.get("timeout_seconds", 3600))
    
    async def _notify_pending_decision(self, pending: PendingDecision):
        """Publish notification about new pending decision"""
        await self.redis.publish(
            "pending_decisions",
            json.dumps({
                "type": "new_pending_decision",
                "decision_id": pending.decision_id,
                "priority": pending.priority,
                "decision_type": pending.decision_type,
                "risk_level": pending.risk_level,
                "track": pending.track,
                "chassis": pending.chassis,
                "expires_at": pending.expires_at
            })
        )
    
    async def review_decision(
        self,
        decision_id: str,
        reviewer: str,
        action: str,
        modified_action: Optional[str] = None,
        feedback: str = "",
        confidence_override: Optional[float] = None
    ) -> DecisionReview:
        """
        Process a human review of a decision.
        
        Args:
            decision_id: ID of the decision to review
            reviewer: Name/ID of the reviewer
            action: "approve", "reject", "modify", or "defer"
            modified_action: New action if action is "modify"
            feedback: Human feedback/notes
            confidence_override: Human-adjusted confidence score
            
        Returns:
            DecisionReview object
        """
        # Get pending decision
        pending = await self._get_pending_decision(decision_id)
        if not pending:
            raise ValueError(f"Decision {decision_id} not found in pending queue")
        
        # Calculate review time
        created_at = datetime.fromisoformat(pending.created_at.replace('Z', '+00:00').split('+')[0])
        review_time = (datetime.utcnow() - created_at).total_seconds()
        
        # Create review
        review = DecisionReview(
            decision_id=decision_id,
            reviewer=reviewer,
            action=action,
            modified_action=modified_action,
            feedback=feedback,
            reviewed_at=datetime.utcnow().isoformat(),
            review_time_seconds=review_time,
            confidence_override=confidence_override
        )
        
        # Store review
        await self._store_review(review)
        
        # Update decision status
        new_status = DecisionStatus.APPROVED.value if action == "approve" else \
                     DecisionStatus.REJECTED.value if action == "reject" else \
                     DecisionStatus.MODIFIED.value if action == "modify" else \
                     DecisionStatus.PENDING.value
        
        await self._update_decision_status(decision_id, new_status, review)
        
        # Remove from pending queue
        await self._remove_from_pending_queue(decision_id)
        
        # Publish review event
        await self._publish_review_event(review, new_status)
        
        logger.info(f"Decision {decision_id} reviewed: {action} by {reviewer} (took {review_time:.1f}s)")
        
        return review
    
    async def _get_pending_decision(self, decision_id: str) -> Optional[PendingDecision]:
        """Get pending decision from Redis or memory"""
        if decision_id in self.pending_decisions:
            return self.pending_decisions[decision_id]
        
        pending_key = f"pending_decision:{decision_id}"
        data = await self.redis.hgetall(pending_key)
        
        if not data:
            return None
        
        payload = json.loads(data.get("payload", "{}"))
        return PendingDecision(**payload)
    
    async def _store_review(self, review: DecisionReview):
        """Store review in Redis"""
        review_key = f"review:{review.decision_id}"
        await self.redis.hset(
            review_key,
            mapping={
                "payload": json.dumps(asdict(review)),
                "created_at": review.reviewed_at
            }
        )
        
        # Add to review history
        self.review_history.append(review)
        
        # Keep only last 1000 in memory
        if len(self.review_history) > 1000:
            self.review_history = self.review_history[-1000:]
    
    async def _update_decision_status(
        self,
        decision_id: str,
        status: str,
        review: DecisionReview
    ):
        """Update decision status in Redis"""
        status_key = f"decision_status:{decision_id}"
        await self.redis.hset(
            status_key,
            mapping={
                "status": status,
                "reviewed_at": review.reviewed_at,
                "reviewer": review.reviewer,
                "action": review.action
            }
        )
    
    async def _remove_from_pending_queue(self, decision_id: str):
        """Remove decision from pending queue"""
        await self.redis.zrem("pending_decisions_queue", decision_id)
        await self.redis.delete(f"pending_decision:{decision_id}")
        if decision_id in self.pending_decisions:
            del self.pending_decisions[decision_id]
    
    async def _publish_review_event(self, review: DecisionReview, status: str):
        """Publish review event for real-time updates"""
        await self.redis.publish(
            "agent_reviews",
            json.dumps({
                "type": "human_review",
                "decision_id": review.decision_id,
                "action": review.action,
                "status": status,
                "reviewer": review.reviewer,
                "timestamp": review.reviewed_at
            })
        )
    
    async def get_pending_decisions(
        self,
        track: Optional[str] = None,
        chassis: Optional[str] = None,
        risk_level: Optional[str] = None,
        limit: int = 50
    ) -> List[PendingDecision]:
        """
        Get pending decisions, optionally filtered.
        
        Returns decisions sorted by priority (highest first).
        """
        # Get from priority queue
        decision_ids = await self.redis.zrevrange("pending_decisions_queue", 0, limit * 2 - 1)
        
        pending = []
        for decision_id in decision_ids:
            try:
                p = await self._get_pending_decision(decision_id)
                if not p:
                    continue
                
                # Apply filters
                if track and p.track != track:
                    continue
                if chassis and p.chassis != chassis:
                    continue
                if risk_level and p.risk_level != risk_level:
                    continue
                
                # Check if expired
                expires_at = datetime.fromisoformat(p.expires_at.replace('Z', '+00:00').split('+')[0])
                if datetime.utcnow() > expires_at:
                    # Handle timeout
                    await self._handle_timeout(p)
                    continue
                
                pending.append(p)
                
                if len(pending) >= limit:
                    break
                    
            except Exception as e:
                logger.warning(f"Error loading pending decision {decision_id}: {e}")
                continue
        
        return pending
    
    async def _handle_timeout(self, pending: PendingDecision):
        """Handle expired pending decision based on timeout policy"""
        timeout_policy = pending.metadata.get("timeout_policy", "auto_approve")
        
        if timeout_policy == "auto_approve":
            await self.review_decision(
                pending.decision_id,
                reviewer="system",
                action="approve",
                feedback="Auto-approved due to timeout"
            )
            await self._update_decision_status(
                pending.decision_id,
                DecisionStatus.AUTO_APPROVED.value,
                DecisionReview(
                    decision_id=pending.decision_id,
                    reviewer="system",
                    action="approve",
                    feedback="Auto-approved due to timeout"
                )
            )
        elif timeout_policy == "auto_reject":
            await self.review_decision(
                pending.decision_id,
                reviewer="system",
                action="reject",
                feedback="Auto-rejected due to timeout"
            )
            await self._update_decision_status(
                pending.decision_id,
                DecisionStatus.AUTO_REJECTED.value,
                DecisionReview(
                    decision_id=pending.decision_id,
                    reviewer="system",
                    action="reject",
                    feedback="Auto-rejected due to timeout"
                )
            )
        else:
            # Escalate or notify
            await self.redis.publish(
                "pending_decisions",
                json.dumps({
                    "type": "decision_timeout",
                    "decision_id": pending.decision_id,
                    "policy": timeout_policy
                })
            )
    
    async def batch_review_decisions(
        self,
        reviews: List[Dict[str, Any]],
        reviewer: str
    ) -> List[DecisionReview]:
        """
        Review multiple decisions in a single operation.
        
        Args:
            reviews: List of review dicts with keys: decision_id, action, modified_action, feedback
            reviewer: Name/ID of the reviewer
            
        Returns:
            List of DecisionReview objects
        """
        results = []
        for review_data in reviews:
            try:
                review = await self.review_decision(
                    decision_id=review_data["decision_id"],
                    reviewer=reviewer,
                    action=review_data.get("action", "approve"),
                    modified_action=review_data.get("modified_action"),
                    feedback=review_data.get("feedback", ""),
                    confidence_override=review_data.get("confidence_override")
                )
                results.append(review)
            except Exception as e:
                logger.error(f"Error in batch review for {review_data.get('decision_id')}: {e}")
                continue
        
        logger.info(f"Batch reviewed {len(results)}/{len(reviews)} decisions")
        return results
    
    async def get_review_history(
        self,
        reviewer: Optional[str] = None,
        limit: int = 100
    ) -> List[DecisionReview]:
        """Get review history, optionally filtered by reviewer"""
        # Get from Redis
        cursor = 0
        pattern = "review:*"
        reviews = []
        
        while True:
            cursor, keys = await self.redis.scan(cursor, match=pattern, count=100)
            
            for key in keys:
                try:
                    data = await self.redis.hgetall(key)
                    payload = json.loads(data.get("payload", "{}"))
                    review = DecisionReview(**payload)
                    
                    if reviewer and review.reviewer != reviewer:
                        continue
                    
                    reviews.append(review)
                except Exception as e:
                    logger.warning(f"Error parsing review: {e}")
                    continue
            
            if cursor == 0:
                break
        
        # Sort by reviewed_at (most recent first)
        reviews.sort(key=lambda x: x.reviewed_at, reverse=True)
        
        return reviews[:limit]

