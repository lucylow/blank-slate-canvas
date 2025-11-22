"""
Tests for health and readiness endpoints
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    """Test health endpoint"""
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert "status" in data
    assert data["status"] == "ok"
    assert "uptime_seconds" in data


def test_ready():
    """Test readiness endpoint"""
    r = client.get("/ready")
    # Should return 200 or 503 depending on services
    assert r.status_code in (200, 503)
    data = r.json()
    assert "ready" in data
    assert "checks" in data


def test_metrics():
    """Test metrics endpoint"""
    r = client.get("/metrics")
    assert r.status_code == 200
    # Prometheus metrics should be text/plain
    assert "text/plain" in r.headers.get("content-type", "")

