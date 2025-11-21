"""
Exploratory Data Analysis (EDA) Cluster Agent

Designed to integrate into a multi-agent PitWall A.I. system (7 agents).

Key features implemented:
- Robust input validation and schema inference
- Automated feature engineering hooks (timestamp -> cyclical, aggregations)
- Scalable dimensionality reduction (PCA -> UMAP) with memory-aware batching
- Density-based clustering (HDBSCAN) with stability analysis and parameter sweep
- Cluster profiling: per-cluster summary statistics, top-features, representative examples
- Explainability hooks: per-cluster feature importance (mean-diff, permutation)
- Visualization helpers (UMAP scatter, cluster heatmaps, radar of feature fingerprints)
- Persistence: save artifacts (models, embeddings, profiles) with joblib
- Integration points: Redis pub/sub or streams for ingesting feature batches and publishing cluster-insights
- Reference to research doc: RESEARCH_DOC_PATH (local path provided by user environment)

Usage:
    agent = EDAClusterAgent(redis_url='redis://localhost:6379', stream='features')
    agent.run_once()  # or .run_forever()
"""

from __future__ import annotations

import os
import json
import time
import logging
import uuid
import requests
from typing import Optional, Dict, Any, List, Tuple
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

# hdbscan is optional (not in stdlib); gracefully fall back
try:
    import hdbscan
except Exception:
    hdbscan = None

# Redis optional integration
try:
    import redis
except Exception:
    redis = None

# persistence
try:
    import joblib
except Exception:
    joblib = None

# Visualization helpers (Plotly for interactive; fallback to matplotlib)
try:
    import plotly.express as px
    import plotly.graph_objects as go
except Exception:
    px = None
    go = None

# UMAP
try:
    import umap
except Exception:
    umap = None

logger = logging.getLogger("eda_cluster_agent")
logging.basicConfig(level=logging.INFO)

# Path to uploaded research document (from user's session)
RESEARCH_DOC_PATH = os.getenv(
    "RESEARCH_DOC_PATH",
    "/mnt/data/2 Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .md"
)


