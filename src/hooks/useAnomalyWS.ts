// src/hooks/useAnomalyWS.ts

import { useEffect, useRef, useState } from "react";

export default function useAnomalyWS(
  vehicleId: string,
  backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // open websocket
    const url =
      backendUrl.replace(/^http/, "ws") +
      `/ws/telemetry/${encodeURIComponent(vehicleId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Anomaly WS connected", url);
    };

    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        // payload.alert contains details
        setAlerts((prev) => [payload, ...prev].slice(0, 50));
      } catch (e) {
        console.error("Failed parse ws msg", e);
      }
    };

    ws.onerror = (err) => console.warn("WS err", err);
    ws.onclose = () => console.log("WS closed");

    return () => {
      ws.close();
    };
  }, [vehicleId, backendUrl]);

  // helper to send telemetry frames to server via ws (if ws open)
  const sendTelemetry = (frame: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(frame));
    }
  };

  return { alerts, sendTelemetry };
}

