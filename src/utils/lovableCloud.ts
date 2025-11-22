// src/utils/lovableCloud.ts
// Enhanced Lovable Cloud utilities with health monitoring and connection status

import { getBackendUrl, getBackendWsUrl, isLovableCloud } from './backendUrl';

export interface CloudHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date | null;
  latency: number | null;
  error?: string;
}

export interface CloudConfig {
  isLovableCloud: boolean;
  backendUrl: string;
  wsUrl: string;
  environment: 'development' | 'production' | 'staging';
  serviceName: string | null;
}

let healthStatus: CloudHealthStatus = {
  status: 'unknown',
  lastCheck: null,
  latency: null,
};

let healthCheckInterval: NodeJS.Timeout | null = null;

/**
 * Get comprehensive Lovable Cloud configuration
 */
export function getCloudConfig(): CloudConfig {
  const isCloud = isLovableCloud();
  const backendUrl = getBackendUrl();
  const wsUrl = getBackendWsUrl();
  
  // Detect environment
  let environment: 'development' | 'production' | 'staging' = 'production';
  if (import.meta.env.DEV) {
    environment = 'development';
  } else if (typeof window !== 'undefined' && window.location.hostname.includes('staging')) {
    environment = 'staging';
  }

  // Get service name from environment or default
  const serviceName = import.meta.env.VITE_BACKEND_SERVICE_NAME || 
                      (isCloud ? 'pitwall-backend' : null);

  return {
    isLovableCloud: isCloud,
    backendUrl: backendUrl || (isCloud ? '' : 'http://localhost:8000'),
    wsUrl,
    environment,
    serviceName,
  };
}

/**
 * Check backend health status
 */
export async function checkBackendHealth(): Promise<CloudHealthStatus> {
  const config = getCloudConfig();
  const startTime = Date.now();
  
  try {
    const healthUrl = `${config.backendUrl || '/api'}/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    if (response.ok) {
      healthStatus = {
        status: 'healthy',
        lastCheck: new Date(),
        latency,
      };
    } else {
      healthStatus = {
        status: 'degraded',
        lastCheck: new Date(),
        latency,
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    healthStatus = {
      status: 'unhealthy',
      lastCheck: new Date(),
      latency,
      error: errorMessage,
    };
  }

  return healthStatus;
}

/**
 * Get current health status (cached)
 */
export function getHealthStatus(): CloudHealthStatus {
  return { ...healthStatus };
}

/**
 * Start periodic health checks
 */
export function startHealthMonitoring(intervalMs: number = 30000): void {
  if (healthCheckInterval) {
    stopHealthMonitoring();
  }

  // Initial check
  checkBackendHealth();

  // Periodic checks
  healthCheckInterval = setInterval(() => {
    checkBackendHealth();
  }, intervalMs);
}

/**
 * Stop health monitoring
 */
export function stopHealthMonitoring(): void {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

/**
 * Test WebSocket connection
 */
export async function testWebSocketConnection(): Promise<boolean> {
  const config = getCloudConfig();
  
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(config.wsUrl);
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    } catch (error) {
      resolve(false);
    }
  });
}

/**
 * Get connection diagnostics
 */
export async function getConnectionDiagnostics() {
  const config = getCloudConfig();
  const health = await checkBackendHealth();
  const wsConnected = await testWebSocketConnection();

  return {
    config,
    health,
    websocket: {
      connected: wsConnected,
      url: config.wsUrl,
    },
    environment: {
      isDev: import.meta.env.DEV,
      isProd: import.meta.env.PROD,
      mode: import.meta.env.MODE,
    },
    envVars: {
      VITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'not set',
      VITE_BACKEND_WS_URL: import.meta.env.VITE_BACKEND_WS_URL || 'not set',
      VITE_BACKEND_SERVICE_NAME: import.meta.env.VITE_BACKEND_SERVICE_NAME || 'not set',
      VITE_AI_SUMMARY_API: import.meta.env.VITE_AI_SUMMARY_API || 'not set',
    },
  };
}

/**
 * Format health status for display
 */
export function formatHealthStatus(status: CloudHealthStatus): {
  label: string;
  color: string;
  icon: string;
} {
  switch (status.status) {
    case 'healthy':
      return {
        label: 'Healthy',
        color: 'text-green-500',
        icon: '✓',
      };
    case 'degraded':
      return {
        label: 'Degraded',
        color: 'text-yellow-500',
        icon: '⚠',
      };
    case 'unhealthy':
      return {
        label: 'Unhealthy',
        color: 'text-red-500',
        icon: '✗',
      };
    default:
      return {
        label: 'Unknown',
        color: 'text-gray-500',
        icon: '?',
      };
  }
}

