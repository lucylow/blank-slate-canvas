# EDA Cluster Agent

Comprehensive Exploratory Data Analysis (EDA) and clustering agent for the PitWall AI multi-agent system.

## Features

- **Robust Input Validation**: Handles noisy telemetry data with schema inference
- **Automated Feature Engineering**: Creates cyclical time features from timestamps
- **Scalable Dimensionality Reduction**: PCA → UMAP pipeline with memory-aware batching
- **Density-Based Clustering**: HDBSCAN with stability analysis (falls back to KMeans if unavailable)
- **Cluster Profiling**: Per-cluster summary statistics, top features, and representative examples
- **Explainability**: Mean-difference feature importance per cluster
- **Visualization**: Interactive UMAP scatter plots (HTML output)
- **Persistence**: Saves models, embeddings, and profiles with joblib
- **Redis Integration**: Seamlessly integrates with multi-agent orchestrator

## Installation

```bash
pip install -r ../requirements.txt
```

Required dependencies:
- `numpy`, `pandas`, `scikit-learn`
- `umap-learn`, `hdbscan`
- `redis`, `joblib`
- `plotly` (optional, for visualizations)

## Usage

### As Part of Multi-Agent System

The agent automatically registers with the orchestrator and processes tasks from Redis:

```bash
cd agents/eda
python eda_cluster_agent.py
```

Environment variables:
- `REDIS_URL`: Redis connection string (default: `redis://127.0.0.1:6379`)
- `EDA_AGENT_ID`: Agent identifier (default: auto-generated)
- `ORCH_URL`: Orchestrator URL (default: `http://localhost:9090`)
- `RESEARCH_DOC_PATH`: Path to research document (optional)

### Standalone Analysis

```python
from eda_cluster_agent import EDAClusterAgent

# Initialize agent
agent = EDAClusterAgent(
    workdir="./eda_output",
    n_components_pca=16,
    umap_n_neighbors=15,
    cluster_min_cluster_size=5
)

# Analyze a batch of records
records = [
    {"speed_kmh": 180, "accx_can": 0.5, "accy_can": 0.3, "meta_time": "2025-01-20T10:00:00Z"},
    # ... more records
]

insights = agent.analyze_batch(records)
print(insights)
```

### From CSV File

```bash
export SAMPLE_FEATURE_CSV=/path/to/telemetry.csv
python eda_cluster_agent.py
```

## Configuration

### Hyperparameters

- `n_components_pca`: Number of PCA components (default: 16)
- `umap_n_neighbors`: UMAP neighborhood size (default: 15)
- `umap_min_dist`: UMAP minimum distance (default: 0.1)
- `cluster_min_cluster_size`: Minimum cluster size for HDBSCAN (default: 5)

### Output Artifacts

The agent saves to `workdir` (default: `./eda_agent_artifacts`):
- `artifacts_{timestamp}.joblib`: Trained models (scaler, PCA, UMAP, clusterer)
- `cluster_profile_{timestamp}.json`: Cluster profiles with statistics
- `umap_clusters.html`: Interactive visualization (if plotly available)

## Message Format

### Input (from orchestrator)

```json
{
  "task_id": "task-123",
  "task_type": "eda",
  "track": "cota",
  "chassis": "GR86-002",
  "payload": {
    "samples": [
      {
        "meta_time": "2025-01-20T10:00:00Z",
        "lap": 12,
        "speed_kmh": 180,
        "accx_can": 0.5,
        "accy_can": 0.3,
        "Steering_Angle": 5.2
      }
    ]
  }
}
```

### Output (to results stream)

```json
{
  "type": "eda_result",
  "task_id": "task-123",
  "insight_id": "insight-abc123",
  "agent": "eda-cluster-01",
  "success": true,
  "clusters": [0, 0, 1, -1, ...],
  "embedding": [[x1, y1], [x2, y2], ...],
  "profile": {
    "0": {
      "count": 45,
      "centroid": {"speed_kmh": 175.2, ...},
      "top_features": ["speed_kmh", "accx_can", ...]
    }
  },
  "metrics": {
    "silhouette": 0.65,
    "cluster_counts": {"0": 45, "1": 32, "-1": 8}
  },
  "samples_meta": [...],
  "created_at": "2025-01-20T10:05:00Z"
}
```

## Integration with Other Agents

The EDA agent's output can be consumed by:

1. **Explainer Agent**: Formats cluster insights into human-readable recommendations
2. **Delivery Agent**: Broadcasts cluster updates via WebSocket to frontend
3. **Predictor Agent**: Uses cluster assignments as features for tire wear prediction

## Example Use Cases

### Driver Style Clustering

Identify different driving styles based on telemetry patterns:
- Aggressive vs. conservative braking
- High-speed vs. technical cornering
- Tire management strategies

### Anomaly Detection

Outliers (cluster -1 in HDBSCAN) can indicate:
- Mechanical issues
- Driver errors (lockups, spins)
- Track condition changes

### Performance Segmentation

Group similar performance patterns to:
- Compare driver consistency
- Identify optimal racing lines
- Detect tire degradation patterns

## Troubleshooting

**HDBSCAN not available:**
- Install: `pip install hdbscan`
- Agent will fall back to KMeans clustering

**UMAP not available:**
- Install: `pip install umap-learn`
- Agent will use PCA directly (2D projection)

**Memory issues with large datasets:**
- Reduce `n_components_pca`
- Increase `cluster_min_cluster_size` to reduce noise
- Process data in batches

**Redis connection errors:**
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URL` environment variable
- Ensure orchestrator is running for agent registration

## Research Document Reference

The agent references the research document at:
`/mnt/data/2 Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .md`

This path can be overridden with the `RESEARCH_DOC_PATH` environment variable.

## License

MIT


