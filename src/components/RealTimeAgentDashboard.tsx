import React, { useState } from 'react';
import { useAgentStream } from '@/hooks/useAgentStream';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealTimeAgentDashboardProps {
  agentId?: string;
  track?: string;
  vehicle?: string;
}

export function RealTimeAgentDashboard({ 
  agentId = 'tire-wear-predictor',
  track = 'cota',
  vehicle = 'gr86-002'
}: RealTimeAgentDashboardProps) {
  const { messages, status, isConnected, sendMessage } = useAgentStream({
    agentId,
    track,
    vehicle,
    enabled: true,
    pollInterval: 2000
  });

  const [selectedChannel, setSelectedChannel] = useState(vehicle);

  const handleTelemetryUpdate = (newData: Record<string, unknown>) => {
    sendMessage({
      type: 'telemetry_update',
      data: newData,
      channel: selectedChannel
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-500/10';
      case 'high':
        return 'border-orange-500 bg-orange-500/10';
      case 'normal':
        return 'border-blue-500 bg-blue-500/10';
      default:
        return 'border-muted bg-muted/50';
    }
  };

  return (
    <div className="agent-panel space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                getStatusColor(status)
              )} />
              <CardTitle className="text-xl">Tire Wear Predictor</CardTitle>
            </div>
            <Badge variant="outline" className="uppercase">
              {status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span>Status: {isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Track</p>
                <p className="font-semibold">{track.toUpperCase()}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Vehicle</p>
                <p className="font-semibold">{selectedChannel}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Insights Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {messages.length > 0 ? (
              messages.map((msg, idx) => (
                <div
                  key={`${msg.timestamp}-${idx}`}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-all hover:shadow-md",
                    getPriorityColor(msg.priority)
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {msg.track && (
                        <Badge variant="outline" className="text-xs">
                          {msg.track}
                        </Badge>
                      )}
                      {msg.lap && (
                        <Badge variant="secondary" className="text-xs">
                          Lap {msg.lap}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {msg.prediction && (
                    <p className="text-sm font-medium mb-2">{msg.prediction}</p>
                  )}
                  
                  {msg.confidence !== undefined && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Confidence</span>
                        <span className="font-semibold">
                          {Math.round(msg.confidence * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${msg.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No insights yet</p>
                <p className="text-xs mt-1">Waiting for telemetry data...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Telemetry Button */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={() => handleTelemetryUpdate({
              speed: 120 + Math.random() * 20,
              lap: Math.floor(Math.random() * 25) + 1,
              tire_temp: 85 + Math.random() * 10
            })}
            className="w-full"
            variant="outline"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Send Test Telemetry Update
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}



