// src/utils/backendUrl.ts
// Utility to detect environment and configure backend URL for Lovable Cloud

/**
 * Detects if the app is running on Lovable Cloud
 */
export function isLovableCloud(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.location.hostname.endsWith('.lovable.app');
}

/**
 * Gets the backend URL based on the current environment
 * 
 * Priority:
 * 1. Explicit VITE_BACKEND_URL env var (preferred)
 * 2. VITE_API_BASE_URL or VITE_API_BASE env var (backward compatibility)
 * 3. Lovable Cloud detection (constructs backend URL from frontend URL)
 * 4. Development mode (uses Vite proxy)
 * 5. Fallback to empty string (relative paths)
 */
export function getBackendUrl(): string {
  // 1. Check explicit environment variables (highest priority)
  // VITE_BACKEND_URL is the preferred variable, but we also support VITE_API_BASE_URL for backward compatibility
  const explicitUrl = import.meta.env.VITE_BACKEND_URL || 
                      import.meta.env.VITE_API_BASE_URL || 
                      import.meta.env.VITE_API_BASE;
  
  if (explicitUrl) {
    return explicitUrl;
  }

  // 2. Lovable Cloud detection
  if (typeof window !== 'undefined' && isLovableCloud()) {
    const loc = window.location;
    // In Lovable Cloud, backend is typically deployed as a separate service
    // Try to construct backend URL from frontend URL
    // Format: https://pitwall-backend-xxx.lovable.app (from lovable.yaml name)
    
    // Option 1: Try to use the same subdomain pattern
    // If frontend is void-form-forge.lovable.app, backend might be pitwall-backend-xxx.lovable.app
    // We'll use an environment variable for this, but also try a common pattern
    
    // For now, we'll use a relative path which Lovable Cloud can proxy
    // Or use the backend service name from lovable.yaml
    const backendServiceName = import.meta.env.VITE_BACKEND_SERVICE_NAME || 'pitwall-backend';
    
    // Try to construct: https://pitwall-backend-xxx.lovable.app
    // But we don't know the exact subdomain, so we'll use a relative path
    // Lovable Cloud should handle routing between services
    
    // Actually, in Lovable Cloud, services can communicate via service names
    // But for browser requests, we need the full URL
    // Let's use a relative path that can be proxied, or check for a meta tag
    
    // Check if there's a backend URL in a meta tag (Lovable might inject this)
    const metaBackend = document.querySelector('meta[name="backend-url"]')?.getAttribute('content');
    if (metaBackend) {
      return metaBackend;
    }
    
    // Fallback: use relative path (Lovable Cloud should proxy /api to backend)
    // Or construct from known pattern
    return ''; // Empty string means use relative paths
  }

  // 3. Development mode - use Vite proxy
  if (import.meta.env.DEV) {
    return ''; // Empty string means use relative paths (Vite proxy handles /api)
  }

  // 4. Production fallback - use relative paths
  return '';
}

/**
 * Gets the WebSocket backend URL based on the current environment
 */
export function getBackendWsUrl(): string {
  // 1. Check explicit environment variable
  const explicitWsUrl = import.meta.env.VITE_WS_BASE_URL || 
                       import.meta.env.VITE_BACKEND_WS_URL;
  
  if (explicitWsUrl) {
    return explicitWsUrl;
  }

  // 2. Derive from HTTP backend URL
  const httpUrl = getBackendUrl();
  if (httpUrl) {
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return httpUrl.replace(/^https?:/, protocol);
  }

  // 3. Lovable Cloud detection
  if (typeof window !== 'undefined' && isLovableCloud()) {
    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Try to construct WebSocket URL from backend service
    // Similar to HTTP URL construction
    const metaWsUrl = document.querySelector('meta[name="backend-ws-url"]')?.getAttribute('content');
    if (metaWsUrl) {
      return metaWsUrl;
    }
    
    // Fallback: use same host with wss protocol
    return `${protocol}//${loc.host}`;
  }

  // 4. Development mode
  if (import.meta.env.DEV) {
    // In dev, use proxy or direct localhost connection
    if (typeof window !== 'undefined') {
      const loc = window.location;
      if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
        // Use proxy in dev (Vite will proxy /ws to backend)
        return `${loc.protocol === 'https:' ? 'wss:' : 'ws:'}//${loc.host}/ws`;
      }
    }
    return 'ws://localhost:8000/ws';
  }

  // 5. Production fallback
  if (typeof window !== 'undefined') {
    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${loc.host}/ws`;
  }

  return 'ws://localhost:8000/ws';
}

