// src/lib/agentWSClient.ts
// WebSocket client specifically for agent events from the backend

import { WS_URL } from "./backendClient";
import { WSClient } from "./wsClient";

type AgentEventCallback = (payload: any) => void;
type FlagsCallback = (payload: Record<string, boolean>) => void;

export function connectAgentWS({
  onEvent,
  onFlags,
  onOpen,
}: {
  onEvent?: AgentEventCallback;
  onFlags?: FlagsCallback;
  onOpen?: () => void;
}): WSClient {
  const ws = new WSClient({
    url: WS_URL,
    onMessage: (msg) => {
      if (msg.type === "agent_event" && onEvent) {
        onEvent(msg.payload);
      }
      if (msg.type === "flags" && onFlags) {
        onFlags(msg.payload);
      }
    },
    onOpen: () => {
      onOpen?.();
      // Request flags on connect
      ws.send({ cmd: "get_flags" });
    },
  });

  ws.connect();
  return ws;
}

