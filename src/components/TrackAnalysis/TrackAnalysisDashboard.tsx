/**
 * TrackAnalysisDashboard Component
 * 
 * Main dashboard for track analysis featuring:
 * - Track selection
 * - Interactive track map with real-time telemetry
 * - Sector analysis panel
 * - Telemetry charts
 * - Overlay controls
 */

import React, { useState, useEffect, useMemo } from 'react';
import InteractiveTrackMap, { TelemetryPoint, HeatmapData } from './InteractiveTrackMap';
import { TRACK_GEOMETRY, getTrackById, getSectorForProgress } from '../../data/track_geometry';
import { CV_TRACK_DATA } from '../../data/mock_cv_track_analysis';

// Mock telemetry generator - in production, this would come from WebSocket/API
const generateTelemetry = (count: number, trackId: string): TelemetryPoint[] => {
  const baseTime = Date.now() / 10000;
  return Array.from({ length: count }).map((_, i) => ({
    id: `${i + 1}`,
    driver: i === 0 ? 'Hero' : `Rival ${i}`,
    progress: (baseTime + i * 0.1) % 1, // Constant loop around track
    speed: Math.random() * 200 + 50,
    throttle: Math.random() > 0.3 ? Math.random() : 0,
    brake: Math.random() > 0.8 ? Math.random() * 0.8 : 0,
    lap: Math.floor((baseTime + i * 0.1) / 1) + 1,
    position: i + 1,
    color: i === 0 ? '#10B981' : i === 1 ? '#EF4444' : i === 2 ? '#3B82F6' : '#F59E0B',
  }));
};

// Generate heatmap data from telemetry
const generateHeatmapData = (
  telemetry: TelemetryPoint[],
  mode: 'speed' | 'brake' | 'throttle'
): HeatmapData[] => {
  // Group telemetry by progress bins
  const bins: Map<number, number[]> = new Map();
  const binSize = 0.01; // 1% bins

  telemetry.forEach((point) => {
    const bin = Math.floor(point.progress / binSize);
    if (!bins.has(bin)) {
      bins.set(bin, []);
    }
    
    let value = 0;
    if (mode === 'speed') {
      value = point.speed / 300; // Normalize to 0-1 (assuming max 300 km/h)
    } else if (mode === 'brake') {
      value = point.brake;
    } else if (mode === 'throttle') {
      value = point.throttle;
    }
    
    bins.get(bin)!.push(value);
  });

  // Average values per bin
  const heatmap: HeatmapData[] = [];
  bins.forEach((values, bin) => {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    heatmap.push({
      progress: bin * binSize,
      value: avg,
    });
  });

  return heatmap.sort((a, b) => a.progress - b.progress);
};

interface SectorStats {
  sectorId: string;
  avgSpeed: number;
  minSpeed: number;
  maxSpeed: number;
  avgBrake: number;
  timeSpent: number;
  carCount: number;
}

