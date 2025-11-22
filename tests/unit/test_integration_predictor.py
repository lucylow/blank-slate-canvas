# tests/test_integration_predictor.py

"""
Integration test: pump 1k telemetry points and assert predictor outputs.

Drop this file into tests/ and run: pytest -q -k integration -s
Set REDIS_URL if your Redis is not on localhost.

This test imports and runs the in-process async agent loops defined in:
 - agents/telemetry_ingestor_async.py  -> run_ingestor()
 - agents/agent_orchestrator_async.py  -> run_orchestrator()
 - agents/predictor_agent_async.py     -> run_predictor()

It will:
 - flush the relevant Redis keys
 - start the three agents as asyncio tasks
 - XADD 1_000 telemetry messages to telemetry.stream
 - poll predict_results.stream until enough predictions arrive (or timeout)
 - assert predictions exist and have expected fields
 - cancel background tasks and cleanup
"""

import os
import asyncio
import json
import random
import time
import logging

import pytest

# use redis.asyncio client
import redis.asyncio as aioredis

# path to research doc included for agent priors (kept for provenance)
RESEARCH_DOC_PATH = "/mnt/data/3. Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .docx"

# Environment / streams (match your agents' defaults or set env vars)
REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")
TELEMETRY_STREAM = os.getenv("TELEMETRY_STREAM", "telemetry.stream")
AGG_STREAM = os.getenv("AGG_STREAM", "aggregates.stream")
PRED_STREAM = os.getenv("PRED_STREAM", "predict_results.stream")  # predictor publishes here

# Import the agent coroutines (these modules should be present in your repo)
# They are expected to define the top-level coroutine functions:
# run_ingestor, run_orchestrator, run_predictor
from agents.telemetry_ingestor_async import run_ingestor
from agents.agent_orchestrator_async import run_orchestrator
from agents.predictor_agent_async import run_predictor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_integration")

# mark as integration to allow selective runs
@pytest.mark.asyncio
@pytest.mark.integration
async def test_end_to_end_predictor_pipeline():
    # Connect to Redis
    r = aioredis.from_url(REDIS_URL, decode_responses=True)

    # Cleanup streams / keys that may exist from previous runs
    for key in (TELEMETRY_STREAM, AGG_STREAM, PRED_STREAM, "results.stream", "aggregates.stream"):
        try:
            await r.delete(key)
        except Exception:
            pass

    # Start agents in-process as background tasks
    tasks = []
    try:
        tasks.append(asyncio.create_task(run_ingestor()))
        tasks.append(asyncio.create_task(run_orchestrator()))
        tasks.append(asyncio.create_task(run_predictor()))

        # Give agents a moment to start and create groups
        await asyncio.sleep(0.5)

        # Pump 1_000 telemetry messages
        num_points = 1000
        tracks = ["cota", "road_america", "sebring", "sonoma", "vir", "barber", "indianapolis"]

        chassis_count = 31

        start_ts = time.time()
        for i in range(num_points):
            # synthetic telemetry point
            track = random.choice(tracks)
            chassis_id = f"GR86-{random.randint(1, chassis_count):03d}"
            lap = random.randint(1, 20)
            sector = random.randint(1, 3)
            payload = {
                "meta_time": time.time(),
                "track": track,
                "chassis": chassis_id,
                "lap": lap,
                "sector": sector,
                "lapdist_m": round(random.random() * 5000, 2),
                # a few telemetry signals expected by aggregator/predictor
                "speed_kmh": round(random.uniform(60, 220), 2),
                "accx_can": round(random.uniform(-3, 3), 3),
                "accy_can": round(random.uniform(-3, 3), 3),
                "throttle_pct": round(random.uniform(0, 100), 2),
                "brake_pct": round(random.uniform(0, 100), 2),
                "tire_temp": round(random.uniform(60, 120), 2),
                "rpm": random.randint(3000, 9000)
            }
            # write as 'data' JSON (ingestor supports both patterns)
            await r.xadd(TELEMETRY_STREAM, {"data": json.dumps(payload)})
            # small interleave to avoid a single-shot flood (tune as needed)
            if (i + 1) % 200 == 0:
                # small pause to allow pipeline to keep up
                await asyncio.sleep(0.05)

        logger.info("Pumped %d telemetry points in %.2fs", num_points, time.time() - start_ts)

        # Wait for predictor outputs: poll predict_results stream length
        timeout = 60.0  # seconds
        deadline = time.time() + timeout
        min_expected_predictions = max(10, int(num_points / 10))  # expect at least ~10% aggregated outputs
        predictions = []

        while time.time() < deadline:
            try:
                length = await r.xlen(PRED_STREAM)
            except Exception:
                length = 0
            if length >= min_expected_predictions:
                # read everything
                try:
                    entries = await r.xrange(PRED_STREAM, count=length)
                except Exception:
                    # fallback: use xrevrange to get latest
                    entries = await r.xrevrange(PRED_STREAM, count=length)
                # entries are list of (id, { 'payload': ... })
                for eid, fields in entries:
                    raw = fields.get("payload") or {}
                    try:
                        obj = json.loads(raw) if isinstance(raw, str) else raw
                    except Exception:
                        obj = raw
                    predictions.append(obj)
                break
            await asyncio.sleep(0.5)

        # Evaluate predictions
        logger.info("Collected %d predictions from %s", len(predictions), PRED_STREAM)
        assert len(predictions) >= min_expected_predictions, f"Too few predictions: got {len(predictions)}, expected >= {min_expected_predictions}"

        # Basic content checks on a few predictions
        sample = predictions[0]
        assert isinstance(sample, dict), "prediction payload should be a dict"
        assert "prediction" in sample or "prediction" in sample.get("task", {}) or "prediction" in sample.get("payload", {}), "prediction field missing in output"

    finally:
        # graceful shutdown: cancel background tasks
        for t in tasks:
            try:
                t.cancel()
            except Exception:
                pass
        # give tasks a moment to cancel
        await asyncio.sleep(0.3)
        # optional: flush streams after test to keep test environment clean
        try:
            await r.delete(TELEMETRY_STREAM)
            await r.delete(AGG_STREAM)
            await r.delete(PRED_STREAM)
            await r.delete("results.stream")
        except Exception:
            pass

