// src/lib/comprehensiveMockData.ts
// Comprehensive mock data for all 7 tracks with all API integrations
// Includes: Weather, AI Analytics, Google Maps, Hugging Face, Twilio, Slack, F1, Computer Vision, Driver Fingerprinting, Anomaly Detection

import type { AIAnalyticsResponse } from "@/api/aiAnalytics";
import type { DriverFingerprint, CoachingAlert, CoachingPlan } from "@/api/driverFingerprint";
import type { AnomalyDetectionResult, AnomalyStats } from "@/api/anomaly";
import type { SlackMessage } from "@/api/slack";

// Track metadata
export const TRACK_METADATA = {
  barber: {
    name: "Barber Motorsports Park",
    location: "Birmingham, Alabama",
    coordinates: { lat: 33.4822, lng: -86.5103 },
    length: 3830, // meters
    elevation: 200, // meters
    characteristics: ["twisty", "lateral_metrics", "technical"],
  },
  cota: {
    name: "Circuit of the Americas",
    location: "Austin, Texas",
    coordinates: { lat: 30.1327, lng: -97.6351 },
    length: 5513, // meters
    elevation: 250, // meters
    characteristics: ["long_straight", "top_speed", "elevation_changes"],
  },
  indianapolis: {
    name: "Indianapolis Motor Speedway",
    location: "Speedway, Indiana",
    coordinates: { lat: 39.7953, lng: -86.2347 },
    length: 3924, // meters
    elevation: 220, // meters
    characteristics: ["mixed", "oval_vs_infield", "high_speed"],
  },
  road_america: {
    name: "Road America",
    location: "Elkhart Lake, Wisconsin",
    coordinates: { lat: 43.8031, lng: -87.9908 },
    length: 6515, // meters
    elevation: 280, // meters
    characteristics: ["long_lap", "multi_sector", "elevation"],
  },
  sebring: {
    name: "Sebring International Raceway",
    location: "Sebring, Florida",
    coordinates: { lat: 27.4547, lng: -81.3544 },
    length: 6019, // meters
    elevation: 20, // meters
    characteristics: ["concrete_bumpy", "abrasion", "vibration"],
  },
  sonoma: {
    name: "Sonoma Raceway",
    location: "Sonoma, California",
    coordinates: { lat: 38.1616, lng: -122.4547 },
    length: 4054, // meters
    elevation: 150, // meters
    characteristics: ["elevation", "elevation_changes", "technical"],
  },
  vir: {
    name: "Virginia International Raceway",
    location: "Alton, Virginia",
    coordinates: { lat: 36.6369, lng: -79.1739 },
    length: 5263, // meters
    elevation: 180, // meters
    characteristics: ["roller_coaster", "layout_variants", "elevation"],
  },
} as const;

export type TrackId = keyof typeof TRACK_METADATA;

// ============================================================================
// WEATHER DATA (OpenWeatherMap Style)
// ============================================================================

export interface WeatherData {
  track: TrackId;
  timestamp: string;
  current: {
    temperature: number; // Celsius
    feels_like: number;
    humidity: number; // %
    pressure: number; // hPa
    visibility: number; // meters
    uv_index: number;
    wind_speed: number; // m/s
    wind_direction: number; // degrees
    wind_gust: number; // m/s
    clouds: number; // %
    weather: {
      main: string;
      description: string;
      icon: string;
    };
  };
  track_conditions: {
    track_temp: number; // Celsius
    track_temp_delta: number; // vs air temp
    surface_condition: "dry" | "damp" | "wet" | "flooded";
    grip_level: number; // 0-1
    visibility: number; // meters
  };
  forecast: Array<{
    timestamp: string;
    temperature: number;
    humidity: number;
    wind_speed: number;
    precipitation_probability: number; // %
    track_temp_predicted: number;
  }>;
  historical: {
    avg_temperature: number;
    avg_humidity: number;
    avg_wind_speed: number;
    record_high: number;
    record_low: number;
  };
}

