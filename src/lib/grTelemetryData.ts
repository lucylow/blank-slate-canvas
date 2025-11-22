/**
 * GR Model Telemetry Characteristics
 * 
 * Comprehensive telemetry, lap times, and sensor data differences among
 * Toyota GR Supra, GR Yaris, GR86, and GR Corolla track performance models.
 * 
 * This data enables AI agents and dashboards to incorporate car-specific
 * performance tradeoffs for accurate real-time analysis and coaching outputs.
 */

export interface GRTelemetryCharacteristics {
  /** Model name */
  model: string;
  
  /** Power output in horsepower */
  powerHp: number;
  
  /** Drive train configuration */
  driveTrain: 'RWD' | 'AWD';
  
  /** Weight characteristics */
  weight: {
    category: 'light' | 'medium' | 'heavy';
    description: string;
  };
  
  /** Telemetry patterns */
  telemetry: {
    /** Throttle application characteristics */
    throttle: {
      pattern: 'aggressive' | 'moderate' | 'smooth';
      description: string;
      modulation: string;
    };
    
    /** Brake pressure characteristics */
    brake: {
      pattern: 'abrupt' | 'moderate' | 'smooth';
      description: string;
      typicalPressure: {
        front: string;
        rear: string;
      };
    };
    
    /** Acceleration characteristics */
    acceleration: {
      longitudinalGs: {
        typical: string;
        max: string;
        description: string;
      };
      topSpeed: {
        category: 'high' | 'medium' | 'lower';
        description: string;
      };
    };
    
    /** Cornering characteristics */
    cornering: {
      lateralGs: {
        typical: string;
        consistency: string;
        description: string;
      };
      traction: {
        outOfSlowCorners: string;
        wheelspin: string;
      };
      oversteerRisk: 'high' | 'moderate' | 'low';
    };
    
    /** Throttle and brake sequencing */
    sequencing: {
      throttleApplication: string;
      brakePressures: string;
      transitions: string;
    };
  };
  
  /** Sector performance */
  sectorPerformance: {
    /** High-speed straights and power sectors */
    highSpeed: {
      strength: 'dominant' | 'strong' | 'moderate' | 'weaker';
      description: string;
      tracks: string[];
    };
    
    /** Technical sectors with tight turns */
    technical: {
      strength: 'dominant' | 'strong' | 'moderate' | 'weaker';
      description: string;
      tracks: string[];
    };
    
    /** Flowing sections */
    flowing: {
      strength: 'dominant' | 'strong' | 'moderate' | 'weaker';
      description: string;
    };
  };
  
  /** Tire wear patterns */
  tireWear: {
    pattern: string;
    trackTypes: {
      longHighSpeed: string;
      tightTwisty: string;
    };
    temperatureManagement: string;
  };
  
  /** Brake balance patterns */
  brakeBalance: {
    pattern: string;
    stressPoints: string;
  };
  
  /** Lap time characteristics */
  lapTimeCharacteristics: {
    sectorGains: string[];
    consistencyFactors: string[];
    optimalConditions: string[];
  };
  
  /** Driver input requirements */
  driverInputs: {
    aggressiveness: 'high' | 'moderate' | 'conservative';
    precision: string;
    techniques: string[];
  };
}

