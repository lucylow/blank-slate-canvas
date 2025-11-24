// src/lib/mockDriverFingerprintData.ts
// Comprehensive mock data for driver fingerprinting page

import type {
  DriverFingerprint,
  CoachingAlert,
  CoachingPlan,
} from '@/api/driverFingerprint';

// Driver profiles with realistic characteristics
const DRIVER_PROFILES = {
  'driver-1': {
    name: 'Driver #13',
    style: 'aggressive',
    strengths: ['cornering_style', 'throttle_smoothness'],
    weaknesses: ['braking_consistency', 'tire_stress_index'],
    baseScore: 82,
  },
  'driver-2': {
    name: 'Driver #22',
    style: 'consistent',
    strengths: ['lap_consistency', 'braking_consistency'],
    weaknesses: ['cornering_style'],
    baseScore: 88,
  },
  'driver-3': {
    name: 'Driver #0',
    style: 'balanced',
    strengths: ['overall_score'],
    weaknesses: [],
    baseScore: 91,
  },
  'driver-4': {
    name: 'Driver #46',
    style: 'smooth',
    strengths: ['throttle_smoothness', 'tire_stress_index'],
    weaknesses: ['cornering_style', 'braking_consistency'],
    baseScore: 79,
  },
  'driver-5': {
    name: 'Driver #47',
    style: 'aggressive',
    strengths: ['cornering_style'],
    weaknesses: ['lap_consistency', 'tire_stress_index'],
    baseScore: 76,
  },
};

// Generate realistic fingerprint based on driver profile
export function generateMockFingerprint(driverId: string): DriverFingerprint {
  const profile = DRIVER_PROFILES[driverId as keyof typeof DRIVER_PROFILES];
  
  if (!profile) {
    // Fallback for unknown drivers
    return {
      id: `fp-${driverId}`,
      driver_id: driverId,
      features: {
        braking_consistency: Math.round(70 + Math.random() * 25),
        throttle_smoothness: Math.round(65 + Math.random() * 30),
        cornering_style: Math.round(75 + Math.random() * 20),
        lap_consistency: Math.round(80 + Math.random() * 15),
        tire_stress_index: Math.round(60 + Math.random() * 35),
        overall_score: Math.round(75 + Math.random() * 20),
      },
      created_at: new Date().toISOString(),
      session_type: 'race',
    };
  }

  // Generate features based on profile
  const baseFeatures = {
    braking_consistency: profile.strengths.includes('braking_consistency') 
      ? 85 + Math.random() * 10 
      : profile.weaknesses.includes('braking_consistency')
      ? 65 + Math.random() * 10
      : 75 + Math.random() * 10,
    
    throttle_smoothness: profile.strengths.includes('throttle_smoothness')
      ? 88 + Math.random() * 8
      : profile.weaknesses.includes('throttle_smoothness')
      ? 68 + Math.random() * 10
      : 78 + Math.random() * 10,
    
    cornering_style: profile.strengths.includes('cornering_style')
      ? 90 + Math.random() * 8
      : profile.weaknesses.includes('cornering_style')
      ? 70 + Math.random() * 10
      : 80 + Math.random() * 10,
    
    lap_consistency: profile.strengths.includes('lap_consistency')
      ? 92 + Math.random() * 6
      : profile.weaknesses.includes('lap_consistency')
      ? 72 + Math.random() * 10
      : 82 + Math.random() * 10,
    
    tire_stress_index: profile.strengths.includes('tire_stress_index')
      ? 85 + Math.random() * 10
      : profile.weaknesses.includes('tire_stress_index')
      ? 60 + Math.random() * 12
      : 75 + Math.random() * 10,
  };

  // Calculate overall score
  const overallScore = Math.round(
    (baseFeatures.braking_consistency +
      baseFeatures.throttle_smoothness +
      baseFeatures.cornering_style +
      baseFeatures.lap_consistency +
      baseFeatures.tire_stress_index) /
      5
  );

  return {
    id: `fp-${driverId}`,
    driver_id: driverId,
    features: {
      ...baseFeatures,
      overall_score: overallScore,
    },
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    session_type: 'race',
  };
}

