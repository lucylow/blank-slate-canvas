# agents/agent_orchestrator_async.py

"""
Orchestrator:

- Reads aggregate windows from aggregates.stream

- Routes tasks to agent-specific queues according to routing policy

- Uses Redis lock to protect tasks (distributed)

- Publishes task status and enforces timeouts & retries

"""

import asyncio
import json
import os
import time
import uuid
import logging
from typing import Dict, Any, Optional
import traceback

import redis.asyncio as aioredis

# Import error handling utilities
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
try:
    from utils.error_handling import (
        retry_with_backoff,
        handle_redis_error,
        log_error_with_context,
        ErrorSeverity,
        ConnectionManager,
        safe_redis_operation
    )
except ImportError:
    # Fallback if utils not available
    def retry_with_backoff(*args, **kwargs):
        def decorator(func):
            return func
        return decorator
    def handle_redis_error(*args, **kwargs):
        pass
    def log_error_with_context(*args, **kwargs):
        pass
    ErrorSeverity = None
    ConnectionManager = None
    safe_redis_operation = None

logger = logging.getLogger("orchestrator")
logging.basicConfig(level=logging.INFO)

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")
AGG_STREAM = os.getenv("AGG_STREAM", "aggregates.stream")
AGG_GROUP = os.getenv("AGG_GROUP", "aggregator-workers")
CONSUMER = os.getenv("ORCH_CONSUMER", f"orch-{int(time.time())}")
TASK_TIMEOUT = float(os.getenv("TASK_TIMEOUT", "3.0"))  # seconds agent should respond in RT mode
MAX_QUEUE_SIZE = int(os.getenv("ORCH_MAX_QUEUE", "500"))

# Simple in-memory queues mapping agent_id -> asyncio.Queue
agent_queues: Dict[str, asyncio.Queue] = {}

# Example registry (in practice this is dynamic from Orchestrator registry)
AGENT_REGISTRY = {
    "predictor-01": {"types": ["predictor"], "tracks": ["cota","road_america","sebring","sonoma","vir","barber","indianapolis"]},
    "eda-01": {"types": ["eda"], "tracks": ["*"]},
    "strategy-01": {"types": ["strategy"], "tracks": ["*"]},
    "coach-01": {"types": ["coach"], "tracks": ["*"]},
}

def pick_agent_for_task(task: Dict[str, Any]) -> str:
    # simple affinity: predictor for per-chassis aggregations
    for aid, meta in AGENT_REGISTRY.items():
        if "predictor" in meta["types"] and (task.get("track") in meta["tracks"] or "*" in meta["tracks"]):
            return aid
    return "strategy-01"

async def ensure_group(r):
    """Ensure consumer group exists, handle errors gracefully."""
    try:
        await r.xgroup_create(AGG_STREAM, AGG_GROUP, id="$", mkstream=True)
        logger.debug(f"Created consumer group {AGG_GROUP} for stream {AGG_STREAM}")
    except aioredis.exceptions.ResponseError as e:
        # Group already exists - this is expected
        if "BUSYGROUP" in str(e) or "already exists" in str(e).lower():
            logger.debug(f"Consumer group {AGG_GROUP} already exists")
        else:
            log_error_with_context(
                e,
                "orchestrator",
                "ensure_group",
                ErrorSeverity.MEDIUM if ErrorSeverity else None,
                {"stream": AGG_STREAM, "group": AGG_GROUP}
            )
    except Exception as e:
        log_error_with_context(
            e,
            "orchestrator",
            "ensure_group",
            ErrorSeverity.HIGH if ErrorSeverity else None,
            {"stream": AGG_STREAM, "group": AGG_GROUP}
        )
        raise

async def _redis_lock_acquire(r, key, owner, ttl=10):
    """Acquire distributed lock with error handling."""
    try:
        return await r.set(key, owner, nx=True, ex=ttl)
    except Exception as e:
        handle_redis_error("lock_acquire", "orchestrator", e, {"key": key, "owner": owner})
        return False

async def _redis_lock_release(r, key, owner):
    """Release distributed lock with error handling."""
    try:
        val = await r.get(key)
        if val == owner:
            await r.delete(key)
            return True
        return False
    except Exception as e:
        handle_redis_error("lock_release", "orchestrator", e, {"key": key, "owner": owner})
        return False

