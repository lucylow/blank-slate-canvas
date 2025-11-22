/**
 * GR Telemetry Agent Integration
 * 
 * Utilities for AI agents to access and use GR model telemetry characteristics
 * in decision-making and recommendations.
 */

import { 
  getGRTelemetryData, 
  getOptimalCarForTrack, 
  getTrackPerformance,
  TRACK_CAR_PERFORMANCE 
} from './grTelemetryData';
import { 
  analyzeTelemetry,
  getExpectedTelemetryRanges,
  TelemetryPoint,
  TelemetryInsight 
} from './grTelemetryAnalysis';

/**
 * Get car-specific recommendations for a track
 */
export function getCarSpecificRecommendations(
  carModel: string,
  track: string
): {
  optimal: boolean;
  sectorAdvantages: string[];
  sectorChallenges: string[];
  recommendations: string[];
  optimalCar?: string;
} {
  const carData = getGRTelemetryData(carModel);
  const trackData = getTrackPerformance(track);
  const optimalCar = getOptimalCarForTrack(track);

  if (!carData) {
    return {
      optimal: false,
      sectorAdvantages: [],
      sectorChallenges: [],
      recommendations: []
    };
  }

  const sectorAdvantages: string[] = [];
  const sectorChallenges: string[] = [];
  const recommendations: string[] = [];

  // Check high-speed sectors
  if (carData.sectorPerformance.highSpeed.strength === 'dominant' || 
      carData.sectorPerformance.highSpeed.strength === 'strong') {
    sectorAdvantages.push('High-speed sectors');
  } else if (carData.sectorPerformance.highSpeed.strength === 'weaker') {
    sectorChallenges.push('High-speed sectors');
  }

  // Check technical sectors
  if (carData.sectorPerformance.technical.strength === 'dominant' || 
      carData.sectorPerformance.technical.strength === 'strong') {
    sectorAdvantages.push('Technical sectors');
  } else if (carData.sectorPerformance.technical.strength === 'weaker') {
    sectorChallenges.push('Technical sectors');
  }

  // Check flowing sectors
  if (carData.sectorPerformance.flowing.strength === 'dominant' || 
      carData.sectorPerformance.flowing.strength === 'strong') {
    sectorAdvantages.push('Flowing sectors');
  }

  // Generate recommendations based on track and car
  if (trackData) {
    if (carData.driveTrain === 'AWD') {
      recommendations.push('Leverage AWD traction to maintain higher minimum speeds in technical sections');
      recommendations.push('Early throttle application on corner exit is possible');
    } else if (carData.driveTrain === 'RWD') {
      recommendations.push('Manage throttle carefully on corner exit to prevent wheelspin');
      if (carData.powerHp > 300) {
        recommendations.push('Use precise throttle modulation due to high power output');
      }
    }

    if (carData.telemetry.cornering.oversteerRisk === 'high') {
      recommendations.push('Be aware of oversteer risk in slow corners - reduce throttle on exit');
    }

    // Track-specific recommendations
    const sectorPerformances = trackData.sectors;
    if (sectorPerformances.technical === carModel) {
      recommendations.push('This car excels in technical sectors on this track');
    }
    if (sectorPerformances.highSpeed === carModel) {
      recommendations.push('This car excels in high-speed sectors on this track');
    }
  }

  return {
    optimal: carModel === optimalCar,
    sectorAdvantages,
    sectorChallenges,
    recommendations,
    optimalCar
  };
}

/**
 * Get tire wear predictions based on car characteristics and track type
 */
export function getTireWearPrediction(
  carModel: string,
  trackType: 'longHighSpeed' | 'tightTwisty',
  currentTelemetry?: TelemetryPoint[]
): {
  predictedWear: 'low' | 'moderate' | 'high';
  factors: string[];
  recommendations: string[];
} {
  const carData = getGRTelemetryData(carModel);
  if (!carData) {
    return {
      predictedWear: 'moderate',
      factors: [],
      recommendations: []
    };
  }

  const factors: string[] = [];
  const recommendations: string[] = [];

  // Base prediction on car characteristics
  const tireWearInfo = carData.tireWear.trackTypes[trackType];
  factors.push(tireWearInfo);

  // Analyze current telemetry if available
  if (currentTelemetry && currentTelemetry.length > 0) {
    const insights = analyzeTelemetry(currentTelemetry, carModel, undefined, trackType);
    
    // Filter tire wear insights
    const tireInsights = insights.filter(i => 
      i.category === 'Tire Management' || i.category === 'Tire Wear'
    );
    
    tireInsights.forEach(insight => {
      if (insight.severity === 'high') {
        factors.push(insight.message);
        if (insight.recommendation) {
          recommendations.push(insight.recommendation);
        }
      }
    });

    // Calculate wear prediction from telemetry
    const highLateralG = currentTelemetry.filter(
      d => d.accelLateral && Math.abs(d.accelLateral) > 1.2
    ).length;
    
    const highLongitudinalG = currentTelemetry.filter(
      d => d.accelLongitudinal && Math.abs(d.accelLongitudinal) > 0.8
    ).length;

    if (trackType === 'longHighSpeed') {
      if (highLateralG > currentTelemetry.length * 0.2) {
        factors.push('High lateral Gs detected - may accelerate tire wear');
        recommendations.push('Reduce aggressive cornering to preserve tires');
      }
      if (highLongitudinalG > currentTelemetry.length * 0.15) {
        factors.push('High longitudinal Gs detected');
      }
    }
  }

  // Determine predicted wear level
  let predictedWear: 'low' | 'moderate' | 'high' = 'moderate';
  
  if (trackType === 'longHighSpeed') {
    if (carData.model === 'GR Supra' || carData.model === 'GR Corolla') {
      predictedWear = 'high';
      factors.push('High power output increases tire stress on long tracks');
    } else {
      predictedWear = 'moderate';
    }
  } else {
    // Tight twisty tracks
    if (carData.model === 'GR Yaris' || carData.model === 'GR86') {
      predictedWear = 'low';
      factors.push('Lightweight design and better tire temperature management');
    } else {
      predictedWear = 'moderate';
    }
  }

  // Add car-specific recommendations
  recommendations.push(carData.tireWear.temperatureManagement);

  return {
    predictedWear,
    factors,
    recommendations
  };
}

