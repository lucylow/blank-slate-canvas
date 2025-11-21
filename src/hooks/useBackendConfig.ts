import { useState, useEffect } from 'react';
import { BackendConfig } from '@/lib/types';
import { getBackendUrl } from '@/utils/backendUrl';

export function useBackendConfig() {
  const [config, setConfig] = useState<BackendConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const API_URL = getBackendUrl() || (import.meta.env.DEV ? '/api' : '');
    if (!API_URL) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/api/config`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setConfig(data);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load config');
        setLoading(false);
      });
  }, []);

  return { config, loading, error };
}

