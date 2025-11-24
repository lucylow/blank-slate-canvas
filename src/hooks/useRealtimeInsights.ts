import { useState, useEffect, useRef, useCallback } from 'react';
import { getBackendUrl } from '@/utils/backendUrl';

export interface GapAnalysis {
  chassis: string;
  position: number;
  gapToLeader: number;
  gapToAhead: number | null;
  gapToBehind: number | null;
  relativeSpeed: number;
  overtakingOpportunity: boolean;
  underPressure: boolean;
}

export interface RealTimeInsight {
  type: 'tire_wear' | 'performance' | 'gap_analysis' | 'anomaly' | 'strategy';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  chassis: string;
  timestamp: number;
  data?: Record<string, any>;
}

export interface EnhancedMetrics {
  avgSpeed?: number;
  maxSpeed?: number;
  avgAcceleration?: number;
  maxAcceleration?: number;
  avgBraking?: number;
  maxBraking?: number;
  avgCornering?: number;
  maxCornering?: number;
  consistency?: number;
  performanceTrend?: 'improving' | 'stable' | 'degrading';
  sectorTimes?: Record<string, number>;
}

export interface InsightUpdateMessage {
  type: 'insight_update';
  data: Array<{
    chassis: string;
    track?: string;
    lap?: number;
    lap_tire_stress: number;
    perSectorStress: Record<number, number>;
    predicted_loss_per_lap_seconds: number;
    laps_until_0_5s_loss: number;
    meta?: EnhancedMetrics;
  }>;
  gaps?: GapAnalysis[];
  insights?: RealTimeInsight[];
  meta?: {
    generated_at: string;
    vehicle_count: number;
    analysis_version: string;
  };
}

export function useRealtimeInsights(
  wsUrl?: string,
  enabled: boolean = true,
  chassis?: string
) {
  const [gaps, setGaps] = useState<GapAnalysis[]>([]);
  const [insights, setInsights] = useState<RealTimeInsight[]>([]);
  const [metrics, setMetrics] = useState<EnhancedMetrics | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!enabled) return;

    try {
      const backendUrl = getBackendUrl();
      const baseUrl = backendUrl || (import.meta.env.DEV ? 'ws://localhost:8080' : '');
      const url = wsUrl || `${baseUrl}/ws`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Real-time insights WebSocket connected');
        setConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const message: InsightUpdateMessage = JSON.parse(event.data);

          if (message.type === 'insight_update') {
            // Update gaps
            if (message.gaps) {
              setGaps(message.gaps);
            }

            // Update insights
            if (message.insights) {
              setInsights(message.insights);
            }

            // Extract metrics for current chassis if specified
            if (chassis && message.data) {
              const chassisData = message.data.find(d => d.chassis === chassis);
              if (chassisData?.meta) {
                setMetrics(chassisData.meta);
              }
            } else if (message.data && message.data.length > 0) {
              // Use first vehicle if no chassis specified
              setMetrics(message.data[0].meta || null);
            }
          }
        } catch (err) {
          console.error('Error parsing insight message:', err);
          setError('Failed to parse insight data');
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
        setConnected(false);
      };

      ws.onclose = () => {
        console.log('Real-time insights WebSocket closed');
        setConnected(false);
        
        // Attempt reconnect after 3 seconds
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to connect to insights stream');
      setConnected(false);
    }
  }, [enabled, wsUrl, chassis]);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [enabled, connect]);

  // Filter data for current chassis
  const filteredGaps = chassis 
    ? gaps.filter(g => g.chassis === chassis)
    : gaps;

  const filteredInsights = chassis
    ? insights.filter(i => i.chassis === chassis)
    : insights;

  const currentGap = filteredGaps[0] || null;

  return {
    gaps: filteredGaps,
    insights: filteredInsights,
    metrics,
    currentGap,
    connected,
    error,
    allGaps: gaps,
    allInsights: insights
  };
}

