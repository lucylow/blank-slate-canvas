// src/api/client.ts
// Axios client with enhanced retry logic, timeout, and Lovable Cloud support

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { getBackendUrl, isLovableCloud } from "@/utils/backendUrl";
import { checkBackendHealth } from "@/utils/lovableCloud";

// Get backend URL with Lovable Cloud detection
const BASE = getBackendUrl() || (import.meta.env.DEV ? '/api' : '');

const client = axios.create({
  baseURL: BASE,
  timeout: 15000, // Increased timeout for Lovable Cloud
  headers: { "Content-Type": "application/json" },
});

// Enhanced retry interceptor with exponential backoff and health-aware retries
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { 
      retry?: number;
      retryDelay?: number;
      _retryCount?: number;
    };
    
    if (!config) {
      return Promise.reject(error);
    }

    // Initialize retry tracking
    if (config._retryCount === undefined) {
      config._retryCount = 0;
    }

    const maxRetries = isLovableCloud() ? 3 : 2; // More retries for cloud
    const isRetryable = 
      !error.response || // Network error
      error.response.status >= 500 || // Server errors
      error.response.status === 429; // Rate limiting

    // Only retry on retryable errors and idempotent methods
    const isIdempotent = config.method?.toLowerCase() === 'get' || 
                        config.method?.toLowerCase() === 'head' ||
                        config.method?.toLowerCase() === 'options';

    if (isRetryable && isIdempotent && config._retryCount < maxRetries) {
      config._retryCount += 1;
      
      // Exponential backoff with jitter
      const baseDelay = 500;
      const exponentialDelay = baseDelay * Math.pow(2, config._retryCount - 1);
      const jitter = Math.random() * 200;
      const delay = exponentialDelay + jitter;

      console.log(`[API] Retrying ${config.method?.toUpperCase()} ${config.url} (attempt ${config._retryCount}/${maxRetries}) after ${Math.round(delay)}ms`);

      // For Lovable Cloud, check health before retrying
      if (isLovableCloud() && config._retryCount === 1) {
        try {
          await checkBackendHealth();
        } catch (healthError) {
          console.warn('[API] Health check failed, proceeding with retry anyway');
        }
      }

      await new Promise((r) => setTimeout(r, delay));
      return client(config);
    }

    // Log final error
    if (error.response) {
      console.error(`[API] Request failed: ${error.response.status} ${error.response.statusText}`, {
        url: config.url,
        method: config.method,
        retries: config._retryCount,
      });
    } else {
      console.error(`[API] Network error:`, error.message, {
        url: config.url,
        method: config.method,
        retries: config._retryCount,
      });
    }
    
    return Promise.reject(error);
  }
);

// Enhanced request interceptor with Lovable Cloud optimizations
client.interceptors.request.use(
  (config) => {
    // Add request ID for tracing
    config.headers['X-Request-ID'] = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Add Lovable Cloud metadata
    if (isLovableCloud()) {
      config.headers['X-Cloud-Environment'] = 'lovable';
    }

    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        timeout: config.timeout,
      });
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;
