"""
Telemetry pipeline modules for real-time data processing.

This package provides:
- Redis Streams producer/consumer for telemetry ingestion
- Sector windowing and aggregation
- Online/incremental ML model training
- ONNX inference engine for optimized models
"""

from app.pipelines.telemetry_pipeline import (
    RedisTelemetryProducer,
    RedisStreamWorker,
    SectorWindowAggregator,
    OnlineModelManager,
    ONNXInferenceEngine,
    TelemetryProcessor,
    inspect_stream,
    make_redis,
)

__all__ = [
    "RedisTelemetryProducer",
    "RedisStreamWorker",
    "SectorWindowAggregator",
    "OnlineModelManager",
    "ONNXInferenceEngine",
    "TelemetryProcessor",
    "inspect_stream",
    "make_redis",
]

