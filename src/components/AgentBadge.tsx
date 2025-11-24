// src/components/AgentBadge.tsx
// Agent badge component showing health status and metrics

import React from 'react';
import { useNavStore } from '@/stores/navStore';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AgentBadgeProps {
  agentId: string;
  compact?: boolean;
  showLatency?: boolean;
}

export default function AgentBadge({ 
  agentId, 
  compact = false,
  showLatency = true 
}: AgentBadgeProps) {
  const agent = useNavStore((state) => state.agents[agentId]);
  
  if (!agent) return null;
  
  const statusColors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    offline: 'bg-gray-400'
  };
  
  const statusLabels = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    offline: 'Offline'
  };
  
  const color = statusColors[agent.status] || 'bg-gray-400';
  const label = statusLabels[agent.status] || 'Unknown';
  
  const latency = agent.latency_ms || 0;
  const lastUpdate = agent.last_update 
    ? new Date(agent.last_update * 1000).toLocaleTimeString()
    : null;
  
  const alert = agent.alert;
  
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("w-2 h-2 rounded-full", color)} />
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <div className="font-semibold">{label}</div>
              {showLatency && <div>{Math.round(latency)}ms latency</div>}
              {lastUpdate && <div>Updated: {lastUpdate}</div>}
              {alert && (
                <div className={cn(
                  "mt-1 pt-1 border-t",
                  alert.level === 'critical' ? 'text-red-500' : 
                  alert.level === 'warning' ? 'text-yellow-500' : 
                  'text-blue-500'
                )}>
                  {alert.summary}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
        
        {alert && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                alert.level === 'critical' ? 'bg-red-500' :
                alert.level === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              )} />
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <div className="font-semibold uppercase">{alert.level}</div>
                <div>Score: {Math.round(alert.score * 100)}%</div>
                {alert.summary && <div className="mt-1">{alert.summary}</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", color)} />
            {showLatency && (
              <span className="text-xs text-muted-foreground">
                {Math.round(latency)}ms
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <div className="font-semibold">{label}</div>
            {showLatency && <div>Latency: {Math.round(latency)}ms</div>}
            {lastUpdate && <div>Last update: {lastUpdate}</div>}
            {alert && (
              <div className={cn(
                "mt-2 pt-2 border-t",
                alert.level === 'critical' ? 'text-red-500' : 
                alert.level === 'warning' ? 'text-yellow-500' : 
                'text-blue-500'
              )}>
                <div className="font-semibold uppercase">{alert.level}</div>
                {alert.summary && <div>{alert.summary}</div>}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
      
      {alert && (
        <div className={cn(
          "px-2 py-0.5 rounded text-xs font-medium",
          alert.level === 'critical' ? 'bg-red-500/20 text-red-600' :
          alert.level === 'warning' ? 'bg-yellow-500/20 text-yellow-600' :
          'bg-blue-500/20 text-blue-600'
        )}>
          {alert.level === 'critical' ? '!' : alert.level === 'warning' ? '⚠' : 'ℹ'}
        </div>
      )}
    </div>
  );
}



