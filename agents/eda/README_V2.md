# EDA Cluster Agent V2 — Multi-Agent Ready

Enhanced Exploratory Data Analysis (EDA) and clustering agent designed for horizontal scaling across all 7 AI agents in the PitWall A.I. system.

## Key Improvements over V1

- **Redis Streams Consumer Groups**: Enables horizontal scaling with multiple agent instances
- **Distributed Locking**: Prevents duplicate task processing across instances
- **Cluster Drift Detection**: Monitors centroid shifts and emits alerts for retraining
- **Improved Stability Scoring**: Enhanced hyperparameter sweep with silhouette analysis
- **Better Artifact Management**: Organized artifact storage with metadata
- **Orchestrator Integration**: Seamless registration with the 7-agent orchestrator

## Features

- **Redis Streams Integration**: Consumer group support for load balancing
- **Distributed Task Processing**: Lock-based coordination to prevent duplicate work
- **PCA → UMAP → HDBSCAN Pipeline**: Advanced dimensionality reduction and clustering
- **Drift Detection**: Historical centroid tracking with automatic alerts
- **Stability Metrics**: Automated clustering quality assessment
- **Per-Track Affinity**: Task partitioning by track for better performance
- **Artifact Persistence**: Saves embeddings, models, and profiles for downstream agents

## Architecture Improvements

### 1. Task Partitioning by (Track, Time_Window)
- Orchestrator emits EDA tasks keyed by track and time window
- Enables per-track affinity and smaller working sets
- Better resource utilization

### 2. Distributed Coordination with Redis Locks
- Uses Redis SETNX with TTL to ensure single-instance processing
- Enables horizontal scale without duplicate work
- Automatic lock expiration prevents deadlocks

### 3. Lightweight Artifact Registry
- Stores artifact metadata (model_version, artifact_path, created_at)
- Other agents can request latest cluster centroids for prediction
- Supports Postgres or Redis hash storage

### 4. Cluster Drift Telemetry & Auto-Retrain Triggers
- Publishes cluster drift scores to metrics stream
- When drift > threshold, enqueues retrain task for Predictor agents
- Notifies humans via orchestrator alerts

### 5. Shared Feature Contracts
- Expects feature vectors defined by `fe_lib.prepare_features_for_model`
- Keeps feature order stable and versioned
- Ensures compatibility across agents

### 6. Evidence and Storage Pattern
- Publishes small evidence refs (evidence:{id} → pointer to S3 object)
- Does not embed full traces in message bus
- Reduces Redis memory usage

### 7. Ensemble / Meta-Agent Integration
- Exposes cluster membership as categorical feature to predictor agents
- Central Meta-Agent can learn per-cluster model weights
- Enables personalized predictions per cluster

## Installation

```bash
pip install -r ../requirements.txt
```

Required dependencies:
- `pandas`, `numpy`, `scikit-learn`
- `umap-learn`, `hdbscan`
- `redis`, `joblib`
- `requests` (for orchestrator registration)

## Usage

### As Part of 7-Agent System

The agent automatically registers with the orchestrator and processes tasks from Redis Streams:

```bash
cd agents/eda
python eda_cluster_agent_v2.py
```

Environment variables:
- `REDIS_URL`: Redis connection string (default: from env or None)
- `ORCH_URL`: Orchestrator URL (default: `http://localhost:9090`)
- `EDA_AGENT_ID`: Agent identifier (default: auto-generated)
- `INPUT_STREAM`: Redis stream name for tasks (default: `tasks.eda`)
- `OUTPUT_STREAM`: Redis stream name for results (default: `eda.results`)
- `DRIFT_STREAM`: Redis stream name for drift alerts (default: `eda.drift`)

### Programmatic Usage

```python
from eda_cluster_agent_v2 import EDAClusterAgentV2

# Initialize agent
agent = EDAClusterAgentV2(
    redis_url='redis://127.0.0.1:6379',
    input_stream='tasks.eda',
    output_stream='eda.results',
    consumer_group='eda-workers',
    orchestrator_url='http://localhost:9090'
)

# Process tasks continuously
agent.run_forever()

# Or process a single task
task = {
    'task_id': 'task-123',
    'track': 'sebring',
    'records': [
        {'speed': 180, 'brake': 0.5, 'throttle': 0.8, 'tire_temp': 95},
        # ... more records
    ]
}
result = agent.process_task_payload(task)
```

### Running Multiple Instances

You can run multiple instances for horizontal scaling:

```bash
# Terminal 1
python eda_cluster_agent_v2.py

# Terminal 2
EDA_AGENT_ID=eda-worker-2 python eda_cluster_agent_v2.py

# Terminal 3
EDA_AGENT_ID=eda-worker-3 python eda_cluster_agent_v2.py
```

Each instance will join the same consumer group and automatically coordinate task distribution via Redis Streams.

## Configuration

### Hyperparameters

