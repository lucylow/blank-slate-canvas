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

// Mock results for all 7 AI agents based on demo_data.json
const generateMockResults = (): AgentResult[] => {
  const now = new Date().toISOString();
  
  return [
    {
      agent_id: "strategy-01",
      agent_type: "strategist",
      agent_name: "Strategy Agent",
      status: "completed",
      results: {
        summary: "Analyzed race strategy for all 7 tracks. Identified optimal pit windows and undercut opportunities.",
        key_metrics: {
          "Optimal Pit Windows Identified": 14,
          "Undercut Opportunities": 8,
          "Strategy Confidence": "89%",
          "Tracks Analyzed": 7
        },
        insights: [
          "Sebring: Optimal pit window laps 15-17 for maximum undercut advantage",
          "COTA: Early pit on lap 12 recommended due to high tire degradation",
          "Road America: Two-stop strategy optimal for 25-lap race"
        ],
        confidence: 0.89,
        processing_time_ms: 187
      },
      timestamp: now
    },
    {
      agent_id: "coach-01",
      agent_type: "coach",
      agent_name: "Coach Agent",
      status: "completed",
      results: {
        summary: "Analyzed driver performance across 397 vehicles. Identified 23 coaching opportunities for lap time improvement.",
        key_metrics: {
          "Drivers Analyzed": 397,
          "Coaching Opportunities": 23,
          "Avg Improvement Potential": "0.15s/lap",
          "Consistency Score": "87%"
        },
        insights: [
          "Turn 11 COTA: 8m early braking detected, losing 0.15s per lap",
          "Sector 2 VIR: Early throttle application could gain 0.6s",
          "Barber Turn 5: Apex optimization needed, 0.3s improvement possible"
        ],
        confidence: 0.82,
        processing_time_ms: 234
      },
      timestamp: now
    },
    {
      agent_id: "anomaly-01",
      agent_type: "anomaly_detective",
      agent_name: "Anomaly Detective",
      status: "completed",
      results: {
        summary: "Scanned 41.9M telemetry points. Detected 4 anomalies requiring attention.",
        key_metrics: {
          "Data Points Scanned": "41.9M",
          "Anomalies Detected": 4,
          "False Positive Rate": "4%",
          "Detection Accuracy": "96%"
        },
        insights: [
          "Front right tire temperature anomaly detected (15°C lower than expected)",
          "Engine RPM spike detected in lap 12 - monitoring required",
          "Brake pressure inconsistency in Turn 8 - possible sensor issue"
        ],
        confidence: 0.94,
        processing_time_ms: 156
      },
      timestamp: now
    },
    {
      agent_id: "predictor-01",
      agent_type: "predictor",
      agent_name: "Predictor Agent",
      status: "completed",
      results: {
        summary: "Predicted tire degradation for all vehicles. Updated pit window recommendations based on accelerating wear.",
        key_metrics: {
          "Predictions Made": 2341,
          "Accuracy": "91%",
          "Tire Wear Predictions": 397,
          "Pit Window Updates": 12
        },
        insights: [
          "Tire degradation accelerating 12% faster than predicted - pit window moved earlier",
          "Barber: Pit window revised from lap 16-18 to lap 14-15",
          "Track temperature increase causing 3°C rise, accelerating wear"
        ],
        confidence: 0.91,
        processing_time_ms: 203
      },
      timestamp: now
    },
    {
      agent_id: "simulator-01",
      agent_type: "simulator",
      agent_name: "Simulator Agent",
      status: "completed",
      results: {
        summary: "Ran 500 race scenario simulations. Identified optimal strategies for different race conditions.",
        key_metrics: {
          "Scenarios Simulated": 500,
          "Strategy Options Evaluated": 4,
          "Best Strategy Identified": "Two-stop with early pit",
          "Simulation Accuracy": "87%"
        },
        insights: [
          "Monte Carlo simulation: Two-stop strategy optimal for 85% of scenarios",
          "Safety car scenarios favor early pit strategy",
          "Traffic analysis shows undercut window in laps 14-16"
        ],
        confidence: 0.87,
        processing_time_ms: 1247
      },
      timestamp: now
    },
    {
      agent_id: "explainer-01",
      agent_type: "explainer",
      agent_name: "Explainer Agent",
      status: "completed",
      results: {
        summary: "Generated explainable insights for all agent decisions. Provided confidence intervals and feature attribution.",
        key_metrics: {
          "Decisions Explained": 24,
          "Confidence Intervals Generated": 24,
          "Feature Attributions": 156,
          "Explainability Score": "92%"
        },
        insights: [
          "Strategy decisions: 89% confidence with ±2 lap window",
          "Tire predictions: Feature attribution shows lateral G-forces as primary driver",
          "Anomaly detection: Temperature delta of 15°C exceeds 3-sigma threshold"
        ],
        confidence: 0.92,
        processing_time_ms: 98
      },
      timestamp: now
    },
    {
      agent_id: "eda-01",
      agent_type: "eda",
      agent_name: "EDA Agent",
      status: "completed",
      results: {
        summary: "Performed exploratory data analysis on 41.9M telemetry points. Identified patterns and correlations.",
        key_metrics: {
          "Data Points Analyzed": "41.9M",
          "Patterns Identified": 12,
          "Correlations Found": 8,
          "Data Quality Score": "94%"
        },
        insights: [
          "Strong correlation between lateral G-forces and tire wear (r=0.87)",
          "Speed vs lap time correlation: r=0.92 across all tracks",
          "Temperature patterns show 3°C increase during race duration"
        ],
        confidence: 0.94,
        processing_time_ms: 3456
      },
      timestamp: now
    }
  ];
};

const getAgentIcon = (type: string) => {
  switch (type) {
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
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all">All Agents</TabsTrigger>
              <TabsTrigger value="strategy">Strategy</TabsTrigger>
              <TabsTrigger value="coach">Coach</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
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

            <TabsContent value="strategy" className="space-y-4">
              {results.filter(r => r.agent_type === "strategist" || r.agent_type === "simulator").map((result) => (
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

            <TabsContent value="coach" className="space-y-4">
              {results.filter(r => r.agent_type === "coach").map((result) => (
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

            <TabsContent value="analytics" className="space-y-4">
              {results.filter(r => 
                r.agent_type === "predictor" || 
                r.agent_type === "anomaly_detective" || 
                r.agent_type === "explainer" || 
                r.agent_type === "eda"
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

