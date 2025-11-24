#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "Starting PitWall Backend..."

# Create data directories if they don't exist
mkdir -p /app/data/raw /app/data/precomputed /app/data/demo_slices /app/data/models

# Optional extraction of local file URL
if [[ "${DATA_ARCHIVE_URL:-}" == file://* ]]; then
  ARCHIVE_PATH="${DATA_ARCHIVE_URL#file://}"
  if [[ -f "$ARCHIVE_PATH" ]]; then
    echo "Extracting archive from ${ARCHIVE_PATH} to /app/data/raw..."
    tar -xzf "${ARCHIVE_PATH}" -C /app/data/raw 2>/dev/null || {
      echo "Warning: Failed to extract archive, continuing without it..."
    }
    
    # Run precompute to produce demo artifacts
    if [[ -f /app/scripts/precompute_from_archive.py ]]; then
      echo "Running precompute script..."
      python /app/scripts/precompute_from_archive.py --input /app/data/raw --out /app/data || {
        echo "Warning: Precompute script failed, continuing..."
      }
    fi
  else
    echo "Warning: Archive file not found at ${ARCHIVE_PATH}, skipping extraction..."
  fi
fi

# Generate demo slices if none exist and demo mode enabled
if [[ "${DEMO_MODE:-false}" == "true" ]]; then
  if [ ! -d "/app/data/demo_slices" ] || [ -z "$(ls -A /app/data/demo_slices 2>/dev/null || true)" ]; then
    echo "Generating synthetic demo slices..."
    if [[ -f /app/scripts/generate_demo_slices.py ]]; then
      python /app/scripts/generate_demo_slices.py --out /app/data/demo_slices || {
        echo "Warning: Demo slice generation failed, continuing..."
      }
    fi
  fi
  echo "Demo mode enabled - using precomputed data"
fi

# Start server
PORT=${PORT:-8000}
LOG_LEVEL=${LOG_LEVEL:-info}

echo "Starting uvicorn on port ${PORT} with log level ${LOG_LEVEL}..."

exec uvicorn app.main:app \
  --host 0.0.0.0 \
  --port "${PORT}" \
  --workers 1 \
  --log-level "${LOG_LEVEL}" \
  --proxy-headers