export function generateWeatherData(track: TrackId): WeatherData {
  const metadata = TRACK_METADATA[track];
  const baseTemp = track === "sebring" ? 28 : track === "sonoma" ? 22 : 25;
  const baseHumidity = track === "sebring" ? 75 : track === "sonoma" ? 45 : 60;
  
  return {
    track,
    timestamp: new Date().toISOString(),
    current: {
      temperature: baseTemp + (Math.random() - 0.5) * 5,
      feels_like: baseTemp + (Math.random() - 0.5) * 6,
      humidity: baseHumidity + (Math.random() - 0.5) * 15,
      pressure: 1013 + (Math.random() - 0.5) * 20,
      visibility: 10000 + Math.random() * 5000,
      uv_index: Math.floor(Math.random() * 8) + 2,
      wind_speed: 3 + Math.random() * 8,
      wind_direction: Math.floor(Math.random() * 360),
      wind_gust: 5 + Math.random() * 10,
      clouds: Math.floor(Math.random() * 50),
      weather: {
        main: Math.random() > 0.8 ? "Clouds" : "Clear",
        description: Math.random() > 0.8 ? "partly cloudy" : "clear sky",
        icon: Math.random() > 0.8 ? "02d" : "01d",
      },
    },
    track_conditions: {
      track_temp: baseTemp + 10 + (Math.random() - 0.5) * 8,
      track_temp_delta: 8 + Math.random() * 5,
      surface_condition: "dry",
      grip_level: 0.85 + Math.random() * 0.1,
      visibility: 10000 + Math.random() * 5000,
    },
    forecast: Array.from({ length: 6 }, (_, i) => ({
      timestamp: new Date(Date.now() + (i + 1) * 60 * 60 * 1000).toISOString(),
      temperature: baseTemp + (Math.random() - 0.5) * 6,
      humidity: baseHumidity + (Math.random() - 0.5) * 20,
      wind_speed: 3 + Math.random() * 10,
      precipitation_probability: Math.random() > 0.7 ? Math.floor(Math.random() * 30) : 0,
      track_temp_predicted: baseTemp + 10 + (Math.random() - 0.5) * 8,
    })),
    historical: {
      avg_temperature: baseTemp,
      avg_humidity: baseHumidity,
      avg_wind_speed: 5,
      record_high: baseTemp + 15,
      record_low: baseTemp - 10,
    },
  };
}

// ============================================================================
// AI ANALYTICS (OpenAI/Gemini Explanations)
// ============================================================================

