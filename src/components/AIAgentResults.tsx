import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  BarChart3,
  Play,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgentResult {
  agent_id: string;
  agent_type: string;
  agent_name: string;
  status: "processing" | "completed" | "error";
  results: {
    summary: string;
    key_metrics?: Record<string, number | string>;
    insights?: string[];
    confidence?: number;
    processing_time_ms?: number;
  };
  timestamp: string;
}

// Mock results for all 7 AI agents based on demo_data.json processing pipeline
// Includes examples from multiple tracks: COTA, Barber, Sebring, Indianapolis, Road America, Sonoma, VIR
const generateMockResults = (): AgentResult[] => {
  const baseTime = new Date("2025-11-20T15:30:45.123Z");
  
  return [
    {
      agent_id: "preprocessor-001",
      agent_type: "preprocessor",
      agent_name: "Preprocessor Agent",
      status: "completed",
      results: {
        summary: "Canonicalized 8,472 samples from demo_data.json. Mapped 12 sectors and derived lateral_g, longitudinal_g, tire_stress_inst, brake_energy_inst features. Processed data from COTA (3.1M rows), Barber (2.8M rows), Sebring (2.9M rows).",
        key_metrics: {
          "Samples Processed": 8472,
          "Sectors Mapped": 12,
          "Derived Features": 4,
          "Aggregate Windows": 12,
          "Anomalies Detected": 3,
          "Tracks Processed": 3
        },
        insights: [
          "Canonicalized 8,472 telemetry samples from demo_data.json",
          "Mapped 12 sectors across COTA track",
          "Derived 4 new features: lateral_g, longitudinal_g, tire_stress_inst, brake_energy_inst",
          "Sector 1: avg_speed 148.2 km/h, max_lat_g 1.8, tire_stress 124,000",
          "Sector 2: avg_speed 132.1 km/h, max_lat_g 2.1, tire_stress 168,000 (high load)",
          "Sector 3: avg_speed 220.5 km/h, max_lat_g 1.2, tire_stress 98,000",
          "Processed Barber data: 2,847,563 rows, 28 vehicles, 45.62 minutes",
          "Processed Sebring data: 2,945,678 rows, 29 vehicles, 46.78 minutes"
        ],
        confidence: 0.98,
        processing_time_ms: 1111
      },
      timestamp: new Date(baseTime.getTime() + 0).toISOString()
    },
    {
      agent_id: "eda-001",
      agent_type: "eda",
      agent_name: "EDA Agent",
      status: "completed",
      results: {
        summary: "Identified 3 driving style clusters using UMAP + HDBSCAN: conservative_smooth (856 samples), aggressive_late_apex (742 samples), unstable_entry (402 samples). Analyzed VIR data showing 99.76% consistency for Car #13.",
        key_metrics: {
          "Clusters Found": 3,
          "Samples Analyzed": 2000,
          "Driving Styles": 3,
          "Cluster Stability": "87%",
          "Centroid Drift": 0.23,
          "Tracks Analyzed": 4
        },
        insights: [
          "Cluster 0 - Conservative Smooth: avg_speed 135.2 km/h, max_lat_g 1.6",
          "Cluster 1 - Aggressive Late Apex: avg_speed 152.8 km/h, max_lat_g 2.3 (high cornering loads)",
          "Cluster 2 - Unstable Entry: avg_speed 128.5 km/h, max_lat_g 1.9 (mid-corner corrections)",
          "Evidence sample: Lap 12, Sector 2 - late braking, high corner speed pattern detected",
          "Drift metrics show stable clustering (87% stability, 0.23 centroid drift)",
          "VIR analysis: Car #13 consistency 99.76% (std: 0.234s), top 5 drivers <0.5s std dev",
          "Road America: Late apex gains - Cluster 1 drivers gaining ~0.4s via later turn-in at T5"
        ],
        confidence: 0.87,
        processing_time_ms: 1112
      },
      timestamp: new Date(baseTime.getTime() + 1111).toISOString()
    },
    {
      agent_id: "predictor-001",
      agent_type: "predictor",
      agent_name: "Predictor Agent",
      status: "completed",
      results: {
        summary: "Predicted 0.321s/lap tire degradation loss. Tire cliff expected at Lap 18. Model confidence 78% (R²=0.89, MAE=0.08s). Also analyzed Barber (0.312s/lap loss, cliff at Lap 10) and Sebring (6-9°C temp rise over 8 laps).",
        key_metrics: {
          "Predicted Loss/Lap": "0.321s",
          "Laps Until 0.5s Loss": 6.2,
          "Model Confidence": "78%",
          "R Squared": 0.89,
          "MAE (seconds)": 0.08,
          "Tracks Modeled": 3
        },
        insights: [
          "Predicted tire degradation: 0.321s loss per lap",
          "Tire cliff expected by Lap 18 (6.2 laps until 0.5s threshold)",
          "Confidence interval: [0.285s, 0.357s]",
          "Top feature importance: tire_stress_sector_1 (42%), brake_energy_sector_2 (31%)",
          "Model trained on COTA data (v1.2), validated with 89% R² accuracy",
          "Barber prediction: 0.312s/lap loss, tire cliff at Lap 10, confidence 78%",
          "Sebring analysis: Surface temp rises 6-9°C over 8 laps, expected cliff at lap ~18"
        ],
        confidence: 0.78,
        processing_time_ms: 1112
      },
      timestamp: new Date(baseTime.getTime() + 2223).toISOString()
    },
    {
      agent_id: "simulator-001",
      agent_type: "simulator",
      agent_name: "Simulator Agent",
      status: "completed",
      results: {
        summary: "Recommended PIT_LAP_15 strategy with +3.3s expected gain. Analyzed 2 scenarios: pit_lap_15 (60% probability, 3600.23s) vs stay_out (40% probability, 3603.52s). Also simulated Road America (Lap 18, 72% confidence) and Indianapolis (multiple scenarios).",
        key_metrics: {
          "Strategy Recommended": "PIT_LAP_15",
          "Expected Gain": "+3.3s",
          "Scenarios Analyzed": 4,
          "Best Strategy Probability": "60%",
          "Tire Cliff Lap": 18,
          "Tracks Simulated": 3
        },
        insights: [
          "Optimal strategy: Pit stop on Lap 15 (+3.3s expected gain)",
          "Scenario 1 (Pit Lap 15): 3600.23s total time, 60% probability, undercut opponent #4",
          "Scenario 2 (Stay Out): 3603.52s total time, 40% probability, tire degradation risk in final laps",
          "Tire cliff predicted at Lap 18 - pit before degradation",
          "Undercut window: Laps 14-16 optimal for track position gain",
          "Competitor strategies: opponent_4 (lap 16), opponent_7 (lap 14)",
          "Road America: Recommended pit Lap 18 (72% confidence), 4 scenarios analyzed",
          "Indianapolis: Multiple strategies tested, Race 2 showed 13.6s faster pace"
        ],
        confidence: 0.82,
        processing_time_ms: 1111
      },
      timestamp: new Date(baseTime.getTime() + 3335).toISOString()
    },
    {
      agent_id: "explainer-001",
      agent_type: "explainer",
      agent_name: "Explainer Agent",
      status: "completed",
      results: {
        summary: "Generated explainable insights with SHAP feature attribution. Top factors: tire_stress_sector_1 (21% impact), brake_energy_sector_2 (18% impact). Compiled evidence frames from Lap 12 sectors.",
        key_metrics: {
          "Feature Attributions": 4,
          "Evidence Frames": 2,
          "SHAP Values Computed": 4,
          "Explanations Generated": 2,
          "Radio Scripts": 1
        },
        insights: [
          "Tire stress Sector 1: 168,000 (SHAP +0.21) - 34% above optimal, high impact",
          "Brake energy Sector 2: 1.12 (SHAP +0.18) - thermal degradation risk, medium impact",
          "Lateral G consistency: 0.87 (SHAP +0.12) - medium impact on wear",
          "Evidence frame 1: Sector 1 high stress (142-145 km/h, 2.0-2.1 lateral G, 165-170k tire stress)",
          "Evidence frame 2: Sector 2 high braking (85-90% brake, 210-195 km/h, 1.10-1.12 brake energy)",
          "Radio script: 'Pit wall to driver: Elevated tire wear in Sector 1. Recommend pit Lap 15 for fresh rubber and undercut on car #4.'"
        ],
        confidence: 0.85,
        processing_time_ms: 1111
      },
      timestamp: new Date(baseTime.getTime() + 4446).toISOString()
    },
    {
      agent_id: "delivery-001",
      agent_type: "delivery",
      agent_name: "Delivery Agent",
      status: "completed",
      results: {
        summary: "Delivered insights to 3 connected clients via WebSocket. Insight ID: insight-ab12cd34. Message delivery time: 45ms. All clients notified successfully.",
        key_metrics: {
          "Insights Delivered": 5,
          "Clients Connected": 3,
          "Delivery Time": "45ms",
          "Message Types": 3,
          "Storage Success": "true"
        },
        insights: [
          "WebSocket broadcast: insight-ab12cd34 created (Priority: HIGH)",
          "Summary: 'Predicted 0.32s/lap loss — pit window Lap 14-17'",
          "Top features: tire_stress_sector_1 (168,000), brake_energy_sector_2 (1.12)",
          "REST endpoint: /api/insights/insight-ab12cd34 (full evidence, attributions, simulations)",
          "All 3 clients notified in 45ms",
          "Storage persisted successfully for historical analysis"
        ],
        confidence: 0.99,
        processing_time_ms: 223
      },
      timestamp: new Date(baseTime.getTime() + 5557).toISOString()
    },
    {
      agent_id: "orchestrator-001",
      agent_type: "orchestrator",
      agent_name: "Orchestrator Agent",
      status: "completed",
      results: {
        summary: "Orchestrated 7-agent pipeline processing across 7 tracks. Total duration: 5.89s. System throughput: 51 insights/min. All 7 agents active, 0 failed tasks. Processed 41.9M telemetry data points from COTA, Barber, Sebring, Indianapolis, Road America, Sonoma, and VIR.",
        key_metrics: {
          "Agents Active": 7,
          "Tasks Processed": 42,
          "Total Duration": "5.89s",
          "Throughput": "51 insights/min",
          "Error Rate": "0%",
          "Tracks Processed": 7,
          "Total Data Points": "41.9M"
        },
        insights: [
          "Pipeline execution: demo_data.json processing completed in 5.89s",
          "Agent timings: preprocessor (1.111s), eda (1.112s), predictor (1.112s), simulator (1.111s), explainer (1.111s), delivery (0.223s)",
          "Data flow: 8,472 input samples → 12 aggregate windows → 5 insights → 1 final recommendation",
          "Routing: 7 tasks routed, 6 affinity matches, 1 load-balanced, 0 failed tasks",
          "System metrics: 1,120ms avg processing time, 87% agent utilization, 0% error rate",
          "Queue status: 3 tasks pending, 8 results ready, all agent inboxes healthy",
          "Multi-track processing: COTA (3.1M rows), Barber (2.8M rows), Sebring (2.9M rows), Indianapolis (3.4M rows)",
          "Road America (2.7M rows), Sonoma (2.6M rows), VIR (2.8M rows) - all processed successfully",
          "Total unique vehicles analyzed: 397 across all 7 tracks"
        ],
        confidence: 0.95,
        processing_time_ms: 5890
      },
      timestamp: new Date(baseTime.getTime() + 5890).toISOString()
    }
  ];
};

