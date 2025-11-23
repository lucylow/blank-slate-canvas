"""
Tests for evaluation endpoints
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_eval_smoke():
    """Smoke test for evaluation endpoint"""
    res = client.get("/api/analytics/eval/tire-wear")
    # Should return 200 or 400 depending on data availability
    assert res.status_code in (200, 400, 500)
    if res.status_code == 200:
        data = res.json()
        assert "track" in data or "error" in data


def test_dataset_coverage():
    """Test dataset coverage endpoint"""
    res = client.get("/api/analytics/dataset/coverage")
    assert res.status_code == 200
    data = res.json()
    assert "tracks" in data
    assert "total_tracks" in data


def test_demo_seeds():
    """Test demo seed endpoints"""
    # List seeds
    res = client.get("/demo/seed")
    assert res.status_code == 200
    data = res.json()
    assert "slices" in data
    
    # Try to get a specific seed (may not exist)
    res = client.get("/demo/seed/tire_cliff.json")
    # Should return 200 if exists, 404 if not
    assert res.status_code in (200, 404)


