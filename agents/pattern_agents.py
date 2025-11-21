# src/agents/pattern_agents.py

"""
Multi-agent pattern recognition for PitWall A.I.

Drop this file into: src/agents/pattern_agents.py

Reference brief (for output metadata): 

file:///mnt/data/Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I.  (4).docx

"""

from dataclasses import dataclass, asdict
import json
import os
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.cluster import DBSCAN, KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.metrics import pairwise_distances
from scipy.signal import find_peaks
import matplotlib.pyplot as plt
import seaborn as sns
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pattern_agents")

# Local design brief path (developer requested it be included)
DESIGN_BRIEF_URL = "file:///mnt/data/Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I.  (4).docx"

# -------------------------
# Helper utilities
# -------------------------
def safe_col(df: pd.DataFrame, names: List[str]) -> Optional[str]:
    """
    Return the first column name in df that matches any in `names` (case-insensitive).
    """
    cols = {c.lower(): c for c in df.columns}
    for n in names:
        if n.lower() in cols:
            return cols[n.lower()]
    return None

def parse_time_str_to_seconds(t):
    # Very permissive time parser used only when needed
    try:
        if pd.isna(t):
            return np.nan
        s = str(t)
        if ":" in s:
            parts = s.split(":")
            if len(parts) == 2:
                return float(parts[0]) * 60 + float(parts[1])
            elif len(parts) == 3:
                return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
        return float(s)
    except Exception:
        return np.nan

def ensure_numeric(df: pd.DataFrame, col: str, fill: float = 0.0) -> pd.Series:
    return pd.to_numeric(df[col], errors="coerce").fillna(fill)

# -------------------------
# Base Agent
# -------------------------
@dataclass
class AgentResult:
    name: str
    summary: Dict[str, Any]
    per_lap: Optional[pd.DataFrame] = None
    per_car: Optional[pd.DataFrame] = None

    def to_json(self):
        j = {
            "name": self.name,
            "summary": self.summary,
            "has_per_lap": self.per_lap is not None,
            "has_per_car": self.per_car is not None,
        }
        return j

class BaseAgent:
    name: str = "base"

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}

    def analyze(self, df: pd.DataFrame) -> AgentResult:
        raise NotImplementedError

# -------------------------
# Agent 1: Anomaly Detection (IsolationForest)
# -------------------------
class AnomalyAgent(BaseAgent):
    name = "anomaly_isolation_forest"

    def analyze(self, df: pd.DataFrame) -> AgentResult:
        logger.info("[AnomalyAgent] start")
        # Prepare per-sample or per-lap aggregates. We'll try per-lap if lap info exists.
        lap_col = safe_col(df, ["lap", "laps", "lap_number", "lapnum"])
        if lap_col:
            group_key = ["__source_file", safe_col(df, ["number", "car", "vehicle"]) or "car_number", lap_col]
            agg = df.groupby(group_key).agg({
                safe_col(df, ["accx_can","acc_x","acc_x_can"]) or "accx_can": "mean",
                safe_col(df, ["accy_can","acc_y","acc_y_can"]) or "accy_can": "mean",
                safe_col(df, ["throttle","throttle_pos"]) or "throttle": "mean",
                safe_col(df, ["brake","brake_pos"]) or "brake": "mean",
                safe_col(df, ["lap_time","lap_seconds"]) or "LapTime": "mean",
            }).reset_index()
            # rename safe fields
            agg.columns = [str(c) for c in agg.columns]
            features = [c for c in agg.columns if c not in group_key]
            # fillna
            X = agg[features].fillna(0.0)
            scaler = StandardScaler()
            if X.shape[0] < 5:
                logger.info("[AnomalyAgent] not enough lap aggregates, falling back to sample-level anomaly detection")
                Xs = df.select_dtypes(include=[np.number]).fillna(0.0).values
                model = IsolationForest(random_state=0, contamination=0.02)
                if Xs.shape[0] >= 10:
                    model.fit(Xs)
                    preds = model.predict(Xs)  # -1 anomaly, 1 normal
                    df_copy = df.copy()
                    df_copy["_anomaly_flag"] = (preds == -1)
                    summary = {"anomaly_count": int(df_copy["_anomaly_flag"].sum()), "method": "sample_if"}
                    return AgentResult(self.name, summary, per_lap=None, per_car=None)
                else:
                    summary = {"anomaly_count": 0, "note": "not enough rows"}
                    return AgentResult(self.name, summary)
            Xs = scaler.fit_transform(X)
            model = IsolationForest(random_state=0, contamination=self.config.get("contamination", 0.02))
            model.fit(Xs)
            is_anom = model.predict(Xs) == -1
            agg["_anomaly"] = is_anom
            summary = {"n_laps": len(agg), "n_anomalous_laps": int(is_anom.sum())}
            # Return per_lap results merged back as dataframe
            return AgentResult(self.name, summary, per_lap=agg)
        else:
            # No lap column: do sample-level detection
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            if len(numeric_cols) < 2:
                return AgentResult(self.name, {"note": "insufficient numeric data"})
            X = df[numeric_cols].fillna(0.0)
            scaler = StandardScaler()
            Xs = scaler.fit_transform(X)
            model = IsolationForest(random_state=0, contamination=self.config.get("contamination", 0.01))
            if Xs.shape[0] < 10:
                return AgentResult(self.name, {"note": "too few samples"})
            model.fit(Xs)
            pred = model.predict(Xs)
            df_copy = df.copy()
            df_copy["_anomaly_flag"] = (pred == -1)
            summary = {"samples": len(df_copy), "anomalies": int(df_copy["_anomaly_flag"].sum())}
            return AgentResult(self.name, summary, per_lap=None, per_car=df_copy[["_anomaly_flag"]])

