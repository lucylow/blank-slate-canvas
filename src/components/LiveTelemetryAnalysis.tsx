/**
 * Live Telemetry Analysis Component
 * 
 * Renders the track using HTML5 Canvas for performance and overlays:
 * - CV Features: Detected corners, straights, pit lanes
 * - Live Telemetry: Cars as dots, color-coded by Tire Health
 * - Analysis Panel: Leaderboard with Pace Delta and alerts
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { TRACK_CV_DATA, TrackAnalysis, getTrackAnalysis } from '../data/cv_track_data';
import { AlertCircle, Wifi, WifiOff, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface TelemetryPacket {
  id: string;
  x: number;
  y: number;
  speed: number;
  tire_health: number;
  lap: number;
  status: string;
  sector: number;
  fuel: number;
  pace_delta?: number;
  optimal_line_deviation?: number;
}

interface Alert {
  car: string;
  type: string;
  msg: string;
  severity?: 'info' | 'warning' | 'critical';
  timestamp?: number;
}

interface AnalysisState {
  telemetry: TelemetryPacket[];
  alerts: Alert[];
  timestamp?: number;
  race_time?: number;
}

interface ConnectionState {
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  error?: string;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/telemetry';

const LiveTelemetryAnalysis: React.FC = () => {
  const [activeTrack, setActiveTrack] = useState<TrackAnalysis>(TRACK_CV_DATA['cota']);
  const [analysisData, setAnalysisData] = useState<AnalysisState>({
    telemetry: [],
    alerts: []
  });
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'disconnected'
  });
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastRenderTime = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionState({ status: 'connecting' });

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Telemetry WebSocket connected');
        setConnectionState({ status: 'connected' });
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: AnalysisState = JSON.parse(event.data);
          setAnalysisData(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          setConnectionState({
            status: 'error',
            error: 'Failed to parse telemetry data'
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState({
          status: 'error',
          error: 'Connection error occurred'
        });
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionState({ status: 'disconnected' });
        
        // Attempt reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          setConnectionState({
            status: 'error',
            error: 'Failed to reconnect after multiple attempts'
          });
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionState({
        status: 'error',
        error: 'Failed to create WebSocket connection'
      });
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Memoized sorted telemetry for leaderboard
  const sortedTelemetry = useMemo(() => {
    return [...analysisData.telemetry].sort((a, b) => {
      // Sort by lap (descending), then by sector (descending), then by speed (descending)
      if (a.lap !== b.lap) return b.lap - a.lap;
      if (a.sector !== b.sector) return b.sector - a.sector;
      return b.speed - a.speed;
    });
  }, [analysisData.telemetry]);

  // Memoized critical alerts
  const criticalAlerts = useMemo(() => {
    return analysisData.alerts.filter(a => a.severity === 'critical');
  }, [analysisData.alerts]);

  // Canvas rendering
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Set up rendering context
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw track background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // Draw track path (from CV Data)
    if (activeTrack.nodes.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      activeTrack.nodes.forEach((node, i) => {
        const px = node.x * w;
        const py = node.y * h;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.stroke();

      // Draw track center line (optimal racing line)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      activeTrack.nodes.forEach((node, i) => {
        const px = node.x * w;
        const py = node.y * h;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw CV Detected Features
    activeTrack.features.forEach(feat => {
      const fx = feat.location.x * w;
      const fy = feat.location.y * h;

      // Feature marker with different colors by type
      ctx.beginPath();
      let fillColor = 'rgba(100, 100, 100, 0.3)';
      let strokeColor = '#666';
      
      switch (feat.type) {
        case 'corner':
          fillColor = 'rgba(255, 165, 0, 0.3)';
          strokeColor = '#ff9500';
          break;
        case 'straight':
          fillColor = 'rgba(0, 255, 255, 0.2)';
          strokeColor = '#00ffff';
          break;
        case 'pit_entry':
        case 'pit_exit':
          fillColor = 'rgba(255, 0, 0, 0.3)';
          strokeColor = '#ff0000';
          break;
        case 'speed_trap':
          fillColor = 'rgba(0, 255, 0, 0.3)';
          strokeColor = '#00ff00';
          break;
      }

      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.arc(fx, fy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Feature label
      ctx.fillStyle = '#aaa';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(feat.label, fx + 15, fy);

      // Difficulty score indicator
      if (feat.difficultyScore) {
        ctx.fillStyle = `rgba(255, ${255 - feat.difficultyScore * 25}, 0, 0.6)`;
        ctx.beginPath();
        ctx.arc(fx, fy, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw Live Cars
    analysisData.telemetry.forEach(car => {
      const cx = car.x * w;
      const cy = car.y * h;

      // Skip if car is off-screen
      if (cx < -20 || cx > w + 20 || cy < -20 || cy > h + 20) {
        return;
      }

      // Tire Health Halo (color gradient)
      const tireHealth = Math.max(0, Math.min(100, car.tire_health));
      const r = Math.floor(255 * (1 - tireHealth / 100));
      const g = Math.floor(255 * (tireHealth / 100));
      const b = 0;
      
      ctx.beginPath();
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();

      // Car body (white circle)
      ctx.beginPath();
      ctx.fillStyle = selectedCar === car.id ? '#ffff00' : '#ffffff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Car ID label
      ctx.fillStyle = selectedCar === car.id ? '#ffff00' : '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      
      // Add shadow for readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(car.id, cx + 10, cy - 10);
      ctx.shadowBlur = 0;

      // Speed indicator
      ctx.fillStyle = '#aaa';
      ctx.font = '9px monospace';
      ctx.fillText(`${Math.round(car.speed)}`, cx + 10, cy + 2);
    });

    // Draw start/finish line
    if (activeTrack.nodes.length > 0) {
      const startNode = activeTrack.nodes[0];
      const sx = startNode.x * w;
      const sy = startNode.y * h;
      
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(sx - 15, sy);
      ctx.lineTo(sx + 15, sy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [activeTrack, analysisData.telemetry, selectedCar]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      const now = performance.now();
      // Throttle to ~60 FPS
      if (now - lastRenderTime.current >= 16) {
        renderCanvas();
        lastRenderTime.current = now;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderCanvas]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        renderCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [renderCanvas]);

  // Format time
  const formatTime = (seconds?: number): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get alert severity color
  const getAlertColor = (severity?: string): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-400 border-red-900';
      case 'warning':
        return 'text-yellow-400 border-yellow-900';
      default:
        return 'text-blue-400 border-blue-900';
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-mono overflow-hidden">
      {/* Left: Visualizer */}
      <div className="flex-grow relative p-6 flex flex-col">
        {/* Header */}
        <div className="absolute top-6 left-6 z-10 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 border border-gray-800">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
            {activeTrack.name}
          </h1>
          <div className="flex gap-2 flex-wrap mb-2">
            {activeTrack.dominantCharacteristics.map(char => (
              <Badge
                key={char}
                variant="outline"
                className="text-xs border-gray-700 text-gray-300"
              >
                {char}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Length: {activeTrack.totalLength}m</span>
            <span>•</span>
            <span>Avg Speed: {activeTrack.averageSpeed || 'N/A'} KPH</span>
          </div>
        </div>

        {/* Connection Status */}
        <div className="absolute top-6 right-6 z-10">
          <div className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm rounded-lg p-2 border border-gray-800">
            {connectionState.status === 'connected' && (
              <>
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400">Connected</span>
              </>
            )}
            {connectionState.status === 'connecting' && (
              <>
                <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                <span className="text-xs text-yellow-400">Connecting...</span>
              </>
            )}
            {(connectionState.status === 'disconnected' || connectionState.status === 'error') && (
              <>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-400">
                  {connectionState.status === 'error' ? connectionState.error : 'Disconnected'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-grow relative rounded-xl border border-gray-800 shadow-2xl overflow-hidden bg-gray-950">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ imageRendering: 'auto' }}
          />
        </div>
      </div>

      {/* Right: Analytics Panel */}
      <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
        {/* Alerts Section */}
        {criticalAlerts.length > 0 && (
          <Card className="m-4 mb-0 border-red-900 bg-red-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                RACE CONTROL ALERTS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-32 overflow-y-auto">
              {criticalAlerts.map((alert, i) => (
                <div
                  key={i}
                  className="text-xs text-red-200 flex items-center gap-2"
                >
                  <span className="animate-pulse">●</span>
                  <span className="font-bold">{alert.car}:</span>
                  <span>{alert.msg}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card className="m-4 mb-0 flex-grow flex flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-800 z-10">
                <tr className="text-gray-500 border-b border-gray-700">
                  <th className="text-left pb-2">Pos</th>
                  <th className="text-left pb-2">Car</th>
                  <th className="text-right pb-2">Speed</th>
                  <th className="text-right pb-2">Tires</th>
                  <th className="text-right pb-2">Pace</th>
                </tr>
              </thead>
              <tbody>
                {sortedTelemetry.map((car, idx) => (
                  <tr
                    key={car.id}
                    className={`border-b border-gray-700/50 hover:bg-gray-700/50 cursor-pointer transition-colors ${
                      selectedCar === car.id ? 'bg-blue-900/30' : ''
                    }`}
                    onClick={() => setSelectedCar(selectedCar === car.id ? null : car.id)}
                  >
                    <td className="py-2 text-gray-400">#{idx + 1}</td>
                    <td className="py-2 font-bold text-blue-400">{car.id}</td>
                    <td className="py-2 text-right">
                      {car.speed.toFixed(0)}
                      <span className="text-xs text-gray-500 ml-1">kph</span>
                    </td>
                    <td className="py-2 text-right">
                      <div className="w-full bg-gray-700 h-1.5 mt-1 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            car.tire_health < 30
                              ? 'bg-red-500'
                              : car.tire_health < 60
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.max(0, Math.min(100, car.tire_health))}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{car.tire_health.toFixed(0)}%</span>
                    </td>
                    <td className="py-2 text-right">
                      {car.pace_delta !== undefined && car.pace_delta !== null ? (
                        <div className="flex items-center justify-end gap-1">
                          {car.pace_delta > 0 ? (
                            <TrendingDown className="w-3 h-3 text-red-400" />
                          ) : (
                            <TrendingUp className="w-3 h-3 text-green-400" />
                          )}
                          <span
                            className={
                              car.pace_delta > 0 ? 'text-red-400' : 'text-green-400'
                            }
                          >
                            {car.pace_delta > 0 ? '+' : ''}
                            {car.pace_delta.toFixed(2)}s
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">--</span>
                      )}
                    </td>
                  </tr>
                ))}
                {sortedTelemetry.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No telemetry data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Track Selector */}
        <Card className="m-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Track Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(TRACK_CV_DATA).map(tid => {
                const track = TRACK_CV_DATA[tid];
                return (
                  <Button
                    key={tid}
                    onClick={() => setActiveTrack(track)}
                    variant={activeTrack.id === tid ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                  >
                    {track.name.split(' ').map(w => w[0]).join('')}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Race Time */}
        {analysisData.race_time !== undefined && (
          <div className="px-4 pb-4 text-sm text-gray-400">
            Race Time: {formatTime(analysisData.race_time)}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTelemetryAnalysis;

