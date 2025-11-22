/**
 * GR Telemetry Analysis Utilities
 * 
 * Functions to analyze telemetry data based on car-specific characteristics
 * and provide insights for AI agents and dashboards.
 */

import { GR_TELEMETRY_DATA, GRTelemetryCharacteristics, getGRTelemetryData } from './grTelemetryData';

export interface TelemetryPoint {
  timestamp: number;
  speed?: number;
  throttle?: number; // 0-100
  brakeFront?: number; // bar
  brakeRear?: number; // bar
  accelLongitudinal?: number; // G
  accelLateral?: number; // G
  gear?: number;
  rpm?: number;
  steeringAngle?: number;
}

export interface SectorTelemetry {
  sector: number;
  averageSpeed: number;
  maxSpeed: number;
  averageLateralG: number;
  maxLateralG: number;
  averageLongitudinalG: number;
  maxLongitudinalG: number;
  throttlePercentage: number;
  brakePressure: number;
  minimumSpeed: number;
}

export interface TelemetryInsight {
  type: 'performance' | 'warning' | 'opportunity' | 'normal';
  category: string;
  message: string;
  severity?: 'low' | 'medium' | 'high';
  recommendation?: string;
  carSpecific?: boolean;
}

/**
 * Analyze if throttle application matches car characteristics
 */
export function analyzeThrottlePattern(
  data: TelemetryPoint[],
  carModel: string
): TelemetryInsight[] {
  const carData = getGRTelemetryData(carModel);
  if (!carData) return [];

  const insights: TelemetryInsight[] = [];
  const throttleValues = data
    .map(d => d.throttle)
    .filter((v): v is number => v !== undefined && !isNaN(v));
  
  if (throttleValues.length === 0) return insights;

  const avgThrottle = throttleValues.reduce((a, b) => a + b, 0) / throttleValues.length;
  const maxThrottle = Math.max(...throttleValues);
  
  // Calculate throttle variance (how smooth/abrupt)
  const variance = throttleValues.reduce((sum, val) => {
    const diff = val - avgThrottle;
    return sum + (diff * diff);
  }, 0) / throttleValues.length;
  const stdDev = Math.sqrt(variance);

  const expectedPattern = carData.telemetry.throttle.pattern;
  
  if (expectedPattern === 'aggressive' && stdDev < 15) {
    insights.push({
      type: 'opportunity',
      category: 'Throttle Application',
      message: `${carModel} can benefit from more aggressive throttle modulation`,
      severity: 'medium',
      recommendation: carData.telemetry.throttle.modulation,
      carSpecific: true
    });
  } else if (expectedPattern === 'smooth' && stdDev > 20) {
    insights.push({
      type: 'warning',
      category: 'Throttle Application',
      message: `Throttle application is too abrupt for ${carModel}`,
      severity: 'medium',
      recommendation: 'Smoother throttle inputs will improve consistency and tire management',
      carSpecific: true
    });
  }

  return insights;
}

/**
 * Analyze brake pressure patterns
 */
export function analyzeBrakePattern(
  data: TelemetryPoint[],
  carModel: string
): TelemetryInsight[] {
  const carData = getGRTelemetryData(carModel);
  if (!carData) return [];

  const insights: TelemetryInsight[] = [];
  const brakeValues = data
    .map(d => d.brakeFront || d.brakeRear || 0)
    .filter((v): v is number => v > 0);

  if (brakeValues.length === 0) return insights;

  const maxBrake = Math.max(...brakeValues);
  const avgBrake = brakeValues.reduce((a, b) => a + b, 0) / brakeValues.length;

  // Check for abrupt brake application (rapid pressure increase)
  let abruptCount = 0;
  for (let i = 1; i < data.length; i++) {
    const prevBrake = data[i - 1].brakeFront || data[i - 1].brakeRear || 0;
    const currBrake = data[i].brakeFront || data[i].brakeRear || 0;
    if (currBrake - prevBrake > 20 && currBrake > 30) {
      abruptCount++;
    }
  }

  const expectedPattern = carData.telemetry.brake.pattern;
  
  if (expectedPattern === 'smooth' && abruptCount > data.length * 0.1) {
    insights.push({
      type: 'warning',
      category: 'Brake Application',
      message: `${carModel} shows too many abrupt brake applications`,
      severity: 'medium',
      recommendation: carData.telemetry.brake.description,
      carSpecific: true
    });
  }

  if (carModel === 'GR Supra' && maxBrake < 40) {
    insights.push({
      type: 'opportunity',
      category: 'Brake Application',
      message: `${carModel} may need higher brake pressures for optimal performance`,
      severity: 'low',
      recommendation: 'Higher brake pressures can help manage high-speed braking zones',
      carSpecific: true
    });
  }

  return insights;
}

