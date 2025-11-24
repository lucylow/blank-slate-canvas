// src/components/ComprehensiveMockDataDemo.tsx
// Example component demonstrating comprehensive mock data usage

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useComprehensiveMockData, type TrackId } from "@/hooks/useComprehensiveMockData";
import {
  Cloud,
  Brain,
  MapPin,
  TrendingUp,
  Phone,
  MessageSquare,
  Trophy,
  Eye,
  User,
  AlertTriangle,
  Gauge,
  Thermometer,
  Wind,
} from "lucide-react";

export function ComprehensiveMockDataDemo() {
  const [selectedTrack, setSelectedTrack] = useState<TrackId>("cota");
  const [selectedVehicle, setSelectedVehicle] = useState(13);
  const [selectedLap, setSelectedLap] = useState(10);

  const { currentTrackData, trackMetadata } = useComprehensiveMockData({
    track: selectedTrack,
    vehicle: selectedVehicle,
    lap: selectedLap,
  });

  const tracks: TrackId[] = ["barber", "cota", "indianapolis", "road_america", "sebring", "sonoma", "vir"];
  const vehicles = [7, 13, 21, 22, 46, 47, 78, 88];

  if (!currentTrackData) {
    return <div>Loading...</div>;
  }

  const trackInfo = trackMetadata[selectedTrack];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Comprehensive Mock Data Demo</h1>
        <div className="flex gap-2">
          <select
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value as TrackId)}
            className="px-3 py-2 border rounded"
          >
            {tracks.map((track) => (
              <option key={track} value={track}>
                {trackMetadata[track].name}
              </option>
            ))}
          </select>
          <select
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(Number(e.target.value))}
            className="px-3 py-2 border rounded"
          >
            {vehicles.map((v) => (
              <option key={v} value={v}>
                Vehicle #{v}
              </option>
            ))}
          </select>
          <select
            value={selectedLap}
            onChange={(e) => setSelectedLap(Number(e.target.value))}
            className="px-3 py-2 border rounded"
          >
            {[5, 10, 15, 20, 25, 30].map((lap) => (
              <option key={lap} value={lap}>
                Lap {lap}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weather Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Weather Data (OpenWeatherMap Style)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                <span className="text-sm text-muted-foreground">Air Temp</span>
              </div>
              <p className="text-2xl font-bold">{currentTrackData.weather.current.temperature.toFixed(1)}°C</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                <span className="text-sm text-muted-foreground">Track Temp</span>
              </div>
              <p className="text-2xl font-bold">{currentTrackData.weather.track_conditions.track_temp.toFixed(1)}°C</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4" />
                <span className="text-sm text-muted-foreground">Wind Speed</span>
              </div>
              <p className="text-2xl font-bold">{currentTrackData.weather.current.wind_speed.toFixed(1)} m/s</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Humidity</span>
              <p className="text-2xl font-bold">{currentTrackData.weather.current.humidity.toFixed(0)}%</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Grip Level</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${currentTrackData.weather.track_conditions.grip_level * 100}%` }}
              />
            </div>
            <p className="text-xs mt-1">{(currentTrackData.weather.track_conditions.grip_level * 100).toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>

      {/* AI Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Analytics (OpenAI/Gemini)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Key Insights</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {currentTrackData.ai_analytics.insights.slice(0, 3).map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Recommendations</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {currentTrackData.ai_analytics.recommendations.slice(0, 3).map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">Summary</p>
              <p className="text-sm mt-1">{currentTrackData.ai_analytics.summary}</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span>Confidence: {(currentTrackData.ai_analytics.confidence).toFixed(0)}%</span>
              <span>Model: {currentTrackData.ai_analytics.model}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Maps Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Google Maps Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Elevation (Max)</span>
              <p className="text-xl font-bold">{currentTrackData.google_maps.elevation.stats.max.toFixed(0)}m</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Elevation (Min)</span>
              <p className="text-xl font-bold">{currentTrackData.google_maps.elevation.stats.min.toFixed(0)}m</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Total Climb</span>
              <p className="text-xl font-bold">{currentTrackData.google_maps.elevation.stats.total_climb.toFixed(0)}m</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Air Quality</span>
              <p className="text-xl font-bold">{currentTrackData.google_maps.air_quality.aqi}</p>
              <p className="text-xs text-muted-foreground">{currentTrackData.google_maps.air_quality.category}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="text-sm">{currentTrackData.google_maps.location.formatted_address}</p>
          </div>
        </CardContent>
      </Card>

      {/* ML Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Hugging Face ML Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Front Left</span>
              <p className="text-xl font-bold">{currentTrackData.hugging_face.predictions.tire_wear.front_left.toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Front Right</span>
              <p className="text-xl font-bold">{currentTrackData.hugging_face.predictions.tire_wear.front_right.toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Rear Left</span>
              <p className="text-xl font-bold">{currentTrackData.hugging_face.predictions.tire_wear.rear_left.toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Rear Right</span>
              <p className="text-xl font-bold">{currentTrackData.hugging_face.predictions.tire_wear.rear_right.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Predicted Lap Time</span>
              <p className="text-xl font-bold">{currentTrackData.hugging_face.predictions.lap_time.predicted.toFixed(3)}s</p>
              <p className="text-xs text-muted-foreground">
                Confidence: {(currentTrackData.hugging_face.predictions.lap_time.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Anomaly Score</span>
              <p className="text-xl font-bold">{(currentTrackData.hugging_face.predictions.anomaly_score.score * 100).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                Risk: {currentTrackData.hugging_face.predictions.anomaly_score.risk_level}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Twilio Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Twilio Alerts ({currentTrackData.twilio_alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentTrackData.twilio_alerts.length > 0 ? (
                currentTrackData.twilio_alerts.map((alert) => (
                  <div key={alert.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold uppercase">{alert.priority}</span>
                      <span className="text-xs text-muted-foreground">{alert.type}</span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No alerts</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Slack Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Slack Messages ({currentTrackData.slack_messages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentTrackData.slack_messages.map((msg, i) => (
                <div key={i} className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-semibold mb-1">{msg.text || "Race Update"}</p>
                  {msg.blocks && msg.blocks.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {msg.blocks.length} block{msg.blocks.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* F1 Benchmarking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            F1 Benchmarking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">F1 Lap Record</span>
              <p className="text-xl font-bold">{currentTrackData.f1_benchmark.comparison.f1_lap_record.time.toFixed(3)}s</p>
              <p className="text-xs text-muted-foreground">
                {currentTrackData.f1_benchmark.comparison.f1_lap_record.driver} ({currentTrackData.f1_benchmark.comparison.f1_lap_record.year})
              </p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">GR Cup Best</span>
              <p className="text-xl font-bold">{currentTrackData.f1_benchmark.comparison.gr_cup_best.time.toFixed(3)}s</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Delta</span>
              <p className="text-xl font-bold text-orange-600">+{currentTrackData.f1_benchmark.comparison.delta.toFixed(3)}s</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">% Slower</span>
              <p className="text-xl font-bold">{currentTrackData.f1_benchmark.comparison.percentage_slower.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Fingerprint & Anomaly Detection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Driver Fingerprint */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Driver Fingerprint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Overall Score</span>
                <p className="text-2xl font-bold">
                  {currentTrackData.driver_fingerprint.fingerprint.features.overall_score.toFixed(1)}%
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Braking</span>
                  <p className="font-semibold">
                    {currentTrackData.driver_fingerprint.fingerprint.features.braking_consistency.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Throttle</span>
                  <p className="font-semibold">
                    {currentTrackData.driver_fingerprint.fingerprint.features.throttle_smoothness.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cornering</span>
                  <p className="font-semibold">
                    {currentTrackData.driver_fingerprint.fingerprint.features.cornering_style.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Consistency</span>
                  <p className="font-semibold">
                    {currentTrackData.driver_fingerprint.fingerprint.features.lap_consistency.toFixed(1)}%
                  </p>
                </div>
              </div>
              {currentTrackData.driver_fingerprint.alerts.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-semibold mb-1">Coaching Alerts</p>
                  {currentTrackData.driver_fingerprint.alerts.map((alert) => (
                    <div key={alert.id} className="text-xs text-muted-foreground">
                      {alert.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Anomaly Detection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Anomaly Detection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Anomaly Score</span>
                <p className="text-2xl font-bold">
                  {(currentTrackData.anomaly_detection.detection.anomaly_score * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentTrackData.anomaly_detection.detection.is_anomaly ? "Anomaly Detected" : "Normal"}
                </p>
              </div>
              {currentTrackData.anomaly_detection.detection.alerts.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-1">Alerts</p>
                  {currentTrackData.anomaly_detection.detection.alerts.map((alert, i) => (
                    <div key={i} className="p-2 bg-red-50 rounded text-sm mb-1">
                      <p className="font-semibold text-red-800">{alert.severity.toUpperCase()}</p>
                      <p className="text-red-700">{alert.message}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <p>Total Points: {currentTrackData.anomaly_detection.stats.total_points}</p>
                <p>Anomaly Rate: {(currentTrackData.anomaly_detection.stats.anomaly_rate * 100).toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Computer Vision */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Computer Vision Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Surface</span>
              <p className="text-lg font-semibold capitalize">{currentTrackData.computer_vision.analysis.track_condition.surface}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Grip Level</span>
              <p className="text-lg font-semibold">{(currentTrackData.computer_vision.analysis.track_condition.grip_level * 100).toFixed(0)}%</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Debris</span>
              <p className="text-lg font-semibold">{currentTrackData.computer_vision.analysis.track_condition.debris_detected ? "Yes" : "No"}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Confidence</span>
              <p className="text-lg font-semibold">{(currentTrackData.computer_vision.confidence * 100).toFixed(0)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


