// src/lib/wsClient.ts
// WebSocket client with exponential backoff, heartbeat, and message dispatch callback.

type MessageHandler = (msg: any) => void;
type WSOptions = {
  url: string;
  protocols?: string | string[];
  onMessage?: MessageHandler;
  onOpen?: () => void;
  onClose?: (ev?: CloseEvent) => void;
  onError?: (ev?: Event) => void;
  heartbeatIntervalMs?: number;
  maxBackoffMs?: number;
};

export class WSClient {
  private url: string;
  private ws: WebSocket | null = null;
  private onMessage?: MessageHandler;
  private onOpen?: () => void;
  private onClose?: (ev?: CloseEvent) => void;
  private onError?: (ev?: Event) => void;
  private heartbeatIntervalMs: number;
  private maxBackoffMs: number;
  private backoffMs = 500;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private manualClose = false;

  constructor(opts: WSOptions) {
    this.url = opts.url;
    this.onMessage = opts.onMessage;
    this.onOpen = opts.onOpen;
    this.onClose = opts.onClose;
    this.onError = opts.onError;
    this.heartbeatIntervalMs = opts.heartbeatIntervalMs ?? 15000;
    this.maxBackoffMs = opts.maxBackoffMs ?? 30_000;
  }

  connect() {
    this.manualClose = false;
    this._connectOnce();
  }

  private _connectOnce() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.backoffMs = 500;
        this.startHeartbeat();
        this.onOpen?.();
      };

      this.ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          this.onMessage?.(data);
        } catch (e) {
          console.warn('WS parse error', e);
        }
      };

      this.ws.onerror = (ev) => {
        this.onError?.(ev);
      };

      this.ws.onclose = (ev) => {
        this.stopHeartbeat();
        this.onClose?.(ev);
        if (!this.manualClose) this.scheduleReconnect();
      };
    } catch (e) {
      console.error('ws connect fail', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    const ms = Math.min(this.backoffMs, this.maxBackoffMs);
    this.reconnectTimer = window.setTimeout(() => {
      this.backoffMs = Math.min(this.backoffMs * 1.6, this.maxBackoffMs);
      this._connectOnce();
    }, ms);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      try {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
        }
      } catch (e) {
        // ignore
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  send(obj: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(obj));
        return true;
      } catch (e) {
        console.warn('ws send error', e);
      }
    }
    return false;
  }

  close() {
    this.manualClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    try { this.ws?.close(); } catch {
      // Ignore errors when closing WebSocket
    }
    this.stopHeartbeat();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
