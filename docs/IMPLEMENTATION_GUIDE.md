# PitWall A.I. — Judge-Ready Code Implementation Guide

## Quick Start (10 minutes)

### 1. Add These Files to Your Repo

Copy all generated .py and .ts files into your blank-slate-canvas repo structure:

```
blank-slate-canvas/
├── app/
│   ├── __init__.py
│   ├── main.py                        # ← Replace/merge with app_main.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── sse.py                     # ← From app_routes_sse.py
│   │   ├── ws.py                      # ← From app_routes_ws.py
│   │   ├── demo.py                    # ← From app_routes_demo.py
│   │   ├── analytics.py               # ← From app_routes_analytics.py
│   │   ├── api_models.py              # ← From app_routes_api_models.py
│   │   └── insights.py                # ← From app_routes_insights.py
│   └── services/
│       └── tire_wear_predictor.py     # ← From app_services_tire_wear.py
├── src/
│   ├── hooks/
│   │   └── useTelemetry.tsx           # ← From frontend_hooks.ts (note: .tsx extension)
│   └── components/
│       └── PitWindowCard.tsx          # ← From PitWindowCard.tsx
├── tests/
│   └── test_backend.py                # ← From tests_test_backend.py (create if needed)
├── start.sh                           # ← From start.sh
├── Dockerfile                         # ← From Dockerfile
└── data/
    └── demo_slices/                   # Create directory (auto-populated by start.sh)
```

### 2. Install Dependencies

```bash
# Backend
pip install fastapi uvicorn prometheus-client redis sse-starlette scikit-learn numpy joblib

# Or use existing requirements.txt
pip install -r requirements.txt

# Frontend (if not already installed)
npm install recharts axios
```

### 3. Create Demo Data (if not present)

The start.sh script auto-creates demo slices. Or manually create:

```bash
mkdir -p data/demo_slices

# Create tire_cliff.json
cat > data/demo_slices/tire_cliff.json << 'EOF'
[
  {"meta_time":"2025-11-01T10:00:00Z","track":"sebring","chassis":"GR86-002","lap":10,"speed_kmh":210,"lat_g":0.8,"tire_temp_fl":85},
  {"meta_time":"2025-11-01T10:00:01Z","track":"sebring","chassis":"GR86-002","lap":11,"speed_kmh":208,"lat_g":0.85,"tire_temp_fl":90}
]
EOF
```

### 4. Test Locally

```bash
# Terminal 1: Start backend
export DEMO_MODE=true
uvicorn app.main:app --reload --port 8000

# Terminal 2: Test endpoints (in separate shell)
curl http://localhost:8000/health
curl http://localhost:8000/ready
curl http://localhost:8000/demo/seed
curl http://localhost:8000/api/models/
curl http://localhost:8000/metrics

# Run tests (if test_backend.py exists)
pytest tests/test_backend.py -v
# Or run existing tests
pytest tests/ -v
```

### 5. Run Frontend

```bash
# Terminal 3: Frontend dev server
npm run dev
```

Visit http://localhost:5173/dashboard and toggle "Demo Mode" to see live data.

## Judge-Specific Demo Scripts (Copy-Paste)

### For Jonny Elliott (CIO) — 3:00 demo

1. Open: http://localhost:8000/health
2. Open: http://localhost:8000/metrics
3. Copy model version from response
4. Say: "Every inference is auditable with model version and metrics."

### For Mark Chambers (Customer Racing) — 3:00 demo

1. Open frontend dashboard
2. Toggle "Demo Mode"
3. Select "tire_cliff" seed
4. Click "Pit Window Optimizer" → show "Pit Now" vs "Stay Out"
5. Say: "One-click pit decision with evidence."

### For Mike Norem (Customer Racing USA) — 3:00 demo

1. Open: http://localhost:8000/demo/info
2. Show demo seeds available
3. Click "Export PDF" (mock if not implemented)
4. Say: "Turnkey demo ready in minutes."

### For Nelson Cosgrove (Engineering) — 3:00 demo

1. Open: http://localhost:8000/api/insights
2. Click anomaly → "Replay"
3. Show telemetry trace with coaching note
4. Say: "Actionable driver feedback backed by evidence."

### For Marc Fernandez (Software & Data) — 3:00 demo

1. Open: http://localhost:8000/api/analytics/eval/tire-wear
2. Show RMSE per track
3. Show model manifest: http://localhost:8000/api/models/
4. Say: "Reproducible, auditable model metrics."

### For Jean-Louis Rivard (XR/Computing) — 3:00 demo

1. Show HUD mockup (slides/hud_mockup.png) or describe
2. Mention edge inference docs
3. Say: "Path to ONNX export + TensorRT for edge."

## High-Impact Quick Wins (Do These First)

### ✅ Tier 1 (Do Now — 30 mins)