export const GR_TELEMETRY_DATA: Record<string, GRTelemetryCharacteristics> = {
  'GR Supra': {
    model: 'GR Supra',
    powerHp: 382,
    driveTrain: 'RWD',
    weight: {
      category: 'medium',
      description: 'Moderate weight, well-balanced for power output'
    },
    telemetry: {
      throttle: {
        pattern: 'aggressive',
        description: 'Requires precise throttle modulation due to high power output',
        modulation: 'More aggressive modulation needed, especially on corner exit'
      },
      brake: {
        pattern: 'abrupt',
        description: 'Higher brake pressures with more abrupt application, earlier lift-off on tight corners',
        typicalPressure: {
          front: 'High pressure required due to high-speed braking',
          rear: 'Moderate, managed carefully due to RWD characteristics'
        }
      },
      acceleration: {
        longitudinalGs: {
          typical: 'Higher due to raw power (382 hp)',
          max: 'Strong longitudinal Gs in acceleration and braking',
          description: 'Stronger longitudinal Gs (acceleration/braking) due to raw power. More abrupt brake pressure spikes.'
        },
        topSpeed: {
          category: 'high',
          description: 'Higher top speeds on straights (e.g., Road America, COTA)'
        }
      },
      cornering: {
        lateralGs: {
          typical: 'Carefully managed',
          consistency: 'More variable due to oversteer risk',
          description: 'Lateral Gs are carefully managed due to oversteer risk'
        },
        traction: {
          outOfSlowCorners: 'Requires careful throttle management to prevent wheelspin',
          wheelspin: 'Higher risk of wheelspin on exit, especially in low gears'
        },
        oversteerRisk: 'high'
      },
      sequencing: {
        throttleApplication: 'Precise throttle modulation needed',
        brakePressures: 'Higher brake pressures, earlier lift-off on tight corners',
        transitions: 'More abrupt transitions due to power characteristics'
      }
    },
    sectorPerformance: {
      highSpeed: {
        strength: 'dominant',
        description: 'Excels in fastest straights and high-power sectors',
        tracks: ['Road America', 'Circuit of the Americas (COTA)', 'Sebring International']
      },
      technical: {
        strength: 'moderate',
        description: 'Requires careful management in tight technical sections',
        tracks: []
      },
      flowing: {
        strength: 'strong',
        description: 'Strong performance in flowing sections with good cornering balance'
      }
    },
    tireWear: {
      pattern: 'More tire stress on long, high-speed tracks due to high power and speeds',
      trackTypes: {
        longHighSpeed: 'Higher tire degradation on extended high-speed sections',
        tightTwisty: 'Better tire management when speeds are moderated'
      },
      temperatureManagement: 'Tire temps can run high on long straights and high-speed corners'
    },
    brakeBalance: {
      pattern: 'More brake stress on long, high-speed tracks',
      stressPoints: 'High brake pressures needed for high-speed braking zones'
    },
    lapTimeCharacteristics: {
      sectorGains: [
        'Dominance in high-speed sectors',
        'Strong performance in flowing sections',
        'Best lap times when power can be fully utilized'
      ],
      consistencyFactors: [
        'Precise throttle modulation critical',
        'Traction control management important',
        'Early lift-off on tight corners'
      ],
      optimalConditions: [
        'Long straights to utilize power',
        'High-speed flowing corners',
        'Tracks with wide exit areas'
      ]
    },
    driverInputs: {
      aggressiveness: 'moderate',
      precision: 'High precision required for throttle and brake inputs',
      techniques: [
        'Precise throttle modulation on corner exit',
        'Early lift-off before tight corners',
        'Traction control awareness',
        'Smooth steering inputs to manage oversteer'
      ]
    }
  },
  
  'GR Yaris': {
    model: 'GR Yaris',
    powerHp: 257, // Range: 257-300 hp
    driveTrain: 'AWD',
    weight: {
      category: 'light',
      description: 'Lightweight, nimble design optimized for agility'
    },
    telemetry: {
      throttle: {
        pattern: 'smooth',
        description: 'More consistent and smoother throttle application',
        modulation: 'Smoother transitions, less wheelspin concerns'
      },
      brake: {
        pattern: 'smooth',
        description: 'Smoother brake application with consistent pressure',
        typicalPressure: {
          front: 'Moderate, consistent application',
          rear: 'Well-balanced with AWD system'
        }
      },
      acceleration: {
        longitudinalGs: {
          typical: 'Moderate but consistent',
          max: 'Lower peak than Supra but more consistent',
          description: 'More consistent lateral Gs and smoother throttle/brake application'
        },
        topSpeed: {
          category: 'lower',
          description: 'Lower top speeds but higher minimum speeds in tight sectors'
        }
      },
      cornering: {
        lateralGs: {
          typical: 'More consistent',
          consistency: 'High consistency due to AWD and lightweight design',
          description: 'More consistent lateral Gs due to AWD traction'
        },
        traction: {
          outOfSlowCorners: 'Better traction out of slow corners, less wheelspin',
          wheelspin: 'Minimal wheelspin due to AWD system'
        },
        oversteerRisk: 'low'
      },
      sequencing: {
        throttleApplication: 'Longer, smoother throttle application possible',
        brakePressures: 'Moderate, consistent brake pressures',
        transitions: 'Smooth transitions throughout'
      }
    },
    sectorPerformance: {
      highSpeed: {
        strength: 'moderate',
        description: 'Limited top speed but maintains good momentum',
        tracks: []
      },
      technical: {
        strength: 'dominant',
        description: 'Gains in technical sectors leveraging AWD and lightweight design',
        tracks: ['Sonoma Raceway', 'Virginia International (VIR)', 'Barber Motorsports Park']
      },
      flowing: {
        strength: 'strong',
        description: 'Excellent in flowing sections due to balanced handling'
      }
    },
    tireWear: {
      pattern: 'Better tire temperature management on tight, twisty courses',
      trackTypes: {
        longHighSpeed: 'Moderate tire stress',
        tightTwisty: 'Excellent tire management due to lower speeds and AWD stability'
      },
      temperatureManagement: 'Manages tire temps well on technical tracks'
    },
    brakeBalance: {
      pattern: 'Moderate brake stress, good management',
      stressPoints: 'Consistent brake application without excessive heat buildup'
    },
    lapTimeCharacteristics: {
      sectorGains: [
        'Concentrates gains in technical sectors',
        'Higher minimum speeds in tight turn sectors',
        'Consistent lap times'
      ],
      consistencyFactors: [
        'AWD provides consistent traction',
        'Lightweight aids agility',
        'Smooth throttle and brake inputs'
      ],
      optimalConditions: [
        'Twisty tracks (Sonoma, VIR)',
        'Technical sectors with tight turns',
        'Courses requiring agility over raw power'
      ]
    },
    driverInputs: {
      aggressiveness: 'moderate',
      precision: 'Moderate precision, car is forgiving',
      techniques: [
        'Early throttle application on corner exit (AWD allows)',
        'Smooth brake application',
        'Carry speed through corners',
        'Maintain momentum'
      ]
    }
  },
  
  'GR86': {
    model: 'GR86',
    powerHp: 228,
    driveTrain: 'RWD',
    weight: {
      category: 'light',
      description: 'Naturally aspirated, very balanced lightweight design'
    },
    telemetry: {
      throttle: {
        pattern: 'smooth',
        description: 'Lower power output allows smooth throttle transitions',
        modulation: 'Very smooth, predictable throttle response'
      },
      brake: {
        pattern: 'smooth',
        description: 'Moderate brake pressures with fewer abrupt spikes',
        typicalPressure: {
          front: 'Moderate pressure, smooth application',
          rear: 'Well-balanced with front'
        }
      },
      acceleration: {
        longitudinalGs: {
          typical: 'Lower but very smooth',
          max: 'Moderate peak Gs',
          description: 'Lower top speeds but excellent cornering balance. Stable lateral Gs and smooth throttle transitions.'
        },
        topSpeed: {
          category: 'lower',
          description: 'Lower top speeds but maintains excellent momentum'
        }
      },
      cornering: {
        lateralGs: {
          typical: 'Very stable',
          consistency: 'High consistency due to balanced design',
          description: 'Excellent cornering balance, stable lateral Gs'
        },
        traction: {
          outOfSlowCorners: 'Good traction, manageable wheelspin',
          wheelspin: 'Manageable due to lower power output'
        },
        oversteerRisk: 'moderate'
      },
      sequencing: {
        throttleApplication: 'Smooth, predictable transitions',
        brakePressures: 'Moderate with fewer abrupt spikes',
        transitions: 'Very smooth transitions throughout'
      }
    },
    sectorPerformance: {
      highSpeed: {
        strength: 'weaker',
        description: 'Limited by lower power output',
        tracks: []
      },
      technical: {
        strength: 'strong',
        description: 'Good in technical sections due to balance',
        tracks: []
      },
      flowing: {
        strength: 'dominant',
        description: 'Shines in flowing sections with balanced cornering and lightweight agility'
      }
    },
    tireWear: {
      pattern: 'Manages tire temps better on tight, twisty courses',
      trackTypes: {
        longHighSpeed: 'Lower stress due to moderate speeds',
        tightTwisty: 'Excellent tire management due to balanced design'
      },
      temperatureManagement: 'Excellent tire temperature management'
    },
    brakeBalance: {
      pattern: 'Moderate brake stress, excellent balance',
      stressPoints: 'Fewer abrupt spikes, smooth brake application'
    },
    lapTimeCharacteristics: {
      sectorGains: [
        'Best performance in flowing sections',
        'Stable and consistent cornering',
        'Maintains momentum through corners'
      ],
      consistencyFactors: [
        'Less aggressive driver inputs aid consistency',
        'Balanced handling characteristics',
        'Predictable power delivery'
      ],
      optimalConditions: [
        'Flowing corner sections',
        'Tracks requiring balance over power',
        'Technical sections with smooth transitions'
      ]
    },
    driverInputs: {
      aggressiveness: 'conservative',
      precision: 'Moderate precision, very forgiving',
      techniques: [
        'Smooth throttle application',
        'Carry speed through corners',
        'Less aggressive inputs for consistency',
        'Focus on momentum and flow'
      ]
    }
  },
  
  'GR Corolla': {
    model: 'GR Corolla',
    powerHp: 300,
    driveTrain: 'AWD',
    weight: {
      category: 'medium',
      description: 'Slightly heavier than Yaris but more powerful'
    },
    telemetry: {
      throttle: {
        pattern: 'moderate',
        description: 'Balance between power and grip',
        modulation: 'Stable throttle application with good traction'
      },
      brake: {
        pattern: 'moderate',
        description: 'Higher brake pressures on heavy braking zones',
        typicalPressure: {
          front: 'Higher pressure in heavy braking zones',
          rear: 'Well-balanced with AWD system'
        }
      },
      acceleration: {
        longitudinalGs: {
          typical: 'Balanced between power and grip',
          max: 'Stable moderate-high Gs',
          description: 'Balance between power and grip with stable throttle and brake sequencing'
        },
        topSpeed: {
          category: 'medium',
          description: 'Good balance between power and stability'
        }
      },
      cornering: {
        lateralGs: {
          typical: 'Moderated but consistent',
          consistency: 'High consistency with AWD stability',
          description: 'Lateral Gs are moderated but consistent'
        },
        traction: {
          outOfSlowCorners: 'Good traction due to AWD',
          wheelspin: 'Minimal wheelspin with AWD system'
        },
        oversteerRisk: 'low'
      },
      sequencing: {
        throttleApplication: 'Longer throttle application with stable output',
        brakePressures: 'Higher brake pressures on heavy braking zones',
        transitions: 'Stable transitions with good balance'
      }
    },
    sectorPerformance: {
      highSpeed: {
        strength: 'strong',
        description: 'Good power output for straight-line performance',
        tracks: []
      },
      technical: {
        strength: 'strong',
        description: 'Gains in technical sectors leveraging AWD traction',
        tracks: []
      },
      flowing: {
        strength: 'strong',
        description: 'Good balance in flowing sections'
      }
    },
    tireWear: {
      pattern: 'More tire stress on long, high-speed tracks similar to Supra',
      trackTypes: {
        longHighSpeed: 'Higher tire degradation on extended high-speed sections',
        tightTwisty: 'Better management on technical tracks'
      },
      temperatureManagement: 'Tire temps manageable with proper brake balance'
    },
    brakeBalance: {
      pattern: 'More brake stress on long, high-speed tracks',
      stressPoints: 'Higher brake pressures needed in heavy braking zones'
    },
    lapTimeCharacteristics: {
      sectorGains: [
        'Often places ahead on mid-length tracks requiring stability and power',
        'Good performance in technical sectors',
        'Strong in heavy braking zones'
      ],
      consistencyFactors: [
        'AWD provides stable traction',
        'Longer throttle application possible',
        'Higher brake pressures managed well'
      ],
      optimalConditions: [
        'Mid-length tracks requiring both stability and power',
        'Tracks with heavy braking zones',
        'Technical sections with good exit traction'
      ]
    },
    driverInputs: {
      aggressiveness: 'moderate',
      precision: 'Moderate-high precision, good balance',
      techniques: [
        'Longer throttle application on corner exit',
        'Aggressive braking in heavy zones',
        'AWD traction utilization',
        'Stable cornering techniques'
      ]
    }
  }
};

