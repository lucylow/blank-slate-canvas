# src/backend/replay_api.py
"""
Replay API with predictive model integration.
- POST /api/replay -> upload CSV
- POST /api/replay/{id}/simulate_pit -> returns naive + model-based simulations
- GET /api/replay/{id}
- GET /api/replay/{id}/simulations/{sim_id}

Place your predictive model (joblib) at: models/total_time_predictor.joblib
Model contract (recommended):
 - Input: DataFrame with one row per car and feature columns:
     ['car','baseline_time','avg_lap_time','laps_completed','laps_remaining','pit_at_lap','pit_time_cost', ...]
 - Output: array-like predicted final total times (seconds) matching input order.
"""

import os
import uuid
import json
from pathlib import Path
from typing import Optional, Dict, Any, List

import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# optional model tools
try:
    import joblib
    JOBLIB_AVAILABLE = True
except ImportError:
    JOBLIB_AVAILABLE = False

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("replay_api_model")

# Design brief local path included in metadata (developer-provided)
DESIGN_BRIEF_URL = "file:///mnt/data/Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I.  (4).docx"

# Basic config
BASE_DIR = Path("replays")
BASE_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = 30 * 1024 * 1024  # 30 MB

# Where your model(s) live - adjust path relative to project root
PROJECT_ROOT = Path(__file__).parent.parent.parent
MODEL_PATH = PROJECT_ROOT / "models" / "total_time_predictor.joblib"
# Optionally an "agent ensemble" folder:
AGENTS_DIR = PROJECT_ROOT / "models" / "agents"

# Load model if exists
MODEL = None
if JOBLIB_AVAILABLE and MODEL_PATH.exists():
    try:
        MODEL = joblib.load(str(MODEL_PATH))
        logger.info(f"Loaded predictive model from {MODEL_PATH}")
    except Exception as e:
        logger.exception("Failed to load model; continuing without model: %s", e)
        MODEL = None
else:
    if not JOBLIB_AVAILABLE:
        logger.info("joblib not available - falling back to naive simulator.")
    else:
        logger.info("No predictive model found at %s — falling back to naive simulator.", MODEL_PATH)

# Attempt to load agent models (optional)
AGENT_MODELS = {}
if JOBLIB_AVAILABLE and AGENTS_DIR.exists() and AGENTS_DIR.is_dir():
    for p in AGENTS_DIR.glob("*.joblib"):
        try:
            AGENT_MODELS[p.stem] = joblib.load(str(p))
            logger.info("Loaded agent model: %s", p.stem)
        except Exception as e:
            logger.exception("Failed to load agent model %s: %s", p, e)

