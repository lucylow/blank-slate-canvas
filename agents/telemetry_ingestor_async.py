# agents/telemetry_ingestor_async.py

"""
Async Telemetry Ingestor

- Reads raw telemetry points from Redis stream "telemetry.stream"

- Sectorizes & aggregates into small windows (per chassis/sector or per-lap)

- Writes aggregate windows to "aggregates.stream" (used by predictor/eda)

- Maintains stream trimming XTRIM

"""

import asyncio
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
import time
import logging
import traceback

import redis.asyncio as aioredis

# Import error handling utilities
import sys
sys.path.insert(0, str(Path(__file__).parent))
try:
    from utils.error_handling import (
        retry_with_backoff,
        handle_redis_error,
        log_error_with_context,
        ErrorSeverity,
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
    safe_redis_operation = None

logger = logging.getLogger("telemetry_ingestor")
logging.basicConfig(level=logging.INFO)

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")
INPUT_STREAM = os.getenv("TELEMETRY_STREAM", "telemetry.stream")
AGG_STREAM = os.getenv("AGG_STREAM", "aggregates.stream")
CONSUMER_GROUP = os.getenv("INGEST_GROUP", "ingestors")
CONSUMER_NAME = os.getenv("INGEST_NAME", f"ingestor-{int(time.time())}")
BATCH_COUNT = int(os.getenv("INGEST_BATCH", "200"))
BLOCK_MS = int(os.getenv("INGEST_BLOCK_MS", "1000"))
XTRIM_MAX = int(os.getenv("STREAM_MAXLEN", "200000"))

# simple in-memory sliding aggregator keyed by (track,chassis,lap,sector)
class SlidingAggregator:
    def __init__(self):
        self.buckets = {}

    def add(self, rec: Dict[str, Any]):
        key = (rec.get("track"), rec.get("chassis"), rec.get("lap"), rec.get("sector", 0))
        b = self.buckets.setdefault(key, {"count": 0, "sum": {}, "first_ts": rec.get("meta_time")})
        b["count"] += 1
        for k, v in rec.items():
            if isinstance(v, (int, float)) and k not in ("lap",):
                b["sum"][k] = b["sum"].get(k, 0.0) + float(v)
        # optionally flush if count > threshold handled by orchestrator below

    def flush_bucket(self, key):
        b = self.buckets.pop(key, None)
        if not b:
            return None
        agg = {"track": key[0], "chassis": key[1], "lap": key[2], "sector": key[3], "count": b["count"], "first_ts": b["first_ts"]}
        for k, s in b["sum"].items():
            agg[f"avg_{k}"] = s / b["count"]
        return agg

    def flush_all(self):
        keys = list(self.buckets.keys())
        out = []
        for k in keys:
            a = self.flush_bucket(k)
            if a: out.append(a)
        return out

async def ensure_group(r):
    """Ensure consumer group exists with proper error handling."""
    try:
        await r.xgroup_create(INPUT_STREAM, CONSUMER_GROUP, id="$", mkstream=True)
        logger.debug(f"Created consumer group {CONSUMER_GROUP} for stream {INPUT_STREAM}")
    except aioredis.exceptions.ResponseError as e:
        # Group already exists - this is expected
        if "BUSYGROUP" in str(e) or "already exists" in str(e).lower():
            logger.debug(f"Consumer group {CONSUMER_GROUP} already exists")
        else:
            log_error_with_context(
                e,
                "telemetry_ingestor",
                "ensure_group",
                ErrorSeverity.MEDIUM if ErrorSeverity else None,
                {"stream": INPUT_STREAM, "group": CONSUMER_GROUP}
            )
    except Exception as e:
        log_error_with_context(
            e,
            "telemetry_ingestor",
            "ensure_group",
            ErrorSeverity.HIGH if ErrorSeverity else None,
            {"stream": INPUT_STREAM, "group": CONSUMER_GROUP}
        )
        raise

async def run_ingestor():
    """Main ingestion loop with comprehensive error handling."""
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
            logger.info("Telemetry ingestor connected to Redis")
        except Exception as e:
            connection_retries += 1
            handle_redis_error("initial_connect", "telemetry_ingestor", e)
            if connection_retries >= max_connection_retries:
                logger.error(f"Failed to connect to Redis after {max_connection_retries} attempts")
                raise
            await asyncio.sleep(2 * connection_retries)
    
    aggr = SlidingAggregator()
    logger.info("Starting ingest loop: reading from %s", INPUT_STREAM)
    
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
                    handle_redis_error("ping", "telemetry_ingestor", e)
                    r = None
                    # Attempt reconnection
                    for retry in range(max_connection_retries):
                        try:
                            r = aioredis.from_url(REDIS_URL, decode_responses=True)
                            await r.ping()
                            await ensure_group(r)
                            logger.info("Telemetry ingestor reconnected to Redis")
                            break
                        except Exception as reconnect_error:
                            if retry == max_connection_retries - 1:
                                logger.error("Failed to reconnect to Redis")
                                raise
                            await asyncio.sleep(2 * (retry + 1))
            
            res = await r.xreadgroup(CONSUMER_GROUP, CONSUMER_NAME, {INPUT_STREAM: ">"}, count=BATCH_COUNT, block=BLOCK_MS)
            consecutive_errors = 0  # Reset on success
            
            if not res:
                # periodic houseclean: flush older small buckets (time threshold)
                # flush nothing for now
                continue
            
            msgs_to_ack = []
            msgs_failed = []
            aggregations = []
            
            for stream_name, entries in res:
                for msg_id, fields in entries:
                    try:
                        # fields come as { 'data': '<json string>' } or direct keys — support both
                        payload = None
                        if 'data' in fields:
                            try:
                                payload = json.loads(fields['data'])
                            except json.JSONDecodeError as e:
                                log_error_with_context(
                                    e,
                                    "telemetry_ingestor",
                                    "parse_payload",
                                    ErrorSeverity.MEDIUM if ErrorSeverity else None,
                                    {"msg_id": msg_id, "field_preview": str(fields.get('data', ''))[:200]}
                                )
                                # Try to use fields directly as fallback
                                payload = fields
                            except Exception as e:
                                log_error_with_context(
                                    e,
                                    "telemetry_ingestor",
                                    "parse_payload",
                                    ErrorSeverity.MEDIUM if ErrorSeverity else None,
                                    {"msg_id": msg_id}
                                )
                                payload = fields
                        else:
                            # if payload flattened, convert to dict
                            try:
                                payload = {
                                    k: (json.loads(v) if (isinstance(v, str) and v.startswith("{")) else v)
                                    for k, v in fields.items()
                                }
                            except Exception as e:
                                log_error_with_context(
                                    e,
                                    "telemetry_ingestor",
                                    "flatten_payload",
                                    ErrorSeverity.LOW if ErrorSeverity else None,
                                    {"msg_id": msg_id}
                                )
                                payload = fields
                        
                        # Validate payload before adding
                        if payload and isinstance(payload, dict):
                            aggr.add(payload)
                            msgs_to_ack.append(msg_id)
                        else:
                            logger.warning(f"Invalid payload format for message {msg_id}: {type(payload)}")
                            msgs_failed.append(msg_id)
                            
                    except Exception as e:
                        log_error_with_context(
                            e,
                            "telemetry_ingestor",
                            "process_message",
                            ErrorSeverity.MEDIUM if ErrorSeverity else None,
                            {"msg_id": msg_id}
                        )
                        msgs_failed.append(msg_id)
            
            # flush all buckets to create aggregate windows (simple policy)
            for key in list(aggr.buckets.keys()):
                try:
                    if aggr.buckets[key]["count"] >= 5:  # tunable
                        a = aggr.flush_bucket(key)
                        if a:
                            aggregations.append(a)
                except Exception as e:
                    log_error_with_context(
                        e,
                        "telemetry_ingestor",
                        "flush_bucket",
                        ErrorSeverity.LOW if ErrorSeverity else None,
                        {"bucket_key": str(key)}
                    )
            
            # push aggregations in batch to aggregates.stream
            if aggregations:
                try:
                    pipe = r.pipeline()
                    for a in aggregations:
                        try:
                            pipe.xadd(AGG_STREAM, {"payload": json.dumps(a)})
                        except Exception as e:
                            log_error_with_context(
                                e,
                                "telemetry_ingestor",
                                "xadd_aggregation",
                                ErrorSeverity.MEDIUM if ErrorSeverity else None,
                                {"aggregation_keys": list(a.keys()) if isinstance(a, dict) else "unknown"}
                            )
                    
                    await pipe.execute()
                    # trim results
                    try:
                        await r.xtrim(AGG_STREAM, maxlen=XTRIM_MAX, approximate=True)
                    except Exception as e:
                        log_error_with_context(
                            e,
                            "telemetry_ingestor",
                            "xtrim",
                            ErrorSeverity.LOW if ErrorSeverity else None
                        )
                except Exception as e:
                    handle_redis_error("publish_aggregations", "telemetry_ingestor", e)
                    r = None  # Mark connection as potentially broken
                    raise
            
            # bulk ack successful messages
            if msgs_to_ack:
                try:
                    await r.xack(INPUT_STREAM, CONSUMER_GROUP, *msgs_to_ack)
                except Exception as e:
                    handle_redis_error("xack", "telemetry_ingestor", e, {"msg_count": len(msgs_to_ack)})
                    r = None  # Mark connection as potentially broken
                    raise
            
            # Log failed messages for monitoring
            if msgs_failed:
                logger.warning(f"Failed to process {len(msgs_failed)} messages, will be retried")
                
        except asyncio.CancelledError:
            logger.info("Telemetry ingestor cancelled")
            break
        except (aioredis.exceptions.ConnectionError, OSError, ConnectionError) as e:
            consecutive_errors += 1
            handle_redis_error("xreadgroup", "telemetry_ingestor", e)
            r = None  # Mark connection as broken
            if consecutive_errors >= max_consecutive_errors:
                logger.error(f"Too many consecutive connection errors ({consecutive_errors}), shutting down")
                raise
            await asyncio.sleep(1 * consecutive_errors)
        except Exception as e:
            consecutive_errors += 1
            log_error_with_context(
                e,
                "telemetry_ingestor",
                "main_loop",
                ErrorSeverity.HIGH if ErrorSeverity else None,
                {"consecutive_errors": consecutive_errors}
            )
            if consecutive_errors >= max_consecutive_errors:
                logger.error(f"Too many consecutive errors ({consecutive_errors}), shutting down")
                raise
            await asyncio.sleep(0.5 * consecutive_errors)

if __name__ == "__main__":
    asyncio.run(run_ingestor())



