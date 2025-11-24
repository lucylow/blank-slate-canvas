// Mock telemetry data generator for dashboard visualization
import type { GRCarId } from '@/constants/cars';
import { GR_CARS } from '@/constants/cars';

export interface TelemetryDataPoint {
  timestamp: number;
  carId: GRCarId;
  speed: number; // km/h
  throttle: number; // 0-100%
  brake: number; // 0-100%
  gear: number; // 1-6
  rpm: number; // RPM
}

// Generate realistic mock telemetry data for a car
function generateCarTelemetry(
  carId: GRCarId,
  startTime: number = Date.now(),
  duration: number = 60000, // 60 seconds
  interval: number = 100 // 100ms = 10Hz
): TelemetryDataPoint[] {
  const points: TelemetryDataPoint[] = [];
  const numPoints = Math.floor(duration / interval);
  
  // Car-specific characteristics
  const carConfig = GR_CARS.find(c => c.id === carId);
  const baseSpeed = carId === 'supra' ? 140 : carId === 'gr86' ? 130 : carId === 'yaris' ? 120 : 125;
  const maxRpm = carId === 'supra' ? 7000 : carId === 'gr86' ? 7500 : carId === 'yaris' ? 7200 : 6800;
  
  let currentSpeed = 60;
  let currentGear = 2;
  let currentRpm = 3000;
  let throttle = 0;
  let brake = 0;
  
  for (let i = 0; i < numPoints; i++) {
    const timestamp = startTime + (i * interval);
    const progress = i / numPoints;
    
    // Simulate lap progression with speed variations
    const lapPosition = (progress * 100) % 100;
    
    // Simulate realistic driving patterns
    if (lapPosition < 10) {
      // Starting/acceleration phase
      throttle = Math.min(85 + Math.random() * 10, 100);
      brake = 0;
      currentSpeed = Math.min(currentSpeed + (Math.random() * 3), baseSpeed + 20);
      currentRpm = Math.min(currentRpm + (Math.random() * 200), maxRpm);
      if (currentRpm > 6000 && currentGear < 6) {
        currentGear++;
        currentRpm = Math.max(3000, currentRpm - 2000);
      }
    } else if (lapPosition < 30) {
      // High speed section
      throttle = 70 + Math.random() * 20;
      brake = Math.random() * 5;
      currentSpeed = baseSpeed + (Math.random() * 15) - 5;
      currentRpm = 5000 + (Math.random() * 1000);
      currentGear = Math.max(4, Math.min(6, currentGear + (Math.random() > 0.95 ? 1 : 0)));
    } else if (lapPosition < 50) {
      // Braking zone
      throttle = Math.random() * 20;
      brake = 60 + Math.random() * 30;
      currentSpeed = Math.max(40, currentSpeed - (Math.random() * 5));
      currentRpm = Math.max(2000, currentRpm - (Math.random() * 500));
      if (currentRpm < 2500 && currentGear > 2) {
        currentGear--;
        currentRpm = Math.min(4000, currentRpm + 1500);
      }
    } else if (lapPosition < 70) {
      // Cornering section
      throttle = 40 + Math.random() * 30;
      brake = 20 + Math.random() * 20;
      currentSpeed = 50 + (Math.random() * 30);
      currentRpm = 3000 + (Math.random() * 2000);
    } else if (lapPosition < 85) {
      // Acceleration out of corner
      throttle = 80 + Math.random() * 15;
      brake = Math.random() * 10;
      currentSpeed = Math.min(currentSpeed + (Math.random() * 4), baseSpeed + 10);
      currentRpm = Math.min(currentRpm + (Math.random() * 300), maxRpm);
      if (currentRpm > 6500 && currentGear < 6) {
        currentGear++;
        currentRpm = Math.max(3500, currentRpm - 2000);
      }
    } else {
      // Final straight
      throttle = 90 + Math.random() * 8;
      brake = Math.random() * 5;
      currentSpeed = Math.min(currentSpeed + (Math.random() * 2), baseSpeed + 25);
      currentRpm = Math.min(currentRpm + (Math.random() * 200), maxRpm);
      if (currentRpm > 6800 && currentGear < 6) {
        currentGear++;
        currentRpm = Math.max(4000, currentRpm - 2000);
      }
    }
    
    // Add some noise for realism
    currentSpeed += (Math.random() - 0.5) * 2;
    currentRpm += (Math.random() - 0.5) * 100;
    throttle = Math.max(0, Math.min(100, throttle + (Math.random() - 0.5) * 5));
    brake = Math.max(0, Math.min(100, brake + (Math.random() - 0.5) * 5));
    
    points.push({
      timestamp,
      carId,
      speed: Math.round(currentSpeed * 10) / 10,
      throttle: Math.round(throttle * 10) / 10,
      brake: Math.round(brake * 10) / 10,
      gear: currentGear,
      rpm: Math.round(currentRpm),
    });
  }
  
  return points;
}

// Generate telemetry data for all cars
export function generateAllCarsTelemetry(
  startTime?: number,
  duration?: number,
  interval?: number
): TelemetryDataPoint[] {
  const allData: TelemetryDataPoint[] = [];
  const baseTime = startTime || Date.now();
  
  // Stagger start times slightly for each car (within 1 second)
  GR_CARS.forEach((car, index) => {
    const carStartTime = baseTime + (index * 100);
    const carData = generateCarTelemetry(car.id, carStartTime, duration, interval);
    allData.push(...carData);
  });
  
  return allData.sort((a, b) => a.timestamp - b.timestamp);
}

// Get latest telemetry for all cars at a specific timestamp
export function getLatestTelemetryForAllCars(
  data: TelemetryDataPoint[],
  timestamp?: number
): Record<GRCarId, TelemetryDataPoint | null> {
  const targetTime = timestamp || Date.now();
  const result: Record<GRCarId, TelemetryDataPoint | null> = {
    supra: null,
    yaris: null,
    gr86: null,
    corolla: null,
  };
  
  GR_CARS.forEach((car) => {
    const carData = data
      .filter((point) => point.carId === car.id && point.timestamp <= targetTime)
      .sort((a, b) => b.timestamp - a.timestamp);
    
    if (carData.length > 0) {
      result[car.id] = carData[0];
    }
  });
  
  return result;
}


