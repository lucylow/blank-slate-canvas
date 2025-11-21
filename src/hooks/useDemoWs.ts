// src/hooks/useDemoWs.ts
// WebSocket hook for demo telemetry replay

import { useEffect, useRef, useState } from 'react';

export interface TelemetryPoint {
  [key: string]: unknown;
  timestamp?: string;
  vehicle_id?: string;
  vehicle_number?: number;
  lap?: number;
}

export interface UseDemoWsOptions {
  url?: string;
  autoConnect?: boolean;
  onMessage?: (point: TelemetryPoint) => void;
}

export function useDemoWs(options: UseDemoWsOptions = {}) {
  const {
    url = 'ws://localhost:8081/ws/demo',
    autoConnect = true,
    onMessage
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [points, setPoints] = useState<TelemetryPoint[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Demo WebSocket connected');
        setConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'telemetry_point' && msg.data) {
            const point: TelemetryPoint = msg.data;
            setPoints(prev => [...prev.slice(-499), point]); // Keep last 500 points
            onMessage?.(point);
          } else if (msg.type === 'error') {
            console.error('Demo WebSocket error:', msg.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Demo WebSocket error:', error);
        setConnected(false);
      };

      ws.onclose = () => {
        console.log('Demo WebSocket disconnected');
        setConnected(false);
        
        // Attempt reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (error) {
      console.error('Failed to create demo WebSocket connection:', error);
      setConnected(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  };

  const sendCommand = (cmd: { type: string; [key: string]: unknown }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmd));
    }
  };

  const setSpeed = (intervalMs: number) => {
    sendCommand({ type: 'set_speed', intervalMs });
  };

  const pause = () => {
    sendCommand({ type: 'pause' });
  };

  const resume = () => {
    sendCommand({ type: 'resume' });
  };

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, autoConnect]);

  return {
    connected,
    points,
    connect,
    disconnect,
    sendCommand,
    setSpeed,
    pause,
    resume
  };
}

