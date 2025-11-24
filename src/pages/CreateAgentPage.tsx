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

function CreateAgentPageContent() {
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

  // Get track name for API
  const trackName = TRACKS.find(t => t.id === agentConfig.track)?.id || 'cota';
  
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
    if (liveData?.meta.lap) {
      refreshPrediction(agentConfig.track, `GR86-016-${agentConfig.vehicle}`, liveData.meta.lap);
    }
  }, [agentConfig.track, agentConfig.vehicle, liveData?.meta.lap, refreshPrediction]);

  const generateAgentDecision = useCallback(() => {
    if (!liveData) return;

    const decision: AgentDecision = {
      id: `decision-${Date.now()}`,
      timestamp: Date.now(),
      type: agentConfig.type,
      action: getActionForType(agentConfig.type),
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      reasoning: generateReasoning(agentConfig.type, liveData, strategy),
      evidence: {
        tireWear: liveData.tire_wear,
        position: liveData.gap_analysis.position,
        gapToLeader: liveData.gap_analysis.gap_to_leader,
        currentLap: liveData.meta.lap,
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
      if (data.tire_wear) {
        const avgWear = (
          data.tire_wear.front_left +
          data.tire_wear.front_right +
          data.tire_wear.rear_left +
          data.tire_wear.rear_right
        ) / 4;
        reasoning.push(`Average tire wear: ${avgWear.toFixed(1)}%`);
        if (data.tire_wear.pit_window_optimal) {
          reasoning.push(`Optimal pit window: Laps ${data.tire_wear.pit_window_optimal[0]}-${data.tire_wear.pit_window_optimal[1]}`);
        }
      }
      if (strategyData?.pitWindow) {
        reasoning.push(`Current strategy pit window: Laps ${strategyData.pitWindow.start}-${strategyData.pitWindow.end}`);
      }
    } else if (type === 'tire') {
      if (data.tire_wear) {
        reasoning.push(`Front left: ${data.tire_wear.front_left.toFixed(1)}% remaining`);
        reasoning.push(`Front right: ${data.tire_wear.front_right.toFixed(1)}% remaining`);
        reasoning.push(`Rear left: ${data.tire_wear.rear_left.toFixed(1)}% remaining`);
        reasoning.push(`Rear right: ${data.tire_wear.rear_right.toFixed(1)}% remaining`);
      }
    } else if (type === 'performance') {
      if (data.performance) {
        reasoning.push(`Current lap: ${data.performance.current_lap}`);
        reasoning.push(`Best lap: ${data.performance.best_lap}`);
        reasoning.push(`Gap to leader: ${data.performance.gap_to_leader}`);
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
    refreshPrediction(agentConfig.track, `GR86-016-${agentConfig.vehicle}`, liveData?.meta.lap);
  };

  const handleStopAgent = () => {
    setIsActive(false);
  };

  const selectedTrack = TRACKS.find(t => t.id === agentConfig.track);
  const selectedAgentType = AGENT_TYPES.find(t => t.id === agentConfig.type);
  const AgentIcon = selectedAgentType?.icon || Bot;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Create Your Own AI Agent</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Build custom AI agents that work with real-time track data and strategy analytics
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Agent Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Agent Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Track Data</span>
                    <Badge variant={connected ? "outline" : "destructive"}>
                      {connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Decisions Made</span>
                    <span className="font-semibold">{decisions.length}</span>
                  </div>
                  {selectedTrack && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Track:</span>
                        <span className="font-medium">{selectedTrack.name}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Real-Time Data & Decisions */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="decisions" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="decisions">Agent Decisions</TabsTrigger>
                <TabsTrigger value="telemetry">Live Telemetry</TabsTrigger>
                <TabsTrigger value="strategy">Strategy Data</TabsTrigger>
              </TabsList>

              <TabsContent value="decisions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Agent Decisions
                    </CardTitle>
                    <CardDescription>
                      Real-time decisions made by your AI agent
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {decisions.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        {isActive ? (
                          <div className="space-y-2">
                            <Loader2 className="w-8 h-8 mx-auto animate-spin" />
                            <p>Waiting for agent decisions...</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Bot className="w-8 h-8 mx-auto opacity-50" />
                            <p>Start your agent to see decisions here</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <AnimatePresence>
                          {decisions.map((decision) => (
                            <motion.div
                              key={decision.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              className="border rounded-lg p-4 space-y-2"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <AgentIcon className="w-4 h-4 text-primary" />
                                    <span className="font-semibold">{decision.action}</span>
                                    <Badge variant="outline" className="ml-auto">
                                      {(decision.confidence * 100).toFixed(0)}% confidence
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground mb-2">
                                    {new Date(decision.timestamp).toLocaleTimeString()}
                                  </div>
                                  <div className="space-y-1">
                                    {decision.reasoning.map((reason, idx) => (
                                      <div key={idx} className="text-sm flex items-start gap-2">
                                        <span className="text-muted-foreground">•</span>
                                        <span>{reason}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Live Telemetry Data
                    </CardTitle>
                    <CardDescription>
                      Real-time track data from {selectedTrack?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!connected ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                        <p>Not connected to telemetry stream</p>
                        {streamError && (
                          <p className="text-sm text-destructive mt-2">{streamError.message}</p>
                        )}
                      </div>
                    ) : !liveData ? (
                      <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin" />
                        <p className="text-muted-foreground mt-2">Loading telemetry data...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Current Lap</Label>
                            <p className="text-2xl font-bold">{liveData.meta.lap} / {liveData.meta.total_laps}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Position</Label>
                            <p className="text-2xl font-bold">#{liveData.gap_analysis.position}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Gap to Leader</Label>
                            <p className="text-xl font-semibold">{liveData.gap_analysis.gap_to_leader}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Tire Wear</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <p className="text-xs text-muted-foreground">Front Left</p>
                                <p className="text-lg font-semibold">{liveData.tire_wear.front_left.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Front Right</p>
                                <p className="text-lg font-semibold">{liveData.tire_wear.front_right.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Rear Left</p>
                                <p className="text-lg font-semibold">{liveData.tire_wear.rear_left.toFixed(1)}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Rear Right</p>
                                <p className="text-lg font-semibold">{liveData.tire_wear.rear_right.toFixed(1)}%</p>
                              </div>
                            </div>
                          </div>
                          {liveData.tire_wear.pit_window_optimal && (
                            <div>
                              <Label className="text-xs text-muted-foreground">Optimal Pit Window</Label>
                              <p className="text-lg font-semibold">
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Strategy Analytics
                    </CardTitle>
                    <CardDescription>
                      Real-time strategy predictions and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {strategyLoading ? (
                      <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin" />
                        <p className="text-muted-foreground mt-2">Loading strategy data...</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs text-muted-foreground">Current Tire Wear</Label>
                            <p className="text-2xl font-bold">{strategy.tireWear.current.toFixed(1)}%</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Pit Window</Label>
                            <p className="text-xl font-semibold">
                              Laps {strategy.pitWindow.start} - {strategy.pitWindow.end}
                            </p>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Predicted Pit Stops</Label>
                          <div className="space-y-2">
                            {predictions.pitStops.map((stop, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                                <span>Lap {stop.lap}</span>
                                <Badge>{stop.tyreCompound}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground mb-2 block">Alerts</Label>
                          <div className="space-y-2">
                            {alerts.map((alert, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded border ${
                                  alert.severity === 'high'
                                    ? 'border-destructive bg-destructive/10'
                                    : alert.severity === 'medium'
                                    ? 'border-yellow-500 bg-yellow-500/10'
                                    : 'border-muted bg-muted'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <AlertCircle
                                    className={`w-4 h-4 mt-0.5 ${
                                      alert.severity === 'high'
                                        ? 'text-destructive'
                                        : alert.severity === 'medium'
                                        ? 'text-yellow-500'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                  <p className="text-sm">{alert.message}</p>
                                </div>
                              </div>
                            ))}
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