/**
 * Analyze G-force patterns
 */
export function analyzeGForcePattern(
  data: TelemetryPoint[],
  carModel: string
): TelemetryInsight[] {
  const carData = getGRTelemetryData(carModel);
  if (!carData) return [];

  const insights: TelemetryInsight[] = [];
  
  const lateralG = data
    .map(d => d.accelLateral)
    .filter((v): v is number => v !== undefined && !isNaN(v));
  
  const longitudinalG = data
    .map(d => d.accelLongitudinal)
    .filter((v): v is number => v !== undefined && !isNaN(v));

  if (lateralG.length === 0 || longitudinalG.length === 0) return insights;

  const maxLateralG = Math.max(...lateralG.map(Math.abs));
  const avgLateralG = lateralG.reduce((a, b) => a + Math.abs(b), 0) / lateralG.length;
  const maxLongitudinalG = Math.max(...longitudinalG.map(Math.abs));

  // Check for oversteer risk (high lateral G with low speed or high steering angle)
  if (carData.telemetry.cornering.oversteerRisk === 'high') {
    const highLateralEvents = data.filter(
      d => d.accelLateral && Math.abs(d.accelLateral) > 1.0 && 
      (d.speed || 0) < 60
    );
    
    if (highLateralEvents.length > data.length * 0.05) {
      insights.push({
        type: 'warning',
        category: 'Cornering',
        message: `${carModel} shows potential oversteer risk in slow corners`,
        severity: 'high',
        recommendation: 'Reduce throttle on corner exit, manage traction control carefully',
        carSpecific: true
      });
    }
  }

  // Compare longitudinal Gs to expected characteristics
  if (carModel === 'GR Supra' && maxLongitudinalG < 0.8) {
    insights.push({
      type: 'opportunity',
      category: 'Acceleration',
      message: `${carModel} longitudinal Gs are lower than expected`,
      severity: 'low',
      recommendation: 'More aggressive acceleration may be possible with proper traction management',
      carSpecific: true
    });
  }

  return insights;
}

/**
 * Analyze sector performance relative to car characteristics
 */
export function analyzeSectorPerformance(
  sectorData: SectorTelemetry,
  carModel: string,
  sectorType: 'highSpeed' | 'technical' | 'flowing'
): TelemetryInsight[] {
  const carData = getGRTelemetryData(carModel);
  if (!carData) return [];

  const insights: TelemetryInsight[] = [];
  
  const sectorStrength = carData.sectorPerformance[sectorType]?.strength;
  
  if (sectorStrength === 'dominant' || sectorStrength === 'strong') {
    // This is a strong sector for this car, check if performance matches
    insights.push({
      type: 'performance',
      category: 'Sector Performance',
      message: `${carModel} is optimized for ${sectorType} sectors`,
      severity: 'low',
      recommendation: carData.sectorPerformance[sectorType]?.description,
      carSpecific: true
    });
  } else if (sectorStrength === 'weaker') {
    insights.push({
      type: 'warning',
      category: 'Sector Performance',
      message: `${carModel} may struggle in ${sectorType} sectors`,
      severity: 'medium',
      recommendation: 'Focus on consistency and minimizing losses in this sector type',
      carSpecific: true
    });
  }

  // Check minimum speed in technical sectors (important for AWD cars)
  if (sectorType === 'technical' && carData.driveTrain === 'AWD') {
    if (sectorData.minimumSpeed < 30) {
      insights.push({
        type: 'opportunity',
        category: 'Technical Sector',
        message: `${carModel} can maintain higher minimum speeds in technical sections`,
        severity: 'low',
        recommendation: 'Use AWD traction to carry more speed through tight corners',
        carSpecific: true
      });
    }
  }

  return insights;
}

/**
 * Analyze tire wear predictions based on car characteristics
 */
