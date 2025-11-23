import { useRef, useCallback, useEffect } from 'react';
import { pointAtDistance, TrackPoint, getTrackLength } from '../utils/trackUtils';
import { CarData } from '../components/TrackMapSVG';

interface TelemetrySample {
  chassis: string;
  lap?: number;
  lapdist_m: number;
  yaw?: number;
  speed_kmh?: number;
  tire_wear?: number;
  tire_temp_fl?: number;
  tire_temp_fr?: number;
  tire_temp_rl?: number;
  tire_temp_rr?: number;
  predicted_laps_to_cliff?: number;
}

interface CarState {
  x: number;
  y: number;
  heading: number;
  timestamp: number;
  targetX: number;
  targetY: number;
  targetHeading: number;
  targetTimestamp: number;
  speed?: number;
  tire_wear?: number;
  tire_temp_fl?: number;
  tire_temp_fr?: number;
  tire_temp_rl?: number;
  tire_temp_rr?: number;
  predicted_laps_to_cliff?: number;
  chassis: string;
  lap?: number;
}

/**
 * Hook for managing car positions with interpolation for smooth animation
 * Updates car positions smoothly between telemetry samples
 */
export function useInterpolatedCars(centerline: TrackPoint[]) {
  const carsRef = useRef<Record<string, CarState>>({});
  const trackLength = centerline.length > 0 ? getTrackLength(centerline) : 0;

  // Update car state from telemetry sample
  const updateFromTelemetry = useCallback(
    (sample: TelemetrySample) => {
      if (!centerline || centerline.length === 0) return;

      const id = sample.chassis;
      const now = Date.now();
      const lap = sample.lap || 0;
      const totalDistance = lap * trackLength + sample.lapdist_m;
      const { x, y } = pointAtDistance(centerline, totalDistance);

      const current = carsRef.current[id];

      if (current) {
        // Set target for interpolation
        current.targetX = x;
        current.targetY = y;
        current.targetHeading = sample.yaw || current.heading || 0;
        current.targetTimestamp = now + 200; // Interpolate over 200ms
        current.speed = sample.speed_kmh;
        current.tire_wear = sample.tire_wear;
        current.tire_temp_fl = sample.tire_temp_fl;
        current.tire_temp_fr = sample.tire_temp_fr;
        current.tire_temp_rl = sample.tire_temp_rl;
        current.tire_temp_rr = sample.tire_temp_rr;
        current.predicted_laps_to_cliff = sample.predicted_laps_to_cliff;
        current.lap = lap;
      } else {
        // Initialize new car
        carsRef.current[id] = {
          x,
          y,
          heading: sample.yaw || 0,
          timestamp: now,
          targetX: x,
          targetY: y,
          targetHeading: sample.yaw || 0,
          targetTimestamp: now,
          speed: sample.speed_kmh,
          tire_wear: sample.tire_wear,
          tire_temp_fl: sample.tire_temp_fl,
          tire_temp_fr: sample.tire_temp_fr,
          tire_temp_rl: sample.tire_temp_rl,
          tire_temp_rr: sample.tire_temp_rr,
          predicted_laps_to_cliff: sample.predicted_laps_to_cliff,
          chassis: id,
          lap,
        };
      }
    },
    [centerline, trackLength]
  );

  // Interpolate all cars towards their targets
  const interpolate = useCallback(() => {
    const now = Date.now();
    Object.keys(carsRef.current).forEach((id) => {
      const car = carsRef.current[id];
      const timeDelta = car.targetTimestamp - car.timestamp;

      if (timeDelta > 0 && now < car.targetTimestamp) {
        const alpha = Math.min(1, (now - car.timestamp) / timeDelta);
        car.x = lerp(car.x, car.targetX, alpha);
        car.y = lerp(car.y, car.targetY, alpha);
        car.heading = lerpAngle(car.heading, car.targetHeading, alpha);
      } else {
        // Reached target or overshot
        car.x = car.targetX;
        car.y = car.targetY;
        car.heading = car.targetHeading;
        car.timestamp = now;
      }
    });
  }, []);

  // Convert car states to CarData format for rendering
  const getCarsData = useCallback(
    (width: number, height: number, selectedCarId?: string | null): CarData[] => {
      return Object.values(carsRef.current).map((car) => ({
        id: car.chassis,
        chassis: car.chassis,
        x: car.x * width,
        y: car.y * height,
        heading: car.heading,
        speed: car.speed,
        tire_wear: car.tire_wear,
        tire_temp_fl: car.tire_temp_fl,
        tire_temp_fr: car.tire_temp_fr,
        tire_temp_rl: car.tire_temp_rl,
        tire_temp_rr: car.tire_temp_rr,
        predicted_laps_to_cliff: car.predicted_laps_to_cliff,
        selected: car.chassis === selectedCarId,
        lap: car.lap,
      }));
    },
    []
  );

  // Clear all cars
  const clearCars = useCallback(() => {
    carsRef.current = {};
  }, []);

  return {
    carsRef,
    updateFromTelemetry,
    interpolate,
    getCarsData,
    clearCars,
  };
}

/**
 * Linear interpolation helper
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Angle interpolation (handles wrap-around)
 */
function lerpAngle(a: number, b: number, t: number): number {
  const diff = ((b - a + 180) % 360) - 180;
  return a + diff * t;
}

/**
 * Hook that runs interpolation on requestAnimationFrame
 */
export function useInterpolationLoop(
  interpolate: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    let rafId: number;
    function loop() {
      interpolate();
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [interpolate, enabled]);
}

