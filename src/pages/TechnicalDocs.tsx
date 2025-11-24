import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Code,
  Database,
  Server,
  Cpu,
  Network,
  Settings,
  FileText,
  GitBranch,
  Package,
  Terminal,
  Zap,
  Shield,
  Globe,
  Layers,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const TechnicalDocs = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ code, language = "bash", id }: { code: string; language?: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Technical Documentation</h1>
              <p className="text-slate-600 mt-1">Comprehensive guides and reference for developers</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="deployment">Deploy</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Project Overview
                </CardTitle>
                <CardDescription>
                  A comprehensive racing telemetry analytics platform with AI-powered insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">What is this project?</h3>
                  <p className="text-slate-600">
                    This platform provides real-time telemetry analysis, predictive AI modeling, and comprehensive
                    race analytics for motorsports. It combines real-time data processing, machine learning agents,
                    and interactive visualizations to deliver actionable insights.
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Key Features</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { icon: Zap, title: "Real-time Telemetry", desc: "Live data ingestion and processing" },
                      { icon: Cpu, title: "AI Agents", desc: "Predictive and explanatory AI models" },
                      { icon: Database, title: "Data Analytics", desc: "Comprehensive race analysis and insights" },
                      { icon: Network, title: "Track Visualization", desc: "Interactive track maps and geometry" },
                      { icon: Layers, title: "Multi-layer Architecture", desc: "Scalable microservices design" },
                      { icon: Shield, title: "Observability", desc: "Full monitoring and logging" },
                    ].map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <feature.icon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium">{feature.title}</h4>
                          <p className="text-sm text-slate-600">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Tech Stack</h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "React + TypeScript",
                      "Python (FastAPI)",
                      "Node.js",
                      "PostgreSQL",
                      "TimescaleDB",
                      "InfluxDB",
                      "Docker",
                      "Kubernetes",
                      "WebSockets",
                      "Vite",
                      "Tailwind CSS",
                    ].map((tech) => (
                      <Badge key={tech} variant="secondary">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Installation & Setup
                </CardTitle>
                <CardDescription>Get the project running on your local machine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Prerequisites</h3>
                  <ul className="list-disc list-inside space-y-2 text-slate-600 ml-4">
                    <li>Node.js 18+ and npm/yarn</li>
                    <li>Python 3.9+</li>
                    <li>PostgreSQL 14+</li>
                    <li>Docker and Docker Compose (optional)</li>
                    <li>Git</li>
                  </ul>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Quick Start</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">1. Clone the repository</h4>
                      <CodeBlock
                        code="git clone https://github.com/your-org/blank-slate-canvas.git
cd blank-slate-canvas"
                        id="clone"
                      />
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">2. Install frontend dependencies</h4>
                      <CodeBlock code="npm install" id="npm-install" />
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">3. Install Python dependencies</h4>
                      <CodeBlock code="pip install -r requirements.txt" id="pip-install" />
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">4. Set up environment variables</h4>
                      <CodeBlock
                        code={`# Copy example env file
cp .env.example .env

# Edit .env with your configuration
# Database URLs, API keys, etc.`}
                        id="env-setup"
                      />
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">5. Initialize database</h4>
                      <CodeBlock
                        code={`# Run migrations
python -m app.main migrate

# Or using Docker
docker-compose up -d postgres
docker-compose exec postgres psql -U postgres -f /docker-entrypoint-initdb.d/init.sql`}
                        id="db-init"
                      />
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">6. Start development servers</h4>
                      <CodeBlock
                        code={`# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend API
python -m app.main

# Terminal 3: Agent services (optional)
cd agents && python agent_orchestrator_async.py`}
                        id="start-dev"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Docker Setup</h3>
                  <p className="text-slate-600 mb-3">
                    For a complete containerized setup, use Docker Compose:
                  </p>
                  <CodeBlock
                    code="docker-compose up -d
docker-compose logs -f"
                    id="docker-setup"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  System Architecture
                </CardTitle>
                <CardDescription>Understanding the platform's architecture and components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">High-Level Architecture</h3>
                  <div className="bg-slate-50 p-6 rounded-lg space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white rounded-lg border border-slate-200">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-blue-600" />
                          Frontend Layer
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                          <li>React + TypeScript</li>
                          <li>Real-time WebSocket connections</li>
                          <li>Interactive visualizations</li>
                          <li>Component-based UI</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-white rounded-lg border border-slate-200">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Server className="h-4 w-4 text-green-600" />
                          API Layer
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                          <li>FastAPI (Python)</li>
                          <li>RESTful endpoints</li>
                          <li>WebSocket server</li>
                          <li>Authentication & authorization</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-white rounded-lg border border-slate-200">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-purple-600" />
                          Agent Layer
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                          <li>AI prediction agents</li>
                          <li>Pattern detection</li>
                          <li>Explanatory analysis</li>
                          <li>Async orchestration</li>
                        </ul>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="p-4 bg-white rounded-lg border border-slate-200">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Database className="h-4 w-4 text-orange-600" />
                          Data Layer
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                          <li>PostgreSQL (relational data)</li>
                          <li>TimescaleDB (time-series)</li>
                          <li>InfluxDB (telemetry)</li>
                          <li>Data pipelines</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-white rounded-lg border border-slate-200">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Network className="h-4 w-4 text-red-600" />
                          Services Layer
                        </h4>
                        <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                          <li>Telemetry ingestion</li>
                          <li>Real-time processing</li>
                          <li>Demo server</li>
                          <li>Pitwall integration</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Directory Structure</h3>
                  <CodeBlock
                    code={`blank-slate-canvas/
├── src/                    # Frontend React application
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── api/              # API client code
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
├── app/                   # Backend FastAPI application
│   ├── api/              # API routes
│   ├── models/           # Database models
│   ├── services/         # Business logic
│   └── pipelines/        # Data processing pipelines
├── agents/                # AI agent system
│   ├── predictor/        # Prediction agents
│   ├── explainer/        # Explanatory agents
│   └── orchestrator/     # Agent orchestration
├── server/                # Node.js services
│   ├── realtime/         # WebSocket server
│   └── demo-server.js    # Demo data server
├── infrastructure/        # Deployment configs
│   ├── docker/           # Docker configurations
│   └── k8s/              # Kubernetes manifests
└── docs/                  # Documentation`}
                    id="dir-structure"
                  />
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Data Flow</h3>
                  <div className="bg-slate-50 p-6 rounded-lg">
                    <ol className="space-y-3 text-slate-700">
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          1
                        </span>
                        <div>
                          <strong>Telemetry Ingestion:</strong> Real-time telemetry data is received via UDP/WebSocket
                          and ingested into the system
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          2
                        </span>
                        <div>
                          <strong>Data Processing:</strong> Raw data is processed, normalized, and stored in time-series
                          databases
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          3
                        </span>
                        <div>
                          <strong>AI Analysis:</strong> AI agents analyze patterns, make predictions, and generate
                          insights
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          4
                        </span>
                        <div>
                          <strong>API Serving:</strong> Processed data and insights are served via REST and WebSocket
                          APIs
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          5
                        </span>
                        <div>
                          <strong>Frontend Display:</strong> Real-time updates are pushed to the frontend for
                          visualization
                        </div>
                      </li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API Documentation
                </CardTitle>
                <CardDescription>REST and WebSocket API reference</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Base URL</h3>
                  <CodeBlock code="http://localhost:8000/api" id="base-url" />
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Authentication</h3>
                  <p className="text-slate-600 mb-3">
                    Most endpoints require authentication. Include the token in the Authorization header:
                  </p>
                  <CodeBlock
                    code={`Authorization: Bearer <your-token>`}
                    id="auth-header"
                  />
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Endpoints</h3>
                  <div className="space-y-4">
                    {[
                      {
                        method: "GET",
                        path: "/api/telemetry/latest",
                        desc: "Get latest telemetry data",
                        example: `curl -X GET "http://localhost:8000/api/telemetry/latest" \\
  -H "Authorization: Bearer <token>"`,
                      },
                      {
                        method: "GET",
                        path: "/api/tracks",
                        desc: "List all available tracks",
                        example: `curl -X GET "http://localhost:8000/api/tracks"`,
                      },
                      {
                        method: "GET",
                        path: "/api/analytics/race/{race_id}",
                        desc: "Get race analytics",
                        example: `curl -X GET "http://localhost:8000/api/analytics/race/123" \\
  -H "Authorization: Bearer <token>"`,
                      },
                      {
                        method: "POST",
                        path: "/api/agents/predict",
                        desc: "Trigger prediction agent",
                        example: `curl -X POST "http://localhost:8000/api/agents/predict" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{"track_id": "cota", "session_id": "123"}'`,
                      },
                      {
                        method: "GET",
                        path: "/api/agents/results/{task_id}",
                        desc: "Get agent task results",
                        example: `curl -X GET "http://localhost:8000/api/agents/results/abc123" \\
  -H "Authorization: Bearer <token>"`,
                      },
                    ].map((endpoint, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge
                            variant={
                              endpoint.method === "GET"
                                ? "default"
                                : endpoint.method === "POST"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                            {endpoint.path}
                          </code>
                        </div>
                        <p className="text-slate-600 text-sm mb-3">{endpoint.desc}</p>
                        <CodeBlock code={endpoint.example} id={`api-${idx}`} />
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">WebSocket API</h3>
                  <p className="text-slate-600 mb-3">
                    Connect to the WebSocket server for real-time updates:
                  </p>
                  <CodeBlock
                    code={`const ws = new WebSocket('ws://localhost:8000/ws/telemetry');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Telemetry update:', data);
};

// Subscribe to specific track
ws.send(JSON.stringify({
  type: 'subscribe',
  track_id: 'cota'
}));`}
                    id="websocket-example"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  AI Agent System
                </CardTitle>
                <CardDescription>Understanding the AI agent architecture and usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Agent Types</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      {
                        name: "Predictor Agent",
                        desc: "Predicts future race conditions, lap times, and performance metrics",
                        file: "predictor_agent_async.py",
                      },
                      {
                        name: "Explainer Agent",
                        desc: "Provides explanations for race events and performance changes",
                        file: "explainer/explainer_agent.py",
                      },
                      {
                        name: "Pattern Agent",
                        desc: "Detects patterns in telemetry data and race behavior",
                        file: "pattern_agents.py",
                      },
                      {
                        name: "Delivery Agent",
                        desc: "Orchestrates agent execution and result delivery",
                        file: "delivery/delivery-agent.js",
                      },
                    ].map((agent, idx) => (
                      <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                        <h4 className="font-semibold mb-1">{agent.name}</h4>
                        <p className="text-sm text-slate-600 mb-2">{agent.desc}</p>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">{agent.file}</code>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Using Agents</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">1. Start the Agent Orchestrator</h4>
                      <CodeBlock
                        code="cd agents
python agent_orchestrator_async.py"
                        id="start-orchestrator"
                      />
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">2. Trigger an Agent Task</h4>
                      <CodeBlock
                        code={`import requests

response = requests.post(
    'http://localhost:8000/api/agents/predict',
    headers={'Authorization': 'Bearer <token>'},
    json={
        'track_id': 'cota',
        'session_id': 'session_123',
        'agent_type': 'predictor'
    }
)

task_id = response.json()['task_id']`}
                        id="trigger-agent"
                        language="python"
                      />
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">3. Check Task Status</h4>
                      <CodeBlock
                        code={`# Poll for results
response = requests.get(
    f'http://localhost:8000/api/agents/results/{task_id}',
    headers={'Authorization': 'Bearer <token>'}
)

result = response.json()
print(result['status'])  # 'pending', 'running', 'completed', 'failed'`}
                        id="check-status"
                        language="python"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Agent Configuration</h3>
                  <p className="text-slate-600 mb-3">
                    Agents can be configured via JSON files in the <code className="bg-slate-100 px-1 rounded">agents/config/</code> directory:
                  </p>
                  <CodeBlock
                    code={`{
  "predictor": {
    "model_path": "models/predictor_model.pkl",
    "confidence_threshold": 0.8,
    "max_predictions": 100
  },
  "explainer": {
    "explanation_depth": "detailed",
    "include_visualizations": true
  }
}`}
                    id="agent-config"
                    language="json"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deployment Tab */}
          <TabsContent value="deployment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Deployment Guide
                </CardTitle>
                <CardDescription>Deploying to production environments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Docker Deployment</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Build Images</h4>
                      <CodeBlock
                        code={`# Build frontend
docker build -f infrastructure/docker/Dockerfile.frontend -t blank-slate-frontend .

# Build backend
docker build -f Dockerfile -t blank-slate-backend .`}
                        id="docker-build"
                      />
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Run with Docker Compose</h4>
                      <CodeBlock
                        code="docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d"
                        id="docker-compose-prod"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Kubernetes Deployment</h3>
                  <p className="text-slate-600 mb-3">
                    Deploy to Kubernetes using the manifests in <code className="bg-slate-100 px-1 rounded">infrastructure/k8s/</code>:
                  </p>
                  <CodeBlock
                    code={`# Apply all manifests
kubectl apply -f infrastructure/k8s/

# Or deploy individually
kubectl apply -f infrastructure/k8s/frontend-deployment.yaml
kubectl apply -f infrastructure/k8s/backend-deployment.yaml
kubectl apply -f infrastructure/k8s/database-deployment.yaml`}
                    id="k8s-deploy"
                  />
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Environment Variables</h3>
                  <p className="text-slate-600 mb-3">Required environment variables for production:</p>
                  <CodeBlock
                    code={`# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
TIMESCALE_URL=postgresql://user:pass@timescale:5432/tsdb
INFLUX_URL=http://influxdb:8086

# API
API_SECRET_KEY=your-secret-key
JWT_SECRET=your-jwt-secret

# Services
REDIS_URL=redis://redis:6379
WEBSOCKET_PORT=8001

# External APIs
OPENAI_API_KEY=your-key (if using AI features)`}
                    id="env-vars"
                  />
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-lg mb-3">Health Checks</h3>
                  <p className="text-slate-600 mb-3">Monitor service health:</p>
                  <CodeBlock
                    code={`# API health
curl http://localhost:8000/health

# Frontend
curl http://localhost:3000/

# Database connectivity
python -c "from app.config import db; print(db.test_connection())"`}
                    id="health-checks"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <a
                  href="https://github.com/your-org/blank-slate-canvas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <GitBranch className="h-5 w-5 text-slate-600" />
                  <div>
                    <div className="font-medium">GitHub Repository</div>
                    <div className="text-sm text-slate-600">View source code and issues</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400 ml-auto" />
                </a>
                <a
                  href="/docs"
                  className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-slate-600" />
                  <div>
                    <div className="font-medium">Additional Docs</div>
                    <div className="text-sm text-slate-600">Browse more documentation</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default TechnicalDocs;