app = FastAPI(title="PitWall A.I. Replay API (with model)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------
# Helpers
# -----------------------
def _time_str_to_seconds(t: str) -> Optional[float]:
    if pd.isna(t):
        return None
    try:
        s = str(t).strip()
        if ":" in s:
            parts = s.split(":")
            if len(parts) == 2:
                return float(parts[0]) * 60.0 + float(parts[1])
            elif len(parts) == 3:
                return float(parts[0]) * 3600.0 + float(parts[1]) * 60.0 + float(parts[2])
        return float(s)
    except Exception:
        return None


def _safe_read_csv_bytes(b: bytes) -> pd.DataFrame:
    try:
        text = b.decode("utf-8")
    except UnicodeDecodeError:
        text = b.decode("latin-1")
    for sep in [",", ";", "\t"]:
        try:
            df = pd.read_csv(pd.io.common.StringIO(text), sep=sep)
            if df.shape[1] > 1:
                return df
        except Exception:
            continue
    return pd.read_csv(pd.io.common.StringIO(text), sep=",")


def _summarize_replay_df(df: pd.DataFrame) -> Dict[str, Any]:
    cols = [c for c in df.columns]
    car_col = next((c for c in cols if c.lower() in ("number", "car", "car_number", "vehicle", "vehicle_number")), None)
    lap_col = next((c for c in cols if "lap" in c.lower()), None)
    total_time_candidates = [c for c in cols if "total_time" in c.lower() or "total_time" == c.lower() or "race_time" in c.lower()]
    total_time_col = total_time_candidates[0] if total_time_candidates else None

    cars = sorted(df[car_col].unique().tolist()) if car_col else []
    laps = sorted(df[lap_col].unique().tolist()) if lap_col else []
    n_rows = int(len(df))

    podium = []
    if total_time_col:
        df["_total_time_sec"] = df[total_time_col].apply(_time_str_to_seconds)
        pos_col = next((c for c in cols if "position" in c.lower()), None)
        if pos_col:
            try:
                podium_df = df.sort_values(pos_col).head(3)
                for _, r in podium_df.iterrows():
                    podium.append({"position": int(r[pos_col]), "car": r[car_col], "total_time": r[total_time_col]})
            except Exception:
                pass

    meta = {
        "n_rows": n_rows,
        "columns": cols,
        "car_count": len(cars),
        "cars": cars,
        "lap_count": len(laps),
        "laps": laps[:10],
        "podium": podium,
        "design_brief": DESIGN_BRIEF_URL,
    }
    return meta, car_col, lap_col, total_time_col


def _load_parsed_df(replay_dir: Path) -> pd.DataFrame:
    p = replay_dir / "parsed.parquet"
    if p.exists():
        return pd.read_parquet(p)
    p2 = replay_dir / "parsed.csv"
    if p2.exists():
        return pd.read_csv(p2)
    raise FileNotFoundError("Parsed replay file not found")


# -----------------------
# Per-car feature builder for predictive model
# -----------------------
def build_features_for_model(df: pd.DataFrame, car_col: str, lap_col: Optional[str],
                             candidate_pit_lap: Optional[int], target_car_id: str,
                             total_time_col: Optional[str]) -> pd.DataFrame:
    """
    Build a DataFrame with one row per car containing the features your model expects.

    Suggested columns:
      - car (id)
      - baseline_time (seconds)  # current total_time or aggregated sum
      - avg_lap_time (seconds)
      - laps_completed (int)
      - laps_remaining (int)
      - pit_at_lap (int) # the pit lap applied to TARGET car, else 0
      - pit_time_cost
      - other domain features (power_to_weight, track_score) if available
    """
    cols = [c for c in df.columns]
    # compute baseline_time per car
    baseline = {}
    if total_time_col:
        # try parse total time (one row per car expected)
        # fallback: if there are multiple rows per car, take earliest non-null total_time
        grouped = df.groupby(car_col)
        for k, g in grouped:
            # try find first non-null total_time
            tvals = g[total_time_col].apply(lambda x: _time_str_to_seconds(x) if pd.notna(x) else None).dropna()
            if not tvals.empty:
                baseline[str(k)] = float(tvals.iloc[0])
            else:
                baseline[str(k)] = None
    else:
        # attempt to compute sum of lap_time
        lap_time_col = next((c for c in cols if "lap_time" in c.lower() or "lap_seconds" in c.lower()), None)
        if lap_time_col:
            gp = df.groupby(car_col)[lap_time_col].sum()
            for k, v in gp.items():
                baseline[str(k)] = float(v)
        else:
            # fallback: set baseline to NaN
            for k in df[car_col].unique():
                baseline[str(k)] = np.nan

    # compute avg lap time and laps completed
    features = []
    for car in sorted(df[car_col].unique().tolist()):
        car_rows = df[df[car_col] == car]
        # laps completed
        laps_completed = 0
        if lap_col and lap_col in car_rows.columns:
            laps_completed = int(car_rows[lap_col].nunique())

        # avg lap time
        lap_time_col = next((c for c in cols if "lap_time" in c.lower() or "lap_seconds" in c.lower()), None)
        avg_lap = None
        if lap_time_col and lap_time_col in car_rows.columns:
            try:
                avg_lap = float(pd.to_numeric(car_rows[lap_time_col], errors="coerce").dropna().mean())
            except Exception:
                avg_lap = None
        # laps_remaining — need global max laps in file
        max_lap = int(df[lap_col].max()) if (lap_col and lap_col in df.columns and df[lap_col].dtype.kind in "iuf") else None
        laps_remaining = (max_lap - laps_completed) if max_lap is not None else None

        # pit_at_lap only applies to target car; for other cars 0
        pit_at_lap = int(candidate_pit_lap) if str(car) == str(target_car_id) and candidate_pit_lap is not None else 0

        row = {
            "car": str(car),
            "baseline_time": float(baseline.get(str(car)) or 0.0),
            "avg_lap_time": float(avg_lap or 0.0),
            "laps_completed": int(laps_completed),
            "laps_remaining": int(laps_remaining) if laps_remaining is not None else -1,
            "pit_at_lap": int(pit_at_lap),
            # include placeholders for domain params that your model may expect:
            "pit_time_cost": 21.4,
            "outlap_penalty": 1.5,
        }
        features.append(row)
    feat_df = pd.DataFrame(features)
    # Ensure ordering consistent
    feat_df = feat_df.sort_values("car").reset_index(drop=True)
    return feat_df


# -----------------------
# Naive simulator (keeps backwards compatibility)
# -----------------------
def naive_simulate(baseline: Dict[str, float], target_car: str, pit_at_lap: Optional[int],
                   pit_cost: float, outlap_penalty: float, delay_penalty_per_lap: float) -> Dict[str, Any]:
    sim_times = {c: baseline[c] for c in baseline}
    if target_car not in sim_times:
        raise ValueError("Target car not present in baseline times.")
    if pit_at_lap is not None:
        sim_times[target_car] = (sim_times[target_car] or 0.0) + pit_cost + outlap_penalty + (max(0, pit_at_lap - 1) * delay_penalty_per_lap)
    ordered = sorted(sim_times.items(), key=lambda kv: kv[1] if kv[1] is not None else 1e9)
    results = [{"car": str(c), "pred_time": t} for c, t in ordered]
    baseline_ordered = sorted(baseline.items(), key=lambda kv: kv[1] if kv[1] is not None else 1e9)
    def pos_of(order_list, carid):
        for idx, (c, t) in enumerate(order_list):
            if str(c) == str(carid):
                return idx + 1
        return None
    baseline_pos = pos_of(baseline_ordered, target_car)
    sim_pos = pos_of(list(sim_times.items()), target_car)
    return {"ordered": results, "target_car": target_car, "baseline_pos": baseline_pos, "sim_pos": sim_pos}


# -----------------------
# Endpoint: upload a replay CSV
# -----------------------
@app.post("/api/replay", response_model=Dict)
async def create_replay(file: UploadFile = File(...)):
    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded.")
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large (limit 30MB).")

    replay_id = uuid.uuid4().hex
    replay_dir = BASE_DIR / replay_id
    replay_dir.mkdir(parents=True, exist_ok=True)
    raw_path = replay_dir / "original_upload.csv"
    raw_path.write_bytes(contents)

    try:
        df = _safe_read_csv_bytes(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {e}")

    meta, car_col, lap_col, total_time_col = _summarize_replay_df(df)
    parsed_path = replay_dir / "parsed.parquet"
    try:
        df.to_parquet(parsed_path, index=False)
    except Exception:
        parsed_path = replay_dir / "parsed.csv"
        df.to_csv(parsed_path, index=False)

    meta_path = replay_dir / "meta.json"
    meta_payload = {"replay_id": replay_id, "file_name": file.filename, "rows": int(len(df)), **meta}
    meta_path.write_text(json.dumps(meta_payload, indent=2), encoding="utf-8")
    return JSONResponse({"replay_id": replay_id, "meta": meta_payload})


# -----------------------
# GET replay metadata
# -----------------------
@app.get("/api/replay/{replay_id}")
def get_replay(replay_id: str):
    replay_dir = BASE_DIR / replay_id
    if not replay_dir.exists():
        raise HTTPException(status_code=404, detail="Replay not found")
    meta_path = replay_dir / "meta.json"
    if not meta_path.exists():
        raise HTTPException(status_code=500, detail="Replay meta missing")
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    return JSONResponse(meta)


# -----------------------
# POST simulate_pit -> now with model fallback
# -----------------------
@app.post("/api/replay/{replay_id}/simulate_pit", response_model=Dict)
def simulate_pit(replay_id: str, payload: Dict = Body(...)):
    """
    Body:
      { "car": "86", "lap": 12, "action": "box_now" }
    Returns:
      {
        "sim_id": "...",
        "naive": { ... },
        "model": { ... }  # present only if MODEL loaded and predictions succeed
      }
    """
    replay_dir = BASE_DIR / replay_id
    if not replay_dir.exists():
        raise HTTPException(status_code=404, detail="Replay not found")

    try:
        df = _load_parsed_df(replay_dir)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load parsed replay: {e}")

    # Parse request
    car = payload.get("car")
    lap = int(payload.get("lap")) if payload.get("lap") is not None else None
    action = payload.get("action", "simulate_all")

    # Identify columns
    cols = [c for c in df.columns]
    car_col = next((c for c in cols if c.lower() in ("number", "car", "car_number", "vehicle", "vehicle_number")), None)
    total_time_col = next((c for c in cols if "total_time" in c.lower()), None)
    lap_col_name = next((c for c in cols if "lap" in c.lower()), None)

    # Build baseline per-car total times (try parse)
    baseline = {}
    if total_time_col:
        for _, r in df.drop_duplicates(subset=[car_col]).iterrows():
            t = _time_str_to_seconds(r[total_time_col]) if pd.notna(r.get(total_time_col)) else None
            baseline[str(r[car_col])] = float(t) if t is not None else None
    else:
        # fallback: sum lap_time if exists
        lap_time_col = next((c for c in cols if "lap_time" in c.lower() or "lap_seconds" in c.lower()), None)
        if lap_time_col:
            gp = df.groupby(car_col)[lap_time_col].sum()
            for k, v in gp.items():
                baseline[str(k)] = float(v)
    if not baseline:
        raise HTTPException(status_code=400, detail="Unable to compute baseline total times from replay file.")

    # Simulator params (overridable by payload)
    PIT_STOP_COST = float(payload.get("pit_time_cost", 21.4))
    OUTLAP_PENALTY = float(payload.get("outlap_penalty", 1.5))
    DELAY_PENALTY_PER_LAP = float(payload.get("delay_penalty_sec", 0.8))

    # scenario candidate pits to evaluate
    scenarios_to_run: List[tuple] = []
    if action == "box_now":
        if lap is None:
            raise HTTPException(status_code=400, detail="lap required for box_now")
        scenarios_to_run.append(("now", lap))
    elif action == "delay_1":
        if lap is None:
            raise HTTPException(status_code=400, detail="lap required for delay_1")
        scenarios_to_run.append(("+1", lap + 1))
    elif action == "delay_2":
        if lap is None:
            raise HTTPException(status_code=400, detail="lap required for delay_2")
        scenarios_to_run.append(("+2", lap + 2))
    elif action == "simulate_all":
        if lap is not None:
            scenarios_to_run.extend([("now", lap), ("+1", lap + 1), ("+2", lap + 2)])
        else:
            scenarios_to_run.append(("baseline", None))
    else:
        raise HTTPException(status_code=400, detail="unknown action")

    naive_results = {}
    model_results = {}

    # Build baseline_ordered for position references
    baseline_ordered = sorted(baseline.items(), key=lambda kv: kv[1] if kv[1] is not None else 1e9)

    # Evaluate each scenario: provide naive and (if available) model prediction
    for key, pit_at in scenarios_to_run:
        # Naive
        naive = naive_simulate(baseline, str(car), pit_at, PIT_STOP_COST, OUTLAP_PENALTY, DELAY_PENALTY_PER_LAP)
        naive_results[key] = naive

        # Model-based
        model_payload = None
        model_out = None
        if MODEL is not None:
            try:
                # Build feature DataFrame expected by model
                feat_df = build_features_for_model(df, car_col, lap_col_name, pit_at, str(car), total_time_col)
                # The model should accept the DataFrame (or numeric array) and return predicted final total times
                # If your model requires specific feature order, adapt this transform.
                preds = MODEL.predict(feat_df.drop(columns=["car"]))  # drop 'car' label if unneeded
                # attach predictions to results
                model_ordered = [{"car": r["car"], "pred_time": float(preds[idx])} for idx, r in feat_df.reset_index().to_dict(orient="records")]
                # compute predicted position for target car
                ordered_sorted = sorted(model_ordered, key=lambda x: x["pred_time"] if x["pred_time"] is not None else 1e9)
                sim_pos = next((i+1 for i, it in enumerate(ordered_sorted) if str(it["car"]) == str(car)), None)
                baseline_pos = next((i+1 for i, it in enumerate(baseline_ordered) if str(it[0]) == str(car)), None)
                model_out = {"ordered": ordered_sorted, "target_car": str(car), "baseline_pos": baseline_pos, "sim_pos": sim_pos}
            except Exception as e:
                logger.exception("Model prediction failed for scenario %s: %s", key, e)
                model_out = {"error": f"model_failed: {e}"}
        else:
            model_out = {"note": "no_model_loaded"}
        model_results[key] = model_out

    # Save simulation result
    sim_id = uuid.uuid4().hex
    sim_dir = replay_dir / "simulations"
    sim_dir.mkdir(exist_ok=True)
    sim_path = sim_dir / f"{sim_id}.json"
    out_payload = {
        "sim_id": sim_id,
        "naive": naive_results,
        "model": model_results,
        "params": {"pit_time_cost": PIT_STOP_COST, "outlap_penalty": OUTLAP_PENALTY},
        "request": payload,
    }
    sim_path.write_text(json.dumps(out_payload, indent=2), encoding="utf-8")

    return JSONResponse({"sim_id": sim_id, "naive": naive_results, "model": model_results, "meta": {"replay_id": replay_id}})


# -----------------------
# GET simulation result
# -----------------------
@app.get("/api/replay/{replay_id}/simulations/{sim_id}")
def get_simulation(replay_id: str, sim_id: str):
    sim_path = BASE_DIR / replay_id / "simulations" / f"{sim_id}.json"
    if not sim_path.exists():
        raise HTTPException(status_code=404, detail="Simulation not found")
    return JSONResponse(json.loads(sim_path.read_text(encoding="utf-8")))


# -----------------------
# Utility endpoint: predict best pit lap within a window (optional)
# -----------------------
@app.post("/api/replay/{replay_id}/predict_pit_window")
def predict_pit_window(replay_id: str, payload: Dict = Body(...)):
    """
    Returns the best lap to pit (within candidate range) based on model predictions.
    Body:
      { "car": "86", "current_lap": 12, "window": 5 }
    """
    replay_dir = BASE_DIR / replay_id
    if not replay_dir.exists():
        raise HTTPException(status_code=404, detail="Replay not found")
    try:
        df = _load_parsed_df(replay_dir)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load parsed replay: {e}")

    car = payload.get("car")
    current_lap = int(payload.get("current_lap", 0))
    window = int(payload.get("window", 5))
    candidate_laps = list(range(current_lap, current_lap + window + 1))
    best = {"lap": None, "pred_pos": None, "pred_time": None}
    if MODEL is None:
        return JSONResponse({"note": "no_model_loaded", "candidates": candidate_laps})

    best_score = 1e12
    for lap in candidate_laps:
        feat_df = build_features_for_model(df, next((c for c in df.columns if "car" in c.lower() or "vehicle" in c.lower()), "car"),
                                           next((c for c in df.columns if "lap" in c.lower()), None),
                                           lap, car, next((c for c in df.columns if "total_time" in c.lower()), None))
        try:
            preds = MODEL.predict(feat_df.drop(columns=["car"]))
            # find target car predicted total time
            target_idx = next((i for i, row in enumerate(feat_df.to_dict(orient="records")) if str(row["car"]) == str(car)), None)
            if target_idx is None:
                continue
            pred_time = float(preds[target_idx])
            if pred_time < best_score:
                best_score = pred_time
                best = {"lap": lap, "pred_time": pred_time}
        except Exception as e:
            logger.exception("predict_pit_window: model error for lap %s: %s", lap, e)
            continue
    return JSONResponse({"best": best, "candidates": candidate_laps})


# -----------------------
# Run: uvicorn src.backend.replay_api:app --reload --port 8000
# -----------------------


