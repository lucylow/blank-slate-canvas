// src/utils/wsUrl.ts
// Helper function to construct WebSocket URL with proper protocol and host detection

export function getWsUrl(path = '/ws'): string {
  if (typeof window === 'undefined') {
    // SSR fallback
    return 'ws://localhost:8081/ws';
  }

  const loc = window.location;

  // In development, use localhost backend directly
  if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
    // Check if we should use the proxy (dev mode) or direct connection
    // For dev, we can use the proxy if Vite is running, otherwise direct
    if (import.meta.env.DEV && !import.meta.env.VITE_WS_BASE_URL) {
      // Use proxy path in dev (Vite will proxy /ws to backend)
      return `${loc.protocol === 'https:' ? 'wss:' : 'ws:'}//${loc.host}${path}`;
    }
    // Direct connection to backend
    return `ws://localhost:8081${path}`;
  }

  // Production: derive from current host or use explicit env var
  if (import.meta.env.VITE_WS_BASE_URL) {
    const wsUrl = import.meta.env.VITE_WS_BASE_URL;
    return wsUrl.endsWith(path) ? wsUrl : `${wsUrl}${wsUrl.endsWith('/') ? '' : '/'}${path.replace(/^\//, '')}`;
  }

  // Derive from HTTP API URL if provided
  if (import.meta.env.VITE_API_BASE_URL) {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = apiUrl.replace(/^https?:/, protocol);
    return `${wsUrl}${wsUrl.endsWith('/') ? '' : '/'}${path.replace(/^\//, '')}`;
  }

  // Fallback: use same host as frontend
  const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${loc.host}${path}`;
}

