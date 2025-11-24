// server/realtime/src/udp_listener.ts

import dgram from "dgram";
import { RingBuffer } from "./ringbuffer";
import { TelemetryPoint } from "./types";
import { UDP_PORT } from "./config";

interface UdpMetrics {
  messagesReceived: number;
  messagesParsed: number;
  parseErrors: number;
  lastErrorTime: number;
  lastMetricsTime: number;
}

const udpMetrics: UdpMetrics = {
  messagesReceived: 0,
  messagesParsed: 0,
  parseErrors: 0,
  lastErrorTime: 0,
  lastMetricsTime: Date.now()
};

// Rate limiting: track errors per source
const errorRateLimiter = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_ERRORS_PER_WINDOW = 10;

function shouldLogError(source: string): boolean {
  const now = Date.now();
  const limiter = errorRateLimiter.get(source);
  
  if (!limiter || now - limiter.lastReset > RATE_LIMIT_WINDOW) {
    errorRateLimiter.set(source, { count: 1, lastReset: now });
    return true;
  }
  
  if (limiter.count >= MAX_ERRORS_PER_WINDOW) {
    return false;
  }
  
  limiter.count++;
  return true;
}

export function startUdpListener(ring: RingBuffer<TelemetryPoint>, onParsed?: (p: TelemetryPoint) => void) {
  const socket = dgram.createSocket("udp4");
  
  // Set socket buffer size for high-throughput scenarios
  socket.setRecvBufferSize(1024 * 1024 * 2); // 2MB receive buffer

  socket.on("message", (msg, rinfo) => {
    udpMetrics.messagesReceived++;
    const s = msg.toString("utf8").trim();
    
    if (!s || s.length === 0) {
      return; // Skip empty messages
    }
    
    let parsed: TelemetryPoint | null = null;
    const source = `${rinfo.address}:${rinfo.port}`;

    try {
      if (s.startsWith("{")) {
        // JSON format
        parsed = JSON.parse(s) as TelemetryPoint;
      } else {
        // CSV format
        const parts = s.split(",");
        if (parts.length < 6) {
          throw new Error(`Invalid CSV format: expected at least 6 fields, got ${parts.length}`);
        }
        
        parsed = {
          meta_time: parts[0] || new Date().toISOString(),
          track: parts[1] || "unknown",
          chassis: parts[2] || "unknown",
          lap: Number(parts[3] || 0),
          lapdist_m: Number(parts[4] || 0),
          speed_kmh: Number(parts[5] || 0),
          accx_can: Number(parts[6] || 0),
          accy_can: Number(parts[7] || 0),
          Steering_Angle: Number(parts[8] || 0),
          pbrake_f: Number(parts[9] || 0),
          rpm: Number(parts[10] || 0),
          raw_source: `udp:${source}`
        };
      }

      // Validate parsed data
      if (!parsed.track || !parsed.chassis) {
        throw new Error("Missing required fields: track or chassis");
      }

      ring.push(parsed);
      udpMetrics.messagesParsed++;
      
      if (onParsed) {
        try {
          onParsed(parsed);
        } catch (err) {
          // Don't let callback errors break UDP processing
          if (shouldLogError("callback")) {
            console.warn("UDP callback error:", (err as Error).message);
          }
        }
      }
    } catch (err) {
      udpMetrics.parseErrors++;
      
      if (shouldLogError(source)) {
        const errorMsg = (err as Error).message || String(err);
        console.warn(`UDP parse error from ${source}:`, errorMsg);
        
        // Log sample of problematic message (truncated)
        if (s.length > 200) {
          console.warn(`Message sample: ${s.substring(0, 200)}...`);
        } else {
          console.warn(`Message: ${s}`);
        }
      }
    }
  });

  socket.on("error", (err) => {
    console.error("UDP socket error:", err);
    udpMetrics.parseErrors++;
  });

  socket.on("listening", () => {
    const addr = socket.address();
    console.log(`UDP listener started on ${addr.address}:${addr.port}`);
    console.log(`UDP receive buffer size: ${socket.getRecvBufferSize()} bytes`);
  });

  // Log UDP metrics periodically
  setInterval(() => {
    const elapsed = (Date.now() - udpMetrics.lastMetricsTime) / 1000;
    if (elapsed > 0) {
      const receiveRate = udpMetrics.messagesReceived / elapsed;
      const parseRate = udpMetrics.messagesParsed / elapsed;
      const errorRate = udpMetrics.parseErrors / elapsed;
      
      console.log(
        `UDP Metrics: received=${udpMetrics.messagesReceived} (${receiveRate.toFixed(1)}/s), ` +
        `parsed=${udpMetrics.messagesParsed} (${parseRate.toFixed(1)}/s), ` +
        `errors=${udpMetrics.parseErrors} (${errorRate.toFixed(2)}/s), ` +
        `success_rate=${((udpMetrics.messagesParsed / Math.max(1, udpMetrics.messagesReceived)) * 100).toFixed(1)}%`
      );
      
      // Reset metrics
      udpMetrics.messagesReceived = 0;
      udpMetrics.messagesParsed = 0;
      udpMetrics.parseErrors = 0;
      udpMetrics.lastMetricsTime = Date.now();
    }
  }, 60000); // Log every minute

  socket.bind(UDP_PORT);
  return socket;
}

