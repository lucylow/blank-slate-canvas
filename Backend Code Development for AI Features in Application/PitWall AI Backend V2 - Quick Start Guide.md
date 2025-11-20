# PitWall AI Backend V2 - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Extract Backend
```bash
cd /home/ubuntu
tar -xzf pitwall-backend-v2.tar.gz
cd pitwall-backend
```

### 2. Install Dependencies
```bash
pip3 install -r requirements.txt
# or with sudo if needed
sudo pip3 install -r requirements.txt
```

### 3. Start Server
```bash
python3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 4. Test Endpoints
```bash
# Health check
curl http://localhost:8000/api/health

# Enhanced dashboard with explainability
curl "http://localhost:8000/api/dashboard/live?track=sebring&race=1&vehicle=7&lap=5&enhanced=true"

# Demo data
curl "http://localhost:8000/api/demo/seed"
```

---

## 🎯 Key Endpoints

| Endpoint | Purpose | Example |
|----------|---------|---------|
| `GET /api/dashboard/live` | Complete dashboard data | `?track=sebring&race=1&vehicle=7&lap=12` |
| `GET /api/live/stream` | SSE real-time streaming | `?track=sebring&race=1&vehicle=7` |
| `GET /api/demo/seed` | Demo data for testing | `?name=best_overtake` |
| `GET /api/eval/tire-wear` | Model evaluation metrics | `?track=sebring&race=1&vehicle=7` |
| `GET /api/config` | Backend configuration | - |
| `GET /api/health` | Health check | - |

---

## 📊 What's New in V2

### 1. Explainability ✨
See which telemetry channels contribute most to predictions:
```json
{
  "top_features": {
    "hard_cornering_events": 0.80,
    "heavy_braking_events": 0.176
  }
}
```

### 2. Uncertainty Quantification 📈
Get confidence scores and intervals:
```json
{
  "confidence": 0.87,
  "ci_lower": {"front_left": 75.2},
  "ci_upper": {"front_left": 81.8}
}
```

### 3. Model Evaluation 🎯
Per-track RMSE and MAE metrics:
```bash
curl "http://localhost:8000/api/eval/tire-wear"
```

### 4. SSE Streaming 📡
Real-time updates without polling:
```javascript
const es = new EventSource('/api/live/stream?track=sebring&race=1&vehicle=7');
es.addEventListener('update', (e) => console.log(JSON.parse(e.data)));
```

---

## 🔗 Frontend Integration

### React Hook
```typescript
import { useDashboardData } from '@/hooks/useDashboardData';

const { data, loading, error } = useDashboardData('sebring', 1, 7, 12);
```

### API Call
```typescript
const response = await fetch(
  'http://localhost:8000/api/dashboard/live?track=sebring&race=1&vehicle=7&lap=12&enhanced=true'
);
const data = await response.json();
```

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 8000 is in use
sudo lsof -i :8000

# Kill existing process
pkill -f uvicorn
```

### CORS errors
Backend is pre-configured for:
- `http://localhost:3000`
- `http://localhost:5173`
- `https://void-form-forge.lovable.app`

To add more origins, edit `app/config.py`:
```python
CORS_ORIGINS = ["http://localhost:3000", "https://your-url.com"]
```

### Slow responses
- First request loads data (may take 5-10s)
- Subsequent requests are cached (< 1s)
- Use SSE streaming for better performance

---

## 📦 Files Included

```
pitwall-backend/
├── app/
│   ├── main.py                           # FastAPI app
│   ├── config.py                         # Configuration
│   ├── models/                           # Data models
│   ├── services/
│   │   ├── tire_wear_predictor.py       # V1 predictor
│   │   ├── tire_wear_predictor_v2.py    # ✨ V2 with explainability
│   │   ├── performance_analyzer.py
│   │   ├── strategy_optimizer.py
│   │   └── dashboard_builder.py         # ✨ Unified dashboard
│   ├── routes/
│   │   └── frontend_integration.py      # ✨ SSE + enhanced endpoints
│   ├── analytics/
│   │   └── eval.py                      # ✨ Model evaluation
│   ├── data/
│   │   └── data_loader.py
│   └── utils/
│       ├── calculations.py
│       └── cache.py                     # ✨ Performance caching
├── requirements.txt
├── README.md
└── DEPLOYMENT.md
```

---

## 🎓 Documentation

- **README.md** - Complete project documentation
- **DEPLOYMENT.md** - Deployment and production guide
- **BACKEND_IMPROVEMENTS_V2.md** - Detailed V2 improvements
- **FRONTEND_INTEGRATION_GUIDE.md** - Frontend integration guide
- **QUICK_START_V2.md** - This file

---

## 🏆 Hackathon Highlights

### Better Showcase of TRD Datasets
- **Explainability** shows exactly how each telemetry channel is used
- **Evaluation metrics** prove model works across all 7 tracks
- **Uncertainty quantification** demonstrates model reliability

### Production-Ready Features
- SSE streaming for real-time updates
- In-memory caching for performance
- Model evaluation harness
- Demo mode for frontend development

### Backward Compatible
- All V1 endpoints still work
- V2 features are opt-in via `enhanced=true`

---

## 📞 Support

For questions or issues:
1. Check server logs: `tail -f server.log`
2. Test health endpoint: `curl http://localhost:8000/api/health`
3. Try demo endpoint: `curl http://localhost:8000/api/demo/seed`

---

**Version**: 2.0.0  
**Status**: ✅ Tested and Working  
**Ready for**: Hackathon Demo & Production Deployment
