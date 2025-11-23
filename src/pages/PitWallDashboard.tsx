// src/pages/PitWallDashboard.tsx

import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Flag, Wifi, WifiOff, Activity, MapPin, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import TrackSelector, { TRACKS } from "@/components/TrackSelector";
import LiveMapSVG from "@/components/LiveMapSVG";
import PredictionPanel from "@/components/PredictionPanel";
import MultiTrackSummary from "@/components/MultiTrackSummary";
import { DemoModeToggle } from "@/components/DemoModeToggle";
import { AnomalyAlerts } from "@/components/anomaly/AnomalyAlerts";
import RealTimeTimeSeriesChart from "@/components/pitwall/RealTimeTimeSeriesChart";
import DemoButton, { type DemoData } from "@/components/pitwall/DemoButton";
import AIAgentDecisions, { type AgentDecision } from "@/components/pitwall/AIAgentDecisions";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useDemoWs } from "@/hooks/useDemoWs";
import { useDemoMode } from "@/hooks/useDemoMode";
import { useMockAgentDecisions, useMockTelemetryStream } from "@/hooks/useMockDemoData";
import { useMockNotifications } from "@/hooks/useMockNotifications";

import { getWsUrl } from "@/utils/wsUrl";

export default function PitWallDashboard() {
  const [track, setTrack] = useState(TRACKS[0]);
  const { isDemoMode, setIsDemoMode } = useDemoMode();
  const [demoData, setDemoData] = useState<DemoData | null>(null);
  const [agentDecisions, setAgentDecisions] = useState<AgentDecision[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<AgentDecision | null>(null);
  
  // Automatically enable demo mode when pitwall page loads
  useEffect(() => {
    // Enable demo mode on mount if not already set
    // This ensures demo data is activated when visiting the pitwall page
    setIsDemoMode(true);
  }, [setIsDemoMode]);

  // Enable mock notifications throughout the pitwall dashboard
  useMockNotifications({ enabled: true, intervalMs: 25000, autoStart: true });

  // Handle demo data loading
  const handleLoadDemo = (data: DemoData) => {
    try {
      setDemoData(data);
      // Convert demo decisions to AgentDecision format
      if (data.decisions && Array.isArray(data.decisions)) {
        const decisions: AgentDecision[] = data.decisions.map((d) => ({
          decision_id: d.decision_id || `decision-${Date.now()}-${Math.random()}`,
          agent_id: d.agent_id || 'unknown',
          agent_type: d.agent_type || 'unknown',
          track: d.track || 'unknown',
          chassis: d.chassis || 'unknown',
          vehicle_number: d.vehicle_number,
          timestamp: d.timestamp || new Date().toISOString(),
          decision_type: (d.decision_type as AgentDecision["decision_type"]) || 'strategy',
          action: d.action || 'No action specified',
          confidence: typeof d.confidence === 'number' ? d.confidence : 0.5,
          risk_level: (d.risk_level as AgentDecision["risk_level"]) || 'moderate',
          reasoning: Array.isArray(d.reasoning) ? d.reasoning : [],
          evidence: d.evidence || {},
        }));
        setAgentDecisions(decisions);
      }
    } catch (error) {
      console.error('Error processing demo data:', error);
      // Set empty decisions array on error
      setAgentDecisions([]);
    }
  };

  // Get mock agent decisions when in demo mode
  const mockAgentDecisions = useMockAgentDecisions(track);
  
  // Get mock telemetry stream when in demo mode
  const mockTelemetry = useMockTelemetryStream(track, 7, 500);
  
  // Filter decisions by current track
  const filteredDecisions = useMemo(() => {
    // Use mock data if in demo mode and available
    if (isDemoMode && mockAgentDecisions.length > 0) {
      const trackId = track.toLowerCase();
      return mockAgentDecisions.filter((d) => d.track.toLowerCase() === trackId);
    }
    
    // Otherwise use loaded demo data
    if (agentDecisions.length === 0) return [];
    const trackId = track.toLowerCase();
    return agentDecisions.filter((d) => d.track.toLowerCase() === trackId);
  }, [isDemoMode, mockAgentDecisions, agentDecisions, track]);
  
  // Use demo WebSocket when in demo mode, otherwise use regular WebSocket
  const demoWs = useDemoWs({
    url: 'ws://localhost:8081/ws/demo',
    autoConnect: isDemoMode && mockTelemetry.length === 0 // Only connect if no mock data
  });
  
  const regularWsUrl = isDemoMode ? '' : getWsUrl('/ws');
  const regularWs = useWebSocket(regularWsUrl, {
    batchMs: 80,
    maxBuffer: 2000,
    maxMessages: 500,
  });
  
  // Use mock telemetry if available, otherwise use WebSocket data
  const connected = isDemoMode 
    ? (mockTelemetry.length > 0 ? true : demoWs.connected)
    : regularWs.connected;
  const messages = isDemoMode 
    ? (mockTelemetry.length > 0 ? mockTelemetry : demoWs.points)
    : regularWs.messages;
  const messageCount = messages.length;
  // derive last telemetry point for car position
  const lastPoint = useMemo(() => messages.length ? messages[messages.length-1] : null, [messages]);
  
  // Helper function to safely extract numeric value from telemetry point
  const getTelemetryValue = (point: unknown, key: string, defaultValue: number): number => {
    if (point && typeof point === 'object' && key in point) {
      const value = (point as Record<string, unknown>)[key];
      if (typeof value === 'number') {
        return value;
      }
    }
    return defaultValue;
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,38,38,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                <Flag className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  PitWall <span className="text-primary">A.I.</span> Dashboard
                </h1>
                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  Real-time analysis across 7 tracks
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <DemoButton onLoadDemo={handleLoadDemo} />
              <DemoModeToggle />
              <Badge 
                variant={connected || isDemoMode ? "default" : "secondary"}
                className={`flex items-center gap-2 px-4 py-2 ${
                  connected || isDemoMode
                    ? "bg-primary/20 text-primary border-primary/30" 
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDemoMode ? (
                  <>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                    <Activity className="w-4 h-4" />
                    <span className="font-semibold">DEMO</span>
                  </>
                ) : connected ? (
                  <>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
                    <Wifi className="w-4 h-4" />
                    <span className="font-semibold">LIVE</span>
                    {messageCount > 0 && (
                      <span className="text-xs ml-1">({messageCount})</span>
                    )}
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span>Offline</span>
                  </>
                )}
              </Badge>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6 relative z-10 space-y-6">
        {/* Track Selector and Stats */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-card/60 backdrop-blur-md rounded-xl border border-border/50 shadow-lg"
        >
          <TrackSelector value={track} onChange={setTrack} />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border/50">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                <span className="text-muted-foreground">Telemetry: </span>
                <span className="font-bold text-foreground">{messages.length}</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Track Map - Full Width */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.01 }}
          className="group"
        >
          <Card className="bg-card/80 backdrop-blur-lg border-border/50 hover:border-primary/50 shadow-2xl shadow-black/20 hover:shadow-primary/20 overflow-hidden transition-all duration-500">
            <CardHeader className="pb-3 bg-gradient-to-r from-card via-card/95 to-card/90 border-b border-border/50">
              <CardTitle className="flex items-center gap-2">
                <motion.div
                  animate={connected ? { rotate: [0, 360] } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <MapPin className="w-5 h-5 text-primary" />
                </motion.div>
                <span>Live Track Map</span>
                {connected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto"
                  >
                    <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse mr-2" />
                      LIVE
                    </Badge>
                  </motion.div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 relative">
              <div className="bg-gradient-to-br from-card via-card/95 to-card/90 p-6 relative overflow-hidden">
                {/* Animated background pattern on hover */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(220,38,38,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-primary/0 transition-all duration-500 pointer-events-none" />
                
                <div className="relative z-10">
                  <LiveMapSVG 
                    track={track} 
                    lapdist={lastPoint ? getTelemetryValue(lastPoint, 'lapdist_m', 0) : 0} 
                    totalMeters={lastPoint ? getTelemetryValue(lastPoint, 'track_total_m', 6515) : 6515}
                    className="w-full h-[calc(100vh-400px)] min-h-[600px] bg-gradient-to-br from-card/90 via-card/70 to-card/50 rounded-md p-4 relative overflow-hidden border border-border/50 group-hover:border-primary/30 transition-all duration-500"
                  />
                </div>
                
                {/* Track info overlay */}
                {lastPoint && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-6 left-6 right-6 z-20"
                  >
                    <div className="bg-background/90 backdrop-blur-md rounded-lg p-3 border border-border/50 shadow-lg">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">LAP DISTANCE</div>
                          <div className="text-sm font-bold text-primary">
                            {((lastPoint ? getTelemetryValue(lastPoint, 'lapdist_m', 0) : 0) / 1000).toFixed(2)} km
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">SPEED</div>
                          <div className="text-sm font-bold text-foreground">
                            {lastPoint ? Math.round(getTelemetryValue(lastPoint, 'Speed', 0)) : 0} mph
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">LAP</div>
                          <div className="text-sm font-bold text-foreground">
                            {lastPoint ? getTelemetryValue(lastPoint, 'lap', 1) : 1}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bottom Section - Charts and Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Section - Charts and Prediction Panel */}
          <section className="col-span-1 lg:col-span-2 space-y-6">
            {/* Charts and Prediction Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="md:col-span-2"
              >
                <Card className="bg-card/80 backdrop-blur-lg border-border/50 shadow-xl h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      Real-time Time Series
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RealTimeTimeSeriesChart 
                      messages={messages} 
                      maxDataPoints={300}
                      height={320}
                    />
                  </CardContent>
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="md:col-span-1"
              >
                <PredictionPanel track={track} />
              </motion.div>
            </div>
          </section>

          {/* Right Sidebar - Multi Track Summary */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 space-y-6"
          >
            <MultiTrackSummary chassis="GR86-DEMO-01" />
            
            {/* AI Agent Decisions */}
            <AIAgentDecisions
              decisions={filteredDecisions.length > 0 ? filteredDecisions : agentDecisions}
              onDecisionClick={setSelectedDecision}
              maxDisplay={5}
            />
            
            {/* Agent Statistics */}
            {demoData && demoData.meta && (
              <Card className="bg-card/80 backdrop-blur-lg border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">AI Agents Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Agents:</span>
                    <span className="font-semibold">{demoData.meta.total_agents || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Decisions:</span>
                    <span className="font-semibold">{demoData.meta.total_decisions || 0}</span>
                  </div>
                  {demoData.agents && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground mb-1">Agent Types:</div>
                      <div className="flex flex-wrap gap-1">
                        {Array.from(new Set(demoData.agents.map(a => a.type))).map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {type.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Anomaly Detection Alerts */}
            {lastPoint && (
              <AnomalyAlerts
                vehicleId={`vehicle_${getTelemetryValue(lastPoint, 'vehicle_number', 7)}`}
                vehicleNumber={getTelemetryValue(lastPoint, 'vehicle_number', 7)}
                maxAlerts={5}
                autoDismiss={true}
                dismissAfter={10000}
              />
            )}
          </motion.aside>
        </div>
      </main>

      {/* Decision Detail Modal */}
      {selectedDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-xl border border-border shadow-2xl"
          >
            <Card className="border-0">
              <CardHeader className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-10">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{selectedDecision.action}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDecision(null)}
                    className="h-8 w-8"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{selectedDecision.agent_type.replace("_", " ")}</Badge>
                  <Badge variant="outline">{selectedDecision.track}</Badge>
                  <Badge variant="outline">{selectedDecision.chassis}</Badge>
                  <Badge variant="outline" className={selectedDecision.risk_level === "critical" ? "bg-red-500/20 text-red-400" : ""}>
                    {selectedDecision.risk_level}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Confidence */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Confidence</span>
                    <span className="text-sm font-bold">{(selectedDecision.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className="bg-primary h-3 rounded-full transition-all duration-500"
                      style={{ width: `${selectedDecision.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Reasoning */}
                {selectedDecision.reasoning && selectedDecision.reasoning.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Reasoning</h3>
                    <ul className="space-y-2">
                      {selectedDecision.reasoning.map((reason, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-primary font-bold mt-0.5">{idx + 1}.</span>
                          <span className="text-muted-foreground">{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Evidence */}
                {selectedDecision.evidence && Object.keys(selectedDecision.evidence).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Evidence</h3>
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      {Object.entries(selectedDecision.evidence).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, " ")}:
                          </span>
                          <span className="font-medium">
                            {typeof value === "object" ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alternatives */}
                {selectedDecision.alternatives && selectedDecision.alternatives.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Alternative Actions</h3>
                    <div className="space-y-3">
                      {selectedDecision.alternatives.map((alt, idx) => (
                        <div key={idx} className="border border-border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{alt.action}</span>
                            <Badge variant="outline" className="text-xs">{alt.risk}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{alt.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-xs text-muted-foreground pt-4 border-t border-border">
                  Generated: {new Date(selectedDecision.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}