export function generateAIAnalytics(track: TrackId, vehicle: number, lap: number): AIAnalyticsResponse {
  const trackName = TRACK_METADATA[track].name;
  const tireWear = 45 + (lap * 2.5) + Math.random() * 10;
  const isCritical = tireWear > 70;
  
  const insights = [
    `Tire degradation on ${trackName} is ${tireWear > 65 ? "accelerating" : "within normal parameters"} for lap ${lap}`,
    `Track temperature of ${35 + Math.random() * 10}°C is ${track === "sebring" ? "increasing tire stress" : "optimal for grip"}`,
    `Driver consistency score of ${(85 + Math.random() * 10).toFixed(1)}% shows ${Math.random() > 0.5 ? "strong" : "improving"} performance`,
    `Sector analysis reveals ${Math.random() > 0.5 ? "sector 2" : "sector 3"} as the primary time loss area`,
    `Weather conditions are ${Math.random() > 0.7 ? "favorable" : "stable"} with minimal impact on strategy`,
    `Competitor modeling suggests ${Math.random() > 0.5 ? "undercut opportunity" : "maintain position"} strategy`,
    `Predicted finish position: P${Math.floor(Math.random() * 5) + 1} based on current pace`,
  ];

  const recommendations = [
    isCritical ? `Pit stop recommended on lap ${lap + 2} for tire change` : `Continue current strategy through lap ${lap + 5}`,
    `Adjust ${Math.random() > 0.5 ? "braking" : "throttle"} application in ${Math.random() > 0.5 ? "Turn 3" : "Turn 7"} to improve sector time`,
    `Monitor tire temperatures - ${tireWear > 65 ? "approaching critical threshold" : "within safe operating range"}`,
    `Consider ${Math.random() > 0.5 ? "aggressive" : "conservative"} strategy for next pit window`,
    `Track position advantage: ${Math.random() > 0.5 ? "maintain defensive line" : "look for overtaking opportunity"}`,
  ];

  return {
    insights,
    recommendations,
    predictions: {
      tireWear: `Tire wear predicted to reach ${Math.round(tireWear + 5)}% by lap ${lap + 2}. ${isCritical ? "Critical threshold approaching - pit stop required." : "Within acceptable range for current strategy."}`,
      lapTime: `Predicted lap time: ${(90 + Math.random() * 5).toFixed(3)}s. ${tireWear > 65 ? "Time loss of 0.3-0.5s per lap expected due to tire degradation." : "Consistent lap times expected."}`,
      pitWindow: `Optimal pit window: Laps ${lap + 1} to ${lap + 4}. ${isCritical ? "Early pit recommended to prevent significant time loss." : "Flexible timing based on track position."}`,
      performance: `Performance trend: ${tireWear > 65 ? "Declining" : "Stable"}. Gap to leader: ${(2.5 + Math.random() * 3).toFixed(3)}s. Predicted finish: P${Math.floor(Math.random() * 5) + 1}.`,
    },
    patterns: {
      identified: [
        `Consistent ${Math.random() > 0.5 ? "sector 1" : "sector 2"} performance across last 5 laps`,
        `Tire wear pattern matches historical data for ${trackName}`,
        `Driver showing ${Math.random() > 0.5 ? "improved" : "consistent"} consistency vs. previous races`,
      ],
      anomalies: tireWear > 70 ? [
        `Unusual tire degradation rate detected - ${Math.round(tireWear)}% wear exceeds expected threshold`,
        `Temperature spike in rear tires at lap ${lap}`,
      ] : [],
      trends: [
        `Lap times trending ${tireWear > 65 ? "slower" : "stable"} as race progresses`,
        `Tire stress increasing at ${(tireWear / 10).toFixed(1)}% per lap`,
        `Gap to leader ${Math.random() > 0.5 ? "closing" : "maintaining"} at current pace`,
      ],
    },
    summary: `Analysis for ${trackName} - Lap ${lap}: Vehicle #${vehicle} is ${isCritical ? "experiencing accelerated tire wear requiring strategic pit stop planning" : "performing within expected parameters"}. Current tire wear at ${Math.round(tireWear)}% with ${isCritical ? "critical" : "moderate"} degradation. Track conditions are optimal with ${(85 + Math.random() * 10).toFixed(1)}% grip level. Recommended strategy: ${isCritical ? "early pit stop" : "maintain current pace"} with focus on ${Math.random() > 0.5 ? "sector 2 optimization" : "tire preservation"}.`,
    confidence: 85 + Math.random() * 10,
    model: Math.random() > 0.5 ? "openai" : "gemini",
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// GOOGLE MAPS DATA (Elevation, Location, Air Quality)
// ============================================================================

export interface GoogleMapsData {
  track: TrackId;
  elevation: {
    points: Array<{
      lat: number;
      lng: number;
      elevation: number; // meters
    }>;
    profile: Array<{
      distance: number; // meters along track
      elevation: number;
      gradient: number; // %
    }>;
    stats: {
      min: number;
      max: number;
      avg: number;
      total_climb: number;
      total_descent: number;
    };
  };
  location: {
    formatted_address: string;
    place_id: string;
    coordinates: { lat: number; lng: number };
    timezone: string;
    utc_offset: number;
  };
  air_quality: {
    aqi: number;
    category: string;
    dominant_pollutant: string;
    health_recommendations: string[];
  };
  nearby_weather_stations: Array<{
    name: string;
    distance: number; // km
    coordinates: { lat: number; lng: number };
  }>;
}

export function generateGoogleMapsData(track: TrackId): GoogleMapsData {
  const metadata = TRACK_METADATA[track];
  const baseElevation = metadata.elevation;
  
  // Generate elevation profile along track
  const numPoints = 20;
  const elevationPoints = Array.from({ length: numPoints }, (_, i) => {
    const progress = i / (numPoints - 1);
    const lat = metadata.coordinates.lat + (Math.random() - 0.5) * 0.01;
    const lng = metadata.coordinates.lng + (Math.random() - 0.5) * 0.01;
    const elevation = baseElevation + Math.sin(progress * Math.PI * 4) * 30 + (Math.random() - 0.5) * 10;
    return { lat, lng, elevation };
  });

  const elevationProfile = Array.from({ length: numPoints }, (_, i) => {
    const distance = (i / (numPoints - 1)) * metadata.length;
    const elevation = baseElevation + Math.sin((i / numPoints) * Math.PI * 4) * 30;
    const prevElevation = i > 0 ? baseElevation + Math.sin(((i - 1) / numPoints) * Math.PI * 4) * 30 : elevation;
    const gradient = ((elevation - prevElevation) / (metadata.length / numPoints)) * 100;
    return { distance, elevation, gradient };
  });

  const elevations = elevationProfile.map(p => p.elevation);
  const totalClimb = elevationProfile
    .slice(1)
    .reduce((sum, p, i) => sum + Math.max(0, p.elevation - elevationProfile[i].elevation), 0);
  const totalDescent = elevationProfile
    .slice(1)
    .reduce((sum, p, i) => sum + Math.max(0, elevationProfile[i].elevation - p.elevation), 0);

  return {
    track,
    elevation: {
      points: elevationPoints,
      profile: elevationProfile,
      stats: {
        min: Math.min(...elevations),
        max: Math.max(...elevations),
        avg: elevations.reduce((a, b) => a + b, 0) / elevations.length,
        total_climb: totalClimb,
        total_descent: totalDescent,
      },
    },
    location: {
      formatted_address: `${metadata.name}, ${metadata.location}`,
      place_id: `ChIJ${Math.random().toString(36).substring(2, 15)}`,
      coordinates: metadata.coordinates,
      timezone: "America/New_York",
      utc_offset: -5,
    },
    air_quality: {
      aqi: Math.floor(30 + Math.random() * 40), // 30-70 (Good to Moderate)
      category: Math.random() > 0.7 ? "Moderate" : "Good",
      dominant_pollutant: Math.random() > 0.5 ? "PM2.5" : "O3",
      health_recommendations: [
        "Air quality is suitable for outdoor activities",
        "No special precautions needed for racing",
      ],
    },
    nearby_weather_stations: [
      {
        name: `${metadata.location} Weather Station`,
        distance: 2.5 + Math.random() * 5,
        coordinates: {
          lat: metadata.coordinates.lat + (Math.random() - 0.5) * 0.1,
          lng: metadata.coordinates.lng + (Math.random() - 0.5) * 0.1,
        },
      },
      {
        name: `Regional Airport Weather`,
        distance: 15 + Math.random() * 20,
        coordinates: {
          lat: metadata.coordinates.lat + (Math.random() - 0.5) * 0.2,
          lng: metadata.coordinates.lng + (Math.random() - 0.5) * 0.2,
        },
      },
    ],
  };
}

// ============================================================================
// HUGGING FACE ML PREDICTIONS
// ============================================================================

export interface HuggingFacePrediction {
  track: TrackId;
  vehicle: number;
  lap: number;
  model: string;
  predictions: {
    tire_wear: {
      front_left: number;
      front_right: number;
      rear_left: number;
      rear_right: number;
      confidence: number;
    };
    lap_time: {
      predicted: number; // seconds
      confidence_interval: [number, number];
      confidence: number;
    };
    anomaly_score: {
      score: number; // 0-1
      risk_level: "low" | "medium" | "high";
      contributing_factors: string[];
    };
  };
  feature_importance: Array<{
    feature: string;
    importance: number;
    contribution: number;
  }>;
  model_metadata: {
    version: string;
    training_date: string;
    accuracy: number;
  };
}

export function generateHuggingFacePrediction(track: TrackId, vehicle: number, lap: number): HuggingFacePrediction {
  const baseWear = 40 + (lap * 2.5);
  
  return {
    track,
    vehicle,
    lap,
    model: "time-series-forecaster-v2.1",
    predictions: {
      tire_wear: {
        front_left: Math.min(100, baseWear + Math.random() * 5),
        front_right: Math.min(100, baseWear + 1 + Math.random() * 5),
        rear_left: Math.min(100, baseWear - 2 + Math.random() * 5),
        rear_right: Math.min(100, baseWear - 1 + Math.random() * 5),
        confidence: 0.88 + Math.random() * 0.1,
      },
      lap_time: {
        predicted: 90 + Math.random() * 5,
        confidence_interval: [89.5, 91.2],
        confidence: 0.85 + Math.random() * 0.1,
      },
      anomaly_score: {
        score: Math.random() * 0.3,
        risk_level: Math.random() > 0.8 ? "medium" : "low",
        contributing_factors: [
          "Normal tire degradation pattern",
          "Consistent driver behavior",
          "Stable track conditions",
        ],
      },
    },
    feature_importance: [
      { feature: "tire_stress", importance: 0.35, contribution: 0.28 },
      { feature: "track_temperature", importance: 0.28, contribution: 0.22 },
      { feature: "driver_consistency", importance: 0.22, contribution: 0.18 },
      { feature: "sector_times", importance: 0.15, contribution: 0.12 },
    ],
    model_metadata: {
      version: "v2.1.3",
      training_date: "2024-01-15",
      accuracy: 0.89,
    },
  };
}

// ============================================================================
// TWILIO ALERTS
// ============================================================================

export interface TwilioAlert {
  id: string;
  timestamp: string;
  type: "sms" | "voice" | "whatsapp";
  recipient: string;
  message: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "sent" | "delivered" | "failed";
  track: TrackId;
  vehicle?: number;
  context?: Record<string, any>;
}

export function generateTwilioAlerts(track: TrackId, vehicle: number): TwilioAlert[] {
  const alerts: TwilioAlert[] = [];
  const trackName = TRACK_METADATA[track].name;
  
  // Critical tire wear alert
  if (Math.random() > 0.6) {
    alerts.push({
      id: `twilio-${Date.now()}-1`,
      timestamp: new Date().toISOString(),
      type: "sms",
      recipient: "+1234567890",
      message: `🚨 CRITICAL: Vehicle #${vehicle} at ${trackName} - Tire wear at 72%. Pit stop recommended immediately.`,
      priority: "critical",
      status: "sent",
      track,
      vehicle,
      context: { alert_type: "tire_wear", threshold: 70 },
    });
  }

  // Strategy alert
  if (Math.random() > 0.7) {
    alerts.push({
      id: `twilio-${Date.now()}-2`,
      timestamp: new Date().toISOString(),
      type: "sms",
      recipient: "+1234567890",
      message: `📊 Strategy Update: Vehicle #${vehicle} - Undercut opportunity detected. Consider early pit stop on lap 12.`,
      priority: "high",
      status: "sent",
      track,
      vehicle,
      context: { alert_type: "strategy", recommended_lap: 12 },
    });
  }

  // Anomaly alert
  if (Math.random() > 0.8) {
    alerts.push({
      id: `twilio-${Date.now()}-3`,
      timestamp: new Date().toISOString(),
      type: "voice",
      recipient: "+1234567890",
      message: `⚠️ Anomaly Detected: Vehicle #${vehicle} - Unusual brake temperature spike. Driver communication recommended.`,
      priority: "high",
      status: "sent",
      track,
      vehicle,
      context: { alert_type: "anomaly", sensor: "brake_temp" },
    });
  }

  return alerts;
}

// ============================================================================
// SLACK NOTIFICATIONS
// ============================================================================

export function generateSlackMessages(track: TrackId, vehicle: number): SlackMessage[] {
  const trackName = TRACK_METADATA[track].name;
  const messages: SlackMessage[] = [];

  // Race update
  messages.push({
    text: `🏁 Race Update: ${trackName}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `Race Update: ${trackName}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Vehicle:* #${vehicle}`,
          },
          {
            type: "mrkdwn",
            text: `*Lap:* ${Math.floor(Math.random() * 20) + 5}`,
          },
          {
            type: "mrkdwn",
            text: `*Position:* P${Math.floor(Math.random() * 10) + 1}`,
          },
          {
            type: "mrkdwn",
            text: `*Gap to Leader:* +${(Math.random() * 5 + 1).toFixed(3)}s`,
          },
        ],
      },
    ],
    username: "PitWall AI",
    icon_emoji: ":racing_car:",
  });

  // Tire wear alert
  if (Math.random() > 0.5) {
    messages.push({
      text: `⚠️ Tire Wear Alert: Vehicle #${vehicle}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Tire Wear Alert*\nVehicle #${vehicle} at ${trackName}\n\n*Current Wear:*\n• Front Left: ${(65 + Math.random() * 10).toFixed(1)}%\n• Front Right: ${(67 + Math.random() * 10).toFixed(1)}%\n• Rear Left: ${(63 + Math.random() * 10).toFixed(1)}%\n• Rear Right: ${(64 + Math.random() * 10).toFixed(1)}%\n\n*Recommendation:* Pit stop on lap ${Math.floor(Math.random() * 5) + 12}`,
          },
        },
      ],
      username: "PitWall AI",
      icon_emoji: ":warning:",
    });
  }

  return messages;
}

