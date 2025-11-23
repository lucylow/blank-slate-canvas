#!/usr/bin/env bash
set -e

BASE=${1:-http://localhost:8000}

echo "Smoke testing endpoints at ${BASE}..."

echo "Testing /health..."
curl -s "${BASE}/health" | jq . || echo "Health check failed"

echo ""
echo "Testing /ready..."
curl -s "${BASE}/ready" | jq . || echo "Ready check failed"

echo ""
echo "Testing /demo/seed..."
curl -s "${BASE}/demo/seed" | jq . || echo "Demo seed list failed"

echo ""
echo "Testing /api/models..."
curl -s "${BASE}/api/models" | jq . || echo "Models endpoint failed"

echo ""
echo "Testing /api/analytics/dataset/coverage..."
curl -s "${BASE}/api/analytics/dataset/coverage" | jq . || echo "Coverage endpoint failed"

echo ""
echo "Smoke tests complete!"


