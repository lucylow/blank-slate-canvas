import { useState, useEffect } from 'react';
import { TrackPoint } from '../utils/trackUtils';

interface TrackCenterlineData {
  track: string;
  trackId: string;
  totalLength: number;
  centerline: TrackPoint[];
}

/**
 * Hook to load track centerline data from JSON file
 */
export function useTrackCenterline(trackId: string | null): {
  centerline: TrackPoint[];
  loading: boolean;
  error: Error | null;
  trackData: TrackCenterlineData | null;
} {
  const [centerline, setCenterline] = useState<TrackPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [trackData, setTrackData] = useState<TrackCenterlineData | null>(null);

  useEffect(() => {
    if (!trackId) {
      setCenterline([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/tracks/${trackId}_centerline.json`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load track: ${trackId}`);
        }
        return res.json();
      })
      .then((data: TrackCenterlineData) => {
        setTrackData(data);
        setCenterline(data.centerline || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
        setCenterline([]);
      });
  }, [trackId]);

  return { centerline, loading, error, trackData };
}


