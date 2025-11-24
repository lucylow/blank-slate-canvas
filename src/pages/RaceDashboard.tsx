// src/pages/RaceDashboard.tsx
// Real-time race dashboard with telemetry and CV track analysis

import React, { useEffect, useState } from 'react';
import LiveTrackCanvas from '@/components/LiveTrackCanvas';
import { CV_TRACK_DATA, type CVAnalysisResult } from '@/data/mock_cv_track_analysis';
import { AlertCircle, TrendingUp, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CarTelemetry {
  car_id: string;
  lapdist?: number; // meters
  position?: number; // 0-1 ratio
  speed: number; // km/h
  throttle: number; // 0-1
  brake?: number; // 0-1
  gear?: number;
  color?: string;
  lap?: number;
}

interface DashboardState {
  cars: CarTelemetry[];
  alerts: Array<{ message: string; timestamp: number; severity: 'info' | 'warning' | 'error' }>;
  leaderboard: CarTelemetry[];
  selectedTrack: CVAnalysisResult | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

const RaceDashboard: React.FC = () => {
  const [state, setState] = useState<DashboardState>({
    cars: [],
    alerts: [],
    leaderboard: [],
    selectedTrack: null,
    connectionStatus: 'disconnected',
  });

  // Select COTA by default, or allow track selection
  useEffect(() => {
    const track = CV_TRACK_DATA.find((t) => t.trackId === 'cota') || CV_TRACK_DATA[0];
    setState((prev) => ({ ...prev, selectedTrack: track }));
  }, []);

  // WebSocket connection for real-time telemetry
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      setState((prev) => ({ ...prev, connectionStatus: 'connecting' }));

      try {
        // Try different WebSocket endpoints
        const wsUrl = import.meta.env.DEV
          ? 'ws://localhost:8000/ws/race-stream'
          : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/race-stream`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('Race stream WebSocket connected');
          setState((prev) => ({ ...prev, connectionStatus: 'connected' }));
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);

            if (message.type === 'telemetry_update') {
              const updates = Array.isArray(message.data) ? message.data : [message.data];

              // Process batch updates
              const newCars: CarTelemetry[] = updates.map((u: any, index: number) => {
                const telemetry = u.telemetry || u;
                return {
                  car_id: telemetry.car_id || telemetry.vehicle_id || `CAR-${index + 1}`,
                  lapdist: telemetry.lapdist || telemetry.lap_distance,
                  position: telemetry.position,
                  speed: telemetry.speed || 0,
                  throttle: telemetry.throttle || 0,
                  brake: telemetry.brake || 0,
                  gear: telemetry.gear,
                  lap: telemetry.lap,
                  color: telemetry.color || undefined, // Use provided color or generate
                };
              });

              // Generate alerts from analysis
              const newAlerts = updates
                .filter((u: any) => u.analysis?.alert)
                .map((u: any) => ({
                  message: u.analysis.alert,
                  timestamp: Date.now(),
                  severity: (u.analysis.severity || 'info') as 'info' | 'warning' | 'error',
                }));

              // Update leaderboard (sorted by speed)
              const leaderboard = [...newCars]
                .sort((a, b) => b.speed - a.speed)
                .slice(0, 5);

              setState((prev) => ({
                ...prev,
                cars: newCars,
                alerts: [...newAlerts, ...prev.alerts].slice(0, 10), // Keep last 10 alerts
                leaderboard,
              }));
            }
          } catch (error) {
            console.error('Error processing telemetry message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setState((prev) => ({ ...prev, connectionStatus: 'disconnected' }));
        };

        ws.onclose = () => {
          console.log('WebSocket closed, attempting reconnect...');
          setState((prev) => ({ ...prev, connectionStatus: 'disconnected' }));
          reconnectTimeout = setTimeout(connect, 3000); // Reconnect after 3 seconds
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        setState((prev) => ({ ...prev, connectionStatus: 'disconnected' }));
        reconnectTimeout = setTimeout(connect, 5000); // Retry after 5 seconds
      }
    };

    connect();

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  // Demo mode: Generate mock telemetry data if WebSocket is not connected
  useEffect(() => {
    if (state.connectionStatus === 'disconnected' && state.cars.length === 0) {
      // Generate mock cars for demo
      const mockCars: CarTelemetry[] = [
        { car_id: 'CAR-1', position: 0.2, speed: 185, throttle: 0.85, brake: 0, gear: 5, color: '#ff0000' },
        { car_id: 'CAR-2', position: 0.35, speed: 192, throttle: 0.92, brake: 0, gear: 5, color: '#00ff00' },
        { car_id: 'CAR-3', position: 0.5, speed: 178, throttle: 0.78, brake: 0, gear: 4, color: '#0000ff' },
        { car_id: 'CAR-4', position: 0.65, speed: 190, throttle: 0.88, brake: 0, gear: 5, color: '#ffff00' },
        { car_id: 'CAR-5', position: 0.8, speed: 175, throttle: 0.75, brake: 0.1, gear: 4, color: '#ff00ff' },
      ];

      setState((prev) => ({
        ...prev,
        cars: mockCars,
        leaderboard: [...mockCars].sort((a, b) => b.speed - a.speed).slice(0, 5),
        alerts: [
          { message: 'Demo mode active - Using mock telemetry data', timestamp: Date.now(), severity: 'info' },
        ],
      }));

      // Animate mock cars
      const interval = setInterval(() => {
        setState((prev) => {
          const updatedCars = prev.cars.map((car) => ({
            ...car,
            position: ((car.position || 0) + 0.001) % 1, // Move along track
            speed: car.speed + (Math.random() - 0.5) * 2, // Slight speed variation
            throttle: Math.max(0, Math.min(1, car.throttle! + (Math.random() - 0.5) * 0.05)),
          }));
          return {
            ...prev,
            cars: updatedCars,
            leaderboard: [...updatedCars].sort((a, b) => b.speed - a.speed).slice(0, 5),
          };
        });
      }, 100); // Update 10 times per second

      return () => clearInterval(interval);
    }
  }, [state.connectionStatus]);

  const selectedTrack = state.selectedTrack;

  // Get track image path - normalize track ID to match SVG file names
  const trackIdMap: Record<string, string> = {
    'road_america': 'road_america',
    'indianapolis_motor_speedway': 'indianapolis',
    'barber_motorsports_park': 'barber',
    'cota': 'cota',
    'sebring_international_raceway': 'sebring',
    'sonoma_raceway': 'sonoma',
    'virginia_international_raceway': 'virginia',
  };

  const getTrackImagePath = (trackId: string | undefined): string => {
    if (!trackId) return '/tracks/cota.svg';
    const svgName = trackIdMap[trackId] || trackId;
    return `/tracks/${svgName}.svg`;
  };

  const getTrackName = (trackId: string | undefined): string => {
    if (!trackId) return 'cota';
    return trackIdMap[trackId] || trackId;
  };

  const trackImagePath = getTrackImagePath(selectedTrack?.trackId);
  const trackName = getTrackName(selectedTrack?.trackId);

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans overflow-hidden">
      {/* Left: Track Visualization */}
      <div className="flex-grow relative">
        {/* Header overlay */}
        <div className="absolute top-6 left-6 z-10 bg-black/70 backdrop-blur-md p-4 rounded-lg border border-gray-700 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-white">
                {selectedTrack?.metadata.extractedName || 'Circuit of the Americas'}
              </h1>
              <div className="flex gap-2 mt-2">
                <motion.span
                  className={`px-3 py-1 text-xs rounded-full font-semibold ${
                    state.connectionStatus === 'connected'
                      ? 'bg-green-600 text-white'
                      : state.connectionStatus === 'connecting'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-red-600 text-white'
                  }`}
                  animate={{
                    opacity: state.connectionStatus === 'connecting' ? [1, 0.5, 1] : 1,
                  }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {state.connectionStatus === 'connected'
                    ? '● LIVE'
                    : state.connectionStatus === 'connecting'
                    ? '● CONNECTING...'
                    : '● OFFLINE'}
                </motion.span>
                <span className="px-3 py-1 bg-gray-700 text-xs rounded-full">
                  TRACK TEMP: 32°C
                </span>
                <span className="px-3 py-1 bg-gray-700 text-xs rounded-full">
                  {state.cars.length} CARS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Track Canvas */}
        <LiveTrackCanvas
          trackImage={trackImagePath}
          track={trackName}
          cars={state.cars}
          features={selectedTrack?.detectedFeatures || []}
          totalMeters={5000} // Adjust based on actual track length
          showGlow={true}
        />
      </div>

      {/* Right: Real-Time Analytics Panel */}
      <div className="w-96 bg-gray-800 border-l border-gray-700 p-4 flex flex-col gap-4 overflow-y-auto">
        {/* Alerts Section */}
        <div className="bg-gray-900 rounded-lg p-4 border border-red-900/50 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Race Control Alerts
            </h2>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <AnimatePresence>
              {state.alerts.length === 0 && (
                <span className="text-gray-600 text-sm">No active alerts</span>
              )}
              {state.alerts.map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`flex items-center gap-2 text-sm p-2 rounded ${
                    alert.severity === 'error'
                      ? 'text-red-400 bg-red-900/20'
                      : alert.severity === 'warning'
                      ? 'text-yellow-400 bg-yellow-900/20'
                      : 'text-blue-400 bg-blue-900/20'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      alert.severity === 'error'
                        ? 'bg-red-500'
                        : alert.severity === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  {alert.message}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Live Leaderboard (Speed Based) */}
        <div className="flex-grow bg-gray-900 rounded-lg p-4 border border-gray-700 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Live Telemetry (Top 5 Speed)
            </h2>
          </div>
          <div className="space-y-2">
            <AnimatePresence>
              {state.leaderboard.map((car, index) => (
                <motion.div
                  key={car.car_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg hover:bg-gray-700 transition-all border border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: car.color || '#666' }}
                    />
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-blue-400">{car.car_id}</span>
                      <div className="flex gap-3 text-xs text-gray-400">
                        <span>Throttle: {(car.throttle * 100).toFixed(0)}%</span>
                        {car.brake !== undefined && (
                          <span>Brake: {(car.brake * 100).toFixed(0)}%</span>
                        )}
                        {car.gear && <span>Gear: {car.gear}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-lg font-bold text-white">
                      {car.speed.toFixed(0)}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">km/h</span>
                    {index === 0 && (
                      <div className="text-xs text-yellow-500 font-bold mt-1">🏁 LEADER</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {state.leaderboard.length === 0 && (
              <span className="text-gray-600 text-sm">No telemetry data</span>
            )}
          </div>
        </div>

        {/* Track Complexity Stats (From CV) */}
        {selectedTrack && (
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs text-gray-500 uppercase tracking-wider">Track Analysis (CV)</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded p-3">
                <div className="text-2xl font-bold text-yellow-400">
                  {selectedTrack.complexityMetrics.cornerCount}
                </div>
                <div className="text-xs text-gray-400">Corners Detected</div>
              </div>
              <div className="bg-gray-800 rounded p-3">
                <div className="text-2xl font-bold text-green-400">
                  {(selectedTrack.complexityMetrics.curvatureScore * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-gray-400">Complexity Score</div>
              </div>
              <div className="bg-gray-800 rounded p-3 col-span-2">
                <div className="text-xs text-gray-400 mb-1">Track Width Variance</div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${selectedTrack.complexityMetrics.trackWidthVariance * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Track Selection */}
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 shadow-lg">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Available Tracks</h3>
          <div className="grid grid-cols-2 gap-2">
            {CV_TRACK_DATA.map((track) => (
              <button
                key={track.trackId}
                onClick={() => setState((prev) => ({ ...prev, selectedTrack: track }))}
                className={`p-2 rounded text-xs font-semibold transition-all ${
                  selectedTrack?.trackId === track.trackId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {track.metadata.extractedName.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceDashboard;
