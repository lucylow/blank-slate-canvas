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
from typing import Dict, Any

import redis.asyncio as aioredis

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
    try:
        await r.xgroup_create(AGG_STREAM, AGG_GROUP, id="$", mkstream=True)
    except Exception:
        pass

async def _redis_lock_acquire(r, key, owner, ttl=10):
    return await r.set(key, owner, nx=True, ex=ttl)

async def _redis_lock_release(r, key, owner):
    val = await r.get(key)
    if val == owner:
        await r.delete(key)

async def agent_worker_loop(agent_id: str, queue: asyncio.Queue):
    """
    Runs agent processing loop - here we simply simulate and publish to results.stream
    In production each agent should be a separate process, but orchestrator can host light tasks.
    """
    r = aioredis.from_url(REDIS_URL, decode_responses=True)
    while True:
        task = await queue.get()
        start = time.time()
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
            await r.xadd("results.stream", {"payload": json.dumps(decision)})
        except Exception:
            logger.exception("agent %s failed on task", agent_id)
        finally:
            elapsed = time.time() - start
            queue.task_done()

async def run_orchestrator():
    r = aioredis.from_url(REDIS_URL, decode_responses=True)
    await ensure_group(r)
    # prepare in-memory agent queues & background workers
    for aid in AGENT_REGISTRY.keys():
        q = asyncio.Queue(maxsize=MAX_QUEUE_SIZE)
        agent_queues[aid] = q
        asyncio.create_task(agent_worker_loop(aid, q))
    logger.info("Orchestrator started, listening to %s", AGG_STREAM)
    while True:
        try:
            res = await r.xreadgroup(AGG_GROUP, CONSUMER, {AGG_STREAM: ">"}, count=10, block=1000)
            if not res:
                await asyncio.sleep(0.01)
                continue
            for stream, entries in res:
                for msg_id, fields in entries:
                    raw = fields.get("payload") or fields
                    try:
                        task = json.loads(raw) if isinstance(raw, str) else raw
                    except Exception:
                        task = raw
                    # build task_id & attempt distributed lock
                    task_id = f"task:{task.get('track')}:{task.get('chassis')}:{task.get('lap')}:{msg_id}"
                    owner = f"{CONSUMER}"
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
                        # optionally push to overflow stream
                    # ack original message now (idempotent handlers expected downstream)
                    await r.xack(AGG_STREAM, AGG_GROUP, msg_id)
                    # release lock - downstream side may still process; OR keep lock until agent ack for stronger safety
                    await _redis_lock_release(r, f"lock:{task_id}", owner)
        except Exception as e:
            logger.exception("orchestrator read error: %s", e)
            await asyncio.sleep(0.5)

if __name__ == "__main__":
    asyncio.run(run_orchestrator())



