# Exploratory Data Analysis & Clustering

## Purpose
----
Exploratory Data Analysis (EDA) in PitWall A.I. identifies natural groups in telemetry-derived features — for example driving styles, tire-wear regimes, or car behavior modes — and turns them into actionable artifacts that other agents (Predictor, Explainer, Simulator) can use.

## Approach
----

### 1. Canonicalization & Feature Set
   - Aggregate telemetry per (track, chassis, lap, sector) using the preprocessor outputs. Construct per-window features like: avg_speed, speed_std, brake_energy, tire_stress, lateral_g_mean, temperature_stats.

### 2. Dimensionality Reduction
   - Apply StandardScaler -> PCA (retain energy, e.g. 95%) -> UMAP (2D) for visualization and compact embeddings.

### 3. Density Clustering
   - Use HDBSCAN (robust to noise) to produce clusters and label noise points. Fall back to DBSCAN/KMeans when HDBSCAN unavailable.

### 4. Cluster Profiling & Explainability
   - Compute per-cluster centroids, top features by mean-difference, representative evidence frames, and simple textual summaries for human consumption.

### 5. Drift Detection & Lifecycle
   - Compare current centroids to historical centroids (stored per-track). If centroid displacement exceeds threshold, emit a cluster-drift alert for retrain or human review.

## Outputs
----
- `eda.results` stream entries: {task_id, track, timestamp, cluster_profile_path, metrics}
- artifacts: embeddings.joblib, cluster_profile.json, umap.html
- cluster-drift alerts for orchestrator to trigger retraining or flag to the UI

## Architecture Improvements for 7-Agent System
----

### 1. Task Partitioning by (Track, Time_Window)
   - Orchestrator emits EDA tasks keyed by track and time window (e.g. last N laps or last M minutes). This allows per-track affinity and smaller working sets.

### 2. Distributed Coordination with Redis Locks
   - Use Redis SETNX with TTL or Redlock to ensure only one EDA agent instance processes a given task window. This avoids duplicate work while enabling horizontal scale.

### 3. Lightweight Artifact Registry
   - Store artifact metadata (model_version, artifact_path, created_at) in a Postgres table or Redis hash so other agents can request the latest cluster centroids for online prediction or drift checks.

### 4. Cluster Drift Telemetry & Auto-Retrain Triggers
   - Publish cluster drift scores to metrics stream. When drift > threshold for a track, enqueue a retrain task for Predictor agents and notify humans.

### 5. Shared Feature Contracts
   - EDA agents must expect feature vectors defined by `fe_lib.prepare_features_for_model`. Keep feature order stable and versioned.

### 6. Evidence and Storage Pattern
   - Publish small evidence refs (evidence:{id} -> pointer to S3 object). Do not embed full traces in the message bus.

### 7. Ensemble / Meta-Agent Integration
   - Expose cluster membership as a categorical feature to predictor agents. A central Meta-Agent can learn per-cluster model weights.

## Implementation
----

The EDA Cluster Agent V2 (`agents/eda/eda_cluster_agent_v2.py`) implements the above architecture with:

- **Redis Streams Consumer Groups**: Enables horizontal scaling with multiple agent instances
- **Distributed Locking**: Prevents duplicate task processing across instances
- **Cluster Drift Detection**: Monitors centroid shifts and emits alerts for retraining
- **Stability Scoring**: Enhanced hyperparameter sweep with silhouette analysis
- **Orchestrator Integration**: Seamless registration with the 7-agent orchestrator

## References
----
Design brief used for initial priors and sector mapping: `/mnt/data/3. Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .docx`