// ============================================================================
// F1 BENCHMARKING DATA
// ============================================================================

export interface F1BenchmarkData {
  track: TrackId;
  f1_track_name: string;
  comparison: {
    f1_lap_record: {
      time: number; // seconds
      driver: string;
      year: number;
      team: string;
    };
    gr_cup_best: {
      time: number;
      vehicle: number;
      driver: string;
      date: string;
    };
    delta: number; // seconds
    percentage_slower: number;
  };
  sector_comparison: Array<{
    sector: number;
    f1_best: number;
    gr_cup_best: number;
    delta: number;
  }>;
  insights: string[];
}

export function generateF1BenchmarkData(track: TrackId): F1BenchmarkData {
  const f1TrackNames: Record<TrackId, string> = {
    barber: "Barber Motorsports Park",
    cota: "Circuit of the Americas",
    indianapolis: "Indianapolis Motor Speedway",
    road_america: "Road America",
    sebring: "Sebring International Raceway",
    sonoma: "Sonoma Raceway",
    vir: "Virginia International Raceway",
  };

  const f1LapTimes: Record<TrackId, number> = {
    barber: 78.5,
    cota: 95.0,
    indianapolis: 82.3,
    road_america: 108.2,
    sebring: 102.5,
    sonoma: 88.7,
    vir: 92.4,
  };

  const grCupBest = f1LapTimes[track] * 1.15; // ~15% slower
  const delta = grCupBest - f1LapTimes[track];

  return {
    track,
    f1_track_name: f1TrackNames[track],
    comparison: {
      f1_lap_record: {
        time: f1LapTimes[track],
        driver: "Lewis Hamilton",
        year: 2022,
        team: "Mercedes",
      },
      gr_cup_best: {
        time: grCupBest,
        vehicle: 13,
        driver: "Alex Johnson",
        date: "2024-03-15",
      },
      delta: delta,
      percentage_slower: ((delta / f1LapTimes[track]) * 100),
    },
    sector_comparison: [
      {
        sector: 1,
        f1_best: f1LapTimes[track] * 0.35,
        gr_cup_best: grCupBest * 0.35,
        delta: delta * 0.35,
      },
      {
        sector: 2,
        f1_best: f1LapTimes[track] * 0.40,
        gr_cup_best: grCupBest * 0.40,
        delta: delta * 0.40,
      },
      {
        sector: 3,
        f1_best: f1LapTimes[track] * 0.25,
        gr_cup_best: grCupBest * 0.25,
        delta: delta * 0.25,
      },
    ],
    insights: [
      `GR Cup lap times are ${((delta / f1LapTimes[track]) * 100).toFixed(1)}% slower than F1 records`,
      `Sector 2 shows the largest time delta, indicating potential for improvement in technical sections`,
      `Top speed differences are most pronounced on long straights (Sector 1)`,
      `Cornering speeds are closer to F1 levels, showing strong driver skill`,
    ],
  };
}