- [ ] Copy app/main.py, routes/* to your repo
- [ ] Run start.sh to ensure demo slices exist
- [ ] Test `curl http://localhost:8000/health`

### ✅ Tier 2 (Next Hour)

- [ ] Wire frontend PitWindowCard to `/api/analytics/eval/tire-wear` endpoint (or `/eval/tire-wear` if using router directly)
- [ ] Add demo toggle button to dashboard
- [ ] Test `/sse/live/{vehicle_id}` stream in browser console

### ✅ Tier 3 (Optional, if time)

- [ ] Implement anomaly replay modal (fetches `/api/insights/{id}`)
- [ ] Add per-track model selector
- [ ] Wire Prometheus dashboard (Grafana mockup)

## Environment Variables (for Lovable Cloud)

Create `.env` or set in Lovable UI:

```env
DEMO_MODE=true
PORT=8000
MODEL_VERSION=1.0.0
MODEL_PATH=/app/models/demo_tire_model.pkl
REDIS_URL=redis://127.0.0.1:6379
ALLOWED_ORIGINS=http://localhost:5173,https://your-lovable-domain.lovable.app
DATA_ARCHIVE_URL=file:///path/to/data.tar.gz  # Optional
```

## Deployment (Lovable Cloud)

### Option 1: Docker (Recommended)

```bash
# Build image
docker build -t pitwall:latest .

# Run locally
docker run -e DEMO_MODE=true -p 8000:8000 pitwall:latest

# Push to registry (e.g., Docker Hub)
docker push your-registry/pitwall:latest

# Deploy to Lovable: push to main branch or use Lovable UI
```

### Option 2: Direct Deployment

1. Upload all files to Lovable
2. Set env vars (DEMO_MODE, PORT, etc.)
3. Run: `bash start.sh`

## Smoke Test Checklist (Before Demo Day)

- [ ] `curl /health` returns `{"status": "healthy"}`
- [ ] `curl /ready` returns `{"ready": true}`
- [ ] `curl /demo/seed` lists at least 1 seed
- [ ] `curl /api/models/` shows tire-v1.0
- [ ] `curl /api/analytics/eval/tire-wear` or `curl /eval/tire-wear` shows per-track RMSE
- [ ] Frontend loads, demo toggle works
- [ ] `pytest tests/ -v` passes (or `pytest tests/test_backend.py -v` if file exists)
- [ ] `/metrics` endpoint serves Prometheus data

## Troubleshooting

### Backend won't start

```bash
# Check Python version
python3 --version  # Should be 3.9+

# Reinstall deps
pip install --upgrade pip
pip install -r requirements.txt

# Run with debug
uvicorn app.main:app --log-level debug
```

### SSE/WS not connecting

- Check CORS: `ALLOWED_ORIGINS` includes frontend URL
- Check Redis: `redis-cli ping` should return `PONG`
- Check firewall: Port 8000 accessible from frontend

### Demo mode disabled

- Ensure `DEMO_MODE=true` in environment
- Check demo slices exist: `ls data/demo_slices/`
- Run start.sh to auto-generate: `bash start.sh`

## What Each File Does (Judge-Ready)

| File | Judge Value | What It Does |
|------|-------------|--------------|
| `app/main.py` | Jonny, Marc | CORS, health/readiness, Prometheus metrics, startup/shutdown |
| `routes/sse.py` | Mark, Jean-Louis | Live telemetry via Server-Sent Events (simple HTTP streaming) |
| `routes/ws.py` | Mark, Jean-Louis | WebSocket bidirectional telemetry for low-latency updates |
| `routes/demo.py` | Mike | Demo seed management (no file uploads needed) |
| `routes/analytics.py` | Marc | Model evaluation RMSE, dataset coverage, anomaly summary |
| `routes/api_models.py` | Jonny, Marc | Model manifest, versioning, activation |
| `routes/insights.py` | Nelson | Anomaly storage & retrieval for replay |
| `services/tire_wear_predictor.py` | Nelson, Marc | Predictions with confidence intervals & feature importance (explainability) |
| `start.sh` | Mike | Lovable-friendly startup, auto-creates demo data |
| `Dockerfile` | Jonny | Production Docker image |
| `frontend_hooks.ts` → `useTelemetry.tsx` | Mark | React hooks for real-time SSE/WS data |
| `PitWindowCard.tsx` | Mark, Mike | "Pit Now" vs "Stay Out" card with confidence |
| `tests/test_backend.py` | Marc | Unit tests for all endpoints (create if needed) |

## Next Steps (After Demo)

1. **Wire the full agent pipeline** (already started in your repo)
   - Orchestrator calls agents, produces consensus recommendation
   - Save to Redis for frontend to fetch

2. **Add per-track model selection**
   - `/api/models/activate/{name}` to switch models at runtime
   - Show RMSE improvement

3. **Implement replay simulation**
   - `POST /api/replay/simulate-pit` takes lap/action, re-runs predictor
   - Frontend shows delta in finishing position

4. **Deploy to production**
   - Use docker-compose for local dev with Redis
   - Push to Lovable Cloud with CI/CD (GitHub Actions)

## FAQ

**Q: Do I need to train a real model?**  
A: No, demo mode uses synthetic but realistic predictions. For production, replace `predict_tire_wear()` with your real model.

**Q: Can I run without Redis?**  
A: Yes, all endpoints fallback to demo mode if Redis unavailable.

**Q: How do I show live telemetry from a real car?**  
A: Wire your telemetry logger to `POST` to `/ws/telemetry/{vehicle_id}` or write to Redis stream.

**Q: Do I need to implement all 6 judge-specific features?**  
A: No, but prioritize: Jonny (health/metrics), Mark (pit card), Mike (demo), Nelson (insights), Marc (eval/models), Jean-Louis (mockup).

**Q: The test file `tests/test_backend.py` doesn't exist. What should I do?**  
A: You can create it based on the generated `tests_test_backend.py` file, or use the existing test files in `tests/` directory. The existing tests (`test_health.py`, `test_eval_endpoint.py`, etc.) should work for validation.

**Q: Why is `useTelemetry.tsx` instead of `.ts`?**  
A: The file uses React hooks and JSX, so it needs the `.tsx` extension. The guide has been updated to reflect the correct extension.

---

Ready to demo? Pick a judge, open the corresponding terminal, run the demo script, and you're done. ✅