/**
 * Track-specific performance expectations
 */
export interface TrackSectorPerformance {
  track: string;
  sectors: {
    highSpeed?: string; // Which car excels
    technical?: string;
    flowing?: string;
  };
  optimalCar?: string;
  notes: string;
}

export const TRACK_CAR_PERFORMANCE: Record<string, TrackSectorPerformance> = {
  'Road America': {
    track: 'Road America',
    sectors: {
      highSpeed: 'GR Supra',
      technical: 'GR Yaris / GR Corolla',
      flowing: 'GR86'
    },
    optimalCar: 'GR Supra',
    notes: 'Long straights favor Supra; technical sections favor AWD cars'
  },
  'Circuit of the Americas': {
    track: 'Circuit of the Americas',
    sectors: {
      highSpeed: 'GR Supra',
      technical: 'GR Yaris / GR Corolla',
      flowing: 'GR86'
    },
    optimalCar: 'GR Supra',
    notes: 'COTA features long straights and technical sections; Supra excels on straights'
  },
  'Sonoma Raceway': {
    track: 'Sonoma Raceway',
    sectors: {
      highSpeed: 'GR Supra',
      technical: 'GR Yaris',
      flowing: 'GR86'
    },
    optimalCar: 'GR Yaris',
    notes: 'Twisty, technical track favors lightweight AWD Yaris'
  },
  'Virginia International': {
    track: 'Virginia International',
    sectors: {
      highSpeed: 'GR Supra',
      technical: 'GR Yaris',
      flowing: 'GR86'
    },
    optimalCar: 'GR Yaris',
    notes: 'Technical track with tight turns benefits from AWD and lightweight design'
  },
  'Barber Motorsports Park': {
    track: 'Barber Motorsports Park',
    sectors: {
      highSpeed: 'GR Corolla / GR Supra',
      technical: 'GR Yaris',
      flowing: 'GR86'
    },
    optimalCar: 'GR Yaris',
    notes: 'Technical track with flowing sections; Yaris and GR86 excel'
  },
  'Sebring International': {
    track: 'Sebring International',
    sectors: {
      highSpeed: 'GR Supra',
      technical: 'GR Corolla / GR Yaris',
      flowing: 'GR86'
    },
    optimalCar: 'GR Supra',
    notes: 'Long straights and technical sections; Supra power advantageous'
  },
  'Indianapolis Motor Speedway': {
    track: 'Indianapolis Motor Speedway',
    sectors: {
      highSpeed: 'GR Supra',
      technical: 'GR Corolla',
      flowing: 'GR86'
    },
    optimalCar: 'GR Supra',
    notes: 'High-speed oval and road course sections favor powerful Supra'
  }
};

/**
 * Get telemetry characteristics for a specific GR model
 */
export function getGRTelemetryData(model: string): GRTelemetryCharacteristics | undefined {
  return GR_TELEMETRY_DATA[model];
}

/**
 * Get all GR models
 */
export function getAllGRModels(): string[] {
  return Object.keys(GR_TELEMETRY_DATA);
}

/**
 * Compare telemetry characteristics between models
 */
export function compareGRModels(models: string[]): Partial<GRTelemetryCharacteristics>[] {
  return models
    .map(model => GR_TELEMETRY_DATA[model])
    .filter(Boolean) as GRTelemetryCharacteristics[];
}

/**
 * Get optimal car for a track based on sector performance
 */
export function getOptimalCarForTrack(track: string): string | undefined {
  return TRACK_CAR_PERFORMANCE[track]?.optimalCar;
}

/**
 * Get track performance data
 */
export function getTrackPerformance(track: string): TrackSectorPerformance | undefined {
  return TRACK_CAR_PERFORMANCE[track];
}