// ============================================================================
// COMPUTER VISION DATA (Track Condition Analysis)
// ============================================================================

export interface ComputerVisionData {
  track: TrackId;
  timestamp: string;
  analysis: {
    track_condition: {
      surface: "dry" | "damp" | "wet";
      grip_level: number; // 0-1
      debris_detected: boolean;
      oil_spots: number;
      standing_water: boolean;
    };
    tire_condition: {
      wear_visible: boolean;
      wear_level: "low" | "medium" | "high";
      temperature_hotspots: Array<{
        location: string;
        severity: "low" | "medium" | "high";
      }>;
    };
    track_features: {
      corner_count: number;
      elevation_changes: number;
      surface_type: string[];
    };
  };
  confidence: number;
  model: string;
}

export function generateComputerVisionData(track: TrackId): ComputerVisionData {
  return {
    track,
    timestamp: new Date().toISOString(),
    analysis: {
      track_condition: {
        surface: "dry",
        grip_level: 0.85 + Math.random() * 0.1,
        debris_detected: Math.random() > 0.8,
        oil_spots: Math.floor(Math.random() * 3),
        standing_water: false,
      },
      tire_condition: {
        wear_visible: Math.random() > 0.5,
        wear_level: Math.random() > 0.6 ? "medium" : "low",
        temperature_hotspots: [
          {
            location: "Front Right Outer Edge",
            severity: Math.random() > 0.7 ? "medium" : "low",
          },
        ],
      },
      track_features: {
        corner_count: TRACK_METADATA[track].characteristics.includes("twisty") ? 17 : 12,
        elevation_changes: TRACK_METADATA[track].elevation > 200 ? 5 : 2,
        surface_type: track === "sebring" ? ["concrete", "asphalt"] : ["asphalt"],
      },
    },
    confidence: 0.88 + Math.random() * 0.1,
    model: "google-vision-api-v1",
  };
}

