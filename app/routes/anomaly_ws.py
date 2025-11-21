# app/routes/anomaly_ws.py

import json
import logging
import asyncio
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.utils.ring_buffer import RingBuffer
from app.services.anomaly_engine import AnomalyEngine
import numpy as np

router = APIRouter()

logger = logging.getLogger(__name__)

# instantiate single engine for app (can be replaced with dependency injection)
ENGINE = AnomalyEngine(config={
    # basic defaults; tune per series/track
    "rules": {
        "brake_pressure": {"max": 2000, "dmax": 1000},
        "tire_temp": {"d_rate_c_per_s": 3.0},
        "speed": {"max": 220}
    },
    "use_pyod_iforest": False,  # set True if you trained and fitted IForest offline
    # "ae_model_path": "/path/to/ae_model.h5",
    "pyod_threshold": 0.5,
    "ae_threshold": 1e-3
})

# buffers per vehicle (sliding window)
VEHICLE_BUFFERS: Dict[str, RingBuffer] = {}


class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, Dict[WebSocket, None]] = {}  # vehicle_id -> websockets set

    async def connect(self, vehicle_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active.setdefault(vehicle_id, {})
        self.active[vehicle_id][websocket] = None
        logger.info("Client connected for vehicle %s. total=%d", vehicle_id, len(self.active[vehicle_id]))

    def disconnect(self, vehicle_id: str, websocket: WebSocket):
        if vehicle_id in self.active and websocket in self.active[vehicle_id]:
            del self.active[vehicle_id][websocket]
            logger.info("Client disconnected for vehicle %s. total=%d", vehicle_id, len(self.active[vehicle_id]))

    async def broadcast(self, vehicle_id: str, message: Dict[str, Any]):
        if vehicle_id not in self.active:
            return

        data = json.dumps(message, default=str)
        for ws in list(self.active[vehicle_id].keys()):
            try:
                await ws.send_text(data)
            except Exception as e:
                logger.exception("Failed to send ws to client: %s", e)


manager = ConnectionManager()


@router.websocket("/ws/telemetry/{vehicle_id}")
async def telemetry_ws(websocket: WebSocket, vehicle_id: str):
    # connect client for receiving alerts; but also we accept telemetry frames here too
    await manager.connect(vehicle_id, websocket)

    try:
        if vehicle_id not in VEHICLE_BUFFERS:
            VEHICLE_BUFFERS[vehicle_id] = RingBuffer(maxlen=2000)

        buffer = VEHICLE_BUFFERS[vehicle_id]

        while True:
            text = await websocket.receive_text()

            # expect JSON telemetry frames or commands
            payload = json.loads(text)

            # Accept two types of messages:
            # 1) telemetry: {"type":"telemetry", "ts":..., "speed":..., "brake_pressure":..., ...}
            # 2) control: {"type":"subscribe"} - ignore for now

            if payload.get('type') == 'telemetry' or 'ts' in payload:
                sample = payload

                # append to buffer
                buffer.append(sample)

                # prepare features: flattened recent window features for window detector
                # e.g. take last 20 samples, compute per-channel summary features
                recent = buffer.tail(20)

                # compute flattened summary vector: mean/std/last for keys
                keys = [k for k in sample.keys() if k not in ('ts', 'type', 'vehicle')]
                fv = []
                for k in keys:
                    arr = [float(s.get(k, 0.0) or 0.0) for s in recent]
                    if len(arr) == 0:
                        fv += [0.0, 0.0, 0.0]
                    else:
                        fv += [float(np.mean(arr)), float(np.std(arr)), float(arr[-1])]

                # prepare seq window for AE: shape (timesteps, features)
                seq_window = None
                try:
                    seq_arr = []
                    for s in recent:
                        seq_row = [float(s.get(k, 0.0) or 0.0) for k in keys]
                        seq_arr.append(seq_row)
                    if len(seq_arr) >= 8:
                        seq_window = np.array(seq_arr)  # (timesteps, features)
                except Exception:
                    seq_window = None

                # run engine detection in background to avoid blocking websocket receive
                loop = asyncio.get_event_loop()
                loop.create_task(process_and_maybe_alert(vehicle_id, sample, fv if fv else None, seq_window))

            else:
                # other message types: ignore or handle subscription messages
                pass

    except WebSocketDisconnect:
        manager.disconnect(vehicle_id, websocket)
    except Exception as e:
        logger.exception("WS telemetry loop crashed: %s", e)
        manager.disconnect(vehicle_id, websocket)


async def process_and_maybe_alert(vehicle_id: str, sample: Dict[str, Any], window_features: list, seq_window):
    """
    Run detection and broadcast alert if anomaly found.
    """
    alert = ENGINE.detect(vehicle_id, sample, window_features, seq_window)
    if alert:
        # add explainability: pick top channels by local zscores / reconstruction errors
        # Build a simple top_features list (channel -> deviation)
        payload = {
            "vehicle": vehicle_id,
            "alert": alert,
            "sample": sample,
            "ts": alert.get('ts')
        }

        # broadcast to all clients subscribed to this vehicle
        await manager.broadcast(vehicle_id, payload)

        # also log to server logs (file)
        logger.warning("Anomaly for %s: %s", vehicle_id, json.dumps(payload, default=str))

