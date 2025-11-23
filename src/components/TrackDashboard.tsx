import React, { useState, useEffect, useCallback } from 'react';
import TrackMapSVG, { CarData } from './TrackMapSVG';
import CarDetailCard, { EvidenceFeature } from './CarDetailCard';
import { useTrackCenterline } from '../hooks/useTrackCenterline';
import { useInterpolatedCars, useInterpolationLoop } from '../hooks/useInterpolatedCars';
import { getTeamColor } from '../styles/theme';

interface TrackDashboardProps {
  trackId?: string;
  width?: number;
  height?: number;
  // WebSocket or API integration
  telemetrySource?: 'websocket' | 'demo' | 'api';
  wsUrl?: string;
}

/**
 * Main dashboard component that integrates track map, cars, and detail cards
 * This is the "pit wall" view with track on left, car details on right
 */
export default function TrackDashboard({
  trackId = 'cota',
  width = 1000,
  height = 600,
  telemetrySource = 'demo',
  wsUrl,
}: TrackDashboardProps) {
  const { centerline, loading: trackLoading } = useTrackCenterline(trackId);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [hoveredCar, setHoveredCar] = useState<CarData | null>(null);
  const [topFeatures, setTopFeatures] = useState<EvidenceFeature[]>([]);

  const {
    updateFromTelemetry,
    interpolate,
    getCarsData,
    clearCars,
  } = useInterpolatedCars(centerline);

  // Run interpolation loop
  useInterpolationLoop(interpolate, centerline.length > 0);

  // Get current car positions for rendering
  const cars = getCarsData(width, height, selectedCarId);

  // Handle car selection
  const handleCarClick = useCallback((car: CarData) => {
    setSelectedCarId(car.id === selectedCarId ? null : car.id);
    // TODO: Load top features/evidence for this car from API
    // For now, mock some features
    setTopFeatures([
      {
        name: 'High lateral G in S4',
        contribution: 0.34,
        description: 'Lateral acceleration exceeded 2.5g in sector 4',
      },
      {
        name: 'Brake energy spike',
        contribution: 0.24,
        description: 'Brake temperature increased 15°C in last 2 laps',
      },
      {
        name: 'Rising FL tire temp',
        contribution: 0.18,
        description: 'Front left tire temperature trending upward',
      },
    ]);
  }, [selectedCarId]);

  const handleCarHover = useCallback((car: CarData | null) => {
    setHoveredCar(car);
  }, []);

  // Load demo data or connect to WebSocket
  useEffect(() => {
    if (trackLoading || centerline.length === 0) return;

    if (telemetrySource === 'demo') {
      // Load demo data
      fetch('/data/demo_slices/track-demo-positions.json')
        .then((res) => res.json())
        .then((data) => {
          // Simulate real-time updates
          const samples = data.samples || [];
          let index = 0;
          const interval = setInterval(() => {
            if (index < samples.length) {
              updateFromTelemetry(samples[index]);
              index++;
            } else {
              clearInterval(interval);
            }
          }, 100); // Update every 100ms

          return () => clearInterval(interval);
        })
        .catch((err) => console.error('Failed to load demo data:', err));
    } else if (telemetrySource === 'websocket' && wsUrl) {
      // Connect to WebSocket
      const ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'telemetry_update' && Array.isArray(msg.data)) {
            msg.data.forEach((sample: any) => {
              updateFromTelemetry({
                chassis: sample.chassis || sample.id,
                lap: sample.lap,
                lapdist_m: sample.lapdist_m || sample.lap_distance,
                yaw: sample.yaw || sample.heading,
                speed_kmh: sample.speed_kmh || sample.speed,
                tire_wear: sample.tire_wear,
                tire_temp_fl: sample.tire_temp_fl,
                tire_temp_fr: sample.tire_temp_fr,
                tire_temp_rl: sample.tire_temp_rl,
                tire_temp_rr: sample.tire_temp_rr,
                predicted_laps_to_cliff: sample.predicted_laps_to_cliff,
              });
            });
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };

      return () => {
        ws.close();
        clearCars();
      };
    }
  }, [trackLoading, centerline, telemetrySource, wsUrl, updateFromTelemetry, clearCars]);

  const selectedCar = cars.find((c) => c.id === selectedCarId) || hoveredCar;

  if (trackLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading track data...</p>
      </div>
    );
  }

  if (centerline.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No track data available</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 h-full">
      {/* Left: Track Map */}
      <div className="flex-1 bg-background rounded-lg border p-4">
        <TrackMapSVG
          centerline={centerline}
          cars={cars}
          width={width}
          height={height}
          onCarClick={handleCarClick}
          onCarHover={handleCarHover}
          selectedCarId={selectedCarId}
          showLabels={true}
        />
      </div>

      {/* Right: Car Details & Actions */}
      <div className="w-80 space-y-4">
        <CarDetailCard
          car={selectedCar}
          topFeatures={topFeatures}
          onFeatureClick={(feature) => {
            // TODO: Scrub replay to feature timestamp
            console.log('Feature clicked:', feature);
          }}
          onPitNow={(carId) => {
            // TODO: Trigger pit stop action
            console.log('Pit now for:', carId);
          }}
          onSimulate={(carId) => {
            // TODO: Open simulation modal
            console.log('Simulate for:', carId);
          }}
        />

        {/* Car List (optional - shows all cars) */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">All Cars</h3>
          {cars.map((car) => (
            <div
              key={car.id}
              onClick={() => handleCarClick(car)}
              className={`p-2 rounded border cursor-pointer transition-colors ${
                car.id === selectedCarId
                  ? 'border-[#7B1E2D] bg-[#7B1E2D]/10'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{car.chassis}</span>
                <span className="text-xs text-muted-foreground">
                  {car.speed ? `${Math.round(car.speed)} km/h` : 'N/A'}
                </span>
              </div>
              {car.tire_wear !== undefined && (
                <div className="mt-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Tire Wear</span>
                    <span>{Math.round(car.tire_wear * 100)}%</span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${car.tire_wear * 100}%`,
                        backgroundColor: car.tire_wear > 0.6 ? '#FF3B30' : car.tire_wear > 0.3 ? '#FFB74D' : '#37D67A',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

