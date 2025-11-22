# app/routes/insights.py

"""
Insights storage & retrieval for anomalies, coaching, explanations.

Why: Nelson wants to replay anomalies; frontend needs evidence traces.

"""



import json

import os

import logging

import time

from fastapi import APIRouter, HTTPException

import redis



router = APIRouter()

logger = logging.getLogger(__name__)



REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379")



try:

    redis_client = redis.from_url(REDIS_URL, decode_responses=True)

except Exception as e:

    logger.warning(f"Redis not available: {e}")

    redis_client = None



@router.get("/insights/{insight_id}")

async def fetch_insight(insight_id: str):

    """

    Fetch a stored insight (anomaly, coaching, explanation).

    Frontend calls this to get detailed evidence for replay.

    """

    try:

        if redis_client:

            key = f"insight:{insight_id}"

            data = redis_client.hgetall(key)

            

            if not data:

                raise HTTPException(status_code=404, detail=f"Insight {insight_id} not found")

            

            # Reconstruct insight from Redis hash

            payload = json.loads(data.get("payload", "{}"))

            return {

                "insight_id": insight_id,

                "payload": payload,

                "created_at": data.get("created_at"),

                "type": data.get("type", "unknown")

            }

        else:

            # Demo mode

            demo_insight = {

                "insight_id": insight_id,

                "type": "anomaly",

                "title": "Tire Lockup Detected",

                "lap": 12,

                "sector": "S2",

                "severity": "high",

                "evidence": {

                    "brake_pressure_peak": 1.8,

                    "speed_drop": 15,

                    "steering_angle_variance": 0.35

                },

                "trace": {

                    "timestamps": [0.0, 0.1, 0.2, 0.3, 0.4],

                    "brake_pressure": [1.5, 1.7, 1.8, 1.6, 1.4],

                    "speed_kmh": [210, 205, 190, 195, 200]

                }

            }

            return demo_insight

    

    except HTTPException:

        raise

    except Exception as e:

        logger.error(f"Error fetching insight: {e}")

        raise HTTPException(status_code=500, detail=str(e))



@router.post("/insights")

async def create_insight(data: dict):

    """

    Create and store a new insight (called by agents).

    Stores in Redis for later retrieval.

    """

    try:

        insight_id = f"insight_{int(time.time() * 1000)}"

        

        if redis_client:

            redis_client.hset(

                f"insight:{insight_id}",

                mapping={

                    "payload": json.dumps(data),

                    "created_at": time.time(),

                    "type": data.get("type", "generic")

                }

            )

            # Set expiry: 24 hours

            redis_client.expire(f"insight:{insight_id}", 86400)

        

        logger.info(f"✓ Insight created: {insight_id}")

        return {"success": True, "insight_id": insight_id}

    

    except Exception as e:

        logger.error(f"Error creating insight: {e}")

        raise HTTPException(status_code=500, detail=str(e))



@router.get("/insights")

async def list_insights(vehicle_id: str = None, limit: int = 20):

    """List recent insights for a vehicle."""

    try:

        if redis_client:

            # Get all insight keys

            keys = redis_client.keys("insight:*")

            keys = keys[-limit:] if len(keys) > limit else keys

            

            insights = []

            for key in keys:

                data = redis_client.hgetall(key)

                insights.append({

                    "insight_id": key.replace("insight:", ""),

                    "type": data.get("type"),

                    "created_at": float(data.get("created_at", 0))

                })

            

            return {"insights": sorted(insights, key=lambda x: -x["created_at"])}

        else:

            # Demo

            return {

                "insights": [

                    {"insight_id": f"insight_{1000+i}", "type": "anomaly", "created_at": time.time() - i*60}

                    for i in range(min(limit, 5))

                ]

            }

    

    except Exception as e:

        logger.error(f"Error listing insights: {e}")

        raise HTTPException(status_code=500, detail=str(e))



@router.get("/insights/{insight_id}/evidence")

async def get_insight_evidence(insight_id: str):

    """Get detailed evidence traces for an insight (for replay)."""

    try:

        insight = await fetch_insight(insight_id)

        evidence = insight.get("payload", {}).get("evidence", {})

        

        # Return minimal trace for visualization

        return {

            "insight_id": insight_id,

            "evidence": evidence,

            "trace_available": "trace" in insight.get("payload", {})

        }

    

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))
