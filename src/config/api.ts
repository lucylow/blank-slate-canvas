// Centralized API configuration
import { getBackendUrl } from '@/utils/backendUrl';

export const getApiUrl = (): string => {
  // Check for explicit env var first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Use backend URL helper
  const backendUrl = getBackendUrl();
  if (backendUrl) {
    return backendUrl;
  }
  
  // Fallback to relative paths (works with Vite proxy)
  return '';
};

export const getWsUrl = (): string => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // For demo mode or when backend not available, return empty to skip WS
  if (typeof window === 'undefined') {
    return '';
  }
  
  // Only attempt WS if not on Lovable preview without backend
  if (window.location.hostname.includes('lovableproject.com')) {
    console.log('[Config] Lovable preview - skipping WebSocket');
    return '';
  }
  
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

export const API_URL = getApiUrl();
export const WS_URL = getWsUrl();
