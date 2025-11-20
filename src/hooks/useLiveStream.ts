import { useState, useEffect } from 'react';
import { DashboardData } from '@/lib/types';

const API_URL = import.meta.env.VITE_API_BASE_URL;

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

    const url = `${API_URL}/api/live/stream?track=${track}&race=${race}&vehicle=${vehicle}&start_lap=${startLap}&interval=1.0`;
    const eventSource = new EventSource(url);

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.addEventListener('update', (e) => {
      const json = JSON.parse(e.data);
      setData(json);
    });

    eventSource.addEventListener('error', (e: any) => {
      const errorData = JSON.parse(e.data);
      setError(errorData.error);
    });

    eventSource.addEventListener('complete', () => {
      eventSource.close();
      setConnected(false);
    });

    eventSource.onerror = () => {
      setConnected(false);
      setError('Connection to stream lost.');
    };

    return () => {
      eventSource.close();
    };
  }, [track, race, vehicle, startLap]);

  return { data, connected, error };
}

