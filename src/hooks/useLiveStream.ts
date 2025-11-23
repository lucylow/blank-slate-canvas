import { useState, useEffect } from 'react';
import { DashboardData } from '@/lib/types';
import { getBackendUrl } from '@/utils/backendUrl';

export function useLiveStream(
  track: string,
  race: number,
  vehicle: number,
  startLap: number = 1
) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!track || !race || !vehicle) return;
    
    // getBackendUrl() returns empty string for relative paths, which is valid
    // Only check for null/undefined, not empty string
    const backendUrl = getBackendUrl();
    const API_URL = backendUrl !== null && backendUrl !== undefined 
      ? backendUrl 
      : (import.meta.env.DEV ? '' : '');
    
    // Empty string is valid (means use relative paths), so we don't need to check for it
    const url = `${API_URL}/api/live/stream?track=${track}&race=${race}&vehicle=${vehicle}&start_lap=${startLap}&interval=1.0`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.addEventListener('update', (e) => {
      try {
        const json = JSON.parse(e.data);
        setData(json);
      } catch (err) {
        setError('Failed to parse update data');
      }
    });

    // Custom error event from server (if backend sends error events)
    eventSource.addEventListener('error', (e: MessageEvent) => {
      try {
        if (e.data) {
          const errorData = JSON.parse(e.data);
          setError(errorData.error || 'Stream error occurred');
        }
      } catch {
        // If error event doesn't have parseable data, ignore it
        // The onerror handler will catch connection errors
      }
    });

    eventSource.addEventListener('complete', () => {
      eventSource.close();
      setConnected(false);
    });

    eventSource.onerror = () => {
      setConnected(false);
      if (eventSource.readyState === EventSource.CLOSED) {
        setError('Connection to stream lost.');
      }
    };

    return () => {
      eventSource.close();
    };
  }, [track, race, vehicle, startLap]);

  return { data, connected, error };
}

