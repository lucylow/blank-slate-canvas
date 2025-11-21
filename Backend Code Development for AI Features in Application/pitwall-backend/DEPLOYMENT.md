# PitWall AI Backend - Deployment Guide

## Quick Start

### 1. Prerequisites
- Python 3.11+
- Race data in `/home/ubuntu/race_data/` (or set `DATA_DIR` environment variable)
- Required Python packages (see requirements.txt)

### 2. Installation

```bash
cd /home/ubuntu/pitwall-backend

# Install dependencies
pip3 install -r requirements.txt

# Or install with sudo if needed
sudo pip3 install -r requirements.txt
```

### 3. Running the Server

```bash
# Development mode (with auto-reload)
python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Production mode
python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 4. Testing the API

```bash
# Run the test script
./test_api.sh

# Or test manually
curl "http://localhost:8000/api/dashboard/live?track=sebring&race=1&vehicle=7&lap=12"
```

## Environment Variables

```bash
# Data directory (default: /home/ubuntu/race_data)
export DATA_DIR=/path/to/race/data

# Log level (default: INFO)
export LOG_LEVEL=DEBUG

# Port (default: 8000)
export PORT=8000
```

## Integration with Frontend

### CORS Configuration
The backend is pre-configured to accept requests from:
- `http://localhost:3000` - React development server
- `http://localhost:5173` - Vite development server
- `https://void-form-forge.lovable.app` - Production frontend

To add more origins, edit `app/config.py`:

```python
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://your-frontend-domain.com",
]
```

### Frontend API Calls

Example API call from frontend:

```javascript
// Fetch live dashboard data
const response = await fetch(
  'http://localhost:8000/api/dashboard/live?track=sebring&race=1&vehicle=7&lap=12'
);
const data = await response.json();

// Use data in React components
const { tire_wear, performance, gap_analysis } = data;
```

## API Endpoints Reference

### Main Dashboard Endpoint
```
GET /api/dashboard/live
Query params: track, race, vehicle, lap
Returns: Complete dashboard data with AI analytics
```

### Track Endpoints
```
GET /api/tracks - List all tracks
GET /api/tracks/{track_id} - Get track details
GET /api/tracks/{track_id}/races/{race_number} - Get race info
```

### Analytics Endpoints
```
POST /api/analytics/tire-wear - Predict tire wear
POST /api/analytics/performance - Analyze performance
POST /api/analytics/strategy - Optimize strategy
GET /api/analytics/gap-analysis - Calculate gaps
```

## Production Deployment

### Using systemd (Linux)

Create `/etc/systemd/system/pitwall-backend.service`:

```ini
[Unit]
Description=PitWall AI Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/pitwall-backend
Environment="DATA_DIR=/home/ubuntu/race_data"
ExecStart=/usr/bin/python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable pitwall-backend
sudo systemctl start pitwall-backend
sudo systemctl status pitwall-backend
```

### Using Docker (Optional)

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/
COPY data/ ./data/

EXPOSE 8000

CMD ["python3.11", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t pitwall-backend .
docker run -p 8000:8000 -v /home/ubuntu/race_data:/data pitwall-backend
```

### Using Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.pitwall.example.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Troubleshooting

### Server won't start
```bash
# Check if port 8000 is already in use
sudo lsof -i :8000

# Kill existing process
pkill -f uvicorn

# Check logs
tail -f server.log
```

### Data not found errors
```bash
# Verify data directory
ls -la /home/ubuntu/race_data/

# Check track data structure
ls -la /home/ubuntu/race_data/sebring/Sebring/

# Set DATA_DIR environment variable
export DATA_DIR=/path/to/your/race/data
```

### CORS errors from frontend
```bash
# Add your frontend origin to app/config.py
CORS_ORIGINS = [
    "http://localhost:3000",
    "https://your-frontend.com",
]
```

## Performance Optimization

### Caching
The backend includes in-memory caching for:
- Processed telemetry data
- Track metadata
- Model predictions

Cache TTL: 5 minutes (configurable in `app/config.py`)

### Data Loading
- Telemetry is loaded in chunks (100k rows at a time)
- Only requested laps are loaded from disk
- Pre-processed lap summaries are cached

### Scaling
For high-traffic scenarios:
- Use multiple Uvicorn workers: `--workers 4`
- Deploy behind a load balancer
- Use Redis for distributed caching
- Consider database for processed data

## Monitoring

### Health Check
```bash
curl http://localhost:8000/health
```

### Logs
```bash
# View server logs
tail -f server.log

# View with timestamps
tail -f server.log | grep -E "INFO|ERROR"
```

### Metrics
Access metrics at `/docs` endpoint for:
- Request count
- Response times
- Error rates

## Security

### API Key Authentication (Optional)
To add API key authentication, install `fastapi-security`:

```bash
pip install fastapi-security
```

Update `app/main.py`:

```python
from fastapi.security import APIKeyHeader

API_KEY = "your-secret-api-key"
api_key_header = APIKeyHeader(name="X-API-Key")

@app.get("/api/dashboard/live")
async def get_dashboard(api_key: str = Depends(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    # ... rest of endpoint
```

### HTTPS
For production, always use HTTPS:
- Use Nginx with Let's Encrypt SSL certificate
- Or deploy behind a cloud load balancer with SSL termination

## Support

For issues or questions:
1. Check the logs: `tail -f server.log`
2. Review API documentation: http://localhost:8000/docs
3. Test endpoints with the test script: `./test_api.sh`

## License

Built for the "Hack the Track" hackathon presented by Toyota GR.