const TrackAnalysisDashboard: React.FC = () => {
  const [selectedTrackId, setSelectedTrackId] = useState('cota');
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(() => generateTelemetry(5, 'cota'));
  const [overlay, setOverlay] = useState<'none' | 'speed' | 'brake' | 'throttle'>('speed');
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedCar, setSelectedCar] = useState<TelemetryPoint | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const currentTrack = getTrackById(selectedTrackId);
  const currentTrackCV = CV_TRACK_DATA.find(t => t.trackId === selectedTrackId);

  // Update telemetry when track changes
  useEffect(() => {
    setTelemetry(generateTelemetry(5, selectedTrackId));
    setSelectedSector(null);
    setSelectedCar(null);
    setZoom(1);
    setPanX(0);
    setPanY(0);
  }, [selectedTrackId]);

  // Simulation Loop
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setTelemetry((prev) =>
        prev.map((car) => {
          const speedFactor = car.speed / 200;
          const newProgress = (car.progress + 0.002 * speedFactor) % 1;
          
          // Simulate realistic speed changes
          let newSpeed = car.speed;
          const sector = getSectorForProgress(currentTrack?.sectors || [], newProgress);
          
          // Adjust speed based on sector (simplified model)
          if (sector?.id === 'S1') {
            newSpeed = Math.max(50, Math.min(300, newSpeed + (Math.random() - 0.4) * 15));
          } else if (sector?.id === 'S2') {
            newSpeed = Math.max(50, Math.min(280, newSpeed + (Math.random() - 0.5) * 20));
          } else {
            newSpeed = Math.max(50, Math.min(250, newSpeed + (Math.random() - 0.3) * 12));
          }

          return {
            ...car,
            progress: newProgress,
            speed: newSpeed,
            throttle: Math.random() > 0.3 ? Math.random() : 0,
            brake: Math.random() > 0.85 ? Math.random() * 0.8 : 0,
            lap: Math.floor(newProgress) + 1,
          };
        })
      );
    }, 50); // ~20 FPS

    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  // Calculate sector statistics
  const sectorStats = useMemo((): SectorStats[] => {
    if (!currentTrack || telemetry.length === 0) return [];

    return currentTrack.sectors.map((sector) => {
      const carsInSector = telemetry.filter(
        (car) => car.progress >= sector.startPct && car.progress < sector.endPct
      );

      if (carsInSector.length === 0) {
        return {
          sectorId: sector.id,
          avgSpeed: 0,
          minSpeed: 0,
          maxSpeed: 0,
          avgBrake: 0,
          timeSpent: 0,
          carCount: 0,
        };
      }

      const speeds = carsInSector.map((c) => c.speed);
      const brakes = carsInSector.map((c) => c.brake);

      return {
        sectorId: sector.id,
        avgSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
        minSpeed: Math.min(...speeds),
        maxSpeed: Math.max(...speeds),
        avgBrake: brakes.reduce((a, b) => a + b, 0) / brakes.length,
        timeSpent: carsInSector.length * 0.05, // Approximate
        carCount: carsInSector.length,
      };
    });
  }, [currentTrack, telemetry]);

  // Generate heatmap data
  const heatmapData = useMemo(() => {
    if (overlay === 'none') return undefined;
    return generateHeatmapData(telemetry, overlay);
  }, [telemetry, overlay]);

  const handleSectorClick = (sectorId: string) => {
    setSelectedSector(selectedSector === sectorId ? null : sectorId);
  };

  const handleCarClick = (car: TelemetryPoint) => {
    setSelectedCar(selectedCar?.id === car.id ? null : car);
  };

  if (!currentTrack) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center">
          <p className="text-xl font-semibold">Track not found</p>
          <p className="text-sm mt-2 text-gray-400">Track ID: {selectedTrackId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            PitWall Track Analysis
          </h1>
          <select
            value={selectedTrackId}
            onChange={(e) => setSelectedTrackId(e.target.value)}
            className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
          >
            {Object.values(TRACK_GEOMETRY).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {currentTrack.description && (
            <span className="text-sm text-gray-400 hidden md:inline">
              {currentTrack.description}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg border border-gray-700 transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Overlay Mode Selector */}
          <div className="flex gap-1 bg-gray-800 p-1 rounded-lg border border-gray-700">
            {(['none', 'speed', 'brake', 'throttle'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setOverlay(mode)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  overlay === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {mode === 'none' ? 'None' : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Map - Left Side */}
        <div className="flex-1 p-4 min-w-0">
          <InteractiveTrackMap
            trackId={selectedTrackId}
            telemetryData={telemetry}
            overlayMode={overlay}
            heatmapData={heatmapData}
            onSectorClick={handleSectorClick}
            onCarClick={handleCarClick}
            showSectors={true}
            showTurns={true}
            zoom={zoom}
            onZoomChange={setZoom}
            panX={panX}
            panY={panY}
            onPanChange={(x, y) => {
              setPanX(x);
              setPanY(y);
            }}
            className="h-full"
          />
        </div>

        {/* Side Panel - Right Side */}
        <div className="w-96 bg-gray-900 border-l border-gray-800 overflow-y-auto flex flex-col">
          {/* Track Info */}
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold mb-2">{currentTrack.name}</h2>
            {currentTrack.length && (
              <p className="text-sm text-gray-400">
                Length: {(currentTrack.length / 1000).toFixed(2)} km
              </p>
            )}
            {currentTrackCV && (
              <div className="mt-3 text-xs text-gray-500">
                <p>Corners: {currentTrackCV.complexityMetrics.cornerCount}</p>
                <p>Complexity: {(currentTrackCV.complexityMetrics.curvatureScore * 100).toFixed(0)}%</p>
              </div>
            )}
          </div>

          {/* Sector Analysis */}
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-md font-semibold mb-3">Sector Analysis</h3>
            <div className="space-y-2">
              {sectorStats.map((stats) => {
                const sector = currentTrack.sectors.find((s) => s.id === stats.sectorId);
                const isSelected = selectedSector === stats.sectorId;
                
                return (
                  <div
                    key={stats.sectorId}
                    onClick={() => handleSectorClick(stats.sectorId)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: sector?.color }}
                        />
                        <span className="font-medium">{stats.sectorId}</span>
                      </div>
                      <span className="text-xs text-gray-400">{stats.carCount} cars</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Avg Speed:</span>
                        <span className="ml-1 text-white">{stats.avgSpeed.toFixed(0)} km/h</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Max:</span>
                        <span className="ml-1 text-white">{stats.maxSpeed.toFixed(0)} km/h</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Min:</span>
                        <span className="ml-1 text-white">{stats.minSpeed.toFixed(0)} km/h</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Brake:</span>
                        <span className="ml-1 text-white">{(stats.avgBrake * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Car Details */}
          {selectedCar && (
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-md font-semibold mb-3">Car Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Driver:</span>
                  <span className="text-white font-medium">{selectedCar.driver}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Speed:</span>
                  <span className="text-white">{selectedCar.speed.toFixed(0)} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Throttle:</span>
                  <span className="text-white">{(selectedCar.throttle * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Brake:</span>
                  <span className="text-white">{(selectedCar.brake * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Progress:</span>
                  <span className="text-white">{(selectedCar.progress * 100).toFixed(1)}%</span>
                </div>
                {selectedCar.lap && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lap:</span>
                    <span className="text-white">{selectedCar.lap}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Telemetry Summary */}
          <div className="p-4">
            <h3 className="text-md font-semibold mb-3">Live Telemetry</h3>
            <div className="space-y-2">
              {telemetry.slice(0, 5).map((car) => (
                <div
                  key={car.id}
                  onClick={() => handleCarClick(car)}
                  className={`p-2 rounded border text-xs transition-colors ${
                    selectedCar?.id === car.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: car.color }}
                      />
                      <span className="font-medium">{car.driver}</span>
                    </div>
                    <span className="text-gray-400">{car.speed.toFixed(0)} km/h</span>
                  </div>
                  <div className="mt-1 flex gap-2 text-gray-500">
                    <span>{(car.progress * 100).toFixed(0)}%</span>
                    {car.lap && <span>Lap {car.lap}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackAnalysisDashboard;

