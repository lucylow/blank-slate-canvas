"""
Prometheus metrics for observability
"""
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response
import logging

logger = logging.getLogger(__name__)

# Metrics
anomaly_counter = Counter(
    "anomaly_count_total",
    "Total anomaly events detected",
    ["detector", "vehicle_id", "severity"]
)

inference_latency = Histogram(
    "inference_latency_ms",
    "Inference latency in milliseconds",
    buckets=[10, 50, 100, 200, 500, 1000, 2000, 5000]
)

ws_connections = Gauge(
    "ws_connections_active",
    "Active WebSocket connections",
    ["vehicle_id"]
)

sse_updates_sent = Counter(
    "sse_updates_sent_total",
    "Total SSE updates sent",
    ["vehicle_id"]
)

http_requests_total = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"]
)

def get_metrics_response() -> Response:
    """Generate Prometheus metrics response"""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


