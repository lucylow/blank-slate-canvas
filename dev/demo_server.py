# dev/demo_server.py

"""
Demo server for frontend interactive integration with mock data.

- Serves demo files found under:
    ./public/demo_data/*.json
  or falls back to:
    ./demo_data/*.json
    /mnt/data/demo_data.json
    /mnt/data/demo_data/<track>_demo.json

- HTTP endpoints:
    GET  /demo/tracks            -> list available demo tracks (id, name, filename)
    GET  /demo/track/{track_id}  -> JSON payload for given track
    GET  /api/insights/{id}      -> small stub (optionally read from artifacts)

- WebSocket:
    ws://<host>:8000/ws/agents   -> When a client connects the server will stream
                                    simulated 'insight_update' and 'eda_result'
                                    messages derived from the demo data.

Run:
    pip install fastapi uvicorn websockets aiofiles
    python dev/demo_server.py
"""

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Dict, List, Any, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("demo_server")

app = FastAPI(title="PitWall Demo Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# search candidate paths for demo data
SEARCH_PATHS = [
    Path("public/demo_data"),
    Path("demo_data"),
    Path("/mnt/data"),
    Path("."),
]


def find_demo_files() -> Dict[str, Path]:
    """Find demo JSON files and return mapping track_id -> Path."""
    demos: Dict[str, Path] = {}
    for base in SEARCH_PATHS:
        if not base.exists():
            continue
        for p in base.glob("**/*_demo.json"):
            # file names expected like sebring_demo.json or track_demo.json
            tid = p.stem.replace("_demo", "")
            demos[tid] = p.resolve()
        # also accept single demo_data.json that may contain many tracks
        f = base / "demo_data.json"
        if f.exists():
            demos["__bundle__"] = f.resolve()
    return demos


DEMO_FILES = find_demo_files()
logger.info("Demo files discovered: %s", {k: str(v) for k, v in DEMO_FILES.items()})


@app.get("/demo/tracks")
async def list_tracks():
    """
    Returns:
      [{ track_id, track_name, filename }]
    """
    demos = find_demo_files()
    out = []
    if "__bundle__" in demos:
        # bundle may contain a top-level index
        try:
            data = json.loads(demos["__bundle__"].read_text())
            # expect either dict with tracks or array
            if isinstance(data, dict) and "tracks" in data:
                for t in data["tracks"]:
                    out.append({"track_id": t.get("track_id"), "track_name": t.get("track_name")})
                return JSONResponse(out)
        except Exception:
            pass

    # individual files: open each minimal header to provide a name
    for tid, p in demos.items():
        if tid == "__bundle__":
            continue
        # try to peek at JSON
        try:
            txt = p.read_text(1024*64)
            obj = json.loads("{" + "}") if txt.strip().startswith("{") and "track_name" not in txt[:200] else json.loads(txt)
        except Exception:
            obj = {}
        # guess name from file or inside content
        name = obj.get("track_name") if isinstance(obj, dict) else None
        if not name:
            name = tid
        out.append({"track_id": tid, "track_name": name})
    return JSONResponse(out)


@app.get("/demo/track/{track_id}")
async def get_track(track_id: str):
    demos = find_demo_files()
    # if bundle, return filtered track
    if "__bundle__" in demos:
        try:
            bundle = json.loads(demos["__bundle__"].read_text())
            tracks = bundle.get("tracks") or []
            for t in tracks:
                if t.get("track_id") == track_id:
                    return JSONResponse(t)
        except Exception as e:
            logger.exception("bundle read failed: %s", e)
    # else find individual file
    p = demos.get(track_id)
    if p and p.exists():
        try:
            return JSONResponse(json.loads(p.read_text()))
        except Exception:
            return FileResponse(str(p))
    raise HTTPException(status_code=404, detail="track not found")


@app.get("/api/insights/{insight_id}")
async def get_insight(insight_id: str):
    # Simple stub: in demo, insights are transient. Return minimal structure
    return JSONResponse({"insight_id": insight_id, "predictions": {}, "explanation": {"top_features": [], "evidence": []}, "artifact_path": None})


# -------------------- WebSocket agent simulator --------------------

class AgentBroadcaster:
    def __init__(self):
        self.connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self._lock:
            self.connections.append(ws)
        logger.info("WS client connected (%d)", len(self.connections))

    async def disconnect(self, ws: WebSocket):
        async with self._lock:
            if ws in self.connections:
                self.connections.remove(ws)
        logger.info("WS client disconnected (%d)", len(self.connections))

    async def broadcast(self, message: Dict[str, Any]):
        async with self._lock:
            stale = []
            for ws in list(self.connections):
                try:
                    await ws.send_json(message)
                except Exception:
                    stale.append(ws)
            for s in stale:
                if s in self.connections:
                    self.connections.remove(s)


broadcaster = AgentBroadcaster()


@app.websocket("/ws/agents")
async def agents_ws(ws: WebSocket):
    await broadcaster.connect(ws)
    try:
        # send initial status
        await broadcaster.broadcast({"type": "connected", "data": {"msg": "demo server connected"}})
        while True:
            # wait for client messages (optional)
            try:
                msg = await ws.receive_json()
                if isinstance(msg, dict) and msg.get("cmd") == "start_demo":
                    # client requested start and provided track id
                    track_id = msg.get("track_id")
                    asyncio.create_task(play_demo(track_id))
                # support stop or ping if needed
            except Exception:
                # if no message or parse fail, just sleep
                await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        await broadcaster.disconnect(ws)


async def play_demo(track_id: Optional[str], rate_hz: float = 5.0):
    """
    Simulate agent outputs from a demo track.
    - rate_hz: how many insight messages per second to emit (for demo keep low)
    Produces messages:
      { type: 'insight_update', data: {...} }
      { type: 'eda_result', data: {...} }
      { type: 'agent_status', data: {...} }
    """
    demos = find_demo_files()
    if "__bundle__" in demos:
        try:
            bundle = json.loads(demos["__bundle__"].read_text())
            tracks = bundle.get("tracks", [])
            chosen = next((t for t in tracks if t.get("track_id") == track_id), None) if track_id else (tracks[0] if tracks else None)
        except Exception:
            chosen = None
    else:
        p = demos.get(track_id) if track_id else (next(iter(demos.values())) if demos else None)
        if p is None:
            logger.warning("no demo track found for play_demo(%s)", track_id)
            return
        try:
            chosen = json.loads(p.read_text())
        except Exception:
            chosen = None

    if not chosen:
        logger.warning("no chosen demo payload; aborting play_demo")
        return

    # Build a list of candidate insight messages from telemetry (lightweight)
    # Heuristic: sample one telemetry row per vehicle per lap and wrap as an insight
    messages = []
    races = chosen.get("races", []) if isinstance(chosen, dict) else []
    for r in races:
        t_samples = r.get("telemetry_sample") or []
        # sample every Nth row to create ~30 messages
        step = max(1, len(t_samples) // 30) if t_samples else 1
        for i in range(0, len(t_samples), step):
            row = t_samples[i]
            insight = {
                "insight_id": f"demo-{track_id}-{r.get('race_number')}-{i}",
                "track": chosen.get("track_id") or track_id,
                "summary": f"Demo insight @ lap {row.get('lap')} chassis {row.get('original_vehicle_id', row.get('vehicle_id'))}",
                "created_at": row.get("meta_time") or row.get("timestamp"),
                "chassis": row.get("original_vehicle_id") or row.get("vehicle_id"),
                "payload_preview": {"lap": row.get("lap"), "lapdist": row.get("lapdist_m"), "speed": row.get("speed_kmh")}
            }
            messages.append(insight)

    # If not many messages, synthesize a small set
    if not messages:
        messages = [{
            "insight_id": f"demo-{track_id}-sample-{i}",
            "track": track_id or "demo",
            "summary": f"Demo synthetic insight {i}",
            "created_at": None,
            "chassis": f"GR86-{i%31 + 1:03d}",
            "payload_preview": {}
        } for i in range(20)]

    # broadcast loop
    try:
        for idx, msg in enumerate(messages):
            await broadcaster.broadcast({"type": "insight_update", "data": msg})
            # every N messages send an EDA result summary
            if idx % 8 == 0:
                eda = {
                    "insight_id": f"eda-{track_id}-{idx}",
                    "track": track_id,
                    "summary": "EDA cluster summary (demo)",
                    "created_at": None,
                    "artifact_path": None,
                    "profile": {"clusters": {"0": {"count": 10}, "1": {"count": 5}}}
                }
                await broadcaster.broadcast({"type": "eda_result", "data": eda})
            # occasionally send agent health statuses
            if idx % 12 == 0:
                await broadcaster.broadcast({"type": "agent_status", "data": {"agentId": "eda-agent-1", "status": "healthy"}})
            await asyncio.sleep(1.0 / max(0.1, rate_hz))
    except Exception:
        logger.exception("play_demo aborted")
    logger.info("play_demo finished for %s", track_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("dev.demo_server:app", host="0.0.0.0", port=8000, reload=True)