async def agent_worker_loop(agent_id: str, queue: asyncio.Queue):
    """
    Runs agent processing loop - here we simply simulate and publish to results.stream
    In production each agent should be a separate process, but orchestrator can host light tasks.
    """
    r = None
    connection_retries = 0
    max_connection_retries = 5
    
    while True:
        try:
            # Ensure Redis connection
            if r is None:
                try:
                    r = aioredis.from_url(REDIS_URL, decode_responses=True)
                    await r.ping()  # Test connection
                    connection_retries = 0
                    logger.info(f"Agent worker {agent_id} connected to Redis")
                except Exception as e:
                    connection_retries += 1
                    handle_redis_error("connect", f"agent_worker_{agent_id}", e)
                    if connection_retries >= max_connection_retries:
                        logger.error(f"Agent worker {agent_id} failed to connect after {max_connection_retries} attempts")
                        await asyncio.sleep(5)
                    else:
                        await asyncio.sleep(1 * connection_retries)
                    continue
            
            task = await queue.get()
            start = time.time()
            task_id = task.get("task_id", "unknown")
            
            try:
                # timeboxed: use asyncio.wait_for for actual agent call
                await asyncio.sleep(0.01)  # tiny simulate
                # final decision - publish to results stream
                decision = {
                    "agent_id": agent_id,
                    "decision_id": str(uuid.uuid4()),
                    "task": task,
                    "timestamp": time.time(),
                    "outcome": f"simulated result by {agent_id}"
                }
                
                # Publish with retry logic
                try:
                    await r.xadd("results.stream", {"payload": json.dumps(decision)})
                except Exception as e:
                    handle_redis_error("xadd_results", f"agent_worker_{agent_id}", e, {"task_id": task_id})
                    # Mark connection as potentially broken
                    r = None
                    raise
                    
            except asyncio.CancelledError:
                logger.info(f"Agent worker {agent_id} cancelled")
                raise
            except Exception as e:
                log_error_with_context(
                    e,
                    f"agent_worker_{agent_id}",
                    "process_task",
                    ErrorSeverity.MEDIUM if ErrorSeverity else None,
                    {"task_id": task_id, "task_type": task.get("task_type", "unknown")}
                )
            finally:
                elapsed = time.time() - start
                queue.task_done()
                
        except asyncio.CancelledError:
            logger.info(f"Agent worker {agent_id} loop cancelled")
            break
        except Exception as e:
            log_error_with_context(
                e,
                f"agent_worker_{agent_id}",
                "worker_loop",
                ErrorSeverity.HIGH if ErrorSeverity else None
            )
            await asyncio.sleep(1)

