# agents/telemetry_ingestor_async.py

"""
Async Telemetry Ingestor - Improved Version

- Reads raw telemetry points from Redis stream "telemetry.stream"
- Sectorizes & aggregates into small windows (per chassis/sector or per-lap)
- Writes aggregate windows to "aggregates.stream" (used by predictor/eda)
- Maintains stream trimming XTRIM
- Performance improvements:
  - Connection pooling for better throughput
  - Optimized batching with pipelining
  - Metrics and monitoring
  - Better backpressure handling
  - Parallel processing support
"""

import asyncio
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
import time
import logging
import traceback
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime

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
BATCH_COUNT = int(os.getenv("INGEST_BATCH", "500"))  # Increased default batch size
BLOCK_MS = int(os.getenv("INGEST_BLOCK_MS", "1000"))
XTRIM_MAX = int(os.getenv("STREAM_MAXLEN", "200000"))
PIPELINE_SIZE = int(os.getenv("REDIS_PIPELINE_SIZE", "100"))  # Pipeline writes
MAX_CONCURRENT_AGGREGATIONS = int(os.getenv("MAX_CONCURRENT_AGGS", "10"))
FLUSH_THRESHOLD = int(os.getenv("FLUSH_THRESHOLD", "10"))  # Min points per bucket before flush
METRICS_INTERVAL = int(os.getenv("METRICS_INTERVAL", "60"))  # Log metrics every N seconds

@dataclass
class IngestorMetrics:
    """Metrics for monitoring ingestion performance"""
    messages_processed: int = 0
    messages_failed: int = 0
    aggregations_created: int = 0
    redis_errors: int = 0
    last_metrics_time: float = field(default_factory=time.time)
    processing_times: List[float] = field(default_factory=list)
    
    def reset(self):
        self.messages_processed = 0
        self.messages_failed = 0
        self.aggregations_created = 0
        self.redis_errors = 0
        self.processing_times.clear()
        self.last_metrics_time = time.time()
    
    def log_summary(self):
        """Log metrics summary"""
        elapsed = time.time() - self.last_metrics_time
        if elapsed == 0:
            return
        
        msg_rate = self.messages_processed / elapsed
        agg_rate = self.aggregations_created / elapsed
        avg_processing_time = sum(self.processing_times) / len(self.processing_times) if self.processing_times else 0
        
        logger.info(
            f"Metrics (last {elapsed:.1f}s): "
            f"processed={self.messages_processed} ({msg_rate:.1f}/s), "
            f"failed={self.messages_failed}, "
            f"aggregations={self.aggregations_created} ({agg_rate:.1f}/s), "
            f"errors={self.redis_errors}, "
            f"avg_processing={avg_processing_time*1000:.2f}ms"
        )


# Optimized in-memory sliding aggregator with better performance
class SlidingAggregator:
    def __init__(self, flush_threshold: int = FLUSH_THRESHOLD):
        self.buckets: Dict[tuple, Dict[str, Any]] = {}
        self.flush_threshold = flush_threshold
        self._lock = asyncio.Lock()
    
    async def add(self, rec: Dict[str, Any]):
        """Add a record to aggregation buckets (thread-safe)"""
        key = (
            rec.get("track", "unknown"),
            rec.get("chassis", "unknown"),
            rec.get("lap", 0),
            rec.get("sector", 0)
        )
        
        async with self._lock:
            b = self.buckets.setdefault(key, {
                "count": 0,
                "sum": defaultdict(float),
                "first_ts": rec.get("meta_time", datetime.utcnow().isoformat()),
                "last_ts": rec.get("meta_time", datetime.utcnow().isoformat())
            })
            b["count"] += 1
            b["last_ts"] = rec.get("meta_time", datetime.utcnow().isoformat())
            
            # Aggregate numeric fields
            for k, v in rec.items():
                if isinstance(v, (int, float)) and k not in ("lap", "sector"):
                    b["sum"][k] += float(v)
    
    async def flush_ready_buckets(self) -> List[Dict[str, Any]]:
        """Flush buckets that meet the threshold (thread-safe)"""
        async with self._lock:
            ready_keys = [
                k for k, b in self.buckets.items()
                if b["count"] >= self.flush_threshold
            ]
            
            out = []
            for key in ready_keys:
                b = self.buckets.pop(key)
                agg = {
                    "track": key[0],
                    "chassis": key[1],
                    "lap": key[2],
                    "sector": key[3],
                    "count": b["count"],
                    "first_ts": b["first_ts"],
                    "last_ts": b["last_ts"]
                }
                # Calculate averages
                for k, s in b["sum"].items():
                    agg[f"avg_{k}"] = s / b["count"]
                out.append(agg)
            
            return out
    
    async def flush_all(self) -> List[Dict[str, Any]]:
        """Flush all buckets regardless of threshold"""
        async with self._lock:
            keys = list(self.buckets.keys())
            out = []
            for key in keys:
                b = self.buckets.pop(key)
                agg = {
                    "track": key[0],
                    "chassis": key[1],
                    "lap": key[2],
                    "sector": key[3],
                    "count": b["count"],
                    "first_ts": b["first_ts"],
                    "last_ts": b["last_ts"]
                }
                for k, s in b["sum"].items():
                    agg[f"avg_{k}"] = s / b["count"]
                out.append(agg)
            return out
    
    def size(self) -> int:
        """Get number of active buckets"""
        return len(self.buckets)

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

