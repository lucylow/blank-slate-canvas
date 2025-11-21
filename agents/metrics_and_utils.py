# agents/metrics_and_utils.py

"""
Prometheus metrics & helper endpoints

Run a light FastAPI server exposing /metrics and health checks.

"""

from prometheus_client import Counter, Gauge, start_http_server
import os
import time
import logging
import asyncio
import redis.asyncio as aioredis

INGESTED = Counter("telemetry_ingested_total", "Total telemetry points ingested")
AGG_WINDOWS = Counter("agg_windows_emitted_total", "Aggregate windows emitted")
QUEUE_LEN = Gauge("agent_queue_length", "Agent queue length", ["agent_id"])

def start_metrics_server(port: int = 9000):
    logging.info("Starting metrics server on %d", port)
    start_http_server(port)

def set_queue_len(agent_id: str, value: int):
    QUEUE_LEN.labels(agent_id=agent_id).set(value)

# quick housekeeping: a small function to call XTRIM periodically
async def periodic_trim(redis_url, stream, maxlen=200000, interval_s=30):
    r = aioredis.from_url(redis_url)
    while True:
        try:
            await r.xtrim(stream, maxlen=maxlen, approximate=True)
        except Exception as e:
            logging.exception("trim failed: %s", e)
        await asyncio.sleep(interval_s)