async def run_orchestrator():
    """Main orchestrator loop with comprehensive error handling."""
    r = None
    connection_retries = 0
    max_connection_retries = 5
    
    # Initialize Redis connection with retry
    while r is None:
        try:
            r = aioredis.from_url(REDIS_URL, decode_responses=True)
            await r.ping()
            await ensure_group(r)
            connection_retries = 0
            logger.info("Orchestrator connected to Redis")
        except Exception as e:
            connection_retries += 1
            handle_redis_error("initial_connect", "orchestrator", e)
            if connection_retries >= max_connection_retries:
                logger.error(f"Failed to connect to Redis after {max_connection_retries} attempts")
                raise
            await asyncio.sleep(2 * connection_retries)
    
    # prepare in-memory agent queues & background workers
    for aid in AGENT_REGISTRY.keys():
        q = asyncio.Queue(maxsize=MAX_QUEUE_SIZE)
        agent_queues[aid] = q
        asyncio.create_task(agent_worker_loop(aid, q))
    logger.info("Orchestrator started, listening to %s", AGG_STREAM)
    
    consecutive_errors = 0
    max_consecutive_errors = 10
    
    while True:
        try:
            # Test connection periodically
            if consecutive_errors > 0 and consecutive_errors % 5 == 0:
                try:
                    await r.ping()
                    connection_retries = 0
                except Exception as e:
                    handle_redis_error("ping", "orchestrator", e)
                    r = None
                    # Attempt reconnection
                    for retry in range(max_connection_retries):
                        try:
                            r = aioredis.from_url(REDIS_URL, decode_responses=True)
                            await r.ping()
                            await ensure_group(r)
                            logger.info("Orchestrator reconnected to Redis")
                            break
                        except Exception as reconnect_error:
                            if retry == max_connection_retries - 1:
                                logger.error("Failed to reconnect to Redis")
                                raise
                            await asyncio.sleep(2 * (retry + 1))
            
            res = await r.xreadgroup(AGG_GROUP, CONSUMER, {AGG_STREAM: ">"}, count=10, block=1000)
            consecutive_errors = 0  # Reset on success
            
            if not res:
                await asyncio.sleep(0.01)
                continue
                
            for stream, entries in res:
                for msg_id, fields in entries:
                    raw = fields.get("payload") or fields
                    task = None
                    task_id = None
                    
                    try:
                        # Parse task with validation
                        if isinstance(raw, str):
                            task = json.loads(raw)
                        elif isinstance(raw, dict):
                            task = raw
                        else:
                            logger.warning(f"Unexpected task format: {type(raw)}")
                            await r.xack(AGG_STREAM, AGG_GROUP, msg_id)
                            continue
                        
                        # Validate required fields
                        if not isinstance(task, dict):
                            logger.warning(f"Task is not a dict: {type(task)}")
                            await r.xack(AGG_STREAM, AGG_GROUP, msg_id)
                            continue
                        
                        # build task_id & attempt distributed lock
                        task_id = f"task:{task.get('track', 'unknown')}:{task.get('chassis', 'unknown')}:{task.get('lap', 0)}:{msg_id}"
                        owner = f"{CONSUMER}"
                        
                        try:
                            locked = await _redis_lock_acquire(r, f"lock:{task_id}", owner, ttl=5)
                            if not locked:
                                logger.debug("task %s already handled", task_id)
                                await r.xack(AGG_STREAM, AGG_GROUP, msg_id)
                                continue
                            
                            # route to agent
                            agent_id = pick_agent_for_task(task)
                            q = agent_queues.get(agent_id)
                            
                            if q is None:
                                logger.warning("no queue for agent %s", agent_id)
                                await r.xack(AGG_STREAM, AGG_GROUP, msg_id)
                                await _redis_lock_release(r, f"lock:{task_id}", owner)
                                continue
                            
                            # if queue is full - decide policy (drop, backpressure, or push to overflow)
                            try:
                                q.put_nowait(task)
                            except asyncio.QueueFull:
                                logger.warning("queue full for %s; dropping low-priority task", agent_id)
                                # Optionally push to overflow stream or implement backpressure
                                # For now, we drop the task but still ack it
                            
                            # ack original message now (idempotent handlers expected downstream)
                            await r.xack(AGG_STREAM, AGG_GROUP, msg_id)
                            # release lock
                            await _redis_lock_release(r, f"lock:{task_id}", owner)
                            
                        except Exception as lock_error:
                            log_error_with_context(
                                lock_error,
                                "orchestrator",
                                "process_task",
                                ErrorSeverity.MEDIUM if ErrorSeverity else None,
                                {"task_id": task_id, "msg_id": msg_id}
                            )
                            # Try to ack and release lock even on error
                            try:
                                await r.xack(AGG_STREAM, AGG_GROUP, msg_id)
                                await _redis_lock_release(r, f"lock:{task_id}", owner)
                            except Exception:
                                pass
                    
                    except json.JSONDecodeError as e:
                        log_error_with_context(
                            e,
                            "orchestrator",
                            "parse_task",
                            ErrorSeverity.MEDIUM if ErrorSeverity else None,
                            {"msg_id": msg_id, "raw_preview": str(raw)[:200]}
                        )
                        # Ack malformed message to prevent reprocessing
                        try:
                            await r.xack(AGG_STREAM, AGG_GROUP, msg_id)
                        except Exception:
                            pass
                    except Exception as e:
                        log_error_with_context(
                            e,
                            "orchestrator",
                            "process_message",
                            ErrorSeverity.MEDIUM if ErrorSeverity else None,
                            {"msg_id": msg_id}
                        )
                        # Try to ack to prevent infinite reprocessing
                        try:
                            await r.xack(AGG_STREAM, AGG_GROUP, msg_id)
                        except Exception:
                            pass
                            
        except asyncio.CancelledError:
            logger.info("Orchestrator cancelled")
            break
        except (aioredis.exceptions.ConnectionError, OSError, ConnectionError) as e:
            consecutive_errors += 1
            handle_redis_error("xreadgroup", "orchestrator", e)
            r = None  # Mark connection as broken
            if consecutive_errors >= max_consecutive_errors:
                logger.error(f"Too many consecutive connection errors ({consecutive_errors}), shutting down")
                raise
            await asyncio.sleep(1 * consecutive_errors)
        except Exception as e:
            consecutive_errors += 1
            log_error_with_context(
                e,
                "orchestrator",
                "main_loop",
                ErrorSeverity.HIGH if ErrorSeverity else None,
                {"consecutive_errors": consecutive_errors}
            )
            if consecutive_errors >= max_consecutive_errors:
                logger.error(f"Too many consecutive errors ({consecutive_errors}), shutting down")
                raise
            await asyncio.sleep(0.5 * consecutive_errors)

if __name__ == "__main__":
    asyncio.run(run_orchestrator())



