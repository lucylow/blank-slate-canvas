/**
 * React hook for Server-Sent Events (SSE)
 * Connects to an SSE endpoint and calls onMessage for each event
 */
import { useEffect, useRef } from "react";

export function useSSE(url: string, onMessage: (data: any) => void) {
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let es: EventSource | null = null;

    function start() {
      try {
        es = new EventSource(url);
        esRef.current = es;

        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            onMessage(data);
          } catch (err) {
            // If not JSON, pass raw data
            onMessage(e.data);
          }
        };

        es.onerror = (err) => {
          console.warn("SSE error, reconnecting", err);
          try {
            if (es) {
              es.close();
            }
          } catch (e) {
            // Ignore close errors
          }
          // Reconnect after 2 seconds
          setTimeout(start, 2000);
        };
      } catch (err) {
        console.error("Failed to create SSE", err);
      }
    }

    start();

    return () => {
      try {
        if (esRef.current) {
          esRef.current.close();
        }
        if (es) {
          es.close();
        }
      } catch (e) {
        // Ignore close errors
      }
    };
  }, [url, onMessage]);
}


