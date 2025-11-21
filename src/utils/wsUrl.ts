// src/utils/wsUrl.ts
// Helper function to construct WebSocket URL with proper protocol and host detection

import { getBackendWsUrl } from './backendUrl';

export function getWsUrl(path = '/ws'): string {
  const baseWsUrl = getBackendWsUrl();
  
  // If we got a full URL, append the path
  if (baseWsUrl.startsWith('ws://') || baseWsUrl.startsWith('wss://')) {
    return baseWsUrl.endsWith(path) ? baseWsUrl : `${baseWsUrl}${baseWsUrl.endsWith('/') ? '' : '/'}${path.replace(/^\//, '')}`;
  }
  
  // If it's a relative path or empty, construct from current location
  if (typeof window !== 'undefined') {
    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // If baseWsUrl is empty, use current host
    if (!baseWsUrl) {
      return `${protocol}//${loc.host}${path}`;
    }
    
    // Otherwise use the base URL
    return `${baseWsUrl}${baseWsUrl.endsWith('/') ? '' : '/'}${path.replace(/^\//, '')}`;
  }
  
  // SSR fallback
  return 'ws://localhost:8000/ws';
}


