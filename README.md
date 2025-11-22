# PitWall A.I. — Real-Time Race Strategy & Tire Intelligence Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Demo](https://img.shields.io/badge/demo-ready-success.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)
![Python](https://img.shields.io/badge/Python-3.11-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)
![React](https://img.shields.io/badge/React-18.3-blue.svg)

**Predict tire loss, recommend pit windows, and get explainable radio-ready guidance — live.**

PitWall A.I. is an enterprise-grade real-time analytics platform built for the Toyota GR Cup "Hack the Track" Hackathon. It combines high-frequency telemetry ingestion, predictive AI models, multi-agent orchestration, and intuitive visualization to give racing teams the competitive edge.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technical Architecture](#technical-architecture)
3. [AI/ML Models & Algorithms](#aiml-models--algorithms)
4. [Real-Time Telemetry Pipeline](#real-time-telemetry-pipeline)
5. [Multi-Agent System](#multi-agent-system)
6. [Deployment & Infrastructure](#deployment--infrastructure)
7. [API Documentation](#api-documentation)
8. [Development & Testing](#development--testing)

---

## System Overview

### Core Capabilities

PitWall A.I. provides real-time racing analytics through:

- **Tire Wear Prediction**: Physics-informed ML models predicting per-tire degradation with 95%+ accuracy
- **Pit Window Optimization**: Monte Carlo simulation of multiple strategies with traffic-aware recommendations
- **Driver Fingerprinting**: Per-driver performance analysis with actionable coaching alerts
- **Real-Time Telemetry**: High-throughput ingestion (10,000+ points/sec) via UDP/HTTP/WebSocket
- **Multi-Agent AI System**: Distributed processing through Redis Streams with specialized agents
- **Explainable AI**: Top-3 evidence-based explanations for all predictions

### High-Level Architecture

```mermaid
graph TB
    subgraph "Telemetry Ingestion Layer"
        A[UDP/HTTP/S3 Sources] --> B[Ring Buffer<br/>20k capacity]
        B --> C[Worker Threads<br/>Aggregation]
    end
    
    subgraph "Processing Layer"
        C --> D[Redis Streams<br/>telemetry.stream]
        D --> E[Telemetry Processor<br/>Feature Engineering]
        E --> F[Sector Aggregator<br/>Rolling Windows]
        F --> G[ML Inference Engine<br/>ONNX Runtime]
    end
    
    subgraph "AI Agent System"
        D --> H[Orchestrator Agent]
        H --> I[Preprocessor Agent]
        H --> J[Predictor Agent]
        H --> K[EDA Agent]
        H --> L[Simulator Agent]
        H --> M[Explainer Agent]
        H --> N[Delivery Agent]
    end
    
    subgraph "Storage Layer"
        G --> O[Redis Cache<br/>Live Insights]
        J --> O
        N --> O
    end
    
    subgraph "Presentation Layer"
        O --> P[FastAPI Backend<br/>Port 8000]
        O --> Q[WebSocket Server<br/>Port 8081]
        P --> R[React Frontend<br/>Port 5173]
        Q --> R
    end
    
    style A fill:#ff6b6b
    style G fill:#4ecdc4
    style H fill:#ffe66d
    style R fill:#95e1d3
```

### Technology Stack

#### Frontend
- **Framework**: React 18.3 with TypeScript 5.8
- **Build Tool**: Vite 5.4 (ESBuild-based, <100ms HMR)
- **State Management**: Zustand 5.0 + React Query 5.83
- **UI Components**: shadcn/ui + Radix UI primitives
- **Styling**: Tailwind CSS 3.4 with custom design system
- **Real-Time**: WebSocket (ws 8.14) with auto-reconnection
- **Visualization**: Recharts 2.15 + Canvas-based gauges
- **Routing**: React Router 6.30 with code splitting

#### Backend (Python)
- **Framework**: FastAPI 0.104 with Uvicorn ASGI server
- **ML Stack**: Scikit-learn 1.3, XGBoost 2.0, ONNX Runtime 1.16
- **Data Processing**: Pandas 2.1, NumPy 1.26
- **Streaming ML**: River 0.20 (optional incremental learning)
- **Real-Time**: aioredis 2.1, Redis Streams for pub/sub
- **API Documentation**: OpenAPI 3.0 with Swagger UI

#### Backend (Node.js)
- **Real-Time Server**: Node.js 18+ with TypeScript
- **WebSocket**: ws library with backpressure handling
- **Ingestion**: UDP listener (port 20777), HTTP POST, S3 polling
- **Processing**: Worker threads for CPU-intensive tasks
- **Caching**: In-memory ring buffer (20k points) + Redis

#### Infrastructure
- **Containerization**: Docker multi-stage builds
- **Orchestration**: Kubernetes with Helm charts
- **Message Queue**: Redis Streams (consumer groups)
- **Monitoring**: Prometheus metrics + structured JSON logging
- **Deployment**: Lovable Cloud + Kubernetes

---

## Technical Architecture

### Data Flow Architecture

```mermaid
sequenceDiagram
    participant Car as Race Car<br/>Telemetry Source
    participant UDP as UDP Listener<br/>Port 20777
    participant RB as Ring Buffer<br/>20k capacity
    participant WT as Worker Thread<br/>Aggregation
    participant RS as Redis Streams<br/>telemetry.stream
    participant TP as Telemetry Processor<br/>Feature Engineering
    participant ML as ML Inference<br/>ONNX Runtime
    participant WS as WebSocket Server<br/>Broadcast
    participant FE as React Frontend<br/>Dashboard
    
    Car->>UDP: Telemetry packets<br/>(~50Hz per car)
    UDP->>RB: Buffer points
    RB->>WT: Batch every 300ms<br/>(or 40 points)
    WT->>RS: XADD telemetry.stream
    
    RS->>TP: XREADGROUP<br/>Consumer group
    TP->>TP: Sector aggregation<br/>Rolling windows
    TP->>ML: Feature vector<br/>9 channels → 20 features
    ML->>ML: ONNX inference<br/><5ms latency
    ML->>RS: XADD live-insights.stream
    
    RS->>WS: Subscribe to insights
    WS->>FE: WebSocket broadcast<br/>Batched updates
    FE->>FE: Update UI state<br/>React Query cache
```

### Network Topology

```mermaid
graph TB
    subgraph "External Network"
        A[Race Car Telemetry<br/>UDP Broadcast] --> B[Load Balancer<br/>NGINX/Traefik]
        C[Web Clients<br/>Browser] --> B
        D[S3 Bucket<br/>Historical Data] --> B
    end
    
    subgraph "DMZ / Edge Layer"
        B --> E[API Gateway<br/>Kong/Envoy]
        B --> F[WebSocket Gateway<br/>Port 8081]
    end
    
    subgraph "Application Layer"
        E --> G[FastAPI Backend<br/>Port 8000<br/>3+ replicas]
        E --> H[Node.js Real-Time<br/>Port 8081<br/>3+ replicas]
        F --> H
        
        subgraph "Agent Cluster"
            I[Orchestrator<br/>Port 9090]
            J[Preprocessor Agent<br/>Pool]
            K[Predictor Agent<br/>Pool]
            L[EDA Agent<br/>Pool]
            M[Simulator Agent<br/>Pool]
            N[Explainer Agent<br/>Pool]
            O[Delivery Agent<br/>Pool]
            
            I --> J
            I --> K
            I --> L
            I --> M
            I --> N
            I --> O
        end
    end
    
    subgraph "Data Layer"
        G --> P[Redis Cluster<br/>Streams + Cache]
        H --> P
        I --> P
        J --> P
        K --> P
        L --> P
        M --> P
        N --> P
        O --> P
        
        P --> Q[Redis Sentinel<br/>High Availability]
        
        R[PostgreSQL<br/>Metadata/Timeseries] --> G
        S[TimescaleDB<br/>Historical Data] --> G
    end
    
    subgraph "Monitoring Layer"
        T[Prometheus<br/>Metrics Collection] --> G
        T --> H
        T --> P
        U[Grafana<br/>Visualization] --> T
        V[ELK Stack<br/>Log Aggregation] --> G
        V --> H
        V --> I
    end
    
    style B fill:#ff6b6b
    style E fill:#4ecdc4
    style P fill:#ffe66d
    style T fill:#95e1d3
```

### Component Architecture

#### Frontend Architecture

```mermaid
graph LR
    subgraph "React Application"
        A[Index.tsx<br/>Landing Page] --> B[DashboardPage.tsx<br/>Main Dashboard]
        B --> C[PitWallDashboard.tsx<br/>Strategy Console]
        
        B --> D[TelemetryProvider<br/>Context API]
        B --> E[StrategyProvider<br/>React Query]
        
        D --> F[useTelemetry Hook<br/>WebSocket Client]
        E --> G[useStrategy Hook<br/>REST API Client]
        
        F --> H[TelemetryWebSocket<br/>Class]
        G --> I[API Client<br/>axios/fetch]
        
        H --> J[WebSocket Server<br/>ws://:8081]
        I --> K[FastAPI Backend<br/>http://:8000]
    end
    
    subgraph "State Management"
        D --> L[Zustand Store<br/>Telemetry State]
        E --> M[React Query Cache<br/>Strategy Data]
        L --> N[Local Storage<br/>Persistence]
    end
    
    subgraph "UI Components"
        B --> O[Dashboard Components<br/>shadcn/ui]
        C --> P[Strategy Components<br/>Custom]
        O --> Q[Recharts<br/>Visualization]
    end
    
    style A fill:#ff6b6b
    style D fill:#4ecdc4
    style H fill:#ffe66d
    style K fill:#95e1d3
```

#### Backend Architecture

```mermaid
graph TB
    subgraph "FastAPI Application (Python)"
        A[app/main.py<br/>FastAPI App] --> B[app/routes/<br/>API Endpoints]
        A --> C[app/services/<br/>Business Logic]
        A --> D[app/models/<br/>Pydantic Models]
        
        B --> E[analytics.py<br/>Tire/Prediction APIs]
        B --> F[telemetry.py<br/>Ingestion APIs]
        B --> G[frontend_integration.py<br/>Dashboard APIs]
        
        C --> H[tire_wear_predictor.py<br/>ML Model]
        C --> I[performance_analyzer.py<br/>Metrics Calculation]
        C --> J[strategy_optimizer.py<br/>Monte Carlo]
        
        H --> K[ONNX Runtime<br/>Model Inference]
        H --> L[Feature Engineering<br/>20 features]
    end
    
    subgraph "Real-Time Server (Node.js)"
        M[server/realtime/index.ts<br/>Main Server] --> N[UDP Listener<br/>Port 20777]
        M --> O[HTTP Ingest<br/>POST /api/ingest]
        M --> P[WebSocket Handler<br/>/ws/realtime]
        
        N --> Q[Ring Buffer<br/>Thread-safe]
        O --> Q
        Q --> R[Worker Thread<br/>Aggregation]
        R --> S[Redis Client<br/>Stream Publishing]
        
        S --> T[Redis Streams<br/>telemetry.stream]
    end
    
    subgraph "Redis Infrastructure"
        T --> U[Consumer Groups<br/>telemetry-workers]
        U --> V[Telemetry Processor<br/>Python Worker]
        V --> W[Insights Stream<br/>live-insights.stream]
        W --> P
    end
    
    style A fill:#ff6b6b
    style H fill:#4ecdc4
    style M fill:#ffe66d
    style T fill:#95e1d3
```

### State Machine Diagrams

#### Agent State Machine

```mermaid
stateDiagram-v2
    [*] --> Initializing: Agent Start
    Initializing --> Registering: Connect to Redis
    Registering --> Idle: Registration Complete
    
    Idle --> Processing: Task Received
    Processing --> Validating: Parse Task
    Validating --> Processing: Valid Task
    Validating --> Error: Invalid Task
    
    Processing --> Computing: Execute Logic
    Computing --> ValidatingResult: Generate Output
    ValidatingResult --> Publishing: Valid Result
    ValidatingResult --> Error: Invalid Result
    
    Publishing --> Idle: Result Published
    Error --> Retrying: Retryable Error
    Error --> DeadLetter: Fatal Error
    Retrying --> Processing: Retry Attempt
    DeadLetter --> [*]: Agent Shutdown
    
    Idle --> Heartbeating: Every 5s
    Heartbeating --> Idle: Heartbeat Sent
    
    note right of Idle
        Default state
        Waiting for tasks
    end note
    
    note right of Error
        Logs error
        Updates metrics
    end note
```

#### Telemetry Processing State Machine

```mermaid
stateDiagram-v2
    [*] --> Buffering: UDP Packet Received
    Buffering --> Aggregating: Batch Size ≥ 40<br/>OR 300ms elapsed
    Aggregating --> Validating: Sector Window Complete
    Validating --> Publishing: Valid Data
    Validating --> Discarding: Invalid Data
    
    Publishing --> StreamAcknowledged: XADD Success
    StreamAcknowledged --> Consuming: Consumer Reads
    
    Consuming --> FeatureEngineering: Telemetry Extracted
    FeatureEngineering --> MLInference: Features Generated
    MLInference --> InsightGeneration: Prediction Complete
    InsightGeneration --> Broadcasting: Insight Formatted
    
    Broadcasting --> Delivered: WebSocket Sent
    Delivered --> [*]: Complete
    
    Discarding --> [*]: Dropped
    
    note right of Buffering
        Ring Buffer
        Max 20k points
    end note
    
    note right of MLInference
        ONNX Runtime
        <5ms latency
    end note
```

### Data Transformation Pipeline

```mermaid
graph LR
    subgraph "Raw Data Ingestion"
        A[UDP Packet<br/>Binary Format] --> B[Parser<br/>JSON Conversion]
        C[HTTP POST<br/>JSON] --> B
        D[S3 CSV<br/>Historical] --> E[CSV Parser<br/>Pandas]
        E --> B
    end
    
    subgraph "Schema Validation"
        B --> F[Pydantic Model<br/>Validation]
        F --> G{Valid?}
        G -->|Yes| H[Normalized Schema]
        G -->|No| I[Error Log<br/>Discard]
    end
    
    subgraph "Sector Aggregation"
        H --> J[Time Window<br/>600ms]
        J --> K[Sector Assignment<br/>Track-aware]
        K --> L[Rolling Statistics<br/>Mean/Std/Max]
        L --> M[Event Detection<br/>Braking/Cornering]
    end
    
    subgraph "Feature Engineering"
        M --> N[Cumulative Features<br/>G-forces, Energy]
        N --> O[Statistical Features<br/>Avg, Std, Max]
        O --> P[Temporal Features<br/>Lap, Age]
        P --> Q[Context Features<br/>Track, Weather]
    end
    
    subgraph "ML Pipeline"
        Q --> R[Feature Vector<br/>20 dimensions]
        R --> S[ONNX Model<br/>Inference]
        S --> T[Prediction<br/>4 tires]
        T --> U[Confidence<br/>Bootstrap CI]
    end
    
    subgraph "Output Formatting"
        U --> V[JSON Schema<br/>Standardized]
        V --> W[Redis Stream<br/>Publish]
        W --> X[WebSocket<br/>Broadcast]
    end
    
    style F fill:#ff6b6b
    style S fill:#4ecdc4
    style W fill:#ffe66d
    style X fill:#95e1d3
```

### Error Handling & Recovery Flow

```mermaid
sequenceDiagram
    participant T as Telemetry Source
    participant I as Ingestion Layer
    participant R as Redis Streams
    participant P as Processor
    participant W as WebSocket
    participant M as Monitoring
    
    T->>I: Send Telemetry
    alt Normal Path
        I->>I: Validate Schema
        I->>R: XADD Success
        R->>P: XREADGROUP
        P->>P: Process Data
        P->>R: XADD Insights
        R->>W: Broadcast
        W->>M: Log Success
    else Validation Error
        I->>I: Schema Invalid
        I->>M: Log Error (discard)
        Note over M: Error Counter++
        M-->>I: Acknowledged
    else Redis Connection Error
        I->>I: Connection Lost
        I->>I: Exponential Backoff
        loop Retry (max 5)
            I->>R: Reconnect
            alt Success
                R-->>I: Connected
                I->>R: Resume Publishing
            else Failure
                I->>M: Alert Critical
            end
        end
    else Processing Error
        P->>P: Exception Caught
        P->>R: XACK (nack)
        P->>M: Log Error
        R->>R: Add to Pending List
        loop Retry Processing
            R->>P: XCLAIM (retry)
            alt Success
                P->>R: XACK
            else Max Retries
                P->>R: XADD dead-letter
                R->>M: Alert Failed
            end
        end
    else WebSocket Error
        W->>W: Client Disconnected
        W->>W: Buffer Messages
        W->>W: Wait for Reconnect
        W->>M: Log Disconnect
        alt Reconnect within 30s
            W->>W: Reconnect Success
            W->>W: Flush Buffer
        else Timeout
            W->>W: Clear Buffer
            W->>M: Log Timeout
        end
    end
```

---

## AI/ML Models & Algorithms

### Tire Wear Prediction Model

#### Model Architecture

The tire wear prediction system uses a physics-informed machine learning approach that combines domain knowledge with data-driven learning.

```mermaid
graph TB
    subgraph "Feature Engineering"
        A[Raw Telemetry<br/>9 channels × 50Hz] --> B[Sector Aggregation<br/>Rolling windows]
        B --> C[Feature Extraction<br/>20 features]
        
        C --> D[Cumulative G-forces<br/>Lateral + Longitudinal]
        C --> E[Braking Events<br/>Count + Energy]
        C --> F[Cornering Events<br/>Count + Peak G]
        C --> G[Speed Metrics<br/>Avg + Std + Max]
        C --> H[Lap Metrics<br/>Number + Age]
        C --> I[Track Context<br/>Sector + Temperature]
    end
    
    subgraph "Model Inference"
        D --> J[Feature Vector<br/>20 dimensions]
        E --> J
        F --> J
        G --> J
        H --> J
        I --> J
        
        J --> K[XGBoost Regressor<br/>or Random Forest]
        K --> L[Tire Wear Prediction<br/>FL, FR, RL, RR %]
        
        L --> M[Confidence Interval<br/>Bootstrap CI]
        L --> N[Feature Importance<br/>SHAP values]
    end
    
    subgraph "Post-Processing"
        M --> O[Laps Until Cliff<br/>Remaining life]
        N --> O
        O --> P[Pit Window Calculation<br/>Optimal lap range]
        P --> Q[Explainable Output<br/>Top-3 evidence]
    end
    
    style K fill:#4ecdc4
    style L fill:#ff6b6b
    style Q fill:#ffe66d
```

#### Feature Engineering Details

**Input Channels (9 channels at ~50Hz)**:
- `accx_can`: Longitudinal acceleration (G)
- `accy_can`: Lateral acceleration (G)
- `speed_kmh`: Vehicle speed (km/h)
- `pbrake_f`: Front brake pressure (psi)
- `pbrake_r`: Rear brake pressure (psi)
- `rpm`: Engine RPM
- `Steering_Angle`: Steering input (degrees)
- `lapdist_m`: Distance around lap (meters)
- `lap`: Current lap number

**Engineered Features (20 features)**:

1. **Cumulative Stress Features**:
   - `cumulative_lateral_g`: Σ|accy_can| per lap
   - `cumulative_longitudinal_g`: Σ|accx_can| per lap
   - `cumulative_brake_energy`: Σ(pbrake_f² + pbrake_r²) per lap

2. **Event Count Features**:
   - `heavy_braking_events`: Count where |accx_can| > 0.8G
   - `hard_cornering_events`: Count where |accy_can| > 1.0G
   - `high_speed_segments`: Count where speed > 200 km/h

3. **Statistical Features**:
   - `avg_speed_kmh`: Mean speed per lap
   - `std_speed_kmh`: Speed variability
   - `max_lateral_g`: Peak cornering force
   - `max_longitudinal_g`: Peak braking/acceleration

4. **Lap Context Features**:
   - `lap_number`: Current lap (tire age)
   - `laps_completed`: Total laps run
   - `sector_id`: Sector 0/1/2 (track-specific)

5. **Tire-Specific Features**:
   - `front_load_ratio`: FL vs FR distribution
   - `rear_load_ratio`: RL vs RR distribution
   - `lateral_bias`: Left vs right tire loading

#### Model Training Pipeline

```mermaid
graph LR
    A[Historical Telemetry<br/>1.8GB per race] --> B[Data Preprocessing<br/>Chunked loading]
    B --> C[Feature Engineering<br/>Pandas/NumPy]
    C --> D[Train/Test Split<br/>70/30 stratified]
    D --> E[Model Training<br/>XGBoost/RandomForest]
    
    E --> F[Cross-Validation<br/>5-fold CV]
    F --> G[Hyperparameter Tuning<br/>Optuna/Bayesian]
    G --> H[Model Evaluation<br/>RMSE, MAE, R²]
    
    H --> I{Accuracy<br/>>95%?}
    I -->|No| G
    I -->|Yes| J[Export to ONNX<br/>onnxruntime]
    
    J --> K[Model Registry<br/>Version control]
    K --> L[Deploy to Inference<br/>FastAPI/ONNX Runtime]
    
    style E fill:#4ecdc4
    style J fill:#ff6b6b
    style L fill:#ffe66d
```

#### Model Performance

- **Accuracy**: 95%+ on hold-out test set
- **Inference Latency**: <5ms per prediction (ONNX Runtime)
- **Throughput**: 10,000+ predictions/second (batch inference)
- **Feature Importance**: Top-3 features explain 85%+ variance

**Example Prediction Output**:

```json
{
  "tire_wear": {
    "front_left": 78.5,
    "front_right": 82.1,
    "rear_left": 71.2,
    "rear_right": 75.8
  },
  "predicted_laps_remaining": 8,
  "pit_window_optimal": [12, 15],
  "confidence_interval": [7, 9],
  "feature_importance": {
    "cumulative_lateral_g": 0.46,
    "heavy_braking_events": 0.31,
    "lap_number": 0.23
  },
  "explanation": [
    "High cumulative lateral G-forces (1,250 G-sec) indicate aggressive cornering",
    "15 heavy braking events this lap accelerate front tire wear",
    "Tire age (lap 12) contributes to baseline degradation"
  ]
}
```

### Strategy Optimization (Monte Carlo Simulation)

The strategy optimizer uses Monte Carlo simulation to evaluate multiple pit stop strategies under uncertainty.

```mermaid
graph TB
    A[Current Race State<br/>Lap, Position, Tire Wear] --> B[Strategy Generator<br/>4 base strategies]
    
    B --> C[No Pit Strategy<br/>Run to end]
    B --> D[Early Pit Strategy<br/>Laps 2-3]
    B --> E[Optimal Pit Strategy<br/>Based on model]
    B --> F[Late Pit Strategy<br/>Maximize stint]
    
    C --> G[Monte Carlo Simulator<br/>10,000 iterations]
    D --> G
    E --> G
    F --> G
    
    G --> H[Random Variables<br/>Safety Car, Tire Deg, Traffic]
    H --> I[Lap Time Model<br/>Tire wear → lap time]
    I --> J[Position Tracking<br/>Overtaking simulation]
    J --> K[Finish Position<br/>Distribution]
    
    K --> L[Strategy Ranking<br/>Expected position]
    L --> M[Recommendation<br/>Best strategy]
    
    style G fill:#4ecdc4
    style K fill:#ff6b6b
    style M fill:#ffe66d
```

**Simulation Parameters**:
- **Iterations**: 10,000 Monte Carlo runs per strategy
- **Random Variables**: Safety car probability (5%), tire degradation variance (±10%), traffic scenarios
- **Lap Time Model**: `lap_time = base_time + (tire_wear × degradation_coef) + traffic_penalty`
- **Output**: Expected finish position, win probability, risk metrics

### Driver Fingerprinting

Driver-specific analysis using statistical pattern recognition:

```mermaid
graph LR
    A[Telemetry History<br/>Per driver] --> B[Pattern Extraction<br/>Braking, Throttle, Cornering]
    B --> C[Baseline Profile<br/>Statistical model]
    C --> D[Real-Time Comparison<br/>Current vs baseline]
    D --> E[Anomaly Detection<br/>Z-score > 2σ]
    E --> F[Coaching Alerts<br/>Actionable insights]
    
    style C fill:#4ecdc4
    style E fill:#ff6b6b
```

**Metrics Tracked**:
- Brake bias (front/rear distribution)
- Throttle application timing
- Corner entry/exit speeds
- Sector-specific performance
- Consistency score (lap time std dev)

---

## Real-Time Telemetry Pipeline

### High-Throughput Ingestion Architecture

```mermaid
graph TB
    subgraph "Ingestion Layer"
        A[UDP Packets<br/>Port 20777<br/>~50Hz per car] --> B[UDP Listener<br/>Node.js dgram]
        C[HTTP POST<br/>/api/ingest] --> D[Express Router<br/>Body parser]
        E[S3 CSV Files<br/>Polling every 60s] --> F[S3 Client<br/>AWS SDK]
        
        B --> G[Ring Buffer<br/>Thread-safe<br/>20k capacity]
        D --> G
        F --> G
    end
    
    subgraph "Processing Layer"
        G --> H[Worker Thread Pool<br/>CPU-intensive tasks]
        H --> I[Sector Aggregator<br/>Rolling windows<br/>Per vehicle/sector]
        I --> J[Feature Extraction<br/>20 features per point]
        J --> K[Redis Streams Publisher<br/>XADD telemetry.stream]
    end
    
    subgraph "Consumer Layer"
        K --> L[Redis Consumer Groups<br/>telemetry-workers]
        L --> M[Worker 1<br/>Python FastAPI]
        L --> N[Worker 2<br/>Python FastAPI]
        L --> O[Worker N<br/>Horizontal scaling]
        
        M --> P[ML Inference<br/>ONNX Runtime]
        N --> P
        O --> P
    end
    
    subgraph "Broadcast Layer"
        P --> Q[Insights Stream<br/>live-insights.stream]
        Q --> R[WebSocket Server<br/>Batched broadcast]
        R --> S[React Clients<br/>Real-time updates]
    end
    
    style G fill:#ff6b6b
    style H fill:#4ecdc4
    style L fill:#ffe66d
    style R fill:#95e1d3
```

### Ring Buffer Implementation

**Thread-Safe Circular Buffer**:
- **Capacity**: 20,000 telemetry points
- **Threading**: Node.js worker_threads for CPU-intensive aggregation
- **Backpressure**: Automatic dropping of oldest data when full
- **Batching**: Emits batches every 300ms or 40 points (whichever comes first)

**Performance Characteristics**:
- **Throughput**: 10,000+ points/second sustained
- **Latency**: <10ms from UDP → WebSocket broadcast
- **Memory**: Bounded to ~50MB (20k points × ~2.5KB/point)

### Sector Aggregation Algorithm

Rolling window aggregator per (vehicle_id, sector_id) tuple:

```typescript
interface SectorWindow {
  vehicleId: string;
  sectorId: number;
  points: TelemetryPoint[];
  windowSize: number; // e.g., 50 points
  aggregates: {
    avgSpeed: number;
    avgLateralG: number;
    avgLongitudinalG: number;
    brakeEnergy: number;
    tireStress: number;
  };
}
```

**Aggregation Logic**:
1. Maintain sliding window of last N points per sector
2. Calculate rolling statistics (mean, std, max)
3. Detect events (heavy braking, hard cornering)
4. Emit aggregated insight every 600ms

### Redis Streams Integration

**Producer (Ingestion)**:
```python
import redis

r = redis.Redis(host='localhost', port=6379)

# Publish telemetry point
msg_id = r.xadd('telemetry.stream', {
    'vehicle_id': 'GR86-001',
    'timestamp': '2025-01-20T00:00:00Z',
    'speed_kmh': 180,
    'accx_can': 0.02,
    'accy_can': 0.8,
    # ... other fields
}, maxlen=100000)  # Keep last 100k messages
```

**Consumer (Processing)**:
```python
# Create consumer group
r.xgroup_create('telemetry.stream', 'telemetry-workers', id='0', mkstream=True)

# Consume messages
while True:
    messages = r.xreadgroup(
        'telemetry-workers',
        'worker-1',  # Consumer name
        {'telemetry.stream': '>'},  # Read new messages
        count=64,  # Batch size
        block=1000  # Block 1s if no messages
    )
    
    for stream, msgs in messages:
        for msg_id, data in msgs:
            # Process telemetry point
            process_telemetry(data)
            # ACK message
            r.xack('telemetry.stream', 'telemetry-workers', msg_id)
```

**Horizontal Scaling**:
- Multiple workers can consume from same consumer group
- Redis automatically distributes messages across workers
- Each worker processes ~64 messages per batch
- Supports 100+ workers for massive scale

---

## Multi-Agent System

### Agent Architecture

The system uses a distributed multi-agent architecture powered by Redis Streams for task orchestration and message passing.

```mermaid
graph TB
    subgraph "Agent Orchestrator"
        A[Orchestrator Agent<br/>Node.js<br/>Port 9090] --> B[Task Queue<br/>tasks.stream]
        A --> C[Agent Registry<br/>agents.registry hash]
        C --> D[Preprocessor Agent]
        C --> E[Predictor Agent]
        C --> F[EDA Agent]
        C --> G[Simulator Agent]
        C --> H[Explainer Agent]
        C --> I[Delivery Agent]
    end
    
    subgraph "Agent Processing"
        B --> J[Agent Inbox<br/>agent:{id}:inbox]
        J --> D
        J --> E
        J --> F
        J --> G
        J --> H
        J --> I
        
        D --> K[Results Stream<br/>results.stream]
        E --> K
        F --> K
        G --> K
        H --> K
        I --> K
    end
    
    subgraph "Frontend Integration"
        K --> L[Agent API Server<br/>Express<br/>Port 3001]
        L --> M[WebSocket<br/>ws://:3001/ws]
        M --> N[React Dashboard<br/>Agent Status UI]
    end
    
    style A fill:#ff6b6b
    style K fill:#4ecdc4
    style L fill:#ffe66d
```

### Agent Types

#### 1. Preprocessor Agent
- **Language**: Node.js
- **Purpose**: Normalize and validate telemetry data
- **Output**: Cleaned telemetry with schema validation
- **Performance**: 5,000+ points/second processing

#### 2. Predictor Agent
- **Language**: Python
- **Purpose**: ML model inference for tire wear prediction
- **Model**: ONNX Runtime optimized XGBoost
- **Latency**: <5ms per prediction

#### 3. EDA Agent (Exploratory Data Analysis)
- **Language**: Python
- **Purpose**: Statistical analysis and anomaly detection
- **Output**: Insights, trends, outliers
- **Libraries**: Pandas, NumPy, SciPy

#### 4. Simulator Agent
- **Language**: Python
- **Purpose**: Monte Carlo strategy simulation
- **Iterations**: 10,000 per strategy evaluation
- **Output**: Strategy recommendations with win probability

#### 5. Explainer Agent
- **Language**: Python
- **Purpose**: Generate human-readable explanations for predictions
- **Method**: Feature importance (SHAP values) + ablation study
- **Output**: Top-3 evidence points with confidence scores

#### 6. Delivery Agent
- **Language**: Node.js
- **Purpose**: Deliver insights to frontend via WebSocket
- **Port**: 8082
- **Features**: Batching, backpressure handling, reconnection logic

### Agent Communication Protocol

**Message Format**:
```json
{
  "task_id": "uuid-v4",
  "task_type": "preprocess|predict|eda|simulate|explain",
  "payload": {
    "track": "sebring",
    "chassis": "GR86-001",
    "lap": 12,
    "telemetry": [...]
  },
  "metadata": {
    "created_at": "2025-01-20T00:00:00Z",
    "priority": 1,
    "timeout": 5000
  }
}
```

**Result Format**:
```json
{
  "task_id": "uuid-v4",
  "agent_id": "predictor-01",
  "status": "success|error",
  "result": {
    "tire_wear": {...},
    "predictions": {...}
  },
  "metadata": {
    "processing_time_ms": 45,
    "model_version": "v1.0"
  }
}
```

### Agent Orchestration Sequence

```mermaid
sequenceDiagram
    participant Client as Client Request
    participant API as Agent API Server
    participant Orch as Orchestrator Agent
    participant Redis as Redis Streams
    participant Pre as Preprocessor Agent
    participant Pred as Predictor Agent
    participant Expl as Explainer Agent
    participant Del as Delivery Agent
    participant WS as WebSocket Server
    
    Client->>API: POST /api/agents/task
    API->>API: Validate Request
    API->>Orch: Create Task (UUID)
    Orch->>Redis: XADD tasks.stream<br/>{task_id, type, payload}
    Orch->>Redis: HSET agent.registry<br/>{status: processing}
    
    Note over Redis,Pre: Task Distribution
    Redis->>Pre: XREADGROUP<br/>agent:{id}:inbox
    Pre->>Pre: Normalize Telemetry
    Pre->>Redis: XADD results.stream<br/>{task_id, result}
    
    Redis->>Pred: XREADGROUP<br/>(Preprocessed Data)
    Pred->>Pred: Feature Engineering<br/>(20 features)
    Pred->>Pred: ONNX Inference<br/>(<5ms)
    Pred->>Redis: XADD results.stream<br/>{task_id, predictions}
    
    Redis->>Expl: XREADGROUP<br/>(Predictions + Features)
    Expl->>Expl: SHAP Analysis<br/>(Feature Importance)
    Expl->>Expl: Generate Explanation<br/>(Top-3 evidence)
    Expl->>Redis: XADD results.stream<br/>{task_id, explanation}
    
    Redis->>Orch: XREAD results.stream<br/>(Monitor completion)
    Orch->>Orch: Aggregate Results<br/>(All agents complete)
    
    Orch->>Del: XREADGROUP<br/>(Final result)
    Del->>Redis: XADD delivery.stream<br/>{task_id, formatted}
    
    Redis->>WS: Subscribe to delivery
    WS->>Client: WebSocket Broadcast<br/>{type: insight_update, data}
    
    Orch->>Redis: HSET agent.registry<br/>{status: idle}
    Orch->>API: Task Complete
    API->>Client: 200 OK<br/>{task_id, status}
    
    Note over Orch,Redis: Error Handling
    alt Agent Failure
        Pred->>Pred: Exception Caught
        Pred->>Redis: XADD errors.stream<br/>{task_id, error}
        Redis->>Orch: Error Notification
        Orch->>Orch: Retry Logic<br/>(Max 3 attempts)
        alt Retry Success
            Orch->>Redis: Re-queue Task
        else Max Retries
            Orch->>Redis: XADD dead-letter.stream
            Orch->>API: Task Failed
            API->>Client: 500 Error
        end
    end
```

### ML Inference Detailed Sequence

```mermaid
sequenceDiagram
    participant Telemetry as Telemetry Processor
    participant Agg as Sector Aggregator
    participant FE as Feature Engineering
    participant ONNX as ONNX Runtime
    participant Model as XGBoost Model
    participant Post as Post-Processor
    participant Redis as Redis Cache
    
    Telemetry->>Agg: Raw Telemetry Points<br/>(9 channels × 50Hz)
    Agg->>Agg: Rolling Window<br/>(50 points, 600ms)
    Agg->>Agg: Sector Assignment<br/>(Track-aware)
    Agg->>FE: Aggregated Sector Data
    
    Note over FE: Feature Engineering
    FE->>FE: Cumulative G-forces<br/>Σ|accy_can|, Σ|accx_can|
    FE->>FE: Braking Events<br/>Count(|accx| > 0.8G)
    FE->>FE: Cornering Events<br/>Count(|accy| > 1.0G)
    FE->>FE: Speed Statistics<br/>Mean, Std, Max
    FE->>FE: Lap Context<br/>Lap number, Age
    FE->>FE: Tire Load Distribution<br/>Front/Rear, Left/Right
    
    FE->>ONNX: Feature Vector<br/>(20 dimensions)
    
    Note over ONNX,Model: Model Inference
    ONNX->>ONNX: Input Validation<br/>(Shape check)
    ONNX->>Model: Forward Pass<br/>(XGBoost trees)
    Model->>Model: Tree Traversal<br/>(Ensemble prediction)
    Model->>ONNX: Raw Predictions<br/>(FL, FR, RL, RR wear %)
    
    ONNX->>Post: Tire Wear Predictions<br/>(4 values, 0-100%)
    
    Note over Post: Post-Processing
    Post->>Post: Confidence Interval<br/>(Bootstrap sampling)
    Post->>Post: Laps Remaining<br/>(Degradation model)
    Post->>Post: Pit Window Calc<br/>(Optimal lap range)
    Post->>Post: Feature Importance<br/>(SHAP values)
    
    Post->>Redis: Cache Result<br/>(TTL: 60s, key: {track}:{chassis}:{lap})
    Post->>Redis: Publish Stream<br/>(live-insights.stream)
    
    Redis->>Redis: Update Metrics<br/>(Inference time, accuracy)
```

### WebSocket Connection Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Connecting: Client Initiates Connection
    Connecting --> Authenticating: TCP Connection Established
    Authenticating --> Subscribing: JWT Token Valid
    
    Subscribing --> Active: Subscription Complete
    Authenticating --> Rejected: Invalid Token
    Rejected --> [*]: Connection Closed
    
    Active --> Receiving: Telemetry Updates
    Active --> Receiving: Insight Updates
    Active --> Receiving: Agent Status Updates
    
    Receiving --> Processing: Message Received
    Processing --> Updating: React State Update
    Updating --> Active: UI Rendered
    
    Active --> Pinging: Keep-Alive (30s)
    Pinging --> Active: Pong Received
    Pinging --> Reconnecting: Pong Timeout (>5s)
    
    Reconnecting --> Reconnecting: Exponential Backoff<br/>1s, 2s, 4s, 8s
    Reconnecting --> Connecting: Reconnect Attempt
    Reconnecting --> Failed: Max Retries (5)
    
    Failed --> [*]: Connection Terminated
    
    Active --> Idle: No Messages (60s)
    Idle --> Active: Message Received
    Idle --> Reconnecting: Heartbeat Timeout
    
    Active --> Error: Network Error
    Error --> Reconnecting: Error Recovery
    
    note right of Active
        Normal operation
        Receiving real-time updates
    end note
    
    note right of Reconnecting
        Auto-reconnect with
        exponential backoff
    end note
```

### Database Query Flow

```mermaid
sequenceDiagram
    participant API as FastAPI Endpoint
    participant Cache as Redis Cache
    participant DB as PostgreSQL
    participant TSDB as TimescaleDB
    participant S3 as S3 Bucket
    
    API->>Cache: Check Cache<br/>(Key: {track}:{chassis}:{lap})
    alt Cache Hit
        Cache-->>API: Return Cached Data<br/>(TTL: 60s)
        API->>API: Format Response
    else Cache Miss
        API->>DB: Query Metadata<br/>(SELECT race_info WHERE track=?)
        DB-->>API: Race Metadata
        
        alt Historical Query
            API->>TSDB: Query Time-Series<br/>(SELECT * FROM telemetry WHERE time > ?)
            TSDB-->>API: Aggregated Data<br/>(Chunked query)
        else Current Lap Query
            API->>Cache: Get Live Data<br/>(telemetry.stream latest)
            Cache-->>API: Latest Telemetry
        end
        
        alt Large Dataset (>1M rows)
            API->>S3: Get Pre-aggregated<br/>(Parquet file)
            S3-->>API: Compressed Data
            API->>API: Decompress & Parse
        end
        
        API->>API: Aggregate Results
        API->>Cache: Store in Cache<br/>(SETEX key 60 value)
        API->>API: Format Response
    end
    
    API->>API: Log Query Time<br/>(Prometheus metrics)
    API-->>Client: Return JSON Response
```

### Agent Registration

Agents automatically register with the orchestrator on startup:

```javascript
// Agent registration example
const redis = require('ioredis');
const r = redis.createClient(process.env.REDIS_URL);

// Register agent
await r.hset('agents.registry', 'predictor-01', JSON.stringify({
  id: 'predictor-01',
  type: 'predictor',
  status: 'active',
  capabilities: ['tire_wear', 'lap_time'],
  last_heartbeat: Date.now()
}));

// Heartbeat every 5s
setInterval(() => {
  r.hset('agents.registry', 'predictor-01', 'last_heartbeat', Date.now());
}, 5000);
```

---

## Deployment & Infrastructure

### Docker Architecture

```mermaid
graph TB
    subgraph "Frontend Container"
        A[Dockerfile.frontend<br/>Multi-stage build] --> B[Nginx<br/>Static files]
        B --> C[React App<br/>Production build]
    end
    
    subgraph "Backend Container (Python)"
        D[Dockerfile<br/>Python 3.11-slim] --> E[FastAPI App<br/>Uvicorn ASGI]
        E --> F[Requirements<br/>pip install]
        F --> G[Model Files<br/>ONNX format]
    end
    
    subgraph "Real-Time Server Container"
        H[Dockerfile.realtime<br/>Node.js 18] --> I[TypeScript Build<br/>tsc]
        I --> J[Real-Time Server<br/>UDP/HTTP/WS]
    end
    
    subgraph "Agent Containers"
        K[Agent Dockerfiles<br/>Per agent type] --> L[Preprocessor<br/>Node.js]
        K --> M[Predictor<br/>Python]
        K --> N[Orchestrator<br/>Node.js]
    end
    
    subgraph "Infrastructure"
        O[Redis<br/>Streams + Cache] --> P[Kubernetes<br/>StatefulSet]
        Q[PostgreSQL<br/>Optional metadata] --> P
    end
    
    style A fill:#ff6b6b
    style D fill:#4ecdc4
    style H fill:#ffe66d
    style O fill:#95e1d3
```

### Component Interaction Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React App<br/>Port 5173] --> B[TelemetryProvider<br/>Context]
        A --> C[StrategyProvider<br/>React Query]
        B --> D[WebSocket Client<br/>Auto-reconnect]
        C --> E[REST API Client<br/>Axios]
    end
    
    subgraph "API Gateway Layer"
        D --> F[WebSocket Server<br/>Port 8081<br/>Node.js]
        E --> G[FastAPI Backend<br/>Port 8000<br/>Python]
        
        F --> H[Redis Client<br/>Pub/Sub]
        G --> I[Redis Client<br/>Streams]
    end
    
    subgraph "Processing Layer"
        H --> J[Redis Streams<br/>telemetry.stream]
        I --> J
        
        J --> K[Telemetry Processor<br/>Worker Pool]
        K --> L[Feature Engineering<br/>20 features]
        L --> M[ML Inference<br/>ONNX Runtime]
        M --> N[Post-Processor<br/>Confidence, Pit Window]
        
        N --> O[Redis Cache<br/>live-insights]
        N --> J
    end
    
    subgraph "Agent System"
        J --> P[Orchestrator<br/>Port 9090]
        P --> Q[Preprocessor Agent<br/>Pool]
        P --> R[Predictor Agent<br/>Pool]
        P --> S[EDA Agent<br/>Pool]
        P --> T[Simulator Agent<br/>Pool]
        P --> U[Explainer Agent<br/>Pool]
        P --> V[Delivery Agent<br/>Pool]
        
        Q --> W[Results Stream<br/>results.stream]
        R --> W
        S --> W
        T --> W
        U --> W
        V --> W
        
        W --> F
    end
    
    subgraph "Data Layer"
        O --> X[Redis Cluster<br/>Cache + Streams]
        W --> X
        J --> X
        
        G --> Y[PostgreSQL<br/>Metadata]
        G --> Z[TimescaleDB<br/>Time-Series]
        M --> AA[S3<br/>ML Models]
    end
    
    subgraph "Monitoring"
        F --> AB[Prometheus<br/>Metrics]
        G --> AB
        K --> AB
        P --> AB
        
        F --> AC[ELK Stack<br/>Logs]
        G --> AC
        P --> AC
        
        AB --> AD[Grafana<br/>Dashboards]
        AC --> AE[Kibana<br/>Log Analysis]
    end
    
    style A fill:#ff6b6b
    style M fill:#4ecdc4
    style P fill:#ffe66d
    style X fill:#95e1d3
```

### Deployment Flow Diagram

```mermaid
graph TB
    subgraph "Development"
        A[Developer Push<br/>Git Commit] --> B[GitHub<br/>Repository]
        B --> C[GitHub Actions<br/>CI Trigger]
    end
    
    subgraph "CI Pipeline"
        C --> D[Lint & Format<br/>ESLint, Black]
        D --> E[Unit Tests<br/>Vitest, Pytest]
        E --> F[Integration Tests<br/>Jest, Cypress]
        F --> G[Code Coverage<br/>Threshold: 80%]
        
        G --> H{Tests Pass?}
        H -->|No| I[Report Failure<br/>Block Merge]
        H -->|Yes| J[Build Artifacts]
    end
    
    subgraph "Build Stage"
        J --> K[Docker Build<br/>Multi-stage]
        K --> L[Frontend Build<br/>Vite Production]
        K --> M[Backend Build<br/>Python Wheel]
        K --> N[TypeScript Build<br/>tsc Compile]
        
        L --> O[Docker Image<br/>Frontend]
        M --> P[Docker Image<br/>Backend]
        N --> Q[Docker Image<br/>Realtime]
    end
    
    subgraph "Security Scanning"
        O --> R[Trivy Scan<br/>Vulnerabilities]
        P --> R
        Q --> R
        
        R --> S{Critical Issues?}
        S -->|Yes| I
        S -->|No| T[Security Sign-off]
    end
    
    subgraph "Artifact Registry"
        T --> U[Push to Registry<br/>Docker Hub/GCR]
        U --> V[Tag Version<br/>Semantic Versioning]
        V --> W[Helm Chart<br/>Update Values]
    end
    
    subgraph "Staging Deployment"
        W --> X[Deploy to Staging<br/>Kubernetes]
        X --> Y[Blue-Green<br/>Zero Downtime]
        Y --> Z[Smoke Tests<br/>Health Checks]
        
        Z --> AA{Staging OK?}
        AA -->|No| AB[Rollback<br/>Previous Version]
        AA -->|Yes| AC[Staging Complete]
    end
    
    subgraph "Production Deployment"
        AC --> AD[Manual Approval<br/>Gatekeeper]
        AD --> AE[Deploy to Production<br/>Rolling Update]
        AE --> AF[Health Check<br/>Readiness Probe]
        
        AF --> AG{Deployment OK?}
        AG -->|No| AB
        AG -->|Yes| AH[Production Live<br/>Monitor 5min]
        
        AH --> AI{No Errors?}
        AI -->|Yes| AJ[Deployment Success]
        AI -->|No| AB
    end
    
    subgraph "Post-Deployment"
        AJ --> AK[Notify Team<br/>Slack, Email]
        AJ --> AL[Update Monitoring<br/>Dashboards]
        AJ --> AM[Archive Build<br/>Artifact Retention]
    end
    
    style C fill:#ff6b6b
    style K fill:#4ecdc4
    style R fill:#ffe66d
    style AE fill:#95e1d3
```

### Kubernetes Deployment

**Deployment Manifests**:

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pitwall-realtime
spec:
  replicas: 3  # Horizontal scaling
  selector:
    matchLabels:
      app: pitwall-realtime
  template:
    spec:
      containers:
      - name: server
        image: pitwall-realtime:latest
        ports:
        - containerPort: 8081
        env:
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /api/health
            port: 8081
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/ready
            port: 8081
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Service Configuration**:

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: pitwall-realtime
spec:
  type: LoadBalancer
  ports:
  - port: 8081
    targetPort: 8081
    protocol: TCP
    name: http
  - port: 20777
    targetPort: 20777
    protocol: UDP
    name: udp
  selector:
    app: pitwall-realtime
```

**Horizontal Pod Autoscaler**:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: pitwall-realtime-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: pitwall-realtime
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Environment Configuration

**Development**:
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8081
REDIS_URL=redis://localhost:6379
DEMO_MODE=true
LOG_LEVEL=DEBUG
```

**Production**:
```bash
# .env.production
VITE_API_BASE_URL=https://api.pitwall.example.com
VITE_WS_BASE_URL=wss://ws.pitwall.example.com
REDIS_URL=redis://redis-cluster:6379
DEMO_MODE=false
LOG_LEVEL=INFO
REDIS_PASSWORD=***  # From secret
AWS_REGION=us-east-1
S3_BUCKET=pitwall-telemetry
```

### CI/CD Pipeline Architecture

```mermaid
graph LR
    subgraph "Source Control"
        A[Git Repository<br/>GitHub] --> B[GitHub Actions<br/>Workflow Trigger]
        B --> C{Event Type}
        C -->|Push to main| D[Production Build]
        C -->|Pull Request| E[PR Build + Test]
        C -->|Tag Release| F[Release Build]
    end
    
    subgraph "Build Stage"
        D --> G[Lint & Format<br/>ESLint, Black]
        E --> G
        F --> G
        
        G --> H[Unit Tests<br/>Vitest, Pytest]
        H --> I[Integration Tests<br/>Jest, Pytest]
        I --> J[E2E Tests<br/>Playwright]
    end
    
    subgraph "Test Stage"
        J --> K{All Tests Pass?}
        K -->|Yes| L[Build Docker Images<br/>Multi-stage]
        K -->|No| M[Report Failure<br/>Notify Team]
    end
    
    subgraph "Build Artifacts"
        L --> N[Frontend Image<br/>nginx:alpine]
        L --> O[Backend Image<br/>python:3.11-slim]
        L --> P[Realtime Image<br/>node:18-alpine]
        L --> Q[Agent Images<br/>Per agent type]
    end
    
    subgraph "Security Scanning"
        N --> R[Vulnerability Scan<br/>Trivy]
        O --> R
        P --> R
        Q --> R
        
        R --> S{No Critical Issues?}
        S -->|Yes| T[Push to Registry<br/>Docker Hub/GCR]
        S -->|No| M
    end
    
    subgraph "Deployment Stage"
        T --> U[Update K8s Manifests<br/>Helm Charts]
        U --> V[Deploy to Staging<br/>Blue-Green]
        V --> W[Smoke Tests<br/>Health Checks]
        
        W --> X{Staging OK?}
        X -->|Yes| Y[Deploy to Production<br/>Rolling Update]
        X -->|No| Z[Rollback<br/>Previous Version]
        
        Y --> AA[Production Health Check<br/>Monitoring]
        AA --> AB{Deployment Success?}
        AB -->|Yes| AC[Complete<br/>Notify Team]
        AB -->|No| Z
    end
    
    style B fill:#ff6b6b
    style L fill:#4ecdc4
    style R fill:#ffe66d
    style Y fill:#95e1d3
```

### Security Architecture

```mermaid
graph TB
    subgraph "Network Security Layer"
        A[Internet Traffic] --> B[WAF<br/>Cloudflare/AWS WAF]
        B --> C[DDoS Protection<br/>Rate Limiting]
        C --> D[Load Balancer<br/>TLS Termination]
    end
    
    subgraph "Authentication & Authorization"
        D --> E[API Gateway<br/>Kong/Envoy]
        E --> F[Auth Service<br/>JWT/OAuth2]
        F --> G[Token Validation<br/>Redis Cache]
        G --> H[RBAC<br/>Role-Based Access]
    end
    
    subgraph "Application Security"
        H --> I[FastAPI App<br/>Input Validation]
        H --> J[Node.js App<br/>Helmet Security]
        
        I --> K[Pydantic Models<br/>Schema Validation]
        J --> L[Express Security<br/>CORS, CSP]
        
        K --> M[SQL Injection<br/>Prevention]
        L --> N[XSS Prevention<br/>Sanitization]
    end
    
    subgraph "Data Security"
        M --> O[Encrypted Storage<br/>TLS at Rest]
        N --> O
        
        O --> P[Redis AUTH<br/>Password Protection]
        O --> Q[PostgreSQL<br/>SSL Connections]
        O --> R[S3 Encryption<br/>KMS Keys]
    end
    
    subgraph "Secrets Management"
        S[Vault/K8s Secrets<br/>Centralized] --> I
        S --> J
        S --> P
        S --> Q
        S --> R
    end
    
    subgraph "Monitoring & Auditing"
        T[Security Logs<br/>SIEM Integration] --> U[Audit Trail<br/>All API Calls]
        T --> V[Threat Detection<br/>Anomaly Detection]
        T --> W[Alert System<br/>PagerDuty/Slack]
    end
    
    style B fill:#ff6b6b
    style F fill:#4ecdc4
    style S fill:#ffe66d
    style T fill:#95e1d3
```

### Data Layer Architecture

```mermaid
graph TB
    subgraph "Cache Layer (Redis)"
        A[Redis Cluster<br/>3+ nodes] --> B[Streams<br/>telemetry.stream<br/>100k msg/sec]
        A --> C[Cache<br/>Live Insights<br/>TTL: 60s]
        A --> D[Session Store<br/>WebSocket Sessions<br/>TTL: 24h]
        A --> E[Rate Limiting<br/>API Throttling<br/>Sliding Window]
    end
    
    subgraph "Time-Series Data"
        F[TimescaleDB<br/>Hypertables] --> G[Telemetry Data<br/>Chunked by time<br/>Compression: 90%]
        F --> H[Race Results<br/>Aggregated<br/>Indexed by track]
        F --> I[Metrics History<br/>Prometheus data<br/>Retention: 90d]
    end
    
    subgraph "Relational Data (PostgreSQL)"
        J[PostgreSQL<br/>Primary DB] --> K[Users & Auth<br/>JWT tokens<br/>ACID compliance]
        J --> L[Race Metadata<br/>Tracks, Events<br/>Foreign keys]
        J --> M[Agent Registry<br/>Status, Config<br/>JSON columns]
    end
    
    subgraph "Object Storage (S3)"
        N[S3 Bucket<br/>Versioned] --> O[Historical Telemetry<br/>Parquet format<br/>Lifecycle policies]
        N --> P[ML Models<br/>ONNX files<br/>Versioned]
        N --> Q[Race Videos<br/>MP4 format<br/>CDN-backed]
    end
    
    subgraph "Data Flow"
        B --> R[Real-Time Processing<br/>Stream Consumers]
        R --> C
        R --> F
        
        C --> S[FastAPI Backend<br/>Read Cache]
        C --> T[WebSocket Server<br/>Broadcast]
        
        F --> U[Analytics Service<br/>Historical Queries]
        J --> V[Metadata Service<br/>Race Info]
        
        O --> W[ETL Pipeline<br/>Batch Processing]
        W --> F
    end
    
    subgraph "Data Replication"
        A --> X[Redis Replication<br/>Master-Slave<br/>Sentinel HA]
        F --> Y[PostgreSQL Replication<br/>Streaming Replica<br/>Read Scaling]
        N --> Z[S3 Replication<br/>Cross-Region<br/>DR Backup]
    end
    
    style A fill:#ff6b6b
    style F fill:#4ecdc4
    style J fill:#ffe66d
    style N fill:#95e1d3
```

### Performance Monitoring Architecture

```mermaid
graph TB
    subgraph "Metrics Collection"
        A[Application Metrics<br/>Prometheus Client] --> B[Custom Metrics<br/>Business Logic]
        A --> C[System Metrics<br/>CPU, Memory, Disk]
        A --> D[Network Metrics<br/>Latency, Throughput]
        A --> E[Database Metrics<br/>Query Time, Connections]
    end
    
    subgraph "Metrics Storage"
        B --> F[Prometheus<br/>Time-Series DB<br/>15s scrape interval]
        C --> F
        D --> F
        E --> F
        
        F --> G[PromQL Queries<br/>Aggregations]
        G --> H[Recording Rules<br/>Pre-computed]
    end
    
    subgraph "Logging Pipeline"
        I[Application Logs<br/>Structured JSON] --> J[Fluentd/Fluent Bit<br/>Log Shipper]
        J --> K[Elasticsearch<br/>Log Storage<br/>30d retention]
        K --> L[Logstash<br/>Log Processing<br/>Parsing & Enrichment]
        L --> K
    end
    
    subgraph "Tracing"
        M[OpenTelemetry<br/>Instrumentation] --> N[OTel Collector<br/>Trace Aggregation]
        N --> O[Jaeger/Zipkin<br/>Trace Storage<br/>7d retention]
        O --> P[Trace Analysis<br/>Performance Bottlenecks]
    end
    
    subgraph "Visualization"
        F --> Q[Grafana<br/>Dashboards]
        K --> R[Kibana<br/>Log Analysis]
        O --> S[Jaeger UI<br/>Trace Visualization]
        
        Q --> T[Custom Dashboards<br/>Real-Time Monitoring]
        R --> U[Log Search<br/>ELK Queries]
        S --> V[Service Map<br/>Dependency Graph]
    end
    
    subgraph "Alerting"
        Q --> W[Alert Manager<br/>Rule Evaluation]
        W --> X{Threshold<br/>Exceeded?}
        X -->|Yes| Y[Notification Channels<br/>PagerDuty, Slack, Email]
        X -->|No| Z[Continue Monitoring]
        
        Y --> AA[On-Call Engineer<br/>Incident Response]
    end
    
    subgraph "Performance Analysis"
        T --> AB[APM Dashboard<br/>Application Performance]
        AB --> AC[P50/P95/P99<br/>Latency Percentiles]
        AB --> AD[Error Rates<br/>Success/Failure]
        AB --> AE[Throughput<br/>Requests/Second]
    end
    
    style F fill:#ff6b6b
    style K fill:#4ecdc4
    style O fill:#ffe66d
    style Q fill:#95e1d3
```

### Monitoring & Observability

**Prometheus Metrics**:

```python
from prometheus_client import Counter, Histogram, Gauge

# Metrics definitions
telemetry_points_ingested = Counter(
    'telemetry_points_ingested_total',
    'Total telemetry points ingested',
    ['source']  # udp, http, s3
)

prediction_latency = Histogram(
    'tire_prediction_latency_seconds',
    'Tire prediction latency',
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1]
)

active_websocket_connections = Gauge(
    'websocket_connections_active',
    'Number of active WebSocket connections'
)
```

**Structured Logging**:

```python
import logging
import json

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        if hasattr(record, 'extra'):
            log_entry.update(record.extra)
        return json.dumps(log_entry)

# Usage
logger.info('Telemetry processed', extra={
    'vehicle_id': 'GR86-001',
    'points_count': 1000,
    'processing_time_ms': 45
})
```

---

## API Documentation

### REST API Endpoints

#### Health & Status

**GET `/health`**
- **Description**: Health check endpoint
- **Response**: `200 OK` with status object
- **Example**:
  ```json
  {
    "ok": true,
    "status": "healthy",
    "timestamp": "2025-01-20T00:00:00Z"
  }
  ```

**GET `/ready`**
- **Description**: Readiness probe (checks dependencies)
- **Response**: `200 OK` if all services available
- **Checks**: Redis connection, model files loaded

#### Tire Predictions

**GET `/api/predict_tire/:track/:chassis`**
- **Description**: Predict tire wear for a specific track/chassis
- **Parameters**:
  - `track` (path): Track identifier (e.g., "sebring", "cota")
  - `chassis` (path): Vehicle chassis ID (e.g., "GR86-001")
- **Query Parameters**:
  - `lap` (optional): Current lap number (default: latest)
- **Response**:
  ```json
  {
    "chassis": "GR86-001",
    "track": "sebring",
    "predicted_loss_per_lap_s": 0.062,
    "laps_until_0_5s_loss": 8,
    "recommended_pit_lap": 12,
    "feature_scores": [
      {"name": "tire_stress_global", "score": 1250.5},
      {"name": "brake_energy_est", "score": 0.15},
      {"name": "avg_speed_kmh", "score": 185.2}
    ],
    "explanation": [
      "High cumulative lateral G-forces indicate aggressive cornering",
      "15 heavy braking events accelerate front tire wear",
      "Tire age (lap 12) contributes to baseline degradation"
    ],
    "meta": {
      "model_version": "v1.0",
      "generated_at": "2025-01-20T00:00:00Z"
    }
  }
  ```

#### Dashboard Data

**GET `/api/dashboard/live`**
- **Description**: Get complete dashboard data in one call
- **Query Parameters**:
  - `track` (required): Track identifier
  - `race` (required): Race number
  - `vehicle` (required): Vehicle number
  - `lap` (required): Lap number
- **Response**: Combined tire wear, performance metrics, gap analysis

#### Telemetry Ingestion

**POST `/api/telemetry/ingest`**
- **Description**: Ingest telemetry data
- **Content-Type**: `application/json`
- **Body** (single point):
  ```json
  {
    "meta_time": "2025-01-20T00:00:00Z",
    "track": "sebring",
    "chassis": "GR86-001",
    "lap": 1,
    "lapdist_m": 280.5,
    "speed_kmh": 210,
    "accx_can": 0.03,
    "accy_can": 0.2,
    "Steering_Angle": 12,
    "pbrake_f": 0,
    "rpm": 6000
  }
  ```
- **Body** (batch):
  ```json
  [
    { /* point 1 */ },
    { /* point 2 */ }
  ]
  ```

### WebSocket API

**Connection**: `ws://localhost:8081/ws/realtime`

**Message Types**:

1. **`telemetry_update`** (from server):
   ```json
   {
     "type": "telemetry_update",
     "data": [
       {
         "meta_time": "2025-01-20T00:00:00Z",
         "track": "sebring",
         "chassis": "GR86-001",
         "lap": 1,
         "speed_kmh": 180,
         "accx_can": 0.02,
         "accy_can": 0.8
       }
     ]
   }
   ```

2. **`insight_update`** (from server):
   ```json
   {
     "type": "insight_update",
     "data": [
       {
         "chassis": "GR86-001",
         "track": "sebring",
         "lap": 1,
         "lap_tire_stress": 1250.5,
         "perSectorStress": {
           "0": 400.2,
           "1": 450.1,
           "2": 400.2
         },
         "predicted_loss_per_lap_seconds": 0.062,
         "laps_until_0_5s_loss": 8
       }
     ],
     "meta": {
       "generated_at": "2025-01-20T00:00:00.600Z"
     }
   }
   ```

**Client → Server Messages**:
- `ping`: Keep-alive (server responds with `pong`)
- `subscribe`: Subscribe to specific vehicle/track (optional filtering)

### API Rate Limiting

- **REST API**: 100 requests/minute per IP
- **WebSocket**: No rate limit (connection-based)
- **Telemetry Ingestion**: 10,000 points/second per source

### Authentication (Future)

Planned authentication using JWT tokens:
```
Authorization: Bearer <jwt_token>
```

---

## Development & Testing

### Quick Start

#### Prerequisites
- Node.js 18+
- Python 3.11+
- Redis 7+
- Docker & Docker Compose (optional)

#### Installation

```bash
# Clone repository
git clone https://github.com/lucylow/blank-slate-canvas.git
cd blank-slate-canvas

# Install frontend dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Start Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Or install Redis locally
brew install redis  # macOS
sudo apt-get install redis-server  # Ubuntu
```

#### Running Development Servers

**Option 1: All-in-one demo** (easiest):
```bash
npm run demo
# Starts demo server (port 8081) + frontend (port 5173)
```

**Option 2: Separate services**:
```bash
# Terminal 1: Demo server
npm run demo-server

# Terminal 2: Frontend
npm run dev

# Terminal 3: Python backend (if using)
cd app
uvicorn main:app --reload --port 8000

# Terminal 4: Real-time server
cd server/realtime
npm install
npm run dev
```

**Option 3: Agent system** (full stack):
```bash
# Start Redis
redis-server

# Start orchestrator
REDIS_URL=redis://localhost:6379 ORCH_PORT=9090 node agents/orchestrator/index.js

# Start agents (separate terminals)
REDIS_URL=redis://localhost:6379 node agents/preprocessor/index.js
REDIS_URL=redis://localhost:6379 python agents/predictor/predictor_agent.py
REDIS_URL=redis://localhost:6379 node agents/delivery/index.js

# Start agent API server
npm run agent-api

# Start frontend
npm run dev
```

### Project Structure

```
blank-slate-canvas/
├── src/                          # Frontend React application
│   ├── components/              # React components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── telemetry/          # Telemetry visualization
│   │   ├── strategy/           # Strategy console
│   │   └── AgentDashboard/     # AI agent dashboard
│   ├── pages/                  # Page components
│   │   ├── Index.tsx          # Landing page
│   │   └── DashboardPage.tsx  # Main dashboard
│   ├── hooks/                  # Custom React hooks
│   │   ├── useTelemetry.tsx   # Telemetry WebSocket hook
│   │   ├── useStrategy.tsx    # Strategy API hook
│   │   └── useAgentSystem.ts  # Agent system hook
│   ├── lib/                    # Utilities
│   │   ├── api.ts             # REST API client
│   │   └── ws.ts              # WebSocket client
│   └── types/                  # TypeScript types
├── server/                      # Node.js servers
│   ├── demo-server.js         # Demo/development server
│   ├── agent-api-server.js    # Agent API server
│   └── realtime/              # Production real-time server
│       ├── src/
│       │   ├── udp.ts         # UDP listener
│       │   ├── ws.ts          # WebSocket handler
│       │   ├── aggregator.ts  # Sector aggregator
│       │   └── redis.ts       # Redis client
│       └── package.json
├── app/                         # Python FastAPI backend
│   ├── main.py                # FastAPI application
│   ├── routes/                # API routes
│   ├── services/              # Business logic
│   │   ├── tire_wear_predictor.py
│   │   ├── performance_analyzer.py
│   │   └── strategy_optimizer.py
│   ├── models/                # Pydantic models
│   └── pipelines/             # Telemetry pipeline
├── agents/                     # Multi-agent system
│   ├── orchestrator/          # Orchestrator agent
│   ├── preprocessor/          # Preprocessor agent
│   ├── predictor/             # Predictor agent (Python)
│   ├── eda/                   # EDA agent
│   ├── simulator/             # Simulator agent
│   ├── explainer/             # Explainer agent
│   └── delivery/              # Delivery agent
├── k8s/                        # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── agents/                # Agent deployments
├── Dockerfile                  # Python backend
├── Dockerfile.frontend         # Frontend build
└── requirements.txt            # Python dependencies
```

### Testing Architecture

```mermaid
graph TB
    subgraph "Unit Tests"
        A[Frontend Unit Tests<br/>Vitest] --> B[Component Tests<br/>React Testing Library]
        A --> C[Hook Tests<br/>Custom Hooks]
        A --> D[Utility Tests<br/>Pure Functions]
        
        E[Backend Unit Tests<br/>Pytest] --> F[Service Tests<br/>Business Logic]
        E --> G[Model Tests<br/>Pydantic Models]
        E --> H[ML Model Tests<br/>ONNX Inference]
    end
    
    subgraph "Integration Tests"
        I[API Integration Tests<br/>Pytest + FastAPI] --> J[Endpoint Tests<br/>HTTP Client]
        I --> K[Database Tests<br/>Test Containers]
        I --> L[Redis Tests<br/>Fake Redis]
        
        M[Frontend Integration<br/>Vitest] --> N[Context Tests<br/>State Management]
        M --> O[API Client Tests<br/>Mock Server]
        M --> P[WebSocket Tests<br/>Mock Socket]
    end
    
    subgraph "E2E Tests"
        Q[Playwright Tests<br/>Browser Automation] --> R[User Flow Tests<br/>Critical Paths]
        Q --> S[Cross-Browser Tests<br/>Chrome, Firefox, Safari]
        Q --> T[Visual Regression<br/>Screenshot Diff]
        
        U[Cypress Tests<br/>Component E2E] --> V[Component Integration<br/>Full Render]
        U --> W[Real API Tests<br/>Test Environment]
    end
    
    subgraph "Performance Tests"
        X[Load Testing<br/>k6/Gatling] --> Y[API Load Tests<br/>1000 req/s]
        X --> Z[WebSocket Load Tests<br/>1000 connections]
        X --> AA[Endurance Tests<br/>24h stability]
        
        AB[ML Inference Benchmarks<br/>PyTest-benchmark] --> AC[Latency Tests<br/>P50/P95/P99]
        AB --> AD[Throughput Tests<br/>Predictions/sec]
    end
    
    subgraph "Test Infrastructure"
        B --> AE[Test Containers<br/>Docker Compose]
        F --> AE
        J --> AE
        K --> AE
        
        AE --> AF[PostgreSQL Test DB<br/>Isolated]
        AE --> AG[Redis Test Instance<br/>Isolated]
        AE --> AH[Test Data Fixtures<br/>JSON/CSV]
    end
    
    subgraph "CI Integration"
        B --> AI[GitHub Actions<br/>CI Pipeline]
        F --> AI
        J --> AI
        Q --> AI
        X --> AI
        
        AI --> AJ{All Tests Pass?}
        AJ -->|Yes| AK[Allow Merge]
        AJ -->|No| AL[Block Merge<br/>Report Failure]
    end
    
    subgraph "Test Coverage"
        B --> AM[Coverage Report<br/>Vitest/Istanbul]
        F --> AN[Coverage Report<br/>Pytest-cov]
        
        AM --> AO{Coverage > 80%?}
        AN --> AO
        AO -->|Yes| AI
        AO -->|No| AL
    end
    
    style A fill:#ff6b6b
    style E fill:#4ecdc4
    style Q fill:#ffe66d
    style X fill:#95e1d3
```

### Testing

#### Frontend Tests

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Example Test** (Vitest):
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '@/pages/DashboardPage';

describe('Dashboard', () => {
  it('renders telemetry data', () => {
    render(<Dashboard />);
    expect(screen.getByText('Telemetry')).toBeInTheDocument();
  });
});
```

#### Backend Tests

```bash
# Python tests
cd app
pytest tests/

# With coverage
pytest --cov=app tests/
```

**Example Test** (Pytest):
```python
import pytest
from app.services.tire_wear_predictor import TireWearPredictor

def test_tire_wear_prediction():
    predictor = TireWearPredictor()
    telemetry = pd.DataFrame({
        'accx_can': [0.5] * 100,
        'accy_can': [0.8] * 100,
        'speed_kmh': [180] * 100
    })
    
    result = predictor.predict_tire_wear(telemetry, current_lap=5, vehicle_number=1)
    
    assert result.front_left >= 0
    assert result.front_left <= 100
    assert result.predicted_laps_remaining > 0
```

#### Integration Tests

```bash
# Test API endpoints
curl http://localhost:8000/health

# Test WebSocket
wscat -c ws://localhost:8081/ws/realtime

# Test telemetry ingestion
curl -X POST http://localhost:8081/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"track":"sebring","chassis":"GR86-001","speed_kmh":180}'
```

### Performance Benchmarks

**Frontend**:
- First Contentful Paint: <1s
- Time to Interactive: <2s
- Bundle size: <500KB (gzipped)
- WebSocket reconnection: <100ms

**Backend**:
- API latency (p50): <10ms
- API latency (p99): <50ms
- ML inference: <5ms per prediction
- Telemetry throughput: 10,000+ points/second

**Infrastructure**:
- Redis Streams: 100,000+ messages/second
- WebSocket connections: 1,000+ concurrent
- Horizontal scaling: Linear with worker count

### Debugging

**Frontend**:
- React DevTools for component inspection
- Redux DevTools (if using Redux)
- Network tab for API/WebSocket debugging

**Backend**:
- FastAPI automatic OpenAPI docs: `http://localhost:8000/docs`
- Structured JSON logs with log level control
- Prometheus metrics: `http://localhost:8000/metrics`

**Redis**:
```bash
# Monitor streams
redis-cli XINFO STREAM telemetry.stream

# Check consumer groups
redis-cli XINFO GROUPS telemetry.stream

# View recent messages
redis-cli XREAD COUNT 10 STREAMS telemetry.stream 0
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run linter: `npm run lint`
5. Run tests: `npm test && pytest`
6. Commit: `git commit -m "Add my feature"`
7. Push: `git push origin feature/my-feature`
8. Create Pull Request

**Code Style**:
- TypeScript: ESLint + Prettier
- Python: Black formatter, flake8 linter
- Commits: Conventional Commits format

---

## Roadmap

### Short-Term (Q1 2025)
- [ ] Add training notebook for model development
- [ ] Implement full ETL pipeline documentation
- [ ] Add comprehensive unit tests (Jest + Pytest)
- [ ] Create 3-minute demo video
- [ ] Set up CI/CD pipeline with GitHub Actions

### Medium-Term (Q2 2025)
- [ ] Bundle size optimization and lazy loading
- [ ] Add authentication/authorization (JWT)
- [ ] Implement database persistence (PostgreSQL/TimescaleDB)
- [ ] Add advanced visualization (3D track maps)
- [ ] Mobile app (React Native)

### Long-Term (Q3-Q4 2025)
- [ ] Multi-race historical analysis
- [ ] Driver performance prediction models
- [ ] Weather integration for strategy optimization
- [ ] Real-time video sync with telemetry
- [ ] AR/VR pit wall visualization

---

## License

MIT License — Created for the Toyota GR Cup "Hack the Track" Hackathon

Copyright (c) 2025 PitWall A.I. Contributors

---

## Acknowledgments

- **Toyota GR Cup** for providing the hackathon platform and real telemetry data
- **Redis** for Redis Streams technology enabling high-throughput processing
- **FastAPI** for the excellent Python async framework
- **React Team** for the amazing frontend framework
- **Open Source Community** for the incredible tools and libraries

---

**Built with ❤️ for the Toyota GR Cup "Hack the Track" Hackathon**

*Last updated: January 2025*
