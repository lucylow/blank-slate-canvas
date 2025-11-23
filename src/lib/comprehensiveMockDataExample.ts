// src/lib/comprehensiveMockDataExample.ts
// Example usage of comprehensive mock data

import {
  generateComprehensiveTrackData,
  generateAllTracksData,
  getAllTracksSummary,
  getTrackData,
  type TrackId,
} from "./comprehensiveMockData";

// Example 1: Get data for a specific track, vehicle, and lap
export function exampleSingleTrackData() {
  const data = generateComprehensiveTrackData("cota", 13, 10, "driver-001");
  
  console.log("Weather:", data.weather.current.temperature, "°C");
  console.log("AI Analytics:", data.ai_analytics.summary);
  console.log("Elevation:", data.google_maps.elevation.stats.max, "m");
  console.log("Tire Wear:", data.hugging_face.predictions.tire_wear.front_left, "%");
  console.log("F1 Benchmark:", data.f1_benchmark.comparison.delta, "s slower");
  
  return data;
}

// Example 2: Get data for all tracks
export function exampleAllTracksData() {
  const allData = generateAllTracksData([7, 13, 21], [5, 10, 15, 20, 25]);
  
  // Access data for specific track
  const cotaData = allData.cota;
  const barberData = allData.barber;
  
  console.log(`COTA has ${cotaData.length} data points`);
  console.log(`Barber has ${barberData.length} data points`);
  
  return allData;
}

// Example 3: Get summary of all tracks
export function exampleTracksSummary() {
  const summary = getAllTracksSummary();
  
  for (const [trackId, info] of Object.entries(summary)) {
    console.log(`${info.name} (${trackId}): ${info.data_points} data points`);
  }
  
  return summary;
}

// Example 4: Access specific features
export function exampleSpecificFeatures(track: TrackId = "sonoma") {
  const data = getTrackData(track, 13, 10);
  
  // Weather data
  const weather = {
    temp: data.weather.current.temperature,
    humidity: data.weather.current.humidity,
    windSpeed: data.weather.current.wind_speed,
    trackTemp: data.weather.track_conditions.track_temp,
  };
  
  // AI Analytics
  const aiInsights = data.ai_analytics.insights;
  const aiRecommendations = data.ai_analytics.recommendations;
  const aiPredictions = data.ai_analytics.predictions;
  
  // Google Maps
  const elevation = data.google_maps.elevation.stats;
  const airQuality = data.google_maps.air_quality;
  
  // ML Predictions
  const tireWear = data.hugging_face.predictions.tire_wear;
  const lapTime = data.hugging_face.predictions.lap_time;
  
  // Alerts
  const twilioAlerts = data.twilio_alerts;
  const slackMessages = data.slack_messages;
  
  // F1 Comparison
  const f1Delta = data.f1_benchmark.comparison.delta;
  
  // Driver Fingerprint
  const driverScore = data.driver_fingerprint.fingerprint.features.overall_score;
  const coachingAlerts = data.driver_fingerprint.alerts;
  
  // Anomaly Detection
  const hasAnomaly = data.anomaly_detection.detection.is_anomaly;
  const anomalyScore = data.anomaly_detection.detection.anomaly_score;
  
  return {
    weather,
    aiInsights,
    aiRecommendations,
    aiPredictions,
    elevation,
    airQuality,
    tireWear,
    lapTime,
    twilioAlerts,
    slackMessages,
    f1Delta,
    driverScore,
    coachingAlerts,
    hasAnomaly,
    anomalyScore,
  };
}

// Example 5: Filter data by condition
export function exampleFilteredData() {
  const allData = generateAllTracksData();
  
  // Find tracks with high tire wear
  const highTireWear: Array<{ track: TrackId; vehicle: number; wear: number }> = [];
  
  for (const [trackId, trackData] of Object.entries(allData)) {
    for (const dataPoint of trackData) {
      const avgWear = (
        dataPoint.hugging_face.predictions.tire_wear.front_left +
        dataPoint.hugging_face.predictions.tire_wear.front_right +
        dataPoint.hugging_face.predictions.tire_wear.rear_left +
        dataPoint.hugging_face.predictions.tire_wear.rear_right
      ) / 4;
      
      if (avgWear > 70) {
        highTireWear.push({
          track: trackId as TrackId,
          vehicle: dataPoint.hugging_face.vehicle,
          wear: avgWear,
        });
      }
    }
  }
  
  return highTireWear;
}

// Example 6: Real-time simulation
export function exampleRealTimeSimulation(track: TrackId = "cota", vehicle: number = 13) {
  const simulationData: ReturnType<typeof generateComprehensiveTrackData>[] = [];
  
  // Simulate 30 laps
  for (let lap = 1; lap <= 30; lap++) {
    const data = generateComprehensiveTrackData(track, vehicle, lap, `driver-${vehicle}`);
    simulationData.push(data);
  }
  
  return simulationData;
}