const getAgentIcon = (type: string) => {
  switch (type) {
    case "preprocessor":
      return <Target className="w-5 h-5" />;
    case "strategist":
      return <Target className="w-5 h-5" />;
    case "coach":
      return <TrendingUp className="w-5 h-5" />;
    case "anomaly_detective":
      return <AlertTriangle className="w-5 h-5" />;
    case "predictor":
      return <Clock className="w-5 h-5" />;
    case "simulator":
      return <Play className="w-5 h-5" />;
    case "explainer":
      return <Sparkles className="w-5 h-5" />;
    case "eda":
      return <BarChart3 className="w-5 h-5" />;
    case "delivery":
      return <TrendingUp className="w-5 h-5" />;
    case "orchestrator":
      return <Bot className="w-5 h-5" />;
    default:
      return <Bot className="w-5 h-5" />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "processing":
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case "error":
      return <XCircle className="w-4 h-4 text-red-500" />;
    default:
      return null;
  }
};

const getAgentColor = (type: string) => {
  switch (type) {
    case "preprocessor":
      return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
    case "strategist":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "coach":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "anomaly_detective":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "predictor":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    case "simulator":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "explainer":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "eda":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "delivery":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "orchestrator":
      return "bg-violet-500/20 text-violet-400 border-violet-500/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

export default function AIAgentResults() {
  const [results, setResults] = useState<AgentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading AI agent results
    setIsLoading(true);
    const timer = setTimeout(() => {
      const mockResults = generateMockResults();
      setResults(mockResults);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const selectedResult = results.find(r => r.agent_id === selectedAgent);

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-lg border-border/50">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Processing demo_data.json with AI agents...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bot className="w-6 h-6 text-primary" />
            AI Agent Results on demo_data.json
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Mock results from all 7 AI agents processing the demo dataset
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="all">All Agents</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="delivery">Delivery</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pipeline" className="space-y-4">
              <Card className="border-border/50 bg-gradient-to-br from-card/80 to-card/60">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Processing Pipeline Timeline
                  </h3>
                  <div className="space-y-4">
                    {results.map((result, index) => {
                      const time = new Date(result.timestamp);
                      const timeStr = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + time.getMilliseconds().toString().padStart(3, '0');
                      return (
                        <div key={result.agent_id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                          <div className="flex-shrink-0 w-24 text-xs font-mono text-muted-foreground pt-1">
                            {timeStr}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`p-1.5 rounded ${getAgentColor(result.agent_type)}`}>
                                {getAgentIcon(result.agent_type)}
                              </div>
                              <h4 className="font-semibold">{result.agent_name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {result.results.processing_time_ms}ms
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{result.results.summary}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-sm font-semibold text-primary mb-2">Pipeline Summary</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Total Duration: </span>
                          <span className="font-bold">5.89s</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Input Samples: </span>
                          <span className="font-bold">8,472</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Insights Generated: </span>
                          <span className="font-bold">5</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Final Recommendations: </span>
                          <span className="font-bold">1</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((result, index) => (
                  <motion.div
                    key={result.agent_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedAgent(result.agent_id)}
                    className="cursor-pointer"
                  >
                    <Card className={`border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                      selectedAgent === result.agent_id 
                        ? 'border-primary shadow-primary/20' 
                        : 'border-border/50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${getAgentColor(result.agent_type)}`}>
                              {getAgentIcon(result.agent_type)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{result.agent_name}</h3>
                              <p className="text-xs text-muted-foreground">{result.agent_type}</p>
                            </div>
                          </div>
                          {getStatusIcon(result.status)}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {result.results.summary}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Confidence:</span>
                            <Badge variant="outline" className="text-xs">
                              {(result.results.confidence || 0) * 100}%
                            </Badge>
                          </div>
                          <span className="text-muted-foreground">
                            {result.results.processing_time_ms}ms
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              {results.filter(r => 
                r.agent_type === "preprocessor" || 
                r.agent_type === "eda" || 
                r.agent_type === "predictor" || 
                r.agent_type === "explainer"
              ).map((result) => (
                <Card key={result.agent_id} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-lg ${getAgentColor(result.agent_type)}`}>
                        {getAgentIcon(result.agent_type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{result.agent_name}</h3>
                        <p className="text-sm text-muted-foreground">{result.results.summary}</p>
                      </div>
                      {getStatusIcon(result.status)}
                    </div>
                    
                    {result.results.key_metrics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {Object.entries(result.results.key_metrics).map(([key, value]) => (
                          <div key={key} className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">{key}</p>
                            <p className="text-lg font-bold">{value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {result.results.insights && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold mb-2">Key Insights:</p>
                        {result.results.insights.map((insight, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{insight}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="strategy" className="space-y-4">
              {results.filter(r => r.agent_type === "simulator").map((result) => (
                <Card key={result.agent_id} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-lg ${getAgentColor(result.agent_type)}`}>
                        {getAgentIcon(result.agent_type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{result.agent_name}</h3>
                        <p className="text-sm text-muted-foreground">{result.results.summary}</p>
                      </div>
                      {getStatusIcon(result.status)}
                    </div>
                    
                    {result.results.key_metrics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {Object.entries(result.results.key_metrics).map(([key, value]) => (
                          <div key={key} className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">{key}</p>
                            <p className="text-lg font-bold">{value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {result.results.insights && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold mb-2">Coaching Opportunities:</p>
                        {result.results.insights.map((insight, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{insight}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="delivery" className="space-y-4">
              {results.filter(r => 
                r.agent_type === "delivery" || 
                r.agent_type === "orchestrator"
              ).map((result) => (
                <Card key={result.agent_id} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 rounded-lg ${getAgentColor(result.agent_type)}`}>
                        {getAgentIcon(result.agent_type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{result.agent_name}</h3>
                        <p className="text-sm text-muted-foreground">{result.results.summary}</p>
                      </div>
                      {getStatusIcon(result.status)}
                    </div>
                    
                    {result.results.key_metrics && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {Object.entries(result.results.key_metrics).map(([key, value]) => (
                          <div key={key} className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">{key}</p>
                            <p className="text-lg font-bold">{value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {result.results.insights && (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold mb-2">Key Findings:</p>
                        {result.results.insights.map((insight, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <BarChart3 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{insight}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detailed View Modal */}
      <AnimatePresence>
        {selectedResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedAgent(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <CardHeader className="border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${getAgentColor(selectedResult.agent_type)}`}>
                      {getAgentIcon(selectedResult.agent_type)}
                    </div>
                    <div>
                      <CardTitle>{selectedResult.agent_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedResult.agent_type}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedAgent(null)}
                  >
                    <XCircle className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-muted-foreground">{selectedResult.results.summary}</p>
                  </div>
                  
                  {selectedResult.results.key_metrics && (
                    <div>
                      <h3 className="font-semibold mb-3">Key Metrics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(selectedResult.results.key_metrics).map(([key, value]) => (
                          <div key={key} className="p-4 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">{key}</p>
                            <p className="text-2xl font-bold">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedResult.results.insights && (
                    <div>
                      <h3 className="font-semibold mb-3">Insights</h3>
                      <div className="space-y-2">
                        {selectedResult.results.insights.map((insight, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Confidence: </span>
                        <Badge variant="outline" className="ml-1">
                          {(selectedResult.results.confidence || 0) * 100}%
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Processing Time: </span>
                        <span className="font-semibold">{selectedResult.results.processing_time_ms}ms</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={getAgentColor(selectedResult.agent_type)}>
                      {selectedResult.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

