// src/hooks/useWebSocket.ts

import { useEffect, useRef, useState } from "react";

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    let shouldStop = false;
    let reconnectTimer: any;

    function connect() {
      if (shouldStop) return;
      wsRef.current = new WebSocket(url);
      wsRef.current.onopen = () => {
        setConnected(true);
      };
      wsRef.current.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          setMessages((m) => [...m.slice(-500), data]); // keep a rolling buffer
        } catch {
          // ignore parse errors
        }
      };
      wsRef.current.onclose = () => {
        setConnected(false);
        // exponential backoff reconnect
        reconnectTimer = setTimeout(connect, 1000 + Math.random()*2000);
      };
      wsRef.current.onerror = () => {
        wsRef.current?.close();
      };
    }

    connect();
    return () => {
      shouldStop = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, [url]);

  const send = (payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  return { connected, messages, send };
}