export function analyzeTireWear(
  data: TelemetryPoint[],
  carModel: string,
  trackType: 'longHighSpeed' | 'tightTwisty'
): TelemetryInsight[] {
  const carData = getGRTelemetryData(carModel);
  if (!carData) return [];

  const insights: TelemetryInsight[] = [];
  
  const tireWearInfo = carData.tireWear.trackTypes[trackType];
  
  insights.push({
    type: 'performance',
    category: 'Tire Management',
    message: `${carModel} tire characteristics on ${trackType} tracks`,
    severity: 'low',
    recommendation: tireWearInfo,
    carSpecific: true
  });

  // Check for aggressive inputs that may accelerate tire wear
  const highLateralG = data.filter(
    d => d.accelLateral && Math.abs(d.accelLateral) > 1.2
  ).length;
  
  if (trackType === 'longHighSpeed' && highLateralG > data.length * 0.15) {
    insights.push({
      type: 'warning',
      category: 'Tire Wear',
      message: `High lateral Gs may accelerate tire wear on long, high-speed tracks`,
      severity: 'medium',
      recommendation: carData.tireWear.temperatureManagement,
      carSpecific: true
    });
  }

  return insights;
}

/**
 * Generate comprehensive telemetry analysis
 */
export function analyzeTelemetry(
  data: TelemetryPoint[],
  carModel: string,
  sectorType?: 'highSpeed' | 'technical' | 'flowing',
  trackType?: 'longHighSpeed' | 'tightTwisty'
): TelemetryInsight[] {
  const insights: TelemetryInsight[] = [];

  // Combine all analysis functions
  insights.push(...analyzeThrottlePattern(data, carModel));
  insights.push(...analyzeBrakePattern(data, carModel));
  insights.push(...analyzeGForcePattern(data, carModel));

  if (sectorType) {
    // For sector analysis, we need aggregated sector data
    // This is a simplified version
    const avgLateralG = data
      .map(d => d.accelLateral)
      .filter((v): v is number => v !== undefined)
      .reduce((a, b, _, arr) => a + Math.abs(b) / arr.length, 0);
    
    const sectorData: SectorTelemetry = {
      sector: 1,
      averageSpeed: data.map(d => d.speed || 0).reduce((a, b) => a + b, 0) / data.length,
      maxSpeed: Math.max(...data.map(d => d.speed || 0)),
      averageLateralG: avgLateralG,
      maxLateralG: Math.max(...data.map(d => Math.abs(d.accelLateral || 0))),
      averageLongitudinalG: data.map(d => Math.abs(d.accelLongitudinal || 0)).reduce((a, b) => a + b, 0) / data.length,
      maxLongitudinalG: Math.max(...data.map(d => Math.abs(d.accelLongitudinal || 0))),
      throttlePercentage: data.map(d => d.throttle || 0).reduce((a, b) => a + b, 0) / data.length,
      brakePressure: Math.max(...data.map(d => d.brakeFront || d.brakeRear || 0)),
      minimumSpeed: Math.min(...data.map(d => d.speed || 0))
    };

    insights.push(...analyzeSectorPerformance(sectorData, carModel, sectorType));
  }

  if (trackType) {
    insights.push(...analyzeTireWear(data, carModel, trackType));
  }

  return insights;
}

/**
 * Get expected telemetry ranges for a car model
 */
export function getExpectedTelemetryRanges(carModel: string): {
  lateralG: { min: number; max: number; typical: string };
  longitudinalG: { min: number; max: number; typical: string };
  brakePressure: { min: number; max: number; typical: string };
  throttleModulation: string;
} | null {
  const carData = getGRTelemetryData(carModel);
  if (!carData) return null;

  // Estimate ranges based on car characteristics
  const isHighPower = carData.powerHp > 300;
  const isAWD = carData.driveTrain === 'AWD';
  const isLightweight = carData.weight.category === 'light';

  return {
    lateralG: {
      min: isAWD ? 0.8 : 0.6,
      max: isAWD ? 1.4 : 1.6,
      typical: carData.telemetry.cornering.lateralGs.description
    },
    longitudinalG: {
      min: isHighPower ? 0.7 : 0.5,
      max: isHighPower ? 1.0 : 0.8,
      typical: carData.telemetry.acceleration.longitudinalGs.description
    },
    brakePressure: {
      min: isHighPower ? 30 : 20,
      max: isHighPower ? 80 : 60,
      typical: carData.telemetry.brake.description
    },
    throttleModulation: carData.telemetry.throttle.modulation
  };
}

