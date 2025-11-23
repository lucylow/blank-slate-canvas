#!/bin/bash
# Start script for real-time telemetry analysis system
# This script starts all services in background processes

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Real-Time Telemetry Analysis System${NC}"

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${YELLOW}Redis is not running. Starting Redis with Docker...${NC}"
    docker run -d --name pitwall-redis -p 6379:6379 redis:7 || echo -e "${YELLOW}Docker container might already exist. Continuing...${NC}"
    sleep 2
fi

# Set default environment variables if not set
export REDIS_URL=${REDIS_URL:-redis://127.0.0.1:6379}
export TELEMETRY_STREAM=${TELEMETRY_STREAM:-telemetry.stream}
export AGG_STREAM=${AGG_STREAM:-aggregates.stream}

# Create logs directory
mkdir -p logs

# Start Telemetry Ingestor
echo -e "${GREEN}Starting Telemetry Ingestor...${NC}"
python agents/telemetry_ingestor_async.py > logs/ingestor.log 2>&1 &
INGESTOR_PID=$!
echo "Ingestor PID: $INGESTOR_PID"

# Start Agent Orchestrator
echo -e "${GREEN}Starting Agent Orchestrator...${NC}"
python agents/agent_orchestrator_async.py > logs/orchestrator.log 2>&1 &
ORCHESTRATOR_PID=$!
echo "Orchestrator PID: $ORCHESTRATOR_PID"

# Start Predictor Agent
echo -e "${GREEN}Starting Predictor Agent...${NC}"
python agents/predictor_agent_async.py > logs/predictor.log 2>&1 &
PREDICTOR_PID=$!
echo "Predictor PID: $PREDICTOR_PID"

# Start Metrics Server
echo -e "${GREEN}Starting Metrics Server on port 9000...${NC}"
python -c "from agents.metrics_and_utils import start_metrics_server; start_metrics_server(9000); import asyncio; asyncio.get_event_loop().run_forever()" > logs/metrics.log 2>&1 &
METRICS_PID=$!
echo "Metrics Server PID: $METRICS_PID"

# Save PIDs to file for easy cleanup
echo "$INGESTOR_PID $ORCHESTRATOR_PID $PREDICTOR_PID $METRICS_PID" > logs/pids.txt

echo -e "\n${GREEN}All services started!${NC}"
echo -e "PIDs saved to logs/pids.txt"
echo -e "Logs directory: logs/"
echo -e "\n${YELLOW}To stop all services, run:${NC}"
echo "  ./agents/stop_realtime_telemetry.sh"
echo -e "\n${YELLOW}To view metrics:${NC}"
echo "  curl http://localhost:9000/metrics"
echo -e "\n${YELLOW}To inject test telemetry:${NC}"
echo '  redis-cli XADD telemetry.stream * data '"'"'{"meta_time":"2025-11-20T12:00:00Z","track":"cota","chassis":"GR86-01","lap":5,"speed_kmh":210,"sector":1}'"'"


