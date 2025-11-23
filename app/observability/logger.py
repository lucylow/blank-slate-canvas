"""
Structured JSON logging configuration
"""
import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict

from app.config import LOG_LEVEL, DEMO_MODE

class JSONFormatter(logging.Formatter):
    """Custom formatter that outputs structured JSON logs"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        # Add exception info if present
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        if hasattr(record, "vehicle_id"):
            log_obj["vehicle_id"] = record.vehicle_id
        if hasattr(record, "anomaly_type"):
            log_obj["anomaly_type"] = record.anomaly_type
        if hasattr(record, "severity"):
            log_obj["severity"] = record.severity
        
        return json.dumps(log_obj)

def setup_logging():
    """Configure structured JSON logging"""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler with JSON formatter
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    root_logger.addHandler(handler)
    
    # Log startup event
    logger = logging.getLogger(__name__)
    logger.info("Logging initialized", extra={
        "demo_mode": DEMO_MODE,
        "log_level": LOG_LEVEL
    })



