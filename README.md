# PitWall A.I. — Real-time Race Strategy & Tire Intelligence

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Demo](https://img.shields.io/badge/demo-ready-success.svg)

**Predict tire loss, recommend pit windows, and get explainable radio-ready guidance — live.**

PitWall A.I. is a real-time analytics platform built for the Toyota GR Cup "Hack the Track" Hackathon. It combines live telemetry data, predictive AI models, and intuitive visualization to give racing teams the competitive edge.

## 🚀 Quick Start (30 seconds)

### Run the Demo

```bash
# Install dependencies
npm install

# Start demo server + frontend (one command)
npm run demo
```

Then open **http://localhost:5173/dashboard** in your browser.

The demo includes:
- Live WebSocket telemetry stream (replays sample data)
- Interactive pit wall dashboard
- Tire prediction API endpoint
- Real-time strategy recommendations

### Production Real-Time Server

For production deployments with live TRD telemetry streams:

```bash
cd server/realtime
npm install
npm run build
npm start
```

See [REALTIME_SERVER_INTEGRATION.md](./REALTIME_SERVER_INTEGRATION.md) for full documentation.

### What Judges Should Look For

1. **Live Telemetry Visualization** — Watch real-time data flow through the dashboard
2. **Tire Prediction Accuracy** — Check `/predict_tire/:track/:chassis` endpoint responses
3. **Explainable AI** — Click "Explain" buttons to see top-3 evidence for predictions
4. **Pit Window Optimization** — Interactive strategy simulator with "what-if" scenarios
5. **Driver Fingerprinting** — Per-driver performance analysis and coaching alerts

## 🎯 Key Features

### Real-time Tire Predictions
- Per-sector tire degradation analysis
- Laps-until-cliff predictions with confidence scores
- Sector-by-sector breakdown (S1/S2/S3)

### Pit Window Optimizer
- "What-if" simulator for Safety Car scenarios
- Traffic-aware pit window recommendations
- Multi-driver strategy comparison

### Driver Fingerprinting
- Actionable coaching alerts based on telemetry patterns
- Brake bias and throttle input analysis
- Sector-specific performance insights

## 🏗️ Architecture

### Frontend
- **Vite** + **React** + **TypeScript** — Modern, fast development
- **Tailwind CSS** + **shadcn-ui** — Beautiful, accessible components
- **WebSocket** — Real-time telemetry streaming
- **Recharts** — Data visualization

### Backend (Demo Server)
- **Node.js** + **Express** — RESTful API
- **WebSocket** — Live telemetry streaming
- **Sample Data Playback** — Realistic demo experience

### API Endpoints

```
GET  /health                          # Health check
GET  /predict_tire/:track/:chassis    # Tire prediction with explanation
WS   /ws                              # WebSocket telemetry stream
```

### Frontend-Backend Integration

The frontend is now fully integrated with the backend API:

- **REST API Client** (`src/lib/api.ts`): Handles all HTTP requests to backend endpoints
- **WebSocket Client**: Manages real-time telemetry streaming with automatic reconnection
- **Environment Variables**: Configure API endpoints via `.env` file:
  ```bash
  VITE_API_BASE_URL=http://localhost:8081
  VITE_WS_BASE_URL=ws://localhost:8081
  ```

- **Hooks Integration**:
  - `useTelemetry`: Connects to WebSocket and streams live telemetry data
  - `useStrategy`: Fetches tire predictions from REST API and updates every 30 seconds

## 📁 Project Structure

```
├── src/
│   ├── components/
│   │   ├── dashboard/          # Main dashboard components
│   │   ├── telemetry/          # Telemetry visualization
│   │   ├── strategy/           # Strategy console
│   │   ├── DemoLauncher.tsx    # Demo launcher component
│   │   └── ExplainModal.tsx    # AI explanation modal
│   ├── pages/
│   │   ├── Index.tsx           # Landing page
│   │   └── DashboardPage.tsx   # Main dashboard
│   └── hooks/                   # Custom React hooks
├── server/
│   └── demo-server.js          # Demo backend server
├── backend/
│   └── sample_data/            # Sample telemetry data
└── public/                      # Static assets
```

## 🧪 Development

### Run Frontend Only
```bash
npm run dev
```

### Run Demo Server Only
```bash
npm run demo-server
```

### Build for Production
```bash
npm run build
```

### Lint
```bash
npm run lint
```

## 🎬 Demo Script (3 minutes)

### 0:00 - 0:30 — Landing Page
- Hero section with value proposition
- Three key benefits highlighted
- "Run Demo" and "Watch Video" CTAs

### 0:30 - 1:30 — Dashboard Overview
- Live telemetry stream visualization
- Track map with real-time position
- Driver list with performance metrics

### 1:30 - 2:30 — Tire Predictions
- Click "Explain" on any prediction
- Review top-3 evidence points
- Check sector-by-sector breakdown

### 2:30 - 3:00 — Strategy Console
- Pit window recommendations
- "What-if" simulator
- Multi-driver comparison

## 🔧 Tech Stack

- **Frontend**: Vite, React 18, TypeScript, Tailwind CSS, shadcn-ui
- **State Management**: React Query, React Router
- **Real-time**: WebSocket (ws library)
- **Visualization**: Recharts
- **Backend**: Node.js, Express
- **Build Tool**: Vite

## 📊 Sample Data

The demo includes realistic sample telemetry data (`backend/sample_data/sample_laps.json`) with:
- Tire pressure and temperature readings
- Speed, throttle, and brake inputs
- G-force measurements (lateral and longitudinal)
- Sector-by-sector breakdown

## 🎨 Design System

- **Primary Color**: Toyota Red (#EB0A1E / HSL: 0 72% 51%)
- **Typography**: System font stack with strong scale (text-xl → text-4xl for metrics)
- **Accessibility**: ARIA labels, keyboard navigation, focus states
- **Responsive**: Mobile-first design with pit-wall mobile mode

## ☁️ Lovable Cloud Deployment

PitWall AI Backend is fully configured for deployment on Lovable Cloud with realtime features, demo mode, and production-ready ops.

### Quick Deploy

1. **Configure Environment Variables** (in Lovable UI):
   - `DEMO_MODE=true` - Enable demo mode (uses precomputed data)
   - `ALLOWED_ORIGINS=https://*.lovable.app,http://localhost:5173` - CORS origins
   - `SSE_INTERVAL_MS=1000` - SSE update interval
   - `PORT=8000` - Server port (Lovable sets this automatically)
   
   Optional:
   - `USE_REDIS_PUBSUB=false` - Enable Redis pub/sub for multi-instance WebSocket
   - `REDIS_URL=redis://...` - Redis connection URL (if using pub/sub)
   - `DATA_ARCHIVE_URL=file:///mnt/data/pitwall-backend-v2.tar.gz` - Optional data archive

2. **Deploy via Lovable**:
   - Push to main branch or use Lovable UI
   - Lovable builds using `lovable.yaml` configuration
   - Health checks run automatically at `/health` and `/ready`

3. **Verify Deployment**:
   ```bash
   # Health check
   curl https://your-app.lovable.app/health
   
   # Demo seed data
   curl https://your-app.lovable.app/demo/seed
   
   # SSE stream
   curl -N https://your-app.lovable.app/sse/live/GR86-001
   ```

### Features Enabled

- ✅ **Health & Readiness Endpoints**: `/health`, `/ready` for monitoring
- ✅ **Prometheus Metrics**: `/metrics` endpoint for observability
- ✅ **SSE Streaming**: `/sse/live/{vehicle_id}` for real-time telemetry
- ✅ **WebSocket Support**: `/ws/telemetry/{vehicle_id}` for bidirectional communication
- ✅ **Anomaly Detection**: Real-time anomaly detection with alerts
- ✅ **Demo Mode**: Safe demo mode with precomputed data (no large files in Git)
- ✅ **CORS Configuration**: Environment-driven CORS for Lovable previews
- ✅ **Structured Logging**: JSON logs for production observability

### Local Development (Demo Mode)

```bash
# Build Docker image
docker build -t pitwall-backend .

# Run with demo mode
docker run -e DEMO_MODE=true -p 8000:8000 pitwall-backend

# Test endpoints
curl http://localhost:8000/health
curl http://localhost:8000/demo/seed

# Test WebSocket (requires wscat: npm install -g wscat)
wscat -c ws://localhost:8000/ws/telemetry/GR86-001

# Or use test client
python3 test/test_ws_client.py --ws ws://localhost:8000/ws/telemetry/GR86-001
```

### Data Handling

**Important:** Do not commit large telemetry files to Git. The repo contains only small demo slices:
- `data/demo_slices/*.json` - Small demo samples (< 500KB each)
- `data/precomputed/*` - Precomputed aggregations (if generated)

For production deployments, use:
- Environment-mounted data archives (`DATA_ARCHIVE_URL`)
- Cloud storage (S3, GCS) with API access
- External data services

See [DEMO.md](DEMO.md) for detailed demo mode instructions.

### CI/CD

GitHub Actions workflow (`.github/workflows/lovable-deploy.yml`) automatically:
- Builds Docker image
- Runs smoke tests (`/health`, `/ready`, `/demo/seed`)
- Validates deployment readiness

### Monitoring

- **Health**: `GET /health` - Returns 200 if service is running
- **Readiness**: `GET /ready` - Returns 200 only when all services are available
- **Metrics**: `GET /metrics` - Prometheus metrics format

## 🚧 Roadmap

- [ ] Add training notebook stub for model development
- [ ] Implement full ETL pipeline documentation
- [ ] Add unit tests with Jest
- [ ] Create 3-minute demo video
- [ ] Add CI/CD pipeline with GitHub Actions
- [ ] Bundle size optimization and lazy loading

## 📝 License

MIT License — Created for the Toyota GR Cup "Hack the Track" Hackathon

## 🤝 Contributing

This project was built for the Toyota GR Cup hackathon. For questions or contributions, please open an issue.

---

**Built with ❤️ for the Toyota GR Cup "Hack the Track" Hackathon**
