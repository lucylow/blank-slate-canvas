import { useState } from 'react';
import { useBackendConfig } from '@/hooks/useBackendConfig';
import { useLiveStream } from '@/hooks/useLiveStream';
import { TireWearCard } from '@/components/dashboard/TireWearCard';
import { StrategyCard } from '@/components/dashboard/StrategyCard';
import { PerformanceCard } from '@/components/dashboard/PerformanceCard';

export function Dashboard() {
  const { config, loading: configLoading } = useBackendConfig();
  const [selectedTrack, setSelectedTrack] = useState('sebring');
  const [selectedRace, setSelectedRace] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState(7);

  const { data, connected, error } = useLiveStream(
    selectedTrack,
    selectedRace,
    selectedVehicle
  );

  if (configLoading) return <div className="p-4">Loading Configuration...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-red-500">PitWall A.I.</h1>
        <div className="status">
          {connected ? '🟢 Live' : '🔴 Disconnected'}
        </div>
      </header>
      {/* Add selectors for track, race, and vehicle here later */}
      {error && <div className="bg-red-800 p-2 rounded mb-4">Error: {error}</div>}
      {data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 grid grid-cols-1 gap-4">
            <PerformanceCard performance={data.performance} meta={data.meta} />
            <TireWearCard wear={data.tire_wear} />
          </div>
          <div className="md:col-span-1">
            <StrategyCard strategy={data.strategy} />
          </div>
        </div>
      ) : (
        <div>Waiting for live data...</div>
      )}
    </div>
  );
}

