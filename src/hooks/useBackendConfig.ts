import { useState, useEffect } from 'react';
import { BackendConfig } from '@/lib/types';
import { getBackendUrl } from '@/utils/backendUrl';

export interface ConfigError {
  type: 'network' | 'server' | 'parse' | 'timeout' | 'unknown';
  message: string;
  details?: string;
  statusCode?: number;
  timestamp: number;
  retryable: boolean;
}

export function useBackendConfig() {
  const [config, setConfig] = useState<BackendConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ConfigError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  const REQUEST_TIMEOUT = 10000; // 10 seconds

  const createError = (
    type: ConfigError['type'],
    message: string,
    details?: string,
    statusCode?: number,
    retryable: boolean = true
  ): ConfigError => ({
    type,
    message,
    details,
    statusCode,
    timestamp: Date.now(),
    retryable,
  });

  const fetchConfig = async (isRetry: boolean = false) => {
    try {
      // getBackendUrl() returns empty string for relative paths, which is valid
      // Empty string means use relative paths (e.g., /api/config)
      const backendUrl = getBackendUrl();
      const API_URL = backendUrl !== null && backendUrl !== undefined 
        ? backendUrl 
        : (import.meta.env.DEV ? '' : '');
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      try {
        const res = await fetch(`${API_URL}/api/config`, {
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          let errorDetails = `HTTP ${res.status}: ${res.statusText}`;
          
          // Try to get error message from response body
          try {
            const errorData = await res.json();
            if (errorData.message || errorData.error) {
              errorDetails = errorData.message || errorData.error;
            }
          } catch {
            // If response is not JSON, use status text
          }

          const serverError = createError(
            'server',
            `Server error (${res.status})`,
            errorDetails,
            res.status,
            res.status >= 500 || res.status === 429 // Retry on server errors and rate limits
          );
          setError(serverError);
          setLoading(false);

          // Retry on retryable errors
          if (serverError.retryable && retryCount < MAX_RETRIES && !isRetry) {
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              fetchConfig(true);
            }, RETRY_DELAY);
          }
          return;
        }

        const data = await res.json();

        // Validate config structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid config: expected object');
        }

        if (!data.tracks || !Array.isArray(data.tracks)) {
          throw new Error('Invalid config: missing or invalid tracks array');
        }

        setConfig(data);
        setError(null);
        setRetryCount(0);
        setLoading(false);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          const timeoutError = createError(
            'timeout',
            'Request timeout',
            `Configuration request timed out after ${REQUEST_TIMEOUT / 1000} seconds. The backend may be slow to respond.`,
            undefined,
            true
          );
          setError(timeoutError);
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          const networkError = createError(
            'network',
            'Network error',
            'Unable to reach the backend server. Please check your network connection and ensure the backend is running.',
            undefined,
            true
          );
          setError(networkError);
        } else {
          const unknownError = createError(
            'unknown',
            'Configuration error',
            err.message,
            undefined,
            true
          );
          setError(unknownError);
        }
      } else {
        const unknownError = createError(
          'unknown',
          'Unknown error',
          'An unexpected error occurred while loading configuration',
          undefined,
          true
        );
        setError(unknownError);
      }

      setLoading(false);

      // Retry on retryable errors
      if (retryCount < MAX_RETRIES && !isRetry && error?.retryable !== false) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchConfig(true);
        }, RETRY_DELAY);
      }
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const retry = () => {
    setRetryCount(0);
    setError(null);
    setLoading(true);
    fetchConfig();
  };

  return { 
    config, 
    loading, 
    error,
    retry,
    retryCount,
    maxRetries: MAX_RETRIES
  };
}

