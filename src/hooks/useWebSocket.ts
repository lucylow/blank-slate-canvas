// src/hooks/useWebSocket.ts
// Improved WebSocket hook with batching, deduplication, exponential backoff, and ring buffer

import { useEffect, useRef, useState } from "react";

type WSMsg = unknown;

interface UseWebSocketOptions {
  batchMs?: number;
  maxBuffer?: number;
  maxMessages?: number;
}

export function useWebSocket(url: string, opts: UseWebSocketOptions = {}) {
  const { batchMs = 80, maxBuffer = 2000, maxMessages = 500 } = opts;
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const backoffRef = useRef(500);
  const [connected, setConnected] = useState(false);
  const bufferRef = useRef<WSMsg[]>([]);
  const [messages, setMessages] = useState<WSMsg[]>([]); // small window for UI
  const lastMessageRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip WebSocket connection if URL is empty (demo mode)
    if (!url || url.trim() === '') {
      setConnected(false);
      return;
    }

    let alive = true;

    function connect() {
      if (!alive) return;
      
      try {
        wsRef.current = new WebSocket(url);
        
        wsRef.current.onopen = () => {
          if (!alive) {
            wsRef.current?.close();
            return;
          }
          backoffRef.current = 500;
          setConnected(true);
          console.log('[WebSocket] Connected');
        };
        
        wsRef.current.onclose = () => {
          if (!alive) return;
          setConnected(false);
          // exponential backoff up to 10s
          const delay = Math.min((backoffRef.current *= 1.8), 10000);
          console.log(`[WebSocket] Disconnected, reconnecting in ${delay}ms`);
          reconnectRef.current = window.setTimeout(connect, delay);
        };
        
        wsRef.current.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          wsRef.current?.close();
        };
        
        wsRef.current.onmessage = (evt) => {
          if (!alive) return;
          try {
            const data = JSON.parse(evt.data);
            
            // Dedupe: simple heuristic - if identical to last msg skip
            const dataStr = JSON.stringify(data);
            if (lastMessageRef.current === dataStr) {
              return; // skip duplicate
            }
            lastMessageRef.current = dataStr;
            
            bufferRef.current.push(data);
            
            // Trim buffer to maxBuffer size (ring buffer behavior)
            if (bufferRef.current.length > maxBuffer) {
              bufferRef.current.splice(0, bufferRef.current.length - maxBuffer);
            }
          } catch (e) {
            console.warn('[WebSocket] Parse error:', e);
            // ignore parse errors
          }
        };
      } catch (error) {
        console.error('[WebSocket] Connection error:', error);
        if (alive) {
          setConnected(false);
          reconnectRef.current = window.setTimeout(connect, backoffRef.current);
        }
      }
    }

    connect();

    // Batch flush loop (reduce rerenders)
    const flush = setInterval(() => {
      if (!alive) return;
      if (bufferRef.current.length) {
        // append recent chunk to state (max maxMessages)
        setMessages((m) => {
          const combined = [...m, ...bufferRef.current];
          bufferRef.current = [];
          // Keep only the most recent maxMessages
          return combined.slice(-maxMessages);
        });
      }
    }, batchMs);

    return () => {
      alive = false;
      clearInterval(flush);
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url, batchMs, maxBuffer, maxMessages]);

  const send = (payload: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(payload));
      } catch (error) {
        console.error('[WebSocket] Send error:', error);
      }
    } else {
      console.warn('[WebSocket] Cannot send - not connected');
    }
  };

  return { 
    connected, 
    messages, 
    send,
    messageCount: messages.length 
  };
}
