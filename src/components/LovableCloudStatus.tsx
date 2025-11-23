// src/components/LovableCloudStatus.tsx
// Connection status indicator for Lovable Cloud

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { 
  getCloudConfig, 
  getHealthStatus, 
  checkBackendHealth, 
  startHealthMonitoring,
  stopHealthMonitoring,
  formatHealthStatus,
  type CloudHealthStatus 
} from '@/utils/lovableCloud';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LovableCloudStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export function LovableCloudStatus({ showDetails = false, compact = false }: LovableCloudStatusProps) {
  const [health, setHealth] = useState<CloudHealthStatus>(getHealthStatus());
  const [isChecking, setIsChecking] = useState(false);
  const [config, setConfig] = useState(getCloudConfig());

  useEffect(() => {
    // Start health monitoring
    startHealthMonitoring(30000);

    // Update health status periodically
    const interval = setInterval(() => {
      setHealth(getHealthStatus());
    }, 5000);

    return () => {
      stopHealthMonitoring();
      clearInterval(interval);
    };
  }, []);

  const handleRefresh = async () => {
    setIsChecking(true);
    try {
      await checkBackendHealth();
      setHealth(getHealthStatus());
      setConfig(getCloudConfig());
    } finally {
      setIsChecking(false);
    }
  };

  const formatted = formatHealthStatus(health);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          health.status === 'healthy' ? 'bg-green-500' :
          health.status === 'degraded' ? 'bg-yellow-500' :
          health.status === 'unhealthy' ? 'bg-red-500' :
          'bg-gray-400'
        } ${health.status === 'healthy' ? 'animate-pulse' : ''}`} />
        <span className="text-xs text-muted-foreground">
          {formatted.label}
          {health.latency !== null && ` (${health.latency}ms)`}
        </span>
      </div>
    );
  }

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {health.status === 'healthy' ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : health.status === 'unhealthy' ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-500" />
            )}
            <div>
              <h3 className="font-semibold text-sm">Backend Status</h3>
              <p className="text-xs text-muted-foreground">
                {config.isLovableCloud ? 'Lovable Cloud' : 'Local Development'}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isChecking}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge 
              variant={
                health.status === 'healthy' ? 'default' :
                health.status === 'degraded' ? 'secondary' :
                'destructive'
              }
              className={
                health.status === 'healthy' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                health.status === 'degraded' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                'bg-red-500/20 text-red-500 border-red-500/30'
              }
            >
              {formatted.icon} {formatted.label}
            </Badge>
          </div>

          {health.latency !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Latency</span>
              <span className="text-sm font-mono">
                {health.latency}ms
              </span>
            </div>
          )}

          {health.lastCheck && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last Check</span>
              <span className="text-xs text-muted-foreground">
                {new Date(health.lastCheck).toLocaleTimeString()}
              </span>
            </div>
          )}

          {health.error && (
            <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs text-destructive">
              {health.error}
            </div>
          )}

          {showDetails && (
            <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Environment</span>
                <Badge variant="outline" className="text-xs">
                  {config.environment}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Backend URL</span>
                <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                  {config.backendUrl || '/api (relative)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">WebSocket URL</span>
                <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                  {config.wsUrl}
                </span>
              </div>
              {config.serviceName && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Service Name</span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {config.serviceName}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


