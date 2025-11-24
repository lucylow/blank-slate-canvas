// src/data/mock_cv_live_session.ts

export interface CVDetectedObject {
  id: string;
  class: 'car' | 'debris' | 'flag_digital' | 'flag_marshal' | 'smoke' | 'pit_crew';
  confidence: number;
  boundingBox: {
    x: number; // Normalized 0-1 (left)
    y: number; // Normalized 0-1 (top)
    w: number; // Width (normalized)
    h: number; // Height (normalized)
  };
  attributes: Record<string, string | number | boolean>;
}

export interface CVAnomaly {
  type: 'off_track_excursion' | 'lockup_smoke' | 'collision_proximity' | 'pit_unsafe_release';
  severity: 'low' | 'medium' | 'high';
  zone: 'run_off_area' | 'apex' | 'pit_box' | 'track_surface';
  confidence: number;
}

export interface CVFrameAnalysis {
  trackId: string;
  timestamp: string;
  cameraSource: string;
  environmentalVisuals: {
    weatherCondition: 'sunny' | 'overcast' | 'rain' | 'glare' | 'clear';
    trackSurfaceWetness: number; // 0-1
    visibilityScore: number; // 0-1 (1 is perfect visibility)
  };
  detectedObjects: CVDetectedObject[];
  anomalies: CVAnomaly[];
}

export const CV_LIVE_SESSION_DATA: CVFrameAnalysis[] = [
  {
    // Scenario A: COTA Start - Bunching & Smoke
    trackId: 'cota',
    timestamp: '2025-03-24T14:00:05.123Z',
    cameraSource: 'Heli_Cam_Start',
    environmentalVisuals: {
      weatherCondition: 'sunny',
      trackSurfaceWetness: 0.0,
      visibilityScore: 0.98
    },
    detectedObjects: [
      {
        id: 'obj_cota_01',
        class: 'car',
        confidence: 0.99,
        boundingBox: { x: 0.45, y: 0.5, w: 0.05, h: 0.08 },
        attributes: { number: '86', color: 'red', status: 'braking' }
      },
      {
        id: 'obj_cota_02',
        class: 'car',
        confidence: 0.98,
        boundingBox: { x: 0.48, y: 0.52, w: 0.05, h: 0.08 },
        attributes: { number: '12', color: 'blue', status: 'braking' }
      },
      {
        id: 'obj_cota_smoke',
        class: 'smoke',
        confidence: 0.92,
        boundingBox: { x: 0.46, y: 0.55, w: 0.1, h: 0.1 },
        attributes: { density: 'medium', source: 'tire_friction' }
      }
    ],
    anomalies: [
      {
        type: 'lockup_smoke',
        severity: 'medium',
        zone: 'apex',
        confidence: 0.89
      },
      {
        type: 'collision_proximity',
        severity: 'high',
        zone: 'apex',
        confidence: 0.75
      }
    ]
  },
  {
    // Scenario B: Sebring Sunset - Glare & Debris
    trackId: 'sebring_international_raceway',
    timestamp: '2025-03-16T19:45:30.000Z',
    cameraSource: 'CCTV_Turn_17',
    environmentalVisuals: {
      weatherCondition: 'glare',
      trackSurfaceWetness: 0.0,
      visibilityScore: 0.65 // Lower due to sunset glare
    },
    detectedObjects: [
      {
        id: 'obj_seb_deb',
        class: 'debris',
        confidence: 0.88,
        boundingBox: { x: 0.6, y: 0.7, w: 0.02, h: 0.02 },
        attributes: { type: 'carbon_fragment', stationary: true }
      },
      {
        id: 'obj_seb_car1',
        class: 'car',
        confidence: 0.95,
        boundingBox: { x: 0.5, y: 0.6, w: 0.1, h: 0.1 },
        attributes: { number: '44', status: 'avoiding' }
      }
    ],
    anomalies: [
      {
        type: 'collision_proximity', // Risk due to debris
        severity: 'medium',
        zone: 'track_surface',
        confidence: 0.82
      }
    ]
  },
  {
    // Scenario C: Road America - Speed Trap Blur
    trackId: 'road_america',
    timestamp: '2025-05-15T10:30:00.500Z',
    cameraSource: 'Static_Straight_Cam',
    environmentalVisuals: {
      weatherCondition: 'clear',
      trackSurfaceWetness: 0.0,
      visibilityScore: 1.0
    },
    detectedObjects: [
      {
        id: 'obj_ra_fast',
        class: 'car',
        confidence: 0.91, // Slightly lower due to blur
        boundingBox: { x: 0.2, y: 0.4, w: 0.15, h: 0.1 },
        attributes: { number: '09', motion_blur: true, estimated_speed: '>250kmh' }
      }
    ],
    anomalies: []
  },
  {
    // Scenario D: Barber - Rain & Off-Track
    trackId: 'barber_motorsports_park',
    timestamp: '2025-04-10T15:20:15.000Z',
    cameraSource: 'Drone_Turn_5',
    environmentalVisuals: {
      weatherCondition: 'rain',
      trackSurfaceWetness: 0.85,
      visibilityScore: 0.70
    },
    detectedObjects: [
      {
        id: 'obj_barber_marshal',
        class: 'flag_marshal',
        confidence: 0.96,
        boundingBox: { x: 0.8, y: 0.3, w: 0.05, h: 0.1 },
        attributes: { flag_color: 'yellow', status: 'waving' }
      },
      {
        id: 'obj_barber_off',
        class: 'car',
        confidence: 0.98,
        boundingBox: { x: 0.3, y: 0.3, w: 0.08, h: 0.08 },
        attributes: { number: '23', status: 'stationary', surface: 'grass' }
      }
    ],
    anomalies: [
      {
        type: 'off_track_excursion',
        severity: 'high',
        zone: 'run_off_area',
        confidence: 0.99
      }
    ]
  },
  {
    // Scenario E: Indianapolis - Pit Lane Unsafe Release
    trackId: 'indianapolis_motor_speedway',
    timestamp: '2025-05-28T12:45:00.000Z',
    cameraSource: 'Pit_Box_Cam_04',
    environmentalVisuals: {
      weatherCondition: 'overcast',
      trackSurfaceWetness: 0.05,
      visibilityScore: 0.90
    },
    detectedObjects: [
      {
        id: 'obj_indy_crew',
        class: 'pit_crew',
        confidence: 0.95,
        boundingBox: { x: 0.4, y: 0.4, w: 0.2, h: 0.2 },
        attributes: { activity: 'tire_change_complete' }
      },
      {
        id: 'obj_indy_car_merging',
        class: 'car',
        confidence: 0.97,
        boundingBox: { x: 0.5, y: 0.5, w: 0.12, h: 0.1 },
        attributes: { number: '05', status: 'launching' }
      },
      {
        id: 'obj_indy_car_lane',
        class: 'car',
        confidence: 0.96,
        boundingBox: { x: 0.55, y: 0.52, w: 0.12, h: 0.1 },
        attributes: { number: '10', status: 'passing' }
      }
    ],
    anomalies: [
      {
        type: 'pit_unsafe_release',
        severity: 'high',
        zone: 'pit_box',
        confidence: 0.94
      }
    ]
  }
];