// Generate realistic alerts based on driver profile
export function generateMockAlerts(driverId: string): CoachingAlert[] {
  const profile = DRIVER_PROFILES[driverId as keyof typeof DRIVER_PROFILES];
  const fingerprint = generateMockFingerprint(driverId);
  const alerts: CoachingAlert[] = [];

  if (!profile) {
    // Fallback alerts
    return [
      {
        id: `alert-${driverId}-1`,
        type: 'performance',
        category: 'Braking',
        message: 'Inconsistent braking points detected. Focus on hitting the same markers each lap.',
        priority: 'high',
        improvement_area: 'Braking Consistency',
        feature_value: fingerprint.features.braking_consistency,
        threshold: 80,
        confidence: 85,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  // Generate alerts based on weaknesses
  profile.weaknesses.forEach((weakness, idx) => {
    const featureValue = fingerprint.features[weakness as keyof typeof fingerprint.features] as number;
    const threshold = 80;
    
    if (featureValue < threshold) {
      const priority: CoachingAlert['priority'] = 
        featureValue < 70 ? 'critical' : 
        featureValue < 75 ? 'high' : 
        'medium';

      const categoryMap: Record<string, string> = {
        braking_consistency: 'Braking',
        throttle_smoothness: 'Throttle',
        cornering_style: 'Cornering',
        lap_consistency: 'Consistency',
        tire_stress_index: 'Tire Management',
      };

      const messageMap: Record<string, string> = {
        braking_consistency: 'Braking points vary significantly between laps. Practice hitting consistent markers.',
        throttle_smoothness: 'Throttle application shows abrupt changes. Work on smoother transitions.',
        cornering_style: 'Cornering technique needs refinement. Focus on optimal racing line and apex speed.',
        lap_consistency: 'Lap times show high variance. Maintain consistent pace throughout the race.',
        tire_stress_index: 'Tire stress levels are elevated. Adjust driving style to preserve tire life.',
      };

      alerts.push({
        id: `alert-${driverId}-${idx + 1}`,
        type: 'performance',
        category: categoryMap[weakness] || 'Performance',
        message: messageMap[weakness] || `Improve ${weakness.replace(/_/g, ' ')}`,
        priority,
        improvement_area: categoryMap[weakness] || weakness,
        feature_value: featureValue,
        threshold,
        confidence: 85 + Math.random() * 10,
        timestamp: new Date(Date.now() - (idx + 1) * 60 * 60 * 1000).toISOString(),
      });
    }
  });

  // Add a general performance alert if overall score is low
  if (fingerprint.features.overall_score < 80) {
    alerts.push({
      id: `alert-${driverId}-overall`,
      type: 'performance',
      category: 'Overall Performance',
      message: `Overall performance score of ${fingerprint.features.overall_score} is below target. Focus on priority areas identified in coaching plan.`,
      priority: fingerprint.features.overall_score < 75 ? 'high' : 'medium',
      improvement_area: 'Overall Performance',
      feature_value: fingerprint.features.overall_score,
      threshold: 85,
      confidence: 90,
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    });
  }

  // Sort by priority
  return alerts.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// Generate personalized coaching plan
export function generateMockCoachingPlan(driverId: string): CoachingPlan {
  const profile = DRIVER_PROFILES[driverId as keyof typeof DRIVER_PROFILES];
  const fingerprint = generateMockFingerprint(driverId);

  if (!profile) {
    // Fallback plan
    return {
      driver_id: driverId,
      generated_at: new Date().toISOString(),
      overall_score: fingerprint.features.overall_score,
      priority_areas: ['Braking Consistency', 'Throttle Smoothness', 'Lap Consistency'],
      weekly_focus: [
        'Practice trail braking on entry',
        'Work on throttle application smoothness',
        'Maintain consistent lap times within 0.5s window',
      ],
      specific_drills: [
        '10 laps focusing on late braking points',
        '5 laps with throttle control exercises',
        '15 laps maintaining consistent pace',
      ],
      progress_metrics: {
        target_braking_consistency: 85,
        target_throttle_smoothness: 80,
        target_lap_consistency: 90,
        target_overall_score: 85,
      },
    };
  }

  // Generate plan based on weaknesses
  const priorityAreas: string[] = [];
  const weeklyFocus: string[] = [];
  const specificDrills: string[] = [];

  if (profile.weaknesses.includes('braking_consistency')) {
    priorityAreas.push('Braking Consistency');
    weeklyFocus.push('Practice consistent braking points at each corner');
    specificDrills.push('10 laps focusing on hitting the same braking markers');
    specificDrills.push('5 laps with trail braking exercises');
  }

  if (profile.weaknesses.includes('throttle_smoothness')) {
    priorityAreas.push('Throttle Smoothness');
    weeklyFocus.push('Work on gradual throttle application out of corners');
    specificDrills.push('8 laps with progressive throttle control');
    specificDrills.push('Focus on smooth transitions from brake to throttle');
  }

  if (profile.weaknesses.includes('cornering_style')) {
    priorityAreas.push('Cornering Technique');
    weeklyFocus.push('Optimize racing line and apex speed');
    specificDrills.push('12 laps focusing on late apex technique');
    specificDrills.push('Practice maintaining speed through corners');
  }

  if (profile.weaknesses.includes('lap_consistency')) {
    priorityAreas.push('Lap Consistency');
    weeklyFocus.push('Maintain consistent pace throughout the race');
    specificDrills.push('15 laps maintaining lap times within 0.5s window');
    specificDrills.push('Focus on consistent sector times');
  }

  if (profile.weaknesses.includes('tire_stress_index')) {
    priorityAreas.push('Tire Management');
    weeklyFocus.push('Adjust driving style to reduce tire stress');
    specificDrills.push('Practice smooth inputs to preserve tire life');
    specificDrills.push('Work on minimizing tire slip angles');
  }

  // Add general areas if no specific weaknesses
  if (priorityAreas.length === 0) {
    priorityAreas.push('Maintain Current Performance', 'Fine-tune Technique', 'Race Strategy');
    weeklyFocus.push('Continue current training regimen', 'Focus on race craft', 'Practice pit stop procedures');
    specificDrills.push('Maintain consistent practice schedule', 'Review telemetry data', 'Simulate race scenarios');
  }

  // Set targets based on current performance
  const progressMetrics = {
    target_braking_consistency: Math.min(95, fingerprint.features.braking_consistency + 10),
    target_throttle_smoothness: Math.min(95, fingerprint.features.throttle_smoothness + 10),
    target_lap_consistency: Math.min(95, fingerprint.features.lap_consistency + 10),
    target_overall_score: Math.min(95, fingerprint.features.overall_score + 8),
  };

  return {
    driver_id: driverId,
    generated_at: new Date().toISOString(),
    overall_score: fingerprint.features.overall_score,
    priority_areas: priorityAreas.slice(0, 3),
    weekly_focus: weeklyFocus.slice(0, 3),
    specific_drills: specificDrills.slice(0, 3),
    progress_metrics: progressMetrics,
  };
}

// Generate comparison data between two drivers
export function generateMockComparison(
  driverId1: string,
  driverId2: string
): {
  driver1: DriverFingerprint['features'];
  driver2: DriverFingerprint['features'];
  differences: Array<{
    feature: string;
    driver1_value: number;
    driver2_value: number;
    difference: number;
  }>;
} {
  const fp1 = generateMockFingerprint(driverId1);
  const fp2 = generateMockFingerprint(driverId2);

  const differences = Object.keys(fp1.features)
    .filter(key => key !== 'overall_score')
    .map(key => ({
      feature: key,
      driver1_value: fp1.features[key] as number,
      driver2_value: fp2.features[key] as number,
      difference: (fp1.features[key] as number) - (fp2.features[key] as number),
    }));

  return {
    driver1: fp1.features,
    driver2: fp2.features,
    differences,
  };
}

// Export driver list for use in components
export const MOCK_DRIVERS = Object.entries(DRIVER_PROFILES).map(([id, profile]) => ({
  id,
  name: profile.name,
}));


