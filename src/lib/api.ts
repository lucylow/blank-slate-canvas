// API client for backend communication
// Supports both REST endpoints and WebSocket connections

import { getWsUrl } from '@/utils/wsUrl';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// TypeScript interfaces matching backend API responses

export interface TelemetryPoint {
  lap: number;
  sector: number;
  speed: number;
  tire_pressure_fl: number;
  tire_pressure_fr: number;
  tire_pressure_rl: number;
  tire_pressure_rr: number;
  tire_temp_fl: number;
  tire_temp_fr: number;
  tire_temp_rl: number;
  tire_temp_rr: number;
  brake_temp: number;
  throttle: number;
  brake: number;
  g_force_lat: number;
  g_force_long: number;
  timestamp?: number;
  lat?: number;
  lng?: number;
  lapDistance?: number;
  gear?: number;
  rpm?: number;
}

export interface TirePredictionResponse {
  chassis: string;
  track: string;
  predicted_loss_per_lap_s: number;
  laps_until_0_5s_loss: number;
  recommended_pit_lap: number;
  explanation: string[];
  meta: {
    demo: boolean;
    generated_at: string;
  };
}

export interface HealthResponse {
  status: string;
  time: string;
}

// REST API Client
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async fetchTirePrediction(track: string, chassis: string): Promise<TirePredictionResponse> {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${this.baseUrl}/predict_tire/${track}/${chassis}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to fetch tire prediction (${response.status}): ${errorText}`);
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout: Backend server may be unavailable');
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to backend server');
      }
      throw error;
    }
  }

  async checkHealth(): Promise<HealthResponse> {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Health check timeout: Backend server may be unavailable');
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to backend server');
      }
      throw error;
    }
  }
}

// WebSocket Client for Telemetry
export class TelemetryWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Set<(data: TelemetryPoint) => void> = new Set();
  private onConnectionChange?: (status: 'connected' | 'connecting' | 'disconnected') => void;

  constructor(url?: string) {
    // Use provided URL or get from helper (which handles dev/prod/env vars)
    this.url = url || getWsUrl('/ws');
  }

  connect(): void {
    if (!this.url) {
      console.warn('WebSocket URL is not configured. Skipping connection.');
      return;
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.onConnectionChange?.('connecting');
    
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.onConnectionChange?.('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data: TelemetryPoint = JSON.parse(event.data);
          // Add timestamp if not present
          if (!data.timestamp) {
            data.timestamp = Date.now();
          }
          this.listeners.forEach(listener => listener(data));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.onConnectionChange?.('disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.onConnectionChange?.('disconnected');
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }

  subscribe(listener: (data: TelemetryPoint) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setConnectionChangeHandler(handler: (status: 'connected' | 'connecting' | 'disconnected') => void): void {
    this.onConnectionChange = handler;
  }

  send(message: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not open. Cannot send message.');
    }
  }

  getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instances
export const apiClient = new ApiClient();
export const telemetryWS = new TelemetryWebSocket();

