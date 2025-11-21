"""
Simple smoke tests for API endpoints
"""
import pytest
import requests
import json
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

def test_health_endpoint():
    """Test health endpoint returns 200"""
    response = requests.get(f"{BASE_URL}/health", timeout=5)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "uptime_seconds" in data

def test_ready_endpoint():
    """Test readiness endpoint"""
    response = requests.get(f"{BASE_URL}/ready", timeout=5)
    # In demo mode, should return 200
    assert response.status_code in [200, 503]  # 503 if not ready
    data = response.json()
    assert "ready" in data
    assert "checks" in data

def test_demo_seed():
    """Test demo seed endpoint"""
    response = requests.get(f"{BASE_URL}/demo/seed", timeout=5)
    assert response.status_code == 200
    data = response.json()
    assert "demo_mode" in data

def test_metrics_endpoint():
    """Test Prometheus metrics endpoint"""
    response = requests.get(f"{BASE_URL}/metrics", timeout=5)
    assert response.status_code == 200
    assert "anomaly_count_total" in response.text or "http_requests_total" in response.text

def test_root_endpoint():
    """Test root endpoint"""
    response = requests.get(f"{BASE_URL}/", timeout=5)
    assert response.status_code == 200
    data = response.json()
    assert "version" in data

if __name__ == "__main__":
    pytest.main([__file__, "-v"])