/**
 * Get brake strategy recommendations
 */
export function getBrakeStrategy(
  carModel: string,
  trackType: 'longHighSpeed' | 'tightTwisty'
): {
  strategy: string;
  pressureExpectations: string;
  stressPoints: string[];
} {
  const carData = getGRTelemetryData(carModel);
  if (!carData) {
    return {
      strategy: 'Standard brake management',
      pressureExpectations: 'Moderate brake pressures',
      stressPoints: []
    };
  }

  const stressPoints: string[] = [];

  if (trackType === 'longHighSpeed') {
    if (carData.model === 'GR Supra' || carData.model === 'GR Corolla') {
      stressPoints.push('High-speed braking zones require higher brake pressures');
      stressPoints.push('Monitor brake temperature on extended high-speed sections');
    }
  }

  return {
    strategy: carData.telemetry.brake.description,
    pressureExpectations: `${carData.telemetry.sequencing.brakePressures}`,
    stressPoints: [...stressPoints, carData.brakeBalance.stressPoints]
  };
}

/**
 * Get throttle and brake sequencing recommendations
 */
export function getSequencingRecommendations(carModel: string): {
  throttle: string;
  brake: string;
  transitions: string;
  techniques: string[];
} {
  const carData = getGRTelemetryData(carModel);
  if (!carData) {
    return {
      throttle: 'Standard throttle application',
      brake: 'Standard brake application',
      transitions: 'Smooth transitions',
      techniques: []
    };
  }

  return {
    throttle: carData.telemetry.sequencing.throttleApplication,
    brake: carData.telemetry.sequencing.brakePressures,
    transitions: carData.telemetry.sequencing.transitions,
    techniques: carData.driverInputs.techniques
  };
}

/**
 * Compare telemetry data against expected ranges for a car
 */
export function validateTelemetryRanges(
  data: TelemetryPoint[],
  carModel: string
): TelemetryInsight[] {
  const ranges = getExpectedTelemetryRanges(carModel);
  if (!ranges) return [];

  const insights: TelemetryInsight[] = [];

  // Check lateral G ranges
  const lateralG = data
    .map(d => d.accelLateral)
    .filter((v): v is number => v !== undefined);

  if (lateralG.length > 0) {
    const maxLateralG = Math.max(...lateralG.map(Math.abs));
    if (maxLateralG > ranges.lateralG.max) {
      insights.push({
        type: 'warning',
        category: 'Cornering',
        message: `Lateral Gs (${maxLateralG.toFixed(2)}G) exceed expected maximum (${ranges.lateralG.max}G)`,
        severity: 'medium',
        recommendation: 'Reduce cornering speeds or check tire conditions',
        carSpecific: true
      });
    }
  }

  // Check longitudinal G ranges
  const longitudinalG = data
    .map(d => d.accelLongitudinal)
    .filter((v): v is number => v !== undefined);

  if (longitudinalG.length > 0) {
    const maxLongitudinalG = Math.max(...longitudinalG.map(Math.abs));
    if (maxLongitudinalG < ranges.longitudinalG.min * 0.8) {
      insights.push({
        type: 'opportunity',
        category: 'Performance',
        message: `Longitudinal Gs are below expected minimum - may indicate conservative driving`,
        severity: 'low',
        recommendation: ranges.throttleModulation,
        carSpecific: true
      });
    }
  }

  return insights;
}

/**
 * Get comprehensive AI agent insights for a car on a track
 */
export function getAIAgentInsights(
  carModel: string,
  track: string,
  telemetry?: TelemetryPoint[],
  sectorType?: 'highSpeed' | 'technical' | 'flowing'
): {
  carRecommendations: ReturnType<typeof getCarSpecificRecommendations>;
  tireWear: ReturnType<typeof getTireWearPrediction>;
  brakeStrategy: ReturnType<typeof getBrakeStrategy>;
  sequencing: ReturnType<typeof getSequencingRecommendations>;
  telemetryAnalysis: TelemetryInsight[];
  validation: TelemetryInsight[];
} {
  const trackType = track.includes('Road America') || track.includes('COTA') || 
                    track.includes('Sebring') || track.includes('Indianapolis')
    ? 'longHighSpeed' as const
    : 'tightTwisty' as const;

  const carRecommendations = getCarSpecificRecommendations(carModel, track);
  const tireWear = getTireWearPrediction(carModel, trackType, telemetry);
  const brakeStrategy = getBrakeStrategy(carModel, trackType);
  const sequencing = getSequencingRecommendations(carModel);

  let telemetryAnalysis: TelemetryInsight[] = [];
  let validation: TelemetryInsight[] = [];

  if (telemetry && telemetry.length > 0) {
    telemetryAnalysis = analyzeTelemetry(telemetry, carModel, sectorType, trackType);
    validation = validateTelemetryRanges(telemetry, carModel);
  }

  return {
    carRecommendations,
    tireWear,
    brakeStrategy,
    sequencing,
    telemetryAnalysis,
    validation
  };
}

