/**
 * Anomaly Detection API Client
 * Real-time telemetry anomaly detection
 */

export interface AnomalyAlert {
  type: 'critical' | 'rate_of_change' | 'ml_detected';
  sensor: string;
  value?: number;
  threshold?: number;
  rate?: number;
  score?: number;
  contributing_features?: string[];
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AnomalyDetectionResult {
  is_anomaly: boolean;
  anomaly_score: number;
  alerts: AnomalyAlert[];
  timestamp: string;
  vehicle_id: string;
  vehicle_number?: number;
  lap?: number;
}

export interface AnomalyStats {
  total_points: number;
  anomaly_count: number;
  anomaly_rate: number;
  critical_alerts: number;
  rate_of_change_alerts: number;
  ml_detected_anomalies: number;
  avg_anomaly_score: number;
  top_anomalous_sensors: Array<{ sensor: string; count: number }>;
}

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * Detect anomalies in a single telemetry point
 */
export async function detectAnomaly(
  vehicleId: string,
  telemetryPoint: Record<string, any>
): Promise<AnomalyDetectionResult> {
  const response = await fetch(`${API_BASE}/api/anomaly/detect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vehicle_id: vehicleId,
      telemetry_point: telemetryPoint,
    }),
  });

  if (!response.ok) {
    throw new Error(`Anomaly detection failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get anomaly statistics for a race or vehicle
 */
export async function getAnomalyStats(
  track: string,
  race: number,
  vehicle?: number,
  lapStart?: number,
  lapEnd?: number
): Promise<{ success: boolean; data: AnomalyStats; timestamp: string }> {
  const params = new URLSearchParams({
    track,
    race: race.toString(),
  });

  if (vehicle !== undefined) {
    params.append('vehicle', vehicle.toString());
  }
  if (lapStart !== undefined) {
    params.append('lap_start', lapStart.toString());
  }
  if (lapEnd !== undefined) {
    params.append('lap_end', lapEnd.toString());
  }

  const response = await fetch(`${API_BASE}/api/anomaly/stats?${params}`);

  if (!response.ok) {
    throw new Error(`Failed to get anomaly stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Batch anomaly detection
 */
export async function detectAnomaliesBatch(
  vehicleId: string,
  track: string,
  race: number,
  lapStart?: number,
  lapEnd?: number,
  retrain: boolean = true
): Promise<{
  success: boolean;
  stats: {
    total_points: number;
    anomaly_count: number;
    anomaly_rate: number;
    avg_anomaly_score: number;
  };
  results: any[];
  timestamp: string;
}> {
  const response = await fetch(`${API_BASE}/api/anomaly/detect/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vehicle_id: vehicleId,
      track,
      race,
      lap_start: lapStart,
      lap_end: lapEnd,
      retrain,
    }),
  });

  if (!response.ok) {
    throw new Error(`Batch anomaly detection failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check anomaly detection service health
 */
export async function checkAnomalyHealth(): Promise<{
  status: string;
  pyod_available: boolean;
  active_connections: number;
  timestamp: string;
}> {
  const response = await fetch(`${API_BASE}/api/anomaly/health`);

  if (!response.ok) {
    throw new Error(`Health check failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * WebSocket client for real-time anomaly alerts
 */
export class AnomalyWebSocket {
  private ws: WebSocket | null = null;
  private vehicleId: string;
  private onAnomaly?: (result: AnomalyDetectionResult) => void;
  private onError?: (error: Event) => void;
  private onConnect?: () => void;
  private onDisconnect?: () => void;

  constructor(vehicleId: string) {
    this.vehicleId = vehicleId;
  }

  connect(
    onAnomaly: (result: AnomalyDetectionResult) => void,
    onError?: (error: Event) => void,
    onConnect?: () => void,
    onDisconnect?: () => void
  ) {
    this.onAnomaly = onAnomaly;
    this.onError = onError;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;

    const wsUrl = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:8000';
    const url = `${wsUrl}/api/anomaly/ws/${this.vehicleId}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log(`Anomaly WebSocket connected for vehicle ${this.vehicleId}`);
      this.onConnect?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'anomaly_alert' && data.data) {
          this.onAnomaly?.(data.data as AnomalyDetectionResult);
        } else if (data.type === 'connected') {
          console.log('Anomaly detection stream connected');
        } else if (data.type === 'keepalive') {
          // Keepalive - no action needed
        } else if (data.type === 'pong') {
          // Pong response - no action needed
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('Anomaly WebSocket error:', error);
      this.onError?.(error);
    };

    this.ws.onclose = () => {
      console.log(`Anomaly WebSocket disconnected for vehicle ${this.vehicleId}`);
      this.onDisconnect?.();
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendPing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send('ping');
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}


