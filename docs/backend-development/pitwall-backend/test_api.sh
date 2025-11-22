#!/bin/bash

echo "=== PitWall AI Backend API Tests ==="
echo ""

echo "1. Testing root endpoint..."
curl -s http://localhost:8000/ | python3.11 -m json.tool
echo ""

echo "2. Testing health check..."
curl -s http://localhost:8000/health | python3.11 -m json.tool
echo ""

echo "3. Testing tracks list..."
curl -s http://localhost:8000/api/tracks | python3.11 -m json.tool | head -20
echo ""

echo "4. Testing dashboard endpoint (main AI feature)..."
curl -s "http://localhost:8000/api/dashboard/live?track=sebring&race=1&vehicle=7&lap=5" | python3.11 -m json.tool
echo ""

echo "5. Testing tire wear prediction..."
curl -s -X POST "http://localhost:8000/api/analytics/tire-wear" \
  -H "Content-Type: application/json" \
  -d '{"track": "sebring", "race": 1, "vehicle_number": 7, "lap": 8}' | python3.11 -m json.tool
echo ""

echo "=== All tests completed ==="
