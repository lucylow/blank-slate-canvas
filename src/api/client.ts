// src/api/client.ts
// Axios client with retry logic, timeout, and base URL configuration

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

// Use /api for dev (proxied by Vite) or explicit env var for production
const BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? '/api' : '');

const client = axios.create({
  baseURL: BASE,
  timeout: 8000,
  headers: { "Content-Type": "application/json" },
});

// Simple retry interceptor (idempotent GET only)
client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { retry?: number };
    
    if (!config || !config.retry) {
      config.retry = 0;
    }
    
    // Only retry GET requests (idempotent)
    if (config && config.method?.toLowerCase() === 'get' && config.retry < 2) {
      config.retry += 1;
      const delay = 300 * config.retry;
      console.log(`[API] Retrying request (attempt ${config.retry}/2) after ${delay}ms`);
      
      await new Promise((r) => setTimeout(r, delay));
      return client(config);
    }
    
    return Promise.reject(error);
  }
);

// Request interceptor for logging (optional)
client.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default client;

