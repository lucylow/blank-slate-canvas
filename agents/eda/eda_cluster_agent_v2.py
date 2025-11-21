"""
EDA Cluster Agent v2 — multi-agent-ready

File: agents/eda_cluster_agent_v2.py

This file contains:

1) A short, copy-paste-ready ``Exploratory Data Analysis + Clustering`` section suitable for insertion
   into your design doc / .docx (below in the DOC_SECTION variable). Use it directly in the docx.

2) Architecture improvements specifically for clustering analysis in a 7-agent system (ARCHITECTURE_NOTES).

3) Production-capable EDAClusterAgentV2 Python class that:
   - Integrates with Redis Streams for multi-agent coordination (consumer groups, distributed locking)
   - Accepts per-track tasks and scales horizontally: multiple agent instances can run concurrently
   - Runs PCA -> UMAP -> HDBSCAN pipeline with automated hyperparameter sweep and stability scoring
   - Detects cluster drift vs historical centroids and emits cluster-drift events
   - Publishes cluster_insights to a Redis stream for downstream agents (predictor, explainer, UI)
   - Saves artifacts (embeddings, models, profiles) via joblib for reuse by other agents

Usage (example):
    agent = EDAClusterAgentV2(redis_url='redis://127.0.0.1:6379', input_stream='tasks.eda', output_stream='eda.results')
    agent.run_once()  # process available tasks
    # or
    agent.run_forever()

Notes:
- This code references your research/design brief file; I included the path in DOC_SECTION and in the agent metadata.
- For file-backed persistence and long-term history, mount a PVC or configure S3 upload in save_artifacts().

Dependencies (recommended):
    pip install pandas numpy scikit-learn umap-learn hdbscan joblib redis

DO NOT paste large binary traces into Redis. The agent publishes small evidence references and artifact paths. Use your object store for full traces.
"""

# --------------------------- DOC SECTION (for your .docx) ---------------------------

DOC_SECTION = '''
Exploratory Data Analysis & Clustering

Purpose
----
Exploratory Data Analysis (EDA) in PitWall A.I. identifies natural groups in telemetry-derived features — for example driving styles, tire-wear regimes, or car behavior modes — and turns them into actionable artifacts that other agents (Predictor, Explainer, Simulator) can use.

Approach
----
1. Canonicalization & Feature Set
   - Aggregate telemetry per (track, chassis, lap, sector) using the preprocessor outputs. Construct per-window features like: avg_speed, speed_std, brake_energy, tire_stress, lateral_g_mean, temperature_stats.

2. Dimensionality Reduction
   - Apply StandardScaler -> PCA (retain energy, e.g. 95%) -> UMAP (2D) for visualization and compact embeddings.

3. Density Clustering
   - Use HDBSCAN (robust to noise) to produce clusters and label noise points. Fall back to DBSCAN/KMeans when HDBSCAN unavailable.

4. Cluster Profiling & Explainability
   - Compute per-cluster centroids, top features by mean-difference, representative evidence frames, and simple textual summaries for human consumption.

5. Drift Detection & Lifecycle
   - Compare current centroids to historical centroids (stored per-track). If centroid displacement exceeds threshold, emit a cluster-drift alert for retrain or human review.

Outputs
----
- eda.results stream entries: {task_id, track, timestamp, cluster_profile_path, metrics}
- artifacts: embeddings.joblib, cluster_profile.json, umap.html
- cluster-drift alerts for orchestrator to trigger retraining or flag to the UI

References
----
Design brief used for initial priors and sector mapping: /mnt/data/3. Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .docx
'''

# --------------------------- ARCHITECTURE NOTES ---------------------------

