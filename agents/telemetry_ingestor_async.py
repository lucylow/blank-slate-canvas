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
from typing import Dict, Any
import time
import logging

import redis.asyncio as aioredis

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
    try:
        await r.xgroup_create(INPUT_STREAM, CONSUMER_GROUP, id="$", mkstream=True)
    except Exception:
        # already exists
        pass

async def run_ingestor():
    r = aioredis.from_url(REDIS_URL, decode_responses=True)
    await ensure_group(r)
    aggr = SlidingAggregator()
    logger.info("Starting ingest loop: reading from %s", INPUT_STREAM)
    while True:
        try:
            res = await r.xreadgroup(CONSUMER_GROUP, CONSUMER_NAME, {INPUT_STREAM: ">"}, count=BATCH_COUNT, block=BLOCK_MS)
            if not res:
                # periodic houseclean: flush older small buckets (time threshold)
                # flush nothing for now
                continue
            msgs_to_ack = []
            aggregations = []
            for stream_name, entries in res:
                for msg_id, fields in entries:
                    # fields come as { 'data': '<json string>' } or direct keys — support both
                    payload = None
                    if 'data' in fields:
                        try:
                            payload = json.loads(fields['data'])
                        except Exception:
                            payload = fields
                    else:
                        # if payload flattened, convert to dict
                        payload = {k: (json.loads(v) if (isinstance(v, str) and v.startswith("{")) else v) for k,v in fields.items()}
                    aggr.add(payload)
                    msgs_to_ack.append(msg_id)
                    # if bucket got large - flush heuristics (not shown)
            # flush all buckets to create aggregate windows (simple policy)
            for key in list(aggr.buckets.keys()):
                if aggr.buckets[key]["count"] >= 5:  # tunable
                    a = aggr.flush_bucket(key)
                    if a:
                        aggregations.append(a)
            # push aggregations in batch to aggregates.stream
            if aggregations:
                pipe = r.pipeline()
                for a in aggregations:
                    pipe.xadd(AGG_STREAM, {"payload": json.dumps(a)})
                await pipe.execute()
                # trim results
                await r.xtrim(AGG_STREAM, maxlen=XTRIM_MAX, approximate=True)
            # bulk ack
            if msgs_to_ack:
                # ack in one call or loop (redis-py xack accepts multiple ids)
                await r.xack(INPUT_STREAM, CONSUMER_GROUP, *msgs_to_ack)
        except Exception as e:
            logger.exception("Ingest loop error: %s", e)
            await asyncio.sleep(0.5)

if __name__ == "__main__":
    asyncio.run(run_ingestor())


