#!/bin/bash
# Stop script for real-time telemetry analysis system

set -e

# Colors for output
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping Real-Time Telemetry Analysis System${NC}"

if [ -f logs/pids.txt ]; then
    PIDS=$(cat logs/pids.txt)
    for pid in $PIDS; do
        if kill -0 $pid 2>/dev/null; then
            echo "Stopping process $pid..."
            kill $pid
        fi
    done
    rm logs/pids.txt
    echo -e "${GREEN}All services stopped${NC}"
else
    echo -e "${YELLOW}No PID file found. Services may not be running.${NC}"
fi

