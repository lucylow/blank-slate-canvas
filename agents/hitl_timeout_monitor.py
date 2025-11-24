#!/usr/bin/env python3
"""
Human-in-the-Loop Timeout Monitor
===================================
Background service that monitors pending decisions and handles timeouts.

This service should run as a separate process/worker to ensure pending
decisions are processed even if the main application is busy.
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from typing import List
import redis.asyncio as redis

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")
CHECK_INTERVAL = int(os.getenv("HITL_CHECK_INTERVAL", "10"))  # Check every 10 seconds


async def monitor_timeouts():
    """Monitor pending decisions and handle timeouts"""
    r = await redis.from_url(REDIS_URL, decode_responses=True)
    
    logger.info("Human-in-the-loop timeout monitor started")
    
    try:
        from human_in_the_loop import HumanInTheLoopManager
        
        hitl_manager = HumanInTheLoopManager(REDIS_URL)
        await hitl_manager.connect()
        
        while True:
            try:
                # Get all pending decisions
                pending = await hitl_manager.get_pending_decisions(limit=1000)
                
                now = datetime.utcnow()
                expired_count = 0
                
                for decision in pending:
                    try:
                        expires_at = datetime.fromisoformat(
                            decision.expires_at.replace('Z', '+00:00').split('+')[0]
                        )
                        
                        if now > expires_at:
                            # Decision has expired
                            logger.info(f"Decision {decision.decision_id} expired, handling timeout")
                            await hitl_manager._handle_timeout(decision)
                            expired_count += 1
                    except Exception as e:
                        logger.warning(f"Error checking expiry for {decision.decision_id}: {e}")
                        continue
                
                if expired_count > 0:
                    logger.info(f"Handled {expired_count} expired decision(s)")
                
                await asyncio.sleep(CHECK_INTERVAL)
                
            except Exception as e:
                logger.error(f"Error in timeout monitor loop: {e}")
                await asyncio.sleep(CHECK_INTERVAL)
                
    except ImportError:
        logger.warning("Human-in-the-loop module not available, using basic timeout handling")
        
        while True:
            try:
                # Basic timeout handling without HITL manager
                # Get pending decisions from queue
                decision_ids = await r.zrange("pending_decisions_queue", 0, 100)
                
                now = datetime.utcnow()
                expired_count = 0
                
                for decision_id in decision_ids:
                    try:
                        pending_key = f"pending_decision:{decision_id}"
                        data = await r.hgetall(pending_key)
                        
                        if not data:
                            continue
                        
                        payload = json.loads(data.get("payload", "{}"))
                        expires_at_str = payload.get("expires_at")
                        
                        if expires_at_str:
                            expires_at = datetime.fromisoformat(
                                expires_at_str.replace('Z', '+00:00').split('+')[0]
                            )
                            
                            if now > expires_at:
                                # Handle timeout
                                timeout_policy = payload.get("metadata", {}).get("timeout_policy", "auto_approve")
                                
                                if timeout_policy == "auto_approve":
                                    # Auto-approve
                                    status_key = f"decision_status:{decision_id}"
                                    await r.hset(
                                        status_key,
                                        mapping={
                                            "status": "auto_approved",
                                            "reviewed_at": now.isoformat(),
                                            "reviewer": "system"
                                        }
                                    )
                                    
                                    # Remove from pending queue
                                    await r.zrem("pending_decisions_queue", decision_id)
                                    await r.delete(pending_key)
                                    
                                    logger.info(f"Auto-approved expired decision: {decision_id}")
                                    expired_count += 1
                                    
                if expired_count > 0:
                    logger.info(f"Handled {expired_count} expired decision(s)")
                
                await asyncio.sleep(CHECK_INTERVAL)
                
            except Exception as e:
                logger.error(f"Error in basic timeout monitor: {e}")
                await asyncio.sleep(CHECK_INTERVAL)
    
    finally:
        await r.close()


if __name__ == "__main__":
    asyncio.run(monitor_timeouts())