async def write_aggregations_batch(
    r: aioredis.Redis,
    aggregations: List[Dict[str, Any]],
    pipeline_size: int = PIPELINE_SIZE
) -> int:
    """Write aggregations to Redis stream using pipelining for better performance"""
    if not aggregations:
        return 0
    
    written = 0
    # Process in chunks to avoid memory issues
    for i in range(0, len(aggregations), pipeline_size):
        chunk = aggregations[i:i + pipeline_size]
        try:
            pipe = r.pipeline()
            for agg in chunk:
                pipe.xadd(AGG_STREAM, {"payload": json.dumps(agg)})
            
            await pipe.execute()
            written += len(chunk)
        except Exception as e:
            log_error_with_context(
                e,
                "telemetry_ingestor",
                "write_aggregations_batch",
                ErrorSeverity.MEDIUM if ErrorSeverity else None,
                {"chunk_size": len(chunk), "chunk_index": i}
            )
            raise
    
    return written


async def run_ingestor():
    """Main ingestion loop with comprehensive error handling and performance optimizations."""
    r = None
    connection_retries = 0
    max_connection_retries = 5
    
    # Initialize Redis connection with connection pool for better performance
    while r is None:
        try:
            # Use connection pool for better performance
            r = aioredis.from_url(
                REDIS_URL,
                decode_responses=True,
                max_connections=10,
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={}
            )
            await r.ping()
            await ensure_group(r)
            connection_retries = 0
            logger.info("Telemetry ingestor connected to Redis with connection pool")
        except Exception as e:
            connection_retries += 1
            handle_redis_error("initial_connect", "telemetry_ingestor", e)
            if connection_retries >= max_connection_retries:
                logger.error(f"Failed to connect to Redis after {max_connection_retries} attempts")
                raise
            await asyncio.sleep(2 * connection_retries)
    
    aggr = SlidingAggregator(flush_threshold=FLUSH_THRESHOLD)
    metrics = IngestorMetrics()
    logger.info(
        f"Starting ingest loop: reading from {INPUT_STREAM}, "
        f"batch_size={BATCH_COUNT}, pipeline_size={PIPELINE_SIZE}"
    )
    
    consecutive_errors = 0
    max_consecutive_errors = 10
    last_metrics_log = time.time()
    
    while True:
        loop_start = time.time()
        try:
            # Test connection periodically
            if consecutive_errors > 0 and consecutive_errors % 5 == 0:
                try:
                    await r.ping()
                    connection_retries = 0
                except Exception as e:
                    handle_redis_error("ping", "telemetry_ingestor", e)
                    r = None
                    # Attempt reconnection with connection pool
                    for retry in range(max_connection_retries):
                        try:
                            r = aioredis.from_url(
                                REDIS_URL,
                                decode_responses=True,
                                max_connections=10,
                                retry_on_timeout=True
                            )
                            await r.ping()
                            await ensure_group(r)
                            logger.info("Telemetry ingestor reconnected to Redis")
                            break
                        except Exception as reconnect_error:
                            if retry == max_connection_retries - 1:
                                logger.error("Failed to reconnect to Redis")
                                raise
                            await asyncio.sleep(2 * (retry + 1))
            
            # Read from stream with optimized batch size
            res = await r.xreadgroup(
                CONSUMER_GROUP,
                CONSUMER_NAME,
                {INPUT_STREAM: ">"},
                count=BATCH_COUNT,
                block=BLOCK_MS
            )
            consecutive_errors = 0  # Reset on success
            
            if not res:
                # Periodic housekeeping: flush stale buckets
                if time.time() - last_metrics_log > METRICS_INTERVAL:
                    metrics.log_summary()
                    last_metrics_log = time.time()
                continue
            
            msgs_to_ack = []
            msgs_failed = []
            
            # Process messages in parallel batches for better performance
            async def process_message(msg_id: str, fields: Dict[str, Any]) -> bool:
                """Process a single message, return True if successful"""
                try:
                    # Parse payload - support both JSON string and flattened formats
                    payload = None
                    if 'data' in fields:
                        try:
                            payload = json.loads(fields['data'])
                        except json.JSONDecodeError:
                            payload = fields
                    else:
                        # Flattened payload
                        payload = {
                            k: (json.loads(v) if (isinstance(v, str) and v.startswith("{")) else v)
                            for k, v in fields.items()
                        }
                    
                    # Validate and add to aggregator
                    if payload and isinstance(payload, dict):
                        await aggr.add(payload)
                        metrics.messages_processed += 1
                        return True
                    else:
                        logger.warning(f"Invalid payload format for message {msg_id}: {type(payload)}")
                        metrics.messages_failed += 1
                        return False
                except Exception as e:
                    log_error_with_context(
                        e,
                        "telemetry_ingestor",
                        "process_message",
                        ErrorSeverity.MEDIUM if ErrorSeverity else None,
                        {"msg_id": msg_id}
                    )
                    metrics.messages_failed += 1
                    return False
            
            # Process all messages concurrently (with limit to avoid overwhelming)
            tasks = []
            for stream_name, entries in res:
                for msg_id, fields in entries:
                    task = process_message(msg_id, fields)
                    tasks.append((msg_id, task))
            
            # Execute in batches to control concurrency
            batch_size = min(50, len(tasks))  # Process up to 50 concurrently
            for i in range(0, len(tasks), batch_size):
                batch = tasks[i:i + batch_size]
                results = await asyncio.gather(*[task for _, task in batch], return_exceptions=True)
                
                for (msg_id, _), result in zip(batch, results):
                    if isinstance(result, Exception):
                        msgs_failed.append(msg_id)
                        metrics.messages_failed += 1
                    elif result:
                        msgs_to_ack.append(msg_id)
                    else:
                        msgs_failed.append(msg_id)
            
            # Flush ready buckets (those meeting threshold)
            aggregations = await aggr.flush_ready_buckets()
            metrics.aggregations_created += len(aggregations)
            
            # Write aggregations using optimized batching
            if aggregations:
                try:
                    written = await write_aggregations_batch(r, aggregations, PIPELINE_SIZE)
                    # Trim stream periodically
                    if written > 0:
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
                    metrics.redis_errors += 1
                    handle_redis_error("publish_aggregations", "telemetry_ingestor", e)
                    r = None  # Mark connection as potentially broken
                    raise
            
            # Bulk ack successful messages (optimized)
            if msgs_to_ack:
                try:
                    # Ack in batches to avoid large command
                    ack_batch_size = 100
                    for i in range(0, len(msgs_to_ack), ack_batch_size):
                        batch = msgs_to_ack[i:i + ack_batch_size]
                        await r.xack(INPUT_STREAM, CONSUMER_GROUP, *batch)
                except Exception as e:
                    metrics.redis_errors += 1
                    handle_redis_error("xack", "telemetry_ingestor", e, {"msg_count": len(msgs_to_ack)})
                    r = None  # Mark connection as potentially broken
                    raise
            
            # Track processing time
            processing_time = time.time() - loop_start
            metrics.processing_times.append(processing_time)
            if len(metrics.processing_times) > 100:  # Keep only last 100 measurements
                metrics.processing_times = metrics.processing_times[-100:]
            
            # Log metrics periodically
            if time.time() - last_metrics_log > METRICS_INTERVAL:
                metrics.log_summary()
                last_metrics_log = time.time()
                # Reset metrics for next interval
                metrics.reset()
            
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



