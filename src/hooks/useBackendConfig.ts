import { useState, useEffect } from 'react';
import { BackendConfig } from '@/lib/types';

const API_URL = import.meta.env.VITE_API_BASE_URL;

export function useBackendConfig() {
  const [config, setConfig] = useState<BackendConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/config`)
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { config, loading };
}

