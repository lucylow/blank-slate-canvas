import React, { useState } from 'react';
import { useAgentState } from '@/hooks/useAgentState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Activity, 
  Zap, 
  Eye, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PitwallAgent {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'analyzing' | 'monitoring' | 'idle';
}

const pitwallAgents: PitwallAgent[] = [
  {
    id: 'tire-specialist',
    name: 'Tire Specialist',
    description: 'Analyzes tire wear and degradation patterns',
    icon: <Activity className="w-5 h-5" />,
    status: 'active'
  },
  {
    id: 'fuel-strategist',
    name: 'Fuel Strategist',
    description: 'Calculates optimal fuel usage and pit windows',
    icon: <Zap className="w-5 h-5" />,
    status: 'analyzing'
  },
  {
    id: 'competitor-analyst',
    name: 'Competitor Analyst',
    description: 'Tracks competitor strategies and positions',
    icon: <Eye className="w-5 h-5" />,
    status: 'monitoring'
  }
];

export function PitwallCollaboration() {
  const { state, requestAgentAnalysis } = useAgentState({
    enabled: true,
    pollInterval: 3000
  });

  const [currentTelemetry, setCurrentTelemetry] = useState<Record<string, unknown>>({
    lap: 12,
    speed: 120,
    tire_temp: 85,
    fuel_level: 65
  });

  const [loadingAgent, setLoadingAgent] = useState<string | null>(null);

  const handleRequestAnalysis = async (agentId: string) => {
    setLoadingAgent(agentId);
    try {
      await requestAgentAnalysis(agentId, currentTelemetry);
    } catch (error) {
      console.error('Analysis request failed:', error);
    } finally {
      setLoadingAgent(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'analyzing':
        return 'bg-blue-500 animate-pulse';
      case 'monitoring':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAgentIcon = (agentId: string) => {
    return pitwallAgents.find(a => a.id === agentId)?.icon || <Users className="w-4 h-4" />;
  };

  return (
    <div className="pitwall-interface space-y-6">
      {/* Agent Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {pitwallAgents.map(agent => (
          <Card
            key={agent.id}
            className="hover:shadow-lg transition-all hover:scale-[1.02]"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {agent.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {agent.description}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  getStatusColor(agent.status)
                )} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Badge variant="outline" className="w-full justify-center">
                  {agent.status}
                </Badge>
                <Button
                  onClick={() => handleRequestAnalysis(agent.id)}
                  disabled={loadingAgent === agent.id}
                  className="w-full"
                  variant="outline"
                >
                  {loadingAgent === agent.id ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Request Analysis
                    </>
                  )}
                </Button>
            </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Collaborative Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <CardTitle>Collaborative Insights</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              {state.raceDecisions.length} decisions
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {state.raceDecisions.length > 0 ? (
              state.raceDecisions.map((decision, idx) => {
                const agent = pitwallAgents.find(a => a.id === decision.agent);
                return (
                  <div
                    key={`${decision.timestamp}-${idx}`}
                    className="decision-item p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all bg-card"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-primary/10 text-primary">
                          {getAgentIcon(decision.agent)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">
                            {agent?.name || decision.agent}
                          </p>
                          {decision.decision_type && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {decision.decision_type}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(decision.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-sm mb-3 leading-relaxed">
                      {decision.recommendation}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Confidence:</span>
                        <div className="flex items-center gap-1">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${decision.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold">
                            {Math.round(decision.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      {decision.confidence > 0.8 && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          High Confidence
                        </Badge>
                      )}
                    </div>

                    {decision.reasoning && decision.reasoning.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">
                          Reasoning
                        </p>
                        <ul className="space-y-1">
                          {decision.reasoning.slice(0, 3).map((reason, rIdx) => (
                            <li key={rIdx} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No collaborative insights yet</p>
                <p className="text-xs mt-1">
                  Request analysis from agents to see insights here
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Telemetry Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Telemetry Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(currentTelemetry).map(([key, value]) => (
              <div key={key} className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1 capitalize">
                  {key.replace(/_/g, ' ')}
                </p>
                <p className="text-lg font-semibold">{String(value)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