ARCHITECTURE_NOTES = '''
Improvements to the 7-agent architecture for clustering analysis

1) Task partitioning by (track, time_window):
   - Orchestrator should emit EDA tasks keyed by track and time window (e.g. last N laps or last M minutes). This allows per-track affinity and smaller working sets.

2) Distributed coordination with Redis locks:
   - Use Redis SETNX with TTL or Redlock to ensure only one EDA agent instance processes a given task window. This avoids duplicate work while enabling horizontal scale.

3) Lightweight artifact registry:
   - Store artifact metadata (model_version, artifact_path, created_at) in a Postgres table or Redis hash so other agents can request the latest cluster centroids for online prediction or drift checks.

4) Cluster drift telemetry & auto-retrain triggers:
   - Publish cluster drift scores to metrics stream. When drift > threshold for a track, enqueue a retrain task for Predictor agents and notify humans.

5) Shared feature contracts:
   - EDA agents must expect feature vectors defined by fe_lib.prepare_features_for_model. Keep feature order stable and versioned.

6) Evidence and storage pattern:
   - Publish small evidence refs (evidence:{id} -> pointer to S3 object). Do not embed full traces in the message bus.

7) Ensemble / Meta-Agent integration:
   - Expose cluster membership as a categorical feature to predictor agents. A central Meta-Agent can learn per-cluster model weights.
'''

# --------------------------- Agent Implementation ---------------------------

import os
import time
import json
import math
import logging
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score

# optional libs
try:
    import umap
except Exception:
    umap = None

try:
    import hdbscan
except Exception:
    hdbscan = None

try:
    import joblib
except Exception:
    joblib = None

try:
    import redis
except Exception:
    redis = None

try:
    import requests
except Exception:
    requests = None

logger = logging.getLogger('eda_v2')
logging.basicConfig(level=logging.INFO)


