import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLiveStream } from '@/hooks/useLiveStream';
import { useStrategy, StrategyProvider } from '@/hooks/useStrategy';
import { 
  Bot, 
  Play, 
  Pause, 
  Settings, 
  Activity, 
  Target, 
  Zap, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Brain,
  MapPin,
  Gauge,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Available tracks
const TRACKS = [
  { id: 'cota', name: 'Circuit of the Americas', location: 'Austin, Texas' },
  { id: 'road_america', name: 'Road America', location: 'Elkhart Lake, Wisconsin' },
  { id: 'sebring', name: 'Sebring International', location: 'Sebring, Florida' },
  { id: 'sonoma', name: 'Sonoma Raceway', location: 'Sonoma, California' },
  { id: 'barber', name: 'Barber Motorsports Park', location: 'Birmingham, Alabama' },
  { id: 'vir', name: 'Virginia International Raceway', location: 'Alton, Virginia' },
  { id: 'indianapolis', name: 'Indianapolis Motor Speedway', location: 'Indianapolis, Indiana' },
];

// Agent types
const AGENT_TYPES = [
  { id: 'strategy', name: 'Strategy Agent', description: 'Optimizes race strategy and pit stop timing', icon: Target },
  { id: 'tire', name: 'Tire Wear Predictor', description: 'Predicts tire degradation and optimal pit windows', icon: Gauge },
  { id: 'performance', name: 'Performance Analyzer', description: 'Analyzes driver performance and lap times', icon: BarChart3 },
  { id: 'anomaly', name: 'Anomaly Detector', description: 'Detects anomalies in telemetry data', icon: AlertCircle },
  { id: 'coach', name: 'Driver Coach', description: 'Provides real-time coaching recommendations', icon: Brain },
];

interface AgentConfig {
  name: string;
  type: string;
  track: string;
  vehicle: number;
  race: number;
  description: string;
  parameters: {
    confidenceThreshold: number;
    updateFrequency: number;
    enableRealTime: boolean;
    strategyAggressiveness: 'conservative' | 'balanced' | 'aggressive';
  };
}

interface AgentDecision {
  id: string;
  timestamp: number;
  type: string;
  action: string;
  confidence: number;
  reasoning: string[];
  evidence: Record<string, any>;
}

export function CreateAgentPageContent() {
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    name: '',
    type: 'strategy',
    track: 'cota',
    vehicle: 7,
    race: 1,
    description: '',
    parameters: {
      confidenceThreshold: 0.75,
      updateFrequency: 5,
      enableRealTime: true,
      strategyAggressiveness: 'balanced',
    },
  });

  const [isActive, setIsActive] = useState(false);
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Get track name for API - use track id directly
  const trackName = agentConfig.track || 'cota';
  
  // Use live stream hook for real-time telemetry
  const { data: liveData, connected, error: streamError } = useLiveStream(
    trackName,
    agentConfig.race,
    agentConfig.vehicle,
    1
  );

  // Use strategy hook for real-time strategy data
  const { strategy, predictions, alerts, isLoading: strategyLoading, refreshPrediction } = useStrategy();
  
  // Update strategy when track/vehicle changes
  useEffect(() => {
    if (liveData?.meta?.lap) {
      const normalizedTrack = agentConfig.track.toLowerCase().replace(/\s+/g, '_');
      refreshPrediction(normalizedTrack, `GR86-016-${agentConfig.vehicle}`, liveData?.meta?.lap).catch(console.error);
    }
  }, [agentConfig.track, agentConfig.vehicle, liveData?.meta?.lap, refreshPrediction]);

  const generateAgentDecision = useCallback(() => {
    if (!liveData || !liveData.tire_wear || !liveData.gap_analysis || !liveData.meta) return;

    const decision: AgentDecision = {
      id: `decision-${Date.now()}`,
      timestamp: Date.now(),
      type: agentConfig.type,
      action: getActionForType(agentConfig.type),
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      reasoning: generateReasoning(agentConfig.type, liveData, strategy),
      evidence: {
        tireWear: liveData.tire_wear,
        position: liveData.gap_analysis?.position ?? 0,
        gapToLeader: liveData.gap_analysis?.gap_to_leader ?? 'N/A',
        currentLap: liveData.meta?.lap ?? 0,
      },
    };

    setDecisions(prev => [decision, ...prev.slice(0, 19)]); // Keep last 20
  }, [liveData, strategy, agentConfig.type]);

  // Simulate agent decisions based on live data
  useEffect(() => {
    if (!isActive || !liveData) return;

    const interval = setInterval(() => {
      generateAgentDecision();
    }, agentConfig.parameters.updateFrequency * 1000);

    return () => clearInterval(interval);
  }, [isActive, liveData, agentConfig.parameters.updateFrequency, generateAgentDecision]);

  const getActionForType = (type: string): string => {
    switch (type) {
      case 'strategy':
        return 'Recommend pit stop window';
      case 'tire':
        return 'Tire wear critical - pit recommended';
      case 'performance':
        return 'Performance optimization opportunity';
      case 'anomaly':
        return 'Anomaly detected in telemetry';
      case 'coach':
        return 'Coaching recommendation available';
      default:
        return 'Agent decision';
    }
  };

  const generateReasoning = (type: string, data: any, strategyData: any): string[] => {
    const reasoning: string[] = [];
    
    if (type === 'strategy') {
      if (data?.tire_wear) {
        const frontLeft = data.tire_wear.front_left ?? 0;
        const frontRight = data.tire_wear.front_right ?? 0;
        const rearLeft = data.tire_wear.rear_left ?? 0;
        const rearRight = data.tire_wear.rear_right ?? 0;
        const avgWear = (frontLeft + frontRight + rearLeft + rearRight) / 4;
        reasoning.push(`Average tire wear: ${avgWear.toFixed(1)}%`);
        if (data.tire_wear.pit_window_optimal && Array.isArray(data.tire_wear.pit_window_optimal) && data.tire_wear.pit_window_optimal.length >= 2) {
          reasoning.push(`Optimal pit window: Laps ${data.tire_wear.pit_window_optimal[0]}-${data.tire_wear.pit_window_optimal[1]}`);
        }
      }
      if (strategyData?.pitWindow) {
        reasoning.push(`Current strategy pit window: Laps ${strategyData.pitWindow.start}-${strategyData.pitWindow.end}`);
      }
    } else if (type === 'tire') {
      if (data?.tire_wear) {
        reasoning.push(`Front left: ${(data.tire_wear.front_left ?? 0).toFixed(1)}% remaining`);
        reasoning.push(`Front right: ${(data.tire_wear.front_right ?? 0).toFixed(1)}% remaining`);
        reasoning.push(`Rear left: ${(data.tire_wear.rear_left ?? 0).toFixed(1)}% remaining`);
        reasoning.push(`Rear right: ${(data.tire_wear.rear_right ?? 0).toFixed(1)}% remaining`);
      }
    } else if (type === 'performance') {
      if (data?.performance) {
        reasoning.push(`Current lap: ${data.performance.current_lap ?? 'N/A'}`);
        reasoning.push(`Best lap: ${data.performance.best_lap ?? 'N/A'}`);
        reasoning.push(`Gap to leader: ${data.performance.gap_to_leader ?? 'N/A'}`);
      }
    } else if (type === 'anomaly') {
      reasoning.push('Analyzing telemetry patterns...');
      reasoning.push('Comparing against historical baselines');
    } else if (type === 'coach') {
      reasoning.push('Analyzing driver performance metrics');
      reasoning.push('Comparing sector times');
    }

    return reasoning;
  };

  const handleCreateAgent = async () => {
    if (!agentConfig.name || !agentConfig.track) {
      return;
    }

    setIsCreating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsCreating(false);
    setIsActive(true);
    
    // Refresh strategy data
    const normalizedTrack = agentConfig.track.toLowerCase().replace(/\s+/g, '_');
    refreshPrediction(normalizedTrack, `GR86-016-${agentConfig.vehicle}`, liveData?.meta?.lap).catch(console.error);
  };

  const handleStopAgent = () => {
    setIsActive(false);
  };

  const selectedTrack = TRACKS.find(t => t.id === agentConfig.track);
  const selectedAgentType = AGENT_TYPES.find(t => t.id === agentConfig.type);
  const AgentIcon = selectedAgentType?.icon || Bot;

  return (
    <div className="w-full space-y-6 py-4 sm:py-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
              <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                Create Your Own AI Agent
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl">
            Build custom AI agents that work with real-time track data and strategy analytics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column: Agent Configuration */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-card via-card to-card/95 border-b">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  Agent Configuration
                </CardTitle>
                <CardDescription>
                  Configure your AI agent's behavior and parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="agent-name">Agent Name</Label>
                  <Input
                    id="agent-name"
                    placeholder="My Strategy Agent"
                    value={agentConfig.name}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agent-type">Agent Type</Label>
                  <Select
                    value={agentConfig.type}
                    onValueChange={(value) => setAgentConfig(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger id="agent-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENT_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.id} value={type.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span>{type.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {selectedAgentType && (
                    <p className="text-sm text-muted-foreground">{selectedAgentType.description}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track">Track</Label>
                  <Select
                    value={agentConfig.track}
                    onValueChange={(value) => setAgentConfig(prev => ({ ...prev, track: value }))}
                  >
                    <SelectTrigger id="track">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRACKS.map((track) => (
                        <SelectItem key={track.id} value={track.id}>
                          <div className="flex flex-col">
                            <span>{track.name}</span>
                            <span className="text-xs text-muted-foreground">{track.location}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Vehicle Number</Label>
                    <Input
                      id="vehicle"
                      type="number"
                      min="1"
                      max="200"
                      value={agentConfig.vehicle}
                      onChange={(e) => setAgentConfig(prev => ({ ...prev, vehicle: parseInt(e.target.value) || 7 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="race">Race Number</Label>
                    <Input
                      id="race"
                      type="number"
                      min="1"
                      max="10"
                      value={agentConfig.race}
                      onChange={(e) => setAgentConfig(prev => ({ ...prev, race: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this agent should focus on..."
                    value={agentConfig.description}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h3 className="font-semibold text-sm">Advanced Parameters</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confidence">Confidence Threshold</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="confidence"
                        type="number"
                        min="0"
                        max="1"
                        step="0.05"
                        value={agentConfig.parameters.confidenceThreshold}
                        onChange={(e) => setAgentConfig(prev => ({
                          ...prev,
                          parameters: {
                            ...prev.parameters,
                            confidenceThreshold: parseFloat(e.target.value) || 0.75
                          }
                        }))}
                      />
                      <span className="text-sm text-muted-foreground w-12">
                        {(agentConfig.parameters.confidenceThreshold * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">Update Frequency (seconds)</Label>
                    <Input
                      id="frequency"
                      type="number"
                      min="1"
                      max="60"
                      value={agentConfig.parameters.updateFrequency}
                      onChange={(e) => setAgentConfig(prev => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          updateFrequency: parseInt(e.target.value) || 5
                        }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aggressiveness">Strategy Aggressiveness</Label>
                    <Select
                      value={agentConfig.parameters.strategyAggressiveness}
                      onValueChange={(value: 'conservative' | 'balanced' | 'aggressive') => setAgentConfig(prev => ({
                        ...prev,
                        parameters: {
                          ...prev.parameters,
                          strategyAggressiveness: value
                        }
                      }))}
                    >
                      <SelectTrigger id="aggressiveness">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4">
                  {!isActive ? (
                    <Button
                      onClick={handleCreateAgent}
                      disabled={!agentConfig.name || isCreating}
                      className="w-full"
                      size="lg"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating Agent...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Create & Activate Agent
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopAgent}
                      variant="destructive"
                      className="w-full"
                      size="lg"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Stop Agent
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Agent Status */}
            {isActive && (
              <Card className="overflow-hidden border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20">
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/20">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    Agent Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-sm font-medium">Track Data</span>
                    <Badge 
                      variant={connected ? "outline" : "destructive"}
                      className={connected ? "bg-green-500/10 text-green-500 border-green-500/50" : ""}
                    >
                      {connected ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                          Connected
                        </>
                      ) : (
                        'Disconnected'
                      )}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-sm font-medium">Decisions Made</span>
                    <span className="font-bold text-lg text-primary">{decisions.length}</span>
                  </div>
                  {selectedTrack && (
                    <div className="pt-3 mt-3 border-t border-border/50">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Track:</span>
                        <span className="text-sm font-semibold">{selectedTrack.name}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Real-Time Data & Decisions */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Tabs defaultValue="decisions" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-muted/30 p-1.5 rounded-lg">
                <TabsTrigger value="decisions" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Brain className="w-4 h-4 mr-2" />
                  Agent Decisions
                </TabsTrigger>
                <TabsTrigger value="telemetry" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Live Telemetry
                </TabsTrigger>
                <TabsTrigger value="strategy" className="data-[state=active]:bg-card data-[state=active]:shadow-sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Strategy Data
                </TabsTrigger>
              </TabsList>

              <TabsContent value="decisions" className="space-y-4">
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-card via-card to-card/95 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Brain className="w-5 h-5 text-primary" />
                      </div>
                      Agent Decisions
                    </CardTitle>
                    <CardDescription>
                      Real-time decisions made by your AI agent
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    {decisions.length === 0 ? (
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
                        <div className="relative text-center py-16 px-6">
                          {isActive ? (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="space-y-4"
                            >
                              <div className="relative inline-block">
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary relative z-10" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-base font-medium">Analyzing telemetry data...</p>
                                <p className="text-sm text-muted-foreground">Your agent is processing real-time information</p>
                              </div>
                              <div className="flex items-center justify-center gap-2 pt-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
                                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4"
                            >
                              <div className="relative inline-block">
                                <div className="absolute inset-0 bg-muted/50 rounded-full blur-2xl" />
                                <div className="relative p-6 rounded-2xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 backdrop-blur-sm">
                                  <Bot className="w-16 h-16 mx-auto text-muted-foreground/60" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <p className="text-base font-semibold">No decisions yet</p>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                  Create and activate your agent to start receiving real-time AI-powered decisions
                                </p>
                              </div>
                              <div className="pt-2">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-sm text-muted-foreground">
                                  <Play className="w-4 h-4" />
                                  <span>Configure your agent to begin</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
                        <AnimatePresence mode="popLayout">
                          {decisions.map((decision, index) => (
                            <motion.div
                              key={decision.id}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, x: -20, scale: 0.95 }}
                              transition={{ 
                                duration: 0.3,
                                delay: index === 0 ? 0 : 0.05
                              }}
                              className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/20 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                              {/* Gradient accent bar */}
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/40" />
                              
                              <div className="p-5 space-y-3 pl-6">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="mt-0.5 p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                      <AgentIcon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <span className="font-semibold text-base">{decision.action}</span>
                                        <Badge 
                                          variant="outline" 
                                          className="ml-auto bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                                        >
                                          <div className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 animate-pulse" />
                                          {(decision.confidence * 100).toFixed(0)}% confidence
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                        <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                        {new Date(decision.timestamp).toLocaleTimeString()}
                                      </div>
                                      <div className="space-y-2">
                                        {decision.reasoning.map((reason, idx) => (
                                          <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="text-sm flex items-start gap-2.5 text-foreground/90"
                                          >
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                                            <span className="leading-relaxed">{reason}</span>
                                          </motion.div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Evidence summary */}
                                {decision.evidence && (
                                  <div className="pt-3 mt-3 border-t border-border/30 flex items-center gap-4 text-xs">
                                    {decision.evidence.currentLap && (
                                      <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Activity className="w-3.5 h-3.5" />
                                        <span>Lap {decision.evidence.currentLap}</span>
                                      </div>
                                    )}
                                    {decision.evidence.position && (
                                      <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <Target className="w-3.5 h-3.5" />
                                        <span>P{decision.evidence.position}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="telemetry" className="space-y-4">
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-card via-card to-card/95 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      Live Telemetry Data
                    </CardTitle>
                    <CardDescription>
                      Real-time track data from {selectedTrack?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {!connected ? (
                      <div className="relative overflow-hidden rounded-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-destructive/10" />
                        <div className="relative text-center py-16 px-6">
                          <div className="relative inline-block mb-4">
                            <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl" />
                            <div className="relative p-4 rounded-full bg-destructive/10 border border-destructive/20">
                              <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-base font-semibold">Not connected to telemetry stream</p>
                            <p className="text-sm text-muted-foreground">
                              Ensure your agent is active and track data is available
                            </p>
                            {streamError && (
                              <p className="text-sm text-destructive mt-3 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20 inline-block">
                                {streamError.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : !liveData ? (
                      <div className="relative overflow-hidden rounded-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
                        <div className="relative text-center py-16 px-6">
                          <div className="relative inline-block mb-4">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                            <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary relative z-10" />
                          </div>
                          <p className="text-base font-medium">Loading telemetry data...</p>
                          <p className="text-sm text-muted-foreground mt-1">Establishing connection to track sensors</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                          <div className="p-5 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Current Lap</Label>
                            <div className="flex items-baseline gap-2">
                              <p className="text-4xl font-bold">{liveData?.meta?.lap ?? 0}</p>
                              <span className="text-lg text-muted-foreground">/ {liveData?.meta?.total_laps ?? 0}</span>
                            </div>
                          </div>
                          <div className="p-5 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Position</Label>
                            <p className="text-4xl font-bold">#{liveData?.gap_analysis?.position ?? 0}</p>
                          </div>
                          <div className="p-5 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Gap to Leader</Label>
                            <p className="text-3xl font-bold">{liveData?.gap_analysis?.gap_to_leader ?? 'N/A'}</p>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div className="p-5 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-4 block">Tire Wear</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 rounded-lg bg-card/50 border border-border/30">
                                <p className="text-xs text-muted-foreground mb-1">Front Left</p>
                                <p className="text-2xl font-bold">{(liveData?.tire_wear?.front_left ?? 0).toFixed(1)}%</p>
                              </div>
                              <div className="p-3 rounded-lg bg-card/50 border border-border/30">
                                <p className="text-xs text-muted-foreground mb-1">Front Right</p>
                                <p className="text-2xl font-bold">{(liveData?.tire_wear?.front_right ?? 0).toFixed(1)}%</p>
                              </div>
                              <div className="p-3 rounded-lg bg-card/50 border border-border/30">
                                <p className="text-xs text-muted-foreground mb-1">Rear Left</p>
                                <p className="text-2xl font-bold">{(liveData?.tire_wear?.rear_left ?? 0).toFixed(1)}%</p>
                              </div>
                              <div className="p-3 rounded-lg bg-card/50 border border-border/30">
                                <p className="text-xs text-muted-foreground mb-1">Rear Right</p>
                                <p className="text-2xl font-bold">{(liveData?.tire_wear?.rear_right ?? 0).toFixed(1)}%</p>
                              </div>
                            </div>
                          </div>
                          {liveData?.tire_wear?.pit_window_optimal && Array.isArray(liveData.tire_wear.pit_window_optimal) && liveData.tire_wear.pit_window_optimal.length >= 2 && (
                            <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Optimal Pit Window</Label>
                              <p className="text-2xl font-bold">
                                Laps {liveData.tire_wear.pit_window_optimal[0]} - {liveData.tire_wear.pit_window_optimal[1]}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="strategy" className="space-y-4">
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-card via-card to-card/95 border-b">
                    <CardTitle className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      Strategy Analytics
                    </CardTitle>
                    <CardDescription>
                      Real-time strategy predictions and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {strategyLoading ? (
                      <div className="relative overflow-hidden rounded-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
                        <div className="relative text-center py-16 px-6">
                          <div className="relative inline-block mb-4">
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                            <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary relative z-10" />
                          </div>
                          <p className="text-base font-medium">Loading strategy data...</p>
                          <p className="text-sm text-muted-foreground mt-1">Analyzing race conditions and predictions</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-5 rounded-xl bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Current Tire Wear</Label>
                            <p className="text-4xl font-bold">{strategy?.tireWear?.current?.toFixed(1) ?? '0.0'}%</p>
                          </div>
                          <div className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Pit Window</Label>
                            <p className="text-3xl font-bold">
                              Laps {strategy?.pitWindow?.start ?? 0} - {strategy?.pitWindow?.end ?? 0}
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-semibold mb-3 block">Predicted Pit Stops</Label>
                          <div className="space-y-2">
                            {predictions?.pitStops && predictions.pitStops.length > 0 ? (
                              predictions.pitStops.map((stop, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-muted/40 to-muted/20 border border-border/50 hover:border-primary/30 transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-sm font-bold text-primary">{stop.lap}</span>
                                    </div>
                                    <span className="font-medium">Lap {stop.lap}</span>
                                  </div>
                                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                    {stop.tyreCompound}
                                  </Badge>
                                </motion.div>
                              ))
                            ) : (
                              <div className="p-8 rounded-xl bg-muted/20 border border-border/50 text-center">
                                <p className="text-sm text-muted-foreground">No pit stops predicted</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm font-semibold mb-3 block">Alerts</Label>
                          <div className="space-y-2">
                            {alerts && alerts.length > 0 ? (
                              alerts.map((alert, idx) => (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.1 }}
                                  className={`p-4 rounded-lg border ${
                                    alert.severity === 'high'
                                      ? 'border-destructive/50 bg-destructive/10 hover:bg-destructive/15'
                                      : alert.severity === 'medium'
                                      ? 'border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/15'
                                      : 'border-muted bg-muted/50 hover:bg-muted'
                                  } transition-all`}
                                >
                                  <div className="flex items-start gap-3">
                                    <AlertCircle
                                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                                        alert.severity === 'high'
                                          ? 'text-destructive'
                                          : alert.severity === 'medium'
                                          ? 'text-yellow-500'
                                          : 'text-muted-foreground'
                                      }`}
                                    />
                                    <p className="text-sm leading-relaxed">{alert.message}</p>
                                  </div>
                                </motion.div>
                              ))
                            ) : (
                              <div className="p-8 rounded-xl bg-muted/20 border border-border/50 text-center">
                                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">No alerts - all systems optimal</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateAgentPage() {
  return (
    <StrategyProvider
      defaultTrack="cota"
      defaultChassis="GR86-016-7"
      defaultLap={12}
    >
      <CreateAgentPageContent />
    </StrategyProvider>
  );
}