- `pca_n_components`: Number of PCA components (default: 16, None for auto)
- `umap_n_neighbors`: UMAP neighborhood size (default: 15)
- `umap_min_dist`: UMAP minimum distance (default: 0.1)
- `hdbscan_min_cluster_size`: Minimum cluster size for HDBSCAN (default: 5)

### Work Directory

Artifacts are saved to `workdir` (default: `./eda_agent_v2_artifacts`):
- `{track}_{task_id}_{timestamp}/embedding.joblib`: Embeddings and labels
- `{track}_{task_id}_{timestamp}/cluster_profile.json`: Cluster profiles
- `centroids.json`: Historical centroids for drift detection

## Message Format

### Input (Redis Stream)

```json
{
  "task_id": "task-123",
  "track": "sebring",
  "records": [
    {
      "timestamp": 1642680000,
      "vehicle_id": "GR86-002",
      "speed": 180.5,
      "brake": 0.3,
      "throttle": 0.8,
      "tire_temp": 95.2
    }
  ]
}
```

### Output (Results Stream)

```json
{
  "task_id": "task-123",
  "track": "sebring",
  "metrics": {
    "n_samples": 200,
    "n_clusters": 3,
    "stability": 0.65
  },
  "profiles": {
    "0": {
      "count": 85,
      "centroid": {"speed": 175.2, "brake": 0.3, ...},
      "top_features": ["speed", "tire_temp", ...],
      "representative_index": 42
    },
    "1": {
      "count": 78,
      "centroid": {"speed": 182.1, "brake": 0.5, ...},
      "top_features": ["brake", "speed", ...],
      "representative_index": 103
    }
  },
  "artifact_path": "/path/to/artifacts",
  "timestamp": 1642680500,
  "drift": {
    "distance": 1.23,
    "threshold": 1.0
  }
}
```

### Drift Alert (Drift Stream)

```json
{
  "track": "sebring",
  "distance": 1.23,
  "time": 1642680500
}
```

## Drift Detection

The agent maintains historical centroids per track and compares new cluster centroids to detect drift:

1. **Centroid Calculation**: Flattens cluster centroids into a feature vector
2. **Distance Metric**: Computes L2 norm between current and historical centroids
3. **Threshold Check**: If distance > threshold, emits drift alert
4. **Auto-Retrain Trigger**: Orchestrator can enqueue retrain tasks for Predictor agents

Default threshold is 10% of centroid norm, with a minimum of 0.5.

## Integration with Other Agents

### Predictor Agent
- Uses cluster membership as categorical feature
- Can learn per-cluster tire degradation models
- Gets notified of drift for model retraining

### Explainer Agent
- Formats cluster profiles into human-readable insights
- Generates summaries of driving styles or tire regimes
- Attaches representative evidence frames

### Simulator Agent
- Can simulate per-cluster scenarios
- Uses cluster profiles for strategy optimization

### Delivery Agent
- Broadcasts cluster updates via WebSocket
- Exposes cluster profiles through REST API

## Monitoring

### Health Checks

```bash
# Check if agent is processing tasks
redis-cli XINFO GROUPS tasks.eda

# Check latest results
redis-cli XREVRANGE eda.results + - COUNT 5

# Check drift alerts
redis-cli XREVRANGE eda.drift + - COUNT 5
```

### Metrics

- Tasks processed per minute
- Average processing latency
- Cluster count and stability scores
- Drift alerts per track

## Troubleshooting

**Agent not receiving tasks:**
- Verify Redis Stream exists: `redis-cli XINFO STREAM tasks.eda`
- Check consumer group: `redis-cli XINFO GROUPS tasks.eda`
- Verify orchestrator is routing tasks to `tasks.eda` stream

**Lock contention:**
- Increase lock TTL if tasks take longer than 30s
- Check for stuck locks: `redis-cli KEYS eda:lock:*`

**Memory issues:**
- Reduce `pca_n_components`
- Increase `hdbscan_min_cluster_size` to reduce noise
- Process smaller time windows per task

**Drift alerts not firing:**
- Check `centroids.json` for historical data
- Verify threshold is appropriate for your data scale
- Check drift stream: `redis-cli XREVRANGE eda.drift + - COUNT 10`

## Performance Tuning

### For Large Datasets (>100k samples)
- Reduce PCA components: `pca_n_components=32` or less
- Increase HDBSCAN min cluster size: `hdbscan_min_cluster_size=10`
- Process in smaller time windows

### For High Throughput
- Run multiple agent instances (horizontal scaling)
- Increase Redis Stream consumer group size
- Tune `block_ms` in `read_one_task_from_redis()` for latency vs. CPU

### For Better Clustering Quality
- Increase UMAP neighbors: `umap_n_neighbors=30`
- Decrease UMAP min dist: `umap_min_dist=0.05`
- Adjust HDBSCAN min cluster size based on domain knowledge

## Research Document Reference

The agent references the research document path in `DOC_SECTION`:
`/mnt/data/3. Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .docx`

This can be customized in the agent's `DOC_SECTION` constant.

## License

MIT



