import { useState, useEffect, useRef, useCallback } from 'react';
import { DashboardData } from '@/lib/types';
import { getBackendUrl } from '@/utils/backendUrl';

export interface StreamError {
  type: 'network' | 'parse' | 'server' | 'timeout' | 'unknown';
  message: string;
  details?: string;
  timestamp: number;
  retryable: boolean;
}

export function useLiveStream(
  track: string,
  race: number,
  vehicle: number,
  startLap: number = 1
) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<StreamError | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataTimestampRef = useRef<number>(Date.now());
  const connectRef = useRef<((preserveReconnectCount?: boolean) => void) | null>(null);

  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 seconds
  const CONNECTION_TIMEOUT = 10000; // 10 seconds
  const DATA_TIMEOUT = 30000; // 30 seconds - if no data received

  const createError = (
    type: StreamError['type'],
    message: string,
    details?: string,
    retryable: boolean = true
  ): StreamError => ({
    type,
    message,
    details,
    timestamp: Date.now(),
    retryable,
  });

  const clearTimeouts = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  };

  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    clearTimeouts();
    setConnected(false);
  }, []);

  const connect = useCallback((preserveReconnectCount: boolean = false) => {
    if (!track || !race || !vehicle) {
      setError(createError(
        'unknown',
        'Invalid stream parameters',
        `Track: ${track}, Race: ${race}, Vehicle: ${vehicle}`,
        false
      ));
      return;
    }

    // Close existing connection
    closeConnection();
    
    // Reset reconnect attempts only if not preserving (i.e., on initial connect or manual retry)
    if (!preserveReconnectCount) {
      setReconnectAttempts(0);
    }

    // getBackendUrl() returns empty string for relative paths, which is valid
    // Only check for null/undefined, not empty string
    const backendUrl = getBackendUrl();
    const API_URL = backendUrl !== null && backendUrl !== undefined 
      ? backendUrl 
      : (import.meta.env.DEV ? '' : '');
    
    // Empty string is valid (means use relative paths), so we don't need to check for it
    const url = `${API_URL}/api/live/stream?track=${track}&race=${race}&vehicle=${vehicle}&start_lap=${startLap}&interval=1.0`;
    
    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Connection timeout
      connectionTimeoutRef.current = setTimeout(() => {
        if (eventSource.readyState !== EventSource.OPEN) {
          eventSource.close();
          const timeoutError = createError(
            'timeout',
            'Connection timeout',
            `Failed to establish connection within ${CONNECTION_TIMEOUT / 1000} seconds. The backend may be slow to respond or unavailable.`,
            true
          );
          setError(timeoutError);
          setReconnectAttempts(prev => {
            if (prev < MAX_RECONNECT_ATTEMPTS) {
              const nextAttempt = prev + 1;
              reconnectTimeoutRef.current = setTimeout(() => {
                console.log(`Reconnection attempt ${nextAttempt}/${MAX_RECONNECT_ATTEMPTS}`);
                if (connectRef.current) {
                  connectRef.current(true);
                }
              }, RECONNECT_DELAY);
              return nextAttempt;
            }
            return prev;
          });
        }
      }, CONNECTION_TIMEOUT);

      // Data timeout - check if we're receiving data
      const checkDataTimeout = () => {
        const timeSinceLastData = Date.now() - lastDataTimestampRef.current;
        if (timeSinceLastData > DATA_TIMEOUT && connected) {
          const timeoutError = createError(
            'timeout',
            'Data stream timeout',
            `No data received for ${DATA_TIMEOUT / 1000} seconds. The stream may have stalled.`,
            true
          );
          setError(timeoutError);
          setReconnectAttempts(prev => {
            if (prev < MAX_RECONNECT_ATTEMPTS) {
              const nextAttempt = prev + 1;
              reconnectTimeoutRef.current = setTimeout(() => {
                console.log(`Reconnection attempt ${nextAttempt}/${MAX_RECONNECT_ATTEMPTS}`);
                if (connectRef.current) {
                  connectRef.current(true);
                }
              }, RECONNECT_DELAY);
              return nextAttempt;
            }
            return prev;
          });
        }
      };
      const dataTimeoutInterval = setInterval(checkDataTimeout, 5000);

      eventSource.onopen = () => {
        clearTimeouts();
        setConnected(true);
        setError(null);
        setReconnectAttempts(0); // Reset on successful connection
        lastDataTimestampRef.current = Date.now();
        clearInterval(dataTimeoutInterval);
      };

      eventSource.addEventListener('update', (e) => {
        try {
          lastDataTimestampRef.current = Date.now();
          const json = JSON.parse(e.data);
          
          // Validate data structure
          if (!json || typeof json !== 'object') {
            throw new Error('Invalid data structure: expected object');
          }
          
          // Check for required fields
          if (!json.meta || !json.tire_wear || !json.performance || !json.strategy) {
            throw new Error('Invalid data structure: missing required fields');
          }
          
          setData(json);
          setError(null); // Clear any previous errors on successful data
        } catch (err) {
          const parseError = createError(
            'parse',
            'Failed to parse stream data',
            err instanceof Error ? err.message : 'Unknown parsing error',
            false
          );
          setError(parseError);
          console.error('Parse error:', err, 'Raw data:', e.data);
        }
      });

      // Custom error event from server (if backend sends error events)
      eventSource.addEventListener('error', (e: MessageEvent) => {
        try {
          if (e.data) {
            const errorData = JSON.parse(e.data);
            const serverError = createError(
              'server',
              'Server error',
              errorData.error || errorData.message || 'Unknown server error',
              errorData.retryable !== false // Default to retryable unless explicitly false
            );
            setError(serverError);
          }
        } catch {
          // If error event doesn't have parseable data, ignore it
          // The onerror handler will catch connection errors
        }
      });

      eventSource.addEventListener('complete', () => {
        closeConnection();
        setError(createError(
          'server',
          'Stream completed',
          'The data stream has finished. All data has been received.',
          false
        ));
      });

      eventSource.onerror = (event) => {
        clearTimeouts();
        setConnected(false);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          // Connection was closed - attempt reconnect
          setReconnectAttempts(prev => {
            if (prev < MAX_RECONNECT_ATTEMPTS) {
              const nextAttempt = prev + 1;
              reconnectTimeoutRef.current = setTimeout(() => {
                console.log(`Reconnection attempt ${nextAttempt}/${MAX_RECONNECT_ATTEMPTS}`);
                if (connectRef.current) {
                  connectRef.current(true);
                }
              }, RECONNECT_DELAY);
              return nextAttempt;
            } else {
              const networkError = createError(
                'network',
                'Connection lost',
                `Failed to maintain connection after ${MAX_RECONNECT_ATTEMPTS} attempts. Please check your network connection and backend server status.`,
                true
              );
              setError(networkError);
              return prev;
            }
          });
        } else if (eventSource.readyState === EventSource.CONNECTING) {
          // Still connecting - might be a network issue
          const networkError = createError(
            'network',
            'Connection failed',
            'Unable to establish connection to the backend server. Please verify the server is running and accessible.',
            true
          );
          setError(networkError);
        } else {
          // Other error state
          const unknownError = createError(
            'unknown',
            'Stream error',
            `EventSource error state: ${eventSource.readyState}`,
            true
          );
          setError(unknownError);
        }
      };

      // Cleanup interval on unmount
      return () => {
        clearInterval(dataTimeoutInterval);
      };
    } catch (err) {
      const initError = createError(
        'unknown',
        'Failed to initialize stream',
        err instanceof Error ? err.message : 'Unknown initialization error',
        true
      );
      setError(initError);
    }
  }, [track, race, vehicle, startLap, closeConnection, connected]);

  // Store latest connect function in ref
  connectRef.current = connect;

  useEffect(() => {
    connect();

    return () => {
      closeConnection();
    };
  }, [connect, closeConnection]);

  const retry = () => {
    setReconnectAttempts(0);
    setError(null);
    connect(false); // Reset reconnect count on manual retry
  };

  return { 
    data, 
    connected, 
    error,
    reconnectAttempts,
    retry,
    maxReconnectAttempts: MAX_RECONNECT_ATTEMPTS
  };
}