// ============================================================================
// DRIVER FINGERPRINTING
// ============================================================================

export function generateDriverFingerprint(track: TrackId, driverId: string, vehicle: number): {
  fingerprint: DriverFingerprint;
  alerts: CoachingAlert[];
  coachingPlan: CoachingPlan;
} {
  const brakingConsistency = 75 + Math.random() * 15;
  const throttleSmoothness = 80 + Math.random() * 15;
  const corneringStyle = 70 + Math.random() * 20;
  const lapConsistency = 85 + Math.random() * 10;
  const tireStressIndex = 60 + Math.random() * 20;
  const overallScore = (brakingConsistency + throttleSmoothness + corneringStyle + lapConsistency) / 4;

  const alerts: CoachingAlert[] = [];
  
  if (brakingConsistency < 80) {
    alerts.push({
      id: `alert-${Date.now()}-1`,
      type: "braking",
      category: "consistency",
      message: `Braking consistency below target (${brakingConsistency.toFixed(1)}% vs 85% target)`,
      priority: brakingConsistency < 75 ? "high" : "medium",
      improvement_area: "Braking consistency",
      feature_value: brakingConsistency,
      threshold: 85,
      confidence: 0.9,
      timestamp: new Date().toISOString(),
    });
  }

  if (corneringStyle < 75) {
    alerts.push({
      id: `alert-${Date.now()}-2`,
      type: "cornering",
      category: "style",
      message: `Cornering style needs improvement (${corneringStyle.toFixed(1)}% vs 80% target)`,
      priority: "medium",
      improvement_area: "Cornering technique",
      feature_value: corneringStyle,
      threshold: 80,
      confidence: 0.85,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    fingerprint: {
      id: `fingerprint-${driverId}-${track}`,
      driver_id: driverId,
      features: {
        braking_consistency: brakingConsistency,
        throttle_smoothness: throttleSmoothness,
        cornering_style: corneringStyle,
        lap_consistency: lapConsistency,
        tire_stress_index: tireStressIndex,
        overall_score: overallScore,
      },
      created_at: new Date().toISOString(),
      session_type: "race",
    },
    alerts,
    coachingPlan: {
      driver_id: driverId,
      generated_at: new Date().toISOString(),
      overall_score: overallScore,
      priority_areas: [
        brakingConsistency < 80 ? "Braking consistency" : "",
        corneringStyle < 75 ? "Cornering technique" : "",
        throttleSmoothness < 85 ? "Throttle application" : "",
      ].filter(Boolean),
      weekly_focus: [
        "Practice late braking into Turn 3",
        "Work on smooth throttle application on exit",
        "Focus on consistent apex speeds",
      ],
      specific_drills: [
        "10 laps focusing on braking markers",
        "Sector 2 optimization drills",
        "Tire preservation techniques",
      ],
      progress_metrics: {
        target_braking_consistency: 85,
        target_throttle_smoothness: 90,
        target_lap_consistency: 90,
        target_overall_score: 88,
      },
    },
  };
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

export function generateAnomalyDetection(track: TrackId, vehicle: number, lap: number): {
  detection: AnomalyDetectionResult;
  stats: AnomalyStats;
} {
  const isAnomaly = Math.random() > 0.85;
  const anomalyScore = isAnomaly ? 0.7 + Math.random() * 0.2 : Math.random() * 0.3;
  
  const alerts: AnomalyDetectionResult["alerts"] = [];
  
  if (isAnomaly) {
    const anomalyTypes = [
      {
        type: "critical" as const,
        sensor: "brake_temp",
        message: "Critical brake temperature spike detected - 450°C threshold exceeded",
        severity: "high" as const,
      },
      {
        type: "rate_of_change" as const,
        sensor: "tire_pressure",
        message: "Rapid tire pressure drop detected - 2.5 PSI in 30 seconds",
        severity: "medium" as const,
      },
      {
        type: "ml_detected" as const,
        sensor: "steering_angle",
        message: "ML model detected unusual steering pattern - potential issue",
        severity: "medium" as const,
      },
    ];
    
    const selected = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
    alerts.push({
      ...selected,
      value: Math.random() * 100,
      threshold: 80,
      score: anomalyScore,
      contributing_features: ["temperature", "pressure", "steering"],
    });
  }

  return {
    detection: {
      is_anomaly: isAnomaly,
      anomaly_score: anomalyScore,
      alerts,
      timestamp: new Date().toISOString(),
      vehicle_id: `GR86-${vehicle}`,
      vehicle_number: vehicle,
      lap,
    },
    stats: {
      total_points: 1000 + Math.floor(Math.random() * 500),
      anomaly_count: isAnomaly ? 1 : 0,
      anomaly_rate: isAnomaly ? 0.001 : 0,
      critical_alerts: alerts.filter(a => a.type === "critical").length,
      rate_of_change_alerts: alerts.filter(a => a.type === "rate_of_change").length,
      ml_detected_anomalies: alerts.filter(a => a.type === "ml_detected").length,
      avg_anomaly_score: anomalyScore,
      top_anomalous_sensors: alerts.length > 0 ? [
        { sensor: alerts[0].sensor, count: 1 },
      ] : [],
    },
  };
}

// ============================================================================
// COMPREHENSIVE TRACK DATA GENERATOR
// ============================================================================

export interface ComprehensiveTrackData {
  track: TrackId;
  weather: WeatherData;
  ai_analytics: AIAnalyticsResponse;
  google_maps: GoogleMapsData;
  hugging_face: HuggingFacePrediction;
  twilio_alerts: TwilioAlert[];
  slack_messages: SlackMessage[];
  f1_benchmark: F1BenchmarkData;
  computer_vision: ComputerVisionData;
  driver_fingerprint: {
    fingerprint: DriverFingerprint;
    alerts: CoachingAlert[];
    coachingPlan: CoachingPlan;
  };
  anomaly_detection: {
    detection: AnomalyDetectionResult;
    stats: AnomalyStats;
  };
  timestamp: string;
}

export function generateComprehensiveTrackData(
  track: TrackId,
  vehicle: number = 13,
  lap: number = 10,
  driverId: string = "driver-001"
): ComprehensiveTrackData {
  return {
    track,
    weather: generateWeatherData(track),
    ai_analytics: generateAIAnalytics(track, vehicle, lap),
    google_maps: generateGoogleMapsData(track),
    hugging_face: generateHuggingFacePrediction(track, vehicle, lap),
    twilio_alerts: generateTwilioAlerts(track, vehicle),
    slack_messages: generateSlackMessages(track, vehicle),
    f1_benchmark: generateF1BenchmarkData(track),
    computer_vision: generateComputerVisionData(track),
    driver_fingerprint: generateDriverFingerprint(track, driverId, vehicle),
    anomaly_detection: generateAnomalyDetection(track, vehicle, lap),
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// ALL TRACKS DATA GENERATOR
// ============================================================================

export function generateAllTracksData(
  vehicles: number[] = [7, 13, 21, 22, 46, 47, 78, 88],
  laps: number[] = [5, 10, 15, 20, 25]
): Record<TrackId, ComprehensiveTrackData[]> {
  const tracks: TrackId[] = ["barber", "cota", "indianapolis", "road_america", "sebring", "sonoma", "vir"];
  const result: Record<string, ComprehensiveTrackData[]> = {};

  for (const track of tracks) {
    result[track] = [];
    
    for (const vehicle of vehicles.slice(0, 3)) { // Limit to 3 vehicles per track for demo
      for (const lap of laps) {
        const driverId = `driver-${vehicle}`;
        result[track].push(
          generateComprehensiveTrackData(track, vehicle, lap, driverId)
        );
      }
    }
  }

  return result as Record<TrackId, ComprehensiveTrackData[]>;
}

// ============================================================================
// QUICK ACCESS FUNCTIONS
// ============================================================================

export function getTrackData(track: TrackId, vehicle?: number, lap?: number): ComprehensiveTrackData {
  return generateComprehensiveTrackData(
    track,
    vehicle || 13,
    lap || 10,
    `driver-${vehicle || 13}`
  );
}

export function getAllTracksSummary(): Record<TrackId, {
  name: string;
  location: string;
  data_points: number;
  latest_update: string;
}> {
  const allData = generateAllTracksData();
  const summary: Record<string, any> = {};

  for (const track of Object.keys(allData) as TrackId[]) {
    const metadata = TRACK_METADATA[track];
    summary[track] = {
      name: metadata.name,
      location: metadata.location,
      data_points: allData[track].length,
      latest_update: new Date().toISOString(),
    };
  }

  return summary as Record<TrackId, {
    name: string;
    location: string;
    data_points: number;
    latest_update: string;
  }>;
}

