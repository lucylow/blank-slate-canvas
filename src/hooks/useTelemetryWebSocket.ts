import { useEffect, useRef, useState } from 'react';

interface UseTelemetryWebSocketOptions {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useTelemetryWebSocket = (options: UseTelemetryWebSocketOptions = {}) => {
  const {
    url = import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
    reconnectInterval = 3000,
    maxReconnectAttempts = 10
  } = options;

  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!url || url.trim() === '') {
      return;
    }

    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;

      try {
        const websocket = new WebSocket(url);
        wsRef.current = websocket;

        websocket.onopen = () => {
          if (!isMounted) {
            websocket.close();
            return;
          }
          console.log('✅ WebSocket connected');
          setConnected(true);
          reconnectAttemptsRef.current = 0;
          setWs(websocket);
        };

        websocket.onclose = () => {
          if (!isMounted) return;
          setConnected(false);
          setWs(null);

          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current += 1;
            console.log(
              `🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
            );
            reconnectTimeoutRef.current = window.setTimeout(
              connect,
              reconnectInterval
            );
          } else {
            console.error('❌ Max reconnection attempts reached');
          }
        };

        websocket.onerror = (error) => {
          console.error('🔴 WebSocket error:', error);
        };
      } catch (error) {
        console.error('🔴 WebSocket connection error:', error);
        if (isMounted && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = window.setTimeout(
            connect,
            reconnectInterval
          );
        }
      }
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWs(null);
      setConnected(false);
    };
  }, [url, reconnectInterval, maxReconnectAttempts]);

  return ws;
};