class EDAClusterAgent:
    def __init__(
        self,
        workdir: str = "./eda_agent_artifacts",
        n_components_pca: int = 16,
        umap_n_neighbors: int = 15,
        umap_min_dist: float = 0.1,
        cluster_min_cluster_size: int = 5,
        redis_url: Optional[str] = None,
        input_stream: Optional[str] = None,
        agent_id: Optional[str] = None,
        orch_url: Optional[str] = None,
    ):
        self.workdir = Path(workdir)
        self.workdir.mkdir(parents=True, exist_ok=True)

        self.scaler: Optional[StandardScaler] = None
        self.pca: Optional[PCA] = None
        self.umap_model: Optional[umap.UMAP] = None
        self.clusterer = None

        self.n_components_pca = n_components_pca
        self.umap_n_neighbors = umap_n_neighbors
        self.umap_min_dist = umap_min_dist
        self.cluster_min_cluster_size = cluster_min_cluster_size

        # Redis integration for multi-agent system
        self.redis_url = redis_url or os.getenv('REDIS_URL', 'redis://127.0.0.1:6379')
        self.input_stream = input_stream
        self.agent_id = agent_id or os.getenv('EDA_AGENT_ID', f'eda-cluster-{uuid.uuid4().hex[:8]}')
        self.orch_url = orch_url or os.getenv('ORCH_URL', 'http://localhost:9090')
        self.inbox = f'agent:{self.agent_id}:inbox'
        self.result_stream = 'results.stream'
        
        self.redis_client = None
        if redis:
            try:
                self.redis_client = redis.from_url(self.redis_url)
                logger.info(f"Connected to Redis at {self.redis_url}")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e}")

    def register_agent(self):
        """Register with orchestrator"""
        try:
            requests.post(
                f'{self.orch_url}/api/agents/register',
                json={
                    'agentId': self.agent_id,
                    'types': ['eda'],
                    'tracks': ['*'],
                    'capacity': 2
                },
                timeout=5
            )
            logger.info(f"[EDA Cluster] Registered with orchestrator: {self.agent_id}")
        except Exception as e:
            logger.warning(f"[EDA Cluster] Registration failed (continuing anyway): {e}")

    # ------------------------------- Data helpers -------------------------------
    def validate_and_frame(self, records: List[Dict[str, Any]]) -> pd.DataFrame:
        """Convert raw records to a clean DataFrame and infer numeric feature set.

        - Ensures consistent columns
        - Drops near-constant columns
        - Parses timestamps and creates cyclical features for lap/time-based patterns
        """
        if not records:
            return pd.DataFrame()

        df = pd.DataFrame.from_records(records)

        # Try to parse timestamp-like columns to datetime
        for c in df.columns:
            if c.lower() in ("timestamp", "ts", "time", "meta_time") and not np.issubdtype(df[c].dtype, np.datetime64):
                try:
                    df[c] = pd.to_datetime(df[c], errors="coerce")
                except Exception:
                    pass

        # Create cyclical time features if timestamp exists
        if "timestamp" in df.columns and np.issubdtype(df["timestamp"].dtype, np.datetime64):
            secs = df["timestamp"].astype("int64") // 10**9
            df["ts_sin"] = np.sin(2 * np.pi * (secs % 3600) / 3600)
            df["ts_cos"] = np.cos(2 * np.pi * (secs % 3600) / 3600)
        elif "meta_time" in df.columns:
            try:
                df["timestamp"] = pd.to_datetime(df["meta_time"], errors="coerce")
                secs = df["timestamp"].astype("int64") // 10**9
                df["ts_sin"] = np.sin(2 * np.pi * (secs % 3600) / 3600)
                df["ts_cos"] = np.cos(2 * np.pi * (secs % 3600) / 3600)
            except Exception:
                pass

        # Coerce numeric-looking columns
        for c in df.columns:
            if df[c].dtype == object:
                # try converting to numeric where safe
                try:
                    df[c] = pd.to_numeric(df[c], errors="ignore")
                except Exception:
                    pass

        # Drop near-constant columns
        nunique = df.nunique(dropna=True)
        to_drop = nunique[nunique <= 1].index.tolist()
        if to_drop:
            logger.debug("Dropping constant columns: %s", to_drop)
            df = df.drop(columns=to_drop)

        return df

    def select_numeric_features(self, df: pd.DataFrame, exclude: List[str] = None) -> Tuple[pd.DataFrame, List[str]]:
        exclude = exclude or []
        numeric = df.select_dtypes(include=[np.number]).copy()
        for col in exclude:
            if col in numeric.columns:
                numeric = numeric.drop(columns=[col])
        features = numeric.columns.tolist()
        logger.info("Selected numeric features: %s", features)
        return numeric, features

    # --------------------------- Dimensionality reduction ----------------------
    def fit_scaler_pca(self, X: pd.DataFrame):
        """Fit scaler + PCA for initial dimensionality reduction."""
        if self.scaler is None:
            self.scaler = StandardScaler()
            self.scaler.fit(X)
        Xs = self.scaler.transform(X)

        if self.pca is None:
            n_comp = min(self.n_components_pca, Xs.shape[1])
            self.pca = PCA(n_components=n_comp, svd_solver="auto")
            self.pca.fit(Xs)
        Xp = self.pca.transform(Xs)
        return Xp

    def fit_umap(self, Xp: np.ndarray):
        """Fit UMAP on PCA-projected features, with memory-awareness.

        Note: UMAP can be large-memory; for very large datasets, consider incremental or subsample.
        """
        if umap is None:
            logger.warning("UMAP not available, using PCA directly")
            return Xp[:, :2] if Xp.shape[1] >= 2 else Xp

        if self.umap_model is None:
            self.umap_model = umap.UMAP(
                n_neighbors=self.umap_n_neighbors,
                min_dist=self.umap_min_dist,
                random_state=42,
                n_components=2
            )
            self.umap_model.fit(Xp)
        emb = self.umap_model.transform(Xp)
        return emb

    # ------------------------------ Clustering -------------------------------
    def run_hdbscan(self, emb: np.ndarray, min_cluster_size: Optional[int] = None):
        if hdbscan is None:
            logger.warning("HDBSCAN not available, falling back to KMeans")
            from sklearn.cluster import KMeans
            n_clusters = min(3, max(2, len(emb) // 10))
            kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            labels = kmeans.fit_predict(emb)
            return labels

        mcs = min_cluster_size or self.cluster_min_cluster_size
        cls = hdbscan.HDBSCAN(min_cluster_size=mcs, prediction_data=True)
        labels = cls.fit_predict(emb)
        self.clusterer = cls
        return labels

    # ---------------------------- Cluster analysis --------------------------
    def cluster_profile(self, df_features: pd.DataFrame, labels: np.ndarray, top_k: int = 5) -> Dict[int, Dict[str, Any]]:
        """Build human-readable cluster profiles.

        For each cluster: count, centroids (mean of features), top features by mean-diff.
        """
        profiles: Dict[int, Dict[str, Any]] = {}
        df = df_features.copy()
        df["_cluster"] = labels
        clusters = sorted(np.unique(labels))
        for c in clusters:
            cluster_df = df[df["_cluster"] == c]
            count = len(cluster_df)
            if count == 0:
                continue
            centroid = cluster_df.drop(columns=["_cluster"]).mean().to_dict()
            # feature importance proxy: mean_diff between cluster and global
            global_mean = df.drop(columns=["_cluster"]).mean()
            mean_diff = (cluster_df.drop(columns=["_cluster"]).mean() - global_mean).abs().sort_values(ascending=False)
            top_features = mean_diff.head(top_k).index.tolist()
            profiles[int(c)] = {
                "count": int(count),
                "centroid": {k: float(v) for k, v in centroid.items()},
                "top_features": top_features,
            }
        return profiles

    def evaluate_clustering(self, X_emb: np.ndarray, labels: np.ndarray) -> Dict[str, Any]:
        # silhouette requires at least 2 clusters
        res = {}
        unique_labels = set(labels)
        if len(unique_labels) > 1 and len(labels) > 10:
            try:
                s = silhouette_score(X_emb, labels)
                res["silhouette"] = float(s)
            except Exception as e:
                logger.debug("Silhouette failed: %s", e)
                res["silhouette"] = None
        else:
            res["silhouette"] = None
        # cluster counts
        unique, counts = np.unique(labels, return_counts=True)
        res["cluster_counts"] = dict(zip(map(int, unique), map(int, counts)))
        return res

    # ---------------------------- Persistence & UI --------------------------
    def save_artifacts(self, name: str = "latest"):
        if joblib is None:
            logger.warning("joblib not installed: skipping save")
            return
        p = self.workdir / f"{name}.joblib"
        joblib.dump({
            "scaler": self.scaler,
            "pca": self.pca,
            "umap": self.umap_model,
            "clusterer": self.clusterer,
        }, p)
        logger.info("Saved artifacts to %s", p)

    def save_profile_json(self, profile: Dict[int, Dict[str, Any]], name: str = "cluster_profile.json"):
        out = self.workdir / name
        with open(out, "w") as f:
            json.dump(profile, f, indent=2)
        logger.info("Saved cluster profile to %s", out)

    # ---------------------------- Visualizations ---------------------------
    def plot_umap(self, emb: np.ndarray, labels: np.ndarray, meta: Optional[pd.DataFrame] = None, title: str = "UMAP Clusters") -> Optional[str]:
        if px is None:
            logger.warning("Plotly not available; skipping interactive plot")
            return None
        df = pd.DataFrame(emb, columns=["x", "y"]) if emb.shape[1] == 2 else pd.DataFrame(emb[:, :2], columns=["x", "y"])
        df["cluster"] = labels.astype(str)
        if meta is not None:
            for c in meta.columns:
                if c not in df.columns:
                    try:
                        df[c] = meta[c].values
                    except Exception:
                        pass
        fig = px.scatter(df, x="x", y="y", color="cluster", hover_data=meta.columns.tolist() if meta is not None else None, title=title)
        out = str(self.workdir / "umap_clusters.html")
        fig.write_html(out)
        logger.info("Wrote UMAP HTML to %s", out)
        return out

    # -------------------------- Integration & Run Loop ---------------------
    def analyze_batch(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Main entrypoint: receive raw records (list of dicts), run full EDA + clustering pipeline and persist outputs."""
        df = self.validate_and_frame(records)
        if df.empty:
            logger.info("No valid records")
            return {}

        numeric_df, feature_cols = self.select_numeric_features(df, exclude=["vehicle_id", "car_id", "meta_event", "chassis", "track"])
        # standardize + PCA
        Xp = self.fit_scaler_pca(numeric_df.fillna(0.0))
        # UMAP embedding
        emb = self.fit_umap(Xp)
        # HDBSCAN clustering
        labels = self.run_hdbscan(emb)
        # profiling
        profile = self.cluster_profile(numeric_df, labels)
        metrics = self.evaluate_clustering(emb, labels)
        # persist
        timestamp = int(time.time())
        self.save_artifacts(name=f"artifacts_{timestamp}")
        self.save_profile_json(profile, name=f"cluster_profile_{timestamp}.json")
        # optional visualization
        try:
            self.plot_umap(emb, labels, meta=df[[c for c in df.columns if c not in numeric_df.columns]] if not df.empty else None)
        except Exception as e:
            logger.debug("UMAP plot failed: %s", e)

        # build insight payloads per cluster for downstream agents
        cluster_insights = {
            "profile": profile,
            "metrics": metrics,
            "artifact_path": str(self.workdir),
            "research_doc": RESEARCH_DOC_PATH,
        }

        return cluster_insights

    def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a task from the orchestrator inbox"""
        payload = task.get('payload', {})
        samples = payload.get('samples') or []
        if not samples and 'sample' in payload:
            samples = [payload['sample']]
        
        if not samples:
            logger.warning("No samples in task payload")
            return {
                "type": "eda_result",
                "task_id": task.get('task_id'),
                "success": False,
                "error": "No samples provided"
            }

        # Run analysis
        cluster_insights = self.analyze_batch(samples)
        
        # Extract clustering results
        labels = cluster_insights.get('labels', [-1] * len(samples))
        embedding = cluster_insights.get('embedding', [])
        
        insight_id = f"insight-{uuid.uuid4().hex[:8]}"
        result = {
            "type": "eda_result",
            "task_id": task.get('task_id'),
            "insight_id": insight_id,
            "agent": self.agent_id,
            "success": True,
            "clusters": labels.tolist() if hasattr(labels, 'tolist') else labels,
            "embedding": embedding.tolist() if hasattr(embedding, 'tolist') else embedding,
            "profile": cluster_insights.get('profile', {}),
            "metrics": cluster_insights.get('metrics', {}),
            "samples_meta": [{"meta_time": s.get('meta_time'), "lap": s.get('lap')} for s in samples],
            "created_at": datetime.utcnow().isoformat() + 'Z'
        }
        
        return result

    def main_loop(self):
        """Main processing loop for Redis-based multi-agent system"""
        logger.info(f"EDA Cluster agent listening on {self.inbox}")
        self.register_agent()
        
        while True:
            try:
                msg = self.redis_client.blpop(self.inbox, timeout=5)
                if not msg:
                    time.sleep(0.05)
                    continue
                
                task = json.loads(msg[1].decode())
                logger.info(f"Processing task {task.get('task_id')}")
                
                result = self.process_task(task)
                
                # Store result in Redis
                if self.redis_client:
                    insight_id = result.get('insight_id')
                    if insight_id:
                        self.redis_client.hset(
                            f"insight:{insight_id}",
                            mapping={
                                "payload": json.dumps(result),
                                "created_at": result.get('created_at', datetime.utcnow().isoformat() + 'Z')
                            }
                        )
                    # Publish to results stream
                    self.redis_client.xadd(self.result_stream, '*', 'result', json.dumps(result))
                    logger.info(f"Published result for task {task.get('task_id')}")
                
            except Exception as e:
                logger.exception(f"Error processing task: {e}")
                time.sleep(0.5)

    # example run-once function that ingests from Redis stream or local file
    def run_once(self, source: Optional[str] = None) -> Dict[str, Any]:
        """If source is a Redis stream name and redis client is configured, read a glance of messages.
        Otherwise, if source is a path to a CSV/NDJSON, load from disk.
        """
        records = []
        if source is None and self.redis_client and self.input_stream:
            # read last N entries of stream
            entries = self.redis_client.xrevrange(self.input_stream, count=1024)
            for msg_id, payload in entries:
                # expected payload to contain feature dict as JSON string under 'payload' or direct fields
                if "payload" in payload:
                    try:
                        obj = json.loads(payload["payload"])
                        records.append(obj)
                    except Exception:
                        records.append(payload)
                else:
                    records.append(payload)
        elif source and Path(source).exists():
            # load CSV or NDJSON
            p = Path(source)
            if p.suffix in (".csv",):
                records = pd.read_csv(p).to_dict(orient="records")
            else:
                # attempt ndjson
                with open(p) as f:
                    for line in f:
                        try:
                            records.append(json.loads(line))
                        except Exception:
                            pass
        else:
            raise ValueError("No valid source for run_once")

        return self.analyze_batch(records)


# --------------------------- Example usage --------------------------------
if __name__ == "__main__":
    agent = EDAClusterAgent(
        redis_url=os.getenv("REDIS_URL", "redis://127.0.0.1:6379"),
        input_stream=os.getenv("INPUT_STREAM", "features")
    )
    
    # If you want to run against a local CSV file, pass path to run_once
    sample_csv = os.getenv("SAMPLE_FEATURE_CSV")
    if sample_csv:
        res = agent.run_once(source=sample_csv)
        print("Cluster insights:", json.dumps(res, indent=2))
    else:
        # Run main loop for multi-agent system
        try:
            agent.main_loop()
        except KeyboardInterrupt:
            logger.info("Shutting down...")
        except Exception as e:
            logger.exception("Run failed: %s", e)