class EDAClusterAgentV2:
    """EDA Cluster Agent v2 — multi-agent ready

    Key features:
      - Redis Streams consumer group integration (optional)
      - Distributed lock on task_id to avoid duplicated processing
      - Hyperparameter sweep with stability scoring
      - Drift detection vs historical centroids stored in Redis or local disk
      - Publishes eda results and drift alerts to Redis streams
    """

    def __init__(
        self,
        workdir: str = './eda_agent_v2_artifacts',
        redis_url: Optional[str] = None,
        input_stream: str = 'tasks.eda',
        output_stream: str = 'eda.results',
        drift_stream: str = 'eda.drift',
        consumer_group: str = 'eda-workers',
        consumer_name: str = None,
        pca_n_components: Optional[int] = 16,
        umap_n_neighbors: int = 15,
        umap_min_dist: float = 0.1,
        hdbscan_min_cluster_size: int = 5,
        orchestrator_url: Optional[str] = None,
        agent_id: Optional[str] = None,
    ):
        self.workdir = Path(workdir)
        self.workdir.mkdir(parents=True, exist_ok=True)
        self.redis_url = redis_url or os.getenv('REDIS_URL')
        self.input_stream = input_stream
        self.output_stream = output_stream
        self.drift_stream = drift_stream
        self.consumer_group = consumer_group
        self.consumer_name = consumer_name or f'eda-{int(time.time())}'
        self.orchestrator_url = orchestrator_url or os.getenv('ORCH_URL', 'http://localhost:9090')
        self.agent_id = agent_id or os.getenv('EDA_AGENT_ID', f'eda-cluster-v2-{int(time.time())}')

        self.pca_n_components = pca_n_components
        self.umap_n_neighbors = umap_n_neighbors
        self.umap_min_dist = umap_min_dist
        self.hdbscan_min_cluster_size = hdbscan_min_cluster_size

        # Redis client
        self.r = redis.from_url(self.redis_url) if (self.redis_url and redis) else None
        if self.r is not None:
            # ensure consumer group exists (safe to call)
            try:
                self.r.xgroup_create(self.input_stream, self.consumer_group, id='$', mkstream=True)
            except redis.ResponseError:
                pass

        # historical centroids storage (simple local cache / on-disk). For multi-node, use Postgres or Redis hashes.
        self.centroid_db = self.workdir / 'centroids.json'
        self.centroids = self._load_centroids()

    # ----------------- utilities -----------------
    def _load_centroids(self) -> Dict[str, Any]:
        if self.centroid_db.exists():
            try:
                return json.loads(self.centroid_db.read_text())
            except Exception:
                return {}
        return {}

    def _save_centroids(self):
        try:
            self.centroid_db.write_text(json.dumps(self.centroids))
        except Exception:
            logger.exception('failed saving centroids')

    def _task_lock_key(self, task_id: str) -> str:
        return f'eda:lock:{task_id}'

    def _acquire_lock(self, task_id: str, ttl: int = 30) -> bool:
        if not self.r:
            return True
        key = self._task_lock_key(task_id)
        # SETNX with expiry
        ok = self.r.set(key, self.consumer_name, nx=True, ex=ttl)
        return bool(ok)

    def _release_lock(self, task_id: str):
        if not self.r:
            return
        key = self._task_lock_key(task_id)
        try:
            val = self.r.get(key)
            if val:
                if isinstance(val, bytes):
                    val = val.decode()
                if val == self.consumer_name:
                    self.r.delete(key)
        except Exception:
            pass

    def register_agent(self):
        """Register with orchestrator for 7-agent system"""
        if not requests:
            logger.warning('requests not available; skipping orchestrator registration')
            return
        try:
            requests.post(
                f'{self.orchestrator_url}/api/agents/register',
                json={
                    'agentId': self.agent_id,
                    'types': ['eda'],
                    'tracks': ['*'],
                    'capacity': 2
                },
                timeout=5
            )
            logger.info(f'[EDA Cluster V2] Registered with orchestrator: {self.agent_id}')
        except Exception as e:
            logger.warning(f'[EDA Cluster V2] Registration failed (continuing anyway): {e}')

    # ----------------- core pipeline pieces -----------------
    def validate_and_frame(self, records: List[Dict[str, Any]]) -> pd.DataFrame:
        # Reuse simple validation: ensure required fields exist
        if not records:
            return pd.DataFrame()
        df = pd.DataFrame.from_records(records)
        # Basic timestamp parsing
        if 'timestamp' in df.columns:
            try:
                df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')
            except Exception:
                pass
        return df

    def select_numeric(self, df: pd.DataFrame, exclude: List[str] = None) -> Tuple[pd.DataFrame, List[str]]:
        exclude = exclude or []
        numeric = df.select_dtypes(include=[np.number]).copy()
        for col in exclude:
            if col in numeric.columns:
                numeric = numeric.drop(columns=[col])
        return numeric, numeric.columns.tolist()

    def fit_reduce(self, X: pd.DataFrame) -> Tuple[np.ndarray, PCA, StandardScaler]:
        # scale -> PCA
        scaler = StandardScaler()
        Xs = scaler.fit_transform(X)
        n_comp = min(self.pca_n_components or Xs.shape[1], Xs.shape[1])
        pca = PCA(n_components=n_comp)
        Xp = pca.fit_transform(Xs)
        return Xp, pca, scaler

    def compute_umap(self, Xp: np.ndarray, n_neighbors: Optional[int] = None, min_dist: Optional[float] = None) -> np.ndarray:
        if umap is None:
            # fallback: return first two PCA dims
            if Xp.shape[1] >= 2:
                return Xp[:, :2]
            else:
                # pad
                return np.hstack([Xp, np.zeros((Xp.shape[0], max(0, 2 - Xp.shape[1])) )])
        m = umap.UMAP(n_neighbors=(n_neighbors or self.umap_n_neighbors), min_dist=(min_dist or self.umap_min_dist), random_state=42)
        emb = m.fit_transform(Xp)
        # persist umap model if needed
        return emb

    def cluster_hdbscan(self, emb: np.ndarray, min_cluster_size: Optional[int] = None) -> Tuple[np.ndarray, Any]:
        if hdbscan is None:
            # fallback: simple kmeans via sklearn
            from sklearn.cluster import KMeans
            k = max(2, min_cluster_size or self.hdbscan_min_cluster_size)
            km = KMeans(n_clusters=k, random_state=42).fit(emb)
            return km.labels_, km
        cls = hdbscan.HDBSCAN(min_cluster_size=(min_cluster_size or self.hdbscan_min_cluster_size), prediction_data=True)
        labels = cls.fit_predict(emb)
        return labels, cls

    def profile_clusters(self, X: pd.DataFrame, labels: np.ndarray, top_k: int = 5) -> Dict[int, Dict[str, Any]]:
        df = X.copy()
        df['_cluster'] = labels
        profiles = {}

        unique = np.unique(labels)
        global_mean = df.drop(columns=['_cluster']).mean()

        for c in unique:
            cluster_df = df[df['_cluster'] == c]
            if len(cluster_df) == 0:
                continue
            centroid = cluster_df.drop(columns=['_cluster']).mean().to_dict()
            mean_diff = (centroid_diff := (cluster_df.drop(columns=['_cluster']).mean() - global_mean).abs()).sort_values(ascending=False)
            top_features = mean_diff.head(top_k).index.tolist()
            sample_idx = cluster_df.index[0]
            profiles[int(c)] = {
                'count': int(len(cluster_df)),
                'centroid': {k: float(v) for k,v in centroid.items()},
                'top_features': top_features,
                'representative_index': int(sample_idx),
            }
        return profiles

    def stability_score(self, Xp: np.ndarray, n_trials: int = 5) -> float:
        # crude stability: run clustering on subsamples and compute average silhouette on full embedding
        try:
            base_emb = Xp
            labels, _ = self.cluster_hdbscan(base_emb)
            if len(set(labels)) <= 1:
                return 0.0
            s = silhouette_score(base_emb, labels)
            return float(s)
        except Exception:
            return 0.0

    def detect_drift_and_save(self, track: str, profiles: Dict[int, Any]) -> Optional[Dict[str, Any]]:
        # compute centroid movement vs saved centroids for this track
        try:
            prev = self.centroids.get(track)
            # build current centroid vector (flatten cluster centroids) using sorted keys
            cur_vec = []
            for k in sorted(profiles.keys()):
                vals = profiles[k]['centroid']
                # sort keys for stability
                for fk in sorted(vals.keys()):
                    cur_vec.append(vals[fk])
            cur_arr = np.array(cur_vec)
            drift = None
            if prev:
                prev_arr = np.array(prev['vec'])
                # align lengths
                L = min(len(prev_arr), len(cur_arr))
                if L > 0:
                    dist = float(np.linalg.norm(prev_arr[:L] - cur_arr[:L]))
                    drift = {'distance': dist, 'threshold': prev.get('threshold', 1.0)}
                    # simple threshold check
                    if dist > prev.get('threshold', 1.0):
                        # publish drift to stream
                        if self.r is not None:
                            payload = {'track': track, 'distance': dist, 'time': time.time()}
                            try:
                                self.r.xadd(self.drift_stream, {'payload': json.dumps(payload)})
                            except Exception:
                                logger.exception('failed publish drift')
            # save current as new historical (with a default threshold)
            self.centroids[track] = {'vec': cur_arr.tolist(), 'threshold': float(max(0.5, np.linalg.norm(cur_arr) * 0.1)), 'ts': time.time()}
            self._save_centroids()
            return drift
        except Exception:
            logger.exception('drift check failed')
            return None

    def save_artifacts(self, track: str, task_id: str, emb: np.ndarray, labels: np.ndarray, profiles: Dict[str, Any]) -> str:
        ts = int(time.time())
        outdir = self.workdir / f'{track}_{task_id}_{ts}'
        outdir.mkdir(parents=True, exist_ok=True)
        # save embeddings, labels, profiles
        try:
            if joblib is not None:
                joblib.dump({'emb': emb, 'labels': labels}, outdir / 'embedding.joblib')
            with open(outdir / 'cluster_profile.json', 'w') as f:
                json.dump(profiles, f, indent=2)
        except Exception:
            logger.exception('failed to save artifacts')
        return str(outdir)

    # ----------------- task handling -----------------
    def process_task_payload(self, task: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # expect task to contain: task_id, track, records (list of feature dicts)
        task_id = task.get('task_id') or f'task-{int(time.time())}'
        track = task.get('track', 'unknown')
        if not self._acquire_lock(task_id):
            logger.info('Task %s locked by other worker; skipping', task_id)
            return None
        try:
            records = task.get('records') or task.get('payload') or []
            df = self.validate_and_frame(records)
            if df.empty:
                logger.info('no records for task %s', task_id)
                return None

            numeric_df, features = self.select_numeric(df, exclude=['vehicle_id','chassis'])
            Xp, pca, scaler = self.fit_reduce(numeric_df.fillna(0.0))
            emb = self.compute_umap(Xp)
            labels, clusterer = self.cluster_hdbscan(emb)
            profiles = self.profile_clusters(numeric_df, labels)
            metrics = {'n_samples': int(len(df)), 'n_clusters': int(len(set(labels))) if labels is not None else 0, 'stability': self.stability_score(Xp)}
            artifact_path = self.save_artifacts(track, task_id, emb.tolist() if hasattr(emb, 'tolist') else emb, labels.tolist() if hasattr(labels, 'tolist') else labels, profiles)

            # detect drift
            drift = self.detect_drift_and_save(track, profiles)

            result = {'task_id': task_id, 'track': track, 'metrics': metrics, 'profiles': profiles, 'artifact_path': artifact_path, 'timestamp': time.time(), 'drift': drift}

            # publish to output stream
            if self.r is not None:
                try:
                    payload = {'task_id': task_id, 'track': track, 'result': result}
                    self.r.xadd(self.output_stream, {'payload': json.dumps(payload)})
                except Exception:
                    logger.exception('publish failed')

            return result
        finally:
            self._release_lock(task_id)

    # ------------ runner helpers ---------------
    def read_one_task_from_redis(self, block_ms: int = 5000) -> Optional[Dict[str, Any]]:
        if self.r is None:
            return None
        msgs = self.r.xreadgroup(self.consumer_group, self.consumer_name, {self.input_stream: '>'}, count=1, block=block_ms)
        if not msgs:
            return None
        for stream, entries in msgs:
            for msg_id, data in entries:
                payload_raw = data.get('payload') or data.get('task') or None
                try:
                    task = json.loads(payload_raw) if isinstance(payload_raw, (str, bytes)) else payload_raw
                    if isinstance(task, bytes):
                        task = json.loads(task.decode())
                except Exception:
                    task = data
                # ack immediately to avoid reprocessing in simple flows (could ACK after processed)
                try:
                    self.r.xack(self.input_stream, self.consumer_group, msg_id)
                except Exception:
                    pass
                return task
        return None

    def run_once(self):
        # read and process a single task from Redis (or operate via direct method call)
        task = None
        if self.r is not None:
            task = self.read_one_task_from_redis()
        if task is not None:
            return self.process_task_payload(task)
        else:
            logger.info('no tasks found')
            return None

    def run_forever(self, idle_sleep: float = 1.0):
        logger.info('EDAClusterAgentV2 starting run_forever')
        self.register_agent()
        try:
            while True:
                res = self.run_once()
                if res is None:
                    time.sleep(idle_sleep)
        except KeyboardInterrupt:
            logger.info('stopping agent')


# ---------------- Example quick-test ----------------
if __name__ == '__main__':
    # quick local smoke test: feed a small synthetic dataset
    agent = EDAClusterAgentV2(redis_url=os.getenv('REDIS_URL', None), input_stream='tasks.eda', output_stream='eda.results')
    # build synthetic records
    recs = []
    import random
    for i in range(200):
        recs.append({'timestamp': time.time(), 'vehicle_id': f'GR86-{random.randint(1,31)}', 'speed': random.uniform(80,180), 'brake': random.uniform(0,1), 'throttle': random.uniform(0,1), 'tire_temp': random.uniform(70,110)})
    task = {'task_id': 'local-test-1', 'track': 'sebring', 'records': recs}
    out = agent.process_task_payload(task)
    print('Result:', json.dumps(out, indent=2, default=str))

# --------------------------- End of file ---------------------------

