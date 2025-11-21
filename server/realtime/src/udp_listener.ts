// server/realtime/src/udp_listener.ts

import dgram from "dgram";
import { RingBuffer } from "./ringbuffer";
import { TelemetryPoint } from "./types";
import { UDP_PORT } from "./config";

export function startUdpListener(ring: RingBuffer<TelemetryPoint>, onParsed?: (p: TelemetryPoint) => void) {
  const socket = dgram.createSocket("udp4");

  socket.on("message", (msg, rinfo) => {
    const s = msg.toString("utf8").trim();
    let parsed: TelemetryPoint | null = null;

    try {
      if (s.startsWith("{")) {
        parsed = JSON.parse(s) as TelemetryPoint;
      } else {
        const parts = s.split(",");
        parsed = {
          meta_time: parts[0],
          track: parts[1],
          chassis: parts[2],
          lap: Number(parts[3] || 0),
          lapdist_m: Number(parts[4] || 0),
          speed_kmh: Number(parts[5] || 0),
          accx_can: Number(parts[6] || 0),
          accy_can: Number(parts[7] || 0),
          Steering_Angle: Number(parts[8] || 0),
          pbrake_f: Number(parts[9] || 0),
          rpm: Number(parts[10] || 0),
          raw_source: `udp:${rinfo.address}:${rinfo.port}`
        };
      }

      ring.push(parsed);
      if (onParsed) onParsed(parsed);
    } catch (err) {
      const socketWithWarn = socket as dgram.Socket & { _lastWarn?: number };
      if (!socketWithWarn._lastWarn || Date.now() - socketWithWarn._lastWarn > 5000) {
        socketWithWarn._lastWarn = Date.now();
        console.warn("UDP parse error (rate-limited):", (err as Error).message);
      }
    }
  });

  socket.on("listening", () => {
    const addr = socket.address();
    console.log(`UDP listener started on ${addr.address}:${addr.port}`);
  });

  socket.bind(UDP_PORT);
  return socket;
}