# -------------------------
# Agent 2: Clustering Agent (DBSCAN / KMeans fallback)
# -------------------------
class ClusteringAgent(BaseAgent):
    name = "clustering_behavior"

    def analyze(self, df: pd.DataFrame) -> AgentResult:
        logger.info("[ClusteringAgent] start")
        # We'll build per-lap feature vectors where possible. If not, per-car aggregates.
        lap_col = safe_col(df, ["lap", "laps", "lap_number", "lapnum"])
        car_col = safe_col(df, ["number", "car", "vehicle", "car_number"]) or "__car"
        if lap_col:
            group_key = [car_col, lap_col]
            perlap = df.groupby(group_key).agg({
                safe_col(df, ["lap_time", "lap_seconds"]) or "lap_time": "mean",
                safe_col(df, ["speed", "v","gps_speed"]) or "speed": "mean",
                safe_col(df, ["accx_can","acc_x"]) or "accx_can": "mean",
                safe_col(df, ["accy_can","acc_y"]) or "accy_can": "mean",
            }).reset_index()
            perlap.columns = [str(c) for c in perlap.columns]
            feat_cols = [c for c in perlap.columns if c not in group_key]
            X = perlap[feat_cols].fillna(0.0)
            if X.shape[0] < 5:
                return AgentResult(self.name, {"note": "not enough lap entries for clustering"})
            scaler = StandardScaler()
            Xs = scaler.fit_transform(X)
            try:
                # DBSCAN may find clusters of behavior (aggressive vs smooth)
                db = DBSCAN(eps=self.config.get("eps", 0.8), min_samples=self.config.get("min_samples", 4)).fit(Xs)
                labels = db.labels_
                perlap["cluster"] = labels
                n_clusters = len(set(labels)) - (1 if -1 in labels else 0)
                summary = {"n_points": len(perlap), "n_clusters": int(n_clusters), "method": "DBSCAN"}
                return AgentResult(self.name, summary, per_lap=perlap)
            except Exception as e:
                logger.warning(f"[ClusteringAgent] DBSCAN failed: {e}, falling back to KMeans")
                k = min(4, max(2, Xs.shape[0] // 10))
                km = KMeans(n_clusters=k, random_state=0).fit(Xs)
                perlap["cluster"] = km.labels_
                summary = {"n_points": len(perlap), "n_clusters": int(k), "method": "KMeans_fallback"}
                return AgentResult(self.name, summary, per_lap=perlap)
        else:
            # per-car aggregate clustering
            agg = df.groupby(car_col).agg({
                safe_col(df, ["avg_lap_seconds", "lap_time"]) or "avg_lap_seconds": "mean",
                safe_col(df, ["fastest_lap_seconds", "fl_time"]) or "fastest_lap_seconds": "mean",
                safe_col(df, ["acc_mag_mean"]) or "acc_mag_mean": "mean",
            }).reset_index()
            feat_cols = [c for c in agg.columns if c not in [car_col]]
            X = agg[feat_cols].fillna(0.0)
            if X.shape[0] < 3:
                return AgentResult(self.name, {"note": "too few cars"})
            scaler = StandardScaler()
            Xs = scaler.fit_transform(X)
            km = KMeans(n_clusters=min(3, Xs.shape[0]), random_state=0).fit(Xs)
            agg["cluster"] = km.labels_
            summary = {"n_cars": len(agg), "n_clusters": int(agg["cluster"].nunique())}
            return AgentResult(self.name, summary, per_car=agg)

# -------------------------
# Agent 3: Stint / Pit segmentation
# -------------------------
class StintSegmentationAgent(BaseAgent):
    name = "stint_segmentation"

    def analyze(self, df: pd.DataFrame) -> AgentResult:
        logger.info("[StintSegmentationAgent] start")
        # Try robust pit-stop detection using lap numbers or Laptrigger_lapdist_dls resets
        car_col = safe_col(df, ["number", "car", "vehicle", "car_number"]) or "car_number"
        lapdist_col = safe_col(df, ["laptrigger_lapdist_dls", "lapdist", "lap_trigger_lapdist"]) 
        time_col = safe_col(df, ["meta_time", "timestamp", "time"])
        results = []
        per_car_stints = []
        for car, g in df.groupby(car_col):
            gg = g.sort_values(time_col) if time_col and time_col in g.columns else g
            if lapdist_col and lapdist_col in gg.columns:
                # detect large drops in lapdist -> finish line crossing / new lap. Pit if time gap between subsequent points > threshold or lapdist resets multiple times
                distances = gg[lapdist_col].astype(float).fillna(0.0).values
                # change detection: where dist decreases by a lot
                drops = np.where(np.diff(distances) < -500)[0]
                # fallback: use big timestamp gaps to detect pit (if meta_time)
                stints = []
                if time_col and time_col in gg.columns:
                    times = pd.to_numeric(gg[time_col], errors="coerce").ffill().values
                    dt = np.diff(times)
                    # pit-like gap > 30s by default considered pit
                    pit_idxs = np.where(dt > self.config.get("pit_gap_seconds", 30))[0]
                    # build stint boundaries from pit_idxs
                    boundaries = [0] + (pit_idxs + 1).tolist() + [len(gg)]
                    for i in range(len(boundaries)-1):
                        sidx, eidx = boundaries[i], boundaries[i+1]
                        stints.append({"car": car, "stint_index": i, "start": int(sidx), "end": int(eidx), "n_samples": int(eidx-sidx)})
                else:
                    # naive: split into single stint
                    stints = [{"car": car, "stint_index": 0, "start": 0, "end": len(gg), "n_samples": len(gg)}]
                per_car_stints.extend(stints)
            else:
                # no lapdist -> fallback: group by lap column if present
                lap_col = safe_col(gg, ["lap", "laps", "lap_number"])
                if lap_col:
                    stints = []
                    for lapnum, lapg in gg.groupby(lap_col):
                        stints.append({"car": car, "stint_index": int(lapnum), "start": int(lapg.index.min()), "end": int(lapg.index.max()), "n_samples": int(len(lapg))})
                    per_car_stints.extend(stints)
                else:
                    per_car_stints.append({"car": car, "stint_index": 0, "start": 0, "end": len(gg), "n_samples": len(gg)})
        stints_df = pd.DataFrame(per_car_stints)
        summary = {"n_cars": int(stints_df['car'].nunique()) if not stints_df.empty else 0, "n_stints_detected": int(len(stints_df))}
        return AgentResult(self.name, summary, per_car=stints_df)

# -------------------------
# Agent 4: Consistency Analysis
# -------------------------
class ConsistencyAgent(BaseAgent):
    name = "consistency_metrics"

    def analyze(self, df: pd.DataFrame) -> AgentResult:
        logger.info("[ConsistencyAgent] start")
        # We compute per-car lap time std, coefficient of variation, and flag outliers
        car_col = safe_col(df, ["number", "car", "vehicle", "car_number"]) or "car_number"
        lap_time_col = safe_col(df, ["lap_time", "lap_seconds", "total_time", "avg_lap_seconds"]) or "lap_time"
        records = []
        for car, g in df.groupby(car_col):
            # attempt per-lap times: if multiple rows per lap, try to compress
            # If lap_time present:
            if lap_time_col in g.columns:
                times = pd.to_numeric(g[lap_time_col], errors="coerce").dropna().values
            else:
                # fallback: use diff of meta_time grouped by lap if possible
                meta = safe_col(g, ["meta_time", "time", "timestamp"])
                lapnum = safe_col(g, ["lap", "lap_number"])
                if meta and lapnum:
                    lap_agg = g.groupby(lapnum)[meta].agg(['min','max'])
                    times = (pd.to_numeric(lap_agg['max']) - pd.to_numeric(lap_agg['min']))
                    times = times.dropna().values
                else:
                    times = np.array([])

            if len(times) == 0:
                continue

            mean = float(np.mean(times))
            std = float(np.std(times))
            cv = std / mean if mean != 0 else np.nan
            # Consistency score: lower is better
            records.append({"car": car, "mean_lap": mean, "std_lap": std, "cv_lap": cv, "n_laps": int(len(times))})
        if not records:
            return AgentResult(self.name, {"note": "no lap times found"})
        per_car = pd.DataFrame(records)
        # flag inconsistent drivers (cv > threshold)
        cv_thresh = self.config.get("cv_threshold", 0.03)
        per_car["inconsistent"] = per_car["cv_lap"] > cv_thresh
        summary = {"cars": len(per_car), "inconsistent_count": int(per_car["inconsistent"].sum())}
        return AgentResult(self.name, summary, per_car=per_car)

# -------------------------
# Agent 5: Tire Wear / Degradation Pattern
# -------------------------
class TireWearAgent(BaseAgent):
    name = "tire_wear_patterns"

    def analyze(self, df: pd.DataFrame) -> AgentResult:
        logger.info("[TireWearAgent] start")
        # Build per-lap cumulative stress using acc magnitude or lateral acceleration if available
        car_col = safe_col(df, ["number", "car", "vehicle", "car_number"]) or "car_number"
        time_col = safe_col(df, ["meta_time", "timestamp", "time"])
        ax_col = safe_col(df, ["accx_can", "acc_x", "acc_x_can"])
        ay_col = safe_col(df, ["accy_can", "acc_y", "acc_y_can"])
        lap_col = safe_col(df, ["lap", "lap_number", "laps"])
        results = []
        per_car_summary = []
        if ax_col and ay_col and lap_col:
            df["_accx"] = ensure_numeric(df, ax_col, 0.0)
            df["_accy"] = ensure_numeric(df, ay_col, 0.0)
            df["_acc_mag"] = np.sqrt(df["_accx"] ** 2 + df["_accy"] ** 2)
            grouped = df.groupby([car_col, lap_col])['_acc_mag'].agg(['sum','mean','max']).reset_index()
            grouped = grouped.rename(columns={'sum':'acc_mag_sum','mean':'acc_mag_mean','max':'acc_mag_max'})
            # For each car, compute linear trend of acc_mag_sum over lap index
            for car, g in grouped.groupby(car_col):
                g = g.sort_values(lap_col)
                x = np.arange(len(g)).reshape(-1,1)
                y = g['acc_mag_sum'].values.reshape(-1,1)
                if len(x) < 3:
                    continue
                lr = LinearRegression().fit(x,y)
                slope = float(lr.coef_[0][0])
                intercept = float(lr.intercept_[0])
                # R^2
                r2 = lr.score(x,y)
                per_car_summary.append({"car": car, "slope_acc_mag_sum": slope, "r2": r2, "n_laps": int(len(g))})
            per_car_df = pd.DataFrame(per_car_summary)
            summary = {"cars_analyzed": int(per_car_df.shape[0])}
            return AgentResult(self.name, summary, per_car=per_car_df)
        else:
            return AgentResult(self.name, {"note": "acceleration or lap columns missing - cannot compute tire wear proxy"})

# -------------------------
# Agent 6: Incident detection (spikes / off-track)
# -------------------------
class IncidentDetectionAgent(BaseAgent):
    name = "incident_detection"

    def analyze(self, df: pd.DataFrame) -> AgentResult:
        logger.info("[IncidentDetectionAgent] start")
        # We detect peaks in acceleration magnitude and very large yaw/rate changes if available
        ax = safe_col(df, ["accx_can","acc_x"])
        ay = safe_col(df, ["accy_can","acc_y"])
        yaw = safe_col(df, ["yaw", "yaw_rate"])
        time_col = safe_col(df, ["meta_time","timestamp","time"])
        car_col = safe_col(df, ["number", "car", "vehicle", "car_number"]) or "car_number"
        incidents = []
        if ax and ay:
            df["_ax"] = ensure_numeric(df, ax, 0.0)
            df["_ay"] = ensure_numeric(df, ay, 0.0)
            df["_acc_mag"] = np.sqrt(df["_ax"]**2 + df["_ay"]**2)
            # detect peaks in acc magnitude (peaks with prominence or height)
            acc = df["_acc_mag"].values
            if len(acc) < 10:
                return AgentResult(self.name, {"note": "not enough accel samples"})
            # Use find_peaks to detect spikes
            peaks, props = find_peaks(acc, height=self.config.get("min_g", 2.0), distance=5)
            for p in peaks:
                row = df.iloc[p]
                incidents.append({"index": int(row.name), "car": row.get(car_col, None), "acc_mag": float(row["_acc_mag"]), "time": float(row.get(time_col, np.nan))})
            summary = {"n_incidents": len(incidents)}
            per_lap = None
            if incidents:
                per_lap = pd.DataFrame(incidents)
            return AgentResult(self.name, summary, per_lap=per_lap)
        else:
            return AgentResult(self.name, {"note": "accel columns missing - cannot run incident detection"})

# -------------------------
# Agent 7: Pit strategy pattern agent
# -------------------------
class PitPatternAgent(BaseAgent):
    name = "pit_pattern_analysis"

    def analyze(self, df: pd.DataFrame) -> AgentResult:
        logger.info("[PitPatternAgent] start")
        car_col = safe_col(df, ["number", "car", "vehicle", "car_number"]) or "car_number"
        lap_col = safe_col(df, ["lap", "lap_number", "laps"])
        time_col = safe_col(df, ["meta_time", "timestamp", "time"])
        # Simple heuristic: detect lap rows with pit indicator if present, else detect large time gaps between consecutive laps
        pitflag_col = safe_col(df, ["pit", "in_pit", "pit_flag", "pitstop"])
        records = []
        for car, g in df.groupby(car_col):
            gg = g.sort_values(time_col) if time_col and time_col in g.columns else g
            if pitflag_col and pitflag_col in gg.columns:
                pitrows = gg[gg[pitflag_col].astype(str).str.lower().isin(["1","true","yes","y","t"])]
                for _, r in pitrows.iterrows():
                    records.append({"car": car, "pit_time_index": int(r.name), "lap": r.get(lap_col, None), "reason": "flag"})
            elif lap_col and time_col:
                # compute lap end times then compute gaps between lap end times: large gap implies pit
                lap_agg = gg.groupby(lap_col)[time_col].agg(['min','max']).reset_index()
                lap_agg['gap'] = lap_agg['min'].astype(float).diff().fillna(0.0)
                suspected = lap_agg[lap_agg['gap'] > self.config.get("pit_gap_seconds", 20)]
                for _, r in suspected.iterrows():
                    records.append({"car": car, "lap": int(r[lap_col]), "gap": float(r['gap'])})
            else:
                # cannot detect pits
                continue
        pits_df = pd.DataFrame(records)
        summary = {"cars_analyzed": int(df[car_col].nunique()) if car_col in df.columns else 0, "pits_detected": int(len(pits_df))}
        return AgentResult(self.name, summary, per_car=pits_df if not pits_df.empty else None)

# -------------------------
# MultiAgent Orchestrator
# -------------------------
class MultiAgentOrchestrator:
    """
    Orchestrates running all pattern recognition agents and compiling results.
    """

    def __init__(self, agents: Optional[List[BaseAgent]] = None, out_dir: str = "agent_results"):
        self.agents = agents or [
            AnomalyAgent(),
            ClusteringAgent(),
            StintSegmentationAgent(),
            ConsistencyAgent(),
            TireWearAgent(),
            IncidentDetectionAgent(),
            PitPatternAgent(),
        ]
        self.out_dir = Path(out_dir)
        self.out_dir.mkdir(parents=True, exist_ok=True)

    def run_all(self, df: pd.DataFrame, save_outputs: bool = True) -> Dict[str, AgentResult]:
        results: Dict[str, AgentResult] = {}
        for agent in self.agents:
            try:
                logger.info(f"[Orchestrator] running {agent.name}")
                res = agent.analyze(df)
                results[agent.name] = res
                if save_outputs:
                    self._save_agent_result(agent.name, res)
            except Exception as e:
                logger.exception(f"Agent {agent.name} failed: {e}")
        # Also create a combined per-car summary if possible
        if save_outputs:
            try:
                self._compile_summary_csv(results)
            except Exception as e:
                logger.exception("Failed to compile summary CSV: %s", e)
        return results

    def _save_agent_result(self, name: str, res: AgentResult):
        meta = {"name": res.name, "summary": res.summary, "design_brief": DESIGN_BRIEF_URL}
        with open(self.out_dir / f"{name}_meta.json", "w") as f:
            json.dump(meta, f, indent=2)
        if res.per_lap is not None:
            res.per_lap.to_csv(self.out_dir / f"{name}_per_lap.csv", index=False)
        if res.per_car is not None:
            res.per_car.to_csv(self.out_dir / f"{name}_per_car.csv", index=False)

    def _compile_summary_csv(self, results: Dict[str, AgentResult]):
        # merge per_car tables where available on 'car' or 'car_number'
        car_tables = []
        for k, r in results.items():
            if r.per_car is not None:
                df = r.per_car.copy()
                # ensure a common column 'car' exists
                if 'car' not in df.columns:
                    possible = [c for c in df.columns if 'car' in c.lower() or 'number' in c.lower()]
                    if possible:
                        df = df.rename(columns={possible[0]: 'car'})
                # prefix columns with agent name to avoid collisions
                df = df.add_prefix(f"{k}__")
                # ensure the car column is named 'car' after prefixing
                cols = {c: c for c in df.columns}
                # but try to rename the agent-prefixed car column back to 'car'
                car_col_pref = f"{k}__car"
                if car_col_pref in df.columns:
                    df = df.rename(columns={car_col_pref: 'car'})
                car_tables.append(df)
        if not car_tables:
            logger.info("[Orchestrator] no per-car tables to compile")
            return
        # iterative merge on 'car'
        merged = car_tables[0]
        for tab in car_tables[1:]:
            if 'car' in tab.columns:
                merged = pd.merge(merged, tab, on='car', how='outer')
        merged.to_csv(self.out_dir / "agents_per_car_summary.csv", index=False)
        logger.info("[Orchestrator] compiled per-car summary to agents_per_car_summary.csv")

# -------------------------
# Example usage (CLI-friendly)
# -------------------------
def example_run(csv_path: str, out_dir: str = "agent_results"):
    df = pd.read_csv(csv_path)
    orchestrator = MultiAgentOrchestrator(out_dir=out_dir)
    results = orchestrator.run_all(df, save_outputs=True)
    # Print summary of agent results
    for name, res in results.items():
        logger.info(f"Agent: {name} summary: {res.summary}")
    # Optionally: plot a simple chart showing anomalies per lap from AnomalyAgent if produced
    an = results.get("anomaly_isolation_forest")
    if an and an.per_lap is not None and "car_number" in an.per_lap.columns:
        plt.figure(figsize=(8,3))
        sns.histplot(an.per_lap[ "_anomaly"].astype(int), bins=2)
        plt.title("Anomalous laps count")
        plt.tight_layout()
        plt.savefig(Path(out_dir)/"anomaly_hist.png")
        plt.close()

# Allow running as script
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Run multi-agent pattern recognition on race CSV data.")
    parser.add_argument("--csv", type=str, required=True, help="Path to CSV file")
    parser.add_argument("--out-dir", type=str, default="agent_results", help="Output directory")
    args = parser.parse_args()
    example_run(args.csv, args.out_dir)
